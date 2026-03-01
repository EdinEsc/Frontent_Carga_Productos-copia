// App.jsx
import { useState } from "react";
import { Toaster, toast } from "sonner";

import { useAuth } from "./hooks/useAuth";
import AppHeader from "./components/AppHeader";
import ExcelNormalizer from "./components/ExcelNormalizer";
import ExcelSender from "./components/ExcelSender";

export default function App() {
  const [active, setActive] = useState("normalizacion");
  const [isLoading, setIsLoading] = useState(false); // Estado de carga desde ExcelSender
  const { employeeData, warehouses } = useAuth();

  const handleNavigateToCarga = () => {
    setActive("carga");
  };

  // Manejador cuando intenta volver a limpieza durante carga
  const handleNavigateAttempt = () => {
    // Mostrar alerta bonita con sonner
    toast.warning(
      <div className="flex flex-col gap-2">
        <span className="font-bold">🚫 No puedes volver a Limpieza</span>
        <span className="text-sm">
          Hay una carga de productos en progreso. Espera a que termine para poder limpiar más datos.
        </span>
      </div>,
      {
        duration: 5000,
        position: 'top-center',
      }
    );
  };

  // Recibir cambios de estado de carga desde ExcelSender
  const handleLoadingChange = (loading) => {
    setIsLoading(loading);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" richColors closeButton />

      <AppHeader 
        active={active} 
        onChange={setActive}
        isLoading={isLoading}
        onNavigateAttempt={handleNavigateAttempt}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {active === "normalizacion" ? (
          <ExcelNormalizer
            warehouses={warehouses}
            onNavigateToCarga={handleNavigateToCarga}
          />
        ) : (
          <ExcelSender 
            employeeData={employeeData}
            warehouses={warehouses}
            onLoadingChange={handleLoadingChange}
          />
        )}
      </main>
    </div>
  );
}