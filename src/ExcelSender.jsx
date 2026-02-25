// // src/ExcelSender.jsx
// import { useMemo, useState, useCallback, useEffect } from "react";
// import { toast } from "sonner";
// import * as XLSX from 'xlsx';

// export default function ExcelSender() {
//   const NODES = useMemo(
//     () => [
//       { key: "n1", label: "Nodo 1", base: "https://n1.japiexcel.casamarketapp.com" },
//       { key: "n23", label: "Nodo 2 / 3", base: "https://n3.japiexcel.casamarketapp.com" },
//       { key: "n4", label: "Nodo 4", base: "https://n4.japiexcel.casamarketapp.com" },
//       { key: "n5", label: "Nodo 5", base: "https://n5.japiexcel.casamarketapp.com" },
//     ],
//     []
//   );

//   // ===== NUEVO: Obtener nodo de la URL y auto-seleccionar =====
//   const getNodeFromUrl = () => {
//     const params = new URLSearchParams(window.location.search);
//     const nodeParam = params.get("node");
    
//     if (!nodeParam) return "n1"; // Default a n1 si no hay parámetro
    
//     // Mapear el número de nodo a la clave correspondiente
//     const nodeMap = {
//       "1": "n1",
//       "2": "n23", // Nodo 2 usa el mismo que 3
//       "3": "n23",
//       "4": "n4",
//       "5": "n5"
//     };
    
//     return nodeMap[nodeParam] || "n1";
//   };

//   // ===== NUEVO: Obtener el nodo una sola vez =====
//   const [nodeKey] = useState(getNodeFromUrl()); // Quitamos setNodeKey porque ya no se podrá cambiar
//   const [companyId, setCompanyId] = useState("");
//   const [priceListId, setPriceListId] = useState("");
//   const [subsidiaryId, setSubsidiaryId] = useState("");

//   // ===== NUEVO: Estado para listas de precios =====
//   const [priceLists, setPriceLists] = useState([]);
//   const [loadingPriceLists, setLoadingPriceLists] = useState(false);
//   const [priceListsError, setPriceListsError] = useState("");

//   const [idWarehouse, setIdWarehouse] = useState("");
//   const [idCountry, setIdCountry] = useState("1");
  
//   const [applyIgvCost, setApplyIgvCost] = useState(true);
//   const [applyIgvSale, setApplyIgvSale] = useState(true);
  
//   const taxCodeCountry = useMemo(() => {
//     return (!applyIgvCost && !applyIgvSale) ? "02" : "01";
//   }, [applyIgvCost, applyIgvSale]);

//   const [flagUseSimpleBrand, setFlagUseSimpleBrand] = useState(true);

//   const [fileProductos, setFileProductos] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const [error, setError] = useState("");
//   const [errorDetails, setErrorDetails] = useState(null);
//   const [result, setResult] = useState(null);

//   // ===== CARGAR ESTADO DESDE NORMALIZER =====
//   useEffect(() => {
//     const savedApplyIgvCost = sessionStorage.getItem('applyIgvCost');
//     const savedApplyIgvSale = sessionStorage.getItem('applyIgvSale');
    
//     if (savedApplyIgvCost !== null) {
//       setApplyIgvCost(savedApplyIgvCost === 'true');
//     }
//     if (savedApplyIgvSale !== null) {
//       setApplyIgvSale(savedApplyIgvSale === 'true');
//     }
//   }, []);

//   // ===== NUEVO: Obtener token de la URL =====
//   const getTokenFromUrl = () => {
//     const params = new URLSearchParams(window.location.search);
//     return params.get("token");
//   };

//   // ===== NUEVO: Obtener el nombre del nodo para mostrar =====
//   const getCurrentNodeLabel = () => {
//     const node = NODES.find(n => n.key === nodeKey);
//     return node ? node.label : "Nodo no encontrado";
//   };

//   // ===== NUEVO: Obtener la base URL del nodo actual =====
//   const getCurrentNodeBase = () => {
//     const node = NODES.find(n => n.key === nodeKey);
//     return node ? node.base : NODES[0].base;
//   };

//   // ===== NUEVO: Cargar listas de precios =====
//   useEffect(() => {
//     const loadPriceLists = async () => {
//       const token = getTokenFromUrl();
//       const node = nodeKey.replace('n', ''); // Extraer número del nodo
      
//       if (!token || !node) {
//         console.warn("⚠️ No hay token o node en la URL");
//         return;
//       }

//       setLoadingPriceLists(true);
//       setPriceListsError("");

//       try {
//         const salesNode = `https://n${node}.sales.casamarketapp.com`;
        
//         const response = await fetch(
//           `${salesNode}/sal-price-lists?page=1&limit=10&sortDirection=desc&sortField=created_at`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               Accept: "application/vnd.appv1.10.1+json",
//             },
//           }
//         );

//         if (response.status === 401) {
//           setPriceListsError("Sesión expirada. Recarga la página.");
//           toast.error("Sesión expirada");
//           return;
//         }

//         if (!response.ok) {
//           throw new Error(`Error ${response.status}`);
//         }

//         const data = await response.json();
        
//         console.log("💰 LISTAS DE PRECIOS CARGADAS:", data);
//         setPriceLists(data);

//         // Auto-seleccionar si solo hay una lista de precios
//         if (data.length === 1) {
//           setPriceListId(String(data[0].id));
//           toast.info(`Lista seleccionada: ${data[0].name}`, {
//             id: 'auto-select-pricelist'
//           });
//         } else if (data.length > 1) {
//           // Buscar la que tiene flagDefault = true
//           const defaultList = data.find(pl => pl.flagDefault === 1 || pl.flagDefault === true);
//           if (defaultList) {
//             setPriceListId(String(defaultList.id));
//             toast.info(`Lista por defecto seleccionada: ${defaultList.name}`, {
//               id: 'default-pricelist'
//             });
//           }
//         }

//       } catch (error) {
//         console.error("Error cargando listas de precios:", error);
//         setPriceListsError("No se pudieron cargar las listas de precios");
//       } finally {
//         setLoadingPriceLists(false);
//       }
//     };

//     loadPriceLists();
//   }, [nodeKey]); // Dependemos de nodeKey

//   const baseUrl = useMemo(() => {
//     return getCurrentNodeBase();
//   }, [nodeKey]);

//   const buildEndpoint = useCallback(() => {
//     return (
//       `${baseUrl}/api/excel/readexcel/${encodeURIComponent(companyId)}` +
//       `/pricelist/${encodeURIComponent(priceListId)}` +
//       `/subsidiary/${encodeURIComponent(subsidiaryId)}`
//     );
//   }, [baseUrl, companyId, priceListId, subsidiaryId]);

//   const endpointPreview =
//     companyId && priceListId && subsidiaryId ? buildEndpoint() : "";

//   const canSend =
//     !!fileProductos && !!companyId && !!priceListId && !!subsidiaryId && !loading;

//   // ======================
//   // CARGAR ARCHIVO PENDIENTE DESDE NORMALIZER
//   // ======================
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
          
//           toast.success(`Archivo "${pendingName}" listo para enviar`, {
//             duration: 3000,
//             id: 'pending-file-toast'
//           });
          
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

//   // ======================
//   // FUNCIÓN PARSE ERROR
//   // ======================
//   const parseError = (errorMessage, statusCode) => {
//     const errors = {
//       "invalid excel": "El archivo Excel tiene un formato inválido",
//       "invalid format": "Formato de archivo no soportado",
//       "missing columns": "Faltan columnas requeridas en el Excel",
//       "company not found": "El Company ID no existe en el sistema",
//       "pricelist not found": "El PriceList ID no existe o no pertenece a esta compañía",
//       "subsidiary not found": "El Subsidiary ID no existe o no pertenece a esta compañía",
//       "warehouse not found": "El Warehouse ID no existe",
//       "product not found": "Uno o más productos no existen en el sistema",
//       "sku already exists": "El SKU del producto ya está registrado",
//       "invalid price": "El precio del producto es inválido",
//       "invalid stock": "La cantidad de stock es inválida",
//       "product creation failed": "Error al crear el producto",
//       "product update failed": "Error al actualizar el producto",
//       "database error": "Error en la base de datos",
//       "server error": "Error interno del servidor",
//       "timeout": "La operación tardó demasiado tiempo",
//       "network error": "Error de conexión de red",
//     };

