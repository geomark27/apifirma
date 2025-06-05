<?php
namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Permisos del módulo de usuarios
        $userPermissions = [
            ['name' => 'users.view', 'display_name' => 'Ver usuarios', 'module' => 'users'],
            ['name' => 'users.create', 'display_name' => 'Crear usuarios', 'module' => 'users'],
            ['name' => 'users.edit', 'display_name' => 'Editar usuarios', 'module' => 'users'],
            ['name' => 'users.delete', 'display_name' => 'Eliminar usuarios', 'module' => 'users'],
        ];

        // Permisos del módulo de roles
        $rolePermissions = [
            ['name' => 'roles.view', 'display_name' => 'Ver roles', 'module' => 'roles'],
            ['name' => 'roles.create', 'display_name' => 'Crear roles', 'module' => 'roles'],
            ['name' => 'roles.edit', 'display_name' => 'Editar roles', 'module' => 'roles'],
            ['name' => 'roles.delete', 'display_name' => 'Eliminar roles', 'module' => 'roles'],
        ];

        // Permisos del módulo dashboard
        $dashboardPermissions = [
            ['name' => 'dashboard.admin', 'display_name' => 'Dashboard Admin', 'module' => 'dashboard'],
            ['name' => 'dashboard.user', 'display_name' => 'Dashboard Usuario', 'module' => 'dashboard'],
        ];

        $allPermissions = array_merge($userPermissions, $rolePermissions, $dashboardPermissions);

        foreach ($allPermissions as $permission) {
            Permission::create($permission);
        }

        // Asignar permisos a roles
        $adminRole = Role::where('name', 'admin')->first();
        $userRole = Role::where('name', 'user')->first();

        // Admin tiene todos los permisos
        $adminRole->permissions()->attach(Permission::all());

        // User solo tiene permisos básicos
        $userRole->permissions()->attach(
            Permission::whereIn('name', ['dashboard.user'])->get()
        );
    }
}