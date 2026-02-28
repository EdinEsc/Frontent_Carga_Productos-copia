// // src/ExcelSender.jsx
// import { useMemo, useState, useCallback, useEffect } from "react";
// import { toast } from "sonner";
// import * as XLSX from 'xlsx';

// export default function ExcelSender({ employeeData, warehouses = [] }) {
//   const NODES = useMemo(
//     () => [
//       { key: "n1", label: "Nodo 1", base: "https://n1.japiexcel.casamarketapp.com" },
//       { key: "n23", label: "Nodo 2 / 3", base: "https://n3.japiexcel.casamarketapp.com" },
//       { key: "n4", label: "Nodo 4", base: "https://n4.japiexcel.casamarketapp.com" },
//       { key: "n5", label: "Nodo 5", base: "https://n5.japiexcel.casamarketapp.com" },
//     ],
//     []
//   );

//   // ===== DETECTAR SI VIENE DEL FLUJO DE LIMPIEZA =====
//   const [cameFromNormalizer, setCameFromNormalizer] = useState(false);
  
//   // ===== SELECTOR DE MODO (solo útil si NO viene del normalizer) =====
//   const [cargaMode, setCargaMode] = useState("NORMAL");
  
//   // Detectar modo del archivo pendiente
//   useEffect(() => {
//     const pendingName = sessionStorage.getItem('pendingExcelName');
//     if (pendingName) {
//       if (pendingName.includes('CONVERSION')) {
//         setCargaMode("CONVERSION");
//       }
//       // Si hay archivo pendiente, significa que vino del normalizer
//       setCameFromNormalizer(true);
//     }
//   }, []);

//   // ===== Estado para múltiples price lists =====
//   const [selectedPriceLists, setSelectedPriceLists] = useState(new Set());
  
//   // ===== Función para toggle de price lists =====
//   const togglePriceList = (priceListId) => {
//     setSelectedPriceLists(prev => {
//       const next = new Set(prev);
//       if (next.has(priceListId)) {
//         next.delete(priceListId);
//       } else {
//         next.add(priceListId);
//       }
//       return next;
//     });
//   };

//   // ===== Seleccionar/deseleccionar todas =====
//   const toggleSelectAllPriceLists = () => {
//     if (selectedPriceLists.size === priceLists.length) {
//       setSelectedPriceLists(new Set());
//     } else {
//       setSelectedPriceLists(new Set(priceLists.map(pl => String(pl.id))));
//     }
//   };

//   // ===== PROGRESO =====
//   const [progress, setProgress] = useState(0);
//   const [currentBlock, setCurrentBlock] = useState(0);
//   const [totalBlocks, setTotalBlocks] = useState(0);
//   const [blockResults, setBlockResults] = useState([]);

//   // ===== Obtener nodo de la URL =====
//   const getNodeFromUrl = () => {
//     const params = new URLSearchParams(window.location.search);
//     const nodeParam = params.get("node");
    
//     if (!nodeParam) return "n1";
    
//     const nodeMap = {
//       "1": "n1",
//       "2": "n23",
//       "3": "n23",
//       "4": "n4",
//       "5": "n5"
//     };
    
//     return nodeMap[nodeParam] || "n1";
//   };

//   const [nodeKey] = useState(getNodeFromUrl());
  
//   // ===== IDs AUTOMÁTICOS desde employeeData =====
//   const [companyId, setCompanyId] = useState("");
//   const [subsidiaryId, setSubsidiaryId] = useState("");
//   const [priceListId, setPriceListId] = useState(""); // Para modo NORMAL

//   // ===== Estado para almacén seleccionado (solo útil si NO viene del normalizer) =====
//   const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
//   const [selectedWarehouseName, setSelectedWarehouseName] = useState("");

//   // ===== Estado para listas de precios =====
//   const [priceLists, setPriceLists] = useState([]);
//   const [loadingPriceLists, setLoadingPriceLists] = useState(false);
//   const [priceListsError, setPriceListsError] = useState("");

//   // ===== idWarehouse (viene del normalizer o se selecciona manualmente) =====
//   const [idWarehouse, setIdWarehouse] = useState("");
//   const [idCountry, setIdCountry] = useState("1");
  
//   // ===== IGV - SOLO un switch simple =====
//   const [aplicarIgv, setAplicarIgv] = useState(true); // true = aplicar IGV (01), false = no aplicar (02)
  
//   // taxCodeCountry se calcula según la selección
//   const taxCodeCountry = useMemo(() => {
//     // Si vino del normalizer, tomamos lo que tenga sessionStorage
//     if (cameFromNormalizer) {
//       const savedApplyIgvCost = sessionStorage.getItem('applyIgvCost');
//       const savedApplyIgvSale = sessionStorage.getItem('applyIgvSale');
//       const aplica = savedApplyIgvCost === 'true' || savedApplyIgvSale === 'true';
//       return aplica ? "01" : "02";
//     }
//     // Si no vino del normalizer, usamos la selección del switch
//     return aplicarIgv ? "01" : "02";
//   }, [cameFromNormalizer, aplicarIgv]);

//   const [flagUseSimpleBrand, setFlagUseSimpleBrand] = useState(true);

//   const [fileProductos, setFileProductos] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const [error, setError] = useState("");
//   const [errorDetails, setErrorDetails] = useState(null);
//   const [result, setResult] = useState(null);

//   // ===== MOSTRAR EN CONSOLA LOS IDs CADA VEZ QUE CAMBIAN =====
//   useEffect(() => {
//     if (companyId || subsidiaryId || selectedWarehouseId || idWarehouse || priceListId || selectedPriceLists.size > 0) {
//       console.log('%c📋 VERIFICACIÓN DE IDs', 'font-size: 14px; font-weight: bold; color: #02979B;');
//       console.log('%c🔵 ID Compañía:', 'font-weight: bold; color: #0066cc;', companyId || 'No definido');
//       console.log('%c🟢 ID Tienda (subsidiary):', 'font-weight: bold; color: #00cc66;', subsidiaryId || 'No definido');
//       console.log('%c🟡 ID Almacén:', 'font-weight: bold; color: #cc9900;', selectedWarehouseId || idWarehouse || 'No definido');
      
//       // Mostrar lista(s) de precios
//       if (cargaMode === "CONVERSION") {
//         const selectedArray = Array.from(selectedPriceLists);
//         if (selectedArray.length > 0) {
//           console.log('%c📊 Listas de Precios (Modo Conversión):', 'font-weight: bold; color: #9933cc;');
//           selectedArray.forEach((id, index) => {
//             const priceList = priceLists.find(pl => String(pl.id) === String(id));
//             const role = index === 0 ? '🔹 Principal' : '🔸 Secundaria';
//             console.log(`  ${role} - ID: ${id} ${priceList ? `(${priceList.name})` : ''}`);
//           });
//         } else {
//           console.log('%c📊 Listas de Precios:', 'font-weight: bold; color: #9933cc;', 'No definido');
//         }
//       } else {
//         if (priceListId) {
//           const priceList = priceLists.find(pl => String(pl.id) === String(priceListId));
//           console.log('%c📊 Lista de Precios (Modo Normal):', 'font-weight: bold; color: #9933cc;', 
//             `ID: ${priceListId} ${priceList ? `(${priceList.name})` : ''}`);
//         } else {
//           console.log('%c📊 Lista de Precios:', 'font-weight: bold; color: #9933cc;', 'No definido');
//         }
//       }
      
