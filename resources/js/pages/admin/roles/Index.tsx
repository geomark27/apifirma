// resources/js/pages/admin/roles/Index.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Role, type PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Shield, Edit, Settings, Users, Key, BarChart3 } from 'lucide-react';

interface RolesIndexProps extends PageProps {
    roles: Array<Role & {
        users_count: number;
        permissions_count: number;
    }>;
}

export default function RolesIndex({ roles, flash }: RolesIndexProps) {
    const { adminBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = adminBreadcrumbs.roles.index();

    const getRoleBadgeColor = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'admin':
                return 'bg-red-500 text-white';
            case 'user':
                return 'bg-blue-500 text-white';
            case 'editor':
                return 'bg-green-500 text-white';
            case 'moderator':
                return 'bg-purple-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    // Función para obtener icono según el rol
    const getRoleIcon = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'admin':
                return Shield;
            case 'user':
                return Users;
            default:
                return Shield;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Roles" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Gestión de Roles</h1>
                        <p className="text-muted-foreground">
                            Administra los roles del sistema y sus permisos
                        </p>
                    </div>
                    <div className="text-sm text-gray-600">
                        {roles.length} roles en total
                    </div>
                </div>

                {/* Mensajes Flash */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                        {flash.error}
                    </div>
                )}

                {/* Grid de Roles */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => {
                        const IconComponent = getRoleIcon(role.name);
                        const badgeColor = getRoleBadgeColor(role.name);
                        
                        return (
                            <Card key={role.id} className="p-6 hover:shadow-lg transition-shadow">
                                {/* Header de la tarjeta */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${badgeColor}`}>
                                            <IconComponent className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{role.display_name}</h3>
                                            <p className="text-sm text-gray-500">ID: {role.id}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {role.name}
                                    </Badge>
                                </div>

                                {/* Descripción */}
                                <div className="mb-4">
                                    {role.description ? (
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {role.description}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">
                                            Sin descripción
                                        </p>
                                    )}
                                </div>

                                {/* Estadísticas */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="flex items-center justify-center space-x-1 mb-1">
                                            <Users className="h-4 w-4 text-blue-600" />
                                            <span className="text-xs font-medium text-blue-700">Usuarios</span>
                                        </div>
                                        <div className="text-xl font-bold text-blue-800">
                                            {role.users_count}
                                        </div>
                                    </div>
                                    
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-center justify-center space-x-1 mb-1">
                                            <Key className="h-4 w-4 text-green-600" />
                                            <span className="text-xs font-medium text-green-700">Permisos</span>
                                        </div>
                                        <div className="text-xl font-bold text-green-800">
                                            {role.permissions_count}
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link href={`/admin/roles/${role.id}/edit`}>
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Edit className="h-4 w-4 mr-1" />
                                                Editar
                                            </Button>
                                        </Link>
                                        
                                        <Link href={`/admin/roles/${role.id}/permissions`}>
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Settings className="h-4 w-4 mr-1" />
                                                Permisos
                                            </Button>
                                        </Link>
                                    </div>
                                    
                                    <Link href={`/admin/roles/${role.id}/stats`}>
                                        <Button variant="outline" size="sm" className="w-full">
                                            <BarChart3 className="h-4 w-4 mr-1" />
                                            Ver Estadísticas
                                        </Button>
                                    </Link>
                                </div>

                                {/* Información adicional */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Creado:</span>
                                        <span>{new Date(role.created_at).toLocaleDateString('es-ES')}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                        <span>Actualizado:</span>
                                        <span>{new Date(role.updated_at).toLocaleDateString('es-ES')}</span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Información del sistema */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                            <span className="text-white text-xs font-bold">i</span>
                        </div>
                        <div>
                            <h4 className="font-medium text-blue-900">Gestión de Roles</h4>
                            <div className="text-sm text-blue-700 mt-2 space-y-1">
                                <p>• <strong>Editar:</strong> Modifica el nombre y descripción del rol</p>
                                <p>• <strong>Permisos:</strong> Gestiona qué acciones puede realizar cada rol</p>
                                <p>• <strong>Estadísticas:</strong> Ve información detallada sobre el uso del rol</p>
                                <p>• Los cambios en permisos afectan inmediatamente a todos los usuarios con ese rol</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Roles vacíos */}
                {roles.length === 0 && (
                    <Card className="p-8 text-center">
                        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-medium text-gray-900 mb-2">No hay roles configurados</h3>
                        <p className="text-gray-500">
                            Parece que no hay roles en el sistema. Esto es inusual.
                        </p>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}