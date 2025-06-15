<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;
use App\Models\User;

class Certification extends Model
{
    use HasFactory;

    protected $fillable = [
        'certification_number',
        'user_id',
        'identificationNumber',
        'applicantName',
        'applicantLastName',
        'applicantSecondLastName',
        'dateOfBirth',
        'clientAge',
        'fingerCode',
        'emailAddress',
        'cellphoneNumber',
        'city',
        'province',
        'address',
        'countryCode',
        'companyRuc',
        'positionCompany',
        'companySocialReason',
        'appointmentExpirationDate',
        'documentType',
        'applicationType',
        'referenceTransaction',
        'period',
        'identificationFront',
        'identificationBack',
        'identificationSelfie',
        'pdfCompanyRuc',
        'pdfRepresentativeAppointment',
        'pdfAppointmentAcceptance',
        'pdfCompanyConstitution',
        'authorizationVideo',
        'status',
        'validationStatus',       // Nuevo campo para el estado de solicitud
        'rejection_reason',
        'processed_by',
        'processed_at',
        'submitted_at',
        'metadata',
        'terms_accepted',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'appointmentExpirationDate' => 'datetime',
        'processed_at'              => 'datetime',
        'submitted_at'              => 'datetime',
        'metadata'                  => 'array',
        'terms_accepted'            => 'boolean',
        'dateOfBirth'               => 'date',
    ];

    // -------------------------------------------------
    // Constantes de validación
    // -------------------------------------------------

    /** Tipos de documento permitidos */
    const DOCUMENT_TYPES = ['CI'];

    /** Tipos de aplicación */
    const APPLICATION_TYPES = [
        'NATURAL_PERSON'       => 'Persona Natural',
        'LEGAL_REPRESENTATIVE' => 'Representante Legal',
    ];
    
    /** Prefijos para el número de certificado */
    private const PREFIXES = [
        'NATURAL_PERSON'       => 'CPN',
        'LEGAL_REPRESENTATIVE' => 'CRL',
    ];

    /** Periodos permitidos (Tabla 2) */
    const PERIODS = [
        'ONE_WEEK'    => '1 SEMANA',
        'ONE_MONTH'   => '1 MES',
        'ONE_YEAR'    => '1 AÑO',
        'TWO_YEARS'   => '2 AÑOS',
        'THREE_YEARS' => '3 AÑOS',
        'FOUR_YEARS'  => '4 AÑOS',
        'FIVE_YEARS'  => '5 AÑOS',
    ];

    /** Estados internos de workflow (legacy) */
    const STATUS_OPTIONS = [
        'draft'     => 'Borrador',
        'pending'   => 'Pendiente',
        'in_review' => 'En Revisión',
        'approved'  => 'Aprobado',
        'rejected'  => 'Rechazado',
        'completed' => 'Completado',
    ];

    /** Estados de validación (Tabla 4) */
    const VALIDATION_STATUSES = [
        'REGISTERED' => 'La solicitud fue correctamente registrada.',
        'VALIDATING' => 'La solicitud se encuentra en validación por parte de los operadores.',
        'REFUSED'    => 'La solicitud fue rechazada por parte de los operadores.',
        'ERROR'      => 'La solicitud contiene errores. Los operadores tratarán de corregir información.',
        'APPROVED'   => 'La solicitud fue aprobada y el email de descarga fue enviado.',
        'GENERATED'  => 'El certificado ya fue descargado por el cliente.',
        'EXPIRED'    => 'La solicitud caducó tras 50 días sin descarga.',
    ];

	// Ciudades y provincias de Ecuador (ejemplo - puedes expandir)
    const CITIES = [
        'Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala',
        'Durán', 'Manta', 'Portoviejo', 'Loja', 'Ambato', 'Esmeraldas',
        'Quevedo', 'Riobamba', 'Milagro', 'Ibarra', 'Babahoyo',
        'La Libertad', 'Daule', 'Quinindé', 'Ventanas', 'Cayambe'
    ];

    const PROVINCES = [
        'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi',
        'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura', 'Loja',
        'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo', 'Orellana',
        'Pastaza', 'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas',
        'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe'
    ];

    // -------------------------------------------------
    // Relaciones
    // -------------------------------------------------

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    // -------------------------------------------------
    // Scopes
    // -------------------------------------------------

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeByApplicationType(Builder $query, string $type): Builder
    {
        return $query->where('applicationType', $type);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->whereIn('status', ['pending', 'in_review']);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->whereIn('status', ['approved', 'completed']);
    }

    public function scopeByPeriod(Builder $query, string $period): Builder
    {
        return $query->where('period', $period);
    }

    public function scopeByValidationStatus(Builder $query, string $status): Builder
    {
        return $query->where('validationStatus', $status);
    }

    // -------------------------------------------------
    // Generación de número de certificado
    // -------------------------------------------------

