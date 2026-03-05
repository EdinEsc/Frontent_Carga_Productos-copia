// utils/apiUtils.js
import { API_URL, DEFAULT_ROUND } from '../constants/nodes';
import * as XLSX from 'xlsx';

export async function analyzeFile(file, mode, warehouseData, igvSettings) {
  const form = new FormData();
  form.append("file", file);

  let url;
  if (mode === "CONVERSION") {
    url = `${API_URL}/conversion/analyze`;
  } else {
    url = `${API_URL}/excel/analyze?round_numeric=${DEFAULT_ROUND}`;
  }

  const res = await fetch(url, { method: "POST", body: form });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend respondió ${res.status}. ${text || ""}`);
  }

  return await res.json();
}

export async function downloadNormalizedFile(
  mode,
  uploadId,
  selectedIds,
  file,
  warehouseData,
  igvSettings,
  deletedIds = [],
  onSuccess
) {
  const { selectedWarehouseId, selectedWarehouseName } = warehouseData;
  const { applyIgvSale } = igvSettings;

  const igvSaleValue = applyIgvSale ? "true" : "false";

  if (mode === "CONVERSION") {
    const form = new FormData();
    form.append("file", file);

    const qs =
      `?round_numeric=${DEFAULT_ROUND}` +
      `&apply_igv_sale=${igvSaleValue}` +
      `&is_selva=false` +
      `&warehouse_id=${encodeURIComponent(selectedWarehouseId)}` +
      `&tienda_nombre=${encodeURIComponent(selectedWarehouseName)}` +
      (selectedIds.length ? `&selected_row_ids=${encodeURIComponent(selectedIds.join(","))}` : "") +
      (deletedIds.length ? `&deleted_row_ids=${encodeURIComponent(deletedIds.join(","))}` : "");

    const url = `${API_URL}/conversion/excel${qs}`;
    const res = await fetch(url, { method: "POST", body: form });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Backend respondió ${res.status}. ${text || ""}`);
    }

    const blob = await res.blob();
    await handleProcessedBlob(blob, file, "_CONVERSION_PRODUCTOS.xlsx", onSuccess);

  } else {
    if (!uploadId) throw new Error("upload_id es requerido para normalizar");

    const qs =
      `&round_numeric=${DEFAULT_ROUND}` +
      `&apply_igv_sale=${igvSaleValue}` +
      `&is_selva=false` +
      `&warehouse_id=${encodeURIComponent(selectedWarehouseId)}` +
      `&tienda_nombre=${encodeURIComponent(selectedWarehouseName)}` +
      (deletedIds.length ? `&deleted_row_ids=${encodeURIComponent(deletedIds.join(","))}` : "");

    const url = `${API_URL}/excel/normalize?upload_id=${encodeURIComponent(uploadId)}${qs}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedIds),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Backend respondió ${res.status}. ${text || ""}`);
    }

    const blob = await res.blob();
    await handleProcessedBlob(blob, file, "_PRODUCTOS.xlsx", onSuccess);
  }
}

async function handleProcessedBlob(blob, file, suffix, onSuccess) {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    let productosSheet = null;
    let productosSheetName = null;

    if (workbook.SheetNames.includes('productos')) {
      productosSheet = workbook.Sheets['productos'];
      productosSheetName = 'productos';
    } else if (workbook.SheetNames.includes('Productos')) {
      productosSheet = workbook.Sheets['Productos'];
      productosSheetName = 'Productos';
    } else if (workbook.SheetNames.includes('PRODUCTOS')) {
      productosSheet = workbook.Sheets['PRODUCTOS'];
      productosSheetName = 'PRODUCTOS';
    } else {
      productosSheetName = workbook.SheetNames[0];
      productosSheet = workbook.Sheets[productosSheetName];
    }

    const jsonData = XLSX.utils.sheet_to_json(productosSheet, { header: 1 });

    const expectedColumns = ['name', 'description', 'parent_code', 'code', 'alt_codes', 'category_name'];
    const hasExpectedColumns = expectedColumns.some(col => jsonData[0] && jsonData[0].includes(col));

    if (!hasExpectedColumns && workbook.SheetNames.length > 1) {
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (data[0] && expectedColumns.some(col => data[0].includes(col))) {
          productosSheet = sheet;
          productosSheetName = sheetName;
          break;
        }
      }
    }

    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, productosSheet, "productos");

    const excelBuffer = XLSX.write(newWorkbook, { type: 'array', bookType: 'xlsx' });
    const newBlob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const reader = new FileReader();
    reader.readAsDataURL(newBlob);
    reader.onloadend = () => {
      const base = (file?.name || "archivo").replace(/\.xlsx$/i, "");
      sessionStorage.setItem("pendingExcel", reader.result);
      sessionStorage.setItem("pendingExcelName", `${base}${suffix}`);
      onSuccess?.();
    };

    const urlBlob = window.URL.createObjectURL(newBlob);
    const a = document.createElement("a");
    a.href = urlBlob;
    const base = (file?.name || "archivo").replace(/\.xlsx$/i, "");
    a.download = `${base}${suffix}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(urlBlob);

  } catch (err) {
    handleDownloadBlob(blob, file, suffix, onSuccess);
  }
}

function handleDownloadBlob(blob, file, suffix, onSuccess) {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = () => {
    const base = (file?.name || "archivo").replace(/\.xlsx$/i, "");
    sessionStorage.setItem("pendingExcel", reader.result);
    sessionStorage.setItem("pendingExcelName", `${base}${suffix}`);
    onSuccess?.();
  };

  const urlBlob = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = urlBlob;
  const base = (file?.name || "archivo").replace(/\.xlsx$/i, "");
  a.download = `${base}${suffix}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(urlBlob);
}