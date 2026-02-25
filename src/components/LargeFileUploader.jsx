// =========================
// components/LargeFileUploader.jsx
// =========================
import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import {
  FaCloudUploadAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaDownload,
  FaSpinner
} from 'react-icons/fa';

const API_URL = 'http://localhost:8000'; // Ajusta según tu configuración
const BATCH_SIZE = 500;

export default function LargeFileUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [processingDetails, setProcessingDetails] = useState({
    currentBatch: 0,
    totalBatches: 0,
    processedRows: 0,
    totalRows: 0
  });

  // Configuración de dropzone
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxSize: 500 * 1024 * 1024, // 500MB máximo
    multiple: false
  });

  // Polling para obtener el progreso
  useEffect(() => {
    let intervalId;
    let timeoutId;

    if (jobId && uploading) {
      const checkStatus = async () => {
        try {
          const response = await axios.get(`${API_URL}/excel/status/${jobId}`);
          const data = response.data;
          
          setProgress(data.progress);
          setStatus(data.status);
          setProcessingDetails({
            currentBatch: data.current_batch || 0,
            totalBatches: data.total_batches || 0,
            processedRows: data.processed_rows || 0,
            totalRows: data.total_rows || 0
          });
          
          // Si ya terminó
          if (data.status === 'completed') {
            setUploading(false);
            setStats(data.stats || {});
            
            // Iniciar descarga automática después de 1 segundo
            timeoutId = setTimeout(() => {
              downloadResult(jobId);
            }, 1000);
            
            clearInterval(intervalId);
          }
          
          // Si falló
          if (data.status === 'failed') {
            setUploading(false);
            setError(data.error || 'Error en el procesamiento');
            clearInterval(intervalId);
          }
          
        } catch (err) {
          console.error('Error checking status:', err);
          if (err.response?.status === 404) {
            setError('El proceso no existe o ha expirado');
            setUploading(false);
            clearInterval(intervalId);
          }
        }
      };

      // Iniciar polling
      intervalId = setInterval(checkStatus, 1000);
      
      // Primera verificación inmediata
      checkStatus();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [jobId, uploading]);

  const downloadResult = async (jobId) => {
    try {
      const response = await axios.get(
        `${API_URL}/excel/download/${jobId}`,
        { 
          responseType: 'blob',
          timeout: 30000 // 30 segundos timeout para descarga
        }
      );
      
      // Crear link de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Nombre del archivo con fecha
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `productos_normalizados_${date}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Limpiar URL
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error downloading:', err);
      setError('Error al descargar el resultado');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setStats(null);
    setProcessingDetails({
      currentBatch: 0,
      totalBatches: 0,
      processedRows: 0,
      totalRows: 0
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('apply_igv_cost', 'true');
    formData.append('apply_igv_sale', 'true');
    formData.append('tienda_nombre', 'MiTienda');
    formData.append('round_numeric', '2');

    try {
      const response = await axios.post(
        `${API_URL}/excel/normalize-large`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 segundos timeout para upload
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // Solo para upload, no para procesamiento
            console.log(`Upload: ${percentCompleted}%`);
          }
        }
      );

      setJobId(response.data.job_id);
      
    } catch (err) {
      setUploading(false);
      if (err.response?.status === 413) {
        setError('El archivo es demasiado grande. Máximo 500MB');
      } else if (err.code === 'ECONNABORTED') {
        setError('Timeout en la carga. Intenta con un archivo más pequeño');
      } else {
        setError(err.response?.data?.detail || 'Error al iniciar la carga');
      }
      console.error(err);
    }
  };

  const handleCancel = () => {
    // Aquí podrías implementar cancelación del proceso
    setUploading(false);
    setJobId(null);
    setProgress(0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-PE').format(num || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Carga Masiva de Productos
          </h1>
          <p className="text-gray-600">
            Procesa hasta 100,000 productos en lotes de {BATCH_SIZE} registros
          </p>
        </div>

        {/* Área de dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} disabled={uploading} />
          
          <FaCloudUploadAlt 
            className={`mx-auto h-16 w-16 ${
              isDragActive ? 'text-blue-500' : 'text-gray-400'
            }`} 
          />
          
          {isDragActive ? (
            <p className="mt-4 text-lg text-blue-600">Suelta el archivo aquí...</p>
          ) : (
            <div>
              <p className="mt-4 text-lg text-gray-700">
                Arrastra tu archivo Excel aquí o haz clic para seleccionar
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Formatos: .xlsx, .xls (Máx: 500MB)
              </p>
            </div>
          )}
        </div>

        {/* Información del archivo seleccionado */}
        {file && !uploading && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <FaCheckCircle className="text-green-500 mr-2" />
              <span className="text-sm text-gray-700">
                <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Quitar
            </button>
          </div>
        )}

        {/* Botones de acción */}
        {!uploading ? (
          <button
            onClick={handleUpload}
            disabled={!file}
            className={`mt-6 w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors
              ${file 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
              }
            `}
          >
            {file ? 'Cargar y Procesar' : 'Selecciona un archivo'}
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="mt-6 w-full py-3 px-4 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Cancelar Procesamiento
          </button>
        )}

        {/* Barra de progreso durante procesamiento */}
        {uploading && (
          <div className="mt-8 space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Procesando archivo...</h3>
              
              {/* Barra de progreso principal */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">
                    Progreso general
                  </span>
                  <span className="text-sm font-medium text-blue-700">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 relative"
                    style={{ width: `${progress}%` }}
                  >
                    {progress > 0 && (
                      <span className="absolute -top-6 right-0 text-xs font-medium text-blue-600">
                        {progress}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detalles del procesamiento */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-gray-600">Lote actual:</span>
                  <span className="ml-2 font-semibold">
                    {processingDetails.currentBatch} / {processingDetails.totalBatches}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-gray-600">Filas procesadas:</span>
                  <span className="ml-2 font-semibold">
                    {formatNumber(processingDetails.processedRows)} / {formatNumber(processingDetails.totalRows)}
                  </span>
                </div>
              </div>

              {/* Estado actual */}
              <div className="mt-4 flex items-center justify-center text-blue-600">
                <FaSpinner className="animate-spin mr-2" />
                <span>{status === 'processing' ? 'Procesando...' : status}</span>
              </div>
            </div>
          </div>
        )}

        {/* Resultados finales */}
        {stats && (
          <div className="mt-8 bg-green-50 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FaCheckCircle className="text-green-500 text-2xl mr-2" />
              <h3 className="text-lg font-semibold text-green-800">
                ¡Procesamiento completado!
              </h3>
            </div>

            {/* Grid de estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">Total filas</div>
                <div className="text-xl font-bold text-gray-800">
                  {formatNumber(stats.rows_before)}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">Productos OK</div>
                <div className="text-xl font-bold text-green-600">
                  {formatNumber(stats.rows_ok)}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">Corregidos</div>
                <div className="text-xl font-bold text-yellow-600">
                  {formatNumber(stats.rows_corrected)}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">Errores</div>
                <div className="text-xl font-bold text-red-600">
                  {formatNumber(stats.errors_count)}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">Códigos generados</div>
                <div className="text-xl font-bold text-blue-600">
                  {formatNumber(stats.codes_fixed)}
                </div>
              </div>
            </div>

            {/* Botón de descarga manual */}
            <button
              onClick={() => downloadResult(jobId)}
              className="mt-6 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center"
            >
              <FaDownload className="mr-2" />
              Descargar Resultado
            </button>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <FaExclamationTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-700 font-medium">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-8 text-xs text-gray-500 text-center">
          <p>Procesamiento optimizado para archivos grandes</p>
          <p className="mt-1">Los archivos se procesan en segundo plano. Puedes cerrar esta ventana y volver más tarde.</p>
        </div>
      </div>
    </div>
  );
}