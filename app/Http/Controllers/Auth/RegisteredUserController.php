<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'email_verified_at' => now(),
            ]);

            // Buscar rol 'user' - NUNCA 'admin' en registro público
            $userRole = Role::where('name', 'user')->first();
            
            if (!$userRole) {
                // Si no existe, algo está mal con los seeders
                throw new \Exception('Rol de usuario no encontrado. Contacte al administrador.');
            }
            
            $user->roles()->attach($userRole);

            DB::commit();

            event(new Registered($user));
            Auth::login($user);

            return to_route('dashboard');

        } catch (\Throwable $th) {
            DB::rollBack();
            
            Log::channel('debugging')->error('Error en registro de usuario: ' . $th->getMessage(), [
                'file' => $th->getFile(),
                'line' => $th->getLine(),
                'request_data' => $request->except(['password', 'password_confirmation'])
            ]);
            
            return redirect()->back()
                ->withInput($request->except('password', 'password_confirmation'))
                ->with('error', 'Error al crear la cuenta. Intenta nuevamente.');
        }
    }
}
