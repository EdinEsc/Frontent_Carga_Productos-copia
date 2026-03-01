// hooks/usePriceLists.js
import { useState, useEffect } from "react";

export function usePriceLists(cargaMode) {
  const [priceLists, setPriceLists] = useState([]);
  const [selectedPriceLists, setSelectedPriceLists] = useState(new Set());
  const [priceListId, setPriceListId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPriceLists = async () => {
      setLoading(true);
      try {
        const savedPriceLists = sessionStorage.getItem('priceLists');
        
        if (savedPriceLists) {
          const data = JSON.parse(savedPriceLists);
          setPriceLists(data);

          if (cargaMode === "NORMAL") {
            if (data.length === 1) {
              setPriceListId(String(data[0].id));
            } else if (data.length > 1) {
              const defaultList = data.find(pl => pl.flagDefault === 1 || pl.flagDefault === true);
              if (defaultList) {
                setPriceListId(String(defaultList.id));
              }
            }
          } else if (cargaMode === "CONVERSION") {
            setSelectedPriceLists(new Set(data.map(pl => String(pl.id))));
          }
        } else {
          setError("No hay listas de precios disponibles");
        }
      } catch (err) {
        console.error("Error cargando listas de precios:", err);
        setError("Error al cargar listas de precios");
      } finally {
        setLoading(false);
      }
    };

    if (priceLists.length === 0) {
      loadPriceLists();
    }
  }, [cargaMode, priceLists.length]);

  const togglePriceList = (priceListId) => {
    setSelectedPriceLists(prev => {
      const next = new Set(prev);
      if (next.has(priceListId)) {
        next.delete(priceListId);
      } else {
        next.add(priceListId);
      }
      return next;
    });
  };

  const toggleSelectAllPriceLists = () => {
    if (selectedPriceLists.size === priceLists.length) {
      setSelectedPriceLists(new Set());
    } else {
      setSelectedPriceLists(new Set(priceLists.map(pl => String(pl.id))));
    }
  };

  return {
    priceLists,
    selectedPriceLists,
    priceListId,
    setPriceListId,
    loading,
    error,
    togglePriceList,
    toggleSelectAllPriceLists,
  };
}