//     const errorLower = String(errorMessage || "").toLowerCase();
//     let foundError = null;

//     for (const [key, description] of Object.entries(errors)) {
//       if (errorLower.includes(key)) {
//         foundError = { type: key, description, details: errorMessage };
//         break;
//       }
//     }

//     if (!foundError) {
//       foundError = {
//         type: "unknown",
//         description: "Error desconocido",
//         details: errorMessage,
//       };
//     }

//     if (statusCode) {
//       foundError.statusCode = statusCode;
//       foundError.statusText = getStatusText(statusCode);
//     }

//     return foundError;
//   };

//   // ======================
//   // FUNCIÓN GET STATUS TEXT
//   // ======================
//   const getStatusText = (statusCode) => {
//     const statusMap = {
//       400: "Bad Request - La solicitud tiene errores",
//       401: "Unauthorized - No autorizado",
//       403: "Forbidden - Acceso prohibido",
//       404: "Not Found - Recurso no encontrado",
//       413: "Payload Too Large - Archivo muy grande",
//       422: "Unprocessable Entity - Error de validación",
//       500: "Internal Server Error - Error del servidor",
//       502: "Bad Gateway - Error de gateway",
//       503: "Service Unavailable - Servicio no disponible",
//       504: "Gateway Timeout - Tiempo de espera agotado",
//     };
//     return statusMap[statusCode] || `Código de error: ${statusCode}`;
//   };

//   // ======================
//   // FUNCIÓN ONSEND
//   // ======================
//   const onSend = async () => {
//     setError("");
//     setErrorDetails(null);
//     setResult(null);

//     if (!fileProductos) {
//       toast.error("Selecciona el archivo Excel");
//       setError("❌ Selecciona el archivo Excel (.xlsx o .xls).");
//       return;
//     }

//     if (!companyId || !priceListId || !subsidiaryId) {
//       const missing = [];
//       if (!companyId) missing.push("Company ID");
//       if (!priceListId) missing.push("PriceList ID");
//       if (!subsidiaryId) missing.push("Subsidiary ID");

//       toast.warning(`Completa: ${missing.join(", ")}`);
//       setError(`⚠️ Completa los campos obligatorios: ${missing.join(", ")}`);
//       return;
//     }

//     const fileName = fileProductos.name.toLowerCase();
//     if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
//       toast.error("Formato inválido: debe ser .xlsx o .xls");
//       setError("❌ El archivo debe ser un Excel (.xlsx o .xls)");
//       return;
//     }

//     try {
//       setLoading(true);

//       let fileToSend = fileProductos;
      
//       if (fileProductos.name.includes('_QA') || fileProductos.name.includes('CONVERSION')) {
//         try {
//           const data = await fileProductos.arrayBuffer();
//           const workbook = XLSX.read(data, { type: 'array' });
          
//           if (workbook.SheetNames.includes('productos')) {
//             const productosSheet = workbook.Sheets['productos'];
//             const newWorkbook = XLSX.utils.book_new();
//             XLSX.utils.book_append_sheet(newWorkbook, productosSheet, 'productos');
            
//             const wbout = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
//             fileToSend = new File([wbout], fileProductos.name.replace('_QA', '').replace('_CONVERSION', ''), { 
//               type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
//             });
            
//             toast.info("Usando solo la hoja 'productos' del archivo QA", {
//               id: 'extract-sheet-toast'
//             });
//           }
//         } catch (e) {
//           console.error("Error extrayendo hoja productos:", e);
//         }
//       }

//       const form = new FormData();
//       form.append("file_excel", fileToSend);
//       form.append("idCountry", idCountry);
//       form.append("taxCodeCountry", taxCodeCountry);
//       form.append("flagUseSimpleBrand", String(flagUseSimpleBrand));
//       if (idWarehouse) form.append("idWarehouse", idWarehouse);

//       const endpoint = buildEndpoint();
//       const res = await fetch(endpoint, { method: "POST", body: form });

//       const text = await res.text();

//       if (!res.ok) {
//         const parsedError = parseError(text, res.status);
//         setErrorDetails(parsedError);

//         let userMessage = `❌ Error ${res.status}: ${parsedError.description}`;

//         if (res.status === 404) {
//           userMessage +=
//             "\n\nPosibles causas:\n• Los IDs ingresados no existen\n• El nodo seleccionado es incorrecto\n• La ruta API ha cambiado";
//         } else if (res.status === 422) {
//           userMessage +=
//             "\n\nRevisa:\n• El formato del archivo Excel\n• Las columnas requeridas\n• Los tipos de datos en cada columna";
//         } else if (res.status === 500) {
//           userMessage +=
//             "\n\nEl servidor tuvo un problema interno. Intenta de nuevo o contacta al administrador.";
//         }

//         setError(userMessage);
//         toast.error(`Error ${res.status}: ${parsedError.description}`, {
//           id: 'error-toast'
//         });
//         throw new Error(text);
//       }

//       try {
//         const jsonResult = JSON.parse(text);
//         setResult(jsonResult);

//         const okCount = Number(
//           jsonResult?.success ??
//             jsonResult?.data?.n_products ??
//             jsonResult?.n_products ??
//             0
//         );

//         const errCount = Array.isArray(jsonResult?.errors)
//           ? jsonResult.errors.length
//           : 0;

//         if (errCount > 0) {
//           setErrorDetails({
//             type: "product_errors",
//             description: "Errores en productos específicos",
//             details: jsonResult.errors,
//             successCount: okCount,
//             errorCount: errCount,
//           });

//           setError(
//             `⚠️ Se procesaron ${okCount} productos, pero ${errCount} tuvieron errores. Revisa los detalles abajo.`
//           );

//           toast.warning(`Procesado: ${okCount} OK, ${errCount} con error`, {
//             id: 'warning-toast'
//           });
//         } else {
//           setError("");
//           toast.success(`✅ Productos subidos: ${okCount}`, {
//             id: 'success-toast'
//           });
//         }
//       } catch {
//         setResult(text);
//         setError(
//           `✅ Respuesta del servidor: ${text.substring(0, 100)}${
//             text.length > 100 ? "..." : ""
//           }`
//         );
//         toast.success("✅ Envío completado", {
//           id: 'completion-toast'
//         });
//       }
//     } catch (e) {
//       const msg = String(e?.message || "");

//       if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
//         const m =
//           "🌐 Error de conexión:\n\n• Verifica tu conexión a internet\n• El servidor del nodo podría estar caído\n• Revisa si hay problemas con CORS\n\nEndpoint: " +
//           buildEndpoint();

//         setError(m);
//         toast.error("🌐 Error de conexión con el servidor", {
//           id: 'network-error-toast'
//         });
//         return;
//       }

//       if (!errorDetails) {
//         const parsedError = parseError(msg || "Error desconocido");
//         setErrorDetails(parsedError);
//       }

//       toast.error("❌ No se pudo enviar el Excel", {
//         id: 'send-error-toast'
//       });

