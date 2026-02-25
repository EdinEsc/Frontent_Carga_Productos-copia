// src/components/ExcelLargeUploader.jsx
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

const API_URL = "http://127.0.0.1:8000";
const BATCH_SIZE = 500;

export default function ExcelLargeUploader({ 
  warehouses = [], 
  onNavigateToCarga,
  onBack 
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  // IGV toggles (mismos que en tu componente)
  const [applyIgvCost, setApplyIgvCost] = useState(true);
  const [applyIgvSale, setApplyIgvSale] = useState(true);

  // Almacén seleccionado
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedWarehouseName, setSelectedWarehouseName] = useState("");

  // Auto seleccionar si solo hay un almacén
  useEffect(() => {
    if (warehouses.length === 1) {
      setSelectedWarehouseId(String(warehouses[0].id));
      setSelectedWarehouseName((warehouses[0].name || "").trim());
    }
  }, [warehouses]);

  // Dropzone
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.size > 500 * 1024 * 1024) {
        toast.error("El archivo no puede ser mayor a 500MB");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"]
    },
    maxSize: 500 * 1024 * 1024,
    multiple: false
  });

  // Polling para progreso
  useEffect(() => {
    let intervalId;

    const checkStatus = async () => {
      if (!jobId || !uploading) return;

      try {
        const response = await fetch(`${API_URL}/excel/status/${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Error al consultar estado");
        }

        setProgress(data.progress);
        setStatus(data.status);

        // Si completó
        if (data.status === "completed") {
          setUploading(false);
          setStats(data.stats || {});
          toast.success("✅ Procesamiento completado");
          
          // Descargar automáticamente
          downloadResult(jobId);
          clearInterval(intervalId);
        }

        // Si falló
        if (data.status === "failed") {
          setUploading(false);
          setError(data.error || "Error en el procesamiento");
          toast.error("Error en el procesamiento");
          clearInterval(intervalId);
        }

      } catch (err) {
        console.error("Error checking status:", err);
        if (err.message?.includes("404")) {
          setError("El proceso no existe o ha expirado");
          setUploading(false);
          clearInterval(intervalId);
        }
      }
    };

    if (jobId && uploading) {
      intervalId = setInterval(checkStatus, 1000);
      checkStatus();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId, uploading]);

  const downloadResult = async (jobId) => {
    try {
      const response = await fetch(`${API_URL}/excel/download/${jobId}`);
      
      if (!response.ok) {
        throw new Error("Error al descargar");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const date = new Date().toISOString().split("T")[0];
      a.download = `productos_masivos_${date}.xlsx`;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Navegar a carga después de 1 segundo
      setTimeout(() => {
        if (onNavigateToCarga) onNavigateToCarga();
      }, 1000);

    } catch (err) {
      console.error("Error downloading:", err);
      toast.error("Error al descargar el archivo");
    }
  };

  const handleWarehouseChange = (e) => {
    const warehouseId = e.target.value;
    setSelectedWarehouseId(warehouseId);

    const warehouse = warehouses.find((w) => String(w.id) === String(warehouseId));
    setSelectedWarehouseName((warehouse?.name || "").trim());
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecciona un archivo");
      return;
    }

    if (!selectedWarehouseId) {
      toast.error("Debe seleccionar un almacén");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");
    setStats(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("apply_igv_cost", String(applyIgvCost));
    formData.append("apply_igv_sale", String(applyIgvSale));
    formData.append("tienda_nombre", selectedWarehouseName || "Tienda1");
    formData.append("round_numeric", "2");

    try {
      const response = await fetch(`${API_URL}/excel/normalize-large`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al iniciar la carga");
      }

      const data = await response.json();
      setJobId(data.job_id);
      toast.info("Procesamiento iniciado");

    } catch (err) {
      setUploading(false);
      toast.error(err.message);
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setUploading(false);
    setJobId(null);
    setProgress(0);
    toast.warning("Procesamiento cancelado");
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("es-PE").format(num || 0);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header con estilo igual a tu diseño */}
      <div className="rounded-2xl border-2 border-[#02979B] bg-[#02979B]/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#02979B]">Carga Masiva de Productos</h2>
            <p className="mt-1 text-sm text-[#02979B]/70">
              Procesa hasta 100,000 productos en lotes de {BATCH_SIZE} registros
            </p>
          </div>
          <button
            onClick={onBack}
            className="rounded-xl border border-[#02979B] px-4 py-2 text-sm font-semibold text-[#02979B] hover:bg-[#02979B]/5"
          >
            ← Volver
          </button>
        </div>
      </div>

      {/* IGV toggles (igual que tu diseño) */}
      <div className="grid gap-3 md:grid-cols-2">
        <ToggleCard
          title="Aplicar IGV (1.18) a Precio Costo"
          value={applyIgvCost}
          onToggle={() => setApplyIgvCost((v) => !v)}
          disabled={uploading}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5M17 12h-5M17 19h-5" strokeLinecap="round" />
            </svg>
          }
        />
        <ToggleCard
          title="Aplicar IGV (1.18) a Precio Venta"
          value={applyIgvSale}
          onToggle={() => setApplyIgvSale((v) => !v)}
          disabled={uploading}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 12H4M12 4v16" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {/* Selector de almacén (igual que tu diseño) */}
      <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
        <label className="text-sm font-medium text-[#02979B]">
          Almacén <span className="text-red-500">*</span>
        </label>

        {warehouses.length === 0 ? (
          <div className="mt-1 rounded-xl border border-[#D9D9D9] bg-gray-50 px-3 py-2 text-sm text-gray-500">
            Cargando almacenes...
          </div>
        ) : warehouses.length === 1 ? (
          <input
            type="text"
            value={warehouses[0].name}
            readOnly
            className="mt-1 w-full rounded-xl border border-[#D9D9D9] bg-gray-100 px-3 py-2 text-sm text-[#02979B]"
          />
        ) : (
          <select
            value={selectedWarehouseId}
            onChange={handleWarehouseChange}
            disabled={uploading}
            required
            className="mt-1 w-full rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#02979B] outline-none focus:border-[#02979B] focus:ring-1 focus:ring-[#02979B] disabled:bg-gray-100"
          >
            <option value="">Seleccione un almacén</option>
            {warehouses.map((w) => (
              <option key={w.id} value={String(w.id)}>
                {w.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Dropzone (adaptado a tu estilo) */}
      <div
        {...getRootProps()}
        className={`
          group flex cursor-pointer flex-col items-center justify-center rounded-2xl 
          border-2 border-dashed p-8 text-center transition
          ${isDragActive 
            ? "border-[#02979B] bg-[#02979B]/5" 
            : "border-[#D9D9D9] hover:border-[#02979B] hover:bg-[#02979B]/5"
          }
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        
        <div className={`
          grid h-12 w-12 place-items-center rounded-2xl transition
          ${isDragActive 
            ? "bg-[#02979B] text-white" 
            : "bg-[#D9D9D9] text-[#02979B] group-hover:bg-[#02979B] group-hover:text-white"
          }
        `}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 16V4m0 0 4 4M12 4 8 8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="mt-3 text-sm font-semibold text-[#02979B]">
          {file ? file.name : isDragActive ? "Suelta el archivo aquí" : "Arrastra tu Excel o haz clic para seleccionar"}
        </div>
        <div className="mt-1 text-xs text-[#02979B]/60">
          {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Formatos: .xlsx, .xls (Máx: 500MB)"}
        </div>
      </div>

      {/* Botones */}
      {!uploading ? (
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!file || !selectedWarehouseId}
            className={`
              flex-1 rounded-xl px-6 py-3 text-sm font-semibold text-white transition
              ${!file || !selectedWarehouseId
                ? "bg-[#D9D9D9] cursor-not-allowed"
                : "bg-[#02979B] hover:bg-[#02979B]/80"
              }
            `}
          >
            {file ? "Iniciar Carga Masiva" : "Selecciona un archivo"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleCancel}
          className="w-full rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Cancelar Procesamiento
        </button>
      )}

      {/* Barra de progreso */}
      {uploading && (
        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Spinner />
            <span className="text-sm font-medium text-[#02979B]">
              Procesando archivo... {progress}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#02979B] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-xs text-[#02979B]/60">
            Estado: {status === "processing" ? "Procesando..." : status}
          </div>
        </div>
      )}

      {/* Resultados */}
      {stats && (
        <div className="rounded-2xl border-2 border-green-500 bg-green-50 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="text-lg font-semibold text-green-800">
              ¡Procesamiento completado!
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Total filas" value={formatNumber(stats.rows_before)} />
            <StatCard label="Productos OK" value={formatNumber(stats.rows_ok)} color="green" />
            <StatCard label="Corregidos" value={formatNumber(stats.rows_corrected)} color="yellow" />
            <StatCard label="Errores" value={formatNumber(stats.errors_count)} color="red" />
            <StatCard label="Códigos generados" value={formatNumber(stats.codes_fixed)} color="blue" />
          </div>

          <p className="text-xs text-green-700">
            La descarga comenzará automáticamente...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

// Componentes auxiliares (igual que en tu diseño)
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-[#02979B]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function ToggleCard({ title, value, onToggle, disabled = false, icon }) {
  return (
    <div className={`rounded-2xl border border-[#D9D9D9] ${disabled ? "bg-[#D9D9D9]/20" : "bg-white"} p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="text-[#02979B]">{icon}</div>
          <div className={`text-sm font-semibold ${disabled ? "text-[#02979B]/40" : "text-[#02979B]"}`}>{title}</div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            disabled ? "bg-[#D9D9D9] cursor-not-allowed" : value ? "bg-[#02979B]" : "bg-[#D9D9D9]"
          }`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${value ? "translate-x-5" : "translate-x-1"}`} />
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "gray" }) {
  const colors = {
    green: "text-green-700 bg-green-100",
    yellow: "text-yellow-700 bg-yellow-100",
    red: "text-red-700 bg-red-100",
    blue: "text-blue-700 bg-blue-100",
    gray: "text-gray-700 bg-gray-100"
  };

  return (
    <div className={`rounded-xl p-3 ${colors[color]}`}>
      <div className="text-xs opacity-75">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}