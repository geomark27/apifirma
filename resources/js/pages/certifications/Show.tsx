import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Certification, type PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Building, 
    Calendar, 
    Download, 
    Edit, 
    FileText, 
    MapPin, 
    Phone, 
    Send, 
    Trash2, 
    User, 
    Mail,
    Eye,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react';
import { useState } from 'react';

interface ShowCertificationProps extends PageProps {
    certification: Certification & {
        current_age?: number;
        is_over_65?: boolean;
        formatted_created_at: string;
        formatted_updated_at: string;
        formatted_appointment_expiration?: string;
    };
    statusOptions: Record<string, string>;
    validationStatusOptions: Record<string, string>;
    applicationTypes: Record<string, string>;
    periods: Record<string, string>;
    canEdit: boolean;
    canDelete: boolean;
    canSubmit: boolean;
    hasCompanyDocs: boolean;
}

export default function ShowCertification({
    certification,
    statusOptions,
    validationStatusOptions,
    applicationTypes,
    periods,
    canEdit,
    canDelete,
    canSubmit,
    hasCompanyDocs
}: ShowCertificationProps) {
    const { userBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = userBreadcrumbs.certifications.show(certification.certification_number);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        if (confirm('¿Estás seguro de que deseas eliminar esta certificación? Esta acción no se puede deshacer.')) {
            setIsDeleting(true);
            router.delete(route('user.certifications.destroy', certification.id), {
                onFinish: () => setIsDeleting(false)
            });
        }
    };

    const handleSubmit = () => {
        if (confirm('¿Estás seguro de que deseas enviar esta certificación para revisión? Ya no podrás editarla.')) {
            router.post(route('user.certifications.submit', certification.id));
        }
    };

    const getStatusBadge = (status: string, options: Record<string, string>) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            'draft': 'outline',
            'pending': 'secondary',
            'in_review': 'default',
            'approved': 'default',
            'rejected': 'destructive',
            'completed': 'default',
            'REGISTERED': 'outline',
            'VALIDATING': 'secondary',
            'REFUSED': 'destructive',
            'ERROR': 'destructive',
            'APPROVED': 'default',
            'GENERATED': 'default',
            'EXPIRED': 'destructive',
        };

        return (
            <Badge variant={variants[status] || 'outline'}>
                {options[status] || status}
            </Badge>
        );
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, JSX.Element> = {
            'draft': <Clock className="h-4 w-4" />,
            'pending': <AlertCircle className="h-4 w-4" />,
            'in_review': <Eye className="h-4 w-4" />,
            'approved': <CheckCircle className="h-4 w-4" />,
            'rejected': <XCircle className="h-4 w-4" />,
            'completed': <CheckCircle className="h-4 w-4" />,
            'REGISTERED': <Clock className="h-4 w-4" />,
            'VALIDATING': <Eye className="h-4 w-4" />,
            'REFUSED': <XCircle className="h-4 w-4" />,
            'ERROR': <AlertCircle className="h-4 w-4" />,
            'APPROVED': <CheckCircle className="h-4 w-4" />,
            'GENERATED': <CheckCircle className="h-4 w-4" />,
            'EXPIRED': <XCircle className="h-4 w-4" />,
        };

        return icons[status] || <Clock className="h-4 w-4" />;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Certificación #${certification.certification_number}`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('user.certifications.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                                Volver
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Certificación #{certification.certification_number}
                            </h1>
                            <p className="text-muted-foreground">
                                {applicationTypes[certification.applicationType]} • {periods[certification.period]}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        {canSubmit && (
                            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                                <Send className="h-4 w-4" />
                                Enviar para Revisión
                            </Button>
                        )}
                        {canEdit && (
                            <Button asChild variant="outline">
                                <Link href={route('user.certifications.edit', certification.id)}>
                                    <Edit className="h-4 w-4" />
                                    Editar
                                </Link>
                            </Button>
                        )}
                        {canDelete && (
                            <Button 
                                variant="destructive" 
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                <Trash2 className="h-4 w-4" />
                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Estados */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Estado de la Solicitud
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Estado Interno:</span>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(certification.status)}
                                    {getStatusBadge(certification.status, statusOptions)}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Estado Validación:</span>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(certification.validationStatus)}
                                    {getStatusBadge(certification.validationStatus, validationStatusOptions)}
                                </div>
                            </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <span className="text-sm text-muted-foreground">Creado:</span>
                                <p className="text-sm font-medium">{certification.formatted_created_at}</p>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Actualizado:</span>
                                <p className="text-sm font-medium">{certification.formatted_updated_at}</p>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Ref. Transacción:</span>
                                <p className="text-sm font-medium font-mono">{certification.referenceTransaction}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Información Personal */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Información Personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <span className="text-sm text-muted-foreground">Cédula:</span>
                                    <p className="font-medium">{certification.identificationNumber}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Código Dactilar:</span>
                                    <p className="font-medium font-mono">{certification.fingerCode}</p>
                                </div>
                            </div>
                            
                            <div>
                                <span className="text-sm text-muted-foreground">Nombre Completo:</span>
                                <p className="font-medium">
                                    {certification.applicantName} {certification.applicantLastName}
                                    {certification.applicantSecondLastName && ` ${certification.applicantSecondLastName}`}
                                </p>
                            </div>

                            {certification.current_age && (
                                <div className="flex items-center gap-4">
                                    <div>
                                        <span className="text-sm text-muted-foreground">Edad:</span>
                                        <p className="font-medium">{certification.current_age} años</p>
                                    </div>
                                    {certification.is_over_65 && (
                                        <Badge variant="outline" className="text-orange-600">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            Mayor de 65
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Información de Contacto */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Contacto y Ubicación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    Email:
                                </span>
                                <p className="font-medium">{certification.emailAddress}</p>
                            </div>
                            
                            <div>
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    Teléfono:
                                </span>
                                <p className="font-medium">{certification.cellphoneNumber}</p>
                            </div>

                            <div>
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    Ubicación:
                                </span>
                                <p className="font-medium">{certification.city}, {certification.province}</p>
                                <p className="text-sm text-muted-foreground">{certification.address}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información Empresarial */}
                    {hasCompanyDocs && (
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building className="h-5 w-5" />
                                    Información Empresarial
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {certification.companyRuc && (
                                        <div>
                                            <span className="text-sm text-muted-foreground">RUC:</span>
                                            <p className="font-medium">{certification.companyRuc}</p>
                                        </div>
                                    )}
                                    {certification.companySocialReason && (
                                        <div>
                                            <span className="text-sm text-muted-foreground">Razón Social:</span>
                                            <p className="font-medium">{certification.companySocialReason}</p>
                                        </div>
                                    )}
                                    {certification.positionCompany && (
                                        <div>
                                            <span className="text-sm text-muted-foreground">Cargo:</span>
                                            <p className="font-medium">{certification.positionCompany}</p>
                                        </div>
                                    )}
                                    {certification.formatted_appointment_expiration && (
                                        <div>
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Vencimiento Nombramiento:
                                            </span>
                                            <p className="font-medium">{certification.formatted_appointment_expiration}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Documentos y Archivos */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Documentos Adjuntos
                            </CardTitle>
                            <CardDescription>
                                Archivos subidos para la certificación
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {/* Documentos de identidad */}
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm">Documentos de Identidad</h4>
                                    {certification.identificationFront && (
                                        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                            <a href={`/storage/${certification.identificationFront}`} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                                Cédula Frontal
                                            </a>
                                        </Button>
                                    )}
                                    {certification.identificationBack && (
                                        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                            <a href={`/storage/${certification.identificationBack}`} target="_blank">
                                                <Download className="h-4 w-4" />
                                                Cédula Posterior
                                            </a>
                                        </Button>
                                    )}
                                    {certification.identificationSelfie && (
                                        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                            <a href={`/storage/${certification.identificationSelfie}`} target="_blank">
                                                <Download className="h-4 w-4" />
                                                Selfie con Cédula
                                            </a>
                                        </Button>
                                    )}
                                </div>

                                {/* Documentos empresariales */}
                                {hasCompanyDocs && (
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm">Documentos Empresariales</h4>
                                        {certification.pdfCompanyRuc && (
                                            <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                                <a href={`/storage/${certification.pdfCompanyRuc}`} target="_blank">
                                                    <Download className="h-4 w-4" />
                                                    RUC de la Empresa
                                                </a>
                                            </Button>
                                        )}
                                        {certification.pdfRepresentativeAppointment && (
                                            <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                                <a href={`/storage/${certification.pdfRepresentativeAppointment}`} target="_blank">
                                                    <Download className="h-4 w-4" />
                                                    Nombramiento
                                                </a>
                                            </Button>
                                        )}
                                        {certification.pdfAppointmentAcceptance && (
                                            <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                                <a href={`/storage/${certification.pdfAppointmentAcceptance}`} target="_blank">
                                                    <Download className="h-4 w-4" />
                                                    Aceptación Nombramiento
                                                </a>
                                            </Button>
                                        )}
                                        {certification.pdfCompanyConstitution && (
                                            <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                                <a href={`/storage/${certification.pdfCompanyConstitution}`} target="_blank">
                                                    <Download className="h-4 w-4" />
                                                    Constitución Empresa
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Video de autorización */}
                                {certification.authorizationVideo && (
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm">Video de Autorización</h4>
                                        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                            <a href={`/storage/${certification.authorizationVideo}`} target="_blank">
                                                <Download className="h-4 w-4" />
                                                Video Autorización
                                            </a>
                                        </Button>
                                        {certification.is_over_65 && (
                                            <p className="text-xs text-orange-600">
                                                * Requerido para mayores de 65 años
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}