

// components/shared/DeleteConfirmDialog.jsx
import { useEffect, useRef } from "react";

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  rowData,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.showModal();
    } else if (!isOpen && dialogRef.current) {
      dialogRef.current.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!rowData) return null;

  const productName =
    rowData.NOMBRE ||
    rowData.DESCRIPCIÓN ||
    rowData.DESCRIPCION ||
    "esta fila";

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="rounded-2xl border-2 border-[#02979B] bg-white p-0 shadow-xl backdrop:bg-black/50 w-[380px] max-w-[90vw]"
    >
      {/* 👇 AQUÍ está la corrección del espacio inferior */}
      <div className="px-6 pt-7 pb-10">
        {/* Icono */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
          >
            <path
              d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Título */}
        <h3 className="text-center text-lg font-semibold text-[#02979B] mb-3">
          Confirmar eliminación
        </h3>

        {/* Mensaje */}
        <p className="text-center text-sm text-gray-600 mb-8">
          ¿Estás seguro de eliminar{" "}
          <span className="font-semibold text-[#02979B]">
            "{productName}"
          </span>
          ?
          <br />
          <span className="text-xs text-red-500">
            Esta acción no se puede deshacer.
          </span>
        </p>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-[#02979B] bg-white px-4 py-2 text-sm font-semibold text-[#02979B] hover:bg-[#02979B]/5 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
          >
            Eliminar
          </button>
        </div>
      </div>
    </dialog>
  );
}