// components/shared/Spinner.jsx

/**
 * Spinner Component
 * Muestra un indicador visual de carga (loading).
 * Se usa cuando la aplicación está esperando una respuesta
 * del servidor o procesando una acción.
 */

export default function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}