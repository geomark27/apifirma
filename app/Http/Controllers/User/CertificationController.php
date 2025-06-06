<?php

namespace App\Http\Controllers;

use App\Models\Certification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class CertificationController extends Controller
{
    /**
     * Mostrar lista de certificaciones del usuario
     * Ruta: GET /certifications
     */
    public function index(Request $request)
    {
        $query = Certification::where('user_id', Auth::id())->with(['processedBy']);

        // Filtro por estado
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filtro por tipo
        if ($request->filled('type')) {
            $query->where('applicationType', $request->type);
        }

        $certifications = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('certifications/Index', [
            'certifications' => $certifications,
            'filters' => $request->only(['status', 'type']),
            'statusOptions' => Certification::STATUS_OPTIONS,
            'applicationTypes' => Certification::APPLICATION_TYPES,
        ]);
    }

    /**
     * Mostrar formulario para crear nueva certificación
     * Ruta: GET /certifications/create
     */
    public function create()
    {
        return Inertia::render('certifications/Create', [
            'applicationTypes' => Certification::APPLICATION_TYPES,
            'periods' => Certification::PERIODS,
            'cities' => Certification::CITIES,
            'provinces' => Certification::PROVINCES,
        ]);
    }

    /**
     * Guardar nueva certificación
     * Ruta: POST /certifications
     */
    public function store(Request $request)
    {
        $rules = $this->getValidationRules($request->applicationType ?? 'NATURAL_PERSON');
        $request->validate($rules, $this->getValidationMessages());

        DB::beginTransaction();
        try {
            // Crear la certificación
            $certification = Certification::create([
                'user_id' => Auth::id(),
                'identificationNumber' => $request->identificationNumber,
                'applicantName' => $request->applicantName,
                'applicantLastName' => $request->applicantLastName,
                'applicantSecondLastName' => $request->applicantSecondLastName,
                'fingerCode' => strtoupper($request->fingerCode),
                'emailAddress' => $request->emailAddress,
                'cellphoneNumber' => $request->cellphoneNumber,
                'city' => $request->city,
                'province' => $request->province,
                'address' => $request->address,
                'countryCode' => 'ECU',
                'companyRuc' => $request->companyRuc,
                'positionCompany' => $request->positionCompany,
                'companySocialReason' => $request->companySocialReason,
                'appointmentExpirationDate' => $request->appointmentExpirationDate,
                'documentType' => 'CI',
                'applicationType' => $request->applicationType,
                'referenceTransaction' => $request->referenceTransaction,
                'period' => $request->period,
                'terms_accepted' => $request->boolean('terms_accepted'),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Manejar archivos
            $this->handleFileUploads($request, $certification);

            DB::commit();

            return redirect()->route('certifications.show', $certification)
                ->with('success', 'Solicitud de certificación creada exitosamente.');

        } catch (\Throwable $th) {
            DB::rollBack();
            
            Log::error('Error al crear certificación: ' . $th->getMessage(), [
                'user_id' => Auth::id(),
                'request_data' => $request->except(['password']),
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Error al crear la solicitud. Intenta nuevamente.');
        }
    }

    /**
     * Mostrar certificación específica
     * Ruta: GET /certifications/{certification}
     */
    public function show(Certification $certification)
    {
        // Verificar que pertenece al usuario o es admin
        if ($certification->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            abort(403, 'No tienes permisos para ver esta certificación.');
        }

        $certification->load(['user', 'processedBy']);

        return Inertia::render('certifications/Show', [
            'certification' => $certification,
            'completionPercentage' => $certification->getCompletionPercentage(),
            'canEdit' => $certification->canBeEdited(),
            'canSubmit' => $certification->canBeSubmitted(),
            'requiresCompanyDocs' => $certification->requiresCompanyDocuments(),
            'requiresAppointmentDocs' => $certification->requiresAppointmentDocuments(),
        ]);
    }

    /**
     * Mostrar formulario de edición
     * Ruta: GET /certifications/{certification}/edit
     */
    public function edit(Certification $certification)
    {
        // Verificar permisos y que pueda ser editada
        if ($certification->user_id !== Auth::id()) {
            abort(403, 'No tienes permisos para editar esta certificación.');
        }

        if (!$certification->canBeEdited()) {
            return redirect()->route('certifications.show', $certification)
                ->with('error', 'Esta certificación no puede ser editada en su estado actual.');
        }

        return Inertia::render('certifications/Edit', [
            'certification' => $certification,
            'applicationTypes' => Certification::APPLICATION_TYPES,
            'periods' => Certification::PERIODS,
            'cities' => Certification::CITIES,
            'provinces' => Certification::PROVINCES,
        ]);
    }

    /**
     * Actualizar certificación
     * Ruta: PUT /certifications/{certification}
     */
    public function update(Request $request, Certification $certification)
    {
        // Verificar permisos
        if ($certification->user_id !== Auth::id()) {
            abort(403, 'No tienes permisos para editar esta certificación.');
        }

        if (!$certification->canBeEdited()) {
            return redirect()->route('certifications.show', $certification)
                ->with('error', 'Esta certificación no puede ser editada.');
        }

        $rules = $this->getValidationRules($request->applicationType ?? $certification->applicationType);
        $request->validate($rules, $this->getValidationMessages());

        DB::beginTransaction();
        try {
            // Actualizar datos
            $certification->update([
                'identificationNumber' => $request->identificationNumber,
                'applicantName' => $request->applicantName,
                'applicantLastName' => $request->applicantLastName,
                'applicantSecondLastName' => $request->applicantSecondLastName,
                'fingerCode' => strtoupper($request->fingerCode),
                'emailAddress' => $request->emailAddress,
                'cellphoneNumber' => $request->cellphoneNumber,
                'city' => $request->city,
                'province' => $request->province,
                'address' => $request->address,
                'companyRuc' => $request->companyRuc,
                'positionCompany' => $request->positionCompany,
                'companySocialReason' => $request->companySocialReason,
                'appointmentExpirationDate' => $request->appointmentExpirationDate,
                'applicationType' => $request->applicationType,
                'referenceTransaction' => $request->referenceTransaction,
                'period' => $request->period,
                'terms_accepted' => $request->boolean('terms_accepted'),
            ]);

            // Actualizar archivos si se subieron nuevos
            $this->handleFileUploads($request, $certification);

            DB::commit();

            return redirect()->route('certifications.show', $certification)
                ->with('success', 'Certificación actualizada exitosamente.');

        } catch (\Throwable $th) {
            DB::rollBack();
            
            Log::error('Error al actualizar certificación: ' . $th->getMessage(), [
                'certification_id' => $certification->id,
                'user_id' => Auth::id(),
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Error al actualizar la certificación.');
        }
    }

    /**
     * Enviar certificación para revisión
     * Ruta: POST /certifications/{certification}/submit
     */
    public function submit(Certification $certification)
    {
        if ($certification->user_id !== Auth::id()) {
            abort(403, 'No tienes permisos para enviar esta certificación.');
        }

        if (!$certification->canBeSubmitted()) {
            return redirect()->route('certifications.show', $certification)
                ->with('error', 'La certificación no está completa o no puede ser enviada.');
        }

        $certification->markAsSubmitted();

        return redirect()->route('certifications.show', $certification)
            ->with('success', 'Certificación enviada para revisión exitosamente.');
    }

    /**
     * Eliminar certificación (solo borradores)
     * Ruta: DELETE /certifications/{certification}
     */
    public function destroy(Certification $certification)
    {
        if ($certification->user_id !== Auth::id()) {
            abort(403, 'No tienes permisos para eliminar esta certificación.');
        }

        if ($certification->status !== 'draft') {
            return redirect()->route('certifications.index')
                ->with('error', 'Solo se pueden eliminar borradores.');
        }

        // Eliminar archivos asociados
        $this->deleteAssociatedFiles($certification);
        
        $certification->delete();

        return redirect()->route('certifications.index')
            ->with('success', 'Certificación eliminada exitosamente.');
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
            'authorizationVideo'
        ];

        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                // Eliminar archivo anterior si existe
                if ($certification->$field) {
                    Storage::disk('public')->delete($certification->$field);
                }

                // Subir nuevo archivo
                $path = $request->file($field)->store(
                    "certifications/{$certification->id}",
                    'public'
                );
                
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
     * Obtener reglas de validación según tipo de aplicación
     */
    private function getValidationRules(string $applicationType): array
    {
        $baseRules = [
            'identificationNumber' => 'required|string|max:10',
            'applicantName' => 'required|string|max:100',
            'applicantLastName' => 'required|string|max:100',
            'applicantSecondLastName' => 'nullable|string|max:100',
            'fingerCode' => 'required|string|regex:/^[A-Z]{2}\d{8}$/',
            'emailAddress' => 'required|email|max:100',
            'cellphoneNumber' => 'required|string|regex:/^\+5939\d{8}$/',
            'city' => 'required|string|in:' . implode(',', Certification::CITIES),
            'province' => 'required|string|in:' . implode(',', Certification::PROVINCES),
            'address' => 'required|string|min:15|max:100',
            'applicationType' => 'required|in:NATURAL_PERSON,LEGAL_REPRESENTATIVE',
            'referenceTransaction' => 'required|string|max:150',
            'period' => 'required|in:1_YEAR,2_YEARS,3_YEARS',
            'terms_accepted' => 'required|accepted',
            // Archivos básicos
            'identificationFront' => 'required|file|mimes:jpg,png|max:5120',
            'identificationBack' => 'required|file|mimes:jpg,png|max:5120',
            'identificationSelfie' => 'required|file|mimes:jpg,png|max:5120',
        ];

        // Reglas condicionales para representante legal
        if ($applicationType === 'LEGAL_REPRESENTATIVE') {
            $baseRules = array_merge($baseRules, [
                'companyRuc' => 'required|string|max:13',
                'positionCompany' => 'required|string|max:100',
                'companySocialReason' => 'required|string|max:250',
                'appointmentExpirationDate' => 'required|date|after:today',
                'pdfCompanyRuc' => 'required|file|mimes:pdf|max:10240',
                'pdfRepresentativeAppointment' => 'required|file|mimes:pdf|max:10240',
                'pdfAppointmentAcceptance' => 'required|file|mimes:pdf|max:10240',
                'pdfCompanyConstitution' => 'required|file|mimes:pdf|max:10240',
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
            'identificationNumber.required' => 'El número de identificación es obligatorio.',
            'fingerCode.regex' => 'El código dactilar debe tener 2 letras mayúsculas seguidas de 8 números.',
            'cellphoneNumber.regex' => 'El número de celular debe tener el formato +5939XXXXXXXX.',
            'address.min' => 'La dirección debe tener al menos 15 caracteres.',
            'terms_accepted.accepted' => 'Debe aceptar los términos y condiciones.',
            'identificationFront.required' => 'La imagen frontal de la cédula es obligatoria.',
            'identificationBack.required' => 'La imagen posterior de la cédula es obligatoria.',
            'identificationSelfie.required' => 'La selfie con cédula es obligatoria.',
        ];
    }
}