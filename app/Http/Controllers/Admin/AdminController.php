<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class AdminController extends Controller
{
    /**
     * Mostrar lista de usuarios con paginación
     * Ruta: GET /admin/users
     */
    public function index(Request $request)
    {
        // Query base para usuarios con sus roles
        $query = User::with('roles');

        // Búsqueda por nombre o email si existe el parámetro 'search'
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filtro por rol si existe el parámetro 'role'
        if ($request->filled('role')) {
            $query->whereHas('roles', function($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        $sortBy = $request->get('sort', 'oldest'); // Por defecto: más viejos primero
        
        switch ($sortBy) {
            case 'newest':
                $query->latest('created_at');
                break;
            case 'oldest':
                $query->oldest('created_at');
                break;
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;
            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;
            case 'email_asc':
                $query->orderBy('email', 'asc');
                break;
            default:
                $query->oldest('created_at'); // Por defecto: más viejos primero
        }

        $users = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/users/Index', [
            'users' => $users,
            'roles' => Role::all(['id', 'name', 'display_name']),
            'filters' => $request->only(['search', 'role', 'sort'])
        ]);
    }

    /**
     * Mostrar formulario para crear nuevo usuario
     * Ruta: GET /admin/users/create
     */
    public function create()
    {
        // Obtener todos los roles disponibles para asignar
        $roles = Role::all(['id', 'name', 'display_name']);

        return Inertia::render('admin/users/Create', [
            'roles' => $roles
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,id'
        ], [
            'name.required' => 'El nombre es obligatorio.',
            'email.required' => 'El email es obligatorio.',
            'email.unique' => 'Este email ya está en uso.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'roles.required' => 'Debe seleccionar al menos un rol.',
            'roles.*.exists' => 'Uno de los roles seleccionados no es válido.'
        ]);

        DB::beginTransaction();
        try {
            // Crear el usuario
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'email_verified_at' => now(),
            ]);

            // Asignar roles al usuario
            $user->roles()->attach($request->roles);

            DB::commit();
            
            return redirect()->route('admin.users.index')
                ->with('success', 'Usuario creado exitosamente.');
                
        } catch (\Throwable $th) {
            DB::rollBack();
            
            Log::channel('debugging')->error('Error al crear usuario: ' . $th->getMessage(), [
                'file' => $th->getFile(),
                'line' => $th->getLine(),
                'request_data' => $request->except(['password', 'password_confirmation'])
            ]);

            // ← ESTO ES LO QUE FALTABA: Retornar respuesta de error
            return redirect()->back()
                ->withInput($request->except(['password', 'password_confirmation']))
                ->with('error', 'Ocurrió un error al crear el usuario. Por favor intenta nuevamente.');
        }
    }

    /**
     * Mostrar formulario para editar usuario existente
     * Ruta: GET /admin/users/{user}/edit
     */
    public function edit(User $user)
    {
        // Cargar el usuario con sus roles actuales
        $user->load('roles');
        
        // Obtener todos los roles disponibles
        $roles = Role::all(['id', 'name', 'display_name']);

        return Inertia::render('admin/users/Edit', [
            'user' => $user,
            'roles' => $roles
        ]);
    }

    /**
     * Actualizar usuario existente
     * Ruta: PUT /admin/users/{user}
     */
    public function update(Request $request, User $user)
    {
        // Validar datos (email único excepto para este usuario)
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,id'
        ], [
            'name.required' => 'El nombre es obligatorio.',
            'email.required' => 'El email es obligatorio.',
            'email.unique' => 'Este email ya está en uso.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'roles.required' => 'Debe seleccionar al menos un rol.',
            'roles.*.exists' => 'Uno de los roles seleccionados no es válido.'
        ]);

        // Actualizar datos básicos
        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        // Actualizar contraseña solo si se proporcionó una nueva
        if ($request->filled('password')) {
            $user->update([
                'password' => Hash::make($request->password)
            ]);
        }

        // Sincronizar roles (reemplaza todos los roles actuales)
        $user->roles()->sync($request->roles);

        return redirect()->route('admin.users.index')
            ->with('success', 'Usuario actualizado exitosamente.');
    }

    /**
     * Eliminar usuario
     * Ruta: DELETE /admin/users/{user}
     */
    public function destroy(User $user)
    {
        // Verificar que no se esté eliminando a sí mismo
        if ($user->id === auth()->id()) {
            return redirect()->route('admin.users.index')
                ->with('error', 'No puedes eliminar tu propia cuenta.');
        }

        // Verificar que no sea el único administrador
        if ($user->hasRole('admin')) {
            $adminCount = User::whereHas('roles', function($q) {
                $q->where('name', 'admin');
            })->count();

            if ($adminCount <= 1) {
                return redirect()->route('admin.users.index')
                    ->with('error', 'No puedes eliminar el último administrador del sistema.');
            }
        }

        // Eliminar usuario (los roles se eliminan automáticamente por la relación)
        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'Usuario eliminado exitosamente.');
    }
}