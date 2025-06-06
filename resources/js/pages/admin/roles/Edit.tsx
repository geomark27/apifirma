// resources/js/pages/admin/roles/Edit.tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Role, type PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Shield, AlertTriangle, Info } from 'lucide-react';

interface EditRoleProps extends PageProps {
    role: Role;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Gestión de Roles',
        href: '/admin/roles',
    },
    {
        title: 'Editar Rol',
        href: '#',
    },
];

export default function EditRole({ role }: EditRoleProps) {
    const { adminBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = adminBreadcrumbs.roles.edit();
    const { data, setData, put, processing, errors } = useForm({
        display_name: role.display_name,
        description: role.description || '',
    });

    // Manejar envío del formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        put(`/admin/roles/${role.id}`);
    };

    // Función para obtener color del rol
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

    const badgeColor = getRoleBadgeColor(role.name);
    const isSystemRole = ['admin', 'user'].includes(role.name.toLowerCase());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Rol: ${role.display_name}`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Editar Rol: {role.display_name}
                        </h1>
                        <p className="text-muted-foreground">
                            Modifica la información básica del rol
                        </p>
                    </div>
                    <Link href="/admin/roles">
                        <Button variant="outline" className="flex items-center space-x-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Volver a Roles</span>
                        </Button>
                    </Link>
                </div>

                {/* Información del Rol */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${badgeColor}`}>
                            <Shield className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center space-x-3">
                                <h3 className="font-medium text-blue-900">Rol: {role.name}</h3>
                                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                                    ID: {role.id}
                                </span>
                                {isSystemRole && (
                                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                                        Rol del Sistema
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-blue-700 mt-1">
                                Creado el: {new Date(role.created_at).toLocaleDateString('es-ES')}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Advertencia para roles del sistema */}
                {isSystemRole && (
                    <Card className="p-4 bg-amber-50 border-amber-200">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-amber-900">Rol del Sistema</h4>
                                <p className="text-sm text-amber-700 mt-1">
                                    Este es un rol fundamental del sistema. Ten cuidado al modificar su información
                                    ya que puede afectar el funcionamiento de la aplicación.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Formulario de Edición */}
                    <div className="lg:col-span-2">
                        <Card className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Nombre para mostrar */}
                                <div className="space-y-2">
                                    <Label htmlFor="display_name">
                                        Nombre para mostrar <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="display_name"
                                        type="text"
                                        value={data.display_name}
                                        onChange={(e) => setData('display_name', e.target.value)}
                                        placeholder="Ej: Administrador, Usuario, Editor..."
                                        className={errors.display_name ? 'border-red-500' : ''}
                                    />
                                    {errors.display_name && (
                                        <p className="text-sm text-red-600">{errors.display_name}</p>
                                    )}
                                    <p className="text-xs text-gray-600">
                                        Este es el nombre que verán los usuarios en la interfaz
                                    </p>
                                </div>

                                {/* Descripción */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Descripción <span className="text-gray-500">(Opcional)</span>
                                    </Label>
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe qué puede hacer este rol o para qué sirve..."
                                        rows={4}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                                            errors.description ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-600">{errors.description}</p>
                                    )}
                                    <p className="text-xs text-gray-600">
                                        Máximo 500 caracteres. Ayuda a explicar el propósito del rol.
                                    </p>
                                </div>

                                {/* Información técnica no editable */}
                                <div className="space-y-4 pt-6 border-t border-gray-200">
                                    <h4 className="font-medium text-gray-900">Información técnica</h4>
                                    
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <Label className="text-sm text-gray-600">Nombre técnico</Label>
                                            <div className="mt-1 px-3 py-2 bg-gray-100 border rounded-md text-sm font-mono">
                                                {role.name}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                No se puede modificar (usado internamente)
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <Label className="text-sm text-gray-600">Última actualización</Label>
                                            <div className="mt-1 px-3 py-2 bg-gray-100 border rounded-md text-sm">
                                                {new Date(role.updated_at).toLocaleString('es-ES')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botones de Acción */}
                                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                                    <Link href="/admin/roles">
                                        <Button type="button" variant="outline">
                                            Cancelar
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex items-center space-x-2"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Actualizando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                <span>Guardar Cambios</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>

                    {/* Panel lateral con acciones */}
                    <div className="space-y-6">
                        {/* Acciones rápidas */}
                        <Card className="p-4">
                            <h4 className="font-medium mb-4">Acciones rápidas</h4>
                            <div className="space-y-3">
                                <Link href={`/admin/roles/${role.id}/permissions`}>
                                    <Button variant="outline" className="w-full justify-start">
                                        <Shield className="h-4 w-4 mr-2" />
                                        Gestionar Permisos
                                    </Button>
                                </Link>
                                
                                <Link href={`/admin/roles/${role.id}/stats`}>
                                    <Button variant="outline" className="w-full justify-start">
                                        <Info className="h-4 w-4 mr-2" />
                                        Ver Estadísticas
                                    </Button>
                                </Link>
                            </div>
                        </Card>

                        {/* Información adicional */}
                        <Card className="p-4 bg-green-50 border-green-200">
                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                                    <span className="text-white text-xs font-bold">✓</span>
                                </div>
                                <div>
                                    <h4 className="font-medium text-green-900">Consejos</h4>
                                    <ul className="text-sm text-green-700 mt-2 space-y-1">
                                        <li>• Usa nombres descriptivos y claros</li>
                                        <li>• La descripción ayuda a otros administradores</li>
                                        <li>• Los cambios se aplican inmediatamente</li>
                                        <li>• Los permisos se gestionan por separado</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}