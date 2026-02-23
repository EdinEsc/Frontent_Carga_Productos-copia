// // src/App.jsx
// import { useState } from "react";
// import { Toaster } from "sonner";

// import AppHeader from "./components/AppHeader";
// import ExcelNormalizer from "./ExcelNormalizer";
// import ExcelSender from "./ExcelSender";

// export default function App() {
//   const [active, setActive] = useState("normalizacion");

//   // Función para navegar a la sección de carga
//   const handleNavigateToCarga = () => {
//     setActive("carga");
//   };

//   return (
//     <div className="min-h-screen bg-slate-50">
//       <Toaster position="top-right" richColors closeButton />

//       <AppHeader active={active} onChange={setActive} />

//       <main className="mx-auto max-w-6xl px-4 py-8">
//         {active === "normalizacion" ? (
//           <ExcelNormalizer onNavigateToCarga={handleNavigateToCarga} />
//         ) : (
//           <ExcelSender />
//         )}
//       </main>
//     </div>
//   );
// }






// src/App.jsx
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import AppHeader from "./components/AppHeader";
import ExcelNormalizer from "./ExcelNormalizer";
import ExcelSender from "./ExcelSender";

function getQueryParam(name) {
  const fromSearch = new URLSearchParams(window.location.search).get(name);
  if (fromSearch) return fromSearch;

  const hash = window.location.hash || "";
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return null;

  const hashQuery = hash.slice(qIndex + 1);
  return new URLSearchParams(hashQuery).get(name);
}

async function fetchJson(url, token) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GET ${url} -> ${res.status}: ${txt}`);
  }

  return res.json();
}

export default function App() {
  const [active, setActive] = useState("normalizacion");
  const [user, setUser] = useState(null);
  const [commerce, setCommerce] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const userParam = getQueryParam("user");

        if (!userParam) {
          setLoading(false);
          return;
        }

        // Parsear user desde query
        const parsedUser = JSON.parse(decodeURIComponent(userParam));
        const token = parsedUser?.token;

        if (!token) {
          throw new Error("No se encontró token en ?user=");
        }

        // 🔥 Consumir SOLO commerce desde tu backend
        const commerceData = await fetchJson(
          "http://localhost:8000/dev/commerce",
          token
        );

        if (alive) {
          setUser(parsedUser);
          setCommerce(commerceData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error:", err);
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" richColors closeButton />

      <AppHeader active={active} onChange={setActive} user={user} />

      {import.meta.env.DEV && (
        <pre className="p-4 text-xs overflow-auto">
          {JSON.stringify(
            {
              user,
              commercePreview: commerce,
            },
            null,
            2
          )}
        </pre>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8">
        {active === "normalizacion" ? (
          <ExcelNormalizer user={user} commerce={commerce} />
        ) : (
          <ExcelSender user={user} commerce={commerce} />
        )}
      </main>
    </div>
  );
}