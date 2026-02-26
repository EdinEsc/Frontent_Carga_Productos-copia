// // App.jsx (fragmento modificado)
// import { useState, useEffect, useRef } from "react";
// import { Toaster, toast } from "sonner";

// import AppHeader from "./components/AppHeader";
// import ExcelNormalizer from "./ExcelNormalizer";
// import ExcelSender from "./ExcelSender";

// export default function App() {
//   const [active, setActive] = useState("normalizacion");
//   const [warehouses, setWarehouses] = useState([]);
//   const [employeeData, setEmployeeData] = useState(null); 
//   const alreadyRan = useRef(false);

//   useEffect(() => {
//     if (alreadyRan.current) return;
//     alreadyRan.current = true;

//     const procesarToken = async () => {
//       try {
//         const params = new URLSearchParams(window.location.search);
//         const token = params.get("token");
//         const node = params.get("node");

//         if (!token || !node) {
//           console.warn("⚠️ Falta token o node en la URL");
//           return;
//         }

//         console.log("🔑 TOKEN:", token);
//         console.log("🌐 NODE:", node);

//         const salesNode = `https://n${node}.sales.casamarketapp.com`;
//         const productNode = `https://n${node}.product.casamarketapp.com`;

//         // ================================
//         // 🔐 FETCH CON MANEJO 401
//         // ================================
//         const fetchWithAuth = async (url, extraHeaders = {}) => {
//           const res = await fetch(url, {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               ...extraHeaders,
//             },
//           });

//           if (res.status === 401) {
//             console.warn("🔒 Token inválido o expirado");
//             toast.error("Sesión expirada. Recargando...");
//             setTimeout(() => window.location.reload(), 1500);
//             throw new Error("Unauthorized");
//           }

//           return res;
//         };

//         // =============================
//         // 1️⃣ TRAER EMPLOYEE
//         // =============================
//         console.log("📡 Obteniendo employee...");

//         const employeeRes = await fetchWithAuth(
//           `${salesNode}/employees/current`,
//           {
//             Accept: "application/vnd.appv1.10.1+json",
//           }
//         );

//         if (!employeeRes.ok) {
//           throw new Error("Error obteniendo employee");
//         }

//         const employeeData = await employeeRes.json();

//         console.log("═══════════════════════════");
//         console.log("👤 EMPLOYEE DATA");
//         console.log(employeeData);
        
//         // 👈 GUARDAR DATOS DEL EMPLEADO
//         setEmployeeData(employeeData);

//         // =============================
//         // 2️⃣ TRAER WAREHOUSES
//         // =============================
//         console.log("═══════════════════════════");
//         console.log("🏭 OBTENIENDO WAREHOUSES...");

//         const warehouseRes = await fetchWithAuth(
//           `${productNode}/warehouses`,
//           {
//             Accept: "application/json",
//           }
//         );

//         if (!warehouseRes.ok) {
//           throw new Error("Error obteniendo warehouses");
//         }

//         const allWarehouses = await warehouseRes.json();

//         const warehousesFiltrados = allWarehouses.filter(
//           (w) => w.companyId === employeeData.companyId && w.flagActive
//         );

//         console.log("🏭 WAREHOUSES FILTRADOS:");
//         console.table(
//           warehousesFiltrados.map((w) => ({
//             id: w.id,
//             name: w.name,
//             companyId: w.companyId,
//             activo: w.flagActive,
//           }))
//         );

//         setWarehouses(warehousesFiltrados);

//         // =============================
//         // 3️⃣ TRAER PRICE LISTS
//         // =============================
//         console.log("═══════════════════════════");
//         console.log("💰 OBTENIENDO LISTAS DE PRECIOS...");

//         const priceListsRes = await fetchWithAuth(
//           `${salesNode}/sal-price-lists?page=1&limit=10&sortDirection=desc&sortField=created_at`,
//           {
//             Accept: "application/vnd.appv1.10.1+json",
//           }
//         );

//         if (!priceListsRes.ok) {
//           throw new Error("Error obteniendo listas de precios");
//         }

//         const priceLists = await priceListsRes.json();

//         console.log("💰 LISTAS DE PRECIOS:");
//         console.table(
//           priceLists.map((pl) => ({
//             id: pl.id,
//             name: pl.name,
//             description: pl.description,
//             flagDefault: pl.flagDefault === 1 ? "✅" : "❌",
//             flagActive: pl.flagActive === 1 ? "✅" : "❌",
//           }))
//         );

//         // 👈 GUARDAR LISTAS DE PRECIOS EN SESSIONSTORAGE PARA ExcelSender
//         sessionStorage.setItem('priceLists', JSON.stringify(priceLists));

//         console.log("═══════════════════════════");
//         console.log("✅ PROCESO COMPLETADO");
//         console.log("Sales Node:", salesNode);
//         console.log("Product Node:", productNode);

//       } catch (error) {
//         console.error("❌ ERROR:", error);
//       }
//     };

//     procesarToken();
//   }, []);

//   const handleNavigateToCarga = () => {
//     setActive("carga");
//   };

