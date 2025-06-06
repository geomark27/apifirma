// resources/js/pages/admin/users/Edit.tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Role, type User, type PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface EditUserProps extends PageProps 
{
    user: User;
    roles: Role[];
}

export default function EditUser({ user, roles }: EditUserProps) {
    const { adminBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = adminBreadcrumbs.users.edit();
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    // Formulario con Inertia - Pre-llenar con datos del usuario
    const { data, setData, put, processing, errors, reset } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        roles: user.roles?.map(role => role.id) || [],
    });

    // Manejar envío del formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        put(`/admin/users/${user.id}`, {
            onSuccess: () => {
                setData(prev => ({
                    ...prev,
                    password: '',
                    password_confirmation: ''
                }));
            },
        });
    };

    // Manejar selección de roles
    const handleRoleChange = (roleId: number, checked: boolean) => {
        if (checked) {
            setData('roles', [...data.roles, roleId]);
        } else {
            setData('roles', data.roles.filter(id => id !== roleId));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Usuario: ${user.name}`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Editar Usuario: {user.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Modifica la información del usuario y sus roles
                        </p>
                    </div>
                    <Link href="/admin/users">
                        <Button variant="outline" className="flex items-center space-x-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Volver a Lista</span>
                        </Button>
                    </Link>
                </div>

                {/* Información del Usuario */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center space-x-3">
                        <div className="mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono text-gray-900 dark:text-gray-100">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-medium text-blue-900">Usuario ID: {user.id}</h3>
                            <p className="text-sm text-blue-700">
                                Registrado el: {new Date(user.created_at).toLocaleDateString('es-ES')}
                            </p>
                            {user.email_verified_at && (
                                <p className="text-xs text-green-700">✓ Email verificado</p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Formulario */}
                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Nombre */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nombre Completo <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Correo Electrónico <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Ej: juan@ejemplo.com"
                                    className={errors.email ? 'border-red-500' : ''}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Nueva Contraseña <span className="text-gray-500">(Opcional)</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Dejar vacío para mantener actual"
                                        className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirmar Contraseña */}
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">
                                    Confirmar Nueva Contraseña
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showPasswordConfirmation ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Repetir nueva contraseña"
                                        className={errors.password_confirmation ? 'border-red-500 pr-10' : 'pr-10'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswordConfirmation ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="text-sm text-red-600">{errors.password_confirmation}</p>
                                )}
                            </div>
                        </div>

                        {/* Selección de Roles */}
                        <div className="space-y-4">
                            <div>
                                <Label className="text-base font-medium">
                                    Roles del Usuario <span className="text-red-500">*</span>
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">
                                    Selecciona los roles que tendrá este usuario
                                </p>
                            </div>
                            
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {roles.map((role) => {
                                    const isChecked = data.roles.includes(role.id);
                                    const wasOriginalRole = user.roles?.some(userRole => userRole.id === role.id);
                                    
                                    return (
                                        <div
                                            key={role.id}
                                            className={`flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                                isChecked ? 'border-blue-200' : ''
                                            }`}
                                        >
                                            <Checkbox
                                                id={`role-${role.id}`}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => 
                                                    handleRoleChange(role.id, checked as boolean)
                                                }
                                            />
                                            <div className="flex-1">
                                                <label
                                                    htmlFor={`role-${role.id}`}
                                                    className="text-sm font-medium cursor-pointer flex items-center space-x-2"
                                                >
                                                    <span>{role.display_name}</span>
                                                    {wasOriginalRole && (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                            Actual
                                                        </span>
                                                    )}
                                                </label>
                                                {role.description && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {role.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {errors.roles && (
                                <p className="text-sm text-red-600">{errors.roles}</p>
                            )}
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                            <Link href="/admin/users">
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
                                        <span>Actualizar Usuario</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Información de seguridad */}
                <Card className="p-4 bg-amber-50 border-amber-200">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-amber-900">Consideraciones importantes</h4>
                            <ul className="text-sm text-amber-700 mt-2 space-y-1">
                                <li>• Deja las contraseñas vacías si no quieres cambiarlas</li>
                                <li>• Los cambios de roles toman efecto inmediatamente</li>
                                <li>• El usuario será notificado por email sobre cambios importantes</li>
                                <li>• No puedes eliminar todos los roles de un usuario</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}