//       if (!error) {
//         setError("❌ Error enviando el archivo: " + (msg || "Error desconocido"));
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getSelectedPriceListName = () => {
//     if (!priceListId) return "";
//     const selected = priceLists.find(pl => String(pl.id) === String(priceListId));
//     return selected ? selected.name : "";
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-12">
//         {/* Left: form */}
//         <div className="lg:col-span-7">
//           <div className="rounded-2xl border border-[#D9D9D9] bg-white shadow-sm">
//             <div className="border-b border-[#D9D9D9] p-6">
//               <h1 className="text-lg font-semibold text-[#02979B]">
//                 Cargar archivo y enviar
//               </h1>
//               <p className="mt-1 text-sm text-[#02979B]/60">
//                 Completa los IDs, selecciona el nodo y adjunta el Excel.
//               </p>
//             </div>

//             <div className="space-y-6 p-6">
//               {/* Nodo - AHORA DE SOLO LECTURA (como taxCodeCountry) */}
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-[#02979B]">Nodo</label>
//                 <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//                   {getCurrentNodeLabel()} — {getCurrentNodeBase().replace("https://", "")}
//                 </div>
//                 <p className="text-xs text-[#02979B]/60">
//                   Nodo determinado por la URL: {nodeKey.replace('n', 'Nodo ')}
//                 </p>
//               </div>

//               {/* IDs */}
//               <div>
//                 <div className="mb-2 flex items-center justify-between">
//                   <label className="text-sm font-medium text-[#02979B]">IDs</label>
//                   <span className="text-xs text-[#02979B]/60">Obligatorios</span>
//                 </div>

//                 <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
//                   <Field
//                     label="Company ID"
//                     placeholder="Ej: 5454"
//                     value={companyId}
//                     onChange={setCompanyId}
//                   />
                  
//                   {/* PriceList ID como selector */}
//                   <div className="space-y-1.5">
//                     <label className="text-sm font-medium text-[#02979B]">
//                       PriceList ID <span className="text-red-500">*</span>
//                     </label>
                    
//                     {loadingPriceLists ? (
//                       <div className="flex items-center gap-2 w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//                         <Spinner />
//                         <span>Cargando listas de precios...</span>
//                       </div>
//                     ) : priceListsError ? (
//                       <div className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
//                         {priceListsError}
//                       </div>
//                     ) : priceLists.length === 0 ? (
//                       <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//                         No hay listas de precios disponibles
//                       </div>
//                     ) : (
//                       <>
//                         <select
//                           value={priceListId}
//                           onChange={(e) => setPriceListId(e.target.value)}
//                           className="w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
//                         >
//                           <option value="">Seleccione una lista de precios</option>
//                           {priceLists.map((pl) => (
//                             <option key={pl.id} value={String(pl.id)}>
//                               {pl.name} {pl.flagDefault === 1 || pl.flagDefault === true ? '(Por defecto)' : ''}
//                             </option>
//                           ))}
//                         </select>
                        
//                         {priceListId && (
//                           <div className="mt-1 text-xs text-[#02979B]/60">
//                             Seleccionado: {getSelectedPriceListName()}
//                           </div>
//                         )}
//                       </>
//                     )}
//                   </div>
                  
//                   <Field
//                     label="Subsidiary ID"
//                     placeholder="Ej: 7821"
//                     value={subsidiaryId}
//                     onChange={setSubsidiaryId}
//                   />
//                 </div>
//               </div>

//               {/* Parámetros */}
//               <div>
//                 <div className="mb-2 flex items-center justify-between">
//                   <label className="text-sm font-medium text-[#02979B]">Parámetros</label>
//                   <span className="text-xs text-[#02979B]/60">Form-data</span>
//                 </div>

//                 <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
//                   <Field
//                     label="idCountry"
//                     placeholder="1"
//                     value={idCountry}
//                     onChange={setIdCountry}
//                   />
                  
//                   <div className="space-y-1.5">
//                     <label className="text-sm font-medium text-[#02979B]">taxCodeCountry</label>
//                     <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//                       {taxCodeCountry} — {taxCodeCountry === "01" ? "IGV" : "Exonerado"}
//                     </div>
//                     <div className="text-xs text-[#02979B]/60">
//                       {taxCodeCountry === "01" 
//                         ? "🔵 IGV aplicado (al menos un toggle activo)" 
//                         : "🟢 Exonerado (ambos toggles desactivados)"}
//                     </div>
//                   </div>
                  
//                   <Field
//                     label="idWarehouse (opcional)"
//                     placeholder="Ej: 5712"
//                     value={idWarehouse}
//                     onChange={setIdWarehouse}
//                     helper="Solo si el cliente tiene más de una tienda/almacén."
//                   />
//                 </div>

//                 <div className="mt-4 grid gap-3 md:grid-cols-2">
//                   <ToggleCard
//                     title="Aplicar IGV a Precio Costo"
//                     value={applyIgvCost}
//                     onToggle={() => setApplyIgvCost(v => !v)}
//                     icon={
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                         <path d="M12 2v20M17 5H9.5M17 12h-5M17 19h-5" strokeLinecap="round" />
//                       </svg>
//                     }
//                   />
//                   <ToggleCard
//                     title="Aplicar IGV a Precio Venta"
//                     value={applyIgvSale}
//                     onToggle={() => setApplyIgvSale(v => !v)}
//                     icon={
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                         <path d="M20 12H4M12 4v16" strokeLinecap="round" />
//                       </svg>
//                     }
//                   />
//                 </div>

//                 <div className="mt-4 flex items-center justify-between rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-4 py-3">
//                   <div className="flex items-center gap-2">
//                     <div className="text-[#02979B]">
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                         <path d="M7 7h10v10H7z" strokeLinecap="round" strokeLinejoin="round"/>
//                       </svg>
//                     </div>
//                     <div>
//                       <div className="text-sm font-medium text-[#02979B]">flagUseSimpleBrand</div>
//                       <div className="text-xs text-[#02979B]/60">
//                         Envía <span className="font-mono">true/false</span> al backend.
//                       </div>
//                     </div>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={() => setFlagUseSimpleBrand((v) => !v)}
//                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
//                       flagUseSimpleBrand ? "bg-[#02979B]" : "bg-[#D9D9D9]"
//                     }`}
//                     aria-label="Toggle flagUseSimpleBrand"
//                   >
//                     <span
//                       className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
//                         flagUseSimpleBrand ? "translate-x-5" : "translate-x-1"
//                       }`}
//                     />
//                   </button>
//                 </div>
//               </div>

//               {/* Archivo */}
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-[#02979B]">Archivo Excel</label>

//                 <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D9D9] bg-white p-8 text-center transition hover:border-[#02979B] hover:bg-[#02979B]/5">
//                   <input
//                     type="file"
//                     accept=".xlsx,.xls"
//                     className="hidden"
//                     onChange={(e) => setFileProductos(e.target.files?.[0] ?? null)}
//                   />

//                   <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D9D9D9] text-[#02979B] transition group-hover:bg-[#02979B] group-hover:text-white">
//                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                       <path d="M12 16V4m0 0 4 4M12 4 8 8" strokeLinecap="round" strokeLinejoin="round" />
//                       <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
//                     </svg>
//                   </div>

//                   <div className="mt-3 text-sm font-semibold text-[#02979B]">
//                     {fileProductos ? fileProductos.name : "Seleccionar archivo .xlsx / .xls"}
//                   </div>
//                   <div className="mt-1 text-xs text-[#02979B]/60">
//                     Se enviará como <span className="font-mono">file_excel</span> (multipart/form-data)
//                   </div>
//                 </label>
//               </div>

//               {/* Error principal */}
//               {error && (
//                 <div className="rounded-xl border border-red-200 bg-red-50 p-4">
//                   <div className="flex items-start gap-3">
//                     <div className="mt-0.5 text-red-700">
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                         <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
//                       </svg>
//                     </div>
//                     <div className="flex-1">
//                       <div className="text-sm font-semibold text-red-800">Mensaje</div>
//                       <div className="mt-1 whitespace-pre-wrap text-sm text-red-700">{error}</div>

//                       {errorDetails && (
//                         <button
//                           onClick={() => {
//                             const textToCopy = `Error: ${error}\n\nDetalles: ${JSON.stringify(
//                               errorDetails,
//                               null,
//                               2
//                             )}\n\nEndpoint: ${buildEndpoint()}`;
//                             navigator.clipboard.writeText(textToCopy);
//                             toast.success("Copiado al portapapeles", {
//                               id: 'copy-toast'
//                             });
//                           }}
//                           className="mt-2 inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
//                         >
//                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                             <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1M8 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M8 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round"/>
//                           </svg>
//                           Copiar detalles del error
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Actions */}
//               <div className="flex flex-col gap-3 md:flex-row md:items-center">
//                 <button
//                   type="button"
//                   onClick={onSend}
//                   disabled={!canSend}
//                   className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition md:w-auto ${
//                     canSend ? "bg-[#02979B] hover:bg-[#02979B]/80" : "bg-[#D9D9D9] cursor-not-allowed"
//                   }`}
//                 >
//                   {loading ? (
//                     <>
//                       <Spinner />
//                       Enviando...
//                     </>
//                   ) : (
//                     <>
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                         <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
//                         <path d="M22 2 15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
//                       </svg>
//                       Enviar Excel
//                     </>
//                   )}
//                 </button>

//                 <div className="flex-1 rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-4 py-3">
//                   <div className="flex items-center gap-2 text-xs font-medium text-[#02979B]">
//                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                       <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" strokeLinecap="round" strokeLinejoin="round" />
//                       <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" strokeLinecap="round" strokeLinejoin="round" />
//                     </svg>
//                     Endpoint
//                   </div>
//                   <div className="mt-1 break-all font-mono text-xs text-[#02979B]">
//                     {endpointPreview || "Completa los IDs para ver el endpoint"}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Right: response */}
//         <div className="lg:col-span-5">
//           <div className="rounded-2xl border border-[#D9D9D9] bg-white shadow-sm">
//             <div className="border-b border-[#D9D9D9] p-6">
//               <h2 className="text-lg font-semibold text-[#02979B]">Respuesta del servidor</h2>
//               <p className="mt-1 text-sm text-[#02979B]/60">
//                 Verifica si el backend retornó JSON o texto.
//               </p>
//             </div>

//             <div className="p-6">
//               {result ? (
//                 <div>
//                   <pre className="max-h-[560px] overflow-auto rounded-2xl border border-[#D9D9D9] bg-[#02979B]/5 p-4 text-xs text-[#02979B]">
//                     {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
//                   </pre>

//                   <button
//                     onClick={() => {
//                       const textToCopy =
//                         typeof result === "string" ? result : JSON.stringify(result, null, 2);
//                       navigator.clipboard.writeText(textToCopy);
//                       toast.success("Respuesta copiada", {
//                         id: 'copy-response-toast'
//                       });
//                     }}
//                     className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#02979B]/10 px-3 py-1 text-xs font-medium text-[#02979B] hover:bg-[#02979B]/20"
//                   >
//                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                       <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1M8 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M8 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round"/>
//                     </svg>
//                     Copiar respuesta completa
//                   </button>
//                 </div>
//               ) : (
//                 <EmptyState />
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Field({ label, value, onChange, placeholder, helper }) {
//   return (
//     <div className="space-y-1.5">
//       <label className="text-sm font-medium text-[#02979B]">{label}</label>
//       <input
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         placeholder={placeholder}
//         className="w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
//       />
//       {helper ? <div className="text-xs text-[#02979B]/60">{helper}</div> : null}
//     </div>
//   );
// }

// function Spinner() {
//   return (
//     <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
//       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//       <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
//     </svg>
//   );
// }

// function EmptyState() {
//   return (
//     <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D9D9] bg-[#02979B]/5 p-8 text-center">
//       <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#02979B] shadow-sm">
//         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//           <path d="M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" strokeLinejoin="round" />
//           <path d="M15 3v5h5" strokeLinejoin="round" />
//         </svg>
//       </div>
//       <div className="mt-3 text-sm font-semibold text-[#02979B]">Sin resultados todavía</div>
//       <div className="mt-1 text-sm text-[#02979B]/60">
//         Cuando envíes el Excel, aquí se mostrará la respuesta del servidor.
//       </div>
//     </div>
//   );
// }

// function ToggleCard({ title, value, onToggle, icon }) {
//   return (
//     <div className="rounded-xl border border-[#D9D9D9] bg-white p-3">
//       <div className="flex items-center justify-between gap-3">
//         <div className="flex items-center gap-2 min-w-0">
//           <div className="shrink-0 text-[#02979B]">{icon}</div>
//           <span className="text-xs font-medium text-[#02979B] truncate">{title}</span>
//         </div>
//         <button
//           type="button"
//           onClick={onToggle}
//           className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
//             value ? "bg-[#02979B]" : "bg-[#D9D9D9]"
//           }`}
//           aria-label="toggle"
//         >
//           <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${value ? "translate-x-4" : "translate-x-1"}`} />
//         </button>
//       </div>
//     </div>
//   );
// }








































// // src/ExcelSender.jsx
// import { useMemo, useState, useCallback, useEffect } from "react";
// import { toast } from "sonner";
// import * as XLSX from 'xlsx';

// export default function ExcelSender({ employeeData }) { // 👈 RECIBIR employeeData
//   const NODES = useMemo(
//     () => [
//       { key: "n1", label: "Nodo 1", base: "https://n1.japiexcel.casamarketapp.com" },
//       { key: "n23", label: "Nodo 2 / 3", base: "https://n3.japiexcel.casamarketapp.com" },
//       { key: "n4", label: "Nodo 4", base: "https://n4.japiexcel.casamarketapp.com" },
//       { key: "n5", label: "Nodo 5", base: "https://n5.japiexcel.casamarketapp.com" },
//     ],
//     []
//   );

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
//   const [priceListId, setPriceListId] = useState("");

//   // ===== Estado para listas de precios =====
//   const [priceLists, setPriceLists] = useState([]);
//   const [loadingPriceLists, setLoadingPriceLists] = useState(false);
//   const [priceListsError, setPriceListsError] = useState("");

//   // ===== idWarehouse desde normalizer (se carga de sessionStorage) =====
//   const [idWarehouse, setIdWarehouse] = useState("");
//   const [idCountry, setIdCountry] = useState("1");
  
//   const [applyIgvCost, setApplyIgvCost] = useState(true);
//   const [applyIgvSale, setApplyIgvSale] = useState(true);
  
//   const taxCodeCountry = useMemo(() => {
//     return (!applyIgvCost && !applyIgvSale) ? "02" : "01";
//   }, [applyIgvCost, applyIgvSale]);

//   const [flagUseSimpleBrand, setFlagUseSimpleBrand] = useState(true);

//   const [fileProductos, setFileProductos] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const [error, setError] = useState("");
//   const [errorDetails, setErrorDetails] = useState(null);
//   const [result, setResult] = useState(null);

//   // ===== CARGAR DATOS DEL EMPLEADO =====
//   useEffect(() => {
//     if (employeeData) {
//       console.log("📦 Datos de empleado recibidos:", employeeData);
      
//       // Company ID
//       if (employeeData.companyId) {
//         setCompanyId(String(employeeData.companyId));
//       }
      
//       // Subsidiary ID (puede venir de diferentes lugares)
//       if (employeeData.comSubsidiariesId) {
//         setSubsidiaryId(String(employeeData.comSubsidiariesId));
//       } else if (employeeData.subsidiary?.id) {
//         setSubsidiaryId(String(employeeData.subsidiary.id));
//       }
      
//       // También podemos guardar el warehouse por defecto si existe
//       if (employeeData.warWarehousesId) {
//         setIdWarehouse(String(employeeData.warWarehousesId));
//       }
//     }
//   }, [employeeData]);

//   // ===== CARGAR ESTADO DESDE NORMALIZER (IGV y warehouse seleccionado) =====
//   useEffect(() => {
//     // Cargar valores de IGV
//     const savedApplyIgvCost = sessionStorage.getItem('applyIgvCost');
//     const savedApplyIgvSale = sessionStorage.getItem('applyIgvSale');
    
//     if (savedApplyIgvCost !== null) {
//       setApplyIgvCost(savedApplyIgvCost === 'true');
//     }
//     if (savedApplyIgvSale !== null) {
//       setApplyIgvSale(savedApplyIgvSale === 'true');
//     }
    
//     // Cargar warehouse seleccionado en normalizer
//     const selectedWarehouseId = sessionStorage.getItem('selectedWarehouseId');
//     if (selectedWarehouseId) {
//       setIdWarehouse(selectedWarehouseId);
//     }
//   }, []);

//   // ===== CARGAR LISTAS DE PRECIOS desde sessionStorage =====
//   useEffect(() => {
//     const loadPriceLists = async () => {
//       setLoadingPriceLists(true);
      
//       try {
//         // Primero intentar cargar desde sessionStorage (ya las tenemos de App.jsx)
//         const savedPriceLists = sessionStorage.getItem('priceLists');
        
//         if (savedPriceLists) {
//           const data = JSON.parse(savedPriceLists);
//           console.log("💰 LISTAS DE PRECIOS CARGADAS:", data);
//           setPriceLists(data);

//           // Auto-seleccionar
//           if (data.length === 1) {
//             setPriceListId(String(data[0].id));
//             toast.info(`Lista seleccionada: ${data[0].name}`, {
//               id: 'auto-select-pricelist'
//             });
//           } else if (data.length > 1) {
//             const defaultList = data.find(pl => pl.flagDefault === 1 || pl.flagDefault === true);
//             if (defaultList) {
//               setPriceListId(String(defaultList.id));
//               toast.info(`Lista por defecto seleccionada: ${defaultList.name}`, {
//                 id: 'default-pricelist'
//               });
//             }
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

//     loadPriceLists();
//   }, []);

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

//   const buildEndpoint = useCallback(() => {
//     return (
//       `${baseUrl}/api/excel/readexcel/${encodeURIComponent(companyId)}` +
//       `/pricelist/${encodeURIComponent(priceListId)}` +
//       `/subsidiary/${encodeURIComponent(subsidiaryId)}`
//     );
//   }, [baseUrl, companyId, priceListId, subsidiaryId]);

//   const endpointPreview =
//     companyId && priceListId && subsidiaryId ? buildEndpoint() : "";

//   const canSend =
//     !!fileProductos && !!companyId && !!priceListId && !!subsidiaryId && !loading;

//   // ======================
//   // CARGAR ARCHIVO PENDIENTE DESDE NORMALIZER
//   // ======================
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
          
//           toast.success(`Archivo "${pendingName}" listo para enviar`, {
//             duration: 3000,
//             id: 'pending-file-toast'
//           });
          
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

//   // ======================
//   // FUNCIÓN PARSE ERROR
//   // ======================
//   const parseError = (errorMessage, statusCode) => {
//     const errors = {
//       "invalid excel": "El archivo Excel tiene un formato inválido",
//       "invalid format": "Formato de archivo no soportado",
//       "missing columns": "Faltan columnas requeridas en el Excel",
//       "company not found": "El Company ID no existe en el sistema",
//       "pricelist not found": "El PriceList ID no existe o no pertenece a esta compañía",
//       "subsidiary not found": "El Subsidiary ID no existe o no pertenece a esta compañía",
//       "warehouse not found": "El Warehouse ID no existe",
//       "product not found": "Uno o más productos no existen en el sistema",
//       "sku already exists": "El SKU del producto ya está registrado",
//       "invalid price": "El precio del producto es inválido",
//       "invalid stock": "La cantidad de stock es inválida",
//       "product creation failed": "Error al crear el producto",
//       "product update failed": "Error al actualizar el producto",
//       "database error": "Error en la base de datos",
//       "server error": "Error interno del servidor",
//       "timeout": "La operación tardó demasiado tiempo",
//       "network error": "Error de conexión de red",
//     };

//     const errorLower = String(errorMessage || "").toLowerCase();
//     let foundError = null;

//     for (const [key, description] of Object.entries(errors)) {
//       if (errorLower.includes(key)) {
//         foundError = { type: key, description, details: errorMessage };
//         break;
//       }
//     }

//     if (!foundError) {
//       foundError = {
//         type: "unknown",
//         description: "Error desconocido",
//         details: errorMessage,
//       };
//     }

//     if (statusCode) {
//       foundError.statusCode = statusCode;
//       foundError.statusText = getStatusText(statusCode);
//     }

//     return foundError;
//   };

//   // ======================
//   // FUNCIÓN GET STATUS TEXT
//   // ======================
//   const getStatusText = (statusCode) => {
//     const statusMap = {
//       400: "Bad Request - La solicitud tiene errores",
//       401: "Unauthorized - No autorizado",
//       403: "Forbidden - Acceso prohibido",
//       404: "Not Found - Recurso no encontrado",
//       413: "Payload Too Large - Archivo muy grande",
//       422: "Unprocessable Entity - Error de validación",
//       500: "Internal Server Error - Error del servidor",
//       502: "Bad Gateway - Error de gateway",
//       503: "Service Unavailable - Servicio no disponible",
//       504: "Gateway Timeout - Tiempo de espera agotado",
//     };
//     return statusMap[statusCode] || `Código de error: ${statusCode}`;
//   };

//   // ======================
//   // FUNCIÓN ONSEND
//   // ======================
//   const onSend = async () => {
//     setError("");
//     setErrorDetails(null);
//     setResult(null);

//     if (!fileProductos) {
//       toast.error("Selecciona el archivo Excel");
//       setError("❌ Selecciona el archivo Excel (.xlsx o .xls).");
//       return;
//     }

//     if (!companyId || !priceListId || !subsidiaryId) {
//       const missing = [];
//       if (!companyId) missing.push("Company ID");
//       if (!priceListId) missing.push("PriceList ID");
//       if (!subsidiaryId) missing.push("Subsidiary ID");

//       toast.warning(`Completa: ${missing.join(", ")}`);
//       setError(`⚠️ Completa los campos obligatorios: ${missing.join(", ")}`);
//       return;
//     }

//     const fileName = fileProductos.name.toLowerCase();
//     if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
//       toast.error("Formato inválido: debe ser .xlsx o .xls");
//       setError("❌ El archivo debe ser un Excel (.xlsx o .xls)");
//       return;
//     }

//     try {
//       setLoading(true);

//       let fileToSend = fileProductos;
      
//       if (fileProductos.name.includes('_QA') || fileProductos.name.includes('CONVERSION')) {
//         try {
//           const data = await fileProductos.arrayBuffer();
//           const workbook = XLSX.read(data, { type: 'array' });
          
//           if (workbook.SheetNames.includes('productos')) {
//             const productosSheet = workbook.Sheets['productos'];
//             const newWorkbook = XLSX.utils.book_new();
//             XLSX.utils.book_append_sheet(newWorkbook, productosSheet, 'productos');
            
//             const wbout = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
//             fileToSend = new File([wbout], fileProductos.name.replace('_QA', '').replace('_CONVERSION', ''), { 
//               type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
//             });
            
//             toast.info("Usando solo la hoja 'productos' del archivo QA", {
//               id: 'extract-sheet-toast'
//             });
//           }
//         } catch (e) {
//           console.error("Error extrayendo hoja productos:", e);
//         }
//       }

//       const form = new FormData();
//       form.append("file_excel", fileToSend);
//       form.append("idCountry", idCountry);
//       form.append("taxCodeCountry", taxCodeCountry);
//       form.append("flagUseSimpleBrand", String(flagUseSimpleBrand));
//       if (idWarehouse) form.append("idWarehouse", idWarehouse);

//       const endpoint = buildEndpoint();
//       const res = await fetch(endpoint, { method: "POST", body: form });

//       const text = await res.text();

//       if (!res.ok) {
//         const parsedError = parseError(text, res.status);
//         setErrorDetails(parsedError);

//         let userMessage = `❌ Error ${res.status}: ${parsedError.description}`;

//         if (res.status === 404) {
//           userMessage +=
//             "\n\nPosibles causas:\n• Los IDs ingresados no existen\n• El nodo seleccionado es incorrecto\n• La ruta API ha cambiado";
//         } else if (res.status === 422) {
//           userMessage +=
//             "\n\nRevisa:\n• El formato del archivo Excel\n• Las columnas requeridas\n• Los tipos de datos en cada columna";
//         } else if (res.status === 500) {
//           userMessage +=
//             "\n\nEl servidor tuvo un problema interno. Intenta de nuevo o contacta al administrador.";
//         }

//         setError(userMessage);
//         toast.error(`Error ${res.status}: ${parsedError.description}`, {
//           id: 'error-toast'
//         });
//         throw new Error(text);
//       }

//       try {
//         const jsonResult = JSON.parse(text);
//         setResult(jsonResult);

//         const okCount = Number(
//           jsonResult?.success ??
//             jsonResult?.data?.n_products ??
//             jsonResult?.n_products ??
//             0
//         );

//         const errCount = Array.isArray(jsonResult?.errors)
//           ? jsonResult.errors.length
//           : 0;

//         if (errCount > 0) {
//           setErrorDetails({
//             type: "product_errors",
//             description: "Errores en productos específicos",
//             details: jsonResult.errors,
//             successCount: okCount,
//             errorCount: errCount,
//           });

//           setError(
//             `⚠️ Se procesaron ${okCount} productos, pero ${errCount} tuvieron errores. Revisa los detalles abajo.`
//           );

//           toast.warning(`Procesado: ${okCount} OK, ${errCount} con error`, {
//             id: 'warning-toast'
//           });
//         } else {
//           setError("");
//           toast.success(`✅ Productos subidos: ${okCount}`, {
//             id: 'success-toast'
//           });
//         }
//       } catch {
//         setResult(text);
//         setError(
//           `✅ Respuesta del servidor: ${text.substring(0, 100)}${
//             text.length > 100 ? "..." : ""
//           }`
//         );
//         toast.success("✅ Envío completado", {
//           id: 'completion-toast'
//         });
//       }
//     } catch (e) {
//       const msg = String(e?.message || "");

//       if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
//         const m =
//           "🌐 Error de conexión:\n\n• Verifica tu conexión a internet\n• El servidor del nodo podría estar caído\n• Revisa si hay problemas con CORS\n\nEndpoint: " +
//           buildEndpoint();

//         setError(m);
//         toast.error("🌐 Error de conexión con el servidor", {
//           id: 'network-error-toast'
//         });
//         return;
//       }

//       if (!errorDetails) {
//         const parsedError = parseError(msg || "Error desconocido");
//         setErrorDetails(parsedError);
//       }

//       toast.error("❌ No se pudo enviar el Excel", {
//         id: 'send-error-toast'
//       });

//       if (!error) {
//         setError("❌ Error enviando el archivo: " + (msg || "Error desconocido"));
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getSelectedPriceListName = () => {
//     if (!priceListId) return "";
//     const selected = priceLists.find(pl => String(pl.id) === String(priceListId));
//     return selected ? selected.name : "";
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-12">
//         {/* Left: form */}
//         <div className="lg:col-span-7">
//           <div className="rounded-2xl border border-[#D9D9D9] bg-white shadow-sm">
//             <div className="border-b border-[#D9D9D9] p-6">
//               <h1 className="text-lg font-semibold text-[#02979B]">
//                 Cargar archivo y enviar
//               </h1>
//               <p className="mt-1 text-sm text-[#02979B]/60">
//                 Los IDs de empresa y sucursal se cargan automáticamente
//               </p>
//             </div>

//             <div className="space-y-6 p-6">
//               {/* Nodo - Solo lectura */}
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-[#02979B]">Nodo</label>
//                 <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//                   {getNodeLabel()} — {getNodeBase().replace("https://", "")}
//                 </div>
//                 <p className="text-xs text-[#02979B]/60">
//                   Nodo determinado por la URL: {nodeKey.replace('n', 'Nodo ')}
//                 </p>
//               </div>

//               {/* IDs - Todos de solo lectura excepto PriceList */}
//               <div>
//                 <div className="mb-2 flex items-center justify-between">
//                   <label className="text-sm font-medium text-[#02979B]">IDs</label>
//                   <span className="text-xs text-[#02979B]/60">Automáticos (no editables)</span>
//                 </div>

//                 <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
//                   {/* Company ID - Solo lectura */}
//                   <div className="space-y-1.5">
//                     <label className="text-sm font-medium text-[#02979B]">Company ID</label>
//                     <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//                       {companyId || "Cargando..."}
//                     </div>
//                   </div>
                  
//                   {/* PriceList ID - SELECTOR (único editable) */}
//                   <div className="space-y-1.5">
//                     <label className="text-sm font-medium text-[#02979B]">
//                       PriceList ID <span className="text-red-500">*</span>
//                     </label>
                    
//                     {loadingPriceLists ? (
//                       <div className="flex items-center gap-2 w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//                         <Spinner />
//                         <span>Cargando listas de precios...</span>
//                       </div>
//                     ) : priceListsError ? (
//                       <div className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
//                         {priceListsError}
//                       </div>
//                     ) : priceLists.length === 0 ? (
//                       <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//                         No hay listas de precios disponibles
//                       </div>
//                     ) : (
//                       <>
//                         <select
//                           value={priceListId}
//                           onChange={(e) => setPriceListId(e.target.value)}
//                           className="w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
//                         >
//                           <option value="">Seleccione una lista de precios</option>
//                           {priceLists.map((pl) => (
//                             <option key={pl.id} value={String(pl.id)}>
//                               {pl.name} {pl.flagDefault === 1 || pl.flagDefault === true ? '(Por defecto)' : ''}
//                             </option>
//                           ))}
//                         </select>
                        
//                         {priceListId && (
//                           <div className="mt-1 text-xs text-[#02979B]/60">
//                             Seleccionado: {getSelectedPriceListName()}
//                           </div>
//                         )}
//                       </>
//                     )}
//                   </div>
                  
//                   {/* Subsidiary ID - Solo lectura */}
//                   <div className="space-y-1.5">
//                     <label className="text-sm font-medium text-[#02979B]">Subsidiary ID</label>
//                     <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//                       {subsidiaryId || "Cargando..."}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Parámetros - Todos de solo lectura excepto flagUseSimpleBrand */}
//               <div>
//                 <div className="mb-2 flex items-center justify-between">
//                   <label className="text-sm font-medium text-[#02979B]">Parámetros</label>
//                   <span className="text-xs text-[#02979B]/60">Automáticos (no editables)</span>
//                 </div>

//                 <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
//                   {/* idCountry - Solo lectura */}
//                   <div className="space-y-1.5">
//                     <label className="text-sm font-medium text-[#02979B]">idCountry</label>
//                     <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//                       {idCountry}
//                     </div>
//                   </div>
                  
//                   {/* taxCodeCountry - Solo lectura (automático) */}
//                   <div className="space-y-1.5">
//                     <label className="text-sm font-medium text-[#02979B]">taxCodeCountry</label>
//                     <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//                       {taxCodeCountry} — {taxCodeCountry === "01" ? "IGV" : "Exonerado"}
//                     </div>
//                     <div className="text-xs text-[#02979B]/60">
//                       {taxCodeCountry === "01" 
//                         ? "🔵 IGV aplicado (al menos un toggle activo)" 
//                         : "🟢 Exonerado (ambos toggles desactivados)"}
//                     </div>
//                   </div>
                  
//                   {/* idWarehouse - Solo lectura (viene de normalizer) */}
//                   <div className="space-y-1.5">
//                     <label className="text-sm font-medium text-[#02979B]">idWarehouse</label>
//                     <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
//                       {idWarehouse || "No seleccionado"}
//                     </div>
//                     <div className="text-xs text-[#02979B]/60">
//                       Almacén seleccionado en normalización
//                     </div>
//                   </div>
//                 </div>

//                 {/* flagUseSimpleBrand - EDITABLE (toggle) */}
//                 <div className="mt-4 flex items-center justify-between rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-4 py-3">
//                   <div className="flex items-center gap-2">
//                     <div className="text-[#02979B]">
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                         <path d="M7 7h10v10H7z" strokeLinecap="round" strokeLinejoin="round"/>
//                       </svg>
//                     </div>
//                     <div>
//                       <div className="text-sm font-medium text-[#02979B]">flagUseSimpleBrand</div>
//                       <div className="text-xs text-[#02979B]/60">
//                         Envía <span className="font-mono">true/false</span> al backend.
//                       </div>
//                     </div>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={() => setFlagUseSimpleBrand((v) => !v)}
//                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
//                       flagUseSimpleBrand ? "bg-[#02979B]" : "bg-[#D9D9D9]"
//                     }`}
//                     aria-label="Toggle flagUseSimpleBrand"
//                   >
//                     <span
//                       className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
//                         flagUseSimpleBrand ? "translate-x-5" : "translate-x-1"
//                       }`}
//                     />
//                   </button>
//                 </div>
//               </div>

//               {/* Archivo */}
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-[#02979B]">Archivo Excel</label>

//                 <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D9D9] bg-white p-8 text-center transition hover:border-[#02979B] hover:bg-[#02979B]/5">
//                   <input
//                     type="file"
//                     accept=".xlsx,.xls"
//                     className="hidden"
//                     onChange={(e) => setFileProductos(e.target.files?.[0] ?? null)}
//                   />

//                   <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D9D9D9] text-[#02979B] transition group-hover:bg-[#02979B] group-hover:text-white">
//                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                       <path d="M12 16V4m0 0 4 4M12 4 8 8" strokeLinecap="round" strokeLinejoin="round" />
//                       <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
//                     </svg>
//                   </div>

//                   <div className="mt-3 text-sm font-semibold text-[#02979B]">
//                     {fileProductos ? fileProductos.name : "Seleccionar archivo .xlsx / .xls"}
//                   </div>
//                   <div className="mt-1 text-xs text-[#02979B]/60">
//                     Se enviará como <span className="font-mono">file_excel</span> (multipart/form-data)
//                   </div>
//                 </label>
//               </div>

//               {/* Error principal */}
//               {error && (
//                 <div className="rounded-xl border border-red-200 bg-red-50 p-4">
//                   <div className="flex items-start gap-3">
//                     <div className="mt-0.5 text-red-700">
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                         <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
//                       </svg>
//                     </div>
//                     <div className="flex-1">
//                       <div className="text-sm font-semibold text-red-800">Mensaje</div>
//                       <div className="mt-1 whitespace-pre-wrap text-sm text-red-700">{error}</div>

//                       {errorDetails && (
//                         <button
//                           onClick={() => {
//                             const textToCopy = `Error: ${error}\n\nDetalles: ${JSON.stringify(
//                               errorDetails,
//                               null,
//                               2
//                             )}\n\nEndpoint: ${buildEndpoint()}`;
//                             navigator.clipboard.writeText(textToCopy);
//                             toast.success("Copiado al portapapeles", {
//                               id: 'copy-toast'
//                             });
//                           }}
//                           className="mt-2 inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
//                         >
//                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                             <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1M8 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M8 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round"/>
//                           </svg>
//                           Copiar detalles del error
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Actions */}
//               <div className="flex flex-col gap-3 md:flex-row md:items-center">
//                 <button
//                   type="button"
//                   onClick={onSend}
//                   disabled={!canSend}
//                   className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition md:w-auto ${
//                     canSend ? "bg-[#02979B] hover:bg-[#02979B]/80" : "bg-[#D9D9D9] cursor-not-allowed"
//                   }`}
//                 >
//                   {loading ? (
//                     <>
//                       <Spinner />
//                       Enviando...
//                     </>
//                   ) : (
//                     <>
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                         <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
//                         <path d="M22 2 15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
//                       </svg>
//                       Enviar Excel
//                     </>
//                   )}
//                 </button>

//                 <div className="flex-1 rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-4 py-3">
//                   <div className="flex items-center gap-2 text-xs font-medium text-[#02979B]">
//                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                       <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" strokeLinecap="round" strokeLinejoin="round" />
//                       <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" strokeLinecap="round" strokeLinejoin="round" />
//                     </svg>
//                     Endpoint
//                   </div>
//                   <div className="mt-1 break-all font-mono text-xs text-[#02979B]">
//                     {endpointPreview || "Completa los IDs para ver el endpoint"}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Right: response */}
//         <div className="lg:col-span-5">
//           <div className="rounded-2xl border border-[#D9D9D9] bg-white shadow-sm">
//             <div className="border-b border-[#D9D9D9] p-6">
//               <h2 className="text-lg font-semibold text-[#02979B]">Respuesta del servidor</h2>
//               <p className="mt-1 text-sm text-[#02979B]/60">
//                 Verifica si el backend retornó JSON o texto.
//               </p>
//             </div>

//             <div className="p-6">
//               {result ? (
//                 <div>
//                   <pre className="max-h-[560px] overflow-auto rounded-2xl border border-[#D9D9D9] bg-[#02979B]/5 p-4 text-xs text-[#02979B]">
//                     {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
//                   </pre>

//                   <button
//                     onClick={() => {
//                       const textToCopy =
//                         typeof result === "string" ? result : JSON.stringify(result, null, 2);
//                       navigator.clipboard.writeText(textToCopy);
//                       toast.success("Respuesta copiada", {
//                         id: 'copy-response-toast'
//                       });
//                     }}
//                     className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#02979B]/10 px-3 py-1 text-xs font-medium text-[#02979B] hover:bg-[#02979B]/20"
//                   >
//                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                       <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1M8 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M8 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round"/>
//                     </svg>
//                     Copiar respuesta completa
//                   </button>
//                 </div>
//               ) : (
//                 <EmptyState />
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Field({ label, value, onChange, placeholder, helper }) {
//   return (
//     <div className="space-y-1.5">
//       <label className="text-sm font-medium text-[#02979B]">{label}</label>
//       <input
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         placeholder={placeholder}
//         className="w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
//       />
//       {helper ? <div className="text-xs text-[#02979B]/60">{helper}</div> : null}
//     </div>
//   );
// }

// function Spinner() {
//   return (
//     <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
//       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//       <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
//     </svg>
//   );
// }

// function EmptyState() {
//   return (
//     <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D9D9] bg-[#02979B]/5 p-8 text-center">
//       <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#02979B] shadow-sm">
//         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//           <path d="M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" strokeLinejoin="round" />
//           <path d="M15 3v5h5" strokeLinejoin="round" />
//         </svg>
//       </div>
//       <div className="mt-3 text-sm font-semibold text-[#02979B]">Sin resultados todavía</div>
//       <div className="mt-1 text-sm text-[#02979B]/60">
//         Cuando envíes el Excel, aquí se mostrará la respuesta del servidor.
//       </div>
//     </div>
//   );
// }

// function ToggleCard({ title, value, onToggle, icon }) {
//   return (
//     <div className="rounded-xl border border-[#D9D9D9] bg-white p-3">
//       <div className="flex items-center justify-between gap-3">
//         <div className="flex items-center gap-2 min-w-0">
//           <div className="shrink-0 text-[#02979B]">{icon}</div>
//           <span className="text-xs font-medium text-[#02979B] truncate">{title}</span>
//         </div>
//         <button
//           type="button"
//           onClick={onToggle}
//           className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
//             value ? "bg-[#02979B]" : "bg-[#D9D9D9]"
//           }`}
//           aria-label="toggle"
//         >
//           <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${value ? "translate-x-4" : "translate-x-1"}`} />
//         </button>
//       </div>
//     </div>
//   );
// }

























// src/ExcelSender.jsx
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

  // ===== NUEVOS ESTADOS PARA EL PROGRESO =====
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
  const [priceListId, setPriceListId] = useState("");

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

          if (data.length === 1) {
            setPriceListId(String(data[0].id));
            toast.info(`Lista seleccionada: ${data[0].name}`);
          } else if (data.length > 1) {
            const defaultList = data.find(pl => pl.flagDefault === 1 || pl.flagDefault === true);
            if (defaultList) {
              setPriceListId(String(defaultList.id));
              toast.info(`Lista por defecto seleccionada: ${defaultList.name}`);
            }
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

    loadPriceLists();
  }, []);

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

  const buildEndpoint = useCallback(() => {
    return (
      `${baseUrl}/api/excel/readexcel/${encodeURIComponent(companyId)}` +
      `/pricelist/${encodeURIComponent(priceListId)}` +
      `/subsidiary/${encodeURIComponent(subsidiaryId)}`
    );
  }, [baseUrl, companyId, priceListId, subsidiaryId]);

  const endpointPreview =
    companyId && priceListId && subsidiaryId ? buildEndpoint() : "";

  const canSend =
    !!fileProductos && !!companyId && !!priceListId && !!subsidiaryId && !loading;

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

  // ===== FUNCIÓN PARSE ERROR =====
  const parseError = (errorMessage, statusCode) => {
    const errors = {
      "invalid excel": "El archivo Excel tiene un formato inválido",
      "invalid format": "Formato de archivo no soportado",
      "missing columns": "Faltan columnas requeridas en el Excel",
      "company not found": "El Company ID no existe en el sistema",
      "pricelist not found": "El PriceList ID no existe o no pertenece a esta compañía",
      "subsidiary not found": "El Subsidiary ID no existe o no pertenece a esta compañía",
      "warehouse not found": "El Warehouse ID no existe",
      "product not found": "Uno o más productos no existen en el sistema",
      "sku already exists": "El SKU del producto ya está registrado",
      "invalid price": "El precio del producto es inválido",
      "invalid stock": "La cantidad de stock es inválida",
      "product creation failed": "Error al crear el producto",
      "product update failed": "Error al actualizar el producto",
      "database error": "Error en la base de datos",
      "server error": "Error interno del servidor",
      "timeout": "La operación tardó demasiado tiempo",
      "network error": "Error de conexión de red",
    };

    const errorLower = String(errorMessage || "").toLowerCase();
    let foundError = null;

    for (const [key, description] of Object.entries(errors)) {
      if (errorLower.includes(key)) {
        foundError = { type: key, description, details: errorMessage };
        break;
      }
    }

    if (!foundError) {
      foundError = {
        type: "unknown",
        description: "Error desconocido",
        details: errorMessage,
      };
    }

    if (statusCode) {
      foundError.statusCode = statusCode;
      foundError.statusText = getStatusText(statusCode);
    }

    return foundError;
  };

  // ===== FUNCIÓN GET STATUS TEXT =====
  const getStatusText = (statusCode) => {
    const statusMap = {
      400: "Bad Request - La solicitud tiene errores",
      401: "Unauthorized - No autorizado",
      403: "Forbidden - Acceso prohibido",
      404: "Not Found - Recurso no encontrado",
      413: "Payload Too Large - Archivo muy grande",
      422: "Unprocessable Entity - Error de validación",
      500: "Internal Server Error - Error del servidor",
      502: "Bad Gateway - Error de gateway",
      503: "Service Unavailable - Servicio no disponible",
      504: "Gateway Timeout - Tiempo de espera agotado",
    };
    return statusMap[statusCode] || `Código de error: ${statusCode}`;
  };

  // ===== NUEVA FUNCIÓN PARA ENVIAR EN BLOQUES DE 200 =====
  const sendInBlocks = async () => {
    setError("");
    setErrorDetails(null);
    setResult(null);
    setBlockResults([]);
    setProgress(0);
    setLoading(true);

    try {
      // Leer el Excel completo
      const data = await fileProductos.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Asegurarse de que existe la hoja 'productos'
      if (!workbook.SheetNames.includes('productos')) {
        throw new Error("El Excel no tiene una hoja llamada 'productos'");
      }
      
      const sheet = workbook.Sheets['productos'];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      const totalRows = jsonData.length;
      const BLOCK_SIZE = 200; // 👈 TAMAÑO DEL BLOQUE: 200 productos
      const totalBlocks = Math.ceil(totalRows / BLOCK_SIZE);
      
      setTotalBlocks(totalBlocks);
      
      console.log(`📊 Total productos: ${totalRows}`);
      console.log(`📦 Enviando en ${totalBlocks} bloques de ${BLOCK_SIZE}`);
      
      toast.info(`Procesando ${totalRows} productos en ${totalBlocks} bloques de 200...`);
      
      let allResults = [];
      let successCount = 0;
      let errorCount = 0;
      
      // Enviar cada bloque
      for (let blockNum = 0; blockNum < totalBlocks; blockNum++) {
        const start = blockNum * BLOCK_SIZE;
        const end = Math.min(start + BLOCK_SIZE, totalRows);
        const blockData = jsonData.slice(start, end);
        
        // Actualizar progreso
        setCurrentBlock(blockNum + 1);
        const progressPercent = Math.round(((blockNum) / totalBlocks) * 100);
        setProgress(progressPercent);
        
        toast.info(`Enviando bloque ${blockNum + 1} de ${totalBlocks} (${blockData.length} productos)...`);
        
        // Crear Excel solo con este bloque
        const blockSheet = XLSX.utils.json_to_sheet(blockData);
        const blockWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(blockWorkbook, blockSheet, 'productos');
        const blockExcel = XLSX.write(blockWorkbook, { bookType: 'xlsx', type: 'array' });
        const blockFile = new File([blockExcel], `bloque_${blockNum + 1}.xlsx`, { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        // Preparar FormData
        const form = new FormData();
        form.append("file_excel", blockFile);
        form.append("idCountry", idCountry);
        form.append("taxCodeCountry", taxCodeCountry);
        form.append("flagUseSimpleBrand", String(flagUseSimpleBrand));
        if (idWarehouse) form.append("idWarehouse", idWarehouse);
        
        // Enviar bloque directamente a la API
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
        
        // Registrar resultado del bloque
        const blockSuccess = blockResult?.data?.n_products || 0;
        successCount += blockSuccess;
        
        const blockInfo = {
          block: blockNum + 1,
          success: res.ok,
          status: res.status,
          data: blockResult,
          products: blockData.length,
          successful: blockSuccess
        };
        
        allResults.push(blockInfo);
        setBlockResults([...allResults]);
        
        if (!res.ok) {
          errorCount++;
          console.error(`❌ Bloque ${blockNum + 1} falló:`, blockResult);
        } else {
          console.log(`✅ Bloque ${blockNum + 1} completado: ${blockSuccess} productos`);
        }
        
        // Pequeña pausa para no saturar el servidor
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Resultado final
      setProgress(100);
      setResult({
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

  const getSelectedPriceListName = () => {
    if (!priceListId) return "";
    const selected = priceLists.find(pl => String(pl.id) === String(priceListId));
    return selected ? selected.name : "";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-12">
        {/* Left: form */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-[#D9D9D9] bg-white shadow-sm">
            <div className="border-b border-[#D9D9D9] p-6">
              <h1 className="text-lg font-semibold text-[#02979B]">
                Cargar archivo y enviar
              </h1>
              <p className="mt-1 text-sm text-[#02979B]/60">
                Los IDs de empresa y sucursal se cargan automáticamente
              </p>
            </div>

            <div className="space-y-6 p-6">
              {/* Nodo - Solo lectura */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#02979B]">Nodo</label>
                <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
                  {getNodeLabel()} — {getNodeBase().replace("https://", "")}
                </div>
                <p className="text-xs text-[#02979B]/60">
                  Nodo determinado por la URL: {nodeKey.replace('n', 'Nodo ')}
                </p>
              </div>

              {/* IDs */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-[#02979B]">IDs</label>
                  <span className="text-xs text-[#02979B]/60">Automáticos (no editables)</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {/* Company ID */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#02979B]">Company ID</label>
                    <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
                      {companyId || "Cargando..."}
                    </div>
                  </div>
                  
                  {/* PriceList ID */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#02979B]">
                      PriceList ID <span className="text-red-500">*</span>
                    </label>
                    
                    {loadingPriceLists ? (
                      <div className="flex items-center gap-2 w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
                        <Spinner />
                        <span>Cargando listas de precios...</span>
                      </div>
                    ) : priceListsError ? (
                      <div className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {priceListsError}
                      </div>
                    ) : priceLists.length === 0 ? (
                      <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
                        No hay listas de precios disponibles
                      </div>
                    ) : (
                      <>
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
                            Seleccionado: {getSelectedPriceListName()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Subsidiary ID */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#02979B]">Subsidiary ID</label>
                    <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
                      {subsidiaryId || "Cargando..."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parámetros */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-[#02979B]">Parámetros</label>
                  <span className="text-xs text-[#02979B]/60">Automáticos (no editables)</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#02979B]">idCountry</label>
                    <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
                      {idCountry}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#02979B]">taxCodeCountry</label>
                    <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
                      {taxCodeCountry} — {taxCodeCountry === "01" ? "IGV" : "Exonerado"}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#02979B]">idWarehouse</label>
                    <div className="w-full rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-3 py-2 text-sm text-[#02979B]">
                      {idWarehouse || "No seleccionado"}
                    </div>
                  </div>
                </div>

                {/* flagUseSimpleBrand */}
                <div className="mt-4 flex items-center justify-between rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="text-[#02979B]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 7h10v10H7z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#02979B]">flagUseSimpleBrand</div>
                      <div className="text-xs text-[#02979B]/60">
                        Envía <span className="font-mono">true/false</span> al backend.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFlagUseSimpleBrand((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      flagUseSimpleBrand ? "bg-[#02979B]" : "bg-[#D9D9D9]"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        flagUseSimpleBrand ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Archivo */}
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
                    Se enviará en bloques de 200 productos
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
                  
                  {/* Resultados parciales */}
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
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <button
                  type="button"
                  onClick={sendInBlocks} // 👈 AHORA USA LA NUEVA FUNCIÓN
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
                      Enviar Excel (bloques de 200)
                    </>
                  )}
                </button>

                <div className="flex-1 rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#02979B]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Envío por bloques
                  </div>
                  <div className="mt-1 text-xs text-[#02979B]">
                    Divide automáticamente en bloques de 200 productos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: response */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-[#D9D9D9] bg-white shadow-sm">
            <div className="border-b border-[#D9D9D9] p-6">
              <h2 className="text-lg font-semibold text-[#02979B]">Respuesta del servidor</h2>
              <p className="mt-1 text-sm text-[#02979B]/60">
                Resultado del envío por bloques
              </p>
            </div>

            <div className="p-6">
              {result ? (
                <div>
                  <pre className="max-h-[560px] overflow-auto rounded-2xl border border-[#D9D9D9] bg-[#02979B]/5 p-4 text-xs text-[#02979B]">
                    {JSON.stringify(result, null, 2)}
                  </pre>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                      toast.success("Respuesta copiada");
                    }}
                    className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#02979B]/10 px-3 py-1 text-xs font-medium text-[#02979B] hover:bg-[#02979B]/20"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1M8 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M8 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copiar respuesta
                  </button>
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, helper }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#02979B]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
      />
      {helper ? <div className="text-xs text-[#02979B]/60">{helper}</div> : null}
    </div>
  );
}

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





