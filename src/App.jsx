import { useState, useEffect, useRef } from "react";
import { Toaster } from "sonner";

import AppHeader from "./components/AppHeader";
import ExcelNormalizer from "./ExcelNormalizer";
import ExcelSender from "./ExcelSender";

export default function App() {
  const [active, setActive] = useState("normalizacion");

  // 🔥 Esto evita que React StrictMode ejecute dos veces el efecto
  const alreadyRan = useRef(false);

  useEffect(() => {
    if (alreadyRan.current) return;
    alreadyRan.current = true;

    const procesarToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          console.warn("⚠️ No se recibió token");
          return;
        }

        console.log("🔑 TOKEN:", token);

        // Decodificar JWT (solo debug)
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log("📦 PAYLOAD:", payload);
        }

        let salesNode = null;
        let productNode = null;
        let employeeData = null;

        // =============================
        // 1️⃣ DETECTAR NODO SALES
        // =============================
        for (let i = 1; i <= 5; i++) {
          const url = `https://n${i}.sales.casamarketapp.com`;

          try {
            console.log(`📡 Probando SALES n${i}`);

            const res = await fetch(`${url}/employees/current`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.appv1.10.1+json",
              },
            });

            if (res.ok) {
              employeeData = await res.json();
              salesNode = url;
              console.log(`✅ SALES encontrado en n${i}`);
              break;
            }
          } catch (e) {
            console.log(`❌ SALES n${i} no respondió`);
          }
        }

        if (!salesNode) {
          throw new Error("No se encontró nodo SALES válido");
        }

        console.log("═══════════════════════════");
        console.log("👤 EMPLOYEE DATA");
        console.log(employeeData);

        // =============================
        // 2️⃣ DETECTAR NODO PRODUCT REAL
        // =============================
        for (let i = 1; i <= 5; i++) {
          const url = `https://n${i}.product.casamarketapp.com`;

          try {
            console.log(`📡 Probando PRODUCT n${i}`);

            const res = await fetch(`${url}/warehouses`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            });

            if (!res.ok) continue;

            const data = await res.json();

            // 🔥 SOLO aceptar si realmente trae warehouses
            if (Array.isArray(data) && data.length > 0) {
              productNode = url;
              console.log(`✅ PRODUCT REAL encontrado en n${i}`);
              break;
            } else {
              console.log(`⚠️ n${i} respondió pero sin warehouses`);
            }

          } catch (e) {
            console.log(`❌ PRODUCT n${i} no respondió`);
          }
        }

        if (!productNode) {
          throw new Error("No se encontró nodo PRODUCT con warehouses");
        }

        // =============================
        // 3️⃣ TRAER WAREHOUSES DEFINITIVOS
        // =============================
        console.log("═══════════════════════════");
        console.log("🏭 OBTENIENDO WAREHOUSES COMPLETOS...");

        const warehouseRes = await fetch(
          `${productNode}/warehouses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const allWarehouses = await warehouseRes.json();

        // Filtrar por companyId del empleado
        const warehousesFiltrados = allWarehouses.filter(
          (w) => w.companyId === employeeData.companyId
        );

        console.log("🏭 WAREHOUSES FILTRADOS POR COMPANY:");
        console.table(
          warehousesFiltrados.map((w) => ({
            id: w.id,
            name: w.name,
            code: w.code,
            companyId: w.companyId,
            activo: w.flagActive,
          }))
        );

        console.log("═══════════════════════════");
        console.log("✅ PROCESO COMPLETADO");
        console.log("Sales Node:", salesNode);
        console.log("Product Node:", productNode);

      } catch (error) {
        console.error("❌ ERROR:", error);
      }
    };

    procesarToken();
  }, []);

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