    public static function generateCertificationNumber(string $identificationNumber, string $applicationType): string
    {
        if (!array_key_exists($applicationType, self::APPLICATION_TYPES)) {
            throw new \InvalidArgumentException('Tipo de aplicación no válido.');
        }

        $prefix = self::PREFIXES[$applicationType] ?? 'CERT';
        
        // Contar certificaciones existentes del mismo tipo
        $count = self::where('applicationType', $applicationType)->count();
        $nextNumber = $count + 1;
        
        // Formato: CPN-000001, CRL-000001
        return sprintf('%s-%06d', $prefix, $nextNumber);
    }

    // -------------------------------------------------
    // Lógica de documentos requeridos
    // -------------------------------------------------

    public function requiresAppointmentDocuments(): bool
    {
        return $this->applicationType === 'LEGAL_REPRESENTATIVE';
    }

    // -------------------------------------------------
    // Completitud
    // -------------------------------------------------

    public function getCompletionPercentage(): int
    {
        $required = [
            'identificationNumber','applicantName','applicantLastName',
            'fingerCode','emailAddress','cellphoneNumber','city','province',
            'address','referenceTransaction','period',
            'identificationFront','identificationBack','identificationSelfie'
        ];

        if ($this->requiresCompanyDocuments()) {
            $required[] = 'companyRuc';
            $required[] = 'pdfCompanyRuc';
        }

        if ($this->requiresAppointmentDocuments()) {
            $required = array_merge($required, [
                'positionCompany','companySocialReason',
                'appointmentExpirationDate','pdfRepresentativeAppointment',
                'pdfAppointmentAcceptance','pdfCompanyConstitution'
            ]);
        }

        $filled = 0;
        foreach ($required as $f) {
            if (! empty($this->{$f})) {
                $filled++;
            }
        }

        return (int) round(($filled / count($required)) * 100);
    }

    // -------------------------------------------------
    // Validaciones de formato
    // -------------------------------------------------

    public function validateFingerCode(): bool
    {
        return preg_match('/^[A-Z]{2}\d{8}$/', $this->fingerCode) === 1;
    }

    public function validateCellphone(): bool
    {
        return preg_match('/^\+5939\d{8}$/', $this->cellphoneNumber) === 1;
    }

    // -------------------------------------------------
    // Etiquetas legibles
    // -------------------------------------------------

    public function getStatusLabel(): string
    {
        return self::STATUS_OPTIONS[$this->status] ?? $this->status;
    }

    public function getApplicationTypeLabel(): string
    {
        return self::APPLICATION_TYPES[$this->applicationType] ?? $this->applicationType;
    }

    public function getPeriodLabel(): string
    {
        return self::PERIODS[$this->period] ?? $this->period;
    }

    public function getValidationStatusLabel(): string
    {
        return self::VALIDATION_STATUSES[$this->validationStatus] 
             ?? $this->validationStatus;
    }

    // -------------------------------------------------
    // Acciones de workflow
    // -------------------------------------------------

    public function canBeEdited(): bool
    {
        return in_array($this->status, ['draft', 'rejected']);
    }

    public function canBeSubmitted(): bool
    {
        return $this->status === 'draft'
            && $this->getCompletionPercentage() === 100
            && $this->terms_accepted;
    }

    public function markAsSubmitted(): void
    {
        $this->update([
            'status'       => 'pending',
            'submitted_at' => now(),
        ]);
    }

    public function approve(User $processedBy, string $notes = ''): void
    {
        $this->update([
            'validationStatus' => 'APPROVED',
            'processed_by'     => $processedBy->id,
            'processed_at'     => now(),
            'metadata'         => array_merge($this->metadata ?? [], [
                'approval_notes' => $notes,
                'approved_at'    => now()->toISOString(),
            ]),
        ]);
    }

    public function reject(User $processedBy, string $reason): void
    {
        $this->update([
            'validationStatus' => 'REFUSED',
            'rejection_reason' => $reason,
            'processed_by'     => $processedBy->id,
            'processed_at'     => now(),
        ]);
    }

    // -------------------------------------------------
    // Validación de edad mínima
    // -------------------------------------------------

    public static function verificateAge(string $dateOfBirth): ?string
    {
        $dob = Carbon::parse($dateOfBirth);
        $age = $dob->diffInYears(Carbon::now());

        if ($age < 18) {
            throw new \InvalidArgumentException('La edad mínima para la certificación es de 18 años.');
        }

        return $dob->format('Y-m-d');
    }

    // -------------------------------------------------
    // Cálculo de edad
    // -------------------------------------------------
    /**
     * Calcula la edad a partir de la fecha de nacimiento.
     *
     * @param string $dateOfBirth Fecha de nacimiento en formato 'Y-m-d'.
     * @return int Edad en años.
     */
    public static function calculateAge(string $dateOfBirth): int
    {
        return Carbon::parse($dateOfBirth)->diffInYears(Carbon::now());
    }



