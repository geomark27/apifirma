// resources/js/pages/Admin/Dashboard.tsx
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User, type PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Users, Shield, Key, UserPlus, ShieldPlus } from 'lucide-react';

interface AdminDashboardProps extends PageProps {
    stats: {
        total_users: number;
        total_roles: number;
        total_permissions: number;
        recent_users: User[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
];

export default function AdminDashboard({ stats }: AdminDashboardProps) {
    const statCards = [
        {
            title: 'Total Usuarios',
            value: stats.total_users,
            icon: Users,
            href: '/admin/users',
            color: 'bg-blue-500',
        },
        {
            title: 'Roles',
            value: stats.total_roles,
            icon: Shield,
            href: '/admin/roles',
            color: 'bg-green-500',
        },
        {
            title: 'Permisos',
            value: stats.total_permissions,
            icon: Key,
            href: '#',
            color: 'bg-purple-500',
        },
    ];

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
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {stat.title}
                                            </p>
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>

                {/* Recent Users */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Usuarios Recientes</h3>
                        <Link
                            href="/admin/users"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Ver todos →
                        </Link>
                    </div>
                    
                    <div className="space-y-3">
                        {stats.recent_users.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex space-x-1">
                                    {user.roles?.map((role) => (
                                        <Badge key={role.id} variant="secondary">
                                            {role.display_name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Quick Actions */}
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