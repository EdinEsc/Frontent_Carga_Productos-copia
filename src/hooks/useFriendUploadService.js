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
    nodeName
  }) => {
    setLoading(true);
    setProgress(0);
    setError(null);
    
    try {
      setProgress(20);
      toast.info("Leyendo Excel...");
      
      // 1. Leer el Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const rows = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false 
      });
      
      console.log('📊 Filas leídas:', rows.length);
      setProgress(40);
      
      // 2. Construir priceListIds
      const priceListIds = [];
      
      if (cargaMode === "CONVERSION" && selectedPriceLists.size > 0) {
        const selectedArray = Array.from(selectedPriceLists);
        selectedArray.forEach(id => {
          const pl = priceLists.find(p => String(p.id) === String(id));
          if (pl) {
            priceListIds.push({
              id: Number(id),
              name: pl.name,
              suffix: pl.suffix || ""
            });
          }
        });
      } else if (priceListId) {
        const pl = priceLists.find(p => String(p.id) === String(priceListId));
        if (pl) {
          priceListIds.push({
            id: Number(priceListId),
            name: pl.name,
            suffix: pl.suffix || ""
          });
        }
      }
      
      setProgress(60);
      
      // 3. Configuración de impuestos
      const countryElectronicTaxes = {
        codeTable: 'TABLA16',
        name: 'IGV IMPUESTO GENERAL A LAS VENTAS',
        code: '01',
        codePercentage: '01',
        percentage: taxCodeCountry === "01" ? 18 : 0
      };
      
      // 4. Preparar datos
      const companyId = Number(employeeData.companyId);
      const subsidiaryId = Number(employeeData.comSubsidiariesId || employeeData.subsidiary?.id);
      
      // 5. Construir payload
      const payload = {
        companyId,
        subsidiaryId,
        taxCodeCountry: taxCodeCountry === "01" ? "01" : null,
        cmNodeName: nodeName,
        countryCode: "PER",
        countryElectronicTaxes,
        createWarehousesIfNotExists: false,
        email: employeeData.email || "sistema",
        priceListIds,
        recreateUploadTable: false,
        rows: rows,
        salesApiUrl: `https://${nodeName}.sales.casamarketapp.com`,
        useSimpleBrand: true
      };
      
      // ===== 🔍 AQUÍ VEMOS EL PAYLOAD COMPLETO =====
      console.log('🔍🔍🔍 PAYLOAD COMPLETO A ENVIAR 🔍🔍🔍');
      console.log(JSON.stringify(payload, null, 2));
      console.log('🔍🔍🔍 FIN PAYLOAD 🔍🔍🔍');
      
      // También mostrar un resumen
      console.log('📦 RESUMEN:', {
        companyId: payload.companyId,
        subsidiaryId: payload.subsidiaryId,
        nodeName: payload.cmNodeName,
        taxCodeCountry: payload.taxCodeCountry,
        priceLists: payload.priceListIds.map(p => ({ id: p.id, name: p.name })),
        totalRows: payload.rows.length,
        primeraFila: payload.rows[0],
        ultimaFila: payload.rows[payload.rows.length - 1]
      });
      
      setProgress(80);
      
      // 6. Enviar
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
      
      setResult({
        successful_products: rows.length - 1,
        total_products: rows.length - 1,
        blocks: [],
        total_blocks: 1,
        blocks_with_errors: 0,
        mode: cargaMode
      });
      
      toast.success(`✅ ${rows.length - 1} productos enviados`);
      
      return result;
      
    } catch (err) {
      console.error("❌ Error:", err);
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