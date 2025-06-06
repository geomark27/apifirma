import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, Shield, BarChart3 } from 'lucide-react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#c',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const user = auth.user;

    // Navegación base (todos los usuarios autenticados)
    const baseNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
    ];

    // Navegación de administrador
    const adminNavItems: NavItem[] = [
        {
            title: 'Gestión de Usuarios',
            href: '/admin/users',
            icon: Users,
        },
        {
            title: 'Gestión de Roles',
            href: '/admin/roles',
            icon: Shield,
        },
    ];

    // Determinar elementos de navegación según permisos
    const getNavItems = (): NavItem[] => {
        let navItems = [...baseNavItems];

        // Si es admin, agregar elementos de administración
        if (user?.roles?.some((role: any) => role.name === 'admin')) {
            navItems.push(...adminNavItems);
        }

        return navItems;
    };

    const mainNavItems = getNavItems();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}