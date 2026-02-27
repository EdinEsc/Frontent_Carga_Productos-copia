// src/services/uploadQueue.js
import { openDB } from 'idb'; // npm install idb

class UploadQueueService {
  constructor() {
    this.dbName = 'UploadQueueDB';
    this.version = 2; // Incrementamos la versión para los cambios
    this.db = null;
    this.initDB();
  }

  async initDB() {
    this.db = await openDB(this.dbName, this.version, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`🔄 Actualizando DB de versión ${oldVersion} a ${newVersion}`);
        
        // Almacén para los uploads principales
        if (!db.objectStoreNames.contains('uploads')) {
          const store = db.createObjectStore('uploads', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('status', 'status');
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('uploadId', 'uploadId');
          store.createIndex('fileName', 'fileName');
        } else if (oldVersion < 2) {
          // Si ya existe pero necesitamos actualizar
          const store = transaction.objectStore('uploads');
          if (!store.indexNames.contains('fileName')) {
            store.createIndex('fileName', 'fileName');
          }
        }
        
        // Almacén para los bloques
        if (!db.objectStoreNames.contains('blocks')) {
          const blockStore = db.createObjectStore('blocks', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          blockStore.createIndex('uploadId', 'uploadId');
          blockStore.createIndex('blockNumber', 'blockNumber');
          blockStore.createIndex('status', 'status');
          blockStore.createIndex('uploadId_status', ['uploadId', 'status']);
        } else if (oldVersion < 2) {
          const blockStore = transaction.objectStore('blocks');
          if (!blockStore.indexNames.contains('uploadId_status')) {
            blockStore.createIndex('uploadId_status', ['uploadId', 'status']);
          }
        }

        // Almacén para el archivo original
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          fileStore.createIndex('uploadId', 'uploadId');
        }
      }
    });
    console.log('✅ IndexedDB inicializada correctamente');
  }

  // ============================================================
  // MÉTODOS PARA UPLOADS
  // ============================================================

  // Guardar estado completo del upload
  async saveUploadState(uploadData) {
    try {
      const tx = this.db.transaction('uploads', 'readwrite');
      const store = tx.objectStore('uploads');
      
      const uploadState = {
        ...uploadData,
        status: uploadData.status || 'pending',
        timestamp: Date.now(),
        blocksCompleted: uploadData.blocksCompleted || 0,
        totalBlocks: uploadData.totalBlocks,
        lastUpdate: Date.now()
      };
      
      // Verificar si ya existe un upload con el mismo uploadId
      const index = store.index('uploadId');
      const existing = await index.getAll(IDBKeyRange.only(uploadData.uploadId));
      
      if (existing.length > 0) {
        // Actualizar el existente
        const existingUpload = existing[0];
        const updatedUpload = { ...existingUpload, ...uploadState };
        await store.put(updatedUpload);
        await tx.done;
        return existingUpload.id;
      } else {
        // Crear nuevo
        const id = await store.add(uploadState);
        await tx.done;
        return id;
      }
    } catch (error) {
      console.error('Error guardando upload state:', error);
      throw error;
    }
  }

  // Obtener todos los uploads pendientes (no completados)
  async getPendingUploads() {
    try {
      const tx = this.db.transaction('uploads', 'readonly');
      const store = tx.objectStore('uploads');
      const index = store.index('status');
      
      const pending = await index.getAll('pending');
      const processing = await index.getAll('processing');
      const paused = await index.getAll('paused');
      
      await tx.done;
      
      // Combinar y ordenar por timestamp (más reciente primero)
      const allPending = [...pending, ...processing, ...paused];
      return allPending.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error obteniendo pending uploads:', error);
      return [];
    }
  }

  // Obtener un upload específico por uploadId
  async getUploadByUploadId(uploadId) {
    try {
      const tx = this.db.transaction('uploads', 'readonly');
      const store = tx.objectStore('uploads');
      const index = store.index('uploadId');
      
      const uploads = await index.getAll(IDBKeyRange.only(uploadId));
      await tx.done;
      
      return uploads.length > 0 ? uploads[0] : null;
    } catch (error) {
      console.error('Error obteniendo upload:', error);
      return null;
    }
  }

  // Actualizar progreso del upload
  async updateUploadProgress(uploadId, blocksCompleted, status = 'processing') {
    try {
      const tx = this.db.transaction('uploads', 'readwrite');
      const store = tx.objectStore('uploads');
      const index = store.index('uploadId');
      
      const uploads = await index.getAll(IDBKeyRange.only(uploadId));
      
      if (uploads.length > 0) {
        const upload = uploads[0];
        upload.blocksCompleted = blocksCompleted;
        upload.status = status;
        upload.lastUpdate = Date.now();
        await store.put(upload);
      }
      
      await tx.done;
      return true;
    } catch (error) {
      console.error('Error actualizando progreso:', error);
      return false;
    }
  }

  // Marcar upload como completado
  async completeUpload(uploadId) {
    try {
      const tx = this.db.transaction('uploads', 'readwrite');
      const store = tx.objectStore('uploads');
      const index = store.index('uploadId');
      
      const uploads = await index.getAll(IDBKeyRange.only(uploadId));
      
      if (uploads.length > 0) {
        const upload = uploads[0];
        upload.status = 'completed';
        upload.completedAt = Date.now();
        upload.lastUpdate = Date.now();
        upload.blocksCompleted = upload.totalBlocks;
        await store.put(upload);
      }
      
      await tx.done;
      return true;
    } catch (error) {
      console.error('Error completando upload:', error);
      return false;
    }
  }

  // Eliminar un upload
  async deleteUpload(uploadId) {
    try {
      const tx = this.db.transaction(['uploads', 'blocks', 'files'], 'readwrite');
      
      // Eliminar upload
      const uploadStore = tx.objectStore('uploads');
      const uploadIndex = uploadStore.index('uploadId');
      const uploads = await uploadIndex.getAll(IDBKeyRange.only(uploadId));
      
      for (const upload of uploads) {
        await uploadStore.delete(upload.id);
      }
      
      // Eliminar bloques asociados
      const blockStore = tx.objectStore('blocks');
      const blockIndex = blockStore.index('uploadId');
      const blocks = await blockIndex.getAll(IDBKeyRange.only(uploadId));
      
      for (const block of blocks) {
        await blockStore.delete(block.id);
      }
      
      // Eliminar archivos asociados
      const fileStore = tx.objectStore('files');
      const fileIndex = fileStore.index('uploadId');
      const files = await fileIndex.getAll(IDBKeyRange.only(uploadId));
      
      for (const file of files) {
        await fileStore.delete(file.id);
      }
      
      await tx.done;
      return true;
    } catch (error) {
      console.error('Error eliminando upload:', error);
      return false;
    }
  }

  // ============================================================
  // MÉTODOS PARA BLOQUES
  // ============================================================

  // Guardar un bloque
  async saveBlock(uploadId, blockNumber, blockData, status = 'pending') {
    try {
      const tx = this.db.transaction('blocks', 'readwrite');
      const store = tx.objectStore('blocks');
      
      // Verificar si ya existe este bloque
      const index = store.index('uploadId');
      const blocks = await index.getAll(IDBKeyRange.only(uploadId));
      const existingBlock = blocks.find(b => b.blockNumber === blockNumber);
      
      if (existingBlock) {
        // Actualizar existente
        existingBlock.blockData = blockData;
        existingBlock.status = status;
        existingBlock.lastUpdate = Date.now();
        await store.put(existingBlock);
      } else {
        // Crear nuevo
        await store.add({
          uploadId,
          blockNumber,
          blockData,
          status,
          retryCount: 0,
          timestamp: Date.now(),
          lastUpdate: Date.now()
        });
      }
      
      await tx.done;
      return true;
    } catch (error) {
      console.error('Error guardando bloque:', error);
      return false;
    }
  }

  // Obtener todos los bloques de un upload
  async getBlocks(uploadId) {
    try {
      const tx = this.db.transaction('blocks', 'readonly');
      const store = tx.objectStore('blocks');
      const index = store.index('uploadId');
      
      const blocks = await index.getAll(IDBKeyRange.only(uploadId));
      await tx.done;
      
      return blocks.sort((a, b) => a.blockNumber - b.blockNumber);
    } catch (error) {
      console.error('Error obteniendo bloques:', error);
      return [];
    }
  }

  // Obtener bloques pendientes de un upload
  async getPendingBlocks(uploadId) {
    try {
      const tx = this.db.transaction('blocks', 'readonly');
      const store = tx.objectStore('blocks');
      
      // Usar índice compuesto si existe
      if (store.indexNames.contains('uploadId_status')) {
        const index = store.index('uploadId_status');
        const allBlocks = await index.getAll(IDBKeyRange.only([uploadId, 'pending']));
        const failedBlocks = await index.getAll(IDBKeyRange.only([uploadId, 'failed']));
        await tx.done;
        return [...allBlocks, ...failedBlocks].sort((a, b) => a.blockNumber - b.blockNumber);
      } else {
        // Fallback al método anterior
        const index = store.index('uploadId');
        const blocks = await index.getAll(IDBKeyRange.only(uploadId));
        await tx.done;
        return blocks
          .filter(b => b.status === 'pending' || b.status === 'failed')
          .sort((a, b) => a.blockNumber - b.blockNumber);
      }
    } catch (error) {
      console.error('Error obteniendo pending blocks:', error);
      return [];
    }
  }

  // Obtener bloques completados de un upload
  async getCompletedBlocks(uploadId) {
    try {
      const tx = this.db.transaction('blocks', 'readonly');
      const store = tx.objectStore('blocks');
      const index = store.index('uploadId');
      
      const blocks = await index.getAll(IDBKeyRange.only(uploadId));
      await tx.done;
      
      return blocks
        .filter(b => b.status === 'completed')
        .sort((a, b) => a.blockNumber - b.blockNumber);
    } catch (error) {
      console.error('Error obteniendo completed blocks:', error);
      return [];
    }
  }

  // Actualizar estado de un bloque
  async updateBlockStatus(uploadId, blockNumber, status, result = null) {
    try {
      const tx = this.db.transaction('blocks', 'readwrite');
      const store = tx.objectStore('blocks');
      const index = store.index('uploadId');
      
      const blocks = await index.getAll(IDBKeyRange.only(uploadId));
      const block = blocks.find(b => b.blockNumber === blockNumber);
      
      if (block) {
        block.status = status;
        block.result = result;
        block.lastUpdate = Date.now();
        if (status === 'failed') {
          block.retryCount = (block.retryCount || 0) + 1;
        }
        await store.put(block);
        await tx.done;
        return true;
      }
      
      await tx.done;
      return false;
    } catch (error) {
      console.error('Error actualizando block status:', error);
      return false;
    }
  }

  // Actualizar múltiples bloques a la vez
  async updateMultipleBlocksStatus(uploadId, updates) {
    try {
      const tx = this.db.transaction('blocks', 'readwrite');
      const store = tx.objectStore('blocks');
      const index = store.index('uploadId');
      
      const blocks = await index.getAll(IDBKeyRange.only(uploadId));
      
      for (const update of updates) {
        const block = blocks.find(b => b.blockNumber === update.blockNumber);
        if (block) {
          block.status = update.status;
          block.result = update.result;
          block.lastUpdate = Date.now();
          await store.put(block);
        }
      }
      
      await tx.done;
      return true;
    } catch (error) {
      console.error('Error actualizando múltiples blocks:', error);
      return false;
    }
  }

  // ============================================================
  // MÉTODOS PARA ARCHIVOS
  // ============================================================

  // Guardar metadata del archivo original
  async saveOriginalFile(uploadId, file, jsonData) {
    try {
      const tx = this.db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      
      await store.add({
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        totalRows: jsonData.length,
        timestamp: Date.now()
      });
      
      await tx.done;
      return true;
    } catch (error) {
      console.error('Error guardando archivo original:', error);
      return false;
    }
  }

  // Obtener metadata del archivo
  async getFileInfo(uploadId) {
    try {
      const tx = this.db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const index = store.index('uploadId');
      
      const files = await index.getAll(IDBKeyRange.only(uploadId));
      await tx.done;
      
      return files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error('Error obteniendo file info:', error);
      return null;
    }
  }

  // ============================================================
  // MÉTODOS DE UTILIDAD
  // ============================================================

  // Obtener estadísticas de un upload
  async getUploadStats(uploadId) {
    try {
      const upload = await this.getUploadByUploadId(uploadId);
      const blocks = await this.getBlocks(uploadId);
      
      const completedBlocks = blocks.filter(b => b.status === 'completed').length;
      const failedBlocks = blocks.filter(b => b.status === 'failed').length;
      const pendingBlocks = blocks.filter(b => b.status === 'pending').length;
      
      return {
        upload,
        totalBlocks: blocks.length,
        completedBlocks,
        failedBlocks,
        pendingBlocks,
        progress: blocks.length > 0 ? (completedBlocks / blocks.length) * 100 : 0
      };
    } catch (error) {
      console.error('Error obteniendo stats:', error);
      return null;
    }
  }

  // Limpiar uploads antiguos (más de 24 horas)
  async cleanOldUploads(hours = 24) {
    try {
      const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
      
      const tx = this.db.transaction(['uploads', 'blocks', 'files'], 'readwrite');
      
      // Limpiar uploads
      const uploadStore = tx.objectStore('uploads');
      const uploadIndex = uploadStore.index('timestamp');
      const oldUploads = await uploadIndex.getAll(IDBKeyRange.upperBound(cutoffTime));
      
      for (const upload of oldUploads) {
        // Eliminar upload
        await uploadStore.delete(upload.id);
        
        // Eliminar bloques asociados
        const blockStore = tx.objectStore('blocks');
        const blockIndex = blockStore.index('uploadId');
        const blocks = await blockIndex.getAll(IDBKeyRange.only(upload.uploadId));
        
        for (const block of blocks) {
          await blockStore.delete(block.id);
        }
        
        // Eliminar archivos asociados
        const fileStore = tx.objectStore('files');
        const fileIndex = fileStore.index('uploadId');
        const files = await fileIndex.getAll(IDBKeyRange.only(upload.uploadId));
        
        for (const file of files) {
          await fileStore.delete(file.id);
        }
      }
      
      await tx.done;
      return oldUploads.length;
    } catch (error) {
      console.error('Error limpiando uploads antiguos:', error);
      return 0;
    }
  }

  // Obtener tamaño total usado
  async getTotalSize() {
    try {
      const tx = this.db.transaction('uploads', 'readonly');
      const store = tx.objectStore('uploads');
      const allUploads = await store.getAll();
      await tx.done;
      
      return allUploads.reduce((total, upload) => total + (upload.fileSize || 0), 0);
    } catch (error) {
      console.error('Error obteniendo tamaño total:', error);
      return 0;
    }
  }

  // Verificar si hay espacio disponible
  async hasAvailableSpace(requiredSize) {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const available = estimate.quota - estimate.usage;
        return available > requiredSize;
      }
      return true; // Si no podemos estimar, asumimos que sí hay espacio
    } catch (error) {
      console.error('Error verificando espacio:', error);
      return true;
    }
  }
}

// Exportar una única instancia (singleton)
export default new UploadQueueService();