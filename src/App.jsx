// src/App.jsx
import { useState } from "react";
import { Toaster } from "sonner";

import AppHeader from "./components/AppHeader";
import ExcelNormalizer from "./ExcelNormalizer";
import ExcelSender from "./ExcelSender";

export default function App() {
  const [active, setActive] = useState("normalizacion");

  // Función para navegar a la sección de carga
  const handleNavigateToCarga = () => {
    setActive("carga");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" richColors closeButton />

      <AppHeader active={active} onChange={setActive} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {active === "normalizacion" ? (
          <ExcelNormalizer onNavigateToCarga={handleNavigateToCarga} />
        ) : (
          <ExcelSender />
        )}
      </main>
    </div>
  );
}