//   return (
//     <div className="min-h-screen bg-slate-50">
//       <Toaster position="top-right" richColors closeButton />

//       <AppHeader active={active} onChange={setActive} />

//       <main className="mx-auto max-w-6xl px-4 py-8">
//         {active === "normalizacion" ? (
//           <ExcelNormalizer
//             warehouses={warehouses}
//             onNavigateToCarga={handleNavigateToCarga}
//           />
//         ) : (
//           <ExcelSender employeeData={employeeData} /> // 👈 PASAR DATOS DEL EMPLEADO
//         )}
//       </main>
//     </div>
//   );
// }


// App.jsx (fragmento modificado)
import { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";

import AppHeader from "./components/AppHeader";
import ExcelNormalizer from "./ExcelNormalizer";
import ExcelSender from "./ExcelSender";

export default function App() {
  const [active, setActive] = useState("normalizacion");
  const [warehouses, setWarehouses] = useState([]);
  const [employeeData, setEmployeeData] = useState(null); 
  const alreadyRan = useRef(false);

  useEffect(() => {
    if (alreadyRan.current) return;
    alreadyRan.current = true;

    const procesarToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const node = params.get("node");

        if (!token || !node) {
          console.warn("⚠️ Falta token o node en la URL");
          return;
        }

        console.log("🔑 TOKEN:", token);
        console.log("🌐 NODE:", node);

        const salesNode = `https://n${node}.sales.casamarketapp.com`;
        const productNode = `https://n${node}.product.casamarketapp.com`;

        // ================================
        // 🔐 FETCH CON MANEJO 401
        // ================================
        const fetchWithAuth = async (url, extraHeaders = {}) => {
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              ...extraHeaders,
            },
          });

          if (res.status === 401) {
            console.warn("🔒 Token inválido o expirado");
            toast.error("Sesión expirada. Recargando...");
            setTimeout(() => window.location.reload(), 1500);
            throw new Error("Unauthorized");
          }

          return res;
        };

        // =============================
        // 1️⃣ TRAER EMPLOYEE
        // =============================
        console.log("📡 Obteniendo employee...");

        const employeeRes = await fetchWithAuth(
          `${salesNode}/employees/current`,
          {
            Accept: "application/vnd.appv1.10.1+json",
          }
        );

        if (!employeeRes.ok) {
          throw new Error("Error obteniendo employee");
        }

        const employeeData = await employeeRes.json();

        console.log("═══════════════════════════");
        console.log("👤 EMPLOYEE DATA");
        console.log(employeeData);
        
        // 👈 GUARDAR DATOS DEL EMPLEADO
        setEmployeeData(employeeData);

        // =============================
        // 2️⃣ TRAER WAREHOUSES
        // =============================
        console.log("═══════════════════════════");
        console.log("🏭 OBTENIENDO WAREHOUSES...");

        const warehouseRes = await fetchWithAuth(
          `${productNode}/warehouses`,
          {
            Accept: "application/json",
          }
        );

        if (!warehouseRes.ok) {
          throw new Error("Error obteniendo warehouses");
        }

        const allWarehouses = await warehouseRes.json();

        const warehousesFiltrados = allWarehouses.filter(
          (w) => w.companyId === employeeData.companyId && w.flagActive
        );

        console.log("🏭 WAREHOUSES FILTRADOS:");
        console.table(
          warehousesFiltrados.map((w) => ({
            id: w.id,
            name: w.name,
            companyId: w.companyId,
            activo: w.flagActive,
          }))
        );

        setWarehouses(warehousesFiltrados);

        // =============================
        // 3️⃣ TRAER PRICE LISTS
        // =============================
        console.log("═══════════════════════════");
        console.log("💰 OBTENIENDO LISTAS DE PRECIOS...");

        const priceListsRes = await fetchWithAuth(
          `${salesNode}/sal-price-lists?page=1&limit=10&sortDirection=desc&sortField=created_at`,
          {
            Accept: "application/vnd.appv1.10.1+json",
          }
        );

        if (!priceListsRes.ok) {
          throw new Error("Error obteniendo listas de precios");
        }

        const priceLists = await priceListsRes.json();

        console.log("💰 LISTAS DE PRECIOS:");
        console.table(
          priceLists.map((pl) => ({
            id: pl.id,
            name: pl.name,
            description: pl.description,
            flagDefault: pl.flagDefault === 1 ? "✅" : "❌",
            flagActive: pl.flagActive === 1 ? "✅" : "❌",
          }))
        );

        // 👈 GUARDAR LISTAS DE PRECIOS EN SESSIONSTORAGE PARA ExcelSender
        sessionStorage.setItem('priceLists', JSON.stringify(priceLists));

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
          <ExcelNormalizer
            warehouses={warehouses}
            onNavigateToCarga={handleNavigateToCarga}
          />
        ) : (
          <ExcelSender 
            employeeData={employeeData}
            warehouses={warehouses}  // 👈 AHORA SÍ PASAMOS LOS WAREHOUSES
          />
        )}
      </main>
    </div>
  );
}