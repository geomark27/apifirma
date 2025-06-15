import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { type Certification, type PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    ArrowLeft, 
    ArrowRight, 
    Building, 
    CalendarIcon, 
    Download, 
    FileText, 
    MapPin, 
    Save, 
    Shield, 
    Upload, 
    User, 
    AlertCircle,
    Eye,
    CheckCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface EditCertificationProps extends PageProps {
    certification: Certification & {
        current_age?: number;
        is_over_65?: boolean;
    };
    applicationTypes: Record<string, string>;
    periods: Record<string, string>;
    cities: string[];
    provinces: string[];
    statusOptions: Record<string, string>;
    validationStatusOptions: Record<string, string>;
    canEdit: boolean;
    hasCompanyDocs: boolean;
}

interface FormData {
    // Información personal
    identificationNumber: string;
    applicantName: string;
    applicantLastName: string;
    applicantSecondLastName: string;
    dateOfBirth: string;
    fingerCode: string;
    emailAddress: string;
    cellphoneNumber: string;
    
    // Ubicación
    city: string;
    province: string;
    address: string;
    countryCode: string;
    
    // Información empresarial
    companyRuc: string;
    positionCompany: string;
    companySocialReason: string;
    appointmentExpirationDate: string;
    
    // Tipo de documento y aplicación
    documentType: string;
    applicationType: string;
    
    // Transacción
    referenceTransaction: string;
    period: string;
    
    // Archivos (solo nuevos archivos)
    identificationFront: File | null;
    identificationBack: File | null;
    identificationSelfie: File | null;
    pdfCompanyRuc: File | null;
    pdfRepresentativeAppointment: File | null;
    pdfAppointmentAcceptance: File | null;
    pdfCompanyConstitution: File | null;
    authorizationVideo: File | null;
    
    // Términos
    terms_accepted: boolean;
    
    [key: string]: any;
}

export default function EditCertification({
    certification,
    applicationTypes,
    periods,
    cities,
    provinces,
    statusOptions,
    validationStatusOptions,
    canEdit,
    hasCompanyDocs
}: EditCertificationProps) {
    const { userBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = userBreadcrumbs.certifications.edit(certification.certification_number);
    
    const [currentStep, setCurrentStep] = useState(1);
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const totalSteps = 4;

    const { data, setData, put, processing, errors, progress } = useForm<FormData>({
        // Pre-llenar con datos existentes
        identificationNumber: certification.identificationNumber || '',
        applicantName: certification.applicantName || '',
        applicantLastName: certification.applicantLastName || '',
        applicantSecondLastName: certification.applicantSecondLastName || '',
        dateOfBirth: certification.dateOfBirth ? new Date(certification.dateOfBirth).toISOString().split('T')[0] : '',
        fingerCode: certification.fingerCode || '',
        emailAddress: certification.emailAddress || '',
        cellphoneNumber: certification.cellphoneNumber?.startsWith('+593') ? certification.cellphoneNumber : '+593' + (certification.cellphoneNumber || ''),
        
        city: certification.city || '',
        province: certification.province || '',
        address: certification.address || '',
        countryCode: certification.countryCode || 'ECU',
        
        companyRuc: certification.companyRuc || '',
        positionCompany: certification.positionCompany || '',
        companySocialReason: certification.companySocialReason || '',
        appointmentExpirationDate: certification.appointmentExpirationDate || '',
        
        documentType: certification.documentType || 'CI',
        applicationType: certification.applicationType || '',
        
        referenceTransaction: certification.referenceTransaction || '',
        period: certification.period || '',
        
        // Archivos nuevos (vacíos inicialmente)
        identificationFront: null,
        identificationBack: null,
        identificationSelfie: null,
        pdfCompanyRuc: null,
        pdfRepresentativeAppointment: null,
        pdfAppointmentAcceptance: null,
        pdfCompanyConstitution: null,
        authorizationVideo: null,
        
        terms_accepted: Boolean(certification.terms_accepted),
    });

    // Detectar si requiere documentos empresariales
    const requiresCompanyDocs = data.applicationType === 'LEGAL_REPRESENTATIVE';
    const isNaturalWithRuc = data.applicationType === 'NATURAL_PERSON' && data.companyRuc;
    const isOver65 = certification.is_over_65;

    // Limpiar campos empresariales si no son necesarios
    useEffect(() => {
        if (data.applicationType === 'NATURAL_PERSON' && !data.companyRuc) {
            setData(prev => ({
                ...prev,
                positionCompany: '',
                companySocialReason: '',
                appointmentExpirationDate: '',
            }));
        }
    }, [data.applicationType, data.companyRuc]);

    // Manejar subida de archivos
    const handleFileChange = (fieldName: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setData(fieldName, file);
        }
    };

    // Validación de pasos
    const validateStep = (step: number): boolean => {
        const newStepErrors: Record<string, string> = {};

        switch (step) {
            case 1: // Información personal
                if (!data.identificationNumber) newStepErrors.identificationNumber = 'Requerido';
                if (!data.applicantName) newStepErrors.applicantName = 'Requerido';
                if (!data.applicantLastName) newStepErrors.applicantLastName = 'Requerido';
                if (!data.fingerCode) newStepErrors.fingerCode = 'Requerido';
                if (!data.emailAddress) newStepErrors.emailAddress = 'Requerido';
                if (!data.cellphoneNumber) newStepErrors.cellphoneNumber = 'Requerido';
                if (!data.dateOfBirth) newStepErrors.dateOfBirth = 'Requerido';
                break;

            case 2: // Ubicación
                if (!data.city) newStepErrors.city = 'Requerido';
                if (!data.province) newStepErrors.province = 'Requerido';
                if (!data.address) newStepErrors.address = 'Requerido';
                break;

            case 3: // Tipo y transacción
                if (!data.applicationType) newStepErrors.applicationType = 'Requerido';
                if (!data.period) newStepErrors.period = 'Requerido';
                if (!data.referenceTransaction) newStepErrors.referenceTransaction = 'Requerido';
                
                if (requiresCompanyDocs) {
                    if (!data.companyRuc) newStepErrors.companyRuc = 'Requerido';
                    if (!data.positionCompany) newStepErrors.positionCompany = 'Requerido';
                    if (!data.companySocialReason) newStepErrors.companySocialReason = 'Requerido';
                    if (!data.appointmentExpirationDate) newStepErrors.appointmentExpirationDate = 'Requerido';
                }
                break;

            case 4: // Archivos
                if (!data.terms_accepted) newStepErrors.terms_accepted = 'Debe aceptar los términos';
                break;
        }

        setStepErrors(newStepErrors);
        return Object.keys(newStepErrors).length === 0;
    };

    // Navegación entre pasos
    const nextStep = () => {
        if (validateStep(currentStep) && currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Envío del formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    // 2. AGREGAR: Nueva función para envío manual
    const handleFinalSubmit = () => {
        if (validateStep(currentStep)) {
            put(route('user.certifications.update', certification.id));
        }
    };

    // Generar plantilla de video para mayores de 65
    const generateVideoTemplate = () => {
        const today = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).toUpperCase();
        
        return `Hoy ${today}, Yo ${data.applicantName} ${data.applicantLastName} ${data.applicantSecondLastName || ''} con CI. ${data.identificationNumber} autorizo a FIRMASEGURA emitir mi firma electrónica, sabiendo que tiene la misma validez legal que la firma manuscrita y sea enviada a mi correo electrónico ${data.emailAddress}`;
    };

    const getStatusBadge = (status: string, options: Record<string, string>) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Certificación ${certification.certification_number}`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('user.certifications.show', certification.id)}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                                Volver
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Editar Certificación {certification.certification_number}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-muted-foreground">Estado:</span>
                                {getStatusBadge(certification.validationStatus, validationStatusOptions)}
                            </div>
                        </div>
                    </div>
                    
                    <Link href={route('user.certifications.show', certification.id)}>
                        <Button variant="outline">
                            <Eye className="h-4 w-4" />
                            Ver Detalles
                        </Button>
                    </Link>
                </div>

                {/* Advertencia de edición */}
                {certification.validationStatus === 'REFUSED' && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-orange-800">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Esta certificación fue rechazada. Corrige los errores y vuelve a enviar.
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Progreso de pasos */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            {[1, 2, 3, 4].map((step) => (
                                <div key={step} className="flex items-center">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                                        step <= currentStep 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                                    </div>
                                    {step < 4 && (
                                        <div className={`h-1 w-16 mx-2 ${
                                            step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Paso {currentStep} de {totalSteps}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Paso 1: Información Personal */}
                    {currentStep === 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Información Personal
                                </CardTitle>
                                <CardDescription>
                                    Datos básicos del solicitante
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="identificationNumber">Número de Identificación *</Label>
                                        <Input
                                            id="identificationNumber"
                                            value={data.identificationNumber}
                                            onChange={e => setData('identificationNumber', e.target.value)}
                                            placeholder="1234567890"
                                            maxLength={10}
                                        />
                                        {(errors.identificationNumber || stepErrors.identificationNumber) && 
                                            <p className="text-sm text-red-500">{errors.identificationNumber || stepErrors.identificationNumber}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="fingerCode">Código Dactilar *</Label>
                                        <Input
                                            id="fingerCode"
                                            value={data.fingerCode}
                                            onChange={e => setData('fingerCode', e.target.value.toUpperCase())}
                                            placeholder="A1234B5678"
                                            maxLength={10}
                                        />
                                        {(errors.fingerCode || stepErrors.fingerCode) && 
                                            <p className="text-sm text-red-500">{errors.fingerCode || stepErrors.fingerCode}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <Label htmlFor="applicantName">Primer Nombre *</Label>
                                        <Input
                                            id="applicantName"
                                            value={data.applicantName}
                                            onChange={e => setData('applicantName', e.target.value)}
                                            placeholder="Juan"
                                        />
                                        {(errors.applicantName || stepErrors.applicantName) && 
                                            <p className="text-sm text-red-500">{errors.applicantName || stepErrors.applicantName}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="applicantLastName">Apellido Paterno *</Label>
                                        <Input
                                            id="applicantLastName"
                                            value={data.applicantLastName}
                                            onChange={e => setData('applicantLastName', e.target.value)}
                                            placeholder="Pérez"
                                        />
                                        {(errors.applicantLastName || stepErrors.applicantLastName) && 
                                            <p className="text-sm text-red-500">{errors.applicantLastName || stepErrors.applicantLastName}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="applicantSecondLastName">Apellido Materno</Label>
                                        <Input
                                            id="applicantSecondLastName"
                                            value={data.applicantSecondLastName}
                                            onChange={e => setData('applicantSecondLastName', e.target.value)}
                                            placeholder="González"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="dateOfBirth">Fecha de Nacimiento *</Label>
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : ''}
                                            onChange={e => setData('dateOfBirth', e.target.value)}
                                        />
                                        {(errors.dateOfBirth || stepErrors.dateOfBirth) && 
                                            <p className="text-sm text-red-500">{errors.dateOfBirth || stepErrors.dateOfBirth}</p>}
                                        {certification.current_age && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                Edad: {certification.current_age} años
                                                {certification.is_over_65 && (
                                                    <Badge variant="outline" className="ml-2 text-orange-600">
                                                        Mayor de 65
                                                    </Badge>
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="emailAddress">Correo Electrónico *</Label>
                                        <Input
                                            id="emailAddress"
                                            type="email"
                                            value={data.emailAddress}
                                            onChange={e => setData('emailAddress', e.target.value)}
                                            placeholder="correo@ejemplo.com"
                                        />
                                        {(errors.emailAddress || stepErrors.emailAddress) && 
                                            <p className="text-sm text-red-500">{errors.emailAddress || stepErrors.emailAddress}</p>}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="cellphoneNumber">Número de Celular *</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                                            +593
                                        </span>
                                        <Input
                                            id="cellphoneNumber"
                                            type="tel"
                                            value={data.cellphoneNumber.replace('+593', '')}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, ''); // Solo números
                                                if (value.length <= 9) {
                                                    // Formatear: XX XXX XXXX
                                                    let formatted = value;
                                                    if (value.length >= 2) {
                                                        formatted = value.substring(0, 2) + ' ' + value.substring(2);
                                                    }
                                                    if (value.length >= 5) {
                                                        formatted = value.substring(0, 2) + ' ' + value.substring(2, 5) + ' ' + value.substring(5);
                                                    }
                                                    setData('cellphoneNumber', '+593' + value);
                                                }
                                            }}
                                            placeholder="96 831 9032"
                                            maxLength={11} // Permite espacios en el formato
                                            className="rounded-l-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">Formato: 96 831 9032 (9 dígitos)</p>
                                    {(errors.cellphoneNumber || stepErrors.cellphoneNumber) && 
                                        <p className="text-sm text-red-500">{errors.cellphoneNumber || stepErrors.cellphoneNumber}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Paso 2: Ubicación */}
                    {currentStep === 2 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Información de Ubicación
                                </CardTitle>
                                <CardDescription>
                                    Dirección y ubicación del solicitante
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="province">Provincia *</Label>
                                        <Select value={data.province} onValueChange={value => setData('province', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar provincia" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {provinces.map(province => (
                                                    <SelectItem key={province} value={province}>
                                                        {province}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {(errors.province || stepErrors.province) && 
                                            <p className="text-sm text-red-500">{errors.province || stepErrors.province}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="city">Ciudad *</Label>
                                        <Select value={data.city} onValueChange={value => setData('city', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar ciudad" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cities.map(city => (
                                                    <SelectItem key={city} value={city}>
                                                        {city}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {(errors.city || stepErrors.city) && 
                                            <p className="text-sm text-red-500">{errors.city || stepErrors.city}</p>}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="address">Dirección Completa *</Label>
                                    <Textarea
                                        id="address"
                                        value={data.address}
                                        onChange={e => setData('address', e.target.value)}
                                        placeholder="Av. Principal 123 y Calle Secundaria, Edificio Torres del Norte, Piso 5"
                                        rows={3}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Mínimo 15 caracteres. Incluye referencias específicas.
                                    </p>
                                    {(errors.address || stepErrors.address) && 
                                        <p className="text-sm text-red-500">{errors.address || stepErrors.address}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Paso 3: Tipo de Aplicación y Empresa */}
                    {currentStep === 3 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building className="h-5 w-5" />
                                    Tipo de Certificación
                                </CardTitle>
                                <CardDescription>
                                    Información de aplicación y empresa (si aplica)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="applicationType">Tipo de Aplicación *</Label>
                                        <Select 
                                            value={data.applicationType} 
                                            onValueChange={value => setData('applicationType', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(applicationTypes).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {value}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {(errors.applicationType || stepErrors.applicationType) && 
                                            <p className="text-sm text-red-500">{errors.applicationType || stepErrors.applicationType}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="period">Período de Vigencia *</Label>
                                        <Select value={data.period} onValueChange={value => setData('period', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar período" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(periods).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {value}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {(errors.period || stepErrors.period) && 
                                            <p className="text-sm text-red-500">{errors.period || stepErrors.period}</p>}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="referenceTransaction">Referencia de Transacción *</Label>
                                    <Input
                                        id="referenceTransaction"
                                        value={data.referenceTransaction}
                                        onChange={e => setData('referenceTransaction', e.target.value)}
                                        placeholder="RT-001"
                                        maxLength={150}
                                    />
                                    {(errors.referenceTransaction || stepErrors.referenceTransaction) && 
                                        <p className="text-sm text-red-500">{errors.referenceTransaction || stepErrors.referenceTransaction}</p>}
                                </div>

                                {/* Campos empresariales */}
                                {requiresCompanyDocs && (
                                    <>
                                        <div className="border-t pt-4">
                                            <h3 className="text-lg font-medium mb-4">Información Empresarial</h3>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="companyRuc">RUC de la Empresa *</Label>
                                                    <Input
                                                        id="companyRuc"
                                                        value={data.companyRuc}
                                                        onChange={e => setData('companyRuc', e.target.value)}
                                                        placeholder="1234567890001"
                                                        maxLength={13}
                                                    />
                                                    {(errors.companyRuc || stepErrors.companyRuc) && 
                                                        <p className="text-sm text-red-500">{errors.companyRuc || stepErrors.companyRuc}</p>}
                                                </div>

                                                <div>
                                                    <Label htmlFor="companySocialReason">Razón Social *</Label>
                                                    <Input
                                                        id="companySocialReason"
                                                        value={data.companySocialReason}
                                                        onChange={e => setData('companySocialReason', e.target.value)}
                                                        placeholder="EMPRESA EJEMPLO S.A."
                                                        maxLength={250}
                                                    />
                                                    {(errors.companySocialReason || stepErrors.companySocialReason) && 
                                                        <p className="text-sm text-red-500">{errors.companySocialReason || stepErrors.companySocialReason}</p>}
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <Label htmlFor="positionCompany">Cargo en la Empresa *</Label>
                                                        <Input
                                                            id="positionCompany"
                                                            value={data.positionCompany}
                                                            onChange={e => setData('positionCompany', e.target.value)}
                                                            placeholder="Gerente General"
                                                            maxLength={100}
                                                        />
                                                        {(errors.positionCompany || stepErrors.positionCompany) && 
                                                            <p className="text-sm text-red-500">{errors.positionCompany || stepErrors.positionCompany}</p>}
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="appointmentExpirationDate">Vencimiento del Nombramiento *</Label>
                                                        <Input
                                                            id="appointmentExpirationDate"
                                                            type="date"
                                                            value={data.appointmentExpirationDate}
                                                            onChange={e => setData('appointmentExpirationDate', e.target.value)}
                                                        />
                                                        {(errors.appointmentExpirationDate || stepErrors.appointmentExpirationDate) && 
                                                            <p className="text-sm text-red-500">{errors.appointmentExpirationDate || stepErrors.appointmentExpirationDate}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* RUC opcional para persona natural */}
                                {data.applicationType === 'NATURAL_PERSON' && (
                                    <div className="border-t pt-4">
                                        <h3 className="text-lg font-medium mb-4">RUC Personal (Opcional)</h3>
                                        <div>
                                            <Label htmlFor="companyRuc">RUC Personal</Label>
                                            <Input
                                                id="companyRuc"
                                                value={data.companyRuc}
                                                onChange={e => setData('companyRuc', e.target.value)}
                                                placeholder="1234567890001"
                                                maxLength={13}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Solo si tienes RUC personal activo
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Paso 4: Documentos y Archivos */}
                    {currentStep === 4 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Documentos y Archivos
                                </CardTitle>
                                <CardDescription>
                                    Archivos actuales y reemplazos opcionales
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Documentos de identidad */}
                                <div>
                                    <h3 className="text-lg font-medium mb-4">Documentos de Identidad</h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        {/* Cédula frontal */}
                                        <div className="space-y-2">
                                            <Label>Cédula Frontal *</Label>
                                            {certification.identificationFront && (
                                                <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm text-green-700">Archivo actual</span>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={`/storage/${certification.identificationFront}`} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-3 w-3" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            )}
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange('identificationFront')}
                                                    className="hidden"
                                                    id="identificationFront"
                                                />
                                                <Label htmlFor="identificationFront" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                                    {certification.identificationFront ? 'Reemplazar archivo' : 'Seleccionar archivo'}
                                                </Label>
                                                {data.identificationFront && (
                                                    <p className="text-xs text-green-600 mt-1">{data.identificationFront.name}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cédula posterior */}
                                        <div className="space-y-2">
                                            <Label>Cédula Posterior *</Label>
                                            {certification.identificationBack && (
                                                <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm text-green-700">Archivo actual</span>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={`/storage/${certification.identificationBack}`} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-3 w-3" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            )}
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange('identificationBack')}
                                                    className="hidden"
                                                    id="identificationBack"
                                                />
                                                <Label htmlFor="identificationBack" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                                    {certification.identificationBack ? 'Reemplazar archivo' : 'Seleccionar archivo'}
                                                </Label>
                                                {data.identificationBack && (
                                                    <p className="text-xs text-green-600 mt-1">{data.identificationBack.name}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Selfie */}
                                        <div className="space-y-2">
                                            <Label>Selfie con Cédula *</Label>
                                            {certification.identificationSelfie && (
                                                <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm text-green-700">Archivo actual</span>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={`/storage/${certification.identificationSelfie}`} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-3 w-3" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            )}
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange('identificationSelfie')}
                                                    className="hidden"
                                                    id="identificationSelfie"
                                                />
                                                <Label htmlFor="identificationSelfie" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                                    {certification.identificationSelfie ? 'Reemplazar archivo' : 'Seleccionar archivo'}
                                                </Label>
                                                {data.identificationSelfie && (
                                                    <p className="text-xs text-green-600 mt-1">{data.identificationSelfie.name}</p>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                📸 Debe notarse claramente el rostro y sin accesorios extras (gafas, mascarilla, gorra, etc).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Documentos empresariales */}
                                {hasCompanyDocs && (
                                    <div className="border-t pt-4">
                                        <h3 className="text-lg font-medium mb-4">Documentos Empresariales</h3>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {/* RUC */}
                                            <div className="space-y-2">
                                                <Label>RUC de la Empresa *</Label>
                                                {certification.pdfCompanyRuc && (
                                                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        <span className="text-sm text-green-700">Archivo actual</span>
                                                        <Button variant="outline" size="sm" asChild>
                                                            <a href={`/storage/${certification.pdfCompanyRuc}`} target="_blank" rel="noopener noreferrer">
                                                                <Download className="h-3 w-3" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                )}
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                                    <Input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={handleFileChange('pdfCompanyRuc')}
                                                        className="hidden"
                                                        id="pdfCompanyRuc"
                                                    />
                                                    <Label htmlFor="pdfCompanyRuc" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                                        {certification.pdfCompanyRuc ? 'Reemplazar PDF' : 'Seleccionar PDF'}
                                                    </Label>
                                                    {data.pdfCompanyRuc && (
                                                        <p className="text-xs text-green-600 mt-1">{data.pdfCompanyRuc.name}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Nombramiento */}
                                            {requiresCompanyDocs && (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label>Nombramiento *</Label>
                                                        {certification.pdfRepresentativeAppointment && (
                                                            <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                                <span className="text-sm text-green-700">Archivo actual</span>
                                                                <Button variant="outline" size="sm" asChild>
                                                                    <a href={`/storage/${certification.pdfRepresentativeAppointment}`} target="_blank" rel="noopener noreferrer">
                                                                        <Download className="h-3 w-3" />
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        )}
                                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                                            <Input
                                                                type="file"
                                                                accept=".pdf"
                                                                onChange={handleFileChange('pdfRepresentativeAppointment')}
                                                                className="hidden"
                                                                id="pdfRepresentativeAppointment"
                                                            />
                                                            <Label htmlFor="pdfRepresentativeAppointment" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                                                {certification.pdfRepresentativeAppointment ? 'Reemplazar PDF' : 'Seleccionar PDF'}
                                                            </Label>
                                                            {data.pdfRepresentativeAppointment && (
                                                                <p className="text-xs text-green-600 mt-1">{data.pdfRepresentativeAppointment.name}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Aceptación Nombramiento *</Label>
                                                        {certification.pdfAppointmentAcceptance && (
                                                            <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                                <span className="text-sm text-green-700">Archivo actual</span>
                                                                <Button variant="outline" size="sm" asChild>
                                                                    <a href={`/storage/${certification.pdfAppointmentAcceptance}`} target="_blank" rel="noopener noreferrer">
                                                                        <Download className="h-3 w-3" />
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        )}
                                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                                            <Input
                                                                type="file"
                                                                accept=".pdf"
                                                                onChange={handleFileChange('pdfAppointmentAcceptance')}
                                                                className="hidden"
                                                                id="pdfAppointmentAcceptance"
                                                            />
                                                            <Label htmlFor="pdfAppointmentAcceptance" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                                                {certification.pdfAppointmentAcceptance ? 'Reemplazar PDF' : 'Seleccionar PDF'}
                                                            </Label>
                                                            {data.pdfAppointmentAcceptance && (
                                                                <p className="text-xs text-green-600 mt-1">{data.pdfAppointmentAcceptance.name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Video de autorización para mayores de 65 */}
                                {isOver65 && (
                                    <div className="border-t pt-4">
                                        <h3 className="text-lg font-medium mb-4 text-orange-600">Video de Autorización Requerido</h3>
                                        <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
                                            <h4 className="font-medium text-orange-800 mb-2">
                                                ⚠️ Requisito Especial - Mayor de 65 años
                                            </h4>
                                            <p className="text-sm text-orange-700 mb-3">
                                                Debe grabar un video leyendo exactamente el siguiente texto:
                                            </p>
                                            <div className="bg-white border border-orange-300 rounded p-3 text-sm font-mono text-gray-800">
                                                {generateVideoTemplate()}
                                            </div>
                                            <p className="text-xs text-orange-600 mt-2">
                                                📹 El video debe ser claro, con buena iluminación y audio.
                                            </p>
                                        </div>
                                        
                                        {certification.authorizationVideo && (
                                            <div className="flex items-center gap-2 p-2 bg-green-50 rounded border mb-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="text-sm text-green-700">Video actual</span>
                                                <Button variant="outline" size="sm" asChild>
                                                    <a href={`/storage/${certification.authorizationVideo}`} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-3 w-3" />
                                                    </a>
                                                </Button>
                                            </div>
                                        )}
                                        
                                        <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 text-center">
                                            <Upload className="h-8 w-8 mx-auto text-orange-400 mb-2" />
                                            <Input
                                                type="file"
                                                accept="video/*"
                                                onChange={handleFileChange('authorizationVideo')}
                                                className="hidden"
                                                id="authorizationVideo"
                                            />
                                            <Label htmlFor="authorizationVideo" className="cursor-pointer text-sm text-orange-600 hover:text-orange-800">
                                                {certification.authorizationVideo ? 'Reemplazar video' : 'Seleccionar video'}
                                            </Label>
                                            {data.authorizationVideo && (
                                                <p className="text-xs text-green-600 mt-1">{data.authorizationVideo.name}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Términos y condiciones */}
                                <div className="border-t pt-4">
                                    <div className="flex items-start space-x-3">
                                        <Checkbox
                                            checked={data.terms_accepted}
                                            onCheckedChange={(checked) => setData('terms_accepted', checked === true)}
                                        />
                                        <div>
                                            <Label htmlFor="terms_accepted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Acepto los términos y condiciones *
                                            </Label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Al marcar esta casilla, confirmo que he leído y acepto todos los términos y condiciones del servicio.
                                            </p>
                                        </div>
                                    </div>
                                    {(errors.terms_accepted || stepErrors.terms_accepted) && 
                                        <p className="text-sm text-red-500 mt-2">{errors.terms_accepted || stepErrors.terms_accepted}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Botones de navegación */}
                    <div className="flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Anterior
                        </Button>

                        {currentStep < totalSteps ? (
                            <Button type="button" onClick={nextStep}>
                                Siguiente
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button 
                                type="button" 
                                onClick={handleFinalSubmit} 
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {processing ? 'Guardando...' : 'Actualizar Certificación'}
                            </Button>
                        )}
                    </div>
                </form>

                {/* Progreso de subida */}
                {progress && (
                    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
                        <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                            <span className="text-sm text-gray-600">{progress.percentage}%</span>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}