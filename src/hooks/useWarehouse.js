// hooks/useWarehouse.js
import { useState, useEffect } from "react";

export function useWarehouse(warehouses = [], cameFromNormalizer = false) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedWarehouseName, setSelectedWarehouseName] = useState("");

  // Auto seleccionar si solo hay un almacén
  useEffect(() => {
    if (warehouses.length === 1) {
      setSelectedWarehouseId(String(warehouses[0].id));
      setSelectedWarehouseName((warehouses[0].name || "").trim());
      sessionStorage.setItem('selectedWarehouseId', String(warehouses[0].id));
    }
  }, [warehouses]);

  // Cargar desde sessionStorage si viene del normalizer
  useEffect(() => {
    if (cameFromNormalizer) {
      const savedWarehouseId = sessionStorage.getItem('selectedWarehouseId');
      if (savedWarehouseId) {
        setSelectedWarehouseId(savedWarehouseId);
        const warehouse = warehouses.find(w => String(w.id) === String(savedWarehouseId));
        if (warehouse) {
          setSelectedWarehouseName(warehouse.name);
        }
      }
    }
  }, [cameFromNormalizer, warehouses]);

  const handleWarehouseChange = (e) => {
    const warehouseId = e.target.value;
    setSelectedWarehouseId(warehouseId);

    const warehouse = warehouses.find((w) => String(w.id) === String(warehouseId));
    const warehouseName = (warehouse?.name || "").trim();
    setSelectedWarehouseName(warehouseName);
    
    if (warehouseId) {
      sessionStorage.setItem('selectedWarehouseId', warehouseId);
    }
  };

  const validateWarehouse = () => {
    if (!selectedWarehouseId) {
      return { valid: false, error: "Debe seleccionar un almacén" };
    }
    if (!selectedWarehouseName || !selectedWarehouseName.trim()) {
      return { valid: false, error: "No se pudo obtener el nombre del almacén" };
    }
    return { valid: true, error: null };  
  };

  return {
    selectedWarehouseId,
    selectedWarehouseName,
    handleWarehouseChange,
    validateWarehouse,
  };
}