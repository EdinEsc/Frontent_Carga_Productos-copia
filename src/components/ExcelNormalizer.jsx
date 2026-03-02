// // components/ExcelNormalizer.jsx
// import { useState, useEffect, useMemo } from "react";
// import { toast } from "sonner";
// import { useWarehouse } from "../hooks/useWarehouse";
// import { DEFAULT_ROUND, API_URL } from "../constants/nodes";
// import { analyzeFile, downloadNormalizedFile } from "../utils/apiUtils";
// import Spinner from "./shared/Spinner";
// import ToggleCard from "./shared/ToggleCard";
// import ModeButton from "./shared/ModeButton";
// import FileUploader from "./shared/FileUploader";

// export default function ExcelNormalizer({ onNavigateToCarga, warehouses = [] }) {
//   // Estado principal
//   const [mode, setMode] = useState("NORMAL");
//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [uploadId, setUploadId] = useState(null);
  
//   // Estado para duplicados
//   const [groups, setGroups] = useState([]);
//   const [codeGroups, setCodeGroups] = useState([]);
//   const [selected, setSelected] = useState(() => new Set());
//   const [openGroups, setOpenGroups] = useState(() => new Set());
//   const [openCodeGroups, setOpenCodeGroups] = useState(() => new Set());
//   const [selectAllEnabled, setSelectAllEnabled] = useState(false);

//   // IGV settings
//   const [applyIgvCost, setApplyIgvCost] = useState(true);
//   const [applyIgvSale, setApplyIgvSale] = useState(true);

//   // Warehouse hook
//   const { selectedWarehouseId, selectedWarehouseName, handleWarehouseChange, validateWarehouse } = 
//     useWarehouse(warehouses);

//   // ===== LOGS DE INICIALIZACIÓN Y CAMBIOS =====
//   useEffect(() => {
//     console.log('🏁 [Normalizer] Componente montado - Valores iniciales:', {
//       applyIgvCost,
//       applyIgvSale,
//       selectedWarehouseId,
//       selectedWarehouseName
//     });
//   }, []);

//   useEffect(() => {
//     console.log('🔄 [Normalizer] IGV cambiaron:', { 
//       applyIgvCost, 
//       applyIgvSale,
//       timestamp: new Date().toISOString()
//     });
//   }, [applyIgvCost, applyIgvSale]);

//   useEffect(() => {
//     console.log('🏢 [Normalizer] Warehouse cambiado:', {
//       selectedWarehouseId,
//       selectedWarehouseName,
//       timestamp: new Date().toISOString()
//     });
//   }, [selectedWarehouseId, selectedWarehouseName]);

//   const igvSettings = useMemo(() => ({
//     DEFAULT_ROUND,
//     applyIgvCost,
//     applyIgvSale
//   }), [applyIgvCost, applyIgvSale]);

//   // Reset UI
//   const resetDuplicatesUI = () => {
//     setGroups([]);
//     setCodeGroups([]);
//     setSelected(new Set());
//     setOpenGroups(new Set());
//     setOpenCodeGroups(new Set());
//   };

//   // Toggle functions
//   const toggleRow = (rowId) => {
//     setSelected((prev) => {
//       const next = new Set(prev);
//       if (next.has(rowId)) next.delete(rowId);
//       else next.add(rowId);
//       return next;
//     });
//   };

//   const getAllRowsFromAllGroups = () => {
//     const allRows = new Set();
//     for (const g of groups) {
//       for (const r of g.rows || []) {
//         if (r.__ROW_ID__) allRows.add(r.__ROW_ID__);
//       }
//     }
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
//         setSelected(getAllRowsFromAllGroups());
//       } else {
//         setSelected(new Set());
//       }
//       return nextValue;
//     });
//   };

//   const validateSelection = () => {
//     const invalidNameGroups = [];
//     const invalidCodeGroups = [];
    
//     for (const g of groups) {
//       const hasOne = g.rows.some((r) => selected.has(r.__ROW_ID__));
//       if (!hasOne) invalidNameGroups.push(g.key);
//     }
    
//     for (const g of codeGroups) {
//       const hasOne = g.rows.some((r) => selected.has(r.fila));
//       if (!hasOne) invalidCodeGroups.push(g.codigo);
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

//   // ===== FUNCIÓN SAVESTATE CON LOG =====
//   const saveState = () => {
//     console.log('💾 [Normalizer] GUARDANDO EN SESSIONSTORAGE:', {
//       applyIgvCost: String(applyIgvCost),
//       applyIgvSale: String(applyIgvSale),
//       selectedWarehouseId,
//       timestamp: new Date().toISOString()
//     });
    