//       console.log('%c📎 Origen:', 'font-weight: bold; color: #666666;', cameFromNormalizer ? 'Vino del Normalizer' : 'Selección manual');
//       if (cameFromNormalizer) {
//         const warehouseName = warehouses.find(w => String(w.id) === String(selectedWarehouseId))?.name;
//         if (warehouseName) {
//           console.log('%c🏢 Almacén:', 'font-weight: bold; color: #666666;', warehouseName);
//         }
//       }
//       console.log('%c------------------------', 'color: #02979B;');
//     }
//   }, [companyId, subsidiaryId, selectedWarehouseId, idWarehouse, cameFromNormalizer, warehouses, priceListId, selectedPriceLists, cargaMode, priceLists]);

//   // ===== CARGAR DATOS DEL EMPLEADO =====
//   useEffect(() => {
//     if (employeeData) {
//       if (employeeData.companyId) {
//         setCompanyId(String(employeeData.companyId));
//       }
      
//       if (employeeData.comSubsidiariesId) {
//         setSubsidiaryId(String(employeeData.comSubsidiariesId));
//       } else if (employeeData.subsidiary?.id) {
//         setSubsidiaryId(String(employeeData.subsidiary.id));
//       }
      
//       if (employeeData.warWarehousesId) {
//         setIdWarehouse(String(employeeData.warWarehousesId));
//         setSelectedWarehouseId(String(employeeData.warWarehousesId));
//       }
//     }
//   }, [employeeData]);

//   // ===== CARGAR ESTADO DESDE NORMALIZER (si vino de ahí) =====
//   useEffect(() => {
//     // SOLO cargar el warehouse de sessionStorage si vino del normalizer
//     const selectedWarehouseId = sessionStorage.getItem('selectedWarehouseId');
//     if (selectedWarehouseId && cameFromNormalizer) {
//       setIdWarehouse(selectedWarehouseId);
//       setSelectedWarehouseId(selectedWarehouseId);
      
//       // Buscar el nombre del almacén
//       const warehouse = warehouses.find(w => String(w.id) === String(selectedWarehouseId));
//       if (warehouse) {
//         setSelectedWarehouseName(warehouse.name);
//       }
//     }
//   }, [cameFromNormalizer, warehouses]);

//   // ===== CARGAR LISTAS DE PRECIOS =====
//   useEffect(() => {
//     const loadPriceLists = async () => {
//       setLoadingPriceLists(true);
      
//       try {
//         const savedPriceLists = sessionStorage.getItem('priceLists');
        
//         if (savedPriceLists) {
//           const data = JSON.parse(savedPriceLists);
//           setPriceLists(data);

//           // Para modo NORMAL: seleccionar una por defecto
//           if (cargaMode === "NORMAL") {
//             if (data.length === 1) {
//               setPriceListId(String(data[0].id));
//             } else if (data.length > 1) {
//               const defaultList = data.find(pl => pl.flagDefault === 1 || pl.flagDefault === true);
//               if (defaultList) {
//                 setPriceListId(String(defaultList.id));
//               }
//             }
//           }
          
//           // Para modo CONVERSIÓN: seleccionar todas por defecto
//           if (cargaMode === "CONVERSION") {
//             setSelectedPriceLists(new Set(data.map(pl => String(pl.id))));
//           }
//         } else {
//           setPriceListsError("No hay listas de precios disponibles");
//         }
//       } catch (error) {
//         console.error("Error cargando listas de precios:", error);
//         setPriceListsError("Error al cargar listas de precios");
//       } finally {
//         setLoadingPriceLists(false);
//       }
//     };

//     if (priceLists.length === 0) {
//       loadPriceLists();
//     }
//   }, [cargaMode]);

//   const getNodeLabel = () => {
//     const node = NODES.find(n => n.key === nodeKey);
//     return node ? node.label : "Nodo no encontrado";
//   };

//   const getNodeBase = () => {
//     const node = NODES.find(n => n.key === nodeKey);
//     return node ? node.base : NODES[0].base;
//   };

//   const baseUrl = useMemo(() => {
//     return getNodeBase();
//   }, [nodeKey]);

//   // ===== FUNCIÓN SIMPLE: El orden de selección determina la URL =====
//   const buildEndpoint = useCallback(() => {
//     const base = `${baseUrl}/api/excel/readexcel/${encodeURIComponent(companyId)}`;
    
//     if (cargaMode === "CONVERSION") {
//       const selectedIds = Array.from(selectedPriceLists);
//       if (selectedIds.length === 0) return "";
      
//       const [primaryId, ...additionalIds] = selectedIds;
//       const additionalPath = additionalIds.map(id => encodeURIComponent(id)).join('/');
      
//       if (additionalPath) {
//         return `${base}/pricelist/${encodeURIComponent(primaryId)}/subsidiary/${encodeURIComponent(subsidiaryId)}/${additionalPath}`;
//       } else {
//         return `${base}/pricelist/${encodeURIComponent(primaryId)}/subsidiary/${encodeURIComponent(subsidiaryId)}`;
//       }
//     } else {
//       return `${base}/pricelist/${encodeURIComponent(priceListId)}/subsidiary/${encodeURIComponent(subsidiaryId)}`;
//     }
//   }, [baseUrl, companyId, priceListId, subsidiaryId, selectedPriceLists, cargaMode]);

//   // ===== VALIDACIÓN según el modo =====
//   const canSend = useMemo(() => {
//     if (!fileProductos || !companyId || !subsidiaryId || loading) return false;
    
//     // Si NO vino del normalizer, necesita seleccionar almacén
//     if (!cameFromNormalizer && !selectedWarehouseId) return false;
    
//     if (cargaMode === "CONVERSION") {
//       return selectedPriceLists.size > 0;
//     } else {
//       return !!priceListId;
//     }
//   }, [fileProductos, companyId, subsidiaryId, loading, cargaMode, selectedPriceLists.size, priceListId, cameFromNormalizer, selectedWarehouseId]);

//   const endpointPreview = canSend ? buildEndpoint() : "";

//   // ===== CARGAR ARCHIVO PENDIENTE =====
//   useEffect(() => {
//     let isMounted = true;
//     let toastShown = false;
    
//     const loadPendingFile = async () => {
//       const pendingExcel = sessionStorage.getItem('pendingExcel');
//       const pendingName = sessionStorage.getItem('pendingExcelName');

//       if (pendingExcel && pendingName && isMounted && !toastShown) {
//         try {
//           const res = await fetch(pendingExcel);
//           const blob = await res.blob();
          
//           if (!isMounted) return;
          
//           const file = new File([blob], pendingName, { 
//             type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
//           });
          
//           setFileProductos(file);
          
//           sessionStorage.removeItem('pendingExcel');
//           sessionStorage.removeItem('pendingExcelName');
          
//           toastShown = true;
          
//           toast.success(`Archivo "${pendingName}" listo para enviar`);
          
//         } catch (err) {
//           console.error("Error cargando archivo pendiente:", err);
//         }
//       }
//     };

//     loadPendingFile();
    
//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   // ===== MANEJAR CAMBIO DE ALMACÉN (solo si NO viene del normalizer) =====
//   const handleWarehouseChange = (e) => {
//     const warehouseId = e.target.value;
//     setSelectedWarehouseId(warehouseId);
//     setIdWarehouse(warehouseId);

