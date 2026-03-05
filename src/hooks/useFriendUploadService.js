// hooks/useFriendUploadService.js
import { useState, useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

const COUNTRY_TAX_CONFIG = {
  'PER': {
    codeTable: 'TABLA16',
    name: 'IGV IMPUESTO GENERAL A LAS VENTAS',
    code: '01',
    codePercentage: '01',
    percentage: 18
  }
};

export function useFriendUploadService() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const uploadToFriendService = useCallback(async ({
    file,
    employeeData,
    priceLists,
    selectedPriceLists,
    priceListId,
    cargaMode,
    taxCodeCountry,
    nodeName,
    cameFromNormalizer,
    normalizerIgvSettings
  }) => {
    setLoading(true);
    setProgress(0);
    setError(null);
    
    try {
      setProgress(20);
      toast.info("Leyendo Excel...");
      

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const rows = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false 
      });
      
      setProgress(40);
      

      const priceListIds = [];
      const priceListsInfo = [];
      
      if (cargaMode === "CONVERSION" && selectedPriceLists.size > 0) {
        const selectedArray = Array.from(selectedPriceLists);
        
        if (selectedArray.length < 3) {
          toast.warning("Se recomienda seleccionar 3 listas de precios para la conversión");
        }
        
        selectedArray.forEach((id, index) => {
          const pl = priceLists.find(p => String(p.id) === String(id));
          if (pl) {
            const suffix = String(index + 1);
            priceListIds.push({
              id: Number(id),
              name: pl.name,
              suffix: suffix
            });
            
            priceListsInfo.push({
              id: Number(id),
              name: pl.name,
              suffix: suffix
            });
          }
        });
        
      } else if (priceListId) {
        const pl = priceLists.find(p => String(p.id) === String(priceListId));
        if (pl) {
          priceListIds.push({
            id: Number(priceListId),
            name: pl.name,
            suffix: "1"
          });
          
          priceListsInfo.push({
            id: Number(priceListId),
            name: pl.name,
            suffix: "1"
          });
        }
      }
      
      setProgress(60);
      

      const countryElectronicTaxes = {
        codeTable: 'TABLA16',
        name: 'IGV IMPUESTO GENERAL A LAS VENTAS',
        code: '01',
        codePercentage: '01',
        percentage: 18
      };
      

      const companyId = Number(employeeData.companyId);
      const subsidiaryId = Number(employeeData.comSubsidiariesId || employeeData.subsidiary?.id);
      

      const payload = {
        companyId,
        subsidiaryId,
        taxCodeCountry: taxCodeCountry, 
        cmNodeName: nodeName,
        countryCode: "PER",
        countryElectronicTaxes,
        createWarehousesIfNotExists: true,
        email: employeeData.email || "sistema",
        priceListIds: priceListIds,
        recreateUploadTable: false,
        rows: rows,
        salesApiUrl: `https://${nodeName}.sales.casamarketapp.com`,
        useSimpleBrand: true
      };
      
      setProgress(80);
      

      const token = new URLSearchParams(window.location.search).get("token");
      
      const response = await fetch(
        "https://lwrpxnqsxlsd34sv6xstvqldea0kmpgx.lambda-url.us-east-1.on.aws/upload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          },
          body: JSON.stringify(payload)
        }
      );
      
      setProgress(100);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText.substring(0, 200)}`);
      }
      
      const result = await response.json();
      
      const finalResult = {
        successful_products: rows.length - 1,
        total_products: rows.length - 1,
        blocks: [],
        total_blocks: 1,
        blocks_with_errors: result.errors ? result.errors.length : 0,
        mode: cargaMode,
        priceListsInfo: priceListsInfo,
        errors: result.errors
      };
      
      setResult(finalResult);
      
      if (result.status === "error") {
        toast.warning(`Carga completada con ${result.errors?.length || 0} errores`);
      }
      
      return finalResult;
      
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    progress,
    result,
    error,
    uploadToFriendService
  };
}