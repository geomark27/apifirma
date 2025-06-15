<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Certification;
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

            // **AHORA REDIRIGE AL INDEX DE CERTIFICACIONES**
            return redirect()
                ->route('user.certifications.index')
                ->with('success', 'Solicitud de certificación creada exitosamente.');

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
        // Solo propietario o admin
        if ($certification->user_id !== Auth::id() && ! Auth::user()->hasRole('admin')) {
            abort(403);
        }

        $certification->load(['user', 'processedBy']);

        return Inertia::render('certifications/Show', [
            'certification'           => $certification,
            'statusOptions'           => Certification::STATUS_OPTIONS,
            'validationStatusOptions' => Certification::VALIDATION_STATUSES,
            'canEdit'                 => $this->canEditByValidationStatus($certification),
            'canDelete'               => $certification->validationStatus === 'REGISTERED',
        ]);
    }

    /**
     * Mostrar formulario de edición
     */
    public function edit(Certification $certification)
    {
        if ($certification->user_id !== Auth::id()) {
            abort(403);
        }
        if (! $certification->canBeEdited()) {
            return redirect()
                ->route('user.certifications.show', $certification)
                ->with('error', 'No puedes editar esta certificación ahora.');
        }

        return Inertia::render('certifications/Edit', [
            'certification'    => $certification,
            'applicationTypes' => Certification::APPLICATION_TYPES,
            'periods'          => Certification::PERIODS,
            'cities'           => Certification::CITIES,
            'provinces'        => Certification::PROVINCES,
        ]);
    }

    /**
     * Actualizar certificación
     */

    public function update(Request $request, Certification $certification): RedirectResponse
    {
        // Solo propietario
        if ($certification->user_id !== Auth::id()) {
            abort(403);
        }

        // Sólo se permite editar si está en REGISTERED, REFUSED o ERROR
        if (! in_array($certification->validationStatus, ['REGISTERED','REFUSED','ERROR'])) {
            return redirect()->back()
                             ->with('error', "No se puede editar una solicitud con estado '{$certification->validationStatus}'.");
        }

        $rules    = $this->getValidationRules($request->applicationType ?? $certification->applicationType);
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

            $this->handleFileUploads($request, $certification);

            DB::commit();

            return redirect()
                ->route('user.certifications.index')
                ->with('success', 'Certificación actualizada exitosamente.');

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
    public function submit(Certification $certification)
    {
        if ($certification->user_id !== Auth::id()) {
            abort(403);
        }
        if (! $certification->canBeSubmitted()) {
            return redirect()
                ->route('user.certifications.show', $certification)
                ->with('error', 'La certificación no está completa.');
        }

        $certification->markAsSubmitted();

        return redirect()
            ->route('user.certifications.show', $certification)
            ->with('success', 'Certificación enviada para revisión.');
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
     * Helper interno: define cuándo se puede editar según validationStatus
     */
    protected function canEditByValidationStatus(Certification $cert): bool
    {
        return in_array($cert->validationStatus, ['REGISTERED','REFUSED','ERROR']);
    }
}