//     const warehouse = warehouses.find((w) => String(w.id) === String(warehouseId));
//     const warehouseName = (warehouse?.name || "").trim();
//     setSelectedWarehouseName(warehouseName);
//   };

//   // ===== FUNCIÓN PARA DESCARGAR EXCEL DE ERRORES =====
//   const downloadErrorExcel = useCallback(async (errorPath) => {
//     try {
//       if (!errorPath) {
//         toast.error("No hay ruta de descarga disponible");
//         return;
//       }

//       const downloadUrl = `${baseUrl}/api/download/${errorPath.split('/download/')[1]}`;
      
//       toast.info("Descargando Excel de errores...");
      
//       const res = await fetch(downloadUrl, {
//         headers: {
//           "Authorization": `Bearer ${new URLSearchParams(window.location.search).get("token")}`
//         }
//       });
      
//       if (!res.ok) {
//         throw new Error(`Error al descargar: ${res.status}`);
//       }
      
//       const blob = await res.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `errores_${new Date().toISOString().split('T')[0]}.xlsx`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
      
//       toast.success("Excel de errores descargado");
//     } catch (err) {
//       console.error("Error descargando Excel:", err);
//       toast.error("Error al descargar Excel de errores");
//     }
//   }, [baseUrl]);

//   // ===== FUNCIÓN PARA ENVIAR EN BLOQUES DE 400 =====
//   const sendInBlocks = async () => {
//     setError("");
//     setErrorDetails(null);
//     setResult(null);
//     setBlockResults([]);
//     setProgress(0);
//     setLoading(true);

//     // ===== MOSTRAR VERIFICACIÓN FINAL ANTES DE ENVIAR =====
//     console.log('%c🚀 INICIANDO ENVÍO - VERIFICACIÓN FINAL', 'font-size: 16px; font-weight: bold; color: #ff6600;');
//     console.log('%c🔵 Compañía ID:', 'font-weight: bold; color: #0066cc;', companyId);
//     console.log('%c🟢 Tienda ID (subsidiary):', 'font-weight: bold; color: #00cc66;', subsidiaryId);
//     console.log('%c🟡 Almacén ID:', 'font-weight: bold; color: #cc9900;', selectedWarehouseId || idWarehouse);
    
//     // Mostrar lista(s) de precios en verificación final
//     if (cargaMode === "CONVERSION") {
//       const selectedArray = Array.from(selectedPriceLists);
//       console.log('%c📊 Listas de Precios (Modo Conversión):', 'font-weight: bold; color: #9933cc;');
//       selectedArray.forEach((id, index) => {
//         const priceList = priceLists.find(pl => String(pl.id) === String(id));
//         const role = index === 0 ? '🔹 Principal (va en /pricelist/)' : '🔸 Secundaria';
//         console.log(`  ${role} - ID: ${id} ${priceList ? `(${priceList.name})` : ''}`);
//       });
//     } else {
//       const priceList = priceLists.find(pl => String(pl.id) === String(priceListId));
//       console.log('%c📊 Lista de Precios (Modo Normal):', 'font-weight: bold; color: #9933cc;', 
//         `ID: ${priceListId} ${priceList ? `(${priceList.name})` : ''}`);
//     }
    
//     if (selectedWarehouseName) {
//       console.log('%c🏢 Almacén:', 'font-weight: bold; color: #666666;', selectedWarehouseName);
//     }
//     console.log('%c📦 Modo:', 'font-weight: bold; color: #666666;', cargaMode);
//     console.log('%c💰 IGV:', 'font-weight: bold; color: #666666;', taxCodeCountry === "01" ? "Aplica IGV (18%)" : "Sin IGV");
//     console.log('%c📎 Origen:', 'font-weight: bold; color: #666666;', cameFromNormalizer ? 'Vino del Normalizer' : 'Selección manual');
//     console.log('%c📁 Archivo:', 'font-weight: bold; color: #666666;', fileProductos?.name || 'No seleccionado');
//     console.log('%c------------------------', 'color: #ff6600;');

//     try {
//       // Validaciones
//       if (cargaMode === "CONVERSION" && selectedPriceLists.size === 0) {
//         throw new Error("Debe seleccionar al menos una lista de precios");
//       }
      
//       if (cargaMode === "NORMAL" && !priceListId) {
//         throw new Error("Debe seleccionar una lista de precios");
//       }

//       // Validar almacén si NO vino del normalizer
//       if (!cameFromNormalizer && !selectedWarehouseId) {
//         throw new Error("Debe seleccionar un almacén");
//       }

//       const data = await fileProductos.arrayBuffer();
//       const workbook = XLSX.read(data, { type: 'array' });
      
//       if (!workbook.SheetNames.includes('productos')) {
//         throw new Error("El Excel no tiene una hoja llamada 'productos'");
//       }
      
//       const sheet = workbook.Sheets['productos'];
//       const jsonData = XLSX.utils.sheet_to_json(sheet);
      
//       const totalRows = jsonData.length;
//       const BLOCK_SIZE = 400;
//       const totalBlocks = Math.ceil(totalRows / BLOCK_SIZE);
      
//       setTotalBlocks(totalBlocks);
      
//       console.log(`💰 Código IGV a enviar: ${taxCodeCountry} (${taxCodeCountry === "01" ? "Aplica IGV" : "No aplica IGV"})`);
      
//       toast.info(`Procesando ${totalRows} productos en ${totalBlocks} bloques de 400...`);
      
//       let allResults = [];
//       let successCount = 0;
//       let errorCount = 0;
      
//       for (let blockNum = 0; blockNum < totalBlocks; blockNum++) {
//         const start = blockNum * BLOCK_SIZE;
//         const end = Math.min(start + BLOCK_SIZE, totalRows);
//         const blockData = jsonData.slice(start, end);
        
//         setCurrentBlock(blockNum + 1);
//         const progressPercent = Math.round(((blockNum) / totalBlocks) * 100);
//         setProgress(progressPercent);
        
//         toast.info(`Enviando bloque ${blockNum + 1} de ${totalBlocks} (${blockData.length} productos)...`);
        
//         const blockSheet = XLSX.utils.json_to_sheet(blockData);
//         const blockWorkbook = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(blockWorkbook, blockSheet, 'productos');
//         const blockExcel = XLSX.write(blockWorkbook, { bookType: 'xlsx', type: 'array' });
//         const blockFile = new File([blockExcel], `bloque_${blockNum + 1}.xlsx`, { 
//           type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
//         });
        
//         const form = new FormData();
//         form.append("file_excel", blockFile);
//         form.append("idCountry", idCountry);
//         form.append("taxCodeCountry", taxCodeCountry);
//         form.append("flagUseSimpleBrand", String(flagUseSimpleBrand));
        
//         // Usar el warehouse que corresponda (ya sea del normalizer o seleccionado)
//         const warehouseToUse = selectedWarehouseId || idWarehouse;
//         if (warehouseToUse) form.append("idWarehouse", warehouseToUse);
        
//         const endpoint = buildEndpoint();
//         const token = new URLSearchParams(window.location.search).get("token");
        
//         const res = await fetch(endpoint, { 
//           method: "POST", 
//           body: form,
//           headers: {
//             "Authorization": `Bearer ${token}`
//           }
//         });
        
//         const text = await res.text();
        
