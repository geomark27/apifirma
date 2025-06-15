// resources/js/pages/Certifications/Index.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { type Certification, type PaginatedCertifications, type PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { 
    FileText, Plus, Search, Eye, Edit, Trash2, Clock, 
    CheckCircle, XCircle, AlertCircle, Filter
} from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js'

interface CertificationsIndexProps extends PageProps {
    certifications: PaginatedCertifications;
    filters: {
        search?: string;
        status?: string;
        type?: string;
    };
    statusOptions: Record<string, string>;
    applicationTypes: Record<string, string>;
}

export default function CertificationsIndex({ 
    certifications, 
    filters, 
    statusOptions, 
    applicationTypes,
    flash 
}: CertificationsIndexProps) {
    const { userBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = userBreadcrumbs.certifications.index();

    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');

    // Función para aplicar filtros
    const handleFilter = () => {
        router.get(route('user.certifications.index'), {
            search: search || undefined,
            status: selectedStatus || undefined,
            type: selectedType || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    // Función para limpiar filtros
    const clearFilters = () => {
        setSearch('');
        setSelectedStatus('');
        setSelectedType('');
        router.get(route('user.certifications.index'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    // Función para eliminar certificación
    const deleteCertification = (certification: Certification) => {
        if (confirm(`¿Estás seguro de que quieres eliminar esta certificación?`)) {
            router.delete(route('user.certifications.destroy', certification.id), {
                preserveScroll: true,
            });
        }
    };

    // Función para obtener color del estado
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'in_review': return 'bg-blue-100 text-blue-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'completed': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Función para obtener icono del estado
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft': return Clock;
            case 'pending': return AlertCircle;
            case 'in_review': return Clock;
            case 'approved': return CheckCircle;
            case 'rejected': return XCircle;
            case 'completed': return CheckCircle;
            default: return Clock;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mis Certificaciones" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Mis Certificaciones</h1>
                        <p className="text-muted-foreground">
                            Gestiona tus solicitudes de certificados digitales
                        </p>
                    </div>
                    <Link href={route('user.certifications.create')}>
                        <Button className="flex items-center space-x-2">
                            <Plus className="h-4 w-4" />
                            <span>Nueva Certificación</span>
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
                            <label className="text-sm font-medium mb-2 block">Buscar certificación</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por referencia, nombre..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                    onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                />
                            </div>
                        </div>
                        
                        <div className="min-w-[180px]">
                            <label className="text-sm font-medium mb-2 block">Estado</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos los estados</option>
                                {Object.entries(statusOptions).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="min-w-[180px]">
                            <label className="text-sm font-medium mb-2 block">Tipo</label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos los tipos</option>
                                {Object.entries(applicationTypes).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex space-x-2">
                            <Button onClick={handleFilter}>
                                <Filter className="h-4 w-4 mr-1" />
                                Filtrar
                            </Button>
                            <Button variant="outline" onClick={clearFilters}>
                                Limpiar
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Lista de Certificaciones */}
                <div className="grid gap-4">
                    {certifications.data.length > 0 ? (
                        certifications.data.map((certification) => {
                            const StatusIcon = getStatusIcon(certification.status);
                            const statusColor = getStatusColor(certification.status);
                            
                            return (
                                <Card key={certification.id} className="p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4 flex-1">
                                            <div className="bg-blue-100 p-3 rounded-lg">
                                                <FileText className="h-6 w-6 text-blue-600" />
                                            </div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">
                                                            {certification.applicantName} {certification.applicantLastName}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            Ref: {certification.referenceTransaction}
                                                        </p>
                                                    </div>
                                                    <Badge className={statusColor}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {statusOptions[certification.status]}
                                                    </Badge>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Tipo:</span>
                                                        <p className="font-medium">
                                                            {applicationTypes[certification.applicationType]}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Cédula:</span>
                                                        <p className="font-medium">{certification.identificationNumber}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Período:</span>
                                                        <p className="font-medium">{certification.period.replace('_', ' ')}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Creado:</span>
                                                        <p className="font-medium">
                                                            {new Date(certification.created_at).toLocaleDateString('es-ES')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2 ml-4">
                                            <Link href={route('user.certifications.show', certification.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            
                                            {certification.status === 'draft' && (
                                                <>
                                                    <Link href={route('user.certifications.edit', certification.id)}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => deleteCertification(certification)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    ) : (
                        <Card className="p-8 text-center">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="font-medium text-gray-900 mb-2">No hay certificaciones</h3>
                            <p className="text-gray-500 mb-4">
                                Aún no has creado ninguna solicitud de certificación.
                            </p>
                            <Link href="/certifications/create">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Crear Primera Certificación
                                </Button>
                            </Link>
                        </Card>
                    )}
                </div>

                {/* Paginación */}
                {certifications.data.length > 0 && certifications.last_page > 1 && (
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Mostrando {certifications.from} a {certifications.to} de {certifications.total} certificaciones
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                {certifications.prev_page_url && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(certifications.prev_page_url!)}
                                    >
                                        Anterior
                                    </Button>
                                )}
                                
                                <span className="text-sm">
                                    Página {certifications.current_page} de {certifications.last_page}
                                </span>
                                
                                {certifications.next_page_url && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(certifications.next_page_url!)}
                                    >
                                        Siguiente
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}