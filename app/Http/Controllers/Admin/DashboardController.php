<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Métricas básicas del sistema
        $totalUsers = User::count();
        $totalRoles = Role::count();
        $totalPermissions = Permission::count();
        
        // 1. Distribución de usuarios por rol
        $usersByRole = User::select('roles.name', 'roles.display_name', DB::raw('count(*) as count'))
            ->join('role_user', 'users.id', '=', 'role_user.user_id')
            ->join('roles', 'role_user.role_id', '=', 'roles.id')
            ->groupBy('roles.id', 'roles.name', 'roles.display_name')
            ->get()
            ->map(function ($item) use ($totalUsers) {
                return [
                    'name' => $item->name,
                    'display_name' => $item->display_name,
                    'count' => $item->count,
                    'percentage' => $totalUsers > 0 ? round(($item->count / $totalUsers) * 100, 1) : 0
                ];
            });

        // 2. Crecimiento de usuarios (últimos 7 días)
        $userGrowth = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $count = User::whereDate('created_at', $date->format('Y-m-d'))->count();
            $userGrowth[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $date->format('D'),
                'count' => $count,
                'formatted_date' => $date->format('d/m')
            ];
        }
        
        // Total usuarios esta semana vs semana anterior
        $thisWeekUsers = User::whereBetween('created_at', [
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek()
        ])->count();
        
        $lastWeekUsers = User::whereBetween('created_at', [
            Carbon::now()->subWeek()->startOfWeek(),
            Carbon::now()->subWeek()->endOfWeek()
        ])->count();
        
        $weeklyGrowthPercentage = $lastWeekUsers > 0 
            ? round((($thisWeekUsers - $lastWeekUsers) / $lastWeekUsers) * 100, 1)
            : ($thisWeekUsers > 0 ? 100 : 0);

        // 3. Estado del sistema
        $systemStatus = [
            'total_users' => $totalUsers,
            'verified_users' => User::whereNotNull('email_verified_at')->count(),
            'unverified_users' => User::whereNull('email_verified_at')->count(),
            'total_roles' => $totalRoles,
            'active_roles' => Role::whereHas('users')->count(),
            'inactive_roles' => Role::whereDoesntHave('users')->count(),
            'total_permissions' => $totalPermissions,
        ];

        // 4. Actividad reciente del sistema (simulada por ahora)
        $recentActivity = [
            [
                'action' => 'Usuario registrado',
                'details' => 'Nuevo usuario se unió al sistema',
                'time' => Carbon::now()->subMinutes(30)->diffForHumans(),
                'type' => 'user_created',
                'icon' => 'UserPlus'
            ],
            [
                'action' => 'Rol modificado',
                'details' => 'Permisos del rol User actualizados',
                'time' => Carbon::now()->subHours(2)->diffForHumans(),
                'type' => 'role_updated', 
                'icon' => 'Shield'
            ],
            [
                'action' => 'Usuario editado',
                'details' => 'Información de usuario actualizada',
                'time' => Carbon::now()->subHours(4)->diffForHumans(),
                'type' => 'user_updated',
                'icon' => 'Edit'
            ],
            [
                'action' => 'Nuevo administrador',
                'details' => 'Usuario promovido a administrador',
                'time' => Carbon::now()->subDay()->diffForHumans(),
                'type' => 'role_assigned',
                'icon' => 'Crown'
            ]
        ];

        // 5. Métricas de tiempo
        $timeMetrics = [
            'users_today' => User::whereDate('created_at', Carbon::today())->count(),
            'users_this_week' => $thisWeekUsers,
            'users_this_month' => User::whereBetween('created_at', [
                Carbon::now()->startOfMonth(),
                Carbon::now()->endOfMonth()
            ])->count(),
            'weekly_growth' => $weeklyGrowthPercentage
        ];

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_users' => $totalUsers,
                'total_roles' => $totalRoles,
                'total_permissions' => $totalPermissions,
            ],
            'usersByRole' => $usersByRole,
            'userGrowth' => $userGrowth,
            'systemStatus' => $systemStatus,
            'recentActivity' => $recentActivity,
            'timeMetrics' => $timeMetrics
        ]);
    }
}