//     sessionStorage.setItem('applyIgvCost', String(applyIgvCost));
//     sessionStorage.setItem('applyIgvSale', String(applyIgvSale));
//     if (selectedWarehouseId) {
//       sessionStorage.setItem('selectedWarehouseId', selectedWarehouseId);
//     }
    
//     // Verificar que se guardó correctamente
//     console.log('✅ [Normalizer] Verificación en sessionStorage:', {
//       applyIgvCost: sessionStorage.getItem('applyIgvCost'),
//       applyIgvSale: sessionStorage.getItem('applyIgvSale'),
//       selectedWarehouseId: sessionStorage.getItem('selectedWarehouseId')
//     });
//   };

//   const onAnalyze = async (e) => {
//     e.preventDefault();
    
//     const validation = validateWarehouse();
//     if (!validation.valid) {
//       toast.error(validation.error);
//       return;
//     }

//     setError("");
//     resetDuplicatesUI();
//     setUploadId(null);

//     if (!file) {
//       setError("Selecciona un archivo Excel (.xlsx)");
//       return;
//     }

//     try {
//       setLoading(true);
//       console.log('📤 [Normalizer] Enviando a analyzeFile:', {
//         mode,
//         file: file.name,
//         igvSettings
//       });
      
//       const data = await analyzeFile(file, mode, { selectedWarehouseId, selectedWarehouseName }, igvSettings);
      
//       if (mode === "NORMAL") {
//         setUploadId(data.upload_id);
//       }
      
//       const nextGroups = data.groups || [];
//       const nextCodeGroups = data.code_duplicate_groups || [];
      
//       setGroups(nextGroups);
//       setCodeGroups(nextCodeGroups);

//       if (nextGroups.length > 0) setOpenGroups(new Set([nextGroups[0].key]));
//       if (nextCodeGroups.length > 0) setOpenCodeGroups(new Set([nextCodeGroups[0].codigo]));
      
//       if (!data.has_duplicates && !data.has_code_duplicates) {
//         console.log('🚀 [Normalizer] No hay duplicados, descargando directamente...');
//         await handleDownload([]);
//       }
      
//     } catch (err) {
//       setError(err?.message || "Error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ===== HANDLEDOWNLOAD CON LOG =====
//   const handleDownload = async (selectedIds) => {
//     console.log('📥 [Normalizer] DESCARGANDO ARCHIVO CON:', {
//       mode,
//       uploadId,
//       selectedIdsCount: selectedIds.length,
//       applyIgvCost,
//       applyIgvSale,
//       selectedWarehouseId,
//       selectedWarehouseName,
//       timestamp: new Date().toISOString()
//     });
    
//     const warehouseData = { selectedWarehouseId, selectedWarehouseName };
    
//     await downloadNormalizedFile(
//       mode,
//       uploadId,
//       selectedIds,
//       file,
//       warehouseData,
//       igvSettings,
//       () => {
//         console.log('✅ [Normalizer] Descarga completada, llamando a onNavigateToCarga');
//         resetDuplicatesUI();
//         setSelectAllEnabled(false);
//         if (onNavigateToCarga) {
//           setTimeout(() => onNavigateToCarga(), 800);
//         }
//       }
//     );
//   };

//   // ===== ONCONTINUEWITH SELECTION CON LOG =====
//   const onContinueWithSelection = async () => {
//     console.log('🎯 [Normalizer] CONTINUANDO CON SELECCIÓN - Estado actual:', {
//       applyIgvCost,
//       applyIgvSale,
//       selectedWarehouseId,
//       selectedWarehouseName,
//       selectedCount: selected.size,
//       mode,
//       timestamp: new Date().toISOString()
//     });

//     const validation = validateWarehouse();
//     if (!validation.valid) {
//       toast.error(validation.error);
//       return;
//     }

//     const selectionValidation = validateSelection();
//     if (!selectionValidation.isValid) {
//       let errorMessage = "Debe seleccionar al menos una fila por cada grupo duplicado.\n\n";
//       if (selectionValidation.invalidNameGroups.length > 0) {
//         errorMessage += `Nombres pendientes: ${selectionValidation.invalidNameGroups.length}\n`;
//       }
//       if (selectionValidation.invalidCodeGroups.length > 0) {
//         errorMessage += `Códigos pendientes: ${selectionValidation.invalidCodeGroups.length}`;
//       }
//       setError(errorMessage);
//       toast.error(errorMessage, { duration: 5000 });
//       return;
//     }

