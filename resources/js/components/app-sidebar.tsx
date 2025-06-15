// resources/js/components/app-sidebar.tsx - Convertido a navbar horizontal
import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { 
    NavigationMenu, 
    NavigationMenuItem, 
    NavigationMenuLink, 
    NavigationMenuList,
    navigationMenuTriggerStyle 
} from '@/components/ui/navigation-menu';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { type NavItem } from '@/types';
import { BookOpen, Folder, LayoutGrid, Users, Shield, Menu, Settings, LogOut, ChevronDown } from 'lucide-react';
import { route } from 'ziggy-js';
import { cn } from '@/lib/utils';
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
    const page = usePage();
    const { auth } = page.props as any;
    const user = auth.user;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Obtener URL actual de forma más robusta
    const currentUrl = page.url || window.location.pathname || '';
    
    // Función para verificar si una ruta está activa
    const isActiveRoute = (href: string): boolean => {
        // Verificar que currentUrl existe antes de usar métodos de string
        if (!currentUrl || typeof currentUrl !== 'string') {
            return false;
        }
        
        // Para dashboard, verificar rutas exactas
        if (href === '/dashboard') {
            return currentUrl === '/dashboard' || currentUrl === '/' || currentUrl === '';
        }
        
        // Para otras rutas, verificar que empiece con la ruta
        return currentUrl.startsWith(href);
    };

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

    const clientNavItems: NavItem[] = [
        {
            title: 'Gestionar certificados',
            href: '/user/certifications',
            icon: Shield,
        },
    ];

    // Determinar elementos de navegación según permisos
    const getNavItems = (): NavItem[] => {
        let navItems = [...baseNavItems];

        // Si es admin, agregar elementos de administración
        if (user?.roles?.some((role: any) => role.name === 'admin')) {
            navItems.push(...adminNavItems);
        } else {
            navItems.push(...clientNavItems);
        }

        return navItems;
    };

    const mainNavItems = getNavItems();

    const handleLogout = () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            // Usar router de Inertia para logout
            router.post(route('logout'));
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <div className="flex items-center">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <AppLogo />
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <NavigationMenu className="hidden md:flex">
                    <NavigationMenuList>
                        {mainNavItems.map((item) => (
                            <NavigationMenuItem key={item.title}>
                                <NavigationMenuLink 
                                    asChild
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                                        isActiveRoute(item.href) 
                                            ? "bg-accent text-accent-foreground shadow-sm" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Link href={item.href} className="flex items-center gap-2">
                                        {item.icon && (
                                            <div className="flex items-center justify-center w-6 h-6">
                                                <item.icon className="h-4 w-4" />
                                            </div>
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                {/* User Menu & Mobile Menu */}
                <div className="flex items-center space-x-2">
                    {/* Desktop User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild className="hidden md:flex">
                            <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{user.name}</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="flex items-center justify-start gap-2 p-2">
                                <div className="flex flex-col space-y-1 leading-none">
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings/profile" className="flex items-center">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configuración
                                </Link>
                            </DropdownMenuItem>
                            
                            {/* Footer nav items en el dropdown */}
                            <DropdownMenuSeparator />
                            {footerNavItems.map((item) => (
                                <DropdownMenuItem key={item.title} asChild>
                                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                        {item.title}
                                    </a>
                                </DropdownMenuItem>
                            ))}
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                <LogOut className="mr-2 h-4 w-4" />
                                Cerrar Sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile Menu */}
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Abrir menú</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72">
                            <SheetHeader>
                                <SheetTitle className="text-left">Menú</SheetTitle>
                            </SheetHeader>
                            
                            <div className="mt-6 flex flex-col space-y-6">
                                {/* User Info Mobile */}
                                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                </div>

                                {/* Navigation Mobile */}
                                <nav className="flex flex-col space-y-2">
                                    {mainNavItems.map((item) => (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                                isActiveRoute(item.href) 
                                                    ? "bg-accent text-accent-foreground" 
                                                    : "hover:bg-accent hover:text-accent-foreground"
                                            )}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {item.icon && <item.icon className="h-4 w-4" />}
                                            <span>{item.title}</span>
                                        </Link>
                                    ))}
                                </nav>

                                {/* Footer nav items en mobile */}
                                <div className="border-t pt-6 space-y-2">
                                    <Link
                                        href="/settings/profile"
                                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Settings className="h-4 w-4" />
                                        <span>Configuración</span>
                                    </Link>
                                    
                                    {footerNavItems.map((item) => (
                                        <a
                                            key={item.title}
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {item.icon && <item.icon className="h-4 w-4" />}
                                            <span>{item.title}</span>
                                        </a>
                                    ))}
                                    
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            handleLogout();
                                        }}
                                        className="flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}