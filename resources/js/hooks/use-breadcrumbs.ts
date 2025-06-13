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

    // Breadcrumbs específicos más comunes
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

    const clientBreadcrumbs = {
        dashboard: () => userBase,

        certifications: {
            index: () => createUserBreadcrumbs([
                { title: 'Certificaciones', href: '/user/certifications' }
            ]),
            create: () => createUserBreadcrumbs([
                { title: 'Certificaciones', href: '/user/certifications' },
                { title: 'Crear Certificación', href: '/user/certifications/create' }
            ]),
            edit: () => createUserBreadcrumbs([
                { title: 'Certificaciones', href: '/user/certifications' },
                { title: 'Editar Certificación', href: '#' }
            ]),
        },
    };

    return {
        createAdminBreadcrumbs,
        createUserBreadcrumbs,
        clientBreadcrumbs,
        adminBreadcrumbs,
        adminBase,
        userBase,
    };
};