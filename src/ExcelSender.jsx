import { useMemo, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export default function ExcelSender({ employeeData }) {
  const NODES = useMemo(
    () => [
      { key: "n1", label: "Nodo 1", base: "https://n1.japiexcel.casamarketapp.com" },
      { key: "n23", label: "Nodo 2 / 3", base: "https://n3.japiexcel.casamarketapp.com" },
      { key: "n4", label: "Nodo 4", base: "https://n4.japiexcel.casamarketapp.com" },
      { key: "n5", label: "Nodo 5", base: "https://n5.japiexcel.casamarketapp.com" },
    ],
    []
  );

  // ===== DETECTAR MODO DE CARGA =====
  const [cargaMode, setCargaMode] = useState("NORMAL");
  
  useEffect(() => {
    const pendingName = sessionStorage.getItem('pendingExcelName');
    if (pendingName && pendingName.includes('CONVERSION')) {
      setCargaMode("CONVERSION");
      console.log("📦 Modo CONVERSIÓN detectado");
    } else {
      console.log("📦 Modo NORMAL detectado");
    }
  }, []);

  // ===== Estado para múltiples price lists =====
  const [selectedPriceLists, setSelectedPriceLists] = useState(new Set());
  
  // ===== Función para toggle de price lists =====
  const togglePriceList = (priceListId) => {
    setSelectedPriceLists(prev => {
      const next = new Set(prev);
      if (next.has(priceListId)) {
        next.delete(priceListId);
      } else {
        next.add(priceListId);
      }
      return next;
    });
  };

  // ===== Seleccionar/deseleccionar todas =====
  const toggleSelectAllPriceLists = () => {
    if (selectedPriceLists.size === priceLists.length) {
      setSelectedPriceLists(new Set());
    } else {
      setSelectedPriceLists(new Set(priceLists.map(pl => String(pl.id))));
    }
  };

  // ===== PROGRESO =====
  const [progress, setProgress] = useState(0);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [blockResults, setBlockResults] = useState([]);

  // ===== Obtener nodo de la URL =====
  const getNodeFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const nodeParam = params.get("node");
    
    if (!nodeParam) return "n1";
    
    const nodeMap = {
      "1": "n1",
      "2": "n23",
      "3": "n23",
      "4": "n4",
      "5": "n5"
    };
    
    return nodeMap[nodeParam] || "n1";
  };

  const [nodeKey] = useState(getNodeFromUrl());
  
  // ===== IDs AUTOMÁTICOS desde employeeData =====
  const [companyId, setCompanyId] = useState("");
  const [subsidiaryId, setSubsidiaryId] = useState("");
  const [priceListId, setPriceListId] = useState(""); // Para modo NORMAL

  // ===== Estado para listas de precios =====
  const [priceLists, setPriceLists] = useState([]);
  const [loadingPriceLists, setLoadingPriceLists] = useState(false);
  const [priceListsError, setPriceListsError] = useState("");

  // ===== idWarehouse desde normalizer =====
  const [idWarehouse, setIdWarehouse] = useState("");
  const [idCountry, setIdCountry] = useState("1");
  
  const [applyIgvCost, setApplyIgvCost] = useState(true);
  const [applyIgvSale, setApplyIgvSale] = useState(true);
  
  const taxCodeCountry = useMemo(() => {
    return (!applyIgvCost && !applyIgvSale) ? "02" : "01";
  }, [applyIgvCost, applyIgvSale]);

  const [flagUseSimpleBrand, setFlagUseSimpleBrand] = useState(true);

  const [fileProductos, setFileProductos] = useState(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState(null);
  const [result, setResult] = useState(null);

  // ===== CARGAR DATOS DEL EMPLEADO =====
  useEffect(() => {
    if (employeeData) {
      console.log("📦 Datos de empleado recibidos:", employeeData);
      
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

  // ===== CARGAR ESTADO DESDE NORMALIZER =====
  useEffect(() => {
    const savedApplyIgvCost = sessionStorage.getItem('applyIgvCost');
    const savedApplyIgvSale = sessionStorage.getItem('applyIgvSale');
    
    if (savedApplyIgvCost !== null) {
      setApplyIgvCost(savedApplyIgvCost === 'true');
    }
    if (savedApplyIgvSale !== null) {
      setApplyIgvSale(savedApplyIgvSale === 'true');
    }
    
    const selectedWarehouseId = sessionStorage.getItem('selectedWarehouseId');
    if (selectedWarehouseId) {
      setIdWarehouse(selectedWarehouseId);
    }
  }, []);

  // ===== CARGAR LISTAS DE PRECIOS =====
  useEffect(() => {
    const loadPriceLists = async () => {
      setLoadingPriceLists(true);
      
      try {
        const savedPriceLists = sessionStorage.getItem('priceLists');
        
        if (savedPriceLists) {
          const data = JSON.parse(savedPriceLists);
          console.log("💰 LISTAS DE PRECIOS CARGADAS:", data);
          setPriceLists(data);

          // Para modo NORMAL: seleccionar una por defecto
          if (cargaMode === "NORMAL") {
            if (data.length === 1) {
              setPriceListId(String(data[0].id));
              toast.info(`Lista seleccionada: ${data[0].name}`);
            } else if (data.length > 1) {
              const defaultList = data.find(pl => pl.flagDefault === 1 || pl.flagDefault === true);
              if (defaultList) {
                setPriceListId(String(defaultList.id));
                // toast.info(`Lista por defecto seleccionada: ${defaultList.name}`);
              }
            }
          }
          
          // Para modo CONVERSIÓN: seleccionar todas por defecto
          if (cargaMode === "CONVERSION") {
            setSelectedPriceLists(new Set(data.map(pl => String(pl.id))));
            toast.info(`${data.length} listas de precios disponibles para selección múltiple`);
          }
        } else {
          setPriceListsError("No hay listas de precios disponibles");
        }
      } catch (error) {
        console.error("Error cargando listas de precios:", error);
        setPriceListsError("Error al cargar listas de precios");
      } finally {
        setLoadingPriceLists(false);
      }
    };

    if (priceLists.length === 0) {
      loadPriceLists();
    }
  }, [cargaMode]);

  const getNodeLabel = () => {
    const node = NODES.find(n => n.key === nodeKey);
    return node ? node.label : "Nodo no encontrado";
  };

  const getNodeBase = () => {
    const node = NODES.find(n => n.key === nodeKey);
    return node ? node.base : NODES[0].base;
  };

  const baseUrl = useMemo(() => {
    return getNodeBase();
  }, [nodeKey]);

  // ===== FUNCIÓN SIMPLE: El orden de selección determina la URL =====
  const buildEndpoint = useCallback(() => {
    const base = `${baseUrl}/api/excel/readexcel/${encodeURIComponent(companyId)}`;
    
    if (cargaMode === "CONVERSION") {
      const selectedIds = Array.from(selectedPriceLists);
      if (selectedIds.length === 0) return "";
      
      // El primer ID seleccionado va después de /pricelist/
      const [primaryId, ...additionalIds] = selectedIds;
      
      // Los IDs adicionales van después de /subsidiary/
      const additionalPath = additionalIds.map(id => encodeURIComponent(id)).join('/');
      
      if (additionalPath) {
        return `${base}/pricelist/${encodeURIComponent(primaryId)}/subsidiary/${encodeURIComponent(subsidiaryId)}/${additionalPath}`;
      } else {
        return `${base}/pricelist/${encodeURIComponent(primaryId)}/subsidiary/${encodeURIComponent(subsidiaryId)}`;
      }
    } else {
      // Modo normal
      return `${base}/pricelist/${encodeURIComponent(priceListId)}/subsidiary/${encodeURIComponent(subsidiaryId)}`;
    }
  }, [baseUrl, companyId, priceListId, subsidiaryId, selectedPriceLists, cargaMode]);

  // ===== VALIDACIÓN según el modo =====
  const canSend = useMemo(() => {
    if (!fileProductos || !companyId || !subsidiaryId || loading) return false;
    
    if (cargaMode === "CONVERSION") {
      return selectedPriceLists.size > 0;
    } else {
      return !!priceListId;
    }
  }, [fileProductos, companyId, subsidiaryId, loading, cargaMode, selectedPriceLists.size, priceListId]);

  const endpointPreview = canSend ? buildEndpoint() : "";

  // ===== CARGAR ARCHIVO PENDIENTE =====
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

  // ===== FUNCIÓN PARA DESCARGAR EXCEL DE ERRORES =====
  const downloadErrorExcel = useCallback(async (errorPath) => {
    try {
      if (!errorPath) {
        toast.error("No hay ruta de descarga disponible");
        return;
      }

      // Construir URL completa usando el nodo base
      const downloadUrl = `${baseUrl}/api/download/${errorPath.split('/download/')[1]}`;
      
      toast.info("Descargando Excel de errores...");
      
      const res = await fetch(downloadUrl, {
        headers: {
          "Authorization": `Bearer ${new URLSearchParams(window.location.search).get("token")}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`Error al descargar: ${res.status}`);
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `errores_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Excel de errores descargado");
    } catch (err) {
      console.error("Error descargando Excel:", err);
      toast.error("Error al descargar Excel de errores");
    }
  }, [baseUrl]);

  // ===== FUNCIÓN PARA ENVIAR EN BLOQUES DE 400 =====
  const sendInBlocks = async () => {
    setError("");
    setErrorDetails(null);
    setResult(null);
    setBlockResults([]);
    setProgress(0);
    setLoading(true);

    try {
      if (cargaMode === "CONVERSION" && selectedPriceLists.size === 0) {
        throw new Error("Debe seleccionar al menos una lista de precios");
      }
      
      if (cargaMode === "NORMAL" && !priceListId) {
        throw new Error("Debe seleccionar una lista de precios");
      }

      const data = await fileProductos.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      if (!workbook.SheetNames.includes('productos')) {
        throw new Error("El Excel no tiene una hoja llamada 'productos'");
      }
      
      const sheet = workbook.Sheets['productos'];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      const totalRows = jsonData.length;
      const BLOCK_SIZE = 400;
      const totalBlocks = Math.ceil(totalRows / BLOCK_SIZE);
      
      setTotalBlocks(totalBlocks);
      
      console.log(`📊 Total productos: ${totalRows}`);
      console.log(`📦 Enviando en ${totalBlocks} bloques de ${BLOCK_SIZE}`);
      console.log(`🔗 Endpoint: ${buildEndpoint()}`);
      
      toast.info(`Procesando ${totalRows} productos en ${totalBlocks} bloques de 400...`);
      
      let allResults = [];
      let successCount = 0;
      let errorCount = 0;
      
      for (let blockNum = 0; blockNum < totalBlocks; blockNum++) {
        const start = blockNum * BLOCK_SIZE;
        const end = Math.min(start + BLOCK_SIZE, totalRows);
        const blockData = jsonData.slice(start, end);
        
        setCurrentBlock(blockNum + 1);
        const progressPercent = Math.round(((blockNum) / totalBlocks) * 100);
        setProgress(progressPercent);
        
        toast.info(`Enviando bloque ${blockNum + 1} de ${totalBlocks} (${blockData.length} productos)...`);
        
        const blockSheet = XLSX.utils.json_to_sheet(blockData);
        const blockWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(blockWorkbook, blockSheet, 'productos');
        const blockExcel = XLSX.write(blockWorkbook, { bookType: 'xlsx', type: 'array' });
        const blockFile = new File([blockExcel], `bloque_${blockNum + 1}.xlsx`, { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        const form = new FormData();
        form.append("file_excel", blockFile);
        form.append("idCountry", idCountry);
        form.append("taxCodeCountry", taxCodeCountry);
        form.append("flagUseSimpleBrand", String(flagUseSimpleBrand));
        if (idWarehouse) form.append("idWarehouse", idWarehouse);
        
        const endpoint = buildEndpoint();
        const token = new URLSearchParams(window.location.search).get("token");
        
        const res = await fetch(endpoint, { 
          method: "POST", 
          body: form,
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        const text = await res.text();
        
        let blockResult;
        try {
          blockResult = JSON.parse(text);
        } catch {
          blockResult = { message: text };
        }
        
        const blockSuccess = blockResult?.data?.n_products || 0;
        successCount += blockSuccess;
        
        const blockInfo = {
          block: blockNum + 1,
          success: res.ok,
          status: res.status,
          data: blockResult,
          products: blockData.length,
          successful: blockSuccess,
          errorExcelPath: blockResult?.data?.name_excel // Guardar ruta del Excel de errores si existe
        };
        
        allResults.push(blockInfo);
        setBlockResults([...allResults]);
        
        if (!res.ok) {
          errorCount++;
          console.error(`❌ Bloque ${blockNum + 1} falló:`, blockResult);
        } else {
          console.log(`✅ Bloque ${blockNum + 1} completado: ${blockSuccess} productos`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setProgress(100);
      setResult({
        mode: cargaMode,
        total_blocks: totalBlocks,
        total_products: totalRows,
        successful_products: successCount,
        failed_blocks: errorCount,
        blocks: allResults
      });
      
      if (successCount === totalRows) {
        toast.success(`✅ Todos los ${totalRows} productos subidos correctamente`);
      } else {
        toast.warning(`⚠️ Se subieron ${successCount} de ${totalRows} productos (${errorCount} bloques con errores)`);
      }
      
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
      toast.error("Error en el envío por bloques");
    } finally {
      setLoading(false);
    }
  };

  // ===== COMPONENTE PRICE LIST SELECTOR SIMPLE =====
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

    // MODO CONVERSIÓN: Checkboxes simples
    if (cargaMode === "CONVERSION") {
      const selectedArray = Array.from(selectedPriceLists);
      
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#02979B]">
              Listas de Precios <span className="text-red-500">*</span>
              <span className="ml-2 text-xs font-normal text-[#02979B]/60">
                (El primer ID seleccionado va en /pricelist/)
              </span>
            </label>
            <button
              type="button"
              onClick={toggleSelectAllPriceLists}
              className="text-xs text-[#02979B] hover:text-[#02979B]/80 font-medium"
            >
              {selectedPriceLists.size === priceLists.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto border border-[#D9D9D9] rounded-xl p-3">
            {priceLists.map((pl, index) => {
              const plId = String(pl.id);
              const isSelected = selectedPriceLists.has(plId);
              const isFirst = isSelected && selectedArray[0] === plId;
              
              return (
                <label
                  key={pl.id}
                  className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition ${
                    isSelected ? 'bg-[#02979B]/10' : 'hover:bg-[#02979B]/5'
                  } ${isFirst ? 'border-l-4 border-[#02979B]' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePriceList(plId)}
                    className="mt-0.5 h-4 w-4 accent-[#02979B]"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#02979B]">
                      {pl.name}
                      {pl.flagDefault === 1 || pl.flagDefault === true && (
                        <span className="ml-2 text-xs bg-[#02979B]/20 text-[#02979B] px-2 py-0.5 rounded-full">
                          Por defecto
                        </span>
                      )}
                      {isFirst && (
                        <span className="ml-2 text-xs bg-[#02979B] text-white px-2 py-0.5 rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#02979B]/60">
                      ID: {pl.id}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          
          {selectedPriceLists.size === 0 && (
            <p className="text-xs text-red-500">Seleccione al menos una lista de precios</p>
          )}
          
          {selectedPriceLists.size > 0 && (
            <div className="text-xs text-[#02979B]">
              Orden de selección: {selectedArray.join(' → ')}
            </div>
          )}
        </div>
      );
    }

    // MODO NORMAL: Select simple
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#02979B]">
          Lista de Precios <span className="text-red-500">*</span>
        </label>
        <select
          value={priceListId}
          onChange={(e) => setPriceListId(e.target.value)}
          className="w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
        >
          <option value="">Seleccione una lista de precios</option>
          {priceLists.map((pl) => (
            <option key={pl.id} value={String(pl.id)}>
              {pl.name} {pl.flagDefault === 1 || pl.flagDefault === true ? '(Por defecto)' : ''}
            </option>
          ))}
        </select>
        
        {priceListId && (
          <div className="mt-1 text-xs text-[#02979B]/60">
            Seleccionado: {priceLists.find(pl => String(pl.id) === priceListId)?.name}
          </div>
        )}
      </div>
    );
  };

  // Verificar si hay algún bloque con Excel de errores disponible
  const hasErrorExcel = useMemo(() => {
    if (!result || !result.blocks) return false;
    return result.blocks.some(block => block.errorExcelPath);
  }, [result]);

  return (
    <div className="w-full">
      <form className="space-y-6">
        {/* Selector de Lista de Precios - Ahora como primera sección */}
        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
          <div className="text-sm font-semibold text-[#02979B] mb-4">
            Configuración de envío
            {cargaMode === "CONVERSION" && (
              <span className="ml-2 text-xs bg-[#02979B] text-white px-2 py-1 rounded-full">
                Modo Conversión
              </span>
            )}
          </div>
          <PriceListSelector />
          
          {/* Vista previa del endpoint (oculta visualmente) */}
          {endpointPreview && (
            <div className="hidden">
              {endpointPreview}
            </div>
          )}
        </div>

        {/* File */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#02979B]">Archivo Excel</label>

          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D9D9] bg-white p-8 text-center transition hover:border-[#02979B] hover:bg-[#02979B]/5">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFileProductos(e.target.files?.[0] ?? null)}
            />

            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D9D9D9] text-[#02979B] transition group-hover:bg-[#02979B] group-hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 16V4m0 0 4 4M12 4 8 8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="mt-3 text-sm font-semibold text-[#02979B]">
              {fileProductos ? fileProductos.name : "Seleccionar archivo .xlsx / .xls"}
            </div>
            <div className="mt-1 text-xs text-[#02979B]/60">
              Se enviará en bloques de 400 productos
            </div>
          </label>
        </div>

        {/* Barra de progreso */}
        {loading && totalBlocks > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">
                Progreso: {progress}%
              </span>
              <span className="text-sm font-medium text-blue-800">
                Bloque {currentBlock} de {totalBlocks}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {blockResults.length > 0 && (
              <div className="mt-3 text-xs text-blue-700">
                <p>✅ Bloques exitosos: {blockResults.filter(b => b.success).length}</p>
                <p>❌ Bloques con error: {blockResults.filter(b => !b.success).length}</p>
                <p>📦 Productos subidos: {blockResults.reduce((acc, b) => acc + (b.successful || 0), 0)}</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-red-700">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-800">Mensaje</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <button
              type="button"
              onClick={sendInBlocks}
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

      {/* Respuesta del servidor */}
      <div className="mt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#02979B]">Respuesta del servidor</h2>
            <p className="mt-1 text-sm text-[#02979B]/60">
              Resultado del envío por bloques
            </p>
          </div>

          <div className="flex gap-2">
            {/* Botón para descargar Excel de errores */}
            {hasErrorExcel && (
              <button
                onClick={() => {
                  const firstBlockWithError = result.blocks.find(block => block.errorExcelPath);
                  if (firstBlockWithError) {
                    downloadErrorExcel(firstBlockWithError.errorExcelPath);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4M12 12v8m-4-4l4 4 4-4M12 2v10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Descargar Excel de errores
              </button>
            )}
            
            {result && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                  toast.success("Respuesta copiada");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#02979B]/10 px-4 py-2 text-sm font-medium text-[#02979B] hover:bg-[#02979B]/20"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1M8 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M8 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Copiar respuesta
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          {result ? (
            <div className="rounded-2xl border border-[#D9D9D9] bg-white">
              <pre className="max-h-[560px] overflow-auto rounded-2xl bg-[#02979B]/5 p-4 text-xs text-[#02979B]">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Mostrar bloques con errores disponibles */}
        {result && result.blocks && result.blocks.some(b => b.errorExcelPath) && (
          <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <h3 className="text-sm font-semibold text-orange-800 mb-2">📊 Bloques con errores:</h3>
            <div className="space-y-2">
              {result.blocks.map((block, idx) => (
                block.errorExcelPath && (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg">
                    <div className="text-xs text-orange-700">
                      Bloque {block.block}: {block.products - block.successful} errores de {block.products} productos
                    </div>
                    <button
                      onClick={() => downloadErrorExcel(block.errorExcelPath)}
                      className="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600"
                    >
                      Descargar errores
                    </button>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componentes auxiliares
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D9D9] bg-[#02979B]/5 p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#02979B] shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" strokeLinejoin="round" />
          <path d="M15 3v5h5" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="mt-3 text-sm font-semibold text-[#02979B]">Sin resultados todavía</div>
      <div className="mt-1 text-sm text-[#02979B]/60">
        Cuando envíes el Excel, aquí se mostrará la respuesta.
      </div>
    </div>
  );
}