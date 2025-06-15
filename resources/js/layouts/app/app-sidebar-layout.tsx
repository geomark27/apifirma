// resources/js/layouts/app/app-sidebar-layout.tsx - Layout horizontal completamente limpio
import { AppSidebar } from '@/components/app-sidebar'; // Ahora es navbar
import { 
    Breadcrumb, 
    BreadcrumbItem as BreadcrumbUIItem, 
    BreadcrumbLink, 
    BreadcrumbList, 
    BreadcrumbPage, 
    BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren, Fragment } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <div className="min-h-screen bg-background">
            {/* Navbar Horizontal (antes era sidebar) */}
            <AppSidebar />
            
            {/* Main Content */}
            <main className="flex-1">
                {/* Breadcrumbs Section */}
                {breadcrumbs.length > 0 && (
                    <div className="border-b bg-muted/40">
                        <div className="container mx-auto px-4 py-3">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {breadcrumbs.map((breadcrumb, index) => (
                                        <Fragment key={breadcrumb.href}>
                                            <BreadcrumbUIItem>
                                                {index === breadcrumbs.length - 1 ? (
                                                    <BreadcrumbPage className="font-medium">
                                                        {breadcrumb.title}
                                                    </BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink href={breadcrumb.href}>
                                                        {breadcrumb.title}
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbUIItem>
                                            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                                        </Fragment>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </div>
                )}
                
                {/* Page Content */}
                <div className="container mx-auto px-4 py-6">
                    {children}
                </div>
            </main>
        </div>
    );
}