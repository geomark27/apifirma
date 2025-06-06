import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

// Usuario base (extendido para incluir roles)
export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles?: Role[];
    permissions?: string[];
    [key: string]: unknown;
}

// Nuevas interfaces para el sistema de roles
export interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    permissions?: Permission[];
    users_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Permission {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    module: string;
    created_at: string;
    updated_at: string;
}

export interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    prev_page_url?: string;  // ← Agregar
    next_page_url?: string;  // ← Agregar
}

// Usuario autenticado con métodos de roles
export interface AuthUser extends User {
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
    getAllPermissions: () => string[];
}

// Props globales de página
export interface PageProps {
    auth: {
        user: AuthUser;
    };
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
}

// Interfaces para Certificaciones
export interface Certification {
    id: number;
    user_id: number;
    // Información personal
    identificationNumber: string;
    applicantName: string;
    applicantLastName: string;
    applicantSecondLastName?: string;
    fingerCode: string;
    emailAddress: string;
    cellphoneNumber: string;
    // Ubicación
    city: string;
    province: string;
    address: string;
    countryCode: string;
    // Información empresarial
    companyRuc?: string;
    positionCompany?: string;
    companySocialReason?: string;
    appointmentExpirationDate?: string;
    // Tipo y transacción
    documentType: string;
    applicationType: 'NATURAL_PERSON' | 'LEGAL_REPRESENTATIVE';
    referenceTransaction: string;
    period: '1_YEAR' | '2_YEARS' | '3_YEARS';
    // Archivos
    identificationFront?: string;
    identificationBack?: string;
    identificationSelfie?: string;
    pdfCompanyRuc?: string;
    pdfRepresentativeAppointment?: string;
    pdfAppointmentAcceptance?: string;
    pdfCompanyConstitution?: string;
    authorizationVideo?: string;
    // Estado
    status: 'draft' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
    rejection_reason?: string;
    processed_by?: number;
    processed_at?: string;
    submitted_at?: string;
    // Metadatos
    metadata?: any;
    terms_accepted: boolean;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    updated_at: string;
    // Relaciones
    user?: User;
    processedBy?: User;
}

export interface PaginatedCertifications {
    data: Certification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    prev_page_url?: string;
    next_page_url?: string;
}