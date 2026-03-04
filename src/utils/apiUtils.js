// // utils/apiUtils.js
// import { API_URL, DEFAULT_ROUND } from '../constants/nodes';  

// export async function analyzeFile(file, mode, warehouseData, igvSettings) {
//   const form = new FormData();
//   form.append("file", file);

//   let url;
//   if (mode === "CONVERSION") {
//     url = `${API_URL}/conversion/analyze`;
//   } else {
//     url = `${API_URL}/excel/analyze?round_numeric=${DEFAULT_ROUND}`;  
//   }

//   const res = await fetch(url, {
//     method: "POST",
//     body: form,
//   });

//   if (!res.ok) {
//     const text = await res.text().catch(() => "");
//     throw new Error(`Backend respondió ${res.status}. ${text || ""}`);
//   }

//   return await res.json();
// }

// export async function downloadNormalizedFile(
//   mode,
//   uploadId,
//   selectedIds,
//   file,
//   warehouseData,
//   igvSettings,
//   onSuccess
// ) {
//   const { selectedWarehouseId, selectedWarehouseName } = warehouseData;
//   const { applyIgvCost, applyIgvSale } = igvSettings;

//   if (mode === "CONVERSION") {
//     const form = new FormData();
//     form.append("file", file);

//     const qs =
//       `?round_numeric=${DEFAULT_ROUND}` + 
//       `&apply_igv_cost=${applyIgvCost ? "true" : "false"}` +
//       `&apply_igv_sale=${applyIgvSale ? "true" : "false"}` +
//       `&is_selva=false` +
//       `&warehouse_id=${encodeURIComponent(selectedWarehouseId)}` +
//       `&tienda_nombre=${encodeURIComponent(selectedWarehouseName)}` +
//       (selectedIds.length ? `&selected_row_ids=${encodeURIComponent(selectedIds.join(","))}` : "");

//     const url = `${API_URL}/conversion/excel${qs}`;  
//     const res = await fetch(url, { method: "POST", body: form });
    
//     if (!res.ok) {
//       const text = await res.text().catch(() => "");
//       throw new Error(`Backend respondió ${res.status}. ${text || ""}`);
//     }

//     const blob = await res.blob();
//     handleDownloadBlob(blob, file, "_CONVERSION_QA.xlsx", onSuccess);
    
//   } else {
//     // ✅ VALIDACIÓN: uploadId es requerido para modo NORMAL
//     if (!uploadId) {
//       throw new Error("upload_id es requerido para normalizar");
//     }

//     const qs =
//       `&round_numeric=${DEFAULT_ROUND}` +  
//       `&apply_igv_cost=${applyIgvCost ? "true" : "false"}` +
//       `&apply_igv_sale=${applyIgvSale ? "true" : "false"}` +
//       `&is_selva=false` +
//       `&warehouse_id=${encodeURIComponent(selectedWarehouseId)}` +
//       `&tienda_nombre=${encodeURIComponent(selectedWarehouseName)}`;

//     const url = `${API_URL}/excel/normalize?upload_id=${encodeURIComponent(uploadId)}${qs}`;  

//     const res = await fetch(url, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(selectedIds),
//     });

//     if (!res.ok) {
//       const text = await res.text().catch(() => "");
//       throw new Error(`Backend respondió ${res.status}. ${text || ""}`);
//     }

//     const blob = await res.blob();
//     handleDownloadBlob(blob, file, "_QA.xlsx", onSuccess);
//   }
// }

// function handleDownloadBlob(blob, file, suffix, onSuccess) {
//   const reader = new FileReader();
//   reader.readAsDataURL(blob);
//   reader.onloadend = () => {
//     const base = (file?.name || "archivo").replace(/\.xlsx$/i, "");
//     sessionStorage.setItem("pendingExcel", reader.result);
//     sessionStorage.setItem("pendingExcelName", `${base}${suffix}`);
//     onSuccess?.();
//   };