//     // Guardar estado antes de continuar
//     saveState();

//     try {
//       setLoading(true);
//       await handleDownload(Array.from(selected));
//     } catch (err) {
//       setError(err?.message || "Error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const hasDuplicates = groups.length > 0;
//   const hasCodeDuplicates = codeGroups.length > 0;
//   const validationResult = validateSelection();
//   const hasInvalidGroups = !validationResult.isValid;

//   return (
//     <div className="w-full">
//       <form onSubmit={onAnalyze} className="space-y-6">
//         {/* Modo selector */}
//         <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
//           <div className="text-sm font-semibold text-[#02979B]">Tipo de carga</div>
//           <div className="mt-3 grid gap-2 md:grid-cols-2">
//             <ModeButton
//               active={mode === "NORMAL"}
//               onClick={() => setMode("NORMAL")}
//               title="Carga normal"
//               desc="Analiza duplicados por codigo, nombre y descarga QA."
//             />
//             <ModeButton
//               active={mode === "CONVERSION"}
//               onClick={() => setMode("CONVERSION")}
//               title="Por conversión"
//               desc="Analiza duplicados por codigo, nombre y descarga QA (con selección)."
//             />
//           </div>
//         </div>

//         {/* File uploader */}
//         <FileUploader 
//           file={file} 
//           onFileChange={setFile}
//           description={`Endpoint: ${API_URL}/${mode === "NORMAL" ? "excel" : "conversion"}/analyze`}
//         />

//         {/* Mensaje Selva */}
//         <div className="rounded-2xl border-2 border-[#02979B] bg-[#02979B]/5 p-4">
//           <div className="flex items-center gap-3">
//             <div className="text-[#02979B]">
//               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
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
//             onToggle={() => {
//               console.log('🔘 [Normalizer] Toggle IGV Costo:', { antes: applyIgvCost, despues: !applyIgvCost });
//               setApplyIgvCost((v) => !v);
//             }}
//             icon={
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M12 2v20M17 5H9.5M17 12h-5M17 19h-5" strokeLinecap="round" />
//               </svg>
//             }
//           />
//           <ToggleCard
//             title="Aplicar IGV (1.18) a Precio Venta"
//             value={applyIgvSale}
//             onToggle={() => {
//               console.log('🔘 [Normalizer] Toggle IGV Venta:', { antes: applyIgvSale, despues: !applyIgvSale });
//               setApplyIgvSale((v) => !v);
//             }}
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

//         {/* Warehouse selector */}
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

//         {/* Action button - solo si no hay duplicados */}
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
//                       <path d="M21 21 15.8 15.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" strokeLinecap="round" strokeLinejoin="round"/>
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
//                 <div className="text-sm font-bold text-red-800">Error de validación</div>
//                 <div className="mt-1 text-sm text-red-700 whitespace-pre-wrap">{error}</div>
//               </div>
//             </div>
//           </div>
//         )}
//       </form>

//       {/* Alerta de grupos sin seleccionar */}
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
//       {hasDuplicates && (
//         <DuplicateGroup
//           title="Nombres duplicados detectados"
//           groups={groups}
//           selected={selected}
//           openGroups={openGroups}
//           onToggleGroup={toggleGroupOpen}
//           onToggleRow={toggleRow}
//           idField="__ROW_ID__"
//         />
//       )}

//       {/* DUPLICADOS POR CÓDIGO */}
//       {hasCodeDuplicates && (
//         <DuplicateGroup
//           title="Códigos duplicados detectados"
//           groups={codeGroups.map(g => ({
//             ...g,
//             key: g.codigo,
//             rows: g.rows.map(r => ({ ...r, __ROW_ID__: r.fila }))
//           }))}
//           selected={selected}
//           openGroups={openCodeGroups}
//           onToggleGroup={(key) => toggleCodeGroupOpen(key)}
//           onToggleRow={toggleRow}
//           idField="__ROW_ID__"
//         />
//       )}

//       {/* Botón continuar */}
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

// // Componente para mostrar grupos duplicados
// function DuplicateGroup({ title, groups, selected, openGroups, onToggleGroup, onToggleRow, idField }) {
//   return (
//     <div className="mt-6">
//       <div className="flex items-start justify-between gap-4">
//         <div>
//           <h2 className="text-lg font-semibold text-[#02979B]">{title}</h2>
//           <p className="mt-1 text-sm text-[#02979B]/60">
//             Seleccione al menos una fila por cada grupo duplicado para continuar.
//           </p>
//         </div>
//       </div>