//         let blockResult;
//         try {
//           blockResult = JSON.parse(text);
//         } catch {
//           blockResult = { message: text };
//         }
        
//         const blockSuccess = blockResult?.data?.n_products || 0;
//         successCount += blockSuccess;
        
//         const blockInfo = {
//           block: blockNum + 1,
//           success: res.ok,
//           status: res.status,
//           data: blockResult,
//           products: blockData.length,
//           successful: blockSuccess,
//           errorExcelPath: blockResult?.data?.name_excel
//         };
        
//         allResults.push(blockInfo);
//         setBlockResults([...allResults]);
        
//         if (!res.ok) {
//           errorCount++;
//           console.error(`❌ Bloque ${blockNum + 1} falló:`, blockResult);
//         } else {
//           console.log(`✅ Bloque ${blockNum + 1} completado: ${blockSuccess} productos`);
//         }
        
//         await new Promise(resolve => setTimeout(resolve, 500));
//       }
      
//       setProgress(100);
//       setResult({
//         mode: cargaMode,
//         total_blocks: totalBlocks,
//         total_products: totalRows,
//         successful_products: successCount,
//         failed_blocks: errorCount,
//         blocks: allResults
//       });
      
//       if (successCount === totalRows) {
//         toast.success(`✅ Todos los ${totalRows} productos subidos correctamente`);
//       } else {
//         toast.warning(`⚠️ Se subieron ${successCount} de ${totalRows} productos (${errorCount} bloques con errores)`);
//       }
      
//     } catch (err) {
//       console.error("Error:", err);
//       setError(err.message);
//       toast.error("Error en el envío por bloques");
//     } finally {
//       setLoading(false);
//     }
//   };

 
// // ===== COMPONENTE SELECTOR DE IGV SIMPLE (SOLO si NO vino del normalizer) =====
// const IgvSelector = () => {
//   // Si vino del normalizer, NO mostrar nada
//   if (cameFromNormalizer) {
//     return null;
//   }

//   return (
//     <div className="flex-1 rounded-2xl border border-[#D9D9D9] bg-white p-4">
//       <div className="flex items-center justify-between">
//         <div>
//         <span className="text-sm font-semibold text-[#02979B]">
//           Aplicar IGV
//         </span>
//         <p className="text-xs text-[#02979B]/60 mt-0.5">
//           {aplicarIgv ? "Con IGV (18%)" : "Sin IGV"}
//         </p>
//       </div>
        
//         <button
//           type="button"
//           onClick={() => setAplicarIgv(!aplicarIgv)}
//           className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
//             aplicarIgv ? 'bg-[#02979B]' : 'bg-[#E5E7EB]'
//           }`}
//         >
//           <span
//             className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
//               aplicarIgv ? 'left-8' : 'left-1'
//             }`}
//           />
//         </button>
//       </div>
//     </div>
//   );
// };

// // ===== COMPONENTE SELECTOR DE MODO (SOLO si NO vino del normalizer) =====
// const ModeSelector = () => {
//   // Si vino del normalizer, NO mostrar nada
//   if (cameFromNormalizer) {
//     return null;
//   }

//   return (
//     <div className="flex-1 rounded-2xl border border-[#D9D9D9] bg-white p-4">
//       <div className="flex items-center justify-between">
//         <div>
//           <span className="text-sm font-semibold text-[#02979B]">
//             Modo de carga
//           </span>
//           <p className="text-xs text-[#02979B]/60 mt-0.5">
//             {cargaMode === "NORMAL" ? "Modo Normal" : "Modo Conversión"}
//           </p>
//         </div>
        
//         <button
//           type="button"
//           onClick={() =>
//             setCargaMode(cargaMode === "NORMAL" ? "CONVERSION" : "NORMAL")
//           }
//           className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
//             cargaMode === "NORMAL" ? "bg-[#02979B]" : "bg-[#E5E7EB]"
//           }`}
//         >
//           <span
//             className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
//               cargaMode === "CONVERSION" ? "left-8" : "left-1"
//             }`}
//           />
//         </button>
//       </div>
//     </div>
//   );
// };



//   // ===== COMPONENTE SELECTOR DE ALMACÉN (SOLO si NO vino del normalizer) =====
//   const WarehouseSelector = () => {
//     // Si vino del normalizer, NO mostrar nada
//     if (cameFromNormalizer) {
//       return null;
//     }

//     return (
//       <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
//         <div className="text-sm font-semibold text-[#02979B] mb-4">
//           Configuración de almacén
//         </div>
        
//         <div className="space-y-1.5">
//           <label className="text-sm font-medium text-[#02979B]">
//             Seleccionar Almacén <span className="text-red-500">*</span>
//           </label>
          
//           {warehouses.length === 0 ? (
//             <div className="rounded-xl border border-[#D9D9D9] bg-gray-50 px-3 py-2 text-sm text-gray-500">
//               Cargando almacenes...
//             </div>
//           ) : warehouses.length === 1 ? (
//             <input
//               type="text"
//               value={warehouses[0].name}
//               readOnly
//               className="w-full rounded-xl border border-[#D9D9D9] bg-gray-100 px-3 py-2 text-sm text-[#02979B]"
//             />
//           ) : (
//             <select
//               value={selectedWarehouseId}
//               onChange={handleWarehouseChange}
//               required
//               className="w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
//             >
//               <option value="">Seleccione un almacén</option>
//               {warehouses.map((w) => (
//                 <option key={w.id} value={String(w.id)}>
//                   {w.name}
//                 </option>
//               ))}
//             </select>
//           )}

//           {warehouses.length > 1 && !selectedWarehouseId && (
//             <p className="mt-1 text-xs text-red-500">Debe seleccionar un almacén para continuar</p>
//           )}
//         </div>
//       </div>
//     );
//   };

//   // ===== COMPONENTE PRICE LIST SELECTOR (siempre visible) =====
//   const PriceListSelector = () => {
//     if (loadingPriceLists) {
//       return (
//         <div className="flex items-center gap-2 w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//           <Spinner />
//           <span>Cargando listas de precios...</span>
//         </div>
//       );
//     }

//     if (priceListsError) {
//       return (
//         <div className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
//           {priceListsError}
//         </div>
//       );
//     }

//     if (priceLists.length === 0) {
//       return (
//         <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//           No hay listas de precios disponibles
//         </div>
//       );
//     }

//     if (cargaMode === "CONVERSION") {
//       const selectedArray = Array.from(selectedPriceLists);
      
//       return (
//         <div className="space-y-3">
//           <div className="flex items-center justify-between">
//             <label className="text-sm font-medium text-[#02979B]">
//               Listas de Precios <span className="text-red-500">*</span>
//               <span className="ml-2 text-xs font-normal text-[#02979B]/60">
//                 (El primer ID seleccionado va en /pricelist/)
//               </span>
//             </label>
//             <button
//               type="button"
//               onClick={toggleSelectAllPriceLists}
//               className="text-xs text-[#02979B] hover:text-[#02979B]/80 font-medium"
//             >
//               {selectedPriceLists.size === priceLists.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
//             </button>
//           </div>
          
//           <div className="space-y-2 max-h-60 overflow-y-auto border border-[#D9D9D9] rounded-xl p-3">
//             {priceLists.map((pl) => {
//               const plId = String(pl.id);
//               const isSelected = selectedPriceLists.has(plId);
//               const isFirst = isSelected && selectedArray[0] === plId;
              
