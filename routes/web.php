<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\RoleController;  // ← Agregar esta línea
use App\Http\Controllers\User\DashboardController as UserDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    
    // Dashboard general - redirige según el rol
    Route::get('dashboard', function () {
        $user = auth()->user();
        
        if ($user->hasRole('admin')) {
            return redirect()->route('admin.dashboard');
        }
        
        if ($user->hasRole('user')) {
            return redirect()->route('user.dashboard');
        }
        
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Rutas para ADMIN
    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        // Dashboard de admin
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
        
        // Gestión de usuarios (CRUD completo)
        Route::resource('users', AdminController::class)->except(['show']);
        
        // Gestión de roles (Index, Edit, Permisos) ← AGREGAR ESTAS LÍNEAS
        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
        Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        
        // Gestión de permisos de roles
        Route::get('roles/{role}/permissions', [RoleController::class, 'permissions'])->name('roles.permissions');
        Route::put('roles/{role}/permissions', [RoleController::class, 'updatePermissions'])->name('roles.permissions.update');
        
        // Estadísticas de rol (opcional - para futuro)
        Route::get('roles/{role}/stats', [RoleController::class, 'stats'])->name('roles.stats');
    });

    // Rutas para USER
    Route::middleware(['role:user'])->prefix('user')->name('user.')->group(function () {
        Route::get('/dashboard', [UserDashboardController::class, 'index'])->name('dashboard');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';