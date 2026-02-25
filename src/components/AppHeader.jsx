// src/components/AppHeader.jsx
export default function AppHeader({ active = "normalizacion", onChange }) {
  const pageTitle = "CasaMarket";

  const baseBtn =
    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition";

  const activeBtn = "border-[#02979B] bg-[#02979B] text-white";
  const inactiveBtn =
    "border-[#D9D9D9] bg-white text-[#02979B] hover:bg-[#02979B]/5";

  return (
    <header className="border-b border-[#D9D9D9] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* IZQUIERDA: Logo CasaMarket + titulo */}
        <div className="flex items-center gap-3">
          {/* Logo: Casa */}
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#02979B] text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5z" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="leading-tight">
            <div className="text-sm font-semibold text-[#02979B]">{pageTitle}</div>
            <div className="text-xs text-[#02979B]/60">Gestión y carga de productos</div>
          </div>
        </div>

        {/* DERECHA: Solo 2 botones */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange?.("normalizacion")}
            className={`${baseBtn} ${
              active === "normalizacion" ? activeBtn : inactiveBtn
            }`}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6v14m8-14v14" strokeLinecap="round"/>
            </svg>
            Limpieza de datos
          </button>

          <button
            onClick={() => onChange?.("carga")}
            className={`${baseBtn} ${active === "carga" ? activeBtn : inactiveBtn}`}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 16V4m0 0 4 4m-4-4-4 4M4 20h16" strokeLinecap="round"/>
            </svg>
            Carga de productos
          </button>
        </div>
      </div>
    </header>
  );
}