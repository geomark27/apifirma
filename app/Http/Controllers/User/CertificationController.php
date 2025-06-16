<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Certification;
use App\Services\FirmaSeguraService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CertificationController extends Controller
{
    /**
     * Mostrar lista de certificaciones del usuario
     */
    public function index(Request $request)
    {
        $query = Certification::where('user_id', Auth::id())
                              ->with(['processedBy']);

        // Filtros
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('validationStatus')) {
            $query->where('validationStatus', $request->validationStatus);
        }
        if ($request->filled('type')) {
            $query->where('applicationType', $request->type);
        }

        $certifications = $query->latest()
                                ->paginate(10)
                                ->withQueryString();

        return Inertia::render('certifications/Index', [
            'certifications'            => $certifications,
            'filters'                   => $request->only(['status', 'validationStatus', 'type']),
            'statusOptions'             => Certification::STATUS_OPTIONS,
            'validationStatusOptions'   => Certification::VALIDATION_STATUSES,
            'applicationTypes'          => Certification::APPLICATION_TYPES,
        ]);
    }

    /**
     * Mostrar formulario para crear nueva certificación
     */
    public function create()
    {
        return Inertia::render('certifications/Create', [
            'applicationTypes' => Certification::APPLICATION_TYPES,
            'periods'          => Certification::PERIODS,
            'cities'           => Certification::CITIES,
            'provinces'        => Certification::PROVINCES,
        ]);
    }

    /**
     * Guardar nueva certificación
     */
    public function store(Request $request)
    {
        $rules   = $this->getValidationRules($request->applicationType ?? 'NATURAL_PERSON');
        $messages = $this->getValidationMessages();
        $request->validate($rules, $messages);

        DB::beginTransaction();
        try {
            $certification = Certification::create([
                'certification_number'      => Certification::generateCertificationNumber($request->identificationNumber,$request->applicationType),
                'user_id'                   => Auth::id(),
                'dateOfBirth'               => Certification::verificateAge($request->dateOfBirth),
                'clientAge'                 => Certification::calculateAge($request->dateOfBirth),
                'identificationNumber'      => $request->identificationNumber,
                'applicantName'             => $request->applicantName,
                'applicantLastName'         => $request->applicantLastName,
                'applicantSecondLastName'   => $request->applicantSecondLastName,
                'fingerCode'                => strtoupper($request->fingerCode),
                'emailAddress'              => $request->emailAddress,
                'cellphoneNumber'           => $request->cellphoneNumber,
                'city'                      => $request->city,
                'province'                  => $request->province,
                'address'                   => $request->address,
                'countryCode'               => 'ECU',
                'companyRuc'                => $request->companyRuc,
                'positionCompany'           => $request->positionCompany,
                'companySocialReason'       => $request->companySocialReason,
                'appointmentExpirationDate' => $request->appointmentExpirationDate,
                'documentType'              => 'CI',
                'applicationType'           => $request->applicationType,
                'referenceTransaction'      => $request->referenceTransaction,
                'period'                    => $request->period,
                'terms_accepted'            => $request->boolean('terms_accepted'),
                'ip_address'                => $request->ip(),
                'user_agent'                => $request->userAgent(),
            ]);

            // Manejar archivos
            $this->handleFileUploads($request, $certification);

            DB::commit();

            return redirect()
                ->route('user.certifications.show', $certification)
                    ->with('success', 'Solicitud de certificación creada exitosamente. Verifica los datos antes de enviar.');

        } catch (\Throwable $th) {
            DB::rollBack();
            Log::channel('debugging')->error('Error al crear certificación: '.$th->getMessage(), [
                'file'         => $th->getFile(),
                'line'         => $th->getLine(),
                'user_id'      => Auth::id(),
                'request_data' => $request->except(['password']),
            ]);

            return redirect()->back()
                             ->withInput()
                             ->with('error', 'Error al crear la solicitud. Intenta nuevamente.');
        }
    }

    /**
     * Mostrar certificación específica
     */
    public function show(Certification $certification)
    {
        // Permitir si: (dueño + rol user) o rol admin
        $this->validateRole($certification);

        $certification->load(['user', 'processedBy']);

        // Calcular edad en tiempo real si es necesario
        $currentAge = $certification->dateOfBirth ? 
            \Carbon\Carbon::parse($certification->dateOfBirth)->age : null;

        return Inertia::render('certifications/Show', [
            'certification' => [
                ...$certification->toArray(),
                'current_age' => $currentAge,
                'is_over_65' => $currentAge && $currentAge >= 65,
                'formatted_created_at' => $certification->created_at->format('d/m/Y H:i'),
                'formatted_updated_at' => $certification->updated_at->format('d/m/Y H:i'),
                'formatted_appointment_expiration' => $certification->appointmentExpirationDate ? 
                    \Carbon\Carbon::parse($certification->appointmentExpirationDate)->format('d/m/Y') : null,
            ],
            'statusOptions' => Certification::STATUS_OPTIONS,
            'validationStatusOptions' => Certification::VALIDATION_STATUSES,
            'applicationTypes' => Certification::APPLICATION_TYPES,
            'periods' => Certification::PERIODS,
            'canEdit' => $this->canEditByValidationStatus($certification),
            'canDelete' => $certification->validationStatus === 'REGISTERED',
            'canSubmit' => $certification->status === 'draft' && $this->isCompleteCertification($certification),
            'hasCompanyDocs' => $certification->applicationType === 'LEGAL_REPRESENTATIVE' || 
                            ($certification->applicationType === 'NATURAL_PERSON' && !empty($certification->companyRuc)),
        ]);
    }

    /**
     * Mostrar formulario de edición
     */
    public function edit(Certification $certification)
    {
        // Permitir si: (dueño + rol user) o rol admin
        $this->validateRole($certification);
        
        // Verificar si se puede editar basado en validationStatus
        if (!in_array($certification->validationStatus, ['REGISTERED', 'REFUSED', 'ERROR'])) {
            return redirect()
                ->route('user.certifications.show', $certification)
                ->with('error', "No puedes editar una certificación con estado '{$certification->validationStatus}'.");
        }

        // Calcular edad actual
        $currentAge = $certification->dateOfBirth ? 
            \Carbon\Carbon::parse($certification->dateOfBirth)->age : null;

        return Inertia::render('certifications/Edit', [
            'certification' => [
                ...$certification->toArray(),
                'current_age' => $currentAge,
                'is_over_65' => $currentAge && $currentAge >= 65,
            ],
            'applicationTypes' => Certification::APPLICATION_TYPES,
            'periods' => Certification::PERIODS,
            'cities' => Certification::CITIES,
            'provinces' => Certification::PROVINCES,
            'statusOptions' => Certification::STATUS_OPTIONS,
            'validationStatusOptions' => Certification::VALIDATION_STATUSES,
            'canEdit' => true, // Si llegó hasta aquí es porque puede editar
            'hasCompanyDocs' => $certification->applicationType === 'LEGAL_REPRESENTATIVE' || 
                            ($certification->applicationType === 'NATURAL_PERSON' && !empty($certification->companyRuc)),
        ]);
    }

    /**
     * Actualizar certificación
     */
    public function update(Request $request, Certification $certification): RedirectResponse
    {
        // Solo propietario
        $this->validateRole($certification);

        // Sólo se permite editar si está en REGISTERED, REFUSED o ERROR
        if (!in_array($certification->validationStatus, ['REGISTERED','REFUSED','ERROR'])) {
            return redirect()->back()
                            ->with('error', "No se puede editar una solicitud con estado '{$certification->validationStatus}'.");
        }

        // ✅ USAR REGLAS ESPECÍFICAS PARA UPDATE
        $rules = $this->getValidationRulesForUpdate($request->applicationType ?? $certification->applicationType, $certification);
        $messages = $this->getValidationMessages();
        $request->validate($rules, $messages);

        DB::beginTransaction();
        try {
            $certification->update([
                'dateOfBirth'               => Certification::verificateAge($request->dateOfBirth),
                'clientAge'                 => Certification::calculateAge($request->dateOfBirth),
                'identificationNumber'      => $request->identificationNumber,
                'applicantName'             => $request->applicantName,
                'applicantLastName'         => $request->applicantLastName,
                'applicantSecondLastName'   => $request->applicantSecondLastName,
                'fingerCode'                => strtoupper($request->fingerCode),
                'emailAddress'              => $request->emailAddress,
                'cellphoneNumber'           => $request->cellphoneNumber,
                'city'                      => $request->city,
                'province'                  => $request->province,
                'address'                   => $request->address,
                'companyRuc'                => $request->companyRuc,
                'positionCompany'           => $request->positionCompany,
                'companySocialReason'       => $request->companySocialReason,
                'appointmentExpirationDate' => $request->appointmentExpirationDate,
                'applicationType'           => $request->applicationType,
                'referenceTransaction'      => $request->referenceTransaction,
                'period'                    => $request->period,
                'terms_accepted'            => $request->boolean('terms_accepted'),
            ]);

            // ✅ Solo subir archivos nuevos
            $this->handleFileUploads($request, $certification);

            DB::commit();

            return redirect()
            ->route('user.certifications.show', $certification)
            ->with('success', 'Solicitud de certificación actualizada exitosamente. Verifica los datos antes de enviar.');

        } catch (\Throwable $th) {
            DB::rollBack();
            Log::channel('debugging')->error('Error al actualizar certificación: '.$th->getMessage(), [
                'file'             => $th->getFile(),
                'line'             => $th->getLine(),
                'certification_id' => $certification->id,
                'user_id'          => Auth::id(),
            ]);

            return redirect()->back()
                            ->withInput()
                            ->with('error', 'Error al actualizar la certificación.');
        }
    }

    /**
     * Enviar certificación para revisión
     */
    public function submit(Certification $certification, FirmaSeguraService $firmaSeguraService)
    {
        $this->validateRole($certification);

        // Verificar que se puede enviar
        if (!$certification->canBeSubmitted()) {
            return redirect()
                ->route('user.certifications.show', $certification)
                ->with('error', 'La certificación no está completa o no se puede enviar en su estado actual.');
        }

        // Verificar que no esté ya procesándose
        if (in_array($certification->validationStatus, ['VALIDATING', 'APPROVED', 'GENERATED'])) {
            return redirect()
                ->route('user.certifications.show', $certification)
                ->with('warning', 'Esta certificación ya está siendo procesada por FirmaSegura.');
        }

        try {
            // Enviar a FirmaSegura usando el servicio
            $result = $firmaSeguraService->submitCertification($certification);

            if ($result['success']) {
                // Éxito
                return redirect()
                    ->route('user.certifications.show', $certification)
                    ->with('success', 'Certificación enviada exitosamente a FirmaSegura para procesamiento.');
            } else {
                // Error controlado
                return redirect()
                    ->route('user.certifications.show', $certification)
                    ->with('error', $result['message'])
                    ->with('error_details', $result['error_details'] ?? null);
            }

        } catch (\Exception $e) {
            // Error inesperado
            Log::channel('debugging')->error('Error inesperado en submit de certificación', [
                'certification_id' => $certification->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return redirect()
                ->route('user.certifications.show', $certification)
                ->with('error', 'Ocurrió un error inesperado. Por favor, intente nuevamente.');
        }
    }

    /**
     * Consultar estado actualizado de la certificación en FirmaSegura
    */
    public function refreshStatus(Certification $certification, FirmaSeguraService $firmaSeguraService)
    {
        $this->validateRole($certification);

        // Solo consultar si ya fue enviada a FirmaSegura
        if ($certification->validationStatus === 'REGISTERED' || $certification->status === 'draft') {
            return redirect()
                ->route('user.certifications.show', $certification)
                ->with('warning', 'Esta certificación aún no ha sido enviada a FirmaSegura.');
        }

        try {
            $result = $firmaSeguraService->checkCertificationStatus($certification);

            if ($result['success']) {
                return redirect()
                    ->route('user.certifications.show', $certification)
                    ->with('success', 'Estado actualizado correctamente.')
                    ->with('status_data', $result['data'] ?? null);
            } else {
                return redirect()
                    ->route('user.certifications.show', $certification)
                    ->with('error', 'No se pudo consultar el estado de la certificación.');
            }

        } catch (\Exception $e) {
            Log::channel('debugging')->error('Error al consultar estado de certificación', [
                'certification_id' => $certification->id,
                'error' => $e->getMessage()
            ]);

            return redirect()
                ->route('user.certifications.show', $certification)
                ->with('error', 'Error al consultar el estado de la certificación.');
        }
    }

    /**
     * Eliminar certificación (solo borradores)
     */
    public function destroy(Certification $certification): RedirectResponse
    {
        if ($certification->user_id !== Auth::id()) {
            abort(403);
        }

        if ($certification->validationStatus !== 'REGISTERED') {
            return redirect()
                ->route('user.certifications.index')
                ->with('error', "Sólo se pueden eliminar solicitudes en estado REGISTERED. Estado actual: {$certification->validationStatus}");
        }

        // Borro archivos
        $this->deleteAssociatedFiles($certification);
        $certification->delete();

        return redirect()
            ->route('user.certifications.index')
            ->with('success', 'Certificación eliminada exitosamente.');
    }

    /**
     * Ruta para descarga segura de archivos
     */
    public function downloadFile(Request $request)
    {
        $path = $request->query('path');
        
        if (!$path || !Storage::disk('public')->exists($path)) {
            abort(404, 'Archivo no encontrado.');
        }

        // Extraer número de identificación del path para verificar permisos
        $pathParts = explode('/', $path);
        if (count($pathParts) < 3 || $pathParts[0] !== 'certifications') {
            abort(404, 'Ruta de archivo inválida.');
        }

        $identificationNumber = $pathParts[1];
        
        // Verificar que el usuario tiene permiso para acceder a este archivo
        $certification = Certification::where('identificationNumber', $identificationNumber)->first();
        
        if (!$certification) {
            abort(404, 'Certificación no encontrada.');
        }

        // Solo propietario o admin pueden descargar
        if ($certification->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            abort(403, 'No tienes permisos para acceder a este archivo.');
        }

        $fullPath = Storage::disk('public')->path($path);
        $fileName = basename($path);
        
        return response()->download($fullPath, $fileName);
    }


    private function validateRole(Certification $certification): void
    {
        // Permitir si: (dueño + rol user) o rol admin
        if (
            !($certification->user_id === Auth::user()->id && Auth::user()->hasRole('user')) && !Auth::user()->hasRole('admin')
        ) {
            abort(403, 'No tienes autorización para ver esta certificación.');
        }
    }
    /**
     * Manejar subida de archivos
     */
    private function handleFileUploads(Request $request, Certification $certification): void
    {
        $fileFields = [
            'identificationFront',
            'identificationBack',
            'identificationSelfie',
            'pdfCompanyRuc',
            'pdfRepresentativeAppointment',
            'pdfAppointmentAcceptance',
            'pdfCompanyConstitution',
            'authorizationVideo',
        ];

        // Usar identificationNumber para la carpeta
        $basePath = "certifications/{$certification->identificationNumber}";

        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                if ($certification->$field) {
                    Storage::disk('public')->delete($certification->$field);
                }
                $path = $request->file($field)
                                ->store($basePath, 'public');
                $certification->update([$field => $path]);
            }
        }
    }

    /**
     * Eliminar archivos asociados
     */
    private function deleteAssociatedFiles(Certification $certification): void
    {
        $files = [
            $certification->identificationFront,
            $certification->identificationBack,
            $certification->identificationSelfie,
            $certification->pdfCompanyRuc,
            $certification->pdfRepresentativeAppointment,
            $certification->pdfAppointmentAcceptance,
            $certification->pdfCompanyConstitution,
            $certification->authorizationVideo,
        ];

        foreach (array_filter($files) as $file) {
            Storage::disk('public')->delete($file);
        }
    }

    /**
     * Reglas de validación según tipo de aplicación
     */
    private function getValidationRules(string $applicationType): array
    {
        $baseRules = [
            'identificationNumber'      => 'required|string|size:10',
            'applicantName'             => 'required|string|max:100',
            'applicantLastName'         => 'required|string|max:100',
            'applicantSecondLastName'   => 'nullable|string|max:100',
            'fingerCode'                => ['required','string','regex:/^[A-Z]\d{4}[A-Z]\d{4}$/'],
            'emailAddress'              => 'required|email|max:100',
            'cellphoneNumber'           => ['required','string','regex:/^\+5939\d{8}$/'],
            'city'                      => 'required|string|in:'.implode(',', Certification::CITIES),
            'province'                  => 'required|string|in:'.implode(',', Certification::PROVINCES),
            'address'                   => 'required|string|min:15|max:100',
            'applicationType'           => 'required|in:NATURAL_PERSON,LEGAL_REPRESENTATIVE',
            'referenceTransaction'      => 'required|string|max:150',
            'period'                    => 'required|in:ONE_WEEK,ONE_MONTH,ONE_YEAR,TWO_YEARS,THREE_YEARS,FOUR_YEARS,FIVE_YEARS',
            'terms_accepted'            => 'required|accepted',
            'identificationFront'       => 'required|file|mimes:jpg,png|max:5120',
            'identificationBack'        => 'required|file|mimes:jpg,png|max:5120',
            'identificationSelfie'      => 'required|file|mimes:jpg,png|max:5120',
        ];

        // Si es Natural y proporciona RUC, exigir ambos campos
        if ($applicationType === 'NATURAL_PERSON') {
            $baseRules['companyRuc']    = 'nullable|string|size:13|required_with:pdfCompanyRuc';
            $baseRules['pdfCompanyRuc'] = 'nullable|file|mimes:pdf|max:10240|required_with:companyRuc';
        }

        // Reglas adicionales para representante legal
        if ($applicationType === 'LEGAL_REPRESENTATIVE') {
            $baseRules = array_merge($baseRules, [
                'companyRuc'                => 'required|string|size:13',
                'positionCompany'           => 'required|string|max:100',
                'companySocialReason'       => 'required|string|max:250',
                'appointmentExpirationDate' => 'required|date|after:today',
                'pdfCompanyRuc'             => 'required|file|mimes:pdf|max:10240',
                'pdfRepresentativeAppointment' => 'required|file|mimes:pdf|max:10240',
                'pdfAppointmentAcceptance'     => 'required|file|mimes:pdf|max:10240',
                'pdfCompanyConstitution'       => 'required|file|mimes:pdf|max:10240',
            ]);
        }

        return $baseRules;
    }

    /**
     * Mensajes de validación personalizados
     */
    private function getValidationMessages(): array
    {
        return [
            'identificationNumber.size'          => 'El número de identificación debe tener 10 caracteres.',
            'fingerCode.regex'                   => 'El código dactilar debe tener 2 letras mayúsculas seguidas de 8 números.',
            'cellphoneNumber.regex'              => 'El número de celular debe tener el formato +5939XXXXXXXX.',
            'address.min'                        => 'La dirección debe tener al menos 15 caracteres.',
            'terms_accepted.accepted'            => 'Debe aceptar los términos y condiciones.',
            'companyRuc.required'                => 'El RUC es obligatorio.',
            'companyRuc.size'                    => 'El RUC debe tener 13 dígitos.',
            'companyRuc.required_with'           => 'Debes ingresar el RUC si subes el PDF.',
            'pdfCompanyRuc.required_with'        => 'Debes subir el PDF del RUC si ingresas el RUC.',
            'identificationFront.required'       => 'La imagen frontal de la cédula es obligatoria.',
            'identificationBack.required'        => 'La imagen posterior de la cédula es obligatoria.',
            'identificationSelfie.required'      => 'La selfie con cédula es obligatoria.',
        ];
    }

    /**
     * Verificar si se puede editar basado en validationStatus
     */
    private function canEditByValidationStatus(Certification $certification): bool
    {
        return in_array($certification->validationStatus, ['REGISTERED', 'REFUSED', 'ERROR']);
    }

    /**
     * Verificar si la certificación está completa para envío
     */
    private function isCompleteCertification(Certification $certification): bool
    {

        $requiredFields = [
            'identificationNumber', 'applicantName', 'applicantLastName',
            'fingerCode', 'emailAddress', 'cellphoneNumber', 'city', 
            'province', 'address', 'applicationType', 'period', 'terms_accepted'
        ];

        foreach ($requiredFields as $field) {
            if (empty($certification->$field)) {
                return false;
            }
        }

        // Archivos básicos requeridos
        $requiredFiles = ['identificationFront', 'identificationBack', 'identificationSelfie'];
        foreach ($requiredFiles as $file) {
            if (empty($certification->$file)) {
                return false;
            }
        }

        // Si es representante legal, verificar archivos empresariales
        if ($certification->applicationType === 'LEGAL_REPRESENTATIVE') {
            $companyFiles = ['pdfCompanyRuc', 'pdfRepresentativeAppointment', 'pdfAppointmentAcceptance'];
            foreach ($companyFiles as $file) {
                if (empty($certification->$file)) {
                    return false;
                }
            }
        }

        // Si es persona natural con RUC, verificar RUC
        if ($certification->applicationType === 'NATURAL_PERSON' && !empty($certification->companyRuc)) {
            if (empty($certification->pdfCompanyRuc)) {
                return false;
            }
        }

        // Si es mayor de 65 años, verificar video
        if ($certification->clientAge && $certification->clientAge >= 65) {
            if (empty($certification->authorizationVideo)) {
                return false;
            }
        }

        return true;
    }

    private function updateInternalStatus(Certification $certification): void
    {
        // Si está completa y en borrador, cambiar a pending
        if ($certification->status === 'draft' && $this->isCompleteCertification($certification)) {
            $certification->update(['status' => 'pending']);
        }
        
        // Si falta información y está en pending, regresar a draft
        if ($certification->status === 'pending' && !$this->isCompleteCertification($certification)) {
            $certification->update(['status' => 'draft']);
        }
    }

    /**
     * Reglas de validación específicas para UPDATE
     */
    private function getValidationRulesForUpdate(string $applicationType, Certification $certification): array
    {
        $baseRules = [
            'identificationNumber'      => 'required|string|size:10',
            'applicantName'             => 'required|string|max:100',
            'applicantLastName'         => 'required|string|max:100',
            'applicantSecondLastName'   => 'nullable|string|max:100',
            'fingerCode'                => ['required','string','regex:/^[A-Z]\d{4}[A-Z]\d{4}$/'],
            'emailAddress'              => 'required|email|max:100',
            'cellphoneNumber'           => ['required','string','regex:/^\+5939\d{8}$/'],
            'city'                      => 'required|string|in:'.implode(',', Certification::CITIES),
            'province'                  => 'required|string|in:'.implode(',', Certification::PROVINCES),
            'address'                   => 'required|string|min:15|max:100',
            'applicationType'           => 'required|in:NATURAL_PERSON,LEGAL_REPRESENTATIVE',
            'referenceTransaction'      => 'required|string|max:150',
            'period'                    => 'required|in:ONE_WEEK,ONE_MONTH,ONE_YEAR,TWO_YEARS,THREE_YEARS,FOUR_YEARS,FIVE_YEARS',
            'terms_accepted'            => 'required|accepted',
            'dateOfBirth'               => 'required|date|before:today',
            
            // ✅ ARCHIVOS OPCIONALES EN UPDATE (solo si se suben nuevos)
            'identificationFront'       => 'nullable|file|mimes:jpg,png|max:5120',
            'identificationBack'        => 'nullable|file|mimes:jpg,png|max:5120',
            'identificationSelfie'      => 'nullable|file|mimes:jpg,png|max:5120',
        ];

        // Verificar que archivos básicos existan (si no se están subiendo nuevos)
        if (!request()->hasFile('identificationFront') && !$certification->identificationFront) {
            $baseRules['identificationFront'] = 'required|file|mimes:jpg,png|max:5120';
        }
        if (!request()->hasFile('identificationBack') && !$certification->identificationBack) {
            $baseRules['identificationBack'] = 'required|file|mimes:jpg,png|max:5120';
        }
        if (!request()->hasFile('identificationSelfie') && !$certification->identificationSelfie) {
            $baseRules['identificationSelfie'] = 'required|file|mimes:jpg,png|max:5120';
        }

        // Si es Natural y proporciona RUC, exigir PDF solo si no existe
        if ($applicationType === 'NATURAL_PERSON') {
            $baseRules['companyRuc'] = 'nullable|string|size:13|required_with:pdfCompanyRuc';
            if (request()->filled('companyRuc')) {
                if (!request()->hasFile('pdfCompanyRuc') && !$certification->pdfCompanyRuc) {
                    $baseRules['pdfCompanyRuc'] = 'required|file|mimes:pdf|max:10240';
                } else {
                    $baseRules['pdfCompanyRuc'] = 'nullable|file|mimes:pdf|max:10240';
                }
            }
        }

        // Reglas adicionales para representante legal
        if ($applicationType === 'LEGAL_REPRESENTATIVE') {
            $baseRules = array_merge($baseRules, [
                'companyRuc'                => 'required|string|size:13',
                'positionCompany'           => 'required|string|max:100',
                'companySocialReason'       => 'required|string|max:250',
                'appointmentExpirationDate' => 'required|date|after:today',
            ]);

            // PDFs empresariales - solo requeridos si no existen
            $companyFiles = [
                'pdfCompanyRuc' => $certification->pdfCompanyRuc,
                'pdfRepresentativeAppointment' => $certification->pdfRepresentativeAppointment,
                'pdfAppointmentAcceptance' => $certification->pdfAppointmentAcceptance,
                'pdfCompanyConstitution' => $certification->pdfCompanyConstitution,
            ];

            foreach ($companyFiles as $field => $existingFile) {
                if (!request()->hasFile($field) && !$existingFile) {
                    $baseRules[$field] = 'required|file|mimes:pdf|max:10240';
                } else {
                    $baseRules[$field] = 'nullable|file|mimes:pdf|max:10240';
                }
            }
        }

        // Video para mayores de 65 años
        $age = \Carbon\Carbon::parse(request('dateOfBirth'))->age;
        if ($age >= 65) {
            if (!request()->hasFile('authorizationVideo') && !$certification->authorizationVideo) {
                $baseRules['authorizationVideo'] = 'required|file|mimes:mp4,mov,avi|max:10240';
            } else {
                $baseRules['authorizationVideo'] = 'nullable|file|mimes:mp4,mov,avi|max:10240';
            }
        }

        return $baseRules;
    }
}
