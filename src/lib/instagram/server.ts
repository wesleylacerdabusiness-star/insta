import { buildProxiedImageUrl, buildProxiedImageUrls } from "./image-proxy";
import {
  htmlSaysNotFound,
  normalizeUserPayload,
  parseInstagramHtml,
  payloadSaysNotFound,
  type NormalizedProfile,
} from "./parse";
import {
  buildApiHeaders,
  buildPageHeaders,
  directFetch,
  directHttp2,
  isBlockedStatus,
  PROFILE_PAGE_URL,
  proxyServiceGet,
  rapidApiGet,
  readEnvConfig,
  resolveProxyProvider,
  WEB_PROFILE_INFO_URL,
  type InstagramEnvConfig,
  type TransportResponse,
} from "./transports";
import {
  instagramError,
  isValidUsername,
  normalizeUsername,
  type InstagramProfileData,
  type InstagramSource,
} from "./types";

const REQUEST_TIMEOUT_MS = 12_000;
interface CacheEntry {
  expiresAt: number;
  data: InstagramProfileData;
}
const cache = new Map<string, CacheEntry>();
const NEGATIVE_TTL_MS = 5 * 60_000;
const MAX_CACHE_ENTRIES = 500;

function readCache(username: string): InstagramProfileData | null {
  const entry = cache.get(username);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(username);
    return null;
  }
  return { ...entry.data, source: "cache" };
}

function writeCache(username: string, data: InstagramProfileData, ttlMs: number): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(username, { expiresAt: Date.now() + ttlMs, data });
}

export function clearInstagramCache(username?: string): void {
  if (username) cache.delete(normalizeUsername(username));
  else cache.clear();
}

type Classification =
  | { kind: "success"; profile: NormalizedProfile; source: InstagramSource }
  | { kind: "not_found" }
  | { kind: "blocked"; detail: string };

function classifyJson(response: TransportResponse, username: string): Classification {
  if (response.status === 404) return { kind: "not_found" };

  if (isBlockedStatus(response.status)) {
    return { kind: "blocked", detail: `HTTP ${response.status} em ${response.via}` };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(response.body);
  } catch {

    if (htmlSaysNotFound(response.body)) return { kind: "not_found" };
    return { kind: "blocked", detail: `resposta não-JSON em ${response.via}` };
  }

  if (payloadSaysNotFound(payload)) return { kind: "not_found" };

  const profile = normalizeUserPayload(payload, username);
  if (!profile || !profile.username) {
    return { kind: "blocked", detail: `payload sem usuário em ${response.via}` };
  }


  const hasRealData =
    profile.followerCount > 0 || profile.mediaCount > 0 || !!profile.profilePicUrl;
  if (!hasRealData) return { kind: "blocked", detail: `métricas zeradas em ${response.via}` };

  return { kind: "success", profile, source: response.via };
}

function classifyHtml(response: TransportResponse, username: string): Classification {
  if (response.status === 404 || htmlSaysNotFound(response.body)) return { kind: "not_found" };
  if (isBlockedStatus(response.status)) {
    return { kind: "blocked", detail: `HTTP ${response.status} na página` };
  }

  const parsed = parseInstagramHtml(response.body, username);
  const followers = Number(parsed.followerCount) || 0;
  const media = Number(parsed.mediaCount) || 0;
  const picture = parsed.profilePicUrl ?? "";
  const isGenericIcon =
    !picture || picture.includes("static.cdninstagram.com") || picture.includes("rsrc.php");


  if (followers <= 0 && media <= 0) return { kind: "blocked", detail: "login wall no HTML" };

  return {
    kind: "success",
    source: "html-og",
    profile: {
      username,
      fullName: parsed.fullName ?? "",
      biography: parsed.biography ?? "",
      profilePicUrl: isGenericIcon ? "" : picture,
      followerCount: followers,
      followingCount: Number(parsed.followingCount) || 0,
      mediaCount: media,
      isPrivate: Boolean(parsed.isPrivate),
      isVerified: Boolean(parsed.isVerified),
      mediaThumbnails: parsed.mediaThumbnails ?? [],
    },
  };
}

