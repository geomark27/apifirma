// resources/js/pages/admin/roles/Permissions.tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Role, type Permission, type PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Shield, CheckCircle, AlertTriangle, Users, Key, Settings, Home } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PermissionsProps extends PageProps {
    role: Role & { permissions: Permission[] };
    permissionsByModule: Record<string, Permission[]>;
}


export default function RolePermissions({ role, permissionsByModule }: PermissionsProps) {
    // IDs de permisos actuales del rol
    const { adminBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = adminBreadcrumbs.roles.permissions();
    const currentPermissionIds = role.permissions.map(p => p.id);
    
    // Estado del formulario
    const { data, setData, put, processing, errors } = useForm({
        permissions: currentPermissionIds,
    });

    // Estados para funcionalidades adicionales
    const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');

    // Calcular estado de módulos (todos, algunos, ninguno seleccionado)
    useEffect(() => {
        const moduleStates: Record<string, boolean> = {};
        
        Object.keys(permissionsByModule).forEach(module => {
            const modulePermissions = permissionsByModule[module];
            const selectedInModule = modulePermissions.filter(p => 
                data.permissions.includes(p.id)
            ).length;
            
            // Si todos están seleccionados, el módulo está "seleccionado"
            moduleStates[module] = selectedInModule === modulePermissions.length;
        });
        
        setSelectedModules(moduleStates);
    }, [data.permissions, permissionsByModule]);

    // Manejar envío del formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/roles/${role.id}/permissions`);
    };

    // Manejar selección individual de permiso
    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        if (checked) {
            setData('permissions', [...data.permissions, permissionId]);
        } else {
            setData('permissions', data.permissions.filter(id => id !== permissionId));
        }
    };

    // Manejar selección de todos los permisos de un módulo
    const handleModuleToggle = (module: string, checked: boolean) => {
        const modulePermissionIds = permissionsByModule[module].map(p => p.id);
        
        if (checked) {
            // Agregar todos los permisos del módulo
            const newPermissions = [...data.permissions];
            modulePermissionIds.forEach(id => {
                if (!newPermissions.includes(id)) {
                    newPermissions.push(id);
                }
            });
            setData('permissions', newPermissions);
        } else {
            // Quitar todos los permisos del módulo
            setData('permissions', data.permissions.filter(id => 
                !modulePermissionIds.includes(id)
            ));
        }
    };

    // Obtener icono para cada módulo
    const getModuleIcon = (module: string) => {
        switch (module.toLowerCase()) {
            case 'users':
                return Users;
            case 'roles':
                return Shield;
            case 'dashboard':
                return Home;
            case 'settings':
                return Settings;
            default:
                return Key;
        }
    };

    // Obtener color para cada módulo
    const getModuleColor = (module: string) => {
        switch (module.toLowerCase()) {
            case 'users':
                return 'bg-blue-500';
            case 'roles':
                return 'bg-red-500';
            case 'dashboard':
                return 'bg-green-500';
            case 'settings':
                return 'bg-purple-500';
            default:
                return 'bg-gray-500';
        }
    };

    // Filtrar permisos por búsqueda
    const filterPermissions = (permissions: Permission[]) => {
        if (!searchTerm) return permissions;
        return permissions.filter(p => 
            p.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const totalPermissions = Object.values(permissionsByModule).flat().length;
    const selectedCount = data.permissions.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Permisos de ${role.display_name}`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Permisos de: {role.display_name}
                        </h1>
                        <p className="text-muted-foreground">
                            Configura qué acciones puede realizar este rol
                        </p>
                    </div>
                    <Link href="/admin/roles">
                        <Button variant="outline" className="flex items-center space-x-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Volver a Roles</span>
                        </Button>
                    </Link>
                </div>

                {/* Información del rol */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-500 p-3 rounded-lg text-white">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-medium text-blue-900">
                                    Rol: {role.display_name} ({role.name})
                                </h3>
                                <p className="text-sm text-blue-700">
                                    {role.description || 'Sin descripción'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-blue-700">
                                {selectedCount} de {totalPermissions} permisos seleccionados
                            </div>
                            <div className="text-xs text-blue-600">
                                {((selectedCount / totalPermissions) * 100).toFixed(1)}% del total
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Barra de búsqueda y acciones rápidas */}
                <Card className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Buscar permisos por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setData('permissions', Object.values(permissionsByModule).flat().map(p => p.id))}
                            >
                                Seleccionar Todo
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setData('permissions', [])}
                            >
                                Limpiar Todo
                            </Button>
                        </div>
                    </div>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Permisos por módulos */}
                    <div className="grid gap-6">
                        {Object.entries(permissionsByModule).map(([module, permissions]) => {
                            const IconComponent = getModuleIcon(module);
                            const moduleColor = getModuleColor(module);
                            const filteredPermissions = filterPermissions(permissions);
                            
                            if (filteredPermissions.length === 0 && searchTerm) {
                                return null; // No mostrar módulos sin permisos que coincidan con la búsqueda
                            }

                            const selectedInModule = permissions.filter(p => 
                                data.permissions.includes(p.id)
                            ).length;
                            const isModuleComplete = selectedInModule === permissions.length;
                            const isModulePartial = selectedInModule > 0 && selectedInModule < permissions.length;

                            return (
                                <Card key={module} className="overflow-hidden">
                                    {/* Header del módulo */}
                                    <div className="p-4 bg-gray-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`${moduleColor} p-2 rounded-lg text-white`}>
                                                    <IconComponent className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg capitalize">
                                                        Módulo {module}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {selectedInModule} de {permissions.length} permisos seleccionados
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {/* Indicador visual del estado */}
                                                {isModuleComplete && (
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                )}
                                                {isModulePartial && (
                                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                                )}
                                                
                                                {/* Checkbox para seleccionar todo el módulo */}
                                                <Checkbox
                                                    checked={isModuleComplete}
                                                    onCheckedChange={(checked) => 
                                                        handleModuleToggle(module, checked as boolean)
                                                    }
                                                />
                                                <Label className="text-sm font-medium">
                                                    Seleccionar todo
                                                </Label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Permisos del módulo */}
                                    <div className="p-4">
                                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                            {filteredPermissions.map((permission) => {
                                                const isSelected = data.permissions.includes(permission.id);
                                                const wasOriginal = currentPermissionIds.includes(permission.id);
                                                
                                                return (
                                                    <div
                                                        key={permission.id}
                                                        className={`flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                                                            isSelected ? 'bg-blue-50 border-blue-200' : ''
                                                        }`}
                                                    >
                                                        <Checkbox
                                                            id={`permission-${permission.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => 
                                                                handlePermissionChange(permission.id, checked as boolean)
                                                            }
                                                        />
                                                        <div className="flex-1">
                                                            <label
                                                                htmlFor={`permission-${permission.id}`}
                                                                className="text-sm font-medium cursor-pointer flex items-center space-x-2"
                                                            >
                                                                <span>{permission.display_name}</span>
                                                                {wasOriginal && (
                                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                                        Actual
                                                                    </span>
                                                                )}
                                                            </label>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                <span className="font-mono">{permission.name}</span>
                                                                {permission.description && (
                                                                    <p className="mt-1">{permission.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Error de validación */}
                    {errors.permissions && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                            {errors.permissions}
                        </div>
                    )}

                    {/* Botones de acción */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {selectedCount > 0 ? (
                                    <>
                                        Se aplicarán {selectedCount} permisos a todos los usuarios con el rol 
                                        <strong> {role.display_name}</strong>
                                    </>
                                ) : (
                                    <span className="text-red-600">
                                        ⚠️ Debes seleccionar al menos un permiso
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                <Link href="/admin/roles">
                                    <Button type="button" variant="outline">
                                        Cancelar
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing || selectedCount === 0}
                                    className="flex items-center space-x-2"
                                >
                                    {processing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            <span>Guardar Permisos</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </form>

                {/* Información adicional */}
                <Card className="p-4 bg-amber-50 border-amber-200">
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-amber-900">Consideraciones importantes</h4>
                            <ul className="text-sm text-amber-700 mt-2 space-y-1">
                                <li>• Los cambios se aplicarán inmediatamente a todos los usuarios con este rol</li>
                                <li>• Los permisos marcados como "Actual" son los que tiene actualmente el rol</li>
                                <li>• Puedes buscar permisos específicos usando la barra de búsqueda</li>
                                <li>• Usa "Seleccionar todo" en cada módulo para gestión rápida</li>
                                <li>• Asegúrate de que el rol tenga los permisos mínimos necesarios</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}