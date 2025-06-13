<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class Certification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        // Información personal
        'identificationNumber',
        'applicantName',
        'applicantLastName',
        'applicantSecondLastName',
        'dateOfBirth',
        'clientAge',
        'fingerCode',
        'emailAddress',
        'cellphoneNumber',
        // Ubicación
        'city',
        'province',
        'address',
        'countryCode',
        // Información empresarial
        'companyRuc',
        'positionCompany',
        'companySocialReason',
        'appointmentExpirationDate',
        // Tipo de documento y aplicación
        'documentType',
        'applicationType',
        // Transacción
        'referenceTransaction',
        'period',
        // Archivos
        'identificationFront',
        'identificationBack',
        'identificationSelfie',
        'pdfCompanyRuc',
        'pdfRepresentativeAppointment',
        'pdfAppointmentAcceptance',
        'pdfCompanyConstitution',
        'authorizationVideo',
        // Estado
        'status',
        'rejection_reason',
        'processed_by',
        'processed_at',
        'submitted_at',
        // Metadatos
        'metadata',
        'terms_accepted',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'appointmentExpirationDate' => 'datetime',
        'processed_at' => 'datetime',
        'submitted_at' => 'datetime',
        'metadata' => 'array',
        'terms_accepted' => 'boolean',
    ];

    // Constantes para valores permitidos
    const DOCUMENT_TYPES = ['CI'];
    
    const APPLICATION_TYPES = [
        'NATURAL_PERSON' => 'Persona Natural',
        'LEGAL_REPRESENTATIVE' => 'Representante Legal',
    ];

    const PERIODS = [
        '1_YEAR' => '1 Año',
        '2_YEARS' => '2 Años',
        '3_YEARS' => '3 Años',
    ];

    const STATUS_OPTIONS = [
        'draft' => 'Borrador',
        'pending' => 'Pendiente',
        'in_review' => 'En Revisión',
        'approved' => 'Aprobado',
        'rejected' => 'Rechazado',
        'completed' => 'Completado',
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

    /**
     * Relación con usuario propietario
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con usuario que procesó la solicitud
     */
    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Scope para filtrar por estado
     */
    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Scope para filtrar por tipo de aplicación
     */
    public function scopeByApplicationType(Builder $query, string $type): Builder
    {
        return $query->where('applicationType', $type);
    }

    /**
     * Scope para solicitudes pendientes
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->whereIn('status', ['pending', 'in_review']);
    }

    /**
     * Scope para solicitudes completadas
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->whereIn('status', ['approved', 'completed']);
    }

    /**
     * Verificar si requiere documentos de empresa
     */
    public function requiresCompanyDocuments(): bool
    {
        return $this->applicationType === 'LEGAL_REPRESENTATIVE' || 
               ($this->applicationType === 'NATURAL_PERSON' && !empty($this->companyRuc));
    }

    /**
     * Verificar si requiere documentos de nombramiento
     */
    public function requiresAppointmentDocuments(): bool
    {
        return $this->applicationType === 'LEGAL_REPRESENTATIVE';
    }

    /**
     * Obtener progreso de completitud (porcentaje)
     */
    public function getCompletionPercentage(): int
    {
        $requiredFields = [
            'identificationNumber', 'applicantName', 'applicantLastName',
            'fingerCode', 'emailAddress', 'cellphoneNumber', 'city',
            'province', 'address', 'referenceTransaction', 'period',
            'identificationFront', 'identificationBack', 'identificationSelfie'
        ];

        // Agregar campos condicionales
        if ($this->requiresCompanyDocuments()) {
            $requiredFields[] = 'companyRuc';
            $requiredFields[] = 'pdfCompanyRuc';
        }

        if ($this->requiresAppointmentDocuments()) {
            $requiredFields = array_merge($requiredFields, [
                'positionCompany', 'companySocialReason', 
                'appointmentExpirationDate', 'pdfRepresentativeAppointment',
                'pdfAppointmentAcceptance', 'pdfCompanyConstitution'
            ]);
        }

        $completed = 0;
        foreach ($requiredFields as $field) {
            if (!empty($this->$field)) {
                $completed++;
            }
        }

        return round(($completed / count($requiredFields)) * 100);
    }

    /**
     * Validar formato de código dactilar
     */
    public function validateFingerCode(): bool
    {
        return preg_match('/^[A-Z]{2}\d{8}$/', $this->fingerCode);
    }

    /**
     * Validar formato de teléfono
     */
    public function validateCellphone(): bool
    {
        return preg_match('/^\+5939\d{8}$/', $this->cellphoneNumber);
    }

    /**
     * Obtener el estado en español
     */
    public function getStatusLabel(): string
    {
        return self::STATUS_OPTIONS[$this->status] ?? $this->status;
    }

    /**
     * Obtener el tipo de aplicación en español
     */
    public function getApplicationTypeLabel(): string
    {
        return self::APPLICATION_TYPES[$this->applicationType] ?? $this->applicationType;
    }

    /**
     * Obtener el período en español
     */
    public function getPeriodLabel(): string
    {
        return self::PERIODS[$this->period] ?? $this->period;
    }

    /**
     * Verificar si puede ser editada
     */
    public function canBeEdited(): bool
    {
        return in_array($this->status, ['draft', 'rejected']);
    }

    /**
     * Verificar si puede ser enviada
     */
    public function canBeSubmitted(): bool
    {
        return $this->status === 'draft' && 
               $this->getCompletionPercentage() === 100 && 
               $this->terms_accepted;
    }

    /**
     * Marcar como enviada
     */
    public function markAsSubmitted(): void
    {
        $this->update([
            'status' => 'pending',
            'submitted_at' => now(),
        ]);
    }

    /**
     * Aprobar solicitud
     */
    public function approve(User $processedBy, string $notes = null): void
    {
        $this->update([
            'status' => 'approved',
            'processed_by' => $processedBy->id,
            'processed_at' => now(),
            'metadata' => array_merge($this->metadata ?? [], [
                'approval_notes' => $notes,
                'approved_at' => now()->toISOString(),
            ]),
        ]);
    }

    /**
     * Rechazar solicitud
     */
    public function reject(User $processedBy, string $reason): void
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'processed_by' => $processedBy->id,
            'processed_at' => now(),
        ]);
    }
}