//       <div className="mt-3 rounded-2xl border border-[#D9D9D9] bg-white">
//         <div className="max-h-[520px] space-y-4 overflow-y-auto p-4">
//           {groups.map((g) => {
//             const columns = g.rows?.length ? 
//               Object.keys(g.rows[0]).filter((c) => c !== idField && c !== "fila") : [];
//             const hasSelection = g.rows.some((r) => selected.has(r[idField]));
//             const isOpen = openGroups.has(g.key);

//             return (
//               <div key={g.key} className={`overflow-hidden rounded-2xl border ${
//                 !hasSelection ? 'border-red-300 bg-red-50/30' : 'border-[#D9D9D9]'
//               }`}>
//                 <button type="button" onClick={() => onToggleGroup(g.key)} className="w-full text-left">
//                   <div className={`flex items-start justify-between gap-4 px-5 py-4 ${
//                     !hasSelection ? 'bg-red-50' : 'bg-[#02979B]/5'
//                   }`}>
//                     <div className="min-w-0">
//                       <div className="text-xs font-medium text-[#02979B]">Grupo duplicado</div>
//                       <div className="mt-1 break-words whitespace-normal text-sm font-semibold text-[#02979B]">{g.key}</div>
//                       <div className="mt-1 text-xs text-[#02979B]/60">Total filas: {g.count}</div>
//                     </div>

//                     <div className="flex shrink-0 flex-col items-end gap-2">
//                       <span
//                         className={`rounded-full px-3 py-1 text-xs font-medium ${
//                           hasSelection ? "bg-[#02979B] text-white" : "bg-red-500 text-white"
//                         }`}
//                       >
//                         {hasSelection ? "Selección válida" : "Requiere selección"}
//                       </span>
//                       <span className="text-xs text-[#02979B]">{isOpen ? "Ocultar" : "Ver"}</span>
//                     </div>
//                   </div>
//                 </button>