//               return (
//                 <label
//                   key={pl.id}
//                   className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition ${
//                     isSelected ? 'bg-[#02979B]/10' : 'hover:bg-[#02979B]/5'
//                   } ${isFirst ? 'border-l-4 border-[#02979B]' : ''}`}
//                 >
//                   <input
//                     type="checkbox"
//                     checked={isSelected}
//                     onChange={() => togglePriceList(plId)}
//                     className="mt-0.5 h-4 w-4 accent-[#02979B]"
//                   />
//                   <div className="flex-1">
//                     <div className="text-sm font-medium text-[#02979B]">
//                       {pl.name}
//                       {(pl.flagDefault === 1 || pl.flagDefault === true) && (
//                         <span className="ml-2 text-xs bg-[#02979B]/20 text-[#02979B] px-2 py-0.5 rounded-full">
//                           Por defecto
//                         </span>
//                       )}
//                       {isFirst && (
//                         <span className="ml-2 text-xs bg-[#02979B] text-white px-2 py-0.5 rounded-full">
//                           Principal
//                         </span>
//                       )}
//                     </div>
//                     <div className="text-xs text-[#02979B]/60">
//                       ID: {pl.id}
//                     </div>
//                   </div>
//                 </label>
//               );
//             })}
//           </div>
          
//           {selectedPriceLists.size === 0 && (
//             <p className="text-xs text-red-500">Seleccione al menos una lista de precios</p>
//           )}
//         </div>
//       );
//     }

//     // MODO NORMAL
//     return (
//       <div className="space-y-1.5">
//         <label className="text-sm font-medium text-[#02979B]">
//           Lista de Precios <span className="text-red-500">*</span>
//         </label>
//         <select
//           value={priceListId}
//           onChange={(e) => setPriceListId(e.target.value)}
//           className="w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
//         >
//           <option value="">Seleccione una lista de precios</option>
//           {priceLists.map((pl) => (
//             <option key={pl.id} value={String(pl.id)}>
//               {pl.name} {(pl.flagDefault === 1 || pl.flagDefault === true) ? '(Por defecto)' : ''}
//             </option>
//           ))}
//         </select>
//       </div>
//     );
//   };

//   // Verificar si hay algún bloque con Excel de errores disponible
//   const hasErrorExcel = useMemo(() => {
//     if (!result || !result.blocks) return false;
//     return result.blocks.some(block => block.errorExcelPath);
//   }, [result]);

//   // Verificar si todos los productos se subieron correctamente
//   const allProductsSuccess = useMemo(() => {
//     if (!result) return false;
//     return result.successful_products === result.total_products;
//   }, [result]);

//   return (
//     <div className="w-full">
//       <form className="space-y-6">
//         {/* Estos componentes solo se renderizan si NO viene del normalizer */}
//          {!cameFromNormalizer && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <ModeSelector />
//               <IgvSelector />
//             </div>
//           )}

//           <WarehouseSelector />


//         {/* Selector de Lista de Precios - SIEMPRE visible */}
//         <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
//           <div className="text-sm font-semibold text-[#02979B] mb-4">
//             Configuración de envío
//             {cargaMode === "CONVERSION" && !cameFromNormalizer && (
//               <span className="ml-2 text-xs bg-[#02979B] text-white px-2 py-1 rounded-full">
//                 Modo Conversión
//               </span>
//             )}
//           </div>
//           <PriceListSelector />
          
//           {/* Vista previa del endpoint (oculta visualmente) */}
//           {endpointPreview && (
//             <div className="hidden">
//               {endpointPreview}
//             </div>
//           )}
//         </div>

//         {/* File */}
//         <div className="space-y-2">
//           <label className="text-sm font-medium text-[#02979B]">Archivo Excel</label>

//           <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D9D9] bg-white p-8 text-center transition hover:border-[#02979B] hover:bg-[#02979B]/5">
//             <input
//               type="file"
//               accept=".xlsx,.xls"
//               className="hidden"
//               onChange={(e) => setFileProductos(e.target.files?.[0] ?? null)}
//             />

//             <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D9D9D9] text-[#02979B] transition group-hover:bg-[#02979B] group-hover:text-white">
//               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M12 16V4m0 0 4 4M12 4 8 8" strokeLinecap="round" strokeLinejoin="round" />
//                 <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
//               </svg>
//             </div>

//             <div className="mt-3 text-sm font-semibold text-[#02979B]">
//               {fileProductos ? fileProductos.name : "Seleccionar archivo .xlsx / .xls"}
//             </div>
//             <div className="mt-1 text-xs text-[#02979B]/60">
//               Se enviará en bloques de 400 productos
//             </div>
//           </label>
//         </div>

//         {/* Barra de progreso */}
//         {loading && totalBlocks > 0 && (
//           <div className="mt-4 p-4 bg-blue-50 rounded-xl">
//             <div className="flex justify-between mb-2">
//               <span className="text-sm font-medium text-blue-800">
//                 Progreso: {progress}%
//               </span>
//               <span className="text-sm font-medium text-blue-800">
//                 Bloque {currentBlock} de {totalBlocks}
//               </span>
//             </div>
//             <div className="w-full bg-blue-200 rounded-full h-2.5">
//               <div 
//                 className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
//                 style={{ width: `${progress}%` }}
//               ></div>
//             </div>
            
//             {blockResults.length > 0 && (
//               <div className="mt-3 text-xs text-blue-700">
//                 <p>✅ Bloques exitosos: {blockResults.filter(b => b.success).length}</p>
//                 <p>❌ Bloques con error: {blockResults.filter(b => !b.success).length}</p>
//                 <p>📦 Productos subidos: {blockResults.reduce((acc, b) => acc + (b.successful || 0), 0)}</p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Error */}
//         {error && (
//           <div className="rounded-xl border border-red-200 bg-red-50 p-4">
//             <div className="flex items-start gap-3">
//               <div className="mt-0.5 text-red-700">
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                   <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
//                 </svg>
//               </div>
//               <div className="flex-1">
//                 <div className="text-sm font-semibold text-red-800">Mensaje</div>
//                 <div className="mt-1 whitespace-pre-wrap text-sm text-red-700">{error}</div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Actions */}
//         <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
//           <div className="flex flex-col gap-2 md:flex-row md:items-center">
//             <button
//               type="button"
//               onClick={sendInBlocks}
//               disabled={!canSend}
//               className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition md:w-auto ${
//                 canSend ? "bg-[#02979B] hover:bg-[#02979B]/80" : "bg-[#D9D9D9] cursor-not-allowed"
//               }`}
//             >
//               {loading ? (
//                 <>
//                   <Spinner />
//                   {progress > 0 ? `Enviando... ${progress}%` : "Enviando..."}
//                 </>
//               ) : (
//                 <>
//                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
//                     <path d="M22 2 15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
//                   </svg>
//                   Enviar Excel (bloques de 400)
//                 </>
//               )}
//             </button>

//             <div className="text-xs text-[#02979B]/60">
//               Nodo: <span className="font-mono text-[#02979B]">{nodeKey.replace('n', 'Nodo ')}</span>
//             </div>
//           </div>

//           <div className="text-sm text-[#02979B]/60 md:text-right">
//             <span className="text-[#02979B]">Tamaño bloque:</span>{" "}
//             <span className="font-mono font-semibold text-[#02979B]">400 productos</span>
//           </div>
//         </div>
//       </form>

