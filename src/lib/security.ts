import { SECURITY_CONFIG } from "@/config/security";

export function isBotUserAgent(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }


  if (navigator.webdriver) {
    return true;
  }

  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || "").toLowerCase();


  const botPatterns = [
    "facebookexternalhit",
    "facebookcatalog",
    "facebot",
    "meta-externalagent",
    "googlebot",
    "bingbot",
    "msnbot",
    "slurp",
    "duckduckbot",
    "baiduspider",
    "yandexbot",
    "sogou",
    "exabot",
    "ia_archiver",
    "alexa",
    "semrushbot",
    "ahrefsbot",
    "mj12bot",
    "dotbot",
    "rogerbot",
    "seokicks",
    "mediapartners-google",
    "adsbot-google",
    "google-read-aloud",
    "lighthouse",
    "headlesschrome",
    "phantomjs",
    "selenium",
    "puppeteer",
    "playwright",
    "nightwatch",
    "cypress",
    "curl",
    "wget",
    "python-requests",
    "aiohttp",
    "urllib",
    "postmanruntime",
    "insomnia",
    "axios",
    "node-fetch",
    "bot",
    "crawler",
    "spider",
    "crawling",
    "scraper",
  ];

  for (const pattern of botPatterns) {
    if (ua.includes(pattern)) {
      return true;
    }
  }

  return false;
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return true;
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";


  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  const isUaMobile = mobileRegex.test(ua);

  const isTouchDevice =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  const isSmallScreen =
    window.innerWidth <= 1024 ||
    (window.screen && window.screen.width <= 1024);


  return isUaMobile || (isTouchDevice && isSmallScreen);
}

export function isValidAccessKey(keyValue?: string | null): boolean {
  if (!SECURITY_CONFIG.enabled) return true;
  if (!keyValue || typeof keyValue !== "string") return false;
  const trimmed = keyValue.trim();

  if (SECURITY_CONFIG.acceptAnyHexHash && /^[a-f0-9]{6,10}$/i.test(trimmed)) {
    return true;
  }


  if (SECURITY_CONFIG.allowedKeys.includes(trimmed)) {
    return true;
  }

  return false;
}

export interface TrafficValidationResult {
  allowed: boolean;
  reason?: "bot" | "desktop" | "missing_key" | "invalid_key";
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SECURITY_CONFIG.tokenSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

function getDeviceFingerprint(): string {
  const parts: string[] = [];
  if (typeof navigator !== "undefined") {
    parts.push(navigator.userAgent || "");
    parts.push(navigator.language || "");
    parts.push(String(navigator.hardwareConcurrency || 0));
  }
  if (typeof screen !== "undefined") {
    parts.push(`${screen.width}x${screen.height}`);
    parts.push(String(screen.colorDepth || 0));
  }
  return parts.join("|");
}
async function createAccessToken(): Promise<string> {
  const now = Date.now();
  const payload = `${now}|${getDeviceFingerprint()}`;
  const enc = new TextEncoder();
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));

  const timestampHex = now.toString(16);
  return `${timestampHex}.${bufToHex(sig)}`;
}

async function verifyAccessToken(token: string): Promise<boolean> {
  try {
    const dotIndex = token.indexOf(".");
    if (dotIndex === -1) return false;
    const timestampHex = token.substring(0, dotIndex);
    const signatureHex = token.substring(dotIndex + 1);


    const timestamp = parseInt(timestampHex, 16);
    if (isNaN(timestamp) || timestamp <= 0) return false;

    const elapsed = Date.now() - timestamp;
    const windowMs = SECURITY_CONFIG.accessWindowHours * 60 * 60 * 1000;
    if (elapsed < 0 || elapsed > windowMs) return false;

    const payload = `${timestamp}|${getDeviceFingerprint()}`;
    const enc = new TextEncoder();
    const key = await getHmacKey();
    const sigBuf = hexToBuf(signatureHex);

    return crypto.subtle.verify("HMAC", key, sigBuf, enc.encode(payload));
  } catch {
    return false;
  }
}

async function saveAccessGrant(): Promise<void> {
  try {
    const token = await createAccessToken();
    localStorage.setItem(SECURITY_CONFIG.storageKey, token);
  } catch {

  }
}

async function hasValidAccessGrant(): Promise<boolean> {
  try {
    const token = localStorage.getItem(SECURITY_CONFIG.storageKey);
    if (!token) return false;
    const valid = await verifyAccessToken(token);
    if (!valid) {

      localStorage.removeItem(SECURITY_CONFIG.storageKey);
    }
    return valid;
  } catch {
    return false;
  }
}

export async function validateTrafficAccess(
  searchParamKey?: string | null,
): Promise<TrafficValidationResult> {
  if (!SECURITY_CONFIG.enabled) {
    return { allowed: true };
  }

  if (typeof window === "undefined") {
    return { allowed: true };
  }

  if (SECURITY_CONFIG.blockBots && isBotUserAgent()) {
    return { allowed: false, reason: "bot" };
  }


  if (SECURITY_CONFIG.blockDesktop && !isMobileDevice()) {
    return { allowed: false, reason: "desktop" };
  }
  if (SECURITY_CONFIG.persistSession) {
    const hasGrant = await hasValidAccessGrant();
    if (hasGrant) {
      return { allowed: true };
    }
  }


  if (!searchParamKey) {
    return { allowed: false, reason: "missing_key" };
  }

  if (!isValidAccessKey(searchParamKey)) {
    return { allowed: false, reason: "invalid_key" };
  }


  if (SECURITY_CONFIG.persistSession) {
    await saveAccessGrant();
  }

  return { allowed: true };
}

export function executeSecurityRedirect(): void {
  if (typeof window !== "undefined") {
    window.location.replace(SECURITY_CONFIG.redirectUrl);
  }
}
