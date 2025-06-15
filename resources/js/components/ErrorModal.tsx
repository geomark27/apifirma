// resources/js/Components/ErrorModal.tsx

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { usePage } from '@inertiajs/react';

export default function ErrorModal() {
  const { errors } = usePage().props as { errors: Record<string, string> };
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setIsOpen(true);
    }
  }, [errors]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={() => setIsOpen(false)}
      >
        {/* Contenedor para centrar */}
        <div className="min-h-screen px-4 text-center">
          {/* Esto fuerza centrar el contenido */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          {/* --- OVERLAY con blur --- */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            {/* este div cubre toda la pantalla y aplica el blur */}
            <div
              className="fixed inset-0 bg-white/10 backdrop-blur-md"
              aria-hidden="true"
            />
          </Transition.Child>

          {/* --- PANEL del modal --- */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-red-700"
              >
                Errores de validación
              </Dialog.Title>
              <div className="mt-4">
                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>{message}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 text-right">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium bg-red-100 text-red-800 rounded hover:bg-red-200"
                  onClick={() => setIsOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
