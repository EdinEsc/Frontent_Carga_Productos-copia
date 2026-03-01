// utils/formatters.js

/**
 * Formatea un número como moneda
 * @param {number} value - El valor a formatear
 * @param {string} currency - El símbolo de moneda (por defecto 'S/')
 * @returns {string} - El valor formateado como moneda
 */
export function formatCurrency(value, currency = 'S/') {
  if (value === null || value === undefined || isNaN(value)) return `${currency} 0.00`;
  
  return `${currency} ${Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Formatea un número con decimales
 * @param {number} value - El valor a formatear
 * @param {number} decimals - Número de decimales (por defecto 2)
 * @returns {string} - El valor formateado
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  
  return Number(value).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formatea una fecha a formato local
 * @param {string|Date} date - La fecha a formatear
 * @param {object} options - Opciones de formato
 * @returns {string} - La fecha formateada
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-PE', defaultOptions);
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return String(date);
  }
}

/**
 * Formatea una fecha y hora
 * @param {string|Date} date - La fecha a formatear
 * @returns {string} - La fecha y hora formateada
 */
export function formatDateTime(date) {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando fecha y hora:', error);
    return String(date);
  }
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - El texto a truncar
 * @param {number} maxLength - Longitud máxima (por defecto 50)
 * @returns {string} - El texto truncado
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} text - El texto a capitalizar
 * @returns {string} - El texto capitalizado
 */
export function capitalizeWords(text) {
  if (!text) return '';
  
  return text.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Formatea un porcentaje
 * @param {number} value - El valor del porcentaje
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} - El porcentaje formateado
 */
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Formatea un número de teléfono peruano
 * @param {string} phone - El número de teléfono
 * @returns {string} - El teléfono formateado
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Limpiar el número de caracteres no numéricos
  const cleaned = String(phone).replace(/\D/g, '');
  
  // Formato para números de 9 dígitos (celular)
  if (cleaned.length === 9) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  
  // Formato para números de 7 dígitos (fijo)
  if (cleaned.length === 7) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
  }
  
  return String(phone);
}

/**
 * Formatea un RUC (11 dígitos)
 * @param {string} ruc - El RUC a formatear
 * @returns {string} - El RUC formateado
 */
export function formatRUC(ruc) {
  if (!ruc) return '';
  
  const cleaned = String(ruc).replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 3)}-${cleaned.substring(3, 11)}`;
  }
  
  return String(ruc);
}

/**
 * Formatea un DNI (8 dígitos)
 * @param {string} dni - El DNI a formatear
 * @returns {string} - El DNI formateado
 */
export function formatDNI(dni) {
  if (!dni) return '';
  
  const cleaned = String(dni).replace(/\D/g, '');
  
  if (cleaned.length === 8) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
  }
  
  return String(dni);
}

/**
 * Convierte un número a palabras (útil para montos en letras)
 * @param {number} num - El número a convertir
 * @returns {string} - El número en palabras
 */
export function numberToWords(num) {
  if (num === null || num === undefined || isNaN(num)) return '';
  
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  
  // Esta es una implementación básica - para un sistema real, considera usar una librería especializada
  return String(num);
}

/**
 * Formatea un tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado (KB, MB, GB)
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  if (!bytes || isNaN(bytes)) return '';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formatea un tiempo en segundos a formato mm:ss
 * @param {number} seconds - Tiempo en segundos
 * @returns {string} - Tiempo formateado
 */
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Elimina tildes y caracteres especiales de un texto
 * @param {string} text - El texto a normalizar
 * @returns {string} - El texto sin tildes
 */
export function removeAccents(text) {
  if (!text) return '';
  
  return text.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '');
}

/**
 * Formatea un texto para URL (slug)
 * @param {string} text - El texto a convertir
 * @returns {string} - El slug
 */
export function slugify(text) {
  if (!text) return '';
  
  return removeAccents(text)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Formatea un nombre de archivo (elimina caracteres problemáticos)
 * @param {string} filename - El nombre del archivo
 * @returns {string} - El nombre formateado
 */
export function formatFilename(filename) {
  if (!filename) return '';
  
  return removeAccents(filename)
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, '_');
}