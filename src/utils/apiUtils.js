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
    handleDownloadBlob(blob, file, "_CONVERSION_QA.xlsx", onSuccess);
    
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
    handleDownloadBlob(blob, file, "_QA.xlsx", onSuccess);
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