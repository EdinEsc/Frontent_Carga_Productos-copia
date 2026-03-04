// // hooks/useFriendUploadService.js
// import { useState, useCallback } from "react";
// import { toast } from "sonner";
// import * as XLSX from 'xlsx';

// const COUNTRY_TAX_CONFIG = {
//   'PER': {
//     codeTable: 'TABLA16',
//     name: 'IGV IMPUESTO GENERAL A LAS VENTAS',
//     code: '01',
//     codePercentage: '01',
//     percentage: 18
//   }
// };

// export function useFriendUploadService() {
//   const [loading, setLoading] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState(null);

//   const uploadToFriendService = useCallback(async ({
//     file,
//     employeeData,
//     priceLists,
//     selectedPriceLists,
//     priceListId,
//     cargaMode,
//     taxCodeCountry,
//     nodeName,
//     cameFromNormalizer,
//     normalizerIgvSettings
//   }) => {
//     setLoading(true);
//     setProgress(0);
//     setError(null);
    
//     try {
//       setProgress(20);
//       toast.info("Leyendo Excel...");
      
//       // 1. Leer el Excel
//       const data = await file.arrayBuffer();
//       const workbook = XLSX.read(data, { type: 'array' });
//       const sheetName = workbook.SheetNames[0];
//       const worksheet = workbook.Sheets[sheetName];
      
//       const rows = XLSX.utils.sheet_to_json(worksheet, { 
//         header: 1,
//         defval: '',
//         blankrows: false 
//       });
      
//       console.log('📊 Filas leídas:', rows.length);
//       console.log('📋 Headers:', rows[0]);
      
//       // 🔥 NO APLICAR IGV NUNCA - El Excel ya viene con los precios correctos
//       console.log('💰 Usando precios del Excel sin modificar');
      
//       setProgress(40);
      
//       // 2. Construir priceListIds según el modo
//       const priceListIds = [];
      
//       if (cargaMode === "CONVERSION" && selectedPriceLists.size > 0) {
//         const selectedArray = Array.from(selectedPriceLists);
        
//         if (selectedArray.length < 3) {
//           toast.warning("Se recomienda seleccionar 3 listas de precios para la conversión");
//         }
        
//         selectedArray.forEach((id, index) => {
//           const pl = priceLists.find(p => String(p.id) === String(id));
//           if (pl) {
//             const suffix = String(index + 1);
//             priceListIds.push({
//               id: Number(id),
//               name: pl.name,
//               suffix: suffix
//             });
            
//             console.log(`📋 Lista ${index + 1}: ${pl.name} (ID: ${id}) con sufijo: ${suffix}`);
//           }
//         });
        
//       } else if (priceListId) {
//         const pl = priceLists.find(p => String(p.id) === String(priceListId));
//         if (pl) {
//           priceListIds.push({
//             id: Number(priceListId),
//             name: pl.name,
//             suffix: "1"
//           });
          
//           console.log(`📋 Lista única: ${pl.name} (ID: ${priceListId}) con sufijo: 1`);
//         }
//       }
      
//       setProgress(60);
      
//       // 3. Configuración de impuestos
//       const countryElectronicTaxes = {
//         codeTable: 'TABLA16',
//         name: 'IGV IMPUESTO GENERAL A LAS VENTAS',
//         code: '01',
//         codePercentage: '01',
//         percentage: 18
//       };
      
//       // 4. Preparar datos
//       const companyId = Number(employeeData.companyId);
//       const subsidiaryId = Number(employeeData.comSubsidiariesId || employeeData.subsidiary?.id);
      
//       // 5. Construir payload
//       const payload = {
//         companyId,
//         subsidiaryId,
//         taxCodeCountry: taxCodeCountry === "01" ? "01" : null,
//         cmNodeName: nodeName,
//         countryCode: "PER",
//         countryElectronicTaxes,
//         createWarehousesIfNotExists: true,
//         email: employeeData.email || "sistema",
//         priceListIds: priceListIds,
//         recreateUploadTable: false,
//         rows: rows,
//         salesApiUrl: `https://${nodeName}.sales.casamarketapp.com`,
//         useSimpleBrand: true
//       };
      
//       console.log('🔍🔍🔍 PAYLOAD COMPLETO A ENVIAR 🔍🔍🔍');
//       console.log(JSON.stringify(payload, null, 2));
      
//       // Verificar columnas
//       const headers = rows[0];
//       priceListIds.forEach(pl => {
//         const rangoCol = `rango_precio_${pl.suffix}`;
//         const precioCol = `precio_venta_${pl.suffix}`;
        
//         if (!headers.includes(rangoCol)) {
//           console.warn(`⚠️ ADVERTENCIA: Columna ${rangoCol} no encontrada en el Excel`);
//         }
//         if (!headers.includes(precioCol)) {
//           console.warn(`⚠️ ADVERTENCIA: Columna ${precioCol} no encontrada en el Excel`);
//         }
//       });
      
