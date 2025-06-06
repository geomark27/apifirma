// resources/js/pages/admin/users/Index.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User, type Role, type PageProps, type PaginatedUsers } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { UserPlus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface UserIndexProps extends PageProps 
{
    users: PaginatedUsers;
    roles: Role[];
    filters: {
        search?: string,
        role?: string,
    }
}

export default function UsersIndex({ users, roles, filters, flash}: UserIndexProps) {
    const { adminBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = adminBreadcrumbs.users.index();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');


    const handleFilter = () => {
        router.get('/admin/users', {
            search: search || undefined,
            role: selectedRole || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedRole('');
        router.get('/admin/users', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const deleteUser = (user: User) => {
        if (confirm(`¿Estás seguro de que quieres eliminar a ${user.name}?`)) {
            router.delete(`/admin/users/${user.id}`, {
                preserveScroll: true,
            });
        }
    };

    const goToPage = (url: string) => {
        router.get(url, {
            search: search || undefined,
            role: selectedRole || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

        return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Usuarios" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
                        <p className="text-muted-foreground">
                            Administra todos los usuarios del sistema
                        </p>
                    </div>
                    <Link href="/admin/users/create">
                        <Button className="flex items-center space-x-2">
                            <UserPlus className="h-4 w-4" />
                            <span>Crear Usuario</span>
                        </Button>
                    </Link>
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

                {/* Filtros */}
                <Card className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Buscar usuario</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por nombre o email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                    onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                />
                            </div>
                        </div>
                        
                        <div className="min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">Filtrar por rol</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos los roles</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {role.display_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                            <select
                                value={filters.sort || 'oldest'}
                                onChange={(e) => {
                                    router.get('/admin/users', {
                                        ...filters,
                                        sort: e.target.value
                                    }, {
                                        preserveState: true,
                                        replace: true,
                                    });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="oldest">Más antiguos primero</option>
                                <option value="newest">Más recientes primero</option>
                                <option value="name_asc">Nombre A-Z</option>
                                <option value="name_desc">Nombre Z-A</option>
                                <option value="email_asc">Email A-Z</option>
                                <option value="email_desc">Email Z-A</option>
                            </select>
                        </div>

                        <div className="flex space-x-2">
                            <Button onClick={handleFilter}>
                                Filtrar
                            </Button>
                            <Button variant="outline" onClick={clearFilters}>
                                Limpiar
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Tabla de Usuarios */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b">
                                <tr>
                                    <th className="text-left p-4 font-medium">Usuario</th>
                                    <th className="text-left p-4 font-medium">Email</th>
                                    <th className="text-left p-4 font-medium">Roles</th>
                                    <th className="text-left p-4 font-medium">Fecha Registro</th>
                                    <th className="text-right p-4 font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length > 0 ? (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm">{user.email}</div>
                                                {user.email_verified_at ? (
                                                    <div className="text-xs text-green-600">✓ Verificado</div>
                                                ) : (
                                                    <div className="text-xs text-red-600">✗ No verificado</div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles && user.roles.length > 0 ? (
                                                        user.roles.map((role) => (
                                                            <Badge key={role.id} variant="secondary">
                                                                {role.display_name}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">Sin roles</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm">
                                                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(user.created_at).toLocaleTimeString('es-ES', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link href={`/admin/users/${user.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => deleteUser(user)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            No se encontraron usuarios
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {users.data.length > 0 && (
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-gray-500">
                                Mostrando {users.from} a {users.to} de {users.total} usuarios
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                {users.current_page > 1 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => goToPage(users.prev_page_url!)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Anterior
                                    </Button>
                                )}
                                
                                <span className="text-sm">
                                    Página {users.current_page} de {users.last_page}
                                </span>
                                
                                {users.current_page < users.last_page && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => goToPage(users.next_page_url!)}
                                    >
                                        Siguiente
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}