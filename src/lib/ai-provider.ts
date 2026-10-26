import { AI_CONSENT_VERSION, type AIProvider } from "./ai-contract";
export { AI_CONSENT_VERSION, type AIProvider } from "./ai-contract";
export const CLOUDFLARE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const cloudflareModels = [CLOUDFLARE_MODEL, "@cf/meta/llama-3.1-8b-instruct"];
export function aiProvider(): AIProvider | null {
  const value = (process.env.DAYLANE_AI_PROVIDER ?? "openai")
    .trim()
    .toLowerCase();
  return value === "openai" || value === "cloudflare" ? value : null;
}
export function aiProviderLabel() {
  return aiProvider() === "cloudflare"
    ? "Cloudflare Workers AI"
    : aiProvider() === "openai"
      ? "OpenAI"
      : "the configured AI service";
}
export function aiModel() {
  return (
    process.env.DAYLANE_AI_MODEL?.trim() ||
    (aiProvider() === "cloudflare" ? CLOUDFLARE_MODEL : "gpt-4.1-mini")
  );
}
export function aiConfigured() {
  return (
    process.env.DAYLANE_AI_ENABLED?.trim().toLowerCase() === "true" &&
    Boolean(process.env.DAYLANE_AI_API_KEY?.trim()) &&
    aiProvider() !== null &&
    (aiProvider() !== "cloudflare" ||
      (/^[0-9a-f]{32}$/i.test(
        process.env.DAYLANE_AI_ACCOUNT_ID?.trim() ?? "",
      ) &&
        cloudflareModels.includes(aiModel())))
  );
}
export function providerConsentMatches(form: FormData) {
  return (
    form.get("ai_consent") === "on" &&
    form.get("ai_provider") === aiProvider() &&
    form.get("ai_consent_version") === AI_CONSENT_VERSION
  );
}
export class AIProviderError extends Error {
  status: number;
  constructor(status: number) {
    super("AI provider unavailable (" + status + ").");
    this.status = status;
  }
}
export class AIDocumentError extends Error {
  constructor() {
    super(
      "The document could not be converted to a short, readable text draft.",
    );
  }
}
export function aiFailureMessage(error: unknown) {
  if (error instanceof AIDocumentError)
    return "The document could not be converted to readable text within the size limit. Try a clearer image, a shorter PDF, or upload TXT/CSV.";
  if (error instanceof AIProviderError) {
    if (error.status === 401 || error.status === 403)
      return aiProvider() === "cloudflare"
        ? "Cloudflare rejected access. The app owner should check the account ID, Workers AI token permissions, and model settings."
        : "The AI service configuration or permissions need attention. Contact the app owner to check the server API key and model access.";
    if (error.status === 429)
      return aiProvider() === "cloudflare"
        ? "Cloudflare’s free daily allocation or a service rate limit has been reached. Wait before retrying; the free allocation resets at 00:00 UTC."
        : "The AI provider has reached a billing or usage limit. Try later or ask the app owner to check the API project.";
  }
  return "The AI could not produce a validated draft. Try a clearer source later, or enter items manually.";
}
function account() {
  const id = process.env.DAYLANE_AI_ACCOUNT_ID?.trim() ?? "";
  if (!/^[0-9a-f]{32}$/i.test(id)) throw new AIProviderError(401);
  return id;
}
export async function cloudflareStructured(
  messages: { role: string; content: string }[],
  schema: object,
  key: string,
  model: string,
  maxTokens: number,
  request: typeof fetch = fetch,
): Promise<unknown> {
  if (!cloudflareModels.includes(model)) throw new AIProviderError(400);
  const response = await request(
    "https://api.cloudflare.com/client/v4/accounts/" +
      account() +
      "/ai/run/" +
      model,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key.trim(),
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        messages,
        max_tokens: maxTokens,
        temperature: 0.2,
        stream: false,
        response_format: { type: "json_schema", json_schema: schema },
      }),
    },
  );
  if (!response.ok) throw new AIProviderError(response.status);
  const body = await response.json();
  if (body.success !== true) throw new AIProviderError(502);
  const result = body.result?.response;
  if (typeof result === "string") {
    if (result.length > 100000) throw new AIProviderError(502);
    try {
      return JSON.parse(result);
    } catch {
      throw new AIProviderError(502);
    }
  }
  if (result && typeof result === "object") return result;
  throw new AIProviderError(502);
}
export async function cloudflareDocumentText(
  asset: { mime: string; base64: string },
  key: string,
  request: typeof fetch = fetch,
): Promise<string> {
  const data = Buffer.from(asset.base64, "base64");
  if (data.length > 4 * 1024 * 1024) throw new AIDocumentError();
  const form = new FormData();
  form.append(
    "files",
    new Blob([data], { type: asset.mime }),
    asset.mime === "application/pdf"
      ? "schedule.pdf"
      : asset.mime === "image/png"
        ? "schedule.png"
        : asset.mime === "image/jpeg"
          ? "schedule.jpg"
          : "schedule.webp",
  );
  const response = await request(
    "https://api.cloudflare.com/client/v4/accounts/" +
      account() +
      "/ai/tomarkdown",
    {
      method: "POST",
      headers: { Authorization: "Bearer " + key.trim() },
      body: form,
      signal: AbortSignal.timeout(25000),
    },
  );
  if (!response.ok) throw new AIProviderError(response.status);
  const payload = await response.json();
  const file = payload.result?.[0];
  if (
    payload.success !== true ||
    file?.format !== "markdown" ||
    typeof file.data !== "string" ||
    file.data.trim().length < 40 ||
    file.data.length > 12000
  )
    throw new AIDocumentError();
  return file.data;
}
