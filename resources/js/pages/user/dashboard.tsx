// resources/js/pages/user/Dashboard.tsx
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Role, type PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import { User, Shield, Check, Calendar, Clock, Settings, Lock, Palette, HelpCircle } from 'lucide-react';

interface UserDashboardProps extends PageProps {
    userInfo: {
        name: string;
        email: string;
        roles: Role[];
        permissions: string[];
    };
}

export default function UserDashboard({ userInfo }: UserDashboardProps) {

    const { clientBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = clientBreadcrumbs.dashboard();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mi Dashboard" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Welcome Header */}
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {userInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {getGreeting()}, {userInfo.name}!
                        </h1>
                        <p className="text-muted-foreground">
                            Bienvenido a tu panel de usuario
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* User Info Card */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <User className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-semibold">Mi Información</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                                <p className="text-base">{userInfo.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <p className="text-base">{userInfo.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Roles</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {userInfo.roles?.map((role) => (
                                        <Badge key={role.id} variant="secondary">
                                            {role.display_name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Permissions Card */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <Shield className="h-5 w-5 text-green-600" />
                            <h3 className="text-lg font-semibold">Mis Permisos</h3>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {userInfo.permissions && userInfo.permissions.length > 0 ? (
                                userInfo.permissions.map((permission, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center space-x-2 p-2 rounded bg-muted/50"
                                    >
                                        <Check className="h-4 w-4 text-green-600" />
                                        <span className="text-sm">{permission}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No tienes permisos específicos asignados.
                                </p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Activity/Stats Section */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <h4 className="font-semibold">Último Acceso</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            {new Date().toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </Card>

                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Clock className="h-6 w-6 text-green-600" />
                        </div>
                        <h4 className="font-semibold">Hora Actual</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            {new Date().toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </Card>

                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Settings className="h-6 w-6 text-purple-600" />
                        </div>
                        <h4 className="font-semibold">Configuración</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Personaliza tu cuenta
                        </p>
                    </Card>
                </div>

                {/* Quick Links */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <a
                            href="/settings/profile"
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Mi Perfil</span>
                        </a>
                        
                        <a
                            href="/settings/password"
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <Lock className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Cambiar Contraseña</span>
                        </a>
                        
                        <a
                            href="/settings/appearance"
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <Palette className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium">Apariencia</span>
                        </a>
                        
                        <button
                            onClick={() => {/* Add help functionality */}}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                            <HelpCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium">Ayuda</span>
                        </button>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}