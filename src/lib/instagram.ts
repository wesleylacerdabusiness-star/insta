import { createServerFn } from "@tanstack/react-start";

import { normalizeUsername, instagramError, type InstagramProfileData } from "./instagram/types";

export type { InstagramProfileData, InstagramErrorCode, InstagramSource } from "./instagram/types";
export { isInstagramError, normalizeUsername, isValidUsername } from "./instagram/types";
export {
  decodeHtmlEntities,
  formatInstagramNumber,
  formatNameFromUsername,
  generateRealisticProfileFallback,
  parseCompactNumber,
  stringToHash,
} from "./instagram/format";
export { parseInstagramHtml } from "./instagram/parse";

const CACHE_PREFIX = "instaspy_profile_v2_";
const CLIENT_CACHE_TTL_MS = 15 * 60_000;

export const fetchInstagramProfileServer = createServerFn({ method: "GET" })
  .validator((username: string) => username)
  .handler(async ({ data }): Promise<InstagramProfileData> => {
    const { getInstagramProfile } = await import("./instagram/server");
    return getInstagramProfile(data);
  });

function readClientCache(username: string): InstagramProfileData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + username);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InstagramProfileData;
    const age = Date.now() - (parsed.fetchedAt ?? 0);
    if (parsed.status !== "success" || parsed.username !== username || age > CLIENT_CACHE_TTL_MS) {
      window.localStorage.removeItem(CACHE_PREFIX + username);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeClientCache(profile: InstagramProfileData): void {
  if (typeof window === "undefined" || profile.status !== "success") return;
  try {
    window.localStorage.setItem(CACHE_PREFIX + profile.username, JSON.stringify(profile));
  } catch {

  }
}

export interface FetchInstagramProfileOptions {

  forceRefresh?: boolean;
}

export async function fetchInstagramProfile(
  username: string,
  options: FetchInstagramProfileOptions = {},
): Promise<InstagramProfileData> {
  const cleanUser = normalizeUsername(username);
  if (!cleanUser) {
    return instagramError(
      "",
      "invalid_username",
      "Informe um nome de usuário válido do Instagram.",
    );
  }

  if (!options.forceRefresh) {
    const cached = readClientCache(cleanUser);
    if (cached) return cached;
  }

  try {
    const result = await fetchInstagramProfileServer({ data: cleanUser });
    writeClientCache(result);
    return result;
  } catch (error) {
    console.warn("[instagram] falha ao consultar o servidor:", error);
    return instagramError(
      cleanUser,
      "network_error",
      "Não foi possível consultar o perfil agora. Tente novamente.",
    );
  }
}
