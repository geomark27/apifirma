<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class RoleController extends Controller
{
    /**
     * Mostrar lista de roles
     * Ruta: GET /admin/roles
     */
    public function index()
    {
        $roles = Role::withCount(['users', 'permissions'])->get();
        
        return Inertia::render('admin/roles/Index', [
            'roles' => $roles
        ]);
    }

    /**
     * Mostrar formulario para editar rol
     * Ruta: GET /admin/roles/{role}/edit
     */
    public function edit(Role $role)
    {
        return Inertia::render('admin/roles/Edit', [
            'role' => $role
        ]);
    }

    /**
     * Actualizar información básica del rol
     * Ruta: PUT /admin/roles/{role}
     */
    public function update(Request $request, Role $role)
    {
        $request->validate([
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ], [
            'display_name.required' => 'El nombre para mostrar es obligatorio.',
            'display_name.max' => 'El nombre no puede tener más de 255 caracteres.',
            'description.max' => 'La descripción no puede tener más de 500 caracteres.',
        ]);

        try {
            $role->update([
                'display_name' => $request->display_name,
                'description' => $request->description,
            ]);

            return redirect()->route('admin.roles.index')
                ->with('success', 'Rol actualizado exitosamente.');

        } catch (\Throwable $th) {
            Log::channel('debugging')->error('Error al actualizar rol: ' . $th->getMessage(), [
                'file' => $th->getFile(),
                'line' => $th->getLine(),
                'role_id' => $role->id,
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Ocurrió un error al actualizar el rol.');
        }
    }

    /**
     * Mostrar página de gestión de permisos para un rol
     * Ruta: GET /admin/roles/{role}/permissions
     */
    public function permissions(Role $role)
    {
        // Cargar rol con sus permisos actuales
        $role->load('permissions');
        
        // Obtener todos los permisos agrupados por módulo
        $allPermissions = Permission::all()->groupBy('module');
        
        return Inertia::render('admin/roles/Permissions', [
            'role' => $role,
            'permissionsByModule' => $allPermissions,
        ]);
    }

    /**
     * Actualizar permisos de un rol
     * Ruta: PUT /admin/roles/{role}/permissions
     */
    public function updatePermissions(Request $request, Role $role)
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id'
        ], [
            'permissions.required' => 'Debe seleccionar al menos un permiso.',
            'permissions.*.exists' => 'Uno de los permisos seleccionados no es válido.'
        ]);

        DB::beginTransaction();
        try {
            // Sincronizar permisos (esto reemplaza todos los permisos actuales)
            $role->permissions()->sync($request->permissions);

            DB::commit();

            return redirect()->route('admin.roles.index')
                ->with('success', "Permisos del rol '{$role->display_name}' actualizados exitosamente.");

        } catch (\Throwable $th) {
            DB::rollBack();
            
            Log::channel('debugging')->error('Error al actualizar permisos del rol: ' . $th->getMessage(), [
                'file' => $th->getFile(),
                'line' => $th->getLine(),
                'role_id' => $role->id,
                'permissions' => $request->permissions,
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Ocurrió un error al actualizar los permisos del rol.');
        }
    }

    /**
     * Mostrar estadísticas detalladas de un rol
     * Ruta: GET /admin/roles/{role}/stats
     */
    public function stats(Role $role)
    {
        $role->load(['users', 'permissions']);
        
        $stats = [
            'total_users' => $role->users->count(),
            'users_list' => $role->users->take(5), // Primeros 5 usuarios
            'total_permissions' => $role->permissions->count(),
            'permissions_by_module' => $role->permissions->groupBy('module'),
        ];

        return Inertia::render('admin/roles/Stats', [
            'role' => $role,
            'stats' => $stats
        ]);
    }
}