    /**
     * Verificar si la certificación está en un estado que permite reenvío
     */
    public function canBeResubmitted(): bool
    {
        return in_array($this->status, ['draft', 'rejected']) 
            && in_array($this->validationStatus, ['REGISTERED', 'ERROR', 'REFUSED'])
            && $this->getCompletionPercentage() === 100
            && $this->terms_accepted;
    }

    /**
     * Verificar si se puede consultar el estado en FirmaSegura
     */
    public function canCheckStatus(): bool
    {
        return !in_array($this->validationStatus, ['REGISTERED']) 
            && !empty($this->submitted_at)
            && in_array($this->status, ['pending', 'in_review', 'approved', 'rejected']);
    }

    /**
     * Obtener el último estado de FirmaSegura desde metadata
     */
    public function getLastFirmaSeguraResponse(): ?array
    {
        $metadata = $this->metadata ?? [];
        return $metadata['last_status_response'] ?? $metadata['firmasegura_response'] ?? null;
    }

    /**
     * Obtener mensajes de error de FirmaSegura
     */
    public function getFirmaSeguraErrorDetails(): ?string
    {
        $metadata = $this->metadata ?? [];
        
        // Error HTTP
        if (isset($metadata['firmasegura_error']['response']['messages'])) {
            $messages = $metadata['firmasegura_error']['response']['messages'];
            return is_array($messages) ? implode(', ', $messages) : $messages;
        }

        // Error de conexión
        if (isset($metadata['connection_error']['message'])) {
            return $metadata['connection_error']['message'];
        }

        return $this->rejection_reason;
    }

    /**
     * Verificar si necesita documentos empresariales
     */
    public function requiresCompanyDocuments(): bool
    {
        return $this->applicationType === 'LEGAL_REPRESENTATIVE' || 
            ($this->applicationType === 'NATURAL_PERSON' && !empty($this->companyRuc));
    }

    /**
     * Verificar si requiere video de autorización (>65 años)
     */
    public function requiresAuthorizationVideo(): bool
    {
        return $this->clientAge > 65;
    }

    /**
     * Obtener color del badge según validationStatus
     */
    public function getValidationStatusColor(): string
    {
        return match($this->validationStatus) {
            'REGISTERED' => 'blue',
            'VALIDATING' => 'yellow',
            'APPROVED' => 'green',
            'GENERATED' => 'emerald',
            'REFUSED', 'ERROR' => 'red',
            'EXPIRED' => 'gray',
            default => 'slate'
        };
    }

    /**
     * Obtener descripción amigable del validationStatus
     */
    public function getValidationStatusDescription(): string
    {
        return match($this->validationStatus) {
            'REGISTERED' => 'Solicitud registrada, lista para enviar',
            'VALIDATING' => 'En proceso de validación por FirmaSegura',
            'APPROVED' => 'Aprobada, generando certificado',
            'GENERATED' => 'Certificado generado y enviado por email',
            'REFUSED' => 'Rechazada por documentación incorrecta',
            'ERROR' => 'Error en procesamiento (ej: sin conexión Registro Civil)',
            'EXPIRED' => 'Certificado expirado',
            default => 'Estado desconocido'
        };
    }

    /**
     * Verificar si el estado permite edición
     */
    public function isEditable(): bool
    {
        return $this->canBeEdited() && in_array($this->validationStatus, ['REGISTERED', 'REFUSED', 'ERROR']);
    }

    /**
     * Verificar si está en proceso activo en FirmaSegura
     */
    public function isActivelyProcessing(): bool
    {
        return in_array($this->validationStatus, ['VALIDATING', 'APPROVED']);
    }

    /**
     * Verificar si el proceso está completo
     */
    public function isCompleted(): bool
    {
        return $this->validationStatus === 'GENERATED';
    }

    /**
     * Verificar si hubo algún error
     */
    public function hasErrors(): bool
    {
        return in_array($this->validationStatus, ['REFUSED', 'ERROR']) || $this->status === 'rejected';
    }

    /**
     * Actualizar desde respuesta de FirmaSegura
     */
    public function updateFromFirmaSeguraResponse(array $responseData): void
    {
        $validationStatus = $responseData['validationStatus'] ?? $this->validationStatus;
        
        // Determinar status interno basado en validationStatus
        $internalStatus = match($validationStatus) {
            'REGISTERED' => 'draft',
            'VALIDATING' => 'in_review',
            'APPROVED' => 'approved',
            'GENERATED' => 'completed',
            'REFUSED', 'ERROR' => 'rejected',
            'EXPIRED' => 'rejected',
            default => $this->status
        };

        $this->update([
            'status' => $internalStatus,
            'validationStatus' => $validationStatus,
            'metadata' => array_merge($this->metadata ?? [], [
                'last_status_response' => $responseData,
                'last_status_check' => now()->toISOString()
            ])
        ]);
    }
}