//       console.log('📦 RESUMEN:', {
//         modo: cargaMode,
//         origen: cameFromNormalizer ? 'Normalizer' : 'Directo',
//         taxCodeCountry,
//         totalRows: payload.rows.length,
//       });
      
//       setProgress(80);
      
//       // 6. Enviar
//       const token = new URLSearchParams(window.location.search).get("token");
      
//       const response = await fetch(
//         "https://lwrpxnqsxlsd34sv6xstvqldea0kmpgx.lambda-url.us-east-1.on.aws/upload",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token && { "Authorization": `Bearer ${token}` })
//           },
//           body: JSON.stringify(payload)
//         }
//       );
      
//       setProgress(100);
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Error ${response.status}: ${errorText.substring(0, 200)}`);
//       }
      
//       const result = await response.json();
      
//       if (result.status === "error" && result.errors) {
//         console.error("❌ Errores en la respuesta:", result.errors);
//       }
      
//       setResult({
//         successful_products: rows.length - 1,
//         total_products: rows.length - 1,
//         blocks: [],
//         total_blocks: 1,
//         blocks_with_errors: result.errors ? result.errors.length : 0,
//         mode: cargaMode,
//         errors: result.errors
//       });
      
//       const listasMsg = priceListIds.map(p => `${p.name} (sufijo ${p.suffix})`).join(', ');
      
//       if (result.status === "error") {
//         toast.warning(`⚠️ Carga completada con ${result.errors?.length || 0} errores. Listas usadas: ${listasMsg}`);
//       } else {
//         toast.success(`✅ ${rows.length - 1} productos enviados con ${priceListIds.length} lista(s): ${listasMsg}`);
//       }
      
//       return result;
      
//     } catch (err) {
//       console.error("❌ Error:", err);
//       setError(err.message);
//       toast.error(`Error: ${err.message}`);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   return {
//     loading,
//     progress,
//     result,
//     error,
//     uploadToFriendService
//   };
// }






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
      console.log('📋 Headers:', rows[0]);
      
      // 🔥 NO APLICAR IGV NUNCA - El Excel ya viene con los precios correctos
      console.log('💰 Usando precios del Excel sin modificar');
      
      setProgress(40);
      
      // 2. Construir priceListIds según el modo
      const priceListIds = [];
      
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
            
            console.log(`📋 Lista ${index + 1}: ${pl.name} (ID: ${id}) con sufijo: ${suffix}`);
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
          
          console.log(`📋 Lista única: ${pl.name} (ID: ${priceListId}) con sufijo: 1`);
        }
      }
      
      setProgress(60);
      
      // 3. Configuración de impuestos
      const countryElectronicTaxes = {
        codeTable: 'TABLA16',
        name: 'IGV IMPUESTO GENERAL A LAS VENTAS',
        code: '01',
        codePercentage: '01',
        percentage: 18
      };
      
      // 4. Preparar datos
      const companyId = Number(employeeData.companyId);
      const subsidiaryId = Number(employeeData.comSubsidiariesId || employeeData.subsidiary?.id);
      
      // 5. Construir payload - 
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
      
      console.log('🔍🔍🔍 PAYLOAD COMPLETO A ENVIAR 🔍🔍🔍');
      console.log(JSON.stringify(payload, null, 2));
      
      // Verificar columnas
      const headers = rows[0];
      priceListIds.forEach(pl => {
        const rangoCol = `rango_precio_${pl.suffix}`;
        const precioCol = `precio_venta_${pl.suffix}`;
        
        if (!headers.includes(rangoCol)) {
          console.warn(`⚠️ ADVERTENCIA: Columna ${rangoCol} no encontrada en el Excel`);
        }
        if (!headers.includes(precioCol)) {
          console.warn(`⚠️ ADVERTENCIA: Columna ${precioCol} no encontrada en el Excel`);
        }
      });
      
      console.log('📦 RESUMEN:', {
        modo: cargaMode,
        origen: cameFromNormalizer ? 'Normalizer' : 'Directo',
        taxCodeCountry, // 👈 Mostramos el valor real
        totalRows: payload.rows.length,
        significado: taxCodeCountry === '01' ? 'Con IGV' : 'Sin IGV'
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
      
      if (result.status === "error" && result.errors) {
        console.error("❌ Errores en la respuesta:", result.errors);
      }
      
      setResult({
        successful_products: rows.length - 1,
        total_products: rows.length - 1,
        blocks: [],
        total_blocks: 1,
        blocks_with_errors: result.errors ? result.errors.length : 0,
        mode: cargaMode,
        errors: result.errors
      });
      
      const listasMsg = priceListIds.map(p => `${p.name} (sufijo ${p.suffix})`).join(', ');
      
      if (result.status === "error") {
        toast.warning(`⚠️ Carga completada con ${result.errors?.length || 0} errores. Listas usadas: ${listasMsg}`);
      } else {
        toast.success(`✅ ${rows.length - 1} productos enviados con ${priceListIds.length} lista(s): ${listasMsg}`);
      }
      
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





