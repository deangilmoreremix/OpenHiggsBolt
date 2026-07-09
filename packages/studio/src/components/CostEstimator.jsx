"use client";

import { useState, useEffect, useRef } from "react";
import { estimateModelCost } from "../lib/costEstimate.js";

function formatCost(cost) {
  if (cost === null || cost === undefined) return null;
  if (typeof cost === "number") {
    return cost < 1 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`;
  }
  return `$${cost}`;
}

export default function CostEstimator({ apiKey, model, params }) {
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!apiKey || !model) {
      setCost(null);
      return;
    }
    const modelName = model.endpoint || model.id;
    const payload = { ...params, _modelId: model.id };

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const reqId = ++reqIdRef.current;
      const result = await estimateModelCost(apiKey, modelName, payload);
      if (reqId !== reqIdRef.current) return;
      setCost(result);
      setLoading(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [apiKey, model, params]);

  const display = formatCost(cost);

  return (
    <div className="flex items-center justify-between text-xs font-semibold px-1 py-1 min-h-[20px]">
      <span className="text-white/60">Estimated cost</span>
      {loading ? (
        <span className="text-white/40">calculating…</span>
      ) : display ? (
        <span className="text-[#22d3ee] font-mono">{display}</span>
      ) : (
        <span className="text-white/30">—</span>
      )}
    </div>
  );
}
