<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('certifications', function (Blueprint $table) {
            $table->id();
            
            // Relación con usuario
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Información personal del solicitante
            $table->string('identificationNumber', 10); // Cédula
            $table->string('applicantName', 100);       // Nombre
            $table->string('applicantLastName', 100);   // Apellido paterno
            $table->string('applicantSecondLastName', 100)->nullable(); // Apellido materno
            $table->string('fingerCode', 10);           // Código dactilar (2 letras + 8 números)
            $table->string('emailAddress', 100);        // Email del solicitante
            $table->string('cellphoneNumber', 20);      // +5939 + 8 números
            
            // Ubicación
            $table->string('city', 100);                // Ciudad
            $table->string('province', 100);            // Provincia  
            $table->text('address');                    // Dirección (min 15, max 100 chars)
            $table->string('countryCode', 3)->default('ECU'); // Código país
            
            // Información empresarial (condicional)
            $table->string('companyRuc', 13)->nullable();    // RUC empresa
            $table->string('positionCompany', 100)->nullable();       // Cargo en empresa
            $table->string('companySocialReason', 250)->nullable();   // Razón social
            $table->timestamp('appointmentExpirationDate')->nullable(); // Vencimiento nombramiento
            
            // Tipo de documento y aplicación
            $table->enum('documentType', ['CI'])->default('CI'); 
            $table->enum('applicationType', [
                'NATURAL_PERSON', 
                'LEGAL_REPRESENTATIVE'
            ]);
            
            // Información de transacción
            $table->string('referenceTransaction', 150); 

            // Período de vigencia (Tabla 2)
            $table->enum('period', [
                'ONE_WEEK',
                'ONE_MONTH',
                'ONE_YEAR',
                'TWO_YEARS',
                'THREE_YEARS',
                'FOUR_YEARS',
                'FIVE_YEARS',
            ]);

            // Archivos de identificación (rutas de almacenamiento)
            $table->string('identificationFront')->nullable();
            $table->string('identificationBack')->nullable();
            $table->string('identificationSelfie')->nullable();
            
            // Archivos empresariales (condicionales)
            $table->string('pdfCompanyRuc')->nullable();
            $table->string('pdfRepresentativeAppointment')->nullable();
            $table->string('pdfAppointmentAcceptance')->nullable();
            $table->string('pdfCompanyConstitution')->nullable();
            
            // Video de autorización (opcional)
            $table->string('authorizationVideo')->nullable();
            
            // Estados de workflow interno
            $table->enum('status', [
                'draft',       // Borrador
                'pending',     // Pendiente revisión
                'in_review',   // En revisión
                'approved',    // Aprobado
                'rejected',    // Rechazado
                'completed',   // Completado
            ])->default('draft');
            
            // Estado de validación (Tabla 4)
            $table->enum('validationStatus', [
                'REGISTERED',
                'VALIDATING',
                'REFUSED',
                'ERROR',
                'APPROVED',
                'GENERATED',
                'EXPIRED',
            ])->default('REGISTERED');
            
            $table->text('rejection_reason')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            
            // Metadatos adicionales
            $table->json('metadata')->nullable();
            $table->boolean('terms_accepted')->default(false);
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            
            $table->timestamps();
            
            // Índices para búsquedas eficientes
            $table->index(['user_id', 'status']);
            $table->index(['validationStatus']);
            $table->index(['identificationNumber']);
            $table->index(['referenceTransaction']);
            $table->index(['status', 'created_at']);
            $table->index(['applicationType']);
            $table->index(['period']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certifications');
    }
};