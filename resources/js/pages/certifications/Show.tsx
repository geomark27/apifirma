import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import Layout from '@/Layouts/UserLayout';
import ErrorModal from "@/components/ErrorModal";

export default function Show() {
  const { 
    certification, 
    statusOptions, 
    validationStatusOptions, 
    canEdit, 
    canDelete 
  } = usePage().props as {
    certification: any;
    statusOptions: Record<string, string>;
    validationStatusOptions: Record<string, string>;
    canEdit: boolean;
    canDelete: boolean;
  };

  const handleDelete = () => {
    if (confirm('¿Estás seguro de eliminar esta certificación?')) {
      // Llama a tu ruta DELETE
      window.location.href = route('user.certifications.destroy', certification.id);
    }
  };

  return (
    <Layout>
      <ErrorModal />

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">
          Certificación #{certification.certification_number}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Datos Personales */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Datos Personales</h2>
            <p><strong>Cédula:</strong> {certification.identificationNumber}</p>
            <p>
              <strong>Nombre:</strong>{' '}
              {`${certification.applicantName} ${certification.applicantLastName} ${certification.applicantSecondLastName}`}
            </p>
            <p><strong>Fecha de Nac.:</strong> {certification.dateOfBirth}</p>
            <p><strong>Edad:</strong> {certification.clientAge}</p>
            <p><strong>Código Dactilar:</strong> {certification.fingerCode}</p>
            <p><strong>Email:</strong> {certification.emailAddress}</p>
            <p><strong>Celular:</strong> {certification.cellphoneNumber}</p>
          </section>

          {/* Ubicación */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Ubicación</h2>
            <p><strong>Provincia:</strong> {certification.province}</p>
            <p><strong>Ciudad:</strong> {certification.city}</p>
            <p><strong>Dirección:</strong> {certification.address}</p>
          </section>

          {/* Info Empresarial */}
          {(certification.applicationType === 'LEGAL_REPRESENTATIVE' || certification.companyRuc) && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Información Empresarial</h2>
              <p><strong>RUC:</strong> {certification.companyRuc}</p>
              <p><strong>Razón Social:</strong> {certification.companySocialReason}</p>
              <p><strong>Cargo:</strong> {certification.positionCompany}</p>
              <p><strong>Nombramiento Vence:</strong> {certification.appointmentExpirationDate}</p>
            </section>
          )}

          {/* Documentos */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Documentos</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <a 
                  href={route('user.download', { path: certification.identificationFront })} 
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  Cédula Frontal
                </a>
              </li>
              <li>
                <a 
                  href={route('user.download', { path: certification.identificationBack })} 
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  Cédula Posterior
                </a>
              </li>
              <li>
                <a 
                  href={route('user.download', { path: certification.identificationSelfie })} 
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  Selfie con Cédula
                </a>
              </li>
              {certification.pdfCompanyRuc && (
                <li>
                  <a 
                    href={route('user.download', { path: certification.pdfCompanyRuc })} 
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    PDF RUC Empresa
                  </a>
                </li>
              )}
              {/* Añade enlaces para los demás PDFs si existen */}
            </ul>
          </section>

          {/* Estados */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Estado</h2>
            <p>
              <strong>Workflow:</strong>{' '}
              {statusOptions[certification.status] || certification.status}
            </p>
            <p>
              <strong>Validación:</strong>{' '}
              {validationStatusOptions[certification.validationStatus] || certification.validationStatus}
            </p>
          </section>
        </div>

        <div className="mt-6 flex space-x-3">
          {canEdit && (
            <Link
              href={route('user.certifications.edit', certification.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Editar
            </Link>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Eliminar
            </button>
          )}

          <Link
            href={route('user.certifications.index')}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Volver
          </Link>
        </div>
      </div>
    </Layout>
);
}
