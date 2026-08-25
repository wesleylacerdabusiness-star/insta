import { http2Get, type RawHttpResponse } from "./http2";
import type { InstagramSource } from "./types";

export const IG_APP_ID = "936619743392459";
export const WEB_PROFILE_INFO_URL = (username: string) =>
  `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;

export const PROFILE_PAGE_URL = (username: string) =>
  `https://www.instagram.com/${encodeURIComponent(username)}/`;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
];

export function pickUserAgent(seed = Date.now()): string {
  return USER_AGENTS[Math.abs(seed) % USER_AGENTS.length]!;
}

export interface InstagramEnvConfig {
  sessionId: string;
  proxyProvider: string;
  scraperApiKey: string;
  scrapingAntKey: string;
  scrapeDoKey: string;
  zenRowsKey: string;
  proxyUrlTemplate: string;
  proxyCountry: string;
  rapidApiKey: string;
  rapidApiHost: string;
  rapidApiPath: string;
  cacheTtlSeconds: number;
}

const INSTAGRAM_CONFIG: InstagramEnvConfig = {
  sessionId: "",
  proxyProvider: "auto",
  scraperApiKey: "",
  scrapingAntKey: "",
  scrapeDoKey: "",
  zenRowsKey: "",
  proxyUrlTemplate: "",
  proxyCountry: "br",
  rapidApiKey: "",
  rapidApiHost: "",
  rapidApiPath: "",
  cacheTtlSeconds: 900,
};

export function readEnvConfig(): InstagramEnvConfig {
  return INSTAGRAM_CONFIG;
}

export function buildApiHeaders(
  username: string,
  config: InstagramEnvConfig,
): Record<string, string> {
  const headers: Record<string, string> = {
    "user-agent": pickUserAgent(username.length + new Date().getUTCHours()),
    "x-ig-app-id": IG_APP_ID,
    accept: "*/*",
    "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "accept-encoding": "gzip, deflate, br",
    referer: PROFILE_PAGE_URL(username),
  };

  if (config.sessionId) headers["cookie"] = `sessionid=${config.sessionId}`;
  return headers;
}
export function buildPageHeaders(username: string): Record<string, string> {
  return {
    "user-agent": pickUserAgent(username.length),
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8",
    "accept-encoding": "gzip, deflate, br",
  };
}

export interface TransportResponse extends RawHttpResponse {
  via: InstagramSource;
}

export function isBlockedStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 429 || (status >= 300 && status < 400);
}

export async function directHttp2(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<TransportResponse | null> {
  const response = await http2Get(url, { headers, timeoutMs });
  return response ? { ...response, via: "direct-http2" } : null;
}

export async function directFetch(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<TransportResponse> {
  const response = await fetch(url, {
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
  });
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
    via: "direct-fetch",
  };
}
export function resolveProxyProvider(config: InstagramEnvConfig): string | null {
  const explicit = config.proxyProvider;
  if (explicit && explicit !== "auto") return explicit;
  if (config.proxyUrlTemplate) return "custom";
  if (config.scraperApiKey) return "scraperapi";
  if (config.zenRowsKey) return "zenrows";
  if (config.scrapingAntKey) return "scrapingant";
  if (config.scrapeDoKey) return "scrapedo";
  return null;
}

export function buildProxyUrl(
  targetUrl: string,
  provider: string,
  config: InstagramEnvConfig,
): string | null {
  const encoded = encodeURIComponent(targetUrl);
  const country = config.proxyCountry;

  switch (provider) {
    case "scraperapi":
      if (!config.scraperApiKey) return null;
      return `https://api.scraperapi.com/?api_key=${config.scraperApiKey}&url=${encoded}&keep_headers=true&country_code=${country}`;
    case "zenrows":
      if (!config.zenRowsKey) return null;
      return `https://api.zenrows.com/v1/?apikey=${config.zenRowsKey}&url=${encoded}&premium_proxy=true&proxy_country=${country}&custom_headers=true`;
    case "scrapingant":
      if (!config.scrapingAntKey) return null;
      return `https://api.scrapingant.com/v2/general?url=${encoded}&x-api-key=${config.scrapingAntKey}&browser=false&proxy_country=${country.toUpperCase()}`;
    case "scrapedo":
      if (!config.scrapeDoKey) return null;
      return `https://api.scrape.do/?token=${config.scrapeDoKey}&url=${encoded}&super=true&geoCode=${country}&customHeaders=true`;
    case "custom":
      if (!config.proxyUrlTemplate) return null;
      return config.proxyUrlTemplate
        .replace("{url_encoded}", encoded)
        .replace("{url}", encoded)
        .replace("{country}", country);
    default:
      return null;
  }
}

export async function proxyServiceGet(
  targetUrl: string,
  headers: Record<string, string>,
  config: InstagramEnvConfig,
  timeoutMs: number,
): Promise<TransportResponse | null> {
  const provider = resolveProxyProvider(config);
  if (!provider) return null;

  const proxyUrl = buildProxyUrl(targetUrl, provider, config);
  if (!proxyUrl) return null;

  const response = await fetch(proxyUrl, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
    via: "proxy-service",
  };
}

export async function rapidApiGet(
  username: string,
  config: InstagramEnvConfig,
  timeoutMs: number,
): Promise<TransportResponse | null> {
  if (!config.rapidApiKey || !config.rapidApiHost) return null;

  const path = (config.rapidApiPath || "/v1/info?username_or_id_or_url={username}").replace(
    "{username}",
    encodeURIComponent(username),
  );

  const response = await fetch(`https://${config.rapidApiHost}${path}`, {
    headers: {
      "x-rapidapi-key": config.rapidApiKey,
      "x-rapidapi-host": config.rapidApiHost,
      accept: "application/json",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
    via: "rapidapi",
  };
}