async function toProfileData(
  profile: NormalizedProfile,
  source: InstagramSource,
): Promise<InstagramProfileData> {
  const [profilePicUrl, mediaThumbnails] = await Promise.all([
    buildProxiedImageUrl(profile.profilePicUrl),
    buildProxiedImageUrls(profile.mediaThumbnails),
  ]);

  return {
    status: "success",
    username: profile.username,
    fullName: profile.fullName,

    profilePicUrl: profilePicUrl || profile.profilePicUrl,
    profilePicUrlOriginal: profile.profilePicUrl,
    biography: profile.biography,
    followerCount: profile.followerCount,
    followingCount: profile.followingCount,
    mediaCount: profile.mediaCount,
    isPrivate: profile.isPrivate,
    isVerified: profile.isVerified,
    mediaThumbnails,
    category: profile.category,
    externalUrl: profile.externalUrl,
    userId: profile.userId,
    source,
    fetchedAt: Date.now(),
  };
}

interface Attempt {
  label: string;
  run: () => Promise<TransportResponse | null>;
  classify: (response: TransportResponse) => Classification;
}

function buildAttempts(username: string, config: InstagramEnvConfig): Attempt[] {
  const apiUrl = WEB_PROFILE_INFO_URL(username);
  const pageUrl = PROFILE_PAGE_URL(username);
  const apiHeaders = buildApiHeaders(username, config);
  const pageHeaders = buildPageHeaders(username);
  const json = (response: TransportResponse) => classifyJson(response, username);
  const html = (response: TransportResponse) => classifyHtml(response, username);

  const attempts: Attempt[] = [
    {
      label: "api/http2",
      run: () => directHttp2(apiUrl, apiHeaders, REQUEST_TIMEOUT_MS),
      classify: json,
    },
    {
      label: "api/fetch",
      run: () => directFetch(apiUrl, apiHeaders, REQUEST_TIMEOUT_MS),
      classify: json,
    },
  ];

  if (resolveProxyProvider(config)) {
    attempts.push({
      label: "api/proxy",
      run: () => proxyServiceGet(apiUrl, apiHeaders, config, REQUEST_TIMEOUT_MS * 2),
      classify: json,
    });
  }

  if (config.rapidApiKey && config.rapidApiHost) {
    attempts.push({
      label: "rapidapi",
      run: () => rapidApiGet(username, config, REQUEST_TIMEOUT_MS),
      classify: json,
    });
  }

  attempts.push({
    label: "page/http2",
    run: () => directHttp2(pageUrl, pageHeaders, REQUEST_TIMEOUT_MS),
    classify: html,
  });

  if (resolveProxyProvider(config)) {
    attempts.push({
      label: "page/proxy",
      run: () => proxyServiceGet(pageUrl, pageHeaders, config, REQUEST_TIMEOUT_MS * 2),
      classify: html,
    });
  }

  return attempts;
}

export interface GetProfileOptions {

  forceRefresh?: boolean;
}

export async function getInstagramProfile(
  rawUsername: string,
  options: GetProfileOptions = {},
): Promise<InstagramProfileData> {
  const username = normalizeUsername(rawUsername);

  if (!username || !isValidUsername(username)) {
    return instagramError(
      username,
      "invalid_username",
      "Informe um nome de usuário válido do Instagram.",
    );
  }

  if (!options.forceRefresh) {
    const cached = readCache(username);
    if (cached) return cached;
  }

  const config = readEnvConfig();
  const attempts = buildAttempts(username, config);
  const failures: string[] = [];
  let networkFailures = 0;

  for (const attempt of attempts) {
    let response: TransportResponse | null;
    try {
      response = await attempt.run();
    } catch (error) {
      networkFailures++;
      failures.push(`${attempt.label}: ${(error as Error)?.message ?? "erro de rede"}`);
      continue;
    }


    if (!response) continue;

    const verdict = attempt.classify(response);

    if (verdict.kind === "success") {
      const data = await toProfileData(verdict.profile, verdict.source);
      writeCache(username, data, config.cacheTtlSeconds * 1000);
      console.info(`[instagram] @${username} obtido via ${attempt.label} (${verdict.source})`);
      return data;
    }

    if (verdict.kind === "not_found") {
      const notFound = instagramError(
        username,
        "not_found",
        "Este perfil não existe no Instagram.",
      );
      writeCache(username, notFound, NEGATIVE_TTL_MS);
      console.info(`[instagram] @${username} não existe (via ${attempt.label})`);
      return notFound;
    }

    failures.push(`${attempt.label}: ${verdict.detail}`);
  }

  console.warn(`[instagram] @${username} bloqueado. Tentativas: ${failures.join(" | ")}`);


  if (networkFailures > 0 && networkFailures === failures.length) {
    return instagramError(
      username,
      "network_error",
      "Não foi possível conectar ao Instagram. Tente novamente.",
    );
  }

  return instagramError(
    username,
    "blocked",
    "O Instagram bloqueou a consulta no momento. Tente novamente em alguns instantes.",
  );
}
