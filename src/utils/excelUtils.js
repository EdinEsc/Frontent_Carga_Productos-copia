// utils/excelUtils.js
import * as XLSX from 'xlsx';
import { BLOCK_SIZE } from '../constants/nodes';
import { toast } from "sonner";

export async function splitExcelIntoBlocks(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  
  if (!workbook.SheetNames.includes('productos')) {
    throw new Error("El Excel no tiene una hoja llamada 'productos'");
  }
  
  const sheet = workbook.Sheets['productos'];
  const jsonData = XLSX.utils.sheet_to_json(sheet);
  
  const totalRows = jsonData.length;
  const totalBlocks = Math.ceil(totalRows / BLOCK_SIZE);
  
  const blocks = [];
  for (let i = 0; i < totalBlocks; i++) {
    const start = i * BLOCK_SIZE;
    const end = Math.min(start + BLOCK_SIZE, totalRows);
    blocks.push(jsonData.slice(start, end));
  }
  
  return { blocks, totalRows, totalBlocks };
}

export async function downloadErrorExcel(baseUrl, errorPath) {
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
}