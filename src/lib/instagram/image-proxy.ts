const ALLOWED_IMAGE_HOSTS = [".cdninstagram.com", ".fbcdn.net", "cdninstagram.com", "fbcdn.net"];
export const IG_IMAGE_PROXY_PATH = "/api/ig-image";
const IMAGE_PROXY_SECRET = "92e44a015f622b910673d924153532f5cbf5cfe2b6089be689a661883601069d";
function getSecret(): string {
  return IMAGE_PROXY_SECRET;
}
export function isAllowedImageHost(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:") return false;
    return ALLOWED_IMAGE_HOSTS.some(
      (suffix) => hostname === suffix.replace(/^\./, "") || hostname.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

let keyPromise: Promise<CryptoKey> | undefined;

function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }
  return keyPromise;
}

async function sign(value: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getKey(),
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function buildProxiedImageUrl(rawUrl: string | null | undefined): Promise<string> {
  if (!rawUrl || !isAllowedImageHost(rawUrl)) return "";
  const params = new URLSearchParams({ u: rawUrl, s: await sign(rawUrl) });
  return `${IG_IMAGE_PROXY_PATH}?${params.toString()}`;
}

export async function buildProxiedImageUrls(
  rawUrls: Array<string | null | undefined>,
): Promise<string[]> {
  const proxied = await Promise.all(rawUrls.map((url) => buildProxiedImageUrl(url)));
  return proxied.filter(Boolean);
}

export async function verifyProxiedImageUrl(
  rawUrl: string | null,
  signature: string | null,
): Promise<boolean> {
  if (!rawUrl || !signature || !isAllowedImageHost(rawUrl)) return false;
  return safeEqual(await sign(rawUrl), signature);
}
