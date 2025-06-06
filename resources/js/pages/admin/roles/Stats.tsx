// resources/js/pages/admin/roles/Stats.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Role, type User, type Permission, type PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { 
    ArrowLeft, Users, Key, Calendar, TrendingUp, Shield, Settings, 
    BarChart3, Eye, Edit, Clock, UserCheck, Activity, Target,
    CheckCircle, AlertCircle, Info, Zap
} from 'lucide-react';

interface RoleStatsProps extends PageProps {
    role: Role;
    stats: {
        total_users: number;
        users_list: User[];
        total_permissions: number;
        permissions_by_module: Record<string, Permission[]>;
    };
}


export default function RoleStats({ role, stats }: RoleStatsProps) {
    const { adminBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = adminBreadcrumbs.roles.stats();
    
    const totalSystemPermissions = Object.values(stats.permissions_by_module).flat().length;
    const permissionCoverage = totalSystemPermissions > 0 ? 
        (stats.total_permissions / totalSystemPermissions * 100).toFixed(1) : '0';
    
    const moduleCount = Object.keys(stats.permissions_by_module).length;
    const avgPermissionsPerModule = moduleCount > 0 ? 
        (stats.total_permissions / moduleCount).toFixed(1) : '0';

    // Función para obtener color del rol
    const getRoleBadgeColor = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'admin':
                return 'bg-red-500';
            case 'user':
                return 'bg-blue-500';
            case 'editor':
                return 'bg-green-500';
            case 'moderator':
                return 'bg-purple-500';
            default:
                return 'bg-gray-500';
        }
    };

    // Función para obtener color e icono por módulo
    const getModuleInfo = (module: string) => {
        switch (module.toLowerCase()) {
            case 'users':
                return { icon: Users, color: 'bg-blue-500', textColor: 'text-blue-700' };
            case 'roles':
                return { icon: Shield, color: 'bg-red-500', textColor: 'text-red-700' };
            case 'dashboard':
                return { icon: BarChart3, color: 'bg-green-500', textColor: 'text-green-700' };
            case 'settings':
                return { icon: Settings, color: 'bg-purple-500', textColor: 'text-purple-700' };
            default:
                return { icon: Key, color: 'bg-gray-500', textColor: 'text-gray-700' };
        }
    };

    const badgeColor = getRoleBadgeColor(role.name);
    const isSystemRole = ['admin', 'user'].includes(role.name.toLowerCase());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Estadísticas: ${role.display_name}`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Estadísticas: {role.display_name}
                        </h1>
                        <p className="text-muted-foreground">
                            Análisis detallado del uso y configuración del rol
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link href={`/admin/roles/${role.id}/edit`}>
                            <Button variant="outline" size="sm" className="flex items-center space-x-2">
                                <Edit className="h-4 w-4" />
                                <span>Editar Rol</span>
                            </Button>
                        </Link>
                        <Link href="/admin/roles">
                            <Button variant="outline" className="flex items-center space-x-2">
                                <ArrowLeft className="h-4 w-4" />
                                <span>Volver a Roles</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Información del Rol */}
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className={`${badgeColor} p-4 rounded-lg text-white`}>
                                <Shield className="h-8 w-8" />
                            </div>
                            <div>
                                <div className="flex items-center space-x-3 mb-2">
                                    <h2 className="text-xl font-bold text-gray-900">{role.display_name}</h2>
                                    <Badge variant="outline" className="text-xs">
                                        {role.name}
                                    </Badge>
                                    {isSystemRole && (
                                        <Badge variant="secondary" className="text-xs">
                                            Rol del Sistema
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-gray-600 mb-1">
                                    {role.description || 'Sin descripción disponible'}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span className="flex items-center space-x-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>Creado: {new Date(role.created_at).toLocaleDateString('es-ES')}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                        <Clock className="h-4 w-4" />
                                        <span>Actualizado: {new Date(role.updated_at).toLocaleDateString('es-ES')}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Métricas Principales */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-800 mb-1">
                            {stats.total_users}
                        </div>
                        <div className="text-sm text-gray-600">
                            Usuarios con este rol
                        </div>
                    </Card>

                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Key className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-800 mb-1">
                            {stats.total_permissions}
                        </div>
                        <div className="text-sm text-gray-600">
                            Permisos asignados
                        </div>
                    </Card>

                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-800 mb-1">
                            {permissionCoverage}%
                        </div>
                        <div className="text-sm text-gray-600">
                            Cobertura del sistema
                        </div>
                    </Card>

                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Target className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="text-2xl font-bold text-amber-800 mb-1">
                            {moduleCount}
                        </div>
                        <div className="text-sm text-gray-600">
                            Módulos con acceso
                        </div>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Lista de Usuarios */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center space-x-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                <span>Usuarios con este rol</span>
                            </h3>
                            <Badge variant="outline">
                                {stats.total_users} total
                            </Badge>
                        </div>

                        {stats.users_list.length > 0 ? (
                            <div className="space-y-3">
                                {stats.users_list.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            {user.email_verified_at ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <Link href={`/admin/users/${user.id}/edit`}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                                
                                {stats.total_users > 5 && (
                                    <div className="text-center py-2">
                                        <Link href="/admin/users">
                                            <Button variant="outline" size="sm">
                                                Ver todos los {stats.total_users} usuarios
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No hay usuarios con este rol</p>
                            </div>
                        )}
                    </Card>

                    {/* Análisis de Permisos por Módulo */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center space-x-2">
                                <Key className="h-5 w-5 text-green-600" />
                                <span>Permisos por Módulo</span>
                            </h3>
                            <Badge variant="outline">
                                {stats.total_permissions} permisos
                            </Badge>
                        </div>

                        {Object.keys(stats.permissions_by_module).length > 0 ? (
                            <div className="space-y-4">
                                {Object.entries(stats.permissions_by_module).map(([module, permissions]) => {
                                    const moduleInfo = getModuleInfo(module);
                                    const IconComponent = moduleInfo.icon;
                                    
                                    return (
                                        <div key={module} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`${moduleInfo.color} p-2 rounded-lg text-white`}>
                                                        <IconComponent className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium capitalize">
                                                            Módulo {module}
                                                        </h4>
                                                        <p className="text-xs text-gray-500">
                                                            {permissions.length} permisos
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`text-right ${moduleInfo.textColor}`}>
                                                    <div className="text-lg font-bold">
                                                        {permissions.length}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="grid gap-2">
                                                {permissions.map((permission) => (
                                                    <div
                                                        key={permission.id}
                                                        className="flex items-center justify-between text-sm"
                                                    >
                                                        <span className="text-gray-700">
                                                            {permission.display_name}
                                                        </span>
                                                        <span className="text-xs text-gray-500 font-mono">
                                                            {permission.name}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Key className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No hay permisos asignados a este rol</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Métricas Avanzadas */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-purple-600" />
                        <span>Análisis Avanzado</span>
                    </h3>
                    
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-800 mb-1">
                                {avgPermissionsPerModule}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                                Permisos promedio por módulo
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Indica la granularidad del rol
                            </div>
                        </div>

                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-800 mb-1">
                                {isSystemRole ? 'Alta' : 'Media'}
                            </div>
                            <div className="text-sm text-green-600 font-medium">
                                Criticidad del rol
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Impacto en el sistema
                            </div>
                        </div>

                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-800 mb-1">
                                {stats.total_users > 0 ? 'Activo' : 'Inactivo'}
                            </div>
                            <div className="text-sm text-purple-600 font-medium">
                                Estado de uso
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Basado en usuarios asignados
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Acciones Rápidas */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-amber-600" />
                        <span>Acciones Rápidas</span>
                    </h3>
                    
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <Link href={`/admin/roles/${role.id}/edit`}>
                            <Button variant="outline" className="w-full justify-start">
                                <Edit className="h-4 w-4 mr-2" />
                                Editar Información
                            </Button>
                        </Link>
                        
                        <Link href={`/admin/roles/${role.id}/permissions`}>
                            <Button variant="outline" className="w-full justify-start">
                                <Shield className="h-4 w-4 mr-2" />
                                Gestionar Permisos
                            </Button>
                        </Link>
                        
                        <Link href="/admin/users">
                            <Button variant="outline" className="w-full justify-start">
                                <Users className="h-4 w-4 mr-2" />
                                Ver Todos los Usuarios
                            </Button>
                        </Link>
                        
                        <Link href="/admin/roles">
                            <Button variant="outline" className="w-full justify-start">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Comparar con Otros Roles
                            </Button>
                        </Link>
                    </div>
                </Card>

                {/* Información de ayuda */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-900">Interpretación de las estadísticas</h4>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                <li>• <strong>Cobertura del sistema:</strong> Porcentaje de permisos totales que tiene este rol</li>
                                <li>• <strong>Módulos con acceso:</strong> Cantidad de áreas del sistema a las que puede acceder</li>
                                <li>• <strong>Criticidad:</strong> Roles del sistema (admin/user) tienen alta criticidad</li>
                                <li>• <strong>Estado de uso:</strong> Activo si tiene usuarios asignados, Inactivo si no</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}