import axios from "axios";

const BASE_URL = (typeof window !== "undefined" && window.location?.protocol?.startsWith("http"))
  ? "/api"
  : "https://api.muapi.ai";

function buildPayload(params) {
  const payload = {};
  const skipKeys = ["_modelId", "onRequestId"];
  for (const key in params) {
    if (!skipKeys.includes(key) && params[key] !== undefined && params[key] !== null) {
      payload[key] = params[key];
    }
  }
  return payload;
}

function extractCost(data) {
  if (data === null || data === undefined) return null;
  if (typeof data === "number") return data;
  if (typeof data === "string") {
    const parsed = parseFloat(data.replace(/[^0-9.]/g, ""));
    return isNaN(parsed) ? data : parsed;
  }
  if (typeof data === "object") {
    const maybe =
      data.cost ??
      data.estimated_cost ??
      data.estimate ??
      data.price ??
      data.amount ??
      data.total ??
      data.usd ??
      (data.data && (data.data.cost ?? data.data.estimated_cost ?? data.data.price));
    return maybe ?? null;
  }
  return null;
}

async function postEstimate(modelName, payload, apiKey) {
  const url = `${BASE_URL}/api/v1/models/${encodeURIComponent(modelName)}/estimate-cost`;
  const response = await axios.post(
    url,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      validateStatus: (status) => status >= 200 && status < 300,
    }
  );
  return response.data;
}

export async function estimateModelCost(apiKey, modelName, payload) {
  if (!apiKey || !modelName) return null;
  try {
    const data = await postEstimate(modelName, buildPayload(payload), apiKey);
    return extractCost(data);
  } catch (err) {
    if (err?.response?.status === 404) {
      try {
        const data = await postEstimate(payload?._modelId || modelName, buildPayload(payload), apiKey);
        return extractCost(data);
      } catch {
        return null;
      }
    }
    return null;
  }
}
