// components/DebugData.jsx
import { useEffect, useState } from "react";

export default function DebugData({ employeeData, warehouses, priceLists }) {
  const [showDebug, setShowDebug] = useState(false);
  const [nodeInfo, setNodeInfo] = useState({});
  
  useEffect(() => {
    // Obtener información del nodo de la URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const node = params.get("node");
    
    setNodeInfo({
      token: token ? `${token.substring(0, 20)}...` : "No token",
      node: node || "No node",
      fullUrl: window.location.href
    });
  }, []);
  
  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-xs z-50"
      >
        🐛 Ver datos disponibles
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#02979B]">
            📊 Datos disponibles para la carga
          </h2>
          <button
            onClick={() => setShowDebug(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕ Cerrar
          </button>
        </div>
        
        {/* Información de URL y nodo */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl">
          <h3 className="font-semibold text-blue-800 mb-2">🔗 Información de URL</h3>
          <pre className="text-xs bg-white p-2 rounded overflow-auto">
            {JSON.stringify(nodeInfo, null, 2)}
          </pre>
        </div>
        
        {/* Employee Data */}
        <div className="mb-6">
          <h3 className="font-semibold text-[#02979B] mb-2">👤 employeeData</h3>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(employeeData, null, 2)}
          </pre>
          
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-100 p-2 rounded">
              <span className="font-medium">companyId:</span> {employeeData?.companyId}
            </div>
            <div className="bg-gray-100 p-2 rounded">
              <span className="font-medium">subsidiaryId:</span> {employeeData?.comSubsidiariesId || employeeData?.subsidiary?.id}
            </div>
            <div className="bg-gray-100 p-2 rounded">
              <span className="font-medium">email:</span> {employeeData?.email}
            </div>
            <div className="bg-gray-100 p-2 rounded">
              <span className="font-medium">warehouseId:</span> {employeeData?.warWarehousesId}
            </div>
          </div>
        </div>
        
        {/* Warehouses */}
        <div className="mb-6">
          <h3 className="font-semibold text-[#02979B] mb-2">🏢 warehouses ({warehouses?.length})</h3>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(warehouses, null, 2)}
          </pre>
        </div>
        
        {/* Price Lists */}
        <div className="mb-6">
          <h3 className="font-semibold text-[#02979B] mb-2">💰 priceLists ({priceLists?.length})</h3>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(priceLists, null, 2)}
          </pre>
        </div>
        
        {/* Resumen de lo que necesita el nuevo servicio */}
        <div className="mt-6 p-4 bg-green-50 rounded-xl">
          <h3 className="font-semibold text-green-800 mb-2">
            ✅ Lo que necesita el nuevo servicio:
          </h3>
          <ul className="list-disc ml-5 text-sm space-y-1">
            <li><span className="font-medium">companyId:</span> {employeeData?.companyId} (✓ disponible)</li>
            <li><span className="font-medium">subsidiaryId:</span> {employeeData?.comSubsidiariesId || employeeData?.subsidiary?.id} (✓ disponible)</li>
            <li><span className="font-medium">cmNodeName:</span> {nodeInfo.node} (✓ disponible)</li>
            <li><span className="font-medium">countryCode:</span> "PER" (fijo)</li>
            <li><span className="font-medium">email:</span> {employeeData?.email || "sistema"} (✓ disponible)</li>
            <li><span className="font-medium">priceListIds:</span> array de objetos con id, name, suffix (✓ disponible)</li>
            <li><span className="font-medium">salesApiUrl:</span> https://n{nodeInfo.node}.sales.casamarketapp.com (✓ disponible)</li>
            <li><span className="font-medium">useSimpleBrand:</span> true (fijo)</li>
            <li><span className="font-medium">taxCodeCountry:</span> "01" o "02" según IGV (✓ configurable)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}