// // src/components/AppHeader.jsx
// export default function AppHeader({ active = "normalizacion", onChange }) {
//   const pageTitle = "CasaMarket";

//   const baseBtn =
//     "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition";

//   const activeBtn = "border-[#02979B] bg-[#02979B] text-white";
//   const inactiveBtn =
//     "border-[#D9D9D9] bg-white text-[#02979B] hover:bg-[#02979B]/5";

//   return (
//     <header className="border-b border-[#D9D9D9] bg-white">
//       <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
//         {/* IZQUIERDA: Logo CasaMarket + titulo */}
//         <div className="flex items-center gap-3">
//           {/* Logo: Casa */}
//           <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#02979B] text-white">
//             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//               <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5z" strokeLinejoin="round"/>
//             </svg>
//           </div>

//           <div className="leading-tight">
//             <div className="text-sm font-semibold text-[#02979B]">{pageTitle}</div>
//             <div className="text-xs text-[#02979B]/60">Gestión y carga de productos</div>
//           </div>
//         </div>

//         {/* DERECHA: Solo 2 botones */}
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => onChange?.("normalizacion")}
//             className={`${baseBtn} ${
//               active === "normalizacion" ? activeBtn : inactiveBtn
//             }`}
//             type="button"
//           >
//             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//               <path d="M3 6h18M8 6v14m8-14v14" strokeLinecap="round"/>
//             </svg>
//             Limpieza de datos
//           </button>

//           <button
//             onClick={() => onChange?.("carga")}
//             className={`${baseBtn} ${active === "carga" ? activeBtn : inactiveBtn}`}
//             type="button"
//           >
//             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//               <path d="M12 16V4m0 0 4 4m-4-4-4 4M4 20h16" strokeLinecap="round"/>
//             </svg>
//             Carga de productos
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// }




// src/components/AppHeader.jsx
export default function AppHeader({ active = "normalizacion", onChange }) {
  const pageTitle = "CasaMarket";

  const baseBtn =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm";

  const activeBtn = "bg-gradient-to-r from-[#02979B] to-[#01A9AD] text-white shadow-md shadow-[#02979B]/25 border border-[#02979B]/20";
  const inactiveBtn =
    "bg-white text-[#02979B] border border-[#D9D9D9] hover:border-[#02979B] hover:bg-[#02979B]/5 hover:shadow-md hover:shadow-[#02979B]/10";

  return (
    <header className="sticky top-0 z-50 border-b border-[#D9D9D9] bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* IZQUIERDA: Logo CasaMarket + titulo con diseño mejorado */}
        <div className="flex items-center gap-3">
          {/* Logo con efecto de profundidad */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#02979B] rounded-xl blur-md opacity-30"></div>
            <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#02979B] to-[#01A9AD] text-white shadow-lg">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5z" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold bg-gradient-to-r from-[#02979B] to-[#01A9AD] bg-clip-text text-transparent">
                {pageTitle}
              </span>
              <span className="rounded-full bg-[#02979B]/10 px-2 py-0.5 text-[10px] font-medium text-[#02979B] border border-[#02979B]/20">
                BETA
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#02979B]/60">
              <span>Gestión y carga de productos</span>
              <span className="w-1 h-1 rounded-full bg-[#02979B]/30"></span>
              <span className="font-mono">v1.0</span>
            </div>
          </div>
        </div>

        {/* DERECHA: Botones con mejor diseño */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange?.("normalizacion")}
            className={`${baseBtn} ${
              active === "normalizacion" ? activeBtn : inactiveBtn
            }`}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6v14m8-14v14" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.5"/>
            </svg>
            <span>Limpieza de datos</span>
            {active === "normalizacion" && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => onChange?.("carga")}
            className={`${baseBtn} relative ${
              active === "carga" ? activeBtn : inactiveBtn
            }`}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 16V4m0 0 4 4m-4-4-4 4M4 20h16" strokeLinecap="round"/>
              <circle cx="12" cy="20" r="1" fill="currentColor"/>
            </svg>
            <span>Carga de productos</span>
            {active === "carga" && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border-2 border-white"></span>
            )}
          </button>

          {/* Separador vertical sutil */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-[#D9D9D9] to-transparent"></div>
        </div>
      </div>

      {/* Barra de progreso sutil (opcional) */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#02979B] to-[#01A9AD] transform scale-x-0 transition-transform duration-500 origin-left"></div>
    </header>
  );
}