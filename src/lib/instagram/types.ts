export type InstagramErrorCode =

  | "invalid_username"
  | "not_found"
  | "blocked"
  | "network_error"
  | "rate_limited";

export type InstagramSource =
  "direct-http2" | "direct-fetch" | "proxy-service" | "rapidapi" | "html-og" | "cache";

export interface InstagramProfileData {
  status: "success" | "error";

  error?: string;
  errorCode?: InstagramErrorCode;

  username: string;
  fullName: string;

  profilePicUrl: string;
  profilePicUrlOriginal?: string | undefined;
  biography: string;

  followerCount: string | number;
  followingCount: string | number;
  mediaCount: string | number;
  isPrivate: boolean;
  isVerified: boolean;

  mediaThumbnails: string[];
  category?: string | undefined;
  externalUrl?: string | undefined;
  userId?: string | undefined;
  source?: InstagramSource;

  fetchedAt?: number;
}

export function isInstagramError(
  result: InstagramProfileData | null | undefined,
): result is InstagramProfileData & { error: string; errorCode: InstagramErrorCode } {
  return !!result && result.status === "error";
}

export function instagramError(
  username: string,
  errorCode: InstagramErrorCode,
  error: string,
): InstagramProfileData {
  return {
    status: "error",
    error,
    errorCode,
    username,
    fullName: "",
    profilePicUrl: "",
    profilePicUrlOriginal: "",
    biography: "",
    followerCount: 0,
    followingCount: 0,
    mediaCount: 0,
    isPrivate: false,
    isVerified: false,
    mediaThumbnails: [],
  };
}

export function normalizeUsername(input: string | null | undefined): string {
  if (!input) return "";
  let value = String(input).trim();

  if (value.includes("instagram.com")) {
    try {
      const url = new URL(value.startsWith("http") ? value : `https://${value}`);
      value = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {

    }
  }

  return value.replace(/^@/, "").split("?")[0]!.split("/")[0]!.trim().toLowerCase();
}

const USERNAME_PATTERN = /^[a-z0-9._]{1,30}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}
