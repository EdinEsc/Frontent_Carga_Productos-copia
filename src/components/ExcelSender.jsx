// components/ExcelSender.jsx
import { useMemo, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useNodeConfig } from "../hooks/useNodeConfig";
import { useWarehouse } from "../hooks/useWarehouse";
import { usePriceLists } from "../hooks/usePriceLists";
import { useBlockUpload } from "../hooks/useBlockUpload";
import { downloadErrorExcel } from "../utils/excelUtils";
import Spinner from "./shared/Spinner";
import FileUploader from "./shared/FileUploader";

export default function ExcelSender({ employeeData, warehouses = [], onLoadingChange }) {
  // ===== NUEVO: Estado para controlar el bloqueo =====
  const [isLocked, setIsLocked] = useState(false);
  
  // ===== DETECTAR SI VIENE DEL NORMALIZER =====
  const [cameFromNormalizer, setCameFromNormalizer] = useState(false);
  const [cargaMode, setCargaMode] = useState("NORMAL");
  
  // ===== ESTADO PARA IGV DEL NORMALIZER =====
  const [normalizerIgvSettings, setNormalizerIgvSettings] = useState({
    applyIgvCost: true,
    applyIgvSale: true
  });
  
  // Node config
  const { nodeKey, baseUrl } = useNodeConfig();

  // Employee data
  const [companyId, setCompanyId] = useState("");
  const [subsidiaryId, setSubsidiaryId] = useState("");
  const [idWarehouse, setIdWarehouse] = useState("");
  const [idCountry] = useState("1");
  const [flagUseSimpleBrand] = useState(true);

  // IGV (solo para modo manual)
  const [aplicarIgv, setAplicarIgv] = useState(true);
  
  // File
  const [fileProductos, setFileProductos] = useState(null);

  // Price lists hook
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

  // Warehouse hook
  const { selectedWarehouseId, selectedWarehouseName, handleWarehouseChange } = 
    useWarehouse(warehouses, cameFromNormalizer);

  // ===== PRIMERO: Calcular taxCodeCountry =====
  const taxCodeCountry = useMemo(() => {
    if (cameFromNormalizer) {
      const aplica = normalizerIgvSettings.applyIgvCost || normalizerIgvSettings.applyIgvSale;
      const result = aplica ? "01" : "02";
      
      console.log('💰 [ExcelSender] taxCodeCountry (desde normalizer):', {
        applyIgvCost: normalizerIgvSettings.applyIgvCost,
        applyIgvSale: normalizerIgvSettings.applyIgvSale,
        aplica,
        result
      });
      
      return result;
    }
    
    const result = aplicarIgv ? "01" : "02";
    console.log('💰 [ExcelSender] taxCodeCountry (manual):', {
      aplicarIgv,
      result
    });
    
    return result;
  }, [cameFromNormalizer, normalizerIgvSettings, aplicarIgv]);

  // ===== SEGUNDO: Block upload hook =====
  const {
    progress,
    currentBlock,
    totalBlocks,
    blockResults,
    loading,
    error: blockError,
    result,
    sendInBlocks
  } = useBlockUpload({
    baseUrl,
    companyId,
    subsidiaryId,
    priceListId,
    selectedPriceLists,
    cargaMode,
    selectedWarehouseId,
    idWarehouse,
    taxCodeCountry,
    flagUseSimpleBrand,
    idCountry
  });

  // ===== NUEVO: Notificar al padre cuando cambia el estado de carga =====
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  // ===== 🚨 ADVERTENCIA DE RECARGA DE PÁGINA =====
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (loading) {
        // Mensaje personalizado para recarga
        e.preventDefault();
        e.returnValue = '¿Estás seguro? Si recargas ahora, la carga se interrumpirá y SOLO se habrán subido los productos procesados hasta este momento.';
        return e.returnValue;
      }
    };

    // Agregar el evento cuando hay carga activa
    if (loading) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    // Limpiar el evento cuando ya no hay carga
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loading]);

  // ===== NUEVO: Efecto para bloquear cuando empieza la carga =====
  useEffect(() => {
    if (loading && !isLocked) {
      setIsLocked(true);
      toast.info("Configuración bloqueada durante la carga");
    }
  }, [loading, isLocked]);

  // Detectar modo del archivo pendiente y cargar settings del normalizer
  useEffect(() => {
    const pendingName = sessionStorage.getItem('pendingExcelName');
    const savedApplyIgvCost = sessionStorage.getItem('applyIgvCost');
    const savedApplyIgvSale = sessionStorage.getItem('applyIgvSale');
    
    if (pendingName) {
      if (pendingName.includes('CONVERSION')) {
        setCargaMode("CONVERSION");
      }
      setCameFromNormalizer(true);
      
      setNormalizerIgvSettings({
        applyIgvCost: savedApplyIgvCost === 'true',
        applyIgvSale: savedApplyIgvSale === 'true'
      });
      
      console.log('📋 [ExcelSender] Settings cargados del normalizer:', {
        applyIgvCost: savedApplyIgvCost,
        applyIgvSale: savedApplyIgvSale,
        aplicaIGV: (savedApplyIgvCost === 'true' || savedApplyIgvSale === 'true')
      });
    }
  }, []);

  // Cargar datos del empleado
  useEffect(() => {
    if (employeeData) {
      if (employeeData.companyId) {
        setCompanyId(String(employeeData.companyId));
      }
      
      if (employeeData.comSubsidiariesId) {
        setSubsidiaryId(String(employeeData.comSubsidiariesId));
      } else if (employeeData.subsidiary?.id) {
        setSubsidiaryId(String(employeeData.subsidiary.id));
      }
      
      if (employeeData.warWarehousesId) {
        setIdWarehouse(String(employeeData.warWarehousesId));
      }
    }
  }, [employeeData]);

  // Cargar archivo pendiente
  useEffect(() => {
    let isMounted = true;
    let toastShown = false;
    
    const loadPendingFile = async () => {
      const pendingExcel = sessionStorage.getItem('pendingExcel');
      const pendingName = sessionStorage.getItem('pendingExcelName');

      if (pendingExcel && pendingName && isMounted && !toastShown) {
        try {
          const res = await fetch(pendingExcel);
          const blob = await res.blob();
          
          if (!isMounted) return;
          
          const file = new File([blob], pendingName, { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          
          setFileProductos(file);
          
          sessionStorage.removeItem('pendingExcel');
          sessionStorage.removeItem('pendingExcelName');
          
          toastShown = true;
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

  // Log para depuración
  useEffect(() => {
    console.log('📊 [ExcelSender] Estado actual:', {
      cameFromNormalizer,
      normalizerIgvSettings,
      taxCodeCountry,
      cargaMode,
      loading,
      isLocked
    });
  }, [cameFromNormalizer, normalizerIgvSettings, taxCodeCountry, cargaMode, loading, isLocked]);

  // ===== VALIDACIÓN (incluye isLocked) =====
  const canSend = useMemo(() => {
    if (!fileProductos || !companyId || !subsidiaryId || loading || isLocked) return false;
    
    if (!cameFromNormalizer && !selectedWarehouseId) return false;
    
    if (cargaMode === "CONVERSION") {
      return selectedPriceLists.size > 0;
    }
    return !!priceListId;
  }, [fileProductos, companyId, subsidiaryId, loading, isLocked, cargaMode, 
     selectedPriceLists.size, priceListId, cameFromNormalizer, selectedWarehouseId]);

  // Handlers
  const handleSend = () => {
    console.log('🚀 [ExcelSender] Iniciando envío con:', {
      taxCodeCountry,
      cameFromNormalizer,
      normalizerIgvSettings
    });
    setIsLocked(true); // Bloquear inmediatamente al hacer clic
    sendInBlocks(fileProductos);
  };

  // ===== NUEVO: Función para resetear el bloqueo (opcional) =====
  const handleUnlock = () => {
    if (!loading) {
      setIsLocked(false);
      toast.success("Configuración desbloqueada");
    }
  };

  const handleDownloadError = useCallback(() => {
    if (!result || !result.blocks) return;
    const firstBlockWithError = result.blocks.find(block => block.errorExcelPath);
    if (firstBlockWithError) {
      downloadErrorExcel(baseUrl, firstBlockWithError.errorExcelPath);
    }
  }, [result, baseUrl]);

  // UI Components con estado bloqueado
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

  const WarehouseSelector = () => {
    if (cameFromNormalizer) return null;

    return (
      <div className={`rounded-2xl border ${isLocked ? 'border-gray-200 bg-gray-50' : 'border-[#D9D9D9] bg-white'} p-4 transition-all`}>
        <div className="text-sm font-semibold text-[#02979B] mb-4 flex items-center gap-2">
          Configuración de almacén
          {isLocked && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
              bloqueado
            </span>
          )}
        </div>
        
        <div className="space-y-1.5">
          <label className={`text-sm font-medium ${isLocked ? 'text-gray-400' : 'text-[#02979B]'}`}>
            Seleccionar Almacén <span className="text-red-500">*</span>
          </label>
          
          {warehouses.length === 0 ? (
            <div className="rounded-xl border border-[#D9D9D9] bg-gray-50 px-3 py-2 text-sm text-gray-500">
              Cargando almacenes...
            </div>
          ) : warehouses.length === 1 ? (
            <input
              type="text"
              value={warehouses[0].name}
              readOnly
              className="w-full rounded-xl border border-[#D9D9D9] bg-gray-100 px-3 py-2 text-sm text-[#02979B]"
            />
          ) : (
            <select
              value={selectedWarehouseId}
              onChange={handleWarehouseChange}
              disabled={isLocked}
              required
              className={`w-full rounded-xl border ${isLocked ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-[#D9D9D9] bg-white text-[#02979B]'} px-3 py-2 text-sm outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B] disabled:cursor-not-allowed`}
            >
              <option value="">Seleccione un almacén</option>
              {warehouses.map((w) => (
                <option key={w.id} value={String(w.id)}>
                  {w.name}
                </option>
              ))}
            </select>
          )}

          {warehouses.length > 1 && !selectedWarehouseId && !isLocked && (
            <p className="mt-1 text-xs text-red-500">Debe seleccionar un almacén para continuar</p>
          )}
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
                (💰 El primer precio de la lista corresponde al Precio de Venta.)
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

    // MODO NORMAL
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

  // Result stats
  const allProductsSuccess = result?.successful_products === result?.total_products;
  const hasErrorExcel = result?.blocks?.some(block => block.errorExcelPath);

  return (
    <div className="w-full">
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* NUEVO: Indicador de bloqueo */}
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

        {/* Modo e IGV selectors */}
        {!cameFromNormalizer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ModeSelector />
            <IgvSelector />
          </div>
        )}

        <WarehouseSelector />

        {/* Price List Selector */}
        <div className={`rounded-2xl border ${isLocked ? 'border-gray-200 bg-gray-50' : 'border-[#D9D9D9] bg-white'} p-4 transition-all`}>
          <div className="text-sm font-semibold text-[#02979B] mb-4 flex items-center gap-2">
            Configuración de envío
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

        {/* File uploader - También se bloquea el FileUploader */}
        <div className={isLocked ? 'opacity-60 pointer-events-none' : ''}>
          <FileUploader 
            file={fileProductos}
            onFileChange={setFileProductos}
            description="Se enviará en bloques de 400 productos"
            disabled={isLocked} // Asegúrate de que FileUploader acepte esta prop
          />
        </div>

        {/* Progress bar - AHORA EN NARANJA CON ADVERTENCIA DE RECARGA */}
        {loading && totalBlocks > 0 && (
          <div className="mt-4 p-4 bg-orange-50 rounded-xl">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-orange-800">Progreso: {progress}%</span>
              <span className="text-sm font-medium text-orange-800">
                Bloque {currentBlock} de {totalBlocks}
              </span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2.5">
              <div 
                className="bg-orange-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* 🚨 ADVERTENCIA DE RECARGA */}
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
                    Si recargas ahora, la carga se interrumpirá y SOLO se habrán subido los productos de los bloques ya completados ({blockResults.reduce((acc, b) => acc + (b.successful || 0), 0)} productos).
                  </p>
                </div>
              </div>
            </div>
            
            {blockResults.length > 0 && (
              <div className="mt-3 text-xs text-orange-700">
                <p>✅ Bloques exitosos: {blockResults.filter(b => b.success && !b.hasErrors).length}</p>
                <p>⚠️ Bloques con errores parciales: {blockResults.filter(b => b.success && b.hasErrors).length}</p>
                <p>❌ Bloques fallidos: {blockResults.filter(b => !b.success).length}</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {blockError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-red-700">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-800">Mensaje</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-red-700">{blockError}</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition md:w-auto ${
                canSend ? "bg-[#02979B] hover:bg-[#02979B]/80" : "bg-[#D9D9D9] cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Spinner />
                  {progress > 0 ? `Enviando... ${progress}%` : "Enviando..."}
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 2 15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Enviar Excel (bloques de 400)
                </>
              )}
            </button>

            <div className="text-xs text-[#02979B]/60">
              Nodo: <span className="font-mono text-[#02979B]">{nodeKey.replace('n', 'Nodo ')}</span>
            </div>
          </div>

          <div className="text-sm text-[#02979B]/60 md:text-right">
            <span className="text-[#02979B]">Tamaño bloque:</span>{" "}
            <span className="font-mono font-semibold text-[#02979B]">400 productos</span>
          </div>
        </div>
      </form>

      {/* Resultado del envío */}
      {result && (
        <div className="mt-8">
          <div className={`rounded-2xl border p-6 ${
            allProductsSuccess ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  {allProductsSuccess ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2">
                      <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2">
                      <path d="M12 9v4m0 4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <h3 className={`text-xl font-bold ${
                    allProductsSuccess ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {allProductsSuccess ? 'Proceso completado con éxito' : 'Proceso completado con advertencias'}
                  </h3>
                </div>
                
                <div className="flex gap-4">
                  <div className={`rounded-xl p-3 min-w-[100px] ${
                    allProductsSuccess ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    <p className={`text-sm ${
                      allProductsSuccess ? 'text-green-800' : 'text-yellow-800'
                    }`}>Productos subidos</p>
                    <p className={`text-2xl font-bold ${
                      allProductsSuccess ? 'text-green-900' : 'text-yellow-900'
                    }`}>{result.successful_products}</p>
                  </div>
                  
                  <div className={`rounded-xl p-3 min-w-[100px] ${
                    allProductsSuccess ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    <p className={`text-sm ${
                      allProductsSuccess ? 'text-green-800' : 'text-yellow-800'
                    }`}>Total productos</p>
                    <p className={`text-2xl font-bold ${
                      allProductsSuccess ? 'text-green-900' : 'text-yellow-900'
                    }`}>{result.total_products}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  {result.total_blocks} bloque{result.total_blocks !== 1 ? 's' : ''} procesado{result.total_blocks !== 1 ? 's' : ''}
                  {result.blocks_with_errors > 0 && ` (${result.blocks_with_errors} con problemas)`}
                </p>
              </div>
              
              {hasErrorExcel && (
                <button
                  onClick={handleDownloadError}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-medium text-white hover:bg-orange-600 whitespace-nowrap"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4M12 12v8m-4-4l4 4 4-4M12 2v10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Descargar Excel de errores
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}