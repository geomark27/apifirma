// resources/js/hooks/use-breadcrumbs.ts
import { type BreadcrumbItem } from '@/types';

export const useBreadcrumbs = () => {
    // Breadcrumbs base para admin
    const adminBase: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/admin/dashboard',
        },
    ];

    // Breadcrumbs base para user
    const userBase: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/user/dashboard',
        },
    ];

    // Función para crear breadcrumbs de admin
    const createAdminBreadcrumbs = (additionalItems: BreadcrumbItem[] = []): BreadcrumbItem[] => {
        return [...adminBase, ...additionalItems];
    };

    // Función para crear breadcrumbs de user
    const createUserBreadcrumbs = (additionalItems: BreadcrumbItem[] = []): BreadcrumbItem[] => {
        return [...userBase, ...additionalItems];
    };

    // Breadcrumbs específicos más comunes para ADMIN
    const adminBreadcrumbs = {
        dashboard: () => adminBase,
        
        users: {
            index: () => createAdminBreadcrumbs([
                { title: 'Usuarios', href: '/admin/users' }
            ]),
            create: () => createAdminBreadcrumbs([
                { title: 'Usuarios', href: '/admin/users' },
                { title: 'Crear Usuario', href: '/admin/users/create' }
            ]),
            edit: () => createAdminBreadcrumbs([
                { title: 'Usuarios', href: '/admin/users' },
                { title: 'Editar Usuario', href: '#' }
            ]),
        },

        roles: {
            index: () => createAdminBreadcrumbs([
                { title: 'Gestión de Roles', href: '/admin/roles' }
            ]),
            edit: () => createAdminBreadcrumbs([
                { title: 'Gestión de Roles', href: '/admin/roles' },
                { title: 'Editar Rol', href: '#' }
            ]),
            permissions: () => createAdminBreadcrumbs([
                { title: 'Gestión de Roles', href: '/admin/roles' },
                { title: 'Gestionar Permisos', href: '#' }
            ]),
            stats: () => createAdminBreadcrumbs([
                { title: 'Gestión de Roles', href: '/admin/roles' },
                { title: 'Estadísticas de Rol', href: '#' }
            ]),
        },
    };

    // Breadcrumbs específicos para USER
    const userBreadcrumbs = {
        dashboard: () => userBase,

        certifications: {
            index: () => createUserBreadcrumbs([
                { title: 'Mis Certificaciones', href: '/user/certifications' }
            ]),
            create: () => createUserBreadcrumbs([
                { title: 'Mis Certificaciones', href: '/user/certifications' },
                { title: 'Nueva Certificación', href: '/user/certifications/create' }
            ]),
            show: (id?: number | string) => createUserBreadcrumbs([
                { title: 'Mis Certificaciones', href: '/user/certifications' },
                { title: `Certificación ${id ? `#${id}` : ''}`, href: '#' }
            ]),
            edit: (id?: number | string) => createUserBreadcrumbs([
                { title: 'Mis Certificaciones', href: '/user/certifications' },
                { title: `Certificación ${id ? `#${id}` : ''}`, href: id ? `/user/certifications/${id}` : '#' },
                { title: 'Editar', href: '#' }
            ]),
        },
    };

    // Mantener clientBreadcrumbs para compatibilidad hacia atrás
    const clientBreadcrumbs = userBreadcrumbs;

    return {
        createAdminBreadcrumbs,
        createUserBreadcrumbs,
        clientBreadcrumbs,
        userBreadcrumbs,
        adminBreadcrumbs,
        adminBase,
        userBase,
    };
};