// components/ExcelSender.jsx
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { useNodeConfig } from "../hooks/useNodeConfig";
import { useWarehouse } from "../hooks/useWarehouse";
import { usePriceLists } from "../hooks/usePriceLists";
import { useFriendUploadService } from "../hooks/useFriendUploadService";
import Spinner from "./shared/Spinner";
import FileUploader from "./shared/FileUploader";

function ExcelSender({ employeeData, warehouses = [], onLoadingChange }) {

  const [isLocked, setIsLocked] = useState(false);
  const [cameFromNormalizer, setCameFromNormalizer] = useState(false);
  const [cargaMode, setCargaMode] = useState("NORMAL");
  const [fileProductos, setFileProductos] = useState(null);
  const [aplicarIgv, setAplicarIgv] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [normalizerIgvSettings, setNormalizerIgvSettings] = useState({
    applyIgvCost: true,
    applyIgvSale: true
  });
  

  const { nodeKey, baseUrl, nodeLabel } = useNodeConfig();


  const { 
    priceLists, 
    selectedPriceLists, 
    priceListId, 
    setPriceListId,
    loading: loadingPriceLists, 
    error: priceListsError,
    togglePriceList,
    toggleSelectAllPriceLists
  } = usePriceLists(cargaMode);

 
  const { selectedWarehouseId, selectedWarehouseName, handleWarehouseChange } = 
    useWarehouse(warehouses, cameFromNormalizer);

  const {
    loading: friendServiceLoading,
    progress,
    result: friendServiceResult,
    error: friendServiceError,
    uploadToFriendService
  } = useFriendUploadService();


  const loading = friendServiceLoading;


  useEffect(() => {
    console.log('🏁 [ExcelSender] Componente montado');
  }, []);


  const taxCodeCountry = useMemo(() => {
    if (cameFromNormalizer) {
      const aplicaIGV = normalizerIgvSettings.applyIgvCost || normalizerIgvSettings.applyIgvSale;
      return aplicaIGV ? "01" : "02";
    }
    return aplicarIgv ? "01" : "02";
  }, [cameFromNormalizer, normalizerIgvSettings, aplicarIgv]);


  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);


  useEffect(() => {
    if (loading && !isLocked) {
      setIsLocked(true);
      toast.info("Configuración bloqueada durante la carga");
    }
  }, [loading, isLocked]);


  useEffect(() => {
    const pendingName = sessionStorage.getItem('pendingExcelName');
    const savedApplyIgvCost = sessionStorage.getItem('applyIgvCost');
    const savedApplyIgvSale = sessionStorage.getItem('applyIgvSale');
    
    if (pendingName) {
      if (pendingName.includes('CONVERSION')) {
        setCargaMode("CONVERSION");
      }
      setCameFromNormalizer(true);
      
      const igvSettings = {
        applyIgvCost: savedApplyIgvCost === 'true',
        applyIgvSale: savedApplyIgvSale === 'true'
      };
      
      setNormalizerIgvSettings(igvSettings);
    }
  }, []);


  useEffect(() => {
    let isMounted = true;
    
    const loadPendingFile = async () => {
      const pendingExcel = sessionStorage.getItem('pendingExcel');
      const pendingName = sessionStorage.getItem('pendingExcelName');

      if (pendingExcel && pendingName && isMounted) {
        try {
          const res = await fetch(pendingExcel);
          const blob = await res.blob();
          
          const file = new File([blob], pendingName, { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          
          setFileProductos(file);
          
          sessionStorage.removeItem('pendingExcel');
          sessionStorage.removeItem('pendingExcelName');
          
          toast.success(`Archivo "${pendingName}" listo para enviar`);
        } catch (err) {
          console.error("Error cargando archivo pendiente:", err);
        }
      }
    };

    loadPendingFile();
    
    return () => {
      isMounted = false;
    };
  }, []);


  const canSend = useMemo(() => {
    const valid = !(!fileProductos || !employeeData || loading || isLocked);
    
    if (cargaMode === "CONVERSION") {
      return valid && selectedPriceLists.size > 0;
    }
    return valid && !!priceListId;
  }, [fileProductos, employeeData, loading, isLocked, cargaMode, 
     selectedPriceLists.size, priceListId]);


  const handleSend = async () => {
    setIsLocked(true);
    
    try {
      await uploadToFriendService({
        file: fileProductos,
        employeeData,
        priceLists,
        selectedPriceLists,
        priceListId,
        cargaMode,
        taxCodeCountry,
        nodeName: nodeKey,
        cameFromNormalizer,
        normalizerIgvSettings
      });
    } catch (err) {
      console.error("Error en envío:", err);
    }
  };

  const handleUnlock = () => {
    if (!loading) {
      setIsLocked(false);
      toast.success("Configuración desbloqueada");
    }
  };


  const IgvSelector = () => {
    if (cameFromNormalizer) return null;

    return (
      <div className={`flex-1 rounded-2xl border ${isLocked ? 'border-gray-200 bg-gray-50' : 'border-[#D9D9D9] bg-white'} p-4 transition-all`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-sm font-semibold ${isLocked ? 'text-gray-400' : 'text-[#02979B]'}`}>
              Aplicar IGV
              {isLocked && <span className="ml-2 text-xs text-gray-400">(bloqueado)</span>}
            </span>
            <p className={`text-xs ${isLocked ? 'text-gray-300' : 'text-[#02979B]/60'} mt-0.5`}>
              {aplicarIgv ? "Con IGV (18%)" : "Sin IGV"}
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => !isLocked && setAplicarIgv(!aplicarIgv)}
            disabled={isLocked}
            className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
              aplicarIgv ? 'bg-[#02979B]' : 'bg-[#E5E7EB]'
            } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                aplicarIgv ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    );
  };

  const ModeSelector = () => {
    if (cameFromNormalizer) return null;

    return (
      <div className={`flex-1 rounded-2xl border ${isLocked ? 'border-gray-200 bg-gray-50' : 'border-[#D9D9D9] bg-white'} p-4 transition-all`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-sm font-semibold ${isLocked ? 'text-gray-400' : 'text-[#02979B]'}`}>
              Modo de carga
              {isLocked && <span className="ml-2 text-xs text-gray-400">(bloqueado)</span>}
            </span>
            <p className={`text-xs ${isLocked ? 'text-gray-300' : 'text-[#02979B]/60'} mt-0.5`}>
              {cargaMode === "NORMAL" ? "Modo Normal" : "Modo Conversión"}
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => !isLocked && setCargaMode(cargaMode === "NORMAL" ? "CONVERSION" : "NORMAL")}
            disabled={isLocked}
            className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
              cargaMode === "NORMAL" ? "bg-[#02979B]" : "bg-[#E5E7EB]"
            } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                cargaMode === "CONVERSION" ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    );
  };

  const PriceListSelector = () => {
    if (loadingPriceLists) {
      return (
        <div className="flex items-center gap-2 w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
          <Spinner />
          <span>Cargando listas de precios...</span>
        </div>
      );
    }

    if (priceListsError) {
      return (
        <div className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {priceListsError}
        </div>
      );
    }

    if (priceLists.length === 0) {
      return (
        <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
          No hay listas de precios disponibles
        </div>
      );
    }

    if (cargaMode === "CONVERSION") {
      const selectedArray = Array.from(selectedPriceLists);
      
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className={`text-sm font-medium ${isLocked ? 'text-gray-400' : 'text-[#02979B]'}`}>
              Listas de Precios <span className="text-red-500">*</span>
              <span className="ml-2 text-xs font-normal ${isLocked ? 'text-gray-300' : 'text-[#02979B]/60'}">
                (💰 La primera lista seleccionada será la principal)
              </span>
            </label>
            {!isLocked && (
              <button
                type="button"
                onClick={toggleSelectAllPriceLists}
                className="text-xs text-[#02979B] hover:text-[#02979B]/80 font-medium"
              >
                {selectedPriceLists.size === priceLists.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </button>
            )}
          </div>
          
          <div className={`space-y-2 max-h-60 overflow-y-auto border rounded-xl p-3 ${isLocked ? 'border-gray-200 bg-gray-50' : 'border-[#D9D9D9]'}`}>
            {priceLists.map((pl) => {
              const plId = String(pl.id);
              const isSelected = selectedPriceLists.has(plId);
              const isFirst = isSelected && selectedArray[0] === plId;
              
              return (
                <label
                  key={pl.id}
                  className={`flex items-start gap-3 p-2 rounded-lg transition ${
                    isLocked 
                      ? 'cursor-not-allowed opacity-60' 
                      : isSelected 
                        ? 'bg-[#02979B]/10 cursor-pointer' 
                        : 'hover:bg-[#02979B]/5 cursor-pointer'
                  } ${isFirst ? 'border-l-4 border-[#02979B]' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => !isLocked && togglePriceList(plId)}
                    disabled={isLocked}
                    className="mt-0.5 h-4 w-4 accent-[#02979B] disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isLocked ? 'text-gray-400' : 'text-[#02979B]'}`}>
                      {pl.name}
                      {isFirst && (
                        <span className="ml-2 text-xs bg-[#02979B] text-white px-2 py-0.5 rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          
          {selectedPriceLists.size === 0 && !isLocked && (
            <p className="text-xs text-red-500">Seleccione al menos una lista de precios</p>
          )}
        </div>
      );
    }


    return (
      <div className="space-y-1.5">
        <label className={`text-sm font-medium ${isLocked ? 'text-gray-400' : 'text-[#02979B]'}`}>
          Lista de Precios <span className="text-red-500">*</span>
        </label>
        <select
          value={priceListId}
          onChange={(e) => !isLocked && setPriceListId(e.target.value)}
          disabled={isLocked}
          className={`w-full rounded-xl border ${isLocked ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-[#D9D9D9] bg-white text-[#02979B]'} px-3 py-2 text-sm outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B] disabled:cursor-not-allowed`}
        >
          <option value="">Seleccione una lista de precios</option>
          {priceLists.map((pl) => (
            <option key={pl.id} value={String(pl.id)}>
              {pl.name} {(pl.flagDefault === 1 || pl.flagDefault === true) ? '(Por defecto)' : ''}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="w-full">      
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        
        {/* Indicador de bloqueo */}
        {isLocked && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm font-medium text-orange-700">
                Configuración bloqueada durante la carga
              </span>
            </div>
            {!loading && (
              <button
                type="button"
                onClick={handleUnlock}
                className="text-xs bg-white border border-orange-200 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-50"
              >
                Desbloquear
              </button>
            )}
          </div>
        )}


        {!cameFromNormalizer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ModeSelector />
            <IgvSelector />
          </div>
        )}

 
        <div className={`rounded-2xl border ${isLocked ? 'border-gray-200 bg-gray-50' : 'border-[#D9D9D9] bg-white'} p-4 transition-all`}>
          <div className="text-sm font-semibold text-[#02979B] mb-4 flex items-center gap-2">
            Configuración de listas de precios
            {cargaMode === "CONVERSION" && !cameFromNormalizer && (
              <span className="text-xs bg-[#02979B] text-white px-2 py-1 rounded-full">
                Modo Conversión
              </span>
            )}
            {isLocked && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                bloqueado
              </span>
            )}
          </div>
          <PriceListSelector />
        </div>

 
        <div className={isLocked ? 'opacity-60 pointer-events-none' : ''}>
          <FileUploader 
            file={fileProductos}
            onFileChange={setFileProductos}
            description="Selecciona el archivo Excel con tus productos"
          />
        </div>


        {loading && (
          <div className="mt-4 p-4 bg-orange-50 rounded-xl">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-orange-800">
                Enviando productos: {progress}%
              </span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-3 rounded-full bg-orange-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <circle cx="12" cy="16" r="1" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    ¡Importante! No recargues la página
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Si recargas ahora, la carga se interrumpirá.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}


        {friendServiceError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-red-700">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-800">Error</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-red-700">{friendServiceError}</div>
              </div>
            </div>
          </div>
        )}


        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend || loading}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition md:w-auto ${
                loading
                  ? "bg-orange-500 animate-pulse cursor-not-allowed"
                  : canSend
                  ? "bg-[#02979B] hover:bg-[#02979B]/80"
                  : "bg-[#D9D9D9] cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Spinner />
                  Enviando...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 2 15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Enviar Productos
                </>
              )}
            </button>

            <div className="text-xs text-[#02979B]/60">
              Nodo: <span className="font-mono text-[#02979B]">{nodeLabel}</span>
            </div>
          </div>

          <div className="text-sm text-[#02979B]/60 md:text-right">
            <span className="text-[#02979B]">Servicio:</span>{" "}
            <span className="font-mono font-semibold text-[#02979B]">Unificado</span>
          </div>
        </div>
      </form>

      
      {friendServiceResult && (
        <div className="mt-8">
          <div className="rounded-2xl border bg-green-50 border-green-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2">
                    <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3 className="text-xl font-bold text-green-700">
                    ¡Productos enviados correctamente!
                  </h3>
                </div>
                
                <div className="rounded-xl bg-green-100 p-4">
                  <p className="text-lg font-bold text-green-900">
                    {friendServiceResult.total_products || friendServiceResult.totalProducts} productos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExcelSender;