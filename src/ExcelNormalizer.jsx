// // src/ExcelNormalizer.jsx
// import { useMemo, useState, useEffect } from "react";
// import { toast } from "sonner";
// import Spinner from './Spinner';

// export default function ExcelNormalizer({ onNavigateToCarga, warehouses = [] }) {
//   const API = useMemo(() => "http://127.0.0.1:8000", []);
//   const DEFAULT_ROUND = 2;

//   // ===== Modo (NORMAL vs CONVERSION) =====
//   const [mode, setMode] = useState("NORMAL");

//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [uploadId, setUploadId] = useState(null);
  
//   // ===== Duplicados por NOMBRE =====
//   const [groups, setGroups] = useState([]);
  
//   // ===== Duplicados por CÓDIGO =====
//   const [codeGroups, setCodeGroups] = useState([]);
  
//   // ===== Selección UNIFICADA =====
//   const [selected, setSelected] = useState(() => new Set());

//   // ===== IGV activos por defecto =====
//   const [applyIgvCost, setApplyIgvCost] = useState(true);
//   const [applyIgvSale, setApplyIgvSale] = useState(true);

//   // ===== Almacén seleccionado =====
//   const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
//   const [selectedWarehouseName, setSelectedWarehouseName] = useState("");

//   const [openGroups, setOpenGroups] = useState(() => new Set());
//   const [openCodeGroups, setOpenCodeGroups] = useState(() => new Set());
//   const [selectAllEnabled, setSelectAllEnabled] = useState(false);

//   // ===== Estado para mostrar alerta de duplicados =====
//   const [showDuplicatesAlert, setShowDuplicatesAlert] = useState(false);

//   // Auto seleccionar si solo hay un almacén
//   useEffect(() => {
//     if (warehouses.length === 1) {
//       setSelectedWarehouseId(String(warehouses[0].id));
//       setSelectedWarehouseName((warehouses[0].name || "").trim());
      
//       sessionStorage.setItem('selectedWarehouseId', String(warehouses[0].id));
//     }
//   }, [warehouses]);

//   const resetDuplicatesUI = () => {
//     setGroups([]);
//     setCodeGroups([]);
//     setSelected(new Set());
//     setOpenGroups(new Set());
//     setOpenCodeGroups(new Set());
//     setShowDuplicatesAlert(false);
//   };

//   const toggleRow = (rowId) => {
//     setSelected((prev) => {
//       const next = new Set(prev);
//       if (next.has(rowId)) next.delete(rowId);
//       else next.add(rowId);
//       return next;
//     });
//   };

//   // Función para obtener todas las filas de ambos tipos de grupos
//   const getAllRowsFromAllGroups = () => {
//     const allRows = new Set();
    
//     // Filas de grupos por nombre
//     for (const g of groups) {
//       for (const r of g.rows || []) {
//         if (r.__ROW_ID__) allRows.add(r.__ROW_ID__);
//       }
//     }
    
//     // Filas de grupos por código
//     for (const g of codeGroups) {
//       for (const r of g.rows || []) {
//         if (r.fila) allRows.add(r.fila);
//       }
//     }
    
//     return allRows;
//   };

//   const toggleSelectAll = () => {
//     setSelectAllEnabled((prev) => {
//       const nextValue = !prev;
//       if (nextValue) {
//         const allRows = getAllRowsFromAllGroups();
//         setSelected(allRows);
//       } else {
//         setSelected(new Set());
//       }
//       return nextValue;
//     });
//   };

//   // ===== VALIDACIÓN PARA AMBOS TIPOS =====
//   const validateSelection = () => {
//     const invalidNameGroups = [];
//     const invalidCodeGroups = [];
    
//     // Validar grupos por nombre
//     for (const g of groups) {
//       const hasOne = g.rows.some((r) => selected.has(r.__ROW_ID__));
//       if (!hasOne) {
//         invalidNameGroups.push(g.key);
//       }
//     }
    
//     // Validar grupos por código
//     for (const g of codeGroups) {
//       const hasOne = g.rows.some((r) => selected.has(r.fila));
//       if (!hasOne) {
//         invalidCodeGroups.push(g.codigo);
//       }
//     }
    
//     return {
//       isValid: invalidNameGroups.length === 0 && invalidCodeGroups.length === 0,
//       invalidNameGroups,
//       invalidCodeGroups
//     };
//   };

//   const toggleGroupOpen = (key) => {
//     setOpenGroups((prev) => {
//       const next = new Set(prev);
//       if (next.has(key)) next.delete(key);
//       else next.add(key);
//       return next;
//     });
//   };

//   const toggleCodeGroupOpen = (codigo) => {
//     setOpenCodeGroups((prev) => {
//       const next = new Set(prev);
//       if (next.has(codigo)) next.delete(codigo);
//       else next.add(codigo);
//       return next;
//     });
//   };

//   // Validar almacén
//   const validateWarehouse = () => {
//     if (!selectedWarehouseId) {
//       toast.error("Debe seleccionar un almacén");
//       return false;
//     }
//     if (!selectedWarehouseName || !selectedWarehouseName.trim()) {
//       toast.error("No se pudo obtener el nombre del almacén");
//       return false;
//     }
//     return true;
//   };

//   // Guardar estado
//   const saveState = () => {
//     sessionStorage.setItem('applyIgvCost', String(applyIgvCost));
//     sessionStorage.setItem('applyIgvSale', String(applyIgvSale));
    
//     if (selectedWarehouseId) {
//       sessionStorage.setItem('selectedWarehouseId', selectedWarehouseId);
//     }
//   };

//   // Descarga NORMAL
//   const downloadNormalizedNormal = async (rowIds, forcedUploadId = null) => {
//     if (!validateWarehouse()) return;

//     const effectiveUploadId = forcedUploadId ?? uploadId;
//     if (!effectiveUploadId)
//       throw new Error("Primero debes subir y analizar el archivo (uploadId vacío).");

//     const qs =
//       `&round_numeric=${DEFAULT_ROUND}` +
//       `&apply_igv_cost=${applyIgvCost ? "true" : "false"}` +
//       `&apply_igv_sale=${applyIgvSale ? "true" : "false"}` +
//       `&is_selva=false` +
//       `&warehouse_id=${encodeURIComponent(selectedWarehouseId)}` +
//       `&tienda_nombre=${encodeURIComponent(selectedWarehouseName)}`;

//     const url = `${API}/excel/normalize?upload_id=${encodeURIComponent(effectiveUploadId)}${qs}`;

//     const res = await fetch(url, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(rowIds),
//     });

//     if (!res.ok) {
//       const t = await res.text().catch(() => "");
//       throw new Error(`Backend respondió ${res.status}. ${t || ""}`);
//     }

//     const blob = await res.blob();

//     const reader = new FileReader();
//     reader.readAsDataURL(blob);
//     reader.onloadend = () => {
//       const base = (file?.name || "archivo").replace(/\.xlsx$/i, "");
//       sessionStorage.setItem("pendingExcel", reader.result);
//       sessionStorage.setItem("pendingExcelName", `${base}_QA.xlsx`);
      
//       saveState();
//     };

//     const urlBlob = window.URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = urlBlob;

//     const base = (file?.name || "archivo").replace(/\.xlsx$/i, "");
//     a.download = `${base}_QA.xlsx`;

//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//     window.URL.revokeObjectURL(urlBlob);

//     resetDuplicatesUI();
//     setSelectAllEnabled(false);

//     if (onNavigateToCarga) {
//       setTimeout(() => {
//         onNavigateToCarga();
//       }, 800);
//     }
//   };

//   // Descarga CONVERSION
//   const downloadConversion = async (rowIdsCsv = "") => {
//     if (!validateWarehouse()) return;
//     if (!file) throw new Error("Selecciona un archivo Excel (.xlsx)");

//     const form = new FormData();
//     form.append("file", file);

//     const qs =
//       `?round_numeric=${DEFAULT_ROUND}` +
//       `&apply_igv_cost=${applyIgvCost ? "true" : "false"}` +
//       `&apply_igv_sale=${applyIgvSale ? "true" : "false"}` +
//       `&is_selva=false` +
//       `&warehouse_id=${encodeURIComponent(selectedWarehouseId)}` +
//       `&tienda_nombre=${encodeURIComponent(selectedWarehouseName)}` +
//       (rowIdsCsv ? `&selected_row_ids=${encodeURIComponent(rowIdsCsv)}` : "");

//     const url = `${API}/conversion/excel${qs}`;

//     const res = await fetch(url, { method: "POST", body: form });

//     if (!res.ok) {
//       const t = await res.text().catch(() => "");
//       throw new Error(`Backend respondió ${res.status}. ${t || ""}`);
//     }

//     const blob = await res.blob();

//     const reader = new FileReader();
//     reader.readAsDataURL(blob);
//     reader.onloadend = () => {
//       const base = (file?.name || "archivo").replace(/\.xlsx$/i, "");
//       sessionStorage.setItem("pendingExcel", reader.result);
//       sessionStorage.setItem("pendingExcelName", `${base}_CONVERSION_QA.xlsx`);
      
//       saveState();
//     };

//     const urlBlob = window.URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = urlBlob;

//     const base = (file?.name || "archivo").replace(/\.xlsx$/i, "");
//     a.download = `${base}_CONVERSION_QA.xlsx`;

//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//     window.URL.revokeObjectURL(urlBlob);

//     resetDuplicatesUI();
//     setSelectAllEnabled(false);

//     if (onNavigateToCarga) {
//       setTimeout(() => {
//         onNavigateToCarga();
//       }, 800);
//     }
//   };

//   // Submit principal
//   const onAnalyze = async (e) => {
//     e.preventDefault();

//     if (!validateWarehouse()) return;

//     setError("");
//     resetDuplicatesUI();
//     setUploadId(null);

//     if (!file) {
//       setError("Selecciona un archivo Excel (.xlsx)");
//       return;
//     }

//     try {
//       setLoading(true);

//       if (mode === "CONVERSION") {
//         const form = new FormData();
//         form.append("file", file);

//         const res = await fetch(`${API}/conversion/analyze`, {
//           method: "POST",
//           body: form,
//         });

//         if (!res.ok) {
//           const t = await res.text().catch(() => "");
//           throw new Error(`Backend respondió ${res.status}. ${t || ""}`);
//         }

//         const data = await res.json();

//         const nextGroups = data.groups || [];
//         const nextCodeGroups = data.code_duplicate_groups || [];
        
//         setGroups(nextGroups);
//         setCodeGroups(nextCodeGroups);

//         if (nextGroups.length > 0 || nextCodeGroups.length > 0) {
//           setShowDuplicatesAlert(true);
//         }

//         if (nextGroups.length > 0) setOpenGroups(new Set([nextGroups[0].key]));
//         if (nextCodeGroups.length > 0) setOpenCodeGroups(new Set([nextCodeGroups[0].codigo]));
        
//         // Si no hay duplicados de ningún tipo, descargar directamente
//         if (!data.has_duplicates && !data.has_code_duplicates) {
//           await downloadConversion("");
//           return;
//         }
        
//         return;
//       }

//       const form = new FormData();
//       form.append("file", file);

//       const res = await fetch(`${API}/excel/analyze?round_numeric=${DEFAULT_ROUND}`, {
//         method: "POST",
//         body: form,
//       });

//       if (!res.ok) {
//         const t = await res.text().catch(() => "");
//         throw new Error(`Backend respondió ${res.status}. ${t || ""}`);
//       }

//       const data = await res.json();
//       setUploadId(data.upload_id);

//       const nextGroups = data.groups || [];
//       const nextCodeGroups = data.code_duplicate_groups || [];
      
//       setGroups(nextGroups);
//       setCodeGroups(nextCodeGroups);

//       if (nextGroups.length > 0 || nextCodeGroups.length > 0) {
//         setShowDuplicatesAlert(true);
//       }

//       if (nextGroups.length > 0) setOpenGroups(new Set([nextGroups[0].key]));
//       if (nextCodeGroups.length > 0) setOpenCodeGroups(new Set([nextCodeGroups[0].codigo]));
      
//       // Si no hay duplicados de ningún tipo, descargar directamente
//       if (!data.has_duplicates && !data.has_code_duplicates) {
//         await downloadNormalizedNormal([], data.upload_id);
//         return;
//       }
      
//     } catch (err) {
//       setError(err?.message || "Error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onContinueWithSelection = async () => {
//     setError("");

//     if (!validateWarehouse()) return;

//     const validation = validateSelection();
    
//     if (!validation.isValid) {
//       // Construir mensaje con ambos tipos de grupos faltantes
//       let errorMessage = "No se puede continuar. Debe seleccionar al menos una fila por cada grupo duplicado.\n\n";
      
//       if (validation.invalidNameGroups.length > 0) {
//         errorMessage += `Nombres pendientes: ${validation.invalidNameGroups.length}\n`;
//       }
      
//       if (validation.invalidCodeGroups.length > 0) {
//         errorMessage += `Códigos pendientes: ${validation.invalidCodeGroups.length}`;
//       }
      
//       setError(errorMessage);
      
//       toast.error(errorMessage, {
//         duration: 5000
//       });
      
//       return;
//     }

//     try {
//       setLoading(true);

//       const ids = Array.from(selected);

//       if (mode === "NORMAL") {
//         await downloadNormalizedNormal(ids);
//       } else {
//         const csv = ids.join(",");
//         await downloadConversion(csv);
//       }
//     } catch (err) {
//       setError(err?.message || "Error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const hasDuplicates = groups.length > 0;
//   const hasCodeDuplicates = codeGroups.length > 0;

//   // Manejar cambio de almacén
//   const handleWarehouseChange = (e) => {
//     const warehouseId = e.target.value;
//     setSelectedWarehouseId(warehouseId);

//     const warehouse = warehouses.find((w) => String(w.id) === String(warehouseId));
//     const warehouseName = (warehouse?.name || "").trim();
//     setSelectedWarehouseName(warehouseName);
    
//     if (warehouseId) {
//       sessionStorage.setItem('selectedWarehouseId', warehouseId);
//     }
//   };

//   // Verificar si hay grupos sin selección
//   const validationResult = validateSelection();
//   const hasInvalidGroups = !validationResult.isValid;

//   return (
//     <div className="w-full">
//       <form onSubmit={onAnalyze} className="space-y-6">
//         {/* Selector Modo */}
//         <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
//           <div className="text-sm font-semibold text-[#02979B]">Tipo de carga</div>
//           <div className="mt-3 grid gap-2 md:grid-cols-2">
//             <ModeButton
//               active={mode === "NORMAL"}
//               onClick={() => setMode("NORMAL")}
//               title="Carga normal"
//               desc="Analiza duplicados por nombre y descarga QA."
//             />
//             <ModeButton
//               active={mode === "CONVERSION"}
//               onClick={() => setMode("CONVERSION")}
//               title="Por conversión"
//               desc="Analiza duplicados por nombre y descarga QA (con selección)."
//             />
//           </div>
//         </div>

//         {/* File */}
//         <div className="space-y-2">
//           <label className="text-sm font-medium text-[#02979B]">Archivo Excel (.xlsx)</label>

//           <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D9D9] bg-white p-8 text-center transition hover:border-[#02979B] hover:bg-[#02979B]/5">
//             <input
//               type="file"
//               accept=".xlsx"
//               className="hidden"
//               onChange={(e) => setFile(e.target.files?.[0] ?? null)}
//             />

//             <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D9D9D9] text-[#02979B] transition group-hover:bg-[#02979B] group-hover:text-white">
//               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M12 16V4m0 0 4 4M12 4 8 8" strokeLinecap="round" strokeLinejoin="round" />
//                 <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
//               </svg>
//             </div>

//             <div className="mt-3 text-sm font-semibold text-[#02979B]">
//               {file ? file.name : "Seleccionar archivo .xlsx"}
//             </div>
//             <div className="mt-1 text-xs text-[#02979B]/60">
//               Endpoint:{" "}
//               <span className="font-mono break-all">
//                 {mode === "NORMAL" ? `${API}/excel/analyze` : `${API}/conversion/analyze`}
//               </span>
//             </div>
//           </label>
//         </div>

//         {/* Mensaje informativo Selva */}
//         <div className="rounded-2xl border-2 border-[#02979B] bg-[#02979B]/5 p-4">
//           <div className="flex items-center gap-3">
//             <div className="text-[#02979B]">
//               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path
//                   d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//             </div>
//             <div className="text-sm text-[#02979B]">
//               <span className="font-semibold">Información:</span> Si eres de la selva, recuerda que estás exonerado del IGV.
//             </div>
//           </div>
//         </div>

//         {/* IGV toggles */}
//         <div className="grid gap-3 md:grid-cols-3">
//           <ToggleCard
//             title="Aplicar IGV (1.18) a Precio Costo"
//             value={applyIgvCost}
//             onToggle={() => setApplyIgvCost((v) => !v)}
//             icon={
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M12 2v20M17 5H9.5M17 12h-5M17 19h-5" strokeLinecap="round" />
//               </svg>
//             }
//           />
//           <ToggleCard
//             title="Aplicar IGV (1.18) a Precio Venta"
//             value={applyIgvSale}
//             onToggle={() => setApplyIgvSale((v) => !v)}
//             icon={
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M20 12H4M12 4v16" strokeLinecap="round" />
//               </svg>
//             }
//           />
//           <ToggleCard
//             title="Seleccionar todo (duplicados)"
//             value={selectAllEnabled}
//             onToggle={toggleSelectAll}
//             disabled={!hasDuplicates && !hasCodeDuplicates}
//             icon={
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
//                 <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
//               </svg>
//             }
//           />
//         </div>

//         {/* Nombre de la tienda / Almacén */}
//         <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
//           <div className="flex items-start justify-between gap-4">
//             <div className="flex-1">
//               <label className="text-sm font-medium text-[#02979B]">
//                 Almacén <span className="text-red-500">*</span>
//               </label>

//               {warehouses.length === 0 ? (
//                 <div className="mt-1 rounded-xl border border-[#D9D9D9] bg-gray-50 px-3 py-2 text-sm text-gray-500">
//                   Cargando almacenes...
//                 </div>
//               ) : warehouses.length === 1 ? (
//                 <input
//                   type="text"
//                   value={warehouses[0].name}
//                   readOnly
//                   className="mt-1 w-full rounded-xl border border-[#D9D9D9] bg-gray-100 px-3 py-2 text-sm text-[#02979B]"
//                 />
//               ) : (
//                 <select
//                   value={selectedWarehouseId}
//                   onChange={handleWarehouseChange}
//                   required
//                   className="mt-1 w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
//                 >
//                   <option value="">Seleccione un almacén</option>
//                   {warehouses.map((w) => (
//                     <option key={w.id} value={String(w.id)}>
//                       {w.name}
//                     </option>
//                   ))}
//                 </select>
//               )}

//               {warehouses.length > 1 && !selectedWarehouseId && (
//                 <p className="mt-1 text-xs text-red-500">Debe seleccionar un almacén para continuar</p>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Action - SOLO SE MUESTRA SI NO HAY DUPLICADOS */}
//         {!hasDuplicates && !hasCodeDuplicates && (
//           <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
//             <div className="flex flex-col gap-2 md:flex-row md:items-center">
//               <button
//                 type="submit"
//                 disabled={loading || !selectedWarehouseId}
//                 className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition md:w-auto ${
//                   loading || !selectedWarehouseId ? "bg-[#D9D9D9] cursor-not-allowed" : "bg-[#02979B] hover:bg-[#02979B]/80"
//                 }`}
//               >
//                 {loading ? (
//                   <>
//                     <Spinner />
//                     Procesando...
//                   </>
//                 ) : (
//                   <>
//                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                       <path
//                         d="M21 21 15.8 15.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                       />
//                     </svg>
//                     Subir y analizar duplicados
//                   </>
//                 )}
//               </button>

//               <div className="text-xs text-[#02979B]/60">
//                 uploadId: <span className="font-mono break-all text-[#02979B]">{uploadId ?? "-"}</span>
//               </div>
//             </div>

//             <div className="text-sm text-[#02979B]/60 md:text-right">
//               <span className="text-[#02979B]">Redondeo fijo:</span>{" "}
//               <span className="font-mono font-semibold text-[#02979B]">{DEFAULT_ROUND}</span>
//             </div>
//           </div>
//         )}

//         {/* Error */}
//         {error && (
//           <div className="rounded-xl border border-red-300 bg-red-50 p-4">
//             <div className="flex items-start gap-3">
//               <div className="mt-0.5 text-red-600">
//                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                   <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
//                 </svg>
//               </div>
//               <div>
//                 <div className="text-sm font-bold text-red-800">
//                   Error de validación
//                 </div>
//                 <div className="mt-1 text-sm text-red-700 whitespace-pre-wrap">
//                   {error}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </form>

//       {/* ALERTA GLOBAL cuando hay grupos sin seleccionar */}
//       {hasInvalidGroups && (hasDuplicates || hasCodeDuplicates) && (
//         <div className="mt-6 mb-2">
//           <div className="flex items-center gap-2 rounded-lg bg-red-50 border-2 border-red-400 p-4">
//             <div className="text-red-600">
//               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
//               </svg>
//             </div>
//             <div>
//               <p className="text-base font-bold text-red-800">NO PUEDE CONTINUAR - Selección incompleta</p>
//               <p className="text-sm text-red-700">
//                 {validationResult.invalidNameGroups.length > 0 && 
//                   `${validationResult.invalidNameGroups.length} nombre(s) duplicado(s) sin selección. `}
//                 {validationResult.invalidCodeGroups.length > 0 && 
//                   `${validationResult.invalidCodeGroups.length} código(s) duplicado(s) sin selección.`}
//               </p>
//               <p className="text-xs text-red-600 mt-1">
//                 Debe seleccionar al menos UNA fila por cada grupo duplicado antes de continuar.
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* DUPLICADOS POR NOMBRE */}
//       {hasDuplicates ? (
//         <div className="mt-6">
//           <div className="flex items-start justify-between gap-4">
//             <div>
//               <h2 className="text-lg font-semibold text-[#02979B]">Nombres duplicados detectados</h2>
//               <p className="mt-1 text-sm text-[#02979B]/60">
//                 Seleccione al menos una fila por cada nombre duplicado para continuar.
//               </p>
//             </div>
//           </div>

//           <div className="mt-3 rounded-2xl border border-[#D9D9D9] bg-white">
//             <div className="max-h-[520px] space-y-4 overflow-y-auto p-4">
//               {groups.map((g) => {
//                 const columns = g.rows?.length ? Object.keys(g.rows[0]).filter((c) => c !== "__ROW_ID__") : [];
//                 const hasSelection = g.rows.some((r) => selected.has(r.__ROW_ID__));
//                 const isOpen = openGroups.has(g.key);

//                 return (
//                   <div key={g.key} className={`overflow-hidden rounded-2xl border ${
//                     !hasSelection ? 'border-red-300 bg-red-50/30' : 'border-[#D9D9D9]'
//                   }`}>
//                     <button type="button" onClick={() => toggleGroupOpen(g.key)} className="w-full text-left">
//                       <div className={`flex items-start justify-between gap-4 px-5 py-4 ${
//                         !hasSelection ? 'bg-red-50' : 'bg-[#02979B]/5'
//                       }`}>
//                         <div className="min-w-0">
//                           <div className="text-xs font-medium text-[#02979B]">Nombre duplicado</div>
//                           <div className="mt-1 break-words whitespace-normal text-sm font-semibold text-[#02979B]">{g.key}</div>
//                           <div className="mt-1 text-xs text-[#02979B]/60">Total filas: {g.count}</div>
//                         </div>

//                         <div className="flex shrink-0 flex-col items-end gap-2">
//                           <span
//                             className={`rounded-full px-3 py-1 text-xs font-medium ${
//                               hasSelection 
//                                 ? "bg-[#02979B] text-white" 
//                                 : "bg-red-500 text-white"
//                             }`}
//                           >
//                             {hasSelection ? "Selección válida" : "Requiere selección"}
//                           </span>
//                           <span className="text-xs text-[#02979B]">{isOpen ? "Ocultar" : "Ver"}</span>
//                         </div>
//                       </div>
//                     </button>

//                     {isOpen ? (
//                       <div className="overflow-auto">
//                         <table className="min-w-full text-sm">
//                           <thead className="sticky top-0 z-10 bg-white">
//                             <tr className="border-b border-[#D9D9D9]">
//                               <th className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">Seleccionar</th>
//                               <th className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">Fila</th>
//                               {columns.map((c) => (
//                                 <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">
//                                   {c}
//                                 </th>
//                               ))}
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {g.rows.map((r) => (
//                               <tr key={r.__ROW_ID__} className={`border-b border-[#D9D9D9] hover:bg-[#02979B]/5 ${
//                                 selected.has(r.__ROW_ID__) ? 'bg-green-50' : ''
//                               }`}>
//                                 <td className="px-4 py-3">
//                                   <input
//                                     type="checkbox"
//                                     checked={selected.has(r.__ROW_ID__)}
//                                     onChange={() => toggleRow(r.__ROW_ID__)}
//                                     className="h-4 w-4 accent-[#02979B]"
//                                   />
//                                 </td>
//                                 <td className="px-4 py-3 font-mono text-xs text-[#02979B]">{r.__ROW_ID__}</td>
//                                 {columns.map((c) => (
//                                   <td key={c} className="whitespace-nowrap px-4 py-3 text-[#02979B]">
//                                     {String(r[c] ?? "")}
//                                   </td>
//                                 ))}
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </div>
//                     ) : null}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       ) : null}

//       {/* DUPLICADOS POR CÓDIGO - CON TODAS LAS COLUMNAS */}
//       {hasCodeDuplicates ? (
//         <div className="mt-8">
//           <div className="flex items-start justify-between gap-4">
//             <div>
//               <h2 className="text-lg font-semibold text-[#02979B]">Códigos duplicados detectados</h2>
//               <p className="mt-1 text-sm text-[#02979B]/60">
//                 Seleccione al menos una fila por cada código duplicado para continuar.
//               </p>
//             </div>
//           </div>

//           <div className="mt-3 rounded-2xl border border-[#D9D9D9] bg-white">
//             <div className="max-h-[520px] space-y-4 overflow-y-auto p-4">
//               {codeGroups.map((g) => {
//                 // Obtener todas las columnas disponibles (como en los grupos de nombre)
//                 const columns = g.rows?.length ? 
//                   Object.keys(g.rows[0]).filter((c) => c !== "fila" && c !== "__ROW_ID__") : [];
//                 const hasSelection = g.rows.some((r) => selected.has(r.fila));
//                 const isOpen = openCodeGroups.has(g.codigo);

//                 return (
//                   <div key={g.codigo} className={`overflow-hidden rounded-2xl border ${
//                     !hasSelection ? 'border-red-300 bg-red-50/30' : 'border-[#D9D9D9]'
//                   }`}>
//                     <button type="button" onClick={() => toggleCodeGroupOpen(g.codigo)} className="w-full text-left">
//                       <div className={`flex items-start justify-between gap-4 px-5 py-4 ${
//                         !hasSelection ? 'bg-red-50' : 'bg-[#02979B]/5'
//                       }`}>
//                         <div className="min-w-0">
//                           <div className="text-xs font-medium text-[#02979B]">Código duplicado</div>
//                           <div className="mt-1 break-words whitespace-normal text-sm font-semibold text-[#02979B]">{g.codigo}</div>
//                           <div className="mt-1 text-xs text-[#02979B]/60">Total filas: {g.count}</div>
//                         </div>

//                         <div className="flex shrink-0 flex-col items-end gap-2">
//                           <span
//                             className={`rounded-full px-3 py-1 text-xs font-medium ${
//                               hasSelection 
//                                 ? "bg-[#02979B] text-white" 
//                                 : "bg-red-500 text-white"
//                             }`}
//                           >
//                             {hasSelection ? "Selección válida" : "Requiere selección"}
//                           </span>
//                           <span className="text-xs text-[#02979B]">{isOpen ? "Ocultar" : "Ver"}</span>
//                         </div>
//                       </div>
//                     </button>

//                     {isOpen ? (
//                       <div className="overflow-auto">
//                         <table className="min-w-full text-sm">
//                           <thead className="sticky top-0 z-10 bg-white">
//                             <tr className="border-b border-[#D9D9D9]">
//                               <th className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">Seleccionar</th>
//                               <th className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">Fila</th>
//                               {columns.map((c) => (
//                                 <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">
//                                   {c}
//                                 </th>
//                               ))}
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {g.rows.map((r, idx) => (
//                               <tr key={idx} className={`border-b border-[#D9D9D9] hover:bg-[#02979B]/5 ${
//                                 selected.has(r.fila) ? 'bg-green-50' : ''
//                               }`}>
//                                 <td className="px-4 py-3">
//                                   <input
//                                     type="checkbox"
//                                     checked={selected.has(r.fila)}
//                                     onChange={() => toggleRow(r.fila)}
//                                     className="h-4 w-4 accent-[#02979B]"
//                                   />
//                                 </td>
//                                 <td className="px-4 py-3 font-mono text-xs text-[#02979B]">{r.fila}</td>
//                                 {columns.map((c) => (
//                                   <td key={c} className="whitespace-nowrap px-4 py-3 text-[#02979B]">
//                                     {String(r[c] ?? "")}
//                                   </td>
//                                 ))}
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </div>
//                     ) : null}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       ) : null}

//       {/* Botón de continuar - SOLO SE MUESTRA SI HAY DUPLICADOS */}
//       {(hasDuplicates || hasCodeDuplicates) && (
//         <div className="mt-6 flex justify-end">
//           <button
//             type="button"
//             disabled={loading || hasInvalidGroups || !selectedWarehouseId}
//             onClick={onContinueWithSelection}
//             className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition ${
//               loading || hasInvalidGroups || !selectedWarehouseId
//                 ? "bg-[#D9D9D9] cursor-not-allowed"
//                 : "bg-[#02979B] hover:bg-[#02979B]/80"
//             }`}
//           >
//             {loading ? (
//               <>
//                 <Spinner />
//                 Generando...
//               </>
//             ) : (
//               "Continuar y descargar QA"
//             )}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// // ===== COMPONENTES AYUDANTES =====
// // function Spinner() {
// //   return (
// //     <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
// //       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
// //       <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
// //     </svg>
// //   );
// // }

// function ToggleCard({ title, value, onToggle, disabled = false, icon }) {
//   return (
//     <div className={`rounded-2xl border border-[#D9D9D9] ${disabled ? "bg-[#D9D9D9]/20" : "bg-white"} p-4`}>
//       <div className="flex items-start justify-between gap-4">
//         <div className="flex items-center gap-2">
//           <div className="text-[#02979B]">{icon}</div>
//           <div className={`text-sm font-semibold ${disabled ? "text-[#02979B]/40" : "text-[#02979B]"}`}>{title}</div>
//         </div>
//         <button
//           type="button"
//           onClick={onToggle}
//           disabled={disabled}
//           className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
//             disabled ? "bg-[#D9D9D9] cursor-not-allowed" : value ? "bg-[#02979B]" : "bg-[#D9D9D9]"
//           }`}
//           aria-label="toggle"
//         >
//           <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${value ? "translate-x-5" : "translate-x-1"}`} />
//         </button>
//       </div>
//     </div>
//   );
// }

// function ModeButton({ active, onClick, title, desc }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={`rounded-2xl border p-4 text-left transition ${
//         active ? "border-[#02979B] bg-[#02979B] text-white" : "border-[#D9D9D9] bg-white text-[#02979B] hover:bg-[#02979B]/5"
//       }`}
//     >
//       <div className="text-sm font-semibold">{title}</div>
//       <div className={`mt-1 text-xs ${active ? "text-white/80" : "text-[#02979B]/60"}`}>{desc}</div>
//     </button>
//   );
// }