//   const urlBlob = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = urlBlob;
//   const base = (file?.name || "archivo").replace(/\.xlsx$/i, "");
//   a.download = `${base}${suffix}`;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   window.URL.revokeObjectURL(urlBlob);
// }









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

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

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
  onSuccess
) {
  const { selectedWarehouseId, selectedWarehouseName } = warehouseData;
  const { applyIgvCost, applyIgvSale } = igvSettings;

  if (mode === "CONVERSION") {
    const form = new FormData();
    form.append("file", file);

    const qs =
      `?round_numeric=${DEFAULT_ROUND}` + 
      `&apply_igv_cost=${applyIgvCost ? "true" : "false"}` +
      `&apply_igv_sale=${applyIgvSale ? "true" : "false"}` +
      `&is_selva=false` +
      `&warehouse_id=${encodeURIComponent(selectedWarehouseId)}` +
      `&tienda_nombre=${encodeURIComponent(selectedWarehouseName)}` +
      (selectedIds.length ? `&selected_row_ids=${encodeURIComponent(selectedIds.join(","))}` : "");

    const url = `${API_URL}/conversion/excel${qs}`;  
    const res = await fetch(url, { method: "POST", body: form });
    
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Backend respondió ${res.status}. ${text || ""}`);
    }

    const blob = await res.blob();
    
    // Para conversión, extraer hoja productos
    await handleProcessedBlob(blob, file, "_CONVERSION_PRODUCTOS.xlsx", onSuccess);
    
  } else {
    // ✅ VALIDACIÓN: uploadId es requerido para modo NORMAL
    if (!uploadId) {
      throw new Error("upload_id es requerido para normalizar");
    }

    const qs =
      `&round_numeric=${DEFAULT_ROUND}` +  
      `&apply_igv_cost=${applyIgvCost ? "true" : "false"}` +
      `&apply_igv_sale=${applyIgvSale ? "true" : "false"}` +
      `&is_selva=false` +
      `&warehouse_id=${encodeURIComponent(selectedWarehouseId)}` +
      `&tienda_nombre=${encodeURIComponent(selectedWarehouseName)}`;

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
    
    // 🔥 SIEMPRE extraer la hoja "productos" - haya o no selección
    console.log('📦 Extrayendo hoja "productos" del Excel...');
    await handleProcessedBlob(blob, file, "_PRODUCTOS.xlsx", onSuccess);
  }
}

// 🆕 FUNCIÓN CORREGIDA: Procesa el blob para extraer SOLO la hoja "productos"
async function handleProcessedBlob(blob, file, suffix, onSuccess) {
  try {
    console.log('🔄 Procesando blob para extraer hoja "productos"...');
    
    // Leer el blob como arrayBuffer
    const arrayBuffer = await blob.arrayBuffer();
    
    // Leer el workbook con XLSX
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log('📚 Hojas disponibles en el Excel:', workbook.SheetNames);
    
    // Buscar la hoja "productos" en diferentes formatos
    let productosSheet = null;
    let productosSheetName = null;
    
    // Buscar primero "productos" (minúsculas)
    if (workbook.SheetNames.includes('productos')) {
      productosSheet = workbook.Sheets['productos'];
      productosSheetName = 'productos';
      console.log('✅ Hoja "productos" encontrada');
    } 
    // Si no, buscar "Productos" (mayúscula)
    else if (workbook.SheetNames.includes('Productos')) {
      productosSheet = workbook.Sheets['Productos'];
      productosSheetName = 'Productos';
      console.log('✅ Hoja "Productos" encontrada');
    }
    // Si no, buscar "PRODUCTOS" (todo mayúsculas)
    else if (workbook.SheetNames.includes('PRODUCTOS')) {
      productosSheet = workbook.Sheets['PRODUCTOS'];
      productosSheetName = 'PRODUCTOS';
      console.log('✅ Hoja "PRODUCTOS" encontrada');
    }
    // Si no, usar la primera hoja
    else {
      productosSheetName = workbook.SheetNames[0];
      productosSheet = workbook.Sheets[productosSheetName];
      console.log(`⚠️ Hoja "productos" no encontrada, usando primera hoja: "${productosSheetName}"`);
    }
    
    // Verificar que la hoja tenga datos
    const jsonData = XLSX.utils.sheet_to_json(productosSheet, { header: 1 });
    console.log('📊 Datos de la hoja seleccionada:', {
      filas: jsonData.length,
      headers: jsonData[0]
    });
    
    // 🔥 VERIFICAR QUE SEA LA HOJA CORRECTA (debe tener las columnas esperadas)
    const expectedColumns = ['name', 'description', 'parent_code', 'code', 'alt_codes', 'category_name'];
    const hasExpectedColumns = expectedColumns.some(col => 
      jsonData[0] && jsonData[0].includes(col)
    );
    
    if (!hasExpectedColumns && workbook.SheetNames.length > 1) {
      console.log('⚠️ La primera hoja no parece ser "productos", buscando otra...');
      
      // Buscar en otras hojas
      for (const sheetName of workbook.SheetNames) {
        if (sheetName === 'productos' || sheetName === 'Productos' || sheetName === 'PRODUCTOS') {
          continue; // Ya lo intentamos
        }
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (data[0] && expectedColumns.some(col => data[0].includes(col))) {
          productosSheet = sheet;
          productosSheetName = sheetName;
          console.log(`✅ Encontrada hoja con formato correcto: "${sheetName}"`);
          break;
        }
      }
    }
    
    // Crear un nuevo workbook SOLO con la hoja de productos
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, productosSheet, "productos");
    
    // Convertir a Excel binario
    const excelBuffer = XLSX.write(newWorkbook, { type: 'array', bookType: 'xlsx' });
    
    // Crear nuevo blob
    const newBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    console.log('✅ Nuevo blob creado con solo la hoja productos');
    console.log('📋 Headers del nuevo Excel:', jsonData[0]);
    
    // Guardar en sessionStorage
    const reader = new FileReader();
    reader.readAsDataURL(newBlob);
    reader.onloadend = () => {
      const base = (file?.name || "archivo").replace(/\.xlsx$/i, "");
      sessionStorage.setItem("pendingExcel", reader.result);
      sessionStorage.setItem("pendingExcelName", `${base}${suffix}`);
      console.log('💾 Excel guardado en sessionStorage con nombre:', `${base}${suffix}`);
      console.log('📋 Headers guardados:', jsonData[0]);
      onSuccess?.();
    };

    // También descargar para que el usuario lo vea
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
    console.error('❌ Error procesando blob:', err);
    // Fallback: usar el blob original
    handleDownloadBlob(blob, file, suffix, onSuccess);
  }
}

function handleDownloadBlob(blob, file, suffix, onSuccess) {
  console.log('📥 Guardando blob original con sufijo:', suffix);
  
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = () => {
    const base = (file?.name || "archivo").replace(/\.xlsx$/i, "");
    sessionStorage.setItem("pendingExcel", reader.result);
    sessionStorage.setItem("pendingExcelName", `${base}${suffix}`);
    console.log('💾 Blob guardado en sessionStorage');
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