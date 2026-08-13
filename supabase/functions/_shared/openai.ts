import OpenAI from "npm:openai";

// Resolve the OpenAI API key for a request. Prefer the user-supplied key that
// the frontend forwards on each call via the `x-openai-key` header (bring your
// own key / BYOK), falling back to the platform-level OPENAI_API_KEY env var so
// requests still work when the caller has not provided their own key.
export function resolveOpenAiKey(req: Request): string {
  const header = req.headers.get("x-openai-key");
  if (header && header.trim()) return header.trim();
  return Deno.env.get("OPENAI_API_KEY") || "";
}

// Thrown when no usable key is available. Callers translate this into a 400
// so the UI can prompt the user to add their OpenAI key.
export class MissingOpenAiKeyError extends Error {
  constructor() {
    super(
      "No OpenAI API key provided. Add your OpenAI key in Settings and try again.",
    );
    this.name = "MissingOpenAiKeyError";
  }
}

// Build an OpenAI client from the request, or throw MissingOpenAiKeyError.
export function openAiFromRequest(req: Request): OpenAI {
  const apiKey = resolveOpenAiKey(req);
  if (!apiKey) throw new MissingOpenAiKeyError();
  return new OpenAI({ apiKey });
}