//                 {isOpen && (
//                   <div className="overflow-auto">
//                     <table className="min-w-full text-sm">
//                       <thead className="sticky top-0 z-10 bg-white">
//                         <tr className="border-b border-[#D9D9D9]">
//                           <th className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">Seleccionar</th>
//                           <th className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">Fila</th>
//                           {columns.map((c) => (
//                             <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">{c}</th>
//                           ))}
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {g.rows.map((r, idx) => (
//                           <tr key={idx} className={`border-b border-[#D9D9D9] hover:bg-[#02979B]/5 ${
//                             selected.has(r[idField]) ? 'bg-green-50' : ''
//                           }`}>
//                             <td className="px-4 py-3">
//                               <input
//                                 type="checkbox"
//                                 checked={selected.has(r[idField])}
//                                 onChange={() => onToggleRow(r[idField])}
//                                 className="h-4 w-4 accent-[#02979B]"
//                               />
//                             </td>
//                             <td className="px-4 py-3 font-mono text-xs text-[#02979B]">{r[idField]}</td>
//                             {columns.map((c) => (
//                               <td key={c} className="whitespace-nowrap px-4 py-3 text-[#02979B]">
//                                 {String(r[c] ?? "")}
//                               </td>
//                             ))}
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }


// components/ExcelNormalizer.jsx
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useWarehouse } from "../hooks/useWarehouse";
import { DEFAULT_ROUND, API_URL } from "../constants/nodes";
import { analyzeFile, downloadNormalizedFile } from "../utils/apiUtils";
import Spinner from "./shared/Spinner";
import ToggleCard from "./shared/ToggleCard";
import ModeButton from "./shared/ModeButton";
import FileUploader from "./shared/FileUploader";

export default function ExcelNormalizer({ onNavigateToCarga, warehouses = [] }) {
  // Estado principal
  const [mode, setMode] = useState("NORMAL");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadId, setUploadId] = useState(null);
  
  // Estado para duplicados
  const [groups, setGroups] = useState([]);
  const [codeGroups, setCodeGroups] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const [openCodeGroups, setOpenCodeGroups] = useState(() => new Set());
  const [selectAllEnabled, setSelectAllEnabled] = useState(false);

  // IGV settings
  const [applyIgvCost, setApplyIgvCost] = useState(true);
  const [applyIgvSale, setApplyIgvSale] = useState(true);

  // Warehouse hook
  const { selectedWarehouseId, selectedWarehouseName, handleWarehouseChange, validateWarehouse } = 
    useWarehouse(warehouses);

  // ===== LOGS DE INICIALIZACIÓN Y CAMBIOS =====
  useEffect(() => {
    console.log('🏁 [Normalizer] Componente montado - Valores iniciales:', {
      applyIgvCost,
      applyIgvSale,
      selectedWarehouseId,
      selectedWarehouseName
    });
  }, []);

  useEffect(() => {
    console.log('🔄 [Normalizer] IGV cambiaron:', { 
      applyIgvCost, 
      applyIgvSale,
      timestamp: new Date().toISOString()
    });
  }, [applyIgvCost, applyIgvSale]);

  useEffect(() => {
    console.log('🏢 [Normalizer] Warehouse cambiado:', {
      selectedWarehouseId,
      selectedWarehouseName,
      timestamp: new Date().toISOString()
    });
  }, [selectedWarehouseId, selectedWarehouseName]);

  const igvSettings = useMemo(() => ({
    DEFAULT_ROUND,
    applyIgvCost,
    applyIgvSale
  }), [applyIgvCost, applyIgvSale]);

  // Reset UI
  const resetDuplicatesUI = () => {
    setGroups([]);
    setCodeGroups([]);
    setSelected(new Set());
    setOpenGroups(new Set());
    setOpenCodeGroups(new Set());
  };

  // Toggle functions
  const toggleRow = (rowId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const getAllRowsFromAllGroups = () => {
    const allRows = new Set();
    for (const g of groups) {
      for (const r of g.rows || []) {
        if (r.__ROW_ID__) allRows.add(r.__ROW_ID__);
      }
    }
    for (const g of codeGroups) {
      for (const r of g.rows || []) {
        if (r.fila) allRows.add(r.fila);
      }
    }
    return allRows;
  };

  const toggleSelectAll = () => {
    setSelectAllEnabled((prev) => {
      const nextValue = !prev;
      if (nextValue) {
        setSelected(getAllRowsFromAllGroups());
      } else {
        setSelected(new Set());
      }
      return nextValue;
    });
  };

  const validateSelection = () => {
    const invalidNameGroups = [];
    const invalidCodeGroups = [];
    
    for (const g of groups) {
      const hasOne = g.rows.some((r) => selected.has(r.__ROW_ID__));
      if (!hasOne) invalidNameGroups.push(g.key);
    }
    
    for (const g of codeGroups) {
      const hasOne = g.rows.some((r) => selected.has(r.fila));
      if (!hasOne) invalidCodeGroups.push(g.codigo);
    }
    
    return {
      isValid: invalidNameGroups.length === 0 && invalidCodeGroups.length === 0,
      invalidNameGroups,
      invalidCodeGroups
    };
  };

  const toggleGroupOpen = (key) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCodeGroupOpen = (codigo) => {
    setOpenCodeGroups((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
  };

  // ===== FUNCIÓN SAVESTATE CON LOG =====
  const saveState = () => {
    console.log('💾 [Normalizer] GUARDANDO EN SESSIONSTORAGE:', {
      applyIgvCost: String(applyIgvCost),
      applyIgvSale: String(applyIgvSale),
      selectedWarehouseId,
      timestamp: new Date().toISOString()
    });
    
    sessionStorage.setItem('applyIgvCost', String(applyIgvCost));
    sessionStorage.setItem('applyIgvSale', String(applyIgvSale));
    if (selectedWarehouseId) {
      sessionStorage.setItem('selectedWarehouseId', selectedWarehouseId);
    }
    
    // Verificar que se guardó correctamente
    console.log('✅ [Normalizer] Verificación en sessionStorage:', {
      applyIgvCost: sessionStorage.getItem('applyIgvCost'),
      applyIgvSale: sessionStorage.getItem('applyIgvSale'),
      selectedWarehouseId: sessionStorage.getItem('selectedWarehouseId')
    });
  };

  // ===== HANDLEDOWNLOAD MODIFICADO - acepta uploadIdParam =====
  const handleDownload = async (selectedIds, uploadIdParam = null) => {
    // Usar el parámetro si se pasa, sino usar el state
    const effectiveUploadId = uploadIdParam || uploadId;
    
    console.log('📥 [Normalizer] DESCARGANDO ARCHIVO CON:', {
      mode,
      uploadId: effectiveUploadId,
      selectedIdsCount: selectedIds.length,
      applyIgvCost,
      applyIgvSale,
      selectedWarehouseId,
      selectedWarehouseName,
      timestamp: new Date().toISOString()
    });
    
    // ✅ VALIDAR uploadId para modo NORMAL
    if (mode === "NORMAL" && !effectiveUploadId) {
      setError("Error: No se pudo obtener el ID de carga");
      return;
    }
    
    const warehouseData = { selectedWarehouseId, selectedWarehouseName };
    
    try {
      await downloadNormalizedFile(
        mode,
        effectiveUploadId,
        selectedIds,
        file,
        warehouseData,
        igvSettings,
        () => {
          console.log('✅ [Normalizer] Descarga completada, llamando a onNavigateToCarga');
          resetDuplicatesUI();
          setSelectAllEnabled(false);
          if (onNavigateToCarga) {
            setTimeout(() => onNavigateToCarga(), 800);
          }
        }
      );
    } catch (err) {
      setError(err?.message || "Error al descargar");
    }
  };

  // ===== ONANALYZE MODIFICADO - usa data.upload_id directamente =====
  const onAnalyze = async (e) => {
    e.preventDefault();
    
    const validation = validateWarehouse();
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setError("");
    resetDuplicatesUI();
    setUploadId(null);

    if (!file) {
      setError("Selecciona un archivo Excel (.xlsx)");
      return;
    }

    try {
      setLoading(true);
      console.log('📤 [Normalizer] Enviando a analyzeFile:', {
        mode,
        file: file.name,
        igvSettings
      });
      
      const data = await analyzeFile(file, mode, { selectedWarehouseId, selectedWarehouseName }, igvSettings);
      
      // Guardar en state para futuros renders (cuando hay duplicados)
      if (mode === "NORMAL" && data.upload_id) {
        setUploadId(data.upload_id);
        console.log('✅ upload_id guardado en state:', data.upload_id);
      }
      
      const nextGroups = data.groups || [];
      const nextCodeGroups = data.code_duplicate_groups || [];
      
      setGroups(nextGroups);
      setCodeGroups(nextCodeGroups);

      if (nextGroups.length > 0) setOpenGroups(new Set([nextGroups[0].key]));
      if (nextCodeGroups.length > 0) setOpenCodeGroups(new Set([nextCodeGroups[0].codigo]));
      
      // 🟢 CORREGIDO: Usar data.upload_id DIRECTAMENTE, no el state
      if (!data.has_duplicates && !data.has_code_duplicates) {
        console.log('🚀 [Normalizer] No hay duplicados, descargando directamente...');
        
        // Verificar que tenemos uploadId para modo NORMAL
        if (mode === "NORMAL" && !data.upload_id) {
          throw new Error("El backend no proporcionó un upload_id");
        }
        
        // Pasar el upload_id de la respuesta
        await handleDownload([], data.upload_id);
      }
      
    } catch (err) {
      setError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  // ===== ONCONTINUEWITH SELECTION (sin cambios, usa el state) =====
  const onContinueWithSelection = async () => {
    console.log('🎯 [Normalizer] CONTINUANDO CON SELECCIÓN - Estado actual:', {
      applyIgvCost,
      applyIgvSale,
      selectedWarehouseId,
      selectedWarehouseName,
      selectedCount: selected.size,
      mode,
      timestamp: new Date().toISOString()
    });

    const validation = validateWarehouse();
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const selectionValidation = validateSelection();
    if (!selectionValidation.isValid) {
      let errorMessage = "Debe seleccionar al menos una fila por cada grupo duplicado.\n\n";
      if (selectionValidation.invalidNameGroups.length > 0) {
        errorMessage += `Nombres pendientes: ${selectionValidation.invalidNameGroups.length}\n`;
      }
      if (selectionValidation.invalidCodeGroups.length > 0) {
        errorMessage += `Códigos pendientes: ${selectionValidation.invalidCodeGroups.length}`;
      }
      setError(errorMessage);
      toast.error(errorMessage, { duration: 5000 });
      return;
    }

    // Guardar estado antes de continuar
    saveState();

    try {
      setLoading(true);
      // Aquí usamos el state uploadId porque ya se actualizó
      await handleDownload(Array.from(selected));
    } catch (err) {
      setError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const hasDuplicates = groups.length > 0;
  const hasCodeDuplicates = codeGroups.length > 0;
  const validationResult = validateSelection();
  const hasInvalidGroups = !validationResult.isValid;

  return (
    <div className="w-full">
      <form onSubmit={onAnalyze} className="space-y-6">
        {/* Modo selector */}
        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
          <div className="text-sm font-semibold text-[#02979B]">Tipo de carga</div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <ModeButton
              active={mode === "NORMAL"}
              onClick={() => setMode("NORMAL")}
              title="Carga normal"
              desc="Analiza duplicados por codigo, nombre y descarga QA."
            />
            <ModeButton
              active={mode === "CONVERSION"}
              onClick={() => setMode("CONVERSION")}
              title="Por conversión"
              desc="Analiza duplicados por codigo, nombre y descarga QA (con selección)."
            />
          </div>
        </div>

        {/* File uploader */}
        <FileUploader 
          file={file} 
          onFileChange={setFile}
          description={`Endpoint: ${API_URL}/${mode === "NORMAL" ? "excel" : "conversion"}/analyze`}
        />

        {/* Mensaje Selva */}
        <div className="rounded-2xl border-2 border-[#02979B] bg-[#02979B]/5 p-4">
          <div className="flex items-center gap-3">
            <div className="text-[#02979B]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-sm text-[#02979B]">
              <span className="font-semibold">Información:</span> Si eres de la selva, recuerda que estás exonerado del IGV.
            </div>
          </div>
        </div>

        {/* IGV toggles */}
        <div className="grid gap-3 md:grid-cols-3">
          <ToggleCard
            title="Aplicar IGV (1.18) a Precio Costo"
            value={applyIgvCost}
            onToggle={() => {
              console.log('🔘 [Normalizer] Toggle IGV Costo:', { antes: applyIgvCost, despues: !applyIgvCost });
              setApplyIgvCost((v) => !v);
            }}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5M17 12h-5M17 19h-5" strokeLinecap="round" />
              </svg>
            }
          />
          <ToggleCard
            title="Aplicar IGV (1.18) a Precio Venta"
            value={applyIgvSale}
            onToggle={() => {
              console.log('🔘 [Normalizer] Toggle IGV Venta:', { antes: applyIgvSale, despues: !applyIgvSale });
              setApplyIgvSale((v) => !v);
            }}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 12H4M12 4v16" strokeLinecap="round" />
              </svg>
            }
          />
          <ToggleCard
            title="Seleccionar todo (duplicados)"
            value={selectAllEnabled}
            onToggle={toggleSelectAll}
            disabled={!hasDuplicates && !hasCodeDuplicates}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
        </div>

        {/* Warehouse selector */}
        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-[#02979B]">
                Almacén <span className="text-red-500">*</span>
              </label>

              {warehouses.length === 0 ? (
                <div className="mt-1 rounded-xl border border-[#D9D9D9] bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  Cargando almacenes...
                </div>
              ) : warehouses.length === 1 ? (
                <input
                  type="text"
                  value={warehouses[0].name}
                  readOnly
                  className="mt-1 w-full rounded-xl border border-[#D9D9D9] bg-gray-100 px-3 py-2 text-sm text-[#02979B]"
                />
              ) : (
                <select
                  value={selectedWarehouseId}
                  onChange={handleWarehouseChange}
                  required
                  className="mt-1 w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
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
        </div>

        {/* Action button - solo si no hay duplicados */}
        {!hasDuplicates && !hasCodeDuplicates && (
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <button
                type="submit"
                disabled={loading || !selectedWarehouseId}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition md:w-auto ${
                  loading || !selectedWarehouseId ? "bg-[#D9D9D9] cursor-not-allowed" : "bg-[#02979B] hover:bg-[#02979B]/80"
                }`}
              >
                {loading ? (
                  <>
                    <Spinner />
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 21 15.8 15.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Subir y analizar duplicados
                  </>
                )}
              </button>

              <div className="text-xs text-[#02979B]/60">
                uploadId: <span className="font-mono break-all text-[#02979B]">{uploadId ?? "-"}</span>
              </div>
            </div>

            <div className="text-sm text-[#02979B]/60 md:text-right">
              <span className="text-[#02979B]">Redondeo fijo:</span>{" "}
              <span className="font-mono font-semibold text-[#02979B]">{DEFAULT_ROUND}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-red-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-red-800">Error de validación</div>
                <div className="mt-1 text-sm text-red-700 whitespace-pre-wrap">{error}</div>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Alerta de grupos sin seleccionar */}
      {hasInvalidGroups && (hasDuplicates || hasCodeDuplicates) && (
        <div className="mt-6 mb-2">
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border-2 border-red-400 p-4">
            <div className="text-red-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-red-800">NO PUEDE CONTINUAR - Selección incompleta</p>
              <p className="text-sm text-red-700">
                {validationResult.invalidNameGroups.length > 0 && 
                  `${validationResult.invalidNameGroups.length} nombre(s) duplicado(s) sin selección. `}
                {validationResult.invalidCodeGroups.length > 0 && 
                  `${validationResult.invalidCodeGroups.length} código(s) duplicado(s) sin selección.`}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Debe seleccionar al menos UNA fila por cada grupo duplicado antes de continuar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DUPLICADOS POR NOMBRE */}
      {hasDuplicates && (
        <DuplicateGroup
          title="Nombres duplicados detectados"
          groups={groups}
          selected={selected}
          openGroups={openGroups}
          onToggleGroup={toggleGroupOpen}
          onToggleRow={toggleRow}
          idField="__ROW_ID__"
        />
      )}

      {/* DUPLICADOS POR CÓDIGO */}
      {hasCodeDuplicates && (
        <DuplicateGroup
          title="Códigos duplicados detectados"
          groups={codeGroups.map(g => ({
            ...g,
            key: g.codigo,
            rows: g.rows.map(r => ({ ...r, __ROW_ID__: r.fila }))
          }))}
          selected={selected}
          openGroups={openCodeGroups}
          onToggleGroup={(key) => toggleCodeGroupOpen(key)}
          onToggleRow={toggleRow}
          idField="__ROW_ID__"
        />
      )}

      {/* Botón continuar */}
      {(hasDuplicates || hasCodeDuplicates) && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={loading || hasInvalidGroups || !selectedWarehouseId}
            onClick={onContinueWithSelection}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition ${
              loading || hasInvalidGroups || !selectedWarehouseId
                ? "bg-[#D9D9D9] cursor-not-allowed"
                : "bg-[#02979B] hover:bg-[#02979B]/80"
            }`}
          >
            {loading ? (
              <>
                <Spinner />
                Generando...
              </>
            ) : (
              "Continuar y descargar QA"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Componente para mostrar grupos duplicados (sin cambios)
function DuplicateGroup({ title, groups, selected, openGroups, onToggleGroup, onToggleRow, idField }) {
  return (
    <div className="mt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#02979B]">{title}</h2>
          <p className="mt-1 text-sm text-[#02979B]/60">
            Seleccione al menos una fila por cada grupo duplicado para continuar.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-[#D9D9D9] bg-white">
        <div className="max-h-[520px] space-y-4 overflow-y-auto p-4">
          {groups.map((g) => {
            const columns = g.rows?.length ? 
              Object.keys(g.rows[0]).filter((c) => c !== idField && c !== "fila") : [];
            const hasSelection = g.rows.some((r) => selected.has(r[idField]));
            const isOpen = openGroups.has(g.key);

            return (
              <div key={g.key} className={`overflow-hidden rounded-2xl border ${
                !hasSelection ? 'border-red-300 bg-red-50/30' : 'border-[#D9D9D9]'
              }`}>
                <button type="button" onClick={() => onToggleGroup(g.key)} className="w-full text-left">
                  <div className={`flex items-start justify-between gap-4 px-5 py-4 ${
                    !hasSelection ? 'bg-red-50' : 'bg-[#02979B]/5'
                  }`}>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#02979B]">Grupo duplicado</div>
                      <div className="mt-1 break-words whitespace-normal text-sm font-semibold text-[#02979B]">{g.key}</div>
                      <div className="mt-1 text-xs text-[#02979B]/60">Total filas: {g.count}</div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          hasSelection ? "bg-[#02979B] text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {hasSelection ? "Selección válida" : "Requiere selección"}
                      </span>
                      <span className="text-xs text-[#02979B]">{isOpen ? "Ocultar" : "Ver"}</span>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-b border-[#D9D9D9]">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">Seleccionar</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">Fila</th>
                          {columns.map((c) => (
                            <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {g.rows.map((r, idx) => (
                          <tr key={idx} className={`border-b border-[#D9D9D9] hover:bg-[#02979B]/5 ${
                            selected.has(r[idField]) ? 'bg-green-50' : ''
                          }`}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selected.has(r[idField])}
                                onChange={() => onToggleRow(r[idField])}
                                className="h-4 w-4 accent-[#02979B]"
                              />
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-[#02979B]">{r[idField]}</td>
                            {columns.map((c) => (
                              <td key={c} className="whitespace-nowrap px-4 py-3 text-[#02979B]">
                                {String(r[c] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}