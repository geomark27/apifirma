// resources/js/pages/admin/users/Create.tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Role, type PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface CreateUserProps extends PageProps 
{
    roles: Role[];
}

export default function CreateUser({ roles }: CreateUserProps) {
    const { adminBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = adminBreadcrumbs.users.create();
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    // Formulario con Inertia
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [] as number[],
    });

    // Manejar envío del formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post('/admin/users', {
            onSuccess: () => {
                reset(); // Limpiar formulario en caso de éxito
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
            <Head title="Crear Usuario" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Crear Nuevo Usuario</h1>
                        <p className="text-muted-foreground">
                            Completa el formulario para agregar un nuevo usuario al sistema
                        </p>
                    </div>
                    <Link href="/admin/users">
                        <Button variant="outline" className="flex items-center space-x-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Volver a Lista</span>
                        </Button>
                    </Link>
                </div>

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
                                    Contraseña <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Mínimo 8 caracteres"
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
                                    Confirmar Contraseña <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showPasswordConfirmation ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Repite la contraseña"
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
                                    Selecciona al menos un rol para el usuario
                                </p>
                            </div>
                            
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {roles.map((role) => (
                                    <div
                                        key={role.id}
                                        className="flex items-start space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Checkbox
                                            id={`role-${role.id}`}
                                            checked={data.roles.includes(role.id)}
                                            onCheckedChange={(checked) => 
                                                handleRoleChange(role.id, checked as boolean)
                                            }
                                        />
                                        <div className="flex-1">
                                            <label
                                                htmlFor={`role-${role.id}`}
                                                className="text-sm font-medium cursor-pointer"
                                            >
                                                {role.display_name}
                                            </label>
                                            {role.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {role.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
                                        <span>Creando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        <span>Crear Usuario</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Información adicional */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                            <span className="text-white text-xs font-bold">i</span>
                        </div>
                        <div>
                            <h4 className="font-medium text-blue-900">Información importante</h4>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                <li>• La contraseña debe tener al menos 8 caracteres</li>
                                <li>• El email debe ser único en el sistema</li>
                                <li>• El usuario será marcado como verificado automáticamente</li>
                                <li>• Puedes asignar múltiples roles si es necesario</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}