//       {/* Respuesta del servidor */}
//       <div className="mt-8">
//         <div className="flex items-start justify-between gap-4">
//           <div>
//             <h2 className="text-lg font-semibold text-[#02979B]">Respuesta del servidor</h2>
//             <p className="mt-1 text-sm text-[#02979B]/60">
//               Resultado del envío por bloques
//             </p>
//           </div>

//           {/* Mostrar botón de descargar si hay errores, o mensaje de completado si todo salió bien */}
//           {result && (
//             <>
//               {hasErrorExcel ? (
//                 <button
//                   onClick={() => {
//                     const firstBlockWithError = result.blocks.find(block => block.errorExcelPath);
//                     if (firstBlockWithError) {
//                       downloadErrorExcel(firstBlockWithError.errorExcelPath);
//                     }
//                   }}
//                   className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
//                 >
//                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4M12 12v8m-4-4l4 4 4-4M12 2v10" strokeLinecap="round" strokeLinejoin="round"/>
//                   </svg>
//                   Descargar Excel de errores
//                 </button>
//               ) : allProductsSuccess && (
//                 <div className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white">
//                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
//                   </svg>
//                   Completado
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // Componentes auxiliares
// function Spinner() {
//   return (
//     <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
//       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//       <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
//     </svg>
//   );
// }







