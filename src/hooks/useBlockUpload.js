// hooks/useBlockUpload.js
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { BLOCK_SIZE } from "../constants/nodes";
import { splitExcelIntoBlocks, downloadErrorExcel } from "../utils/excelUtils";

export function useBlockUpload({ 
  baseUrl, 
  companyId, 
  subsidiaryId, 
  priceListId, 
  selectedPriceLists,
  cargaMode,
  selectedWarehouseId,
  idWarehouse,
  taxCodeCountry,
  flagUseSimpleBrand = true,
  idCountry = "1"
}) {

    console.log('🔧 [useBlockUpload] Parámetros recibidos:', {
    taxCodeCountry,
    type: typeof taxCodeCountry,
    length: taxCodeCountry?.length
  });
  
  const [progress, setProgress] = useState(0);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [blockResults, setBlockResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const buildEndpoint = () => {
    const base = `${baseUrl}/api/excel/readexcel/${encodeURIComponent(companyId)}`;
    
    if (cargaMode === "CONVERSION") {
      const selectedIds = Array.from(selectedPriceLists);
      if (selectedIds.length === 0) return "";
      
      const [primaryId, ...additionalIds] = selectedIds;
      const additionalPath = additionalIds.map(id => encodeURIComponent(id)).join('/');
      
      if (additionalPath) {
        return `${base}/pricelist/${encodeURIComponent(primaryId)}/subsidiary/${encodeURIComponent(subsidiaryId)}/${additionalPath}`;
      }
      return `${base}/pricelist/${encodeURIComponent(primaryId)}/subsidiary/${encodeURIComponent(subsidiaryId)}`;
    }
    
    return `${base}/pricelist/${encodeURIComponent(priceListId)}/subsidiary/${encodeURIComponent(subsidiaryId)}`;
  };

  const sendInBlocks = async (fileProductos) => {
    setError("");
    setResult(null);
    setBlockResults([]);
    setProgress(0);
    setLoading(true);

    try {
      const { blocks, totalRows, totalBlocks } = await splitExcelIntoBlocks(fileProductos);
      setTotalBlocks(totalBlocks);
      
      toast.info(`Procesando ${totalRows} productos en ${totalBlocks} bloques de ${BLOCK_SIZE}...`);
      
      let allResults = [];
      let successCount = 0;
      let errorCount = 0;
      let blocksWithPartialErrors = 0;
      
      for (let i = 0; i < blocks.length; i++) {
        const blockNum = i;
        const blockData = blocks[i];
        
        setCurrentBlock(blockNum + 1);
        const progressPercent = Math.round(((blockNum) / totalBlocks) * 100);
        setProgress(progressPercent);
        
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
        
        const warehouseToUse = selectedWarehouseId || idWarehouse;
        if (warehouseToUse) form.append("idWarehouse", warehouseToUse);
        
        const endpoint = buildEndpoint();
        const token = new URLSearchParams(window.location.search).get("token");
        
        const res = await fetch(endpoint, { 
          method: "POST", 
          body: form,
          headers: { "Authorization": `Bearer ${token}` }
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
          hasErrors,
          errorExcelPath: blockResult?.data?.name_excel
        };
        
        allResults.push(blockInfo);
        setBlockResults([...allResults]);
        
        if (!res.ok) {
          errorCount++;
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
        blocks_with_errors: blocksWithPartialErrors,
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

  return {
    progress,
    currentBlock,
    totalBlocks,
    blockResults,
    loading,
    error,
    result,
    setError,
    sendInBlocks,
  };
}







