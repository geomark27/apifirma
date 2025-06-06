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
            $table->string('applicantName', 100); // Nombre
            $table->string('applicantLastName', 100); // Apellido paterno
            $table->string('applicantSecondLastName', 100)->nullable(); // Apellido materno
            $table->string('fingerCode', 10); // Código dactilar (2 letras + 8 números)
            $table->string('emailAddress', 100); // Email del solicitante
            $table->string('cellphoneNumber', 20); // +5939 + 8 números
            
            // Ubicación
            $table->string('city', 100); // Ciudad
            $table->string('province', 100); // Provincia  
            $table->text('address'); // Dirección (min 15, max 100 chars)
            $table->string('countryCode', 3)->default('ECU'); // Código país
            
            // Información empresarial (condicional)
            $table->string('companyRuc', 13)->nullable(); // RUC empresa
            $table->string('positionCompany', 100)->nullable(); // Cargo en empresa
            $table->string('companySocialReason', 250)->nullable(); // Razón social
            $table->timestamp('appointmentExpirationDate')->nullable(); // Vencimiento nombramiento
            
            // Tipo de documento y aplicación
            $table->enum('documentType', ['CI'])->default('CI'); // Tipo documento
            $table->enum('applicationType', [
                'NATURAL_PERSON', 
                'LEGAL_REPRESENTATIVE'
            ]); // Tipo aplicación
            
            // Información de transacción
            $table->string('referenceTransaction', 150); // Referencia transacción
            $table->enum('period', [
                '1_YEAR', 
                '2_YEARS', 
                '3_YEARS'
            ]); // Período de vigencia
            
            // Archivos de identificación (rutas de almacenamiento)
            $table->string('identificationFront')->nullable(); // Cédula frontal
            $table->string('identificationBack')->nullable(); // Cédula posterior
            $table->string('identificationSelfie')->nullable(); // Selfie con cédula
            
            // Archivos empresariales (condicionales)
            $table->string('pdfCompanyRuc')->nullable(); // PDF RUC empresa
            $table->string('pdfRepresentativeAppointment')->nullable(); // PDF nombramiento
            $table->string('pdfAppointmentAcceptance')->nullable(); // PDF aceptación
            $table->string('pdfCompanyConstitution')->nullable(); // PDF constitución
            
            // Video de autorización (opcional)
            $table->string('authorizationVideo')->nullable(); // Video autorización
            
            // Estado y control del proceso
            $table->enum('status', [
                'draft', // Borrador
                'pending', // Pendiente revisión
                'in_review', // En revisión
                'approved', // Aprobado
                'rejected', // Rechazado
                'completed' // Completado
            ])->default('draft');
            
            $table->text('rejection_reason')->nullable(); // Motivo rechazo
            $table->foreignId('processed_by')->nullable()->constrained('users'); // Procesado por
            $table->timestamp('processed_at')->nullable(); // Fecha procesamiento
            $table->timestamp('submitted_at')->nullable(); // Fecha envío
            
            // Metadatos adicionales
            $table->json('metadata')->nullable(); // Información adicional
            $table->boolean('terms_accepted')->default(false); // Términos aceptados
            $table->string('ip_address', 45)->nullable(); // IP del solicitante
            $table->text('user_agent')->nullable(); // Navegador del solicitante
            
            $table->timestamps();
            
            // Índices para búsquedas eficientes
            $table->index(['user_id', 'status']);
            $table->index(['identificationNumber']);
            $table->index(['referenceTransaction']);
            $table->index(['status', 'created_at']);
            $table->index(['applicationType']);
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