import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import Layout from '@/Layouts/UserLayout';
import ErrorModal from '@/Components/ErrorModal';

export default function Edit() {
  const {
    certification,
    applicationTypes,
    periods,
    cities,
    provinces,
  } = usePage().props as {
    certification: any;
    applicationTypes: Record<string, string>;
    periods:    Record<string, string>;
    cities:     string[];
    provinces:  string[];
  };

  const form = useForm({
    identificationNumber:      certification.identificationNumber,
    dateOfBirth:               certification.dateOfBirth,
    applicantName:             certification.applicantName,
    applicantLastName:         certification.applicantLastName,
    applicantSecondLastName:   certification.applicantSecondLastName,
    fingerCode:                certification.fingerCode,
    emailAddress:              certification.emailAddress,
    cellphoneNumber:           certification.cellphoneNumber,
    city:                      certification.city,
    province:                  certification.province,
    address:                   certification.address,
    applicationType:           certification.applicationType,
    companyRuc:                certification.companyRuc ?? '',
    positionCompany:           certification.positionCompany ?? '',
    companySocialReason:       certification.companySocialReason ?? '',
    appointmentExpirationDate: certification.appointmentExpirationDate ?? '',
    referenceTransaction:      certification.referenceTransaction,
    period:                    certification.period,
    terms_accepted:            certification.terms_accepted,
    // Archivos: inicialmente null para poder reemplazar
    identificationFront:       null,
    identificationBack:        null,
    identificationSelfie:      null,
    pdfCompanyRuc:             null,
    pdfRepresentativeAppointment: null,
    pdfAppointmentAcceptance:     null,
    pdfCompanyConstitution:       null,
    authorizationVideo:           null,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    form.put(route('user.certifications.update', certification.id), {
      preserveScroll: true,
      preserveState:  true,
    });
  }

  return (
    <Layout>
      <ErrorModal />

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">
          Editar Certificación #{certification.certification_number}
        </h1>

        <form onSubmit={submit} encType="multipart/form-data" className="space-y-4">
          {/* Ejemplo: campo Cédula */}
          <div>
            <label className="block text-sm font-medium">Cédula</label>
            <input
              type="text"
              value={form.identificationNumber}
              onChange={e => form.setData('identificationNumber', e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
            />
            {form.errors.identificationNumber && (
              <p className="text-red-600 text-sm mt-1">
                {form.errors.identificationNumber}
              </p>
            )}
          </div>

          {/* Código Dactilar */}
          <div>
            <label className="block text-sm font-medium">Código Dactilar</label>
            <input
              type="text"
              value={form.fingerCode}
              onChange={e =>
                form.setData('fingerCode', e.target.value.toUpperCase())
              }
              className="mt-1 block w-full border rounded px-3 py-2"
            />
            {form.errors.fingerCode && (
              <p className="text-red-600 text-sm mt-1">
                {form.errors.fingerCode}
              </p>
            )}
          </div>

          {/* Tipo de Aplicación */}
          <div>
            <label className="block text-sm font-medium">Tipo de Aplicación</label>
            <select
              value={form.applicationType}
              onChange={e => form.setData('applicationType', e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
            >
              {Object.entries(applicationTypes).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {form.errors.applicationType && (
              <p className="text-red-600 text-sm mt-1">
                {form.errors.applicationType}
              </p>
            )}
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm font-medium">Período</label>
            <select
              value={form.period}
              onChange={e => form.setData('period', e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
            >
              {Object.entries(periods).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {form.errors.period && (
              <p className="text-red-600 text-sm mt-1">
                {form.errors.period}
              </p>
            )}
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium">Dirección</label>
            <textarea
              value={form.address}
              onChange={e => form.setData('address', e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
              rows={3}
            />
            {form.errors.address && (
              <p className="text-red-600 text-sm mt-1">
                {form.errors.address}
              </p>
            )}
          </div>

          {/* Campos de carga de archivos (uno como ejemplo) */}
          <div>
            <label className="block text-sm font-medium">Frente Cédula</label>
            <input
              type="file"
              onChange={e => form.setData('identificationFront', e.target.files?.[0] || null)}
              className="mt-1"
            />
            {form.errors.identificationFront && (
              <p className="text-red-600 text-sm mt-1">
                {form.errors.identificationFront}
              </p>
            )}
          </div>

          {/* …repite para Back, Selfie y PDFs condicionales… */}

          <div className="flex space-x-3 mt-6">
            <button
              type="submit"
              disabled={form.processing}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              Guardar
            </button>
            <Link
              href={route('user.certifications.show', certification.id)}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}
