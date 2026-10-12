import OpenAI from "npm:openai";

// Resolve the OpenAI API key for a request.
//
// BYOK ONLY: the key must come from the caller's `x-openai-key` header. There is
// deliberately NO platform-level `OPENAI_API_KEY` fallback here — a server-side
// fallback would silently bill the operator for a user operation and bypass the
// per-user key model the rest of the app enforces (see src/lib/openaiKeyServer.ts
// and the MuAPI equivalent in src/lib/keys.js).
//
// Note: `tests/byok-enforcement.vitest.test.ts` scans src/, app/ and lib/ for
// server key reads; supabase/functions/ is a separate runtime and was not
// previously covered, which is how this fallback survived. Keep them in sync if
// that suite's scan is broadened.
export function resolveOpenAiKey(req: Request): string {
  const header = req.headers.get("x-openai-key");
  if (header && header.trim()) return header.trim();
  return "";
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
