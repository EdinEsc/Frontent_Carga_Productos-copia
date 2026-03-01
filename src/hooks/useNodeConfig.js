// hooks/useNodeConfig.js
import { useMemo } from "react";
import { NODES } from "../constants/nodes";

export function useNodeConfig() {
  const getNodeFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const nodeParam = params.get("node");
    
    if (!nodeParam) return "n1";
    
    const nodeMap = {
      "1": "n1",
      "2": "n23",
      "3": "n23",
      "4": "n4",
      "5": "n5"
    };
    
    return nodeMap[nodeParam] || "n1";
  };

  const nodeKey = useMemo(() => getNodeFromUrl(), []);
  
  const getNodeBase = () => {
    const node = NODES.find(n => n.key === nodeKey);
    return node ? node.base : NODES[0].base;
  };

  const baseUrl = useMemo(() => getNodeBase(), [nodeKey]);
  const nodeLabel = useMemo(() => {
    const node = NODES.find(n => n.key === nodeKey);
    return node ? node.label : "Nodo no encontrado";
  }, [nodeKey]);

  return { nodeKey, baseUrl, nodeLabel };
}