// resources/js/pages/Certifications/Create.tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { type PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    ArrowLeft, Save, Upload, FileText, Image, Video, 
    User, Building, MapPin, CreditCard, AlertCircle, 
    CheckCircle, Clock, Eye, EyeOff
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface CreateCertificationProps extends PageProps {
    applicationTypes: Record<string, string>;
    periods: Record<string, string>;
    cities: string[];
    provinces: string[];
}

export default function CreateCertification({ 
    applicationTypes, 
    periods, 
    cities, 
    provinces 
}: CreateCertificationProps) {
    const { createUserBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = createUserBreadcrumbs([
        { title: 'Mis Certificaciones', href: '/certifications' },
        { title: 'Nueva Certificación', href: '/certifications/create' }
    ]);

    const [currentStep, setCurrentStep] = useState(1);
    const [showProgress, setShowProgress] = useState(true);

    // Formulario con Inertia
    const { data, setData, post, processing, errors, progress } = useForm({
        // Información personal
        identificationNumber: '',
        applicantName: '',
        applicantLastName: '',
        applicantSecondLastName: '',
        fingerCode: '',
        emailAddress: '',
        cellphoneNumber: '',
        // Ubicación
        city: '',
        province: '',
        address: '',
        // Información empresarial (condicional)
        companyRuc: '',
        positionCompany: '',
        companySocialReason: '',
        appointmentExpirationDate: '',
        // Tipo y transacción
        applicationType: 'NATURAL_PERSON' as 'NATURAL_PERSON' | 'LEGAL_REPRESENTATIVE',
        referenceTransaction: '',
        period: '1_YEAR' as '1_YEAR' | '2_YEARS' | '3_YEARS',
        // Archivos
        identificationFront: null as File | null,
        identificationBack: null as File | null,
        identificationSelfie: null as File | null,
        pdfCompanyRuc: null as File | null,
        pdfRepresentativeAppointment: null as File | null,
        pdfAppointmentAcceptance: null as File | null,
        pdfCompanyConstitution: null as File | null,
        authorizationVideo: null as File | null,
        // Términos
        terms_accepted: false,
    });

    // Verificar si requiere documentos empresariales
    const requiresCompanyDocs = data.applicationType === 'LEGAL_REPRESENTATIVE' || 
                               (data.applicationType === 'NATURAL_PERSON' && data.companyRuc);

    const requiresAppointmentDocs = data.applicationType === 'LEGAL_REPRESENTATIVE';

    // Calcular progreso de completitud
    const getCompletionPercentage = (): number => {
        const requiredFields = [
            'identificationNumber', 'applicantName', 'applicantLastName',
            'fingerCode', 'emailAddress', 'cellphoneNumber', 'city',
            'province', 'address', 'referenceTransaction', 'period',
            'identificationFront', 'identificationBack', 'identificationSelfie'
        ];

        if (requiresCompanyDocs) {
            requiredFields.push('companyRuc', 'pdfCompanyRuc');
        }

        if (requiresAppointmentDocs) {
            requiredFields.push(
                'positionCompany', 'companySocialReason', 
                'appointmentExpirationDate', 'pdfRepresentativeAppointment',
                'pdfAppointmentAcceptance', 'pdfCompanyConstitution'
            );
        }

        const completed = requiredFields.filter(field => {
            const value = data[field as keyof typeof data];
            return value !== null && value !== '' && value !== false;
        }).length;

        return Math.round((completed / requiredFields.length) * 100);
    };

    // Manejar envío del formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/certifications');
    };

    // Manejar subida de archivos
    const handleFileChange = (field: string, file: File | null) => {
        setData(field as any, file);
    };

    // Validar paso actual
    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1: // Información personal
                return !!(data.identificationNumber && data.applicantName && 
                         data.applicantLastName && data.fingerCode && 
                         data.emailAddress && data.cellphoneNumber);
            case 2: // Ubicación
                return !!(data.city && data.province && data.address);
            case 3: // Información empresarial
                if (!requiresCompanyDocs && !requiresAppointmentDocs) return true;
                if (requiresAppointmentDocs) {
                    return !!(data.companyRuc && data.positionCompany && 
                             data.companySocialReason && data.appointmentExpirationDate);
                }
                return !!data.companyRuc;
            case 4: // Archivos
                return !!(data.identificationFront && data.identificationBack && 
                         data.identificationSelfie);
            case 5: // Revisión
                return data.terms_accepted && getCompletionPercentage() === 100;
            default:
                return false;
        }
    };

    const steps = [
        { number: 1, title: 'Información Personal', icon: User },
        { number: 2, title: 'Ubicación', icon: MapPin },
        { number: 3, title: 'Información Empresarial', icon: Building },
        { number: 4, title: 'Documentos', icon: FileText },
        { number: 5, title: 'Revisión', icon: CheckCircle },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nueva Certificación" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Nueva Certificación Digital</h1>
                        <p className="text-muted-foreground">
                            Complete todos los campos para solicitar su certificado digital
                        </p>
                    </div>
                    <Link href="/certifications">
                        <Button variant="outline" className="flex items-center space-x-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Volver</span>
                        </Button>
                    </Link>
                </div>

                {/* Progress Bar */}
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Progreso de la solicitud</h3>
                        <span className="text-sm font-medium text-blue-600">
                            {getCompletionPercentage()}% completado
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getCompletionPercentage()}%` }}
                        ></div>
                    </div>
                    
                    {/* Steps */}
                    <div className="flex items-center justify-between">
                        {steps.map((step) => {
                            const IconComponent = step.icon;
                            const isActive = currentStep === step.number;
                            const isCompleted = validateStep(step.number);
                            const isAccessible = step.number <= currentStep || isCompleted;
                            
                            return (
                                <div 
                                    key={step.number}
                                    className={`flex flex-col items-center cursor-pointer transition-colors ${
                                        isAccessible ? 'text-blue-600' : 'text-gray-400'
                                    }`}
                                    onClick={() => isAccessible && setCurrentStep(step.number)}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                                        isActive ? 'bg-blue-600 text-white' :
                                        isCompleted ? 'bg-green-600 text-white' :
                                        'bg-gray-200 text-gray-600'
                                    }`}>
                                        {isCompleted ? (
                                            <CheckCircle className="h-4 w-4" />
                                        ) : (
                                            <IconComponent className="h-4 w-4" />
                                        )}
                                    </div>
                                    <span className="text-xs text-center max-w-20">
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Paso 1: Información Personal */}
                    {currentStep === 1 && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                                <User className="h-5 w-5 text-blue-600" />
                                <span>Información Personal del Solicitante</span>
                            </h3>
                            
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="identificationNumber">
                                        Número de Cédula <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="identificationNumber"
                                        type="text"
                                        value={data.identificationNumber}
                                        onChange={(e) => setData('identificationNumber', e.target.value)}
                                        placeholder="1234567890"
                                        maxLength={10}
                                        className={errors.identificationNumber ? 'border-red-500' : ''}
                                    />
                                    {errors.identificationNumber && (
                                        <p className="text-sm text-red-600">{errors.identificationNumber}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fingerCode">
                                        Código Dactilar <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="fingerCode"
                                        type="text"
                                        value={data.fingerCode}
                                        onChange={(e) => setData('fingerCode', e.target.value.toUpperCase())}
                                        placeholder="AB12345678"
                                        maxLength={10}
                                        className={errors.fingerCode ? 'border-red-500' : ''}
                                    />
                                    {errors.fingerCode && (
                                        <p className="text-sm text-red-600">{errors.fingerCode}</p>
                                    )}
                                    <p className="text-xs text-gray-600">
                                        2 letras mayúsculas seguidas de 8 números
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="applicantName">
                                        Nombres <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="applicantName"
                                        type="text"
                                        value={data.applicantName}
                                        onChange={(e) => setData('applicantName', e.target.value)}
                                        placeholder="Juan Carlos"
                                        maxLength={100}
                                        className={errors.applicantName ? 'border-red-500' : ''}
                                    />
                                    {errors.applicantName && (
                                        <p className="text-sm text-red-600">{errors.applicantName}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="applicantLastName">
                                        Apellido Paterno <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="applicantLastName"
                                        type="text"
                                        value={data.applicantLastName}
                                        onChange={(e) => setData('applicantLastName', e.target.value)}
                                        placeholder="Pérez"
                                        maxLength={100}
                                        className={errors.applicantLastName ? 'border-red-500' : ''}
                                    />
                                    {errors.applicantLastName && (
                                        <p className="text-sm text-red-600">{errors.applicantLastName}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="applicantSecondLastName">
                                        Apellido Materno
                                    </Label>
                                    <Input
                                        id="applicantSecondLastName"
                                        type="text"
                                        value={data.applicantSecondLastName}
                                        onChange={(e) => setData('applicantSecondLastName', e.target.value)}
                                        placeholder="González"
                                        maxLength={100}
                                        className={errors.applicantSecondLastName ? 'border-red-500' : ''}
                                    />
                                    {errors.applicantSecondLastName && (
                                        <p className="text-sm text-red-600">{errors.applicantSecondLastName}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="emailAddress">
                                        Correo Electrónico <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="emailAddress"
                                        type="email"
                                        value={data.emailAddress}
                                        onChange={(e) => setData('emailAddress', e.target.value)}
                                        placeholder="juan@ejemplo.com"
                                        maxLength={100}
                                        className={errors.emailAddress ? 'border-red-500' : ''}
                                    />
                                    {errors.emailAddress && (
                                        <p className="text-sm text-red-600">{errors.emailAddress}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cellphoneNumber">
                                        Número de Celular <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="cellphoneNumber"
                                        type="text"
                                        value={data.cellphoneNumber}
                                        onChange={(e) => setData('cellphoneNumber', e.target.value)}
                                        placeholder="+593912345678"
                                        maxLength={13}
                                        className={errors.cellphoneNumber ? 'border-red-500' : ''}
                                    />
                                    {errors.cellphoneNumber && (
                                        <p className="text-sm text-red-600">{errors.cellphoneNumber}</p>
                                    )}
                                    <p className="text-xs text-gray-600">
                                        Formato: +5939 seguido de 8 números
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="applicationType">
                                        Tipo de Aplicación <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="applicationType"
                                        value={data.applicationType}
                                        onChange={(e) => setData('applicationType', e.target.value as any)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {Object.entries(applicationTypes).map(([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.applicationType && (
                                        <p className="text-sm text-red-600">{errors.applicationType}</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Paso 2: Ubicación */}
                    {currentStep === 2 && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                                <MapPin className="h-5 w-5 text-green-600" />
                                <span>Información de Ubicación</span>
                            </h3>
                            
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="province">
                                        Provincia <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="province"
                                        value={data.province}
                                        onChange={(e) => setData('province', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Seleccionar provincia</option>
                                        {provinces.map((province) => (
                                            <option key={province} value={province}>
                                                {province}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.province && (
                                        <p className="text-sm text-red-600">{errors.province}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">
                                        Ciudad <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="city"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Seleccionar ciudad</option>
                                        {cities.map((city) => (
                                            <option key={city} value={city}>
                                                {city}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.city && (
                                        <p className="text-sm text-red-600">{errors.city}</p>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">
                                        Dirección Completa <span className="text-red-500">*</span>
                                    </Label>
                                    <textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="Ingrese su dirección completa (mínimo 15 caracteres)"
                                        rows={3}
                                        minLength={15}
                                        maxLength={100}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                                            errors.address ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.address && (
                                        <p className="text-sm text-red-600">{errors.address}</p>
                                    )}
                                    <p className="text-xs text-gray-600">
                                        {data.address.length}/100 caracteres (mínimo 15)
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Paso 3: Información Empresarial */}
                    {currentStep === 3 && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                                <Building className="h-5 w-5 text-purple-600" />
                                <span>Información Empresarial</span>
                            </h3>

                            {data.applicationType === 'NATURAL_PERSON' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-start space-x-3">
                                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-blue-900">Persona Natural</h4>
                                            <p className="text-sm text-blue-700 mt-1">
                                                Si posee RUC como persona natural, complete la información empresarial. 
                                                De lo contrario, puede omitir esta sección.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="companyRuc">
                                        RUC de la Empresa {requiresCompanyDocs && <span className="text-red-500">*</span>}
                                    </Label>
                                    <Input
                                        id="companyRuc"
                                        type="text"
                                        value={data.companyRuc}
                                        onChange={(e) => setData('companyRuc', e.target.value)}
                                        placeholder="1234567890001"
                                        maxLength={13}
                                        className={errors.companyRuc ? 'border-red-500' : ''}
                                    />
                                    {errors.companyRuc && (
                                        <p className="text-sm text-red-600">{errors.companyRuc}</p>
                                    )}
                                </div>

                                {requiresAppointmentDocs && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="positionCompany">
                                                Cargo en la Empresa <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="positionCompany"
                                                type="text"
                                                value={data.positionCompany}
                                                onChange={(e) => setData('positionCompany', e.target.value)}
                                                placeholder="Gerente General"
                                                maxLength={100}
                                                className={errors.positionCompany ? 'border-red-500' : ''}
                                            />
                                            {errors.positionCompany && (
                                                <p className="text-sm text-red-600">{errors.positionCompany}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="companySocialReason">
                                                Razón Social de la Empresa <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="companySocialReason"
                                                type="text"
                                                value={data.companySocialReason}
                                                onChange={(e) => setData('companySocialReason', e.target.value)}
                                                placeholder="EMPRESA EJEMPLO S.A."
                                                maxLength={250}
                                                className={errors.companySocialReason ? 'border-red-500' : ''}
                                            />
                                            {errors.companySocialReason && (
                                                <p className="text-sm text-red-600">{errors.companySocialReason}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="appointmentExpirationDate">
                                                Fecha de Vencimiento del Nombramiento <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="appointmentExpirationDate"
                                                type="datetime-local"
                                                value={data.appointmentExpirationDate}
                                                onChange={(e) => setData('appointmentExpirationDate', e.target.value)}
                                                className={errors.appointmentExpirationDate ? 'border-red-500' : ''}
                                            />
                                            {errors.appointmentExpirationDate && (
                                                <p className="text-sm text-red-600">{errors.appointmentExpirationDate}</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Continúo con el resto de los pasos en el siguiente artifact... */}
                    
                    {/* Navegación entre pasos */}
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                {currentStep > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCurrentStep(currentStep - 1)}
                                    >
                                        Anterior
                                    </Button>
                                )}
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                {currentStep < 5 ? (
                                    <Button
                                        type="button"
                                        onClick={() => setCurrentStep(currentStep + 1)}
                                        disabled={!validateStep(currentStep)}
                                    >
                                        Siguiente
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={processing || !validateStep(5)}
                                        className="flex items-center space-x-2"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Creando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                <span>Crear Certificación</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}