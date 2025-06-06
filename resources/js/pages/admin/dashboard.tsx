// resources/js/pages/admin/Dashboard.tsx
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, Shield, Key, UserPlus, ShieldPlus, TrendingUp, TrendingDown, 
    Activity, CheckCircle, AlertTriangle, Crown, Edit, Calendar, Clock,
    BarChart3, PieChart, Zap
} from 'lucide-react';

interface AdminDashboardProps extends PageProps {
    stats: {
        total_users: number;
        total_roles: number;
        total_permissions: number;
    };
    usersByRole: Array<{
        name: string;
        display_name: string;
        count: number;
        percentage: number;
    }>;
    userGrowth: Array<{
        date: string;
        day: string;
        count: number;
        formatted_date: string;
    }>;
    systemStatus: {
        total_users: number;
        verified_users: number;
        unverified_users: number;
        total_roles: number;
        active_roles: number;
        inactive_roles: number;
        total_permissions: number;
    };
    recentActivity: Array<{
        action: string;
        details: string;
        time: string;
        type: string;
        icon: string;
    }>;
    timeMetrics: {
        users_today: number;
        users_this_week: number;
        users_this_month: number;
        weekly_growth: number;
    };
}

export default function AdminDashboard({ 
    stats, 
    usersByRole, 
    userGrowth, 
    systemStatus, 
    recentActivity, 
    timeMetrics 
}: AdminDashboardProps) {

    const { adminBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = adminBreadcrumbs.dashboard();

    const statCards = [
        {
            title: 'Total Usuarios',
            value: stats.total_users,
            icon: Users,
            href: '/admin/users',
            color: 'bg-blue-500',
            change: timeMetrics.users_today,
            changeLabel: 'hoy'
        },
        {
            title: 'Roles',
            value: stats.total_roles,
            icon: Shield,
            href: '/admin/roles',
            color: 'bg-green-500',
            change: systemStatus.active_roles,
            changeLabel: 'activos'
        },
    ];

    // Función para obtener icono de actividad
    const getActivityIcon = (iconName: string) => {
        switch (iconName) {
            case 'UserPlus': return UserPlus;
            case 'Shield': return Shield;
            case 'Edit': return Edit;
            case 'Crown': return Crown;
            default: return Activity;
        }
    };

    // Función para obtener color de actividad
    const getActivityColor = (type: string) => {
        switch (type) {
            case 'user_created': return 'bg-green-100 text-green-600';
            case 'role_updated': return 'bg-blue-100 text-blue-600';
            case 'user_updated': return 'bg-amber-100 text-amber-600';
            case 'role_assigned': return 'bg-purple-100 text-purple-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // Función para obtener colores de roles
    const getRoleColor = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'admin': return 'bg-red-500';
            case 'user': return 'bg-blue-500';
            case 'editor': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard de Administración</h1>
                        <p className="text-muted-foreground">
                            Gestiona usuarios, roles y permisos del sistema
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{new Date().toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    {statCards.map((stat) => {
                        const IconComponent = stat.icon;
                        return (
                            <Link key={stat.title} href={stat.href}>
                                <Card className="p-6 transition-all hover:shadow-md hover:scale-[1.02]">
                                    <div className="flex items-center space-x-4">
                                        <div className={`${stat.color} p-3 rounded-lg text-white`}>
                                            <IconComponent className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {stat.title}
                                            </p>
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                            {stat.change !== null && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    +{stat.change} {stat.changeLabel}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Distribución por Roles */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <PieChart className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-semibold">Distribución por Roles</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {usersByRole.map((role) => (
                                <div key={role.name} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-3 h-3 rounded-full ${getRoleColor(role.name)}`}></div>
                                        <span className="font-medium">{role.display_name}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600">{role.count} usuarios</span>
                                        <Badge variant="outline" className="text-xs">
                                            {role.percentage}%
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Barra visual de distribución */}
                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden flex">
                            {usersByRole.map((role, index) => (
                                <div
                                    key={role.name}
                                    className={getRoleColor(role.name)}
                                    style={{ width: `${role.percentage}%` }}
                                ></div>
                            ))}
                        </div>
                    </Card>

                    {/* Crecimiento de Usuarios */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5 text-green-600" />
                                <h3 className="text-lg font-semibold">Crecimiento de Usuarios</h3>
                            </div>
                            <div className="flex items-center space-x-1">
                                {timeMetrics.weekly_growth >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                                <span className={`text-sm font-medium ${
                                    timeMetrics.weekly_growth >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {timeMetrics.weekly_growth}%
                                </span>
                            </div>
                        </div>

                        {/* Métricas rápidas */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center p-2 bg-blue-50 rounded">
                                <div className="text-lg font-bold text-blue-800">{timeMetrics.users_today}</div>
                                <div className="text-xs text-blue-600">Hoy</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                                <div className="text-lg font-bold text-green-800">{timeMetrics.users_this_week}</div>
                                <div className="text-xs text-green-600">Esta semana</div>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded">
                                <div className="text-lg font-bold text-purple-800">{timeMetrics.users_this_month}</div>
                                <div className="text-xs text-purple-600">Este mes</div>
                            </div>
                        </div>

                        {/* Gráfico simple de barras */}
                        <div className="flex items-end space-x-1 h-20">
                            {userGrowth.map((day) => (
                                <div key={day.date} className="flex-1 flex flex-col items-center">
                                    <div 
                                        className="w-full bg-blue-500 rounded-t"
                                        style={{ 
                                            height: `${Math.max((day.count / Math.max(...userGrowth.map(d => d.count))) * 60, 4)}px` 
                                        }}
                                    ></div>
                                    <span className="text-xs text-gray-500 mt-1">{day.day}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Estado del Sistema */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <Zap className="h-5 w-5 text-amber-600" />
                            <h3 className="text-lg font-semibold">Estado del Sistema</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium">Usuarios verificados</span>
                                </div>
                                <span className="text-sm font-bold text-green-800">
                                    {systemStatus.verified_users}/{systemStatus.total_users}
                                </span>
                            </div>

                            {systemStatus.unverified_users > 0 && (
                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <span className="text-sm font-medium">Sin verificar email</span>
                                    </div>
                                    <span className="text-sm font-bold text-amber-800">
                                        {systemStatus.unverified_users}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <Shield className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">Roles activos</span>
                                </div>
                                <span className="text-sm font-bold text-blue-800">
                                    {systemStatus.active_roles}/{systemStatus.total_roles}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <Key className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium">Permisos del sistema</span>
                                </div>
                                <span className="text-sm font-bold text-purple-800">
                                    {systemStatus.total_permissions}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Actividad Reciente */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <Activity className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-semibold">Actividad Reciente</h3>
                        </div>
                        
                        <div className="space-y-3">
                            {recentActivity.map((activity, index) => {
                                const IconComponent = getActivityIcon(activity.icon);
                                const colorClass = getActivityColor(activity.type);
                                
                                return (
                                    <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className={`p-2 rounded-lg ${colorClass}`}>
                                            <IconComponent className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {activity.action}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {activity.details}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Acciones Rápidas (MANTENIDAS) */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        <Link
                            href="/admin/users/create"
                            className="flex items-center space-x-3 p-4 rounded-lg border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        >
                            <UserPlus className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">Crear Nuevo Usuario</span>
                        </Link>
                        <Link
                            href="/admin/roles/create"
                            className="flex items-center space-x-3 p-4 rounded-lg border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors"
                        >
                            <ShieldPlus className="h-5 w-5 text-green-600" />
                            <span className="font-medium">Crear Nuevo Rol</span>
                        </Link>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}