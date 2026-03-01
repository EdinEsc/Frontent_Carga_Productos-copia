// hooks/useAuth.js
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export function useAuth() {
  const [employeeData, setEmployeeData] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const alreadyRan = useRef(false);

  useEffect(() => {
    if (alreadyRan.current) return;
    alreadyRan.current = true;

    const procesarToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const node = params.get("node");

        if (!token || !node) {
          console.warn("⚠️ Falta token o node en la URL");
          return;
        }

        const salesNode = `https://n${node}.sales.casamarketapp.com`;
        const productNode = `https://n${node}.product.casamarketapp.com`;

        const fetchWithAuth = async (url, extraHeaders = {}) => {
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              ...extraHeaders,
            },
          });

          if (res.status === 401) {
            console.warn("🔒 Token inválido o expirado");
            toast.error("Sesión expirada. Recargando...");
            setTimeout(() => window.location.reload(), 1500);
            throw new Error("Unauthorized");
          }

          return res;
        };

        // Obtener employee
        const employeeRes = await fetchWithAuth(
          `${salesNode}/employees/current`,
          { Accept: "application/vnd.appv1.10.1+json" }
        );

        if (!employeeRes.ok) {
          throw new Error("Error obteniendo employee");
        }

        const employeeData = await employeeRes.json();
        setEmployeeData(employeeData);

        // Obtener warehouses
        const warehouseRes = await fetchWithAuth(
          `${productNode}/warehouses`,
          { Accept: "application/json" }
        );

        if (!warehouseRes.ok) {
          throw new Error("Error obteniendo warehouses");
        }

        const allWarehouses = await warehouseRes.json();
        const warehousesFiltrados = allWarehouses.filter(
          (w) => w.companyId === employeeData.companyId && w.flagActive
        );

        setWarehouses(warehousesFiltrados);

        // Obtener price lists
        const priceListsRes = await fetchWithAuth(
          `${salesNode}/sal-price-lists?page=1&limit=10&sortDirection=desc&sortField=created_at`,
          { Accept: "application/vnd.appv1.10.1+json" }
        );

        if (!priceListsRes.ok) {
          throw new Error("Error obteniendo listas de precios");
        }

        const priceLists = await priceListsRes.json();
        sessionStorage.setItem('priceLists', JSON.stringify(priceLists));

      } catch (error) {
        console.error("❌ ERROR:", error);
      }
    };

    procesarToken();
  }, []);

  return { employeeData, warehouses };
}