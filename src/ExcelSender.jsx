// src/ExcelSender.jsx
import { useMemo, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export default function ExcelSender() {
  const NODES = useMemo(
    () => [
      { key: "n1", label: "Nodo 1", base: "https://n1.japiexcel.casamarketapp.com" },
      { key: "n23", label: "Nodo 2 / 3", base: "https://n3.japiexcel.casamarketapp.com" },
      { key: "n4", label: "Nodo 4", base: "https://n4.japiexcel.casamarketapp.com" },
      { key: "n5", label: "Nodo 5", base: "https://n5.japiexcel.casamarketapp.com" },
    ],
    []
  );

  const [nodeKey, setNodeKey] = useState("n1");
  const [companyId, setCompanyId] = useState("");
  const [priceListId, setPriceListId] = useState("");
  const [subsidiaryId, setSubsidiaryId] = useState("");

  const [idWarehouse, setIdWarehouse] = useState("");
  const [idCountry, setIdCountry] = useState("1");
  const [taxCodeCountry, setTaxCodeCountry] = useState("02");
  const [flagUseSimpleBrand, setFlagUseSimpleBrand] = useState(true);

  const [fileProductos, setFileProductos] = useState(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState(null);
  const [result, setResult] = useState(null);

  const baseUrl = useMemo(() => {
    return NODES.find((n) => n.key === nodeKey)?.base || NODES[0].base;
  }, [nodeKey, NODES]);

  const buildEndpoint = useCallback(() => {
    return (
      `${baseUrl}/api/excel/readexcel/${encodeURIComponent(companyId)}` +
      `/pricelist/${encodeURIComponent(priceListId)}` +
      `/subsidiary/${encodeURIComponent(subsidiaryId)}`
    );
  }, [baseUrl, companyId, priceListId, subsidiaryId]);

  const endpointPreview =
    companyId && priceListId && subsidiaryId ? buildEndpoint() : "";

  const canSend =
    !!fileProductos && !!companyId && !!priceListId && !!subsidiaryId && !loading;

  // ======================
  // CARGAR ARCHIVO PENDIENTE DESDE NORMALIZER - VERSIÓN CORREGIDA (UNA SOLA VEZ)
  // ======================
  useEffect(() => {
    let isMounted = true;
    let toastShown = false; // Control para evitar múltiples toasts
    
    const loadPendingFile = async () => {
      const pendingExcel = sessionStorage.getItem('pendingExcel');
      const pendingName = sessionStorage.getItem('pendingExcelName');

      if (pendingExcel && pendingName && isMounted && !toastShown) {
        try {
          const res = await fetch(pendingExcel);
          const blob = await res.blob();
          
          if (!isMounted) return;
          
          const file = new File([blob], pendingName, { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          
          setFileProductos(file);
          
          // Limpiar sessionStorage ANTES del toast
          sessionStorage.removeItem('pendingExcel');
          sessionStorage.removeItem('pendingExcelName');
          
          // Marcar que ya mostramos el toast
          toastShown = true;
          
          // Única notificación con ID único
          toast.success(`Archivo "${pendingName}" listo para enviar`, {
            duration: 3000,
            id: 'pending-file-toast' // ID único para evitar duplicados
          });
          
        } catch (err) {
          console.error("Error cargando archivo pendiente:", err);
        }
      }
    };

    loadPendingFile();
    
    return () => {
      isMounted = false;
    };
  }, []); // Array vacío = se ejecuta solo UNA VEZ al montar

  const parseError = (errorMessage, statusCode) => {
    const errors = {
      "invalid excel": "El archivo Excel tiene un formato inválido",
      "invalid format": "Formato de archivo no soportado",
      "missing columns": "Faltan columnas requeridas en el Excel",
      "company not found": "El Company ID no existe en el sistema",
      "pricelist not found": "El PriceList ID no existe o no pertenece a esta compañía",
      "subsidiary not found": "El Subsidiary ID no existe o no pertenece a esta compañía",
      "warehouse not found": "El Warehouse ID no existe",
      "product not found": "Uno o más productos no existen en el sistema",
      "sku already exists": "El SKU del producto ya está registrado",
      "invalid price": "El precio del producto es inválido",
      "invalid stock": "La cantidad de stock es inválida",
      "product creation failed": "Error al crear el producto",
      "product update failed": "Error al actualizar el producto",
      "database error": "Error en la base de datos",
      "server error": "Error interno del servidor",
      "timeout": "La operación tardó demasiado tiempo",
      "network error": "Error de conexión de red",
    };

    const errorLower = String(errorMessage || "").toLowerCase();
    let foundError = null;

    for (const [key, description] of Object.entries(errors)) {
      if (errorLower.includes(key)) {
        foundError = { type: key, description, details: errorMessage };
        break;
      }
    }

    if (!foundError) {
      foundError = {
        type: "unknown",
        description: "Error desconocido",
        details: errorMessage,
      };
    }

    if (statusCode) {
      foundError.statusCode = statusCode;
      foundError.statusText = getStatusText(statusCode);
    }

    return foundError;
  };

  const getStatusText = (statusCode) => {
    const statusMap = {
      400: "Bad Request - La solicitud tiene errores",
      401: "Unauthorized - No autorizado",
      403: "Forbidden - Acceso prohibido",
      404: "Not Found - Recurso no encontrado",
      413: "Payload Too Large - Archivo muy grande",
      422: "Unprocessable Entity - Error de validación",
      500: "Internal Server Error - Error del servidor",
      502: "Bad Gateway - Error de gateway",
      503: "Service Unavailable - Servicio no disponible",
      504: "Gateway Timeout - Tiempo de espera agotado",
    };
    return statusMap[statusCode] || `Código de error: ${statusCode}`;
  };

  const onSend = async () => {
    setError("");
    setErrorDetails(null);
    setResult(null);

    if (!fileProductos) {
      toast.error("Selecciona el archivo Excel");
      setError("❌ Selecciona el archivo Excel (.xlsx o .xls).");
      return;
    }

    if (!companyId || !priceListId || !subsidiaryId) {
      const missing = [];
      if (!companyId) missing.push("Company ID");
      if (!priceListId) missing.push("PriceList ID");
      if (!subsidiaryId) missing.push("Subsidiary ID");

      toast.warning(`Completa: ${missing.join(", ")}`);
      setError(`⚠️ Completa los campos obligatorios: ${missing.join(", ")}`);
      return;
    }

    const fileName = fileProductos.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      toast.error("Formato inválido: debe ser .xlsx o .xls");
      setError("❌ El archivo debe ser un Excel (.xlsx o .xls)");
      return;
    }

    try {
      setLoading(true);

      let fileToSend = fileProductos;
      
      if (fileProductos.name.includes('_QA') || fileProductos.name.includes('CONVERSION')) {
        try {
          const data = await fileProductos.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (workbook.SheetNames.includes('productos')) {
            const productosSheet = workbook.Sheets['productos'];
            const newWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWorkbook, productosSheet, 'productos');
            
            const wbout = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
            fileToSend = new File([wbout], fileProductos.name.replace('_QA', '').replace('_CONVERSION', ''), { 
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            toast.info("Usando solo la hoja 'productos' del archivo QA", {
              id: 'extract-sheet-toast'
            });
          }
        } catch (e) {
          console.error("Error extrayendo hoja productos:", e);
        }
      }

      const form = new FormData();
      form.append("file_excel", fileToSend);
      form.append("idCountry", idCountry);
      form.append("taxCodeCountry", taxCodeCountry);
      form.append("flagUseSimpleBrand", String(flagUseSimpleBrand));
      if (idWarehouse) form.append("idWarehouse", idWarehouse);

      const endpoint = buildEndpoint();
      const res = await fetch(endpoint, { method: "POST", body: form });

      const text = await res.text();

      if (!res.ok) {
        const parsedError = parseError(text, res.status);
        setErrorDetails(parsedError);

        let userMessage = `❌ Error ${res.status}: ${parsedError.description}`;

        if (res.status === 404) {
          userMessage +=
            "\n\nPosibles causas:\n• Los IDs ingresados no existen\n• El nodo seleccionado es incorrecto\n• La ruta API ha cambiado";
        } else if (res.status === 422) {
          userMessage +=
            "\n\nRevisa:\n• El formato del archivo Excel\n• Las columnas requeridas\n• Los tipos de datos en cada columna";
        } else if (res.status === 500) {
          userMessage +=
            "\n\nEl servidor tuvo un problema interno. Intenta de nuevo o contacta al administrador.";
        }

        setError(userMessage);
        toast.error(`Error ${res.status}: ${parsedError.description}`, {
          id: 'error-toast'
        });
        throw new Error(text);
      }

      try {
        const jsonResult = JSON.parse(text);
        setResult(jsonResult);

        const okCount = Number(
          jsonResult?.success ??
            jsonResult?.data?.n_products ??
            jsonResult?.n_products ??
            0
        );

        const errCount = Array.isArray(jsonResult?.errors)
          ? jsonResult.errors.length
          : 0;

        if (errCount > 0) {
          setErrorDetails({
            type: "product_errors",
            description: "Errores en productos específicos",
            details: jsonResult.errors,
            successCount: okCount,
            errorCount: errCount,
          });

          setError(
            `⚠️ Se procesaron ${okCount} productos, pero ${errCount} tuvieron errores. Revisa los detalles abajo.`
          );

          toast.warning(`Procesado: ${okCount} OK, ${errCount} con error`, {
            id: 'warning-toast'
          });
        } else {
          setError("");
          toast.success(`✅ Productos subidos: ${okCount}`, {
            id: 'success-toast'
          });
        }
      } catch {
        setResult(text);
        setError(
          `✅ Respuesta del servidor: ${text.substring(0, 100)}${
            text.length > 100 ? "..." : ""
          }`
        );
        toast.success("✅ Envío completado", {
          id: 'completion-toast'
        });
      }
    } catch (e) {
      const msg = String(e?.message || "");

      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        const m =
          "🌐 Error de conexión:\n\n• Verifica tu conexión a internet\n• El servidor del nodo podría estar caído\n• Revisa si hay problemas con CORS\n\nEndpoint: " +
          buildEndpoint();

        setError(m);
        toast.error("🌐 Error de conexión con el servidor", {
          id: 'network-error-toast'
        });
        return;
      }

      if (!errorDetails) {
        const parsedError = parseError(msg || "Error desconocido");
        setErrorDetails(parsedError);
      }

      toast.error("❌ No se pudo enviar el Excel", {
        id: 'send-error-toast'
      });

      if (!error) {
        setError("❌ Error enviando el archivo: " + (msg || "Error desconocido"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-12">
        {/* Left: form */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-[#D9D9D9] bg-white shadow-sm">
            <div className="border-b border-[#D9D9D9] p-6">
              <h1 className="text-lg font-semibold text-[#02979B]">
                Cargar archivo y enviar
              </h1>
              <p className="mt-1 text-sm text-[#02979B]/60">
                Completa los IDs, selecciona el nodo y adjunta el Excel.
              </p>
            </div>

            <div className="space-y-6 p-6">
              {/* Nodo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#02979B]">Nodo</label>
                <select
                  value={nodeKey}
                  onChange={(e) => setNodeKey(e.target.value)}
                  className="w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
                >
                  {NODES.map((n) => (
                    <option key={n.key} value={n.key}>
                      {n.label} — {n.base.replace("https://", "")}
                    </option>
                  ))}
                </select>
              </div>

              {/* IDs */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-[#02979B]">IDs</label>
                  <span className="text-xs text-[#02979B]/60">Obligatorios</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field
                    label="Company ID"
                    placeholder="Ej: 5454"
                    value={companyId}
                    onChange={setCompanyId}
                  />
                  <Field
                    label="PriceList ID"
                    placeholder="Ej: 7662"
                    value={priceListId}
                    onChange={setPriceListId}
                  />
                  <Field
                    label="Subsidiary ID"
                    placeholder="Ej: 7821"
                    value={subsidiaryId}
                    onChange={setSubsidiaryId}
                  />
                </div>
              </div>

              {/* Parámetros */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-[#02979B]">Parámetros</label>
                  <span className="text-xs text-[#02979B]/60">Form-data</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field
                    label="idCountry"
                    placeholder="1"
                    value={idCountry}
                    onChange={setIdCountry}
                  />
                  <TaxCodeSelect value={taxCodeCountry} onChange={setTaxCodeCountry} />
                  <Field
                    label="idWarehouse (opcional)"
                    placeholder="Ej: 5712"
                    value={idWarehouse}
                    onChange={setIdWarehouse}
                    helper="Solo si el cliente tiene más de una tienda/almacén."
                  />
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="text-[#02979B]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 7h10v10H7z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#02979B]">flagUseSimpleBrand</div>
                      <div className="text-xs text-[#02979B]/60">
                        Envía <span className="font-mono">true/false</span> al backend.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFlagUseSimpleBrand((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      flagUseSimpleBrand ? "bg-[#02979B]" : "bg-[#D9D9D9]"
                    }`}
                    aria-label="Toggle flagUseSimpleBrand"
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        flagUseSimpleBrand ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Archivo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#02979B]">Archivo Excel</label>

                <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D9D9] bg-white p-8 text-center transition hover:border-[#02979B] hover:bg-[#02979B]/5">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => setFileProductos(e.target.files?.[0] ?? null)}
                  />

                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D9D9D9] text-[#02979B] transition group-hover:bg-[#02979B] group-hover:text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 16V4m0 0 4 4M12 4 8 8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <div className="mt-3 text-sm font-semibold text-[#02979B]">
                    {fileProductos ? fileProductos.name : "Seleccionar archivo .xlsx / .xls"}
                  </div>
                  <div className="mt-1 text-xs text-[#02979B]/60">
                    Se enviará como <span className="font-mono">file_excel</span> (multipart/form-data)
                  </div>
                </label>
              </div>

              {/* Error principal */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-red-700">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-red-800">Mensaje</div>
                      <div className="mt-1 whitespace-pre-wrap text-sm text-red-700">{error}</div>

                      {errorDetails && (
                        <button
                          onClick={() => {
                            const textToCopy = `Error: ${error}\n\nDetalles: ${JSON.stringify(
                              errorDetails,
                              null,
                              2
                            )}\n\nEndpoint: ${buildEndpoint()}`;
                            navigator.clipboard.writeText(textToCopy);
                            toast.success("Copiado al portapapeles", {
                              id: 'copy-toast'
                            });
                          }}
                          className="mt-2 inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1M8 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M8 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Copiar detalles del error
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <button
                  type="button"
                  onClick={onSend}
                  disabled={!canSend}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition md:w-auto ${
                    canSend ? "bg-[#02979B] hover:bg-[#02979B]/80" : "bg-[#D9D9D9] cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <>
                      <Spinner />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M22 2 15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Enviar Excel
                    </>
                  )}
                </button>

                <div className="flex-1 rounded-xl border border-[#D9D9D9] bg-[#02979B]/5 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#02979B]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Endpoint
                  </div>
                  <div className="mt-1 break-all font-mono text-xs text-[#02979B]">
                    {endpointPreview || "Completa los IDs para ver el endpoint"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: response */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-[#D9D9D9] bg-white shadow-sm">
            <div className="border-b border-[#D9D9D9] p-6">
              <h2 className="text-lg font-semibold text-[#02979B]">Respuesta del servidor</h2>
              <p className="mt-1 text-sm text-[#02979B]/60">
                Verifica si el backend retornó JSON o texto.
              </p>
            </div>

            <div className="p-6">
              {result ? (
                <div>
                  <pre className="max-h-[560px] overflow-auto rounded-2xl border border-[#D9D9D9] bg-[#02979B]/5 p-4 text-xs text-[#02979B]">
                    {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
                  </pre>

                  <button
                    onClick={() => {
                      const textToCopy =
                        typeof result === "string" ? result : JSON.stringify(result, null, 2);
                      navigator.clipboard.writeText(textToCopy);
                      toast.success("Respuesta copiada", {
                        id: 'copy-response-toast'
                      });
                    }}
                    className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#02979B]/10 px-3 py-1 text-xs font-medium text-[#02979B] hover:bg-[#02979B]/20"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1M8 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M8 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copiar respuesta completa
                  </button>
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, helper }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#02979B]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
      />
      {helper ? <div className="text-xs text-[#02979B]/60">{helper}</div> : null}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function Dot() {
  return <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#02979B]" />;
}

function EmptyState() {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D9D9] bg-[#02979B]/5 p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#02979B] shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" strokeLinejoin="round" />
          <path d="M15 3v5h5" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="mt-3 text-sm font-semibold text-[#02979B]">Sin resultados todavía</div>
      <div className="mt-1 text-sm text-[#02979B]/60">
        Cuando envíes el Excel, aquí se mostrará la respuesta del servidor.
      </div>
    </div>
  );
}

function TaxCodeSelect({ value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#02979B]">taxCodeCountry</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B]"
      >
        <option value="01">01 — IGV</option>
        <option value="02">02 — Exonerado</option>
      </select>
      <div className="text-xs text-[#02979B]/60">
        Selecciona el código tributario a enviar al backend.
      </div>
    </div>
  );
}