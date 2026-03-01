// components/AppHeader.jsx
import LogoCasaMarket from "../assets/Logo-casamarket.png";

export default function AppHeader({ 
  active = "normalizacion", 
  onChange,
  isLoading = false,
  onNavigateAttempt
}) {

  const baseBtn =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm";

  const activeBtn =
    "bg-gradient-to-r from-[#02979B] to-[#01A9AD] text-white shadow-md shadow-[#02979B]/25 border border-[#02979B]/20";

  const inactiveBtn =
    "bg-white text-[#02979B] border border-[#D9D9D9] hover:border-[#02979B] hover:bg-[#02979B]/5 hover:shadow-md hover:shadow-[#02979B]/10";

  const disabledLimpiezaBtn =
    "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50";

  const handleTabChange = (tab) => {
    if (isLoading && tab === "normalizacion") {
      if (onNavigateAttempt) {
        onNavigateAttempt();
      }
      return;
    }
    onChange?.(tab);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#D9D9D9] bg-white/90 backdrop-blur-md shadow-sm">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">

        {/* IZQUIERDA: SOLO LOGO PNG */}
        <div className="relative flex items-center">
          <img
            src={LogoCasaMarket}
            alt="Logo CasaMarket"
            className="h-14 w-auto object-contain"
          />

          {/* Indicador de carga sobre el logo */}
          {isLoading && (
            <div className="absolute -top-1 -right-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
            </div>
          )}
        </div>

        {/* DERECHA: Botones */}
        <div className="flex items-center gap-3">

          {/* BOTÓN LIMPIEZA */}
          <button
            onClick={() => handleTabChange("normalizacion")}
            className={`${baseBtn} ${
              isLoading
                ? disabledLimpiezaBtn
                : active === "normalizacion"
                  ? activeBtn
                  : inactiveBtn
            }`}
            type="button"
            disabled={isLoading}
            title={
              isLoading
                ? "No puedes volver a limpieza mientras hay una carga en progreso"
                : "Ir a Limpieza de datos"
            }
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6v14m8-14v14" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.5"/>
            </svg>
            <span>Limpieza de datos</span>

            {isLoading && (
              <svg className="ml-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </button>

          {/* BOTÓN CARGA */}
          <button
            onClick={() => handleTabChange("carga")}
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

          <div className="w-px h-8 bg-gradient-to-b from-transparent via-[#D9D9D9] to-transparent"></div>

        </div>
      </div>

      {/* Barra de progreso */}
      {isLoading && (
        <div className="relative">
          <div className="h-0.5 w-full bg-gray-200">
            <div
              className="h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 animate-pulse"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      )}

      <div className="h-0.5 w-full bg-gradient-to-r from-[#02979B] to-[#01A9AD]"></div>

    </header>
  );
}