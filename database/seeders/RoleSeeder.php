<?php
namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::create([
            'name' => 'admin',
            'display_name' => 'Administrador',
            'description' => 'Acceso completo al sistema'
        ]);

        Role::create([
            'name' => 'user',
            'display_name' => 'Usuario',
            'description' => 'Acceso limitado al sistema'
        ]);
    }
}