// src/ExcelSender.jsx
import { useMemo, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export default function ExcelSender({ employeeData, warehouses = [] }) {
  const NODES = useMemo(
    () => [
      { key: "n1", label: "Nodo 1", base: "https://n1.japiexcel.casamarketapp.com" },
      { key: "n23", label: "Nodo 2 / 3", base: "https://n3.japiexcel.casamarketapp.com" },
      { key: "n4", label: "Nodo 4", base: "https://n4.japiexcel.casamarketapp.com" },
      { key: "n5", label: "Nodo 5", base: "https://n5.japiexcel.casamarketapp.com" },
    ],
    []
  );

  // ===== DETECTAR SI VIENE DEL FLUJO DE LIMPIEZA =====
  const [cameFromNormalizer, setCameFromNormalizer] = useState(false);
  
  // ===== SELECTOR DE MODO (solo útil si NO viene del normalizer) =====
  const [cargaMode, setCargaMode] = useState("NORMAL");
  
  // Detectar modo del archivo pendiente
  useEffect(() => {
    const pendingName = sessionStorage.getItem('pendingExcelName');
    if (pendingName) {
      if (pendingName.includes('CONVERSION')) {
        setCargaMode("CONVERSION");
      }
      // Si hay archivo pendiente, significa que vino del normalizer
      setCameFromNormalizer(true);
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

  // ===== Estado para almacén seleccionado (solo útil si NO viene del normalizer) =====
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedWarehouseName, setSelectedWarehouseName] = useState("");

  // ===== Estado para listas de precios =====
  const [priceLists, setPriceLists] = useState([]);
  const [loadingPriceLists, setLoadingPriceLists] = useState(false);
  const [priceListsError, setPriceListsError] = useState("");

  // ===== idWarehouse (viene del normalizer o se selecciona manualmente) =====
  const [idWarehouse, setIdWarehouse] = useState("");
  const [idCountry, setIdCountry] = useState("1");
  
  // ===== IGV - SOLO un switch simple =====
  const [aplicarIgv, setAplicarIgv] = useState(true); // true = aplicar IGV (01), false = no aplicar (02)
  
  // taxCodeCountry se calcula según la selección
  const taxCodeCountry = useMemo(() => {
    // Si vino del normalizer, tomamos lo que tenga sessionStorage
    if (cameFromNormalizer) {
      const savedApplyIgvCost = sessionStorage.getItem('applyIgvCost');
      const savedApplyIgvSale = sessionStorage.getItem('applyIgvSale');
      const aplica = savedApplyIgvCost === 'true' || savedApplyIgvSale === 'true';
      return aplica ? "01" : "02";
    }
    // Si no vino del normalizer, usamos la selección del switch
    return aplicarIgv ? "01" : "02";
  }, [cameFromNormalizer, aplicarIgv]);

  const [flagUseSimpleBrand, setFlagUseSimpleBrand] = useState(true);

  const [fileProductos, setFileProductos] = useState(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState(null);
  const [result, setResult] = useState(null);

  // ===== MOSTRAR EN CONSOLA LOS IDs CADA VEZ QUE CAMBIAN =====
  useEffect(() => {
    if (companyId || subsidiaryId || selectedWarehouseId || idWarehouse || priceListId || selectedPriceLists.size > 0) {
      console.log('%c📋 VERIFICACIÓN DE IDs', 'font-size: 14px; font-weight: bold; color: #02979B;');
      console.log('%c🔵 ID Compañía:', 'font-weight: bold; color: #0066cc;', companyId || 'No definido');
      console.log('%c🟢 ID Tienda (subsidiary):', 'font-weight: bold; color: #00cc66;', subsidiaryId || 'No definido');
      console.log('%c🟡 ID Almacén:', 'font-weight: bold; color: #cc9900;', selectedWarehouseId || idWarehouse || 'No definido');
      
      // Mostrar lista(s) de precios
      if (cargaMode === "CONVERSION") {
        const selectedArray = Array.from(selectedPriceLists);
        if (selectedArray.length > 0) {
          console.log('%c📊 Listas de Precios (Modo Conversión):', 'font-weight: bold; color: #9933cc;');
          selectedArray.forEach((id, index) => {
            const priceList = priceLists.find(pl => String(pl.id) === String(id));
            const role = index === 0 ? '🔹 Principal' : '🔸 Secundaria';
            console.log(`  ${role} - ID: ${id} ${priceList ? `(${priceList.name})` : ''}`);
          });
        } else {
          console.log('%c📊 Listas de Precios:', 'font-weight: bold; color: #9933cc;', 'No definido');
        }
      } else {
        if (priceListId) {
          const priceList = priceLists.find(pl => String(pl.id) === String(priceListId));
          console.log('%c📊 Lista de Precios (Modo Normal):', 'font-weight: bold; color: #9933cc;', 
            `ID: ${priceListId} ${priceList ? `(${priceList.name})` : ''}`);
        } else {
          console.log('%c📊 Lista de Precios:', 'font-weight: bold; color: #9933cc;', 'No definido');
        }
      }
      
      console.log('%c📎 Origen:', 'font-weight: bold; color: #666666;', cameFromNormalizer ? 'Vino del Normalizer' : 'Selección manual');
      if (cameFromNormalizer) {
        const warehouseName = warehouses.find(w => String(w.id) === String(selectedWarehouseId))?.name;
        if (warehouseName) {
          console.log('%c🏢 Almacén:', 'font-weight: bold; color: #666666;', warehouseName);
        }
      }
      console.log('%c------------------------', 'color: #02979B;');
    }
  }, [companyId, subsidiaryId, selectedWarehouseId, idWarehouse, cameFromNormalizer, warehouses, priceListId, selectedPriceLists, cargaMode, priceLists]);

  // ===== CARGAR DATOS DEL EMPLEADO =====
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
        setSelectedWarehouseId(String(employeeData.warWarehousesId));
      }
    }
  }, [employeeData]);

  // ===== CARGAR ESTADO DESDE NORMALIZER (si vino de ahí) =====
  useEffect(() => {
    // SOLO cargar el warehouse de sessionStorage si vino del normalizer
    const selectedWarehouseId = sessionStorage.getItem('selectedWarehouseId');
    if (selectedWarehouseId && cameFromNormalizer) {
      setIdWarehouse(selectedWarehouseId);
      setSelectedWarehouseId(selectedWarehouseId);
      
      // Buscar el nombre del almacén
      const warehouse = warehouses.find(w => String(w.id) === String(selectedWarehouseId));
      if (warehouse) {
        setSelectedWarehouseName(warehouse.name);
      }
    }
  }, [cameFromNormalizer, warehouses]);

  // ===== CARGAR LISTAS DE PRECIOS =====
  useEffect(() => {
    const loadPriceLists = async () => {
      setLoadingPriceLists(true);
      
      try {
        const savedPriceLists = sessionStorage.getItem('priceLists');
        
        if (savedPriceLists) {
          const data = JSON.parse(savedPriceLists);
          setPriceLists(data);

          // Para modo NORMAL: seleccionar una por defecto
          if (cargaMode === "NORMAL") {
            if (data.length === 1) {
              setPriceListId(String(data[0].id));
            } else if (data.length > 1) {
              const defaultList = data.find(pl => pl.flagDefault === 1 || pl.flagDefault === true);
              if (defaultList) {
                setPriceListId(String(defaultList.id));
              }
            }
          }
          
          // Para modo CONVERSIÓN: seleccionar todas por defecto
          if (cargaMode === "CONVERSION") {
            setSelectedPriceLists(new Set(data.map(pl => String(pl.id))));
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
      
      const [primaryId, ...additionalIds] = selectedIds;
      const additionalPath = additionalIds.map(id => encodeURIComponent(id)).join('/');
      
      if (additionalPath) {
        return `${base}/pricelist/${encodeURIComponent(primaryId)}/subsidiary/${encodeURIComponent(subsidiaryId)}/${additionalPath}`;
      } else {
        return `${base}/pricelist/${encodeURIComponent(primaryId)}/subsidiary/${encodeURIComponent(subsidiaryId)}`;
      }
    } else {
      return `${base}/pricelist/${encodeURIComponent(priceListId)}/subsidiary/${encodeURIComponent(subsidiaryId)}`;
    }
  }, [baseUrl, companyId, priceListId, subsidiaryId, selectedPriceLists, cargaMode]);

  // ===== VALIDACIÓN según el modo =====
  const canSend = useMemo(() => {
    if (!fileProductos || !companyId || !subsidiaryId || loading) return false;
    
    // Si NO vino del normalizer, necesita seleccionar almacén
    if (!cameFromNormalizer && !selectedWarehouseId) return false;
    
    if (cargaMode === "CONVERSION") {
      return selectedPriceLists.size > 0;
    } else {
      return !!priceListId;
    }
  }, [fileProductos, companyId, subsidiaryId, loading, cargaMode, selectedPriceLists.size, priceListId, cameFromNormalizer, selectedWarehouseId]);

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

  // ===== MANEJAR CAMBIO DE ALMACÉN (solo si NO viene del normalizer) =====
  const handleWarehouseChange = (e) => {
    const warehouseId = e.target.value;
    setSelectedWarehouseId(warehouseId);
    setIdWarehouse(warehouseId);

    const warehouse = warehouses.find((w) => String(w.id) === String(warehouseId));
    const warehouseName = (warehouse?.name || "").trim();
    setSelectedWarehouseName(warehouseName);
  };

  // ===== FUNCIÓN PARA DESCARGAR EXCEL DE ERRORES =====
  const downloadErrorExcel = useCallback(async (errorPath) => {
    try {
      if (!errorPath) {
        toast.error("No hay ruta de descarga disponible");
        return;
      }

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

    // ===== MOSTRAR VERIFICACIÓN FINAL ANTES DE ENVIAR =====
    console.log('%c🚀 INICIANDO ENVÍO - VERIFICACIÓN FINAL', 'font-size: 16px; font-weight: bold; color: #ff6600;');
    console.log('%c🔵 Compañía ID:', 'font-weight: bold; color: #0066cc;', companyId);
    console.log('%c🟢 Tienda ID (subsidiary):', 'font-weight: bold; color: #00cc66;', subsidiaryId);
    console.log('%c🟡 Almacén ID:', 'font-weight: bold; color: #cc9900;', selectedWarehouseId || idWarehouse);
    
    // Mostrar lista(s) de precios en verificación final
    if (cargaMode === "CONVERSION") {
      const selectedArray = Array.from(selectedPriceLists);
      console.log('%c📊 Listas de Precios (Modo Conversión):', 'font-weight: bold; color: #9933cc;');
      selectedArray.forEach((id, index) => {
        const priceList = priceLists.find(pl => String(pl.id) === String(id));
        const role = index === 0 ? '🔹 Principal (va en /pricelist/)' : '🔸 Secundaria';
        console.log(`  ${role} - ID: ${id} ${priceList ? `(${priceList.name})` : ''}`);
      });
    } else {
      const priceList = priceLists.find(pl => String(pl.id) === String(priceListId));
      console.log('%c📊 Lista de Precios (Modo Normal):', 'font-weight: bold; color: #9933cc;', 
        `ID: ${priceListId} ${priceList ? `(${priceList.name})` : ''}`);
    }
    
    if (selectedWarehouseName) {
      console.log('%c🏢 Almacén:', 'font-weight: bold; color: #666666;', selectedWarehouseName);
    }
    console.log('%c📦 Modo:', 'font-weight: bold; color: #666666;', cargaMode);
    console.log('%c💰 IGV:', 'font-weight: bold; color: #666666;', taxCodeCountry === "01" ? "Aplica IGV (18%)" : "Sin IGV");
    console.log('%c📎 Origen:', 'font-weight: bold; color: #666666;', cameFromNormalizer ? 'Vino del Normalizer' : 'Selección manual');
    console.log('%c📁 Archivo:', 'font-weight: bold; color: #666666;', fileProductos?.name || 'No seleccionado');
    console.log('%c------------------------', 'color: #ff6600;');

    try {
      // Validaciones
      if (cargaMode === "CONVERSION" && selectedPriceLists.size === 0) {
        throw new Error("Debe seleccionar al menos una lista de precios");
      }
      
      if (cargaMode === "NORMAL" && !priceListId) {
        throw new Error("Debe seleccionar una lista de precios");
      }

      // Validar almacén si NO vino del normalizer
      if (!cameFromNormalizer && !selectedWarehouseId) {
        throw new Error("Debe seleccionar un almacén");
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
      
      console.log(`💰 Código IGV a enviar: ${taxCodeCountry} (${taxCodeCountry === "01" ? "Aplica IGV" : "No aplica IGV"})`);
      
      toast.info(`Procesando ${totalRows} productos en ${totalBlocks} bloques de 400...`);
      
      let allResults = [];
      let successCount = 0;
      let errorCount = 0;
      let blocksWithPartialErrors = 0; // Nueva variable para contar bloques con errores parciales
      
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
        
        // Usar el warehouse que corresponda (ya sea del normalizer o seleccionado)
        const warehouseToUse = selectedWarehouseId || idWarehouse;
        if (warehouseToUse) form.append("idWarehouse", warehouseToUse);
        
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
        
        // Determinar si el bloque tuvo errores (éxito parcial o fallo total)
        const hasErrors = !res.ok || blockSuccess < blockData.length;
        if (hasErrors) {
          blocksWithPartialErrors++;
        }
        
        const blockInfo = {
          block: blockNum + 1,
          success: res.ok,
          status: res.status,
          data: blockResult,
          products: blockData.length,
          successful: blockSuccess,
          hasErrors: hasErrors, // Nuevo campo
          errorExcelPath: blockResult?.data?.name_excel
        };
        
        allResults.push(blockInfo);
        setBlockResults([...allResults]);
        
        if (!res.ok) {
          errorCount++;
          console.error(`❌ Bloque ${blockNum + 1} falló:`, blockResult);
        } else if (blockSuccess < blockData.length) {
          console.warn(`⚠️ Bloque ${blockNum + 1} con errores parciales: ${blockSuccess}/${blockData.length} productos`);
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
        blocks_with_errors: blocksWithPartialErrors, // Nuevo campo
        blocks: allResults
      });
      
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
      toast.error("Error en el envío por bloques");
    } finally {
      setLoading(false);
    }
  };

 
// ===== COMPONENTE SELECTOR DE IGV SIMPLE (SOLO si NO vino del normalizer) =====
const IgvSelector = () => {
  // Si vino del normalizer, NO mostrar nada
  if (cameFromNormalizer) {
    return null;
  }

  return (
    <div className="flex-1 rounded-2xl border border-[#D9D9D9] bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
        <span className="text-sm font-semibold text-[#02979B]">
          Aplicar IGV
        </span>
        <p className="text-xs text-[#02979B]/60 mt-0.5">
          {aplicarIgv ? "Con IGV (18%)" : "Sin IGV"}
        </p>
      </div>
        
        <button
          type="button"
          onClick={() => setAplicarIgv(!aplicarIgv)}
          className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
            aplicarIgv ? 'bg-[#02979B]' : 'bg-[#E5E7EB]'
          }`}
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

// ===== COMPONENTE SELECTOR DE MODO (SOLO si NO vino del normalizer) =====
const ModeSelector = () => {
  // Si vino del normalizer, NO mostrar nada
  if (cameFromNormalizer) {
    return null;
  }

  return (
    <div className="flex-1 rounded-2xl border border-[#D9D9D9] bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-[#02979B]">
            Modo de carga
          </span>
          <p className="text-xs text-[#02979B]/60 mt-0.5">
            {cargaMode === "NORMAL" ? "Modo Normal" : "Modo Conversión"}
          </p>
        </div>
        
        <button
          type="button"
          onClick={() =>
            setCargaMode(cargaMode === "NORMAL" ? "CONVERSION" : "NORMAL")
          }
          className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
            cargaMode === "NORMAL" ? "bg-[#02979B]" : "bg-[#E5E7EB]"
          }`}
        >
          <span
            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              cargaMode === "CONVERSION" ? "left-8" : "left-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
};



  // ===== COMPONENTE SELECTOR DE ALMACÉN (SOLO si NO vino del normalizer) =====
  const WarehouseSelector = () => {
    // Si vino del normalizer, NO mostrar nada
    if (cameFromNormalizer) {
      return null;
    }

    return (
      <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
        <div className="text-sm font-semibold text-[#02979B] mb-4">
          Configuración de almacén
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#02979B]">
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
              required
              className="w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
            >
              <option value="">Seleccione un almacén</option>
              {warehouses.map((w) => (
                <option key={w.id} value={String(w.id)}>
                  {w.name}
                </option>
              ))}
            </select>
          )}

          {warehouses.length > 1 && !selectedWarehouseId && (
            <p className="mt-1 text-xs text-red-500">Debe seleccionar un almacén para continuar</p>
          )}
        </div>
      </div>
    );
  };

  // ===== COMPONENTE PRICE LIST SELECTOR (siempre visible) =====
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
            {priceLists.map((pl) => {
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
                      {(pl.flagDefault === 1 || pl.flagDefault === true) && (
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
        </div>
      );
    }

    // MODO NORMAL
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
              {pl.name} {(pl.flagDefault === 1 || pl.flagDefault === true) ? '(Por defecto)' : ''}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Verificar si hay algún bloque con Excel de errores disponible
  const hasErrorExcel = useMemo(() => {
    if (!result || !result.blocks) return false;
    return result.blocks.some(block => block.errorExcelPath);
  }, [result]);

  // Verificar si todos los productos se subieron correctamente
  const allProductsSuccess = useMemo(() => {
    if (!result) return false;
    return result.successful_products === result.total_products;
  }, [result]);

  return (
    <div className="w-full">
      <form className="space-y-6">
        {/* Estos componentes solo se renderizan si NO viene del normalizer */}
         {!cameFromNormalizer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModeSelector />
              <IgvSelector />
            </div>
          )}

          <WarehouseSelector />


        {/* Selector de Lista de Precios - SIEMPRE visible */}
        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
          <div className="text-sm font-semibold text-[#02979B] mb-4">
            Configuración de envío
            {cargaMode === "CONVERSION" && !cameFromNormalizer && (
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
                <p>✅ Bloques exitosos: {blockResults.filter(b => b.success && !b.hasErrors).length}</p>
                <p>⚠️ Bloques con errores parciales: {blockResults.filter(b => b.success && b.hasErrors).length}</p>
                <p>❌ Bloques fallidos: {blockResults.filter(b => !b.success).length}</p>
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

      {/* Resultado del envío - AHORA AQUÍ ABAJO Y PERSISTENTE */}
      {result && (
        <div className="mt-8">
          <div className={`rounded-2xl border p-6 ${
            allProductsSuccess 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`mt-1 ${
                  allProductsSuccess ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {allProductsSuccess ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 9v4m0 4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${
                    allProductsSuccess ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {allProductsSuccess 
                      ? '✅ ¡Proceso completado con éxito!' 
                      : '⚠️ Proceso completado con advertencias'
                    }
                  </h3>
                  <p className={`mt-2 text-lg ${
                    allProductsSuccess ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    Se subieron <span className="font-bold">{result.successful_products}</span> de{' '}
                    <span className="font-bold">{result.total_products}</span> productos
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div className={`rounded-xl p-3 ${
                      allProductsSuccess ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      <p className={`text-sm ${
                        allProductsSuccess ? 'text-green-800' : 'text-yellow-800'
                      }`}>Bloques totales</p>
                      <p className={`text-2xl font-bold ${
                        allProductsSuccess ? 'text-green-900' : 'text-yellow-900'
                      }`}>{result.total_blocks}</p>
                    </div>
                    <div className={`rounded-xl p-3 ${
                      allProductsSuccess ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      <p className={`text-sm ${
                        allProductsSuccess ? 'text-green-800' : 'text-yellow-800'
                      }`}>Bloques con problemas</p>
                      <p className={`text-2xl font-bold ${
                        allProductsSuccess ? 'text-green-900' : 'text-yellow-900'
                      }`}>{result.blocks_with_errors || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {hasErrorExcel && (
                <button
                  onClick={() => {
                    const firstBlockWithError = result.blocks.find(block => block.errorExcelPath);
                    if (firstBlockWithError) {
                      downloadErrorExcel(firstBlockWithError.errorExcelPath);
                    }
                  }}
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

// Componentes auxiliares
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}