<?php

namespace App\Services;

use App\Models\Certification;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class FirmaSeguraService
{
    private Client $client;
    private string $apiUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->apiUrl = config('services.firmasegura.api_url');
        $this->apiKey = config('services.firmasegura.api_key');
        
        $this->client = new Client([
            'base_uri' => $this->apiUrl,
            'timeout' => 60,
            'headers' => [
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json'
            ]
        ]);
    }

    /**
     * Enviar certificación a FirmaSegura
     */
    public function submitCertification(Certification $certification): array
    {
        try {
            // 1. Actualizar estado interno a "enviando"
            $certification->update([
                'status' => 'pending',
                'submitted_at' => now(),
                'validationStatus' => 'VALIDATING'
            ]);

            // 2. Preparar datos JSON
            $jsonData = $this->buildJsonData($certification);

            Log::channel('debugging')->info("Enviando certificación a FirmaSegura", [
                'certification_id' => $certification->id,
                'reference_transaction' => $certification->referenceTransaction,
                'endpoint' => '/collector/request',
                'json_data_keys' => array_keys($jsonData) // Para ver qué campos se están enviando
            ]);

            // 3. Enviar solicitud
            $response = $this->client->post('/collector/request', [
                'json' => $jsonData
            ]);

            $statusCode = $response->getStatusCode();
            $responseBody = $response->getBody()->getContents();

            Log::channel('debugging')->info("Respuesta recibida de FirmaSegura", [
                'certification_id' => $certification->id,
                'status_code' => $statusCode,
                'response_body' => $responseBody,
                'response_length' => strlen($responseBody)
            ]);

            $responseData = json_decode($responseBody, true);

            // Verificar si el JSON es válido
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::channel('debugging')->error("Respuesta de FirmaSegura no es JSON válido", [
                    'certification_id' => $certification->id,
                    'response_body' => $responseBody,
                    'json_error' => json_last_error_msg()
                ]);

                // Tratar como éxito si el status code es 200, aunque el JSON sea inválido
                if ($response->getStatusCode() === 200) {
                    $responseData = [
                        'status' => 'success',
                        'message' => 'Solicitud enviada exitosamente',
                        'raw_response' => $responseBody
                    ];
                } else {
                    throw new \Exception("Respuesta inválida de FirmaSegura: " . $responseBody);
                }
            }

            // 4. Procesar respuesta exitosa
            return $this->handleSuccessResponse($certification, $responseData);

        } catch (RequestException $e) {
            // 5. Manejar errores HTTP
            return $this->handleHttpError($certification, $e);
        } catch (\Exception $e) {
            // 6. Manejar errores generales
            return $this->handleGeneralError($certification, $e);
        }
    }

    /**
     * Construir datos JSON para la petición
     */
    private function buildJsonData(Certification $certification): array
    {
        $jsonData = [];

        // Campos de texto obligatorios
        $jsonData['identificationNumber'] = $certification->identificationNumber;
        $jsonData['applicantName'] = $certification->applicantName;
        $jsonData['applicantLastName'] = $certification->applicantLastName;
        $jsonData['fingerCode'] = $certification->fingerCode;
        $jsonData['emailAddress'] = $certification->emailAddress;
        $jsonData['cellphoneNumber'] = $certification->cellphoneNumber;
        $jsonData['city'] = $certification->city;
        $jsonData['province'] = $certification->province;
        $jsonData['address'] = $certification->address;
        $jsonData['countryCode'] = $certification->countryCode;
        $jsonData['documentType'] = $certification->documentType;
        $jsonData['applicationType'] = $certification->applicationType;
        $jsonData['referenceTransaction'] = $certification->referenceTransaction;
        $jsonData['period'] = $certification->period;

        // Campos opcionales de texto
        if (!empty($certification->applicantSecondLastName)) {
            $jsonData['applicantSecondLastName'] = $certification->applicantSecondLastName;
        }

        // Campos empresariales (condicionales)
        if ($certification->applicationType === 'LEGAL_REPRESENTATIVE' || 
            ($certification->applicationType === 'NATURAL_PERSON' && !empty($certification->companyRuc))) {
            
            if (!empty($certification->companyRuc)) {
                $jsonData['companyRuc'] = $certification->companyRuc;
            }
            if (!empty($certification->positionCompany)) {
                $jsonData['positionCompany'] = $certification->positionCompany;
            }
            if (!empty($certification->companySocialReason)) {
                $jsonData['companySocialReason'] = $certification->companySocialReason;
            }
            if (!empty($certification->appointmentExpirationDate)) {
                $jsonData['appointmentExpirationDate'] = $certification->appointmentExpirationDate;
            }
        }

        // Archivos obligatorios como base64
        $requiredFiles = [
            'identificationFront',
            'identificationBack', 
            'identificationSelfie'
        ];

        foreach ($requiredFiles as $fileField) {
            $base64Data = $this->getFileAsBase64($certification, $fileField);
            if ($base64Data) {
                $jsonData[$fileField] = $base64Data;
            }
        }

        // Archivos condicionales
        $this->addConditionalFilesToJson($jsonData, $certification);

        return $jsonData;
    }

    /**
     * Agregar archivos condicionales según el tipo de aplicación
     */
    private function addConditionalFilesToJson(array &$jsonData, Certification $certification): void
    {
        // PDF del RUC (obligatorio para LEGAL_REPRESENTATIVE o NATURAL_PERSON con RUC)
        if ($certification->applicationType === 'LEGAL_REPRESENTATIVE' || 
            ($certification->applicationType === 'NATURAL_PERSON' && !empty($certification->companyRuc))) {
            $base64Data = $this->getFileAsBase64($certification, 'pdfCompanyRuc');
            if ($base64Data) {
                $jsonData['pdfCompanyRuc'] = $base64Data;
            }
        }

        // Documentos de representante legal
        if ($certification->applicationType === 'LEGAL_REPRESENTATIVE') {
            $legalFiles = [
                'pdfRepresentativeAppointment',
                'pdfAppointmentAcceptance',
                'pdfCompanyConstitution'
            ];

            foreach ($legalFiles as $fileField) {
                $base64Data = $this->getFileAsBase64($certification, $fileField);
                if ($base64Data) {
                    $jsonData[$fileField] = $base64Data;
                }
            }
        }

        // Video para personas >65 años
        if ($certification->clientAge > 65 && !empty($certification->authorizationVideo)) {
            $base64Data = $this->getFileAsBase64($certification, 'authorizationVideo');
            if ($base64Data) {
                $jsonData['authorizationVideo'] = $base64Data;
            }
        }
    }

    /**
     * Obtener archivo como string base64
     */
    private function getFileAsBase64(Certification $certification, string $fileField): ?string
    {
        $filePath = $certification->$fileField;
        
        if (empty($filePath) || !Storage::disk('public')->exists($filePath)) {
            Log::channel('debugging')->warning("Archivo faltante para certificación", [
                'certification_id' => $certification->id,
                'file_field' => $fileField,
                'file_path' => $filePath
            ]);
            return null;
        }

        try {
            $fileContents = Storage::disk('public')->get($filePath);
            return base64_encode($fileContents);
        } catch (\Exception $e) {
            Log::channel('debugging')->error("Error al leer archivo para conversión a base64", [
                'certification_id' => $certification->id,
                'file_field' => $fileField,
                'file_path' => $filePath,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Procesar respuesta exitosa de FirmaSegura
     */
    private function handleSuccessResponse(Certification $certification, array $responseData): array
    {
        // Determinar validationStatus basado en la respuesta
        $validationStatus = $responseData['validationStatus'] ?? 'REGISTERED';
        
        // Si no hay validationStatus específico pero la respuesta fue exitosa, usar REGISTERED
        if (empty($validationStatus) && isset($responseData['status']) && $responseData['status'] === 'success') {
            $validationStatus = 'REGISTERED';
        }

        $certification->update([
            'status' => 'in_review',
            'validationStatus' => $validationStatus,
            'metadata' => array_merge($certification->metadata ?? [], [
                'firmasegura_response' => $responseData,
                'submitted_to_firmasegura_at' => now()->toISOString(),
                'last_status_check' => now()->toISOString()
            ])
        ]);

        Log::channel('debugging')->info("Certificación enviada exitosamente a FirmaSegura", [
            'certification_id' => $certification->id,
            'validation_status' => $validationStatus,
            'reference_transaction' => $certification->referenceTransaction,
            'response_keys' => array_keys($responseData)
        ]);

        return [
            'success' => true,
            'message' => 'Certificación enviada exitosamente para procesamiento.',
            'validation_status' => $validationStatus,
            'data' => $responseData
        ];
    }

    /**
     * Manejar errores HTTP (4xx, 5xx)
     */
    private function handleHttpError(Certification $certification, RequestException $e): array
    {
        $statusCode = $e->getResponse() ? $e->getResponse()->getStatusCode() : 0;
        $responseBody = $e->getResponse() ? $e->getResponse()->getBody()->getContents() : '';
        
        $errorData = [];
        if (!empty($responseBody)) {
            $errorData = json_decode($responseBody, true) ?? [];
        }

        // Actualizar certificación con error
        $certification->update([
            'status' => 'rejected',
            'validationStatus' => 'ERROR',
            'rejection_reason' => $this->extractErrorMessage($errorData, $e->getMessage()),
            'metadata' => array_merge($certification->metadata ?? [], [
                'firmasegura_error' => [
                    'status_code' => $statusCode,
                    'response' => $errorData,
                    'occurred_at' => now()->toISOString()
                ]
            ])
        ]);

        Log::channel('debugging')->error("Error HTTP al enviar certificación a FirmaSegura", [
            'certification_id' => $certification->id,
            'status_code' => $statusCode,
            'error_response' => $errorData,
            'exception_message' => $e->getMessage()
        ]);

        return [
            'success' => false,
            'message' => 'Error al enviar la certificación. Por favor, revise los datos e intente nuevamente.',
            'error_details' => $this->extractErrorMessage($errorData, $e->getMessage()),
            'status_code' => $statusCode
        ];
    }

    /**
     * Manejar errores generales (timeouts, conexión, etc.)
     */
    private function handleGeneralError(Certification $certification, \Exception $e): array
    {
        $certification->update([
            'status' => 'draft', // Volver a draft para que puedan reintentarlo
            'validationStatus' => 'ERROR',
            'rejection_reason' => 'Error de conexión con el servicio de FirmaSegura: ' . $e->getMessage(),
            'metadata' => array_merge($certification->metadata ?? [], [
                'connection_error' => [
                    'message' => $e->getMessage(),
                    'occurred_at' => now()->toISOString()
                ]
            ])
        ]);

        Log::channel('debugging')->error("Error general al enviar certificación a FirmaSegura", [
            'certification_id' => $certification->id,
            'exception' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);

        return [
            'success' => false,
            'message' => 'Error de conexión con FirmaSegura. Por favor, intente nuevamente en unos minutos.',
            'error_details' => $e->getMessage()
        ];
    }

    /**
     * Extraer mensaje de error legible de la respuesta
     */
    private function extractErrorMessage(array $errorData, string $fallback): string
    {
        // Si hay mensajes específicos en el array 'messages'
        if (isset($errorData['messages']) && is_array($errorData['messages'])) {
            return implode(', ', $errorData['messages']);
        }

        // Si hay un campo 'error' o 'message'
        if (isset($errorData['error'])) {
            return $errorData['error'];
        }

        if (isset($errorData['message'])) {
            return $errorData['message'];
        }

        // Fallback al mensaje de la excepción
        return $fallback;
    }

    /**
     * Consultar estado de una certificación en FirmaSegura
     */
    public function checkCertificationStatus(Certification $certification): array
    {
        try {
            Log::channel('debugging')->info("Consultando estado en FirmaSegura", [
                'certification_id' => $certification->id,
                'reference_transaction' => $certification->referenceTransaction,
                'current_validation_status' => $certification->validationStatus,
                'endpoint' => '/gateway/request/status'
            ]);

            $response = $this->client->get('/gateway/request/status', [
                'query' => [
                    'referenceTransaction' => $certification->referenceTransaction
                ]
            ]);

            $statusCode = $response->getStatusCode();
            $responseBody = $response->getBody()->getContents();

            Log::channel('debugging')->info("Respuesta de consulta de estado recibida", [
                'certification_id' => $certification->id,
                'reference_transaction' => $certification->referenceTransaction,
                'status_code' => $statusCode,
                'response_body' => $responseBody,
                'response_length' => strlen($responseBody)
            ]);

            $statusData = json_decode($responseBody, true);

            // Verificar si el JSON es válido
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::channel('debugging')->error("Respuesta de consulta de estado no es JSON válido", [
                    'certification_id' => $certification->id,
                    'reference_transaction' => $certification->referenceTransaction,
                    'response_body' => $responseBody,
                    'json_error' => json_last_error_msg()
                ]);

                return [
                    'success' => false,
                    'message' => 'Respuesta inválida de FirmaSegura al consultar estado'
                ];
            }

            // Actualizar el validationStatus en base a la respuesta
            if (isset($statusData['validationStatus'])) {
                $oldStatus = $certification->validationStatus;
                $newStatus = $statusData['validationStatus'];

                $certification->update([
                    'validationStatus' => $newStatus,
                    'metadata' => array_merge($certification->metadata ?? [], [
                        'last_status_check' => now()->toISOString(),
                        'last_status_response' => $statusData
                    ])
                ]);

                Log::channel('debugging')->info("Estado de certificación actualizado", [
                    'certification_id' => $certification->id,
                    'reference_transaction' => $certification->referenceTransaction,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                    'status_changed' => $oldStatus !== $newStatus,
                    'response_data_keys' => array_keys($statusData)
                ]);
            } else {
                Log::channel('debugging')->warning("Respuesta de FirmaSegura no contiene validationStatus", [
                    'certification_id' => $certification->id,
                    'reference_transaction' => $certification->referenceTransaction,
                    'response_keys' => array_keys($statusData),
                    'full_response' => $statusData
                ]);
            }

            return [
                'success' => true,
                'data' => $statusData
            ];

        } catch (RequestException $e) {
            $statusCode = $e->getResponse() ? $e->getResponse()->getStatusCode() : 0;
            $responseBody = $e->getResponse() ? $e->getResponse()->getBody()->getContents() : '';

            Log::channel('debugging')->error("Error HTTP al consultar estado en FirmaSegura", [
                'certification_id' => $certification->id,
                'reference_transaction' => $certification->referenceTransaction,
                'status_code' => $statusCode,
                'response_body' => $responseBody,
                'exception_message' => $e->getMessage(),
                'endpoint' => '/gateway/request/status'
            ]);

            return [
                'success' => false,
                'message' => 'Error al consultar el estado de la certificación'
            ];
        } catch (\Exception $e) {
            Log::channel('debugging')->error("Error general al consultar estado de certificación", [
                'certification_id' => $certification->id,
                'reference_transaction' => $certification->referenceTransaction,
                'exception' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return [
                'success' => false,
                'message' => 'Error inesperado al consultar el estado'
            ];
        }
    }
}