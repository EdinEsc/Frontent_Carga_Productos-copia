import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useWarehouse } from "../hooks/useWarehouse";
import { DEFAULT_ROUND, API_URL } from "../constants/nodes";
import { analyzeFile, downloadNormalizedFile } from "../utils/apiUtils";
import Spinner from "./shared/Spinner";
import ToggleCard from "./shared/ToggleCard";
import ModeButton from "./shared/ModeButton";
import FileUploader from "./shared/FileUploader";
import DeleteConfirmDialog from "./shared/DeleteConfirmDialog";

export default function ExcelNormalizer({ onNavigateToCarga, warehouses = [] }) {
  const [mode, setMode] = useState("NORMAL");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadId, setUploadId] = useState(null);

  const [groups, setGroups] = useState([]);
  const [codeGroups, setCodeGroups] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const [openCodeGroups, setOpenCodeGroups] = useState(() => new Set());
  const [selectAllEnabled, setSelectAllEnabled] = useState(false);


  const [manuallyDeletedIds, setManuallyDeletedIds] = useState(() => new Set());

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    groupId: null,
    rowId: null,
    isCodeGroup: false,
    rowData: null
  });

  const [applyIgvSale, setApplyIgvSale] = useState(true);

  const { selectedWarehouseId, selectedWarehouseName, handleWarehouseChange, validateWarehouse } =
    useWarehouse(warehouses);

  useEffect(() => {
    console.log('🏁 [Normalizer] Componente montado:', { applyIgvSale, selectedWarehouseId });
  }, []);

  useEffect(() => {
    console.log('🔄 [Normalizer] IGV Venta cambiado:', { applyIgvSale });
  }, [applyIgvSale]);

  useEffect(() => {
    console.log('🏢 [Normalizer] Warehouse cambiado:', { selectedWarehouseId, selectedWarehouseName });
  }, [selectedWarehouseId, selectedWarehouseName]);

  const igvSettings = useMemo(() => ({
    DEFAULT_ROUND,
    applyIgvSale
  }), [applyIgvSale]);

  const resetDuplicatesUI = () => {
    setGroups([]);
    setCodeGroups([]);
    setSelected(new Set());
    setOpenGroups(new Set());
    setOpenCodeGroups(new Set());
    setManuallyDeletedIds(new Set());
  };

  const openDeleteDialog = (groupId, rowId, isCodeGroup = false, rowData = null) => {
    setDeleteDialog({ isOpen: true, groupId, rowId, isCodeGroup, rowData });
  };

  const confirmDelete = () => {
    const { groupId, rowId, isCodeGroup } = deleteDialog;


    setManuallyDeletedIds(prev => {
      const next = new Set(prev);
      next.add(rowId);
      return next;
    });


    setSelected(prev => {
      const next = new Set(prev);
      next.delete(rowId);
      return next;
    });

    if (isCodeGroup) {
      setCodeGroups(prevGroups =>
        prevGroups.map(group => {
          if (group.codigo === groupId) {
      
            const newRows = group.rows.filter(row => 
              row.fila !== rowId && row.__ROW_ID__ !== rowId
            );
            if (newRows.length === 0) return null;
            return { ...group, rows: newRows, count: newRows.length };
          }
          return group;
        }).filter(Boolean)
      );
    } else {
      setGroups(prevGroups =>
        prevGroups.map(group => {
          if (group.key === groupId) {
   
            const newRows = group.rows.filter(row => row.fila !== rowId);
            if (newRows.length === 0) return null;
            return { ...group, rows: newRows, count: newRows.length };
          }
          return group;
        }).filter(Boolean)
      );
    }

    toast.success('Fila eliminada correctamente');
    closeDeleteDialog();
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, groupId: null, rowId: null, isCodeGroup: false, rowData: null });
  };

  const toggleRow = (rowId) => {

    if (manuallyDeletedIds.has(rowId)) {
      return;
    }
    
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const getRowId = (row) => {

    return row.fila || row.__ROW_ID__;
  };

  const getAllRowsFromAllGroups = () => {
    const allRows = new Set();
    

    for (const g of groups) {
      for (const r of g.rows || []) {
        const rowId = getRowId(r);
        if (rowId && !manuallyDeletedIds.has(rowId)) {
          allRows.add(rowId);
        }
      }
    }
    

    for (const g of codeGroups) {
      for (const r of g.rows || []) {
        const rowId = getRowId(r);
        if (rowId && !manuallyDeletedIds.has(rowId)) {
          allRows.add(rowId);
        }
      }
    }
    return allRows;
  };

  const toggleSelectAll = () => {
    setSelectAllEnabled(prev => {
      const next = !prev;
      if (next) {
 
        const allRows = getAllRowsFromAllGroups();
        setSelected(allRows);
      } else {
        setSelected(new Set());
      }
      return next;
    });
  };

  const validateSelection = () => {
    const invalidNameGroups = [];
    const invalidCodeGroups = [];

  
    for (const g of groups) {
      const availableRows = g.rows.filter(r => {
        const rowId = getRowId(r);
        return !manuallyDeletedIds.has(rowId);
      });
      const hasOne = availableRows.some(r => {
        const rowId = getRowId(r);
        return selected.has(rowId);
      });
      if (!hasOne && availableRows.length > 0) invalidNameGroups.push(g.key);
    }
    
    
    for (const g of codeGroups) {
      const availableRows = g.rows.filter(r => {
        const rowId = getRowId(r);
        return !manuallyDeletedIds.has(rowId);
      });
      const hasOne = availableRows.some(r => {
        const rowId = getRowId(r);
        return selected.has(rowId);
      });
      if (!hasOne && availableRows.length > 0) invalidCodeGroups.push(g.codigo);
    }

    return {
      isValid: invalidNameGroups.length === 0 && invalidCodeGroups.length === 0,
      invalidNameGroups,
      invalidCodeGroups
    };
  };

  const toggleGroupOpen = (key) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCodeGroupOpen = (codigo) => {
    setOpenCodeGroups(prev => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
  };

  const saveState = () => {
    sessionStorage.setItem('applyIgvSale', String(applyIgvSale));
    if (selectedWarehouseId) {
      sessionStorage.setItem('selectedWarehouseId', selectedWarehouseId);
    }
  };

  const handleDownload = async (selectedIds, uploadIdParam = null) => {
    const effectiveUploadId = uploadIdParam || uploadId;

    saveState();

    if (mode === "NORMAL" && !effectiveUploadId) {
      setError("Error: No se pudo obtener el ID de carga");
      return;
    }

    const warehouseData = { selectedWarehouseId, selectedWarehouseName };

   
    const deletedIds = Array.from(manuallyDeletedIds);
    
  
    const validSelectedIds = selectedIds.filter(id => id !== undefined && id !== null);

    console.log('📥 [Normalizer] DESCARGANDO:', {
      mode, 
      uploadId: effectiveUploadId,
      filasDuplicadasSeleccionadas: validSelectedIds.length,
      filasEliminadas: deletedIds.length,
      applyIgvSale, 
      selectedWarehouseId
    });

    try {
      await downloadNormalizedFile(
        mode,
        effectiveUploadId,
        validSelectedIds,
        file,
        warehouseData,
        igvSettings,
        deletedIds,
        () => {
          if (selectedWarehouseId) {
            sessionStorage.setItem('selectedWarehouseId', selectedWarehouseId);
          }
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
      const data = await analyzeFile(file, mode, { selectedWarehouseId, selectedWarehouseName }, igvSettings);

      if (mode === "NORMAL" && data.upload_id) {
        setUploadId(data.upload_id);
      }

      const nextGroups = data.groups || [];
      const nextCodeGroups = data.code_duplicate_groups || [];

      
      const normalizedGroups = nextGroups.map(g => ({
        ...g,
        rows: g.rows.map(r => ({
          ...r,
          fila: r.fila || r.__ROW_ID__
        }))
      }));

      const normalizedCodeGroups = nextCodeGroups.map(g => ({
        ...g,
        rows: g.rows.map(r => ({
          ...r,
          fila: r.fila || r.__ROW_ID__
        }))
      }));

      setGroups(normalizedGroups);
      setCodeGroups(normalizedCodeGroups);

     
      setSelected(new Set());
      setSelectAllEnabled(false);

      if (normalizedGroups.length > 0) setOpenGroups(new Set([normalizedGroups[0].key]));
      if (normalizedCodeGroups.length > 0) setOpenCodeGroups(new Set([normalizedCodeGroups[0].codigo]));

      if (!data.has_duplicates && !data.has_code_duplicates) {
        if (mode === "NORMAL" && !data.upload_id) {
          throw new Error("El backend no proporcionó un upload_id");
        }
        saveState();
        await handleDownload([], data.upload_id);
      }
    } catch (err) {
      setError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const onContinueWithSelection = async () => {
    const validation = validateWarehouse();
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const selectionValidation = validateSelection();
    if (!selectionValidation.isValid) {
      let errorMessage = "Debe seleccionar al menos una fila por cada grupo duplicado.\n\n";
      if (selectionValidation.invalidNameGroups.length > 0)
        errorMessage += `Nombres pendientes: ${selectionValidation.invalidNameGroups.length}\n`;
      if (selectionValidation.invalidCodeGroups.length > 0)
        errorMessage += `Códigos pendientes: ${selectionValidation.invalidCodeGroups.length}`;
      setError(errorMessage);
      toast.error(errorMessage, { duration: 5000 });
      return;
    }

    saveState();

    try {
      setLoading(true);
 
      const selectedIds = Array.from(selected);
      await handleDownload(selectedIds);
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
        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
          <div className="text-sm font-semibold text-[#02979B]">Tipo de carga</div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <ModeButton active={mode === "NORMAL"} onClick={() => setMode("NORMAL")} title="Carga normal" desc="Analiza duplicados por codigo, nombre y descarga QA." />
            <ModeButton active={mode === "CONVERSION"} onClick={() => setMode("CONVERSION")} title="Por conversión" desc="Analiza duplicados por codigo, nombre y descarga QA (con selección)." />
          </div>
        </div>

        <FileUploader
          file={file}
          onFileChange={setFile}
          description={`Endpoint: ${API_URL}/${mode === "NORMAL" ? "excel" : "conversion"}/analyze`}
        />

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

        <div className="grid gap-3 md:grid-cols-2">
          <ToggleCard
            title="Aplicar IGV (1.18) a Precio Venta"
            value={applyIgvSale}
            onToggle={() => setApplyIgvSale(v => !v)}
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

        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-[#02979B]">
                Almacén <span className="text-red-500">*</span>
              </label>
              {warehouses.length === 0 ? (
                <div className="mt-1 rounded-xl border border-[#D9D9D9] bg-gray-50 px-3 py-2 text-sm text-gray-500">Cargando almacenes...</div>
              ) : warehouses.length === 1 ? (
                <input type="text" value={warehouses[0].name} readOnly className="mt-1 w-full rounded-xl border border-[#D9D9D9] bg-gray-100 px-3 py-2 text-sm text-[#02979B]" />
              ) : (
                <select value={selectedWarehouseId} onChange={handleWarehouseChange} required className="mt-1 w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]">
                  <option value="">Seleccione un almacén</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={String(w.id)}>{w.name}</option>
                  ))}
                </select>
              )}
              {warehouses.length > 1 && !selectedWarehouseId && (
                <p className="mt-1 text-xs text-red-500">Debe seleccionar un almacén para continuar</p>
              )}
            </div>
          </div>
        </div>

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
                  <><Spinner />Procesando...</>
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
                {validationResult.invalidNameGroups.length > 0 && `${validationResult.invalidNameGroups.length} nombre(s) duplicado(s) sin selección. `}
                {validationResult.invalidCodeGroups.length > 0 && `${validationResult.invalidCodeGroups.length} código(s) duplicado(s) sin selección.`}
              </p>
              <p className="text-xs text-red-600 mt-1">Debe seleccionar al menos UNA fila por cada grupo duplicado antes de continuar.</p>
            </div>
          </div>
        </div>
      )}

      {hasDuplicates && (
        <DuplicateGroup
          title="Nombres duplicados detectados"
          groups={groups}
          selected={selected}
          openGroups={openGroups}
          onToggleGroup={toggleGroupOpen}
          onToggleRow={toggleRow}
          onDeleteRow={(groupId, rowId, rowData) => openDeleteDialog(groupId, rowId, false, rowData)}
          idField="fila"
          manuallyDeletedIds={manuallyDeletedIds}
        />
      )}

      {hasCodeDuplicates && (
        <DuplicateGroup
          title="Códigos duplicados detectados"
          groups={codeGroups}
          selected={selected}
          openGroups={openCodeGroups}
          onToggleGroup={key => toggleCodeGroupOpen(key)}
          onToggleRow={toggleRow}
          onDeleteRow={(groupId, rowId, rowData) => openDeleteDialog(groupId, rowId, true, rowData)}
          idField="fila"
          manuallyDeletedIds={manuallyDeletedIds}
        />
      )}

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
            {loading ? <><Spinner />Generando...</> : "Continuar y descargar QA"}
          </button>
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        rowData={deleteDialog.rowData}
      />
    </div>
  );
}

function DuplicateGroup({ title, groups, selected, openGroups, onToggleGroup, onToggleRow, onDeleteRow, idField, manuallyDeletedIds }) {
  // Filtrar filas eliminadas
  const filteredGroups = groups.map(g => ({
    ...g,
    rows: g.rows.filter(r => !manuallyDeletedIds.has(r[idField]))
  })).filter(g => g.rows.length > 0);

  return (
    <div className="mt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#02979B]">{title}</h2>
          <p className="mt-1 text-sm text-[#02979B]/60">
            Seleccione al menos una fila por cada grupo duplicado para continuar. Puede eliminar filas con el botón 🗑️.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-[#D9D9D9] bg-white">
        <div className="max-h-[520px] space-y-4 overflow-y-auto p-4">
          {filteredGroups.map(g => {
            // Determinar las columnas a mostrar (excluir el idField)
            const allColumns = g.rows?.length ? Object.keys(g.rows[0]) : [];
            const columns = allColumns.filter(c => c !== idField && c !== "__ROW_ID__");
            
            const hasSelection = g.rows.some(r => selected.has(r[idField]));
            const isOpen = openGroups.has(g.key);

            return (
              <div key={g.key} className={`overflow-hidden rounded-2xl border ${!hasSelection ? 'border-red-300 bg-red-50/30' : 'border-[#D9D9D9]'}`}>
                <button type="button" onClick={() => onToggleGroup(g.key)} className="w-full text-left">
                  <div className={`flex items-start justify-between gap-4 px-5 py-4 ${!hasSelection ? 'bg-red-50' : 'bg-[#02979B]/5'}`}>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#02979B]">Grupo duplicado</div>
                      <div className="mt-1 break-words whitespace-normal text-sm font-semibold text-[#02979B]">{g.key}</div>
                      <div className="mt-1 text-xs text-[#02979B]/60">Total filas: {g.count}</div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${hasSelection ? "bg-[#02979B] text-white" : "bg-red-500 text-white"}`}>
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
                          {columns.map(c => (
                            <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">{c}</th>
                          ))}
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#02979B]">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.rows.map((r, idx) => {
                          const rowId = r[idField];
                          const isChecked = selected.has(rowId);
                          
                          return (
                            <tr key={idx} className={`border-b border-[#D9D9D9] hover:bg-[#02979B]/5 ${isChecked ? 'bg-green-50' : ''}`}>
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => onToggleRow(rowId)}
                                  className="h-4 w-4 accent-[#02979B] cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-[#02979B]">{rowId}</td>
                              {columns.map(c => (
                                <td key={c} className="whitespace-nowrap px-4 py-3 text-[#02979B]">{String(r[c] ?? "")}</td>
                              ))}
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => onDeleteRow(g.key, rowId, r)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                  title="Eliminar esta fila"
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round"/>
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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