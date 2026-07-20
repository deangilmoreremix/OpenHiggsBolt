import OpenAI from "npm:openai";

// Resolve the OpenAI API key for a request using a strict "bring your own key"
// (BYOK) model. Users store their own OpenAI key (encrypted in
// app_users.openai_key) and the frontend forwards it on each call via the
// `x-openai-key` header. There is intentionally NO shared server-side
// fallback: every request must carry the caller's own key, so one user can
// never spend another user's (or the platform's) OpenAI quota.
export function resolveOpenAiKey(req: Request): string {
  return req.headers.get("x-openai-key")?.trim() || "";
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
