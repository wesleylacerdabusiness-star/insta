import { decodeHtmlEntities, parseCompactNumber } from "./format";
import type { InstagramProfileData } from "./types";

export interface NormalizedProfile {
  username: string;
  fullName: string;
  biography: string;
  profilePicUrl: string;
  followerCount: number;
  followingCount: number;
  mediaCount: number;
  isPrivate: boolean;
  isVerified: boolean;
  mediaThumbnails: string[];
  category?: string | undefined;
  externalUrl?: string | undefined;
  userId?: string | undefined;
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function pick(source: Json, keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function pickString(source: Json, keys: string[]): string {
  const value = pick(source, keys);
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}

function pickBoolean(source: Json, keys: string[]): boolean {
  const value = pick(source, keys);
  return value === true || value === "true";
}

function pickCount(source: Json, edgeKeys: string[], flatKeys: string[]): number {
  for (const key of edgeKeys) {
    const edge = source[key];
    if (isObject(edge) && edge["count"] !== undefined)
      return parseCompactNumber(edge["count"] as number);
  }
  const flat = pick(source, flatKeys);
  if (flat !== undefined) return parseCompactNumber(flat as string | number);
  return 0;
}

function extractThumbnails(user: Json): string[] {
  const thumbnails: string[] = [];

  const timeline = user["edge_owner_to_timeline_media"];
  if (isObject(timeline) && Array.isArray(timeline["edges"])) {
    for (const edge of timeline["edges"]) {
      if (!isObject(edge) || !isObject(edge["node"])) continue;
      const node = edge["node"];
      const src = pickString(node, ["thumbnail_src", "display_url"]);
      if (src) thumbnails.push(src);
    }
  }


  for (const key of ["items", "medias", "posts", "recent_posts"]) {
    const list = user[key];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (!isObject(item)) continue;
      const src =
        pickString(item, [
          "thumbnail_url",
          "thumbnail_src",
          "display_url",
          "image_url",
          "media_url",
        ]) ||
        (isObject(item["image_versions2"]) && Array.isArray(item["image_versions2"]["candidates"])
          ? pickString((item["image_versions2"]["candidates"][0] ?? {}) as Json, ["url"])
          : "");
      if (src) thumbnails.push(src);
    }
  }

  return [...new Set(thumbnails)].slice(0, 12);
}

export function unwrapUserPayload(payload: unknown): Json | null {
  if (!isObject(payload)) return null;

  const candidates: unknown[] = [
    isObject(payload["data"]) ? (payload["data"] as Json)["user"] : undefined,
    payload["user"],
    isObject(payload["data"]) ? (payload["data"] as Json)["user_data"] : undefined,
    isObject(payload["result"]) ? (payload["result"] as Json)["user"] : undefined,
    payload["data"],
    payload["result"],
    payload["graphql"] && isObject(payload["graphql"])
      ? (payload["graphql"] as Json)["user"]
      : undefined,
    payload,
  ];

  for (const candidate of candidates) {
    if (!isObject(candidate)) continue;
    const looksLikeUser =
      "username" in candidate ||
      "edge_followed_by" in candidate ||
      "follower_count" in candidate ||
      "profile_pic_url" in candidate;
    if (looksLikeUser) return candidate;
  }

  return null;
}

export function normalizeUserPayload(
  payload: unknown,
  fallbackUsername: string,
): NormalizedProfile | null {
  const user = unwrapUserPayload(payload);
  if (!user) return null;
  const username = (
    pickString(user, ["username", "user_name", "handle"]) || fallbackUsername
  ).toLowerCase();

  const hdPicInfo = user["hd_profile_pic_url_info"];
  const profilePicUrl =
    pickString(user, ["profile_pic_url_hd", "profile_pic_url_h_d", "hd_profile_pic_url"]) ||
    (isObject(hdPicInfo) ? pickString(hdPicInfo, ["url"]) : "") ||
    pickString(user, ["profile_pic_url", "profile_picture_url", "profile_image", "avatar"]);

  const followerCount = pickCount(
    user,
    ["edge_followed_by", "edge_mutual_followed_by"],
    ["follower_count", "followers", "followers_count", "edge_followed_by_count"],
  );
  const followingCount = pickCount(
    user,
    ["edge_follow"],
    ["following_count", "followings", "follows_count", "following"],
  );
  const mediaCount = pickCount(
    user,
    ["edge_owner_to_timeline_media", "edge_felix_video_timeline"],
    ["media_count", "posts_count", "post_count", "total_posts"],
  );

  return {
    username,
    fullName: pickString(user, ["full_name", "fullName", "name"]),
    biography: pickString(user, ["biography", "bio", "biography_with_entities"]),
    profilePicUrl,
    followerCount,
    followingCount,
    mediaCount,
    isPrivate: pickBoolean(user, ["is_private", "isPrivate", "private"]),
    isVerified: pickBoolean(user, ["is_verified", "isVerified", "verified"]),
    mediaThumbnails: extractThumbnails(user),
    category:
      pickString(user, ["category_name", "category", "business_category_name"]) || undefined,
    externalUrl: pickString(user, ["external_url", "website", "bio_url"]) || undefined,
    userId: pickString(user, ["id", "pk", "user_id"]) || undefined,
  };
}

export function payloadSaysNotFound(payload: unknown): boolean {
  if (!isObject(payload)) return false;
  if (isObject(payload["data"]) && "user" in payload["data"] && payload["data"]["user"] === null)
    return true;
  const message = typeof payload["message"] === "string" ? payload["message"].toLowerCase() : "";
  return message.includes("not found") || message.includes("user not found");
}
const NOT_FOUND_HTML_MARKERS = [
  "Sorry, this page isn't available",
  "Esta página não está disponível",
  "Page Not Found",
  "The link you followed may be broken",
];

export function htmlSaysNotFound(html: string): boolean {
  return NOT_FOUND_HTML_MARKERS.some((marker) => html.includes(marker));
}

export function parseInstagramHtml(html: string, username: string): Partial<InstagramProfileData> {
  const cleanUser = username.trim().replace(/^@/, "").toLowerCase();
  let followerCount: string | number = "";
  let followingCount: string | number = "";
  let mediaCount: string | number = "";
  let fullName = "";
  let biography = "";
  let isVerified = false;
  let isPrivate = false;

  const relayFollower = html.match(/"follower_count":\s*(\d+)/);
  if (relayFollower?.[1]) followerCount = Number(relayFollower[1]);
  const relayFollowing = html.match(/"following_count":\s*(\d+)/);
  if (relayFollowing?.[1]) followingCount = Number(relayFollowing[1]);

  const relayMedia =
    html.match(
      /"(?:edge_owner_to_timeline_media|edge_felix_video_timeline)":\s*\{\s*"count":\s*(\d+)/,
    ) || html.match(/"media_count":\s*(\d+)/);
  if (relayMedia?.[1]) mediaCount = Number(relayMedia[1]);

  const relayFullName = html.match(/"full_name":\s*"((?:\\"|[^"])*)"/);
  if (relayFullName?.[1]) {
    try {
      fullName = JSON.parse(`"${relayFullName[1]}"`) as string;
    } catch {
      fullName = relayFullName[1];
    }
  }

  const relayBio = html.match(/"biography":\s*"((?:\\"|[^"])*)"/);
  if (relayBio?.[1]) {
    try {
      biography = JSON.parse(`"${relayBio[1]}"`) as string;
    } catch {
      biography = relayBio[1];
    }
  }

  if (html.match(/"is_verified":\s*true/)) isVerified = true;
  if (html.match(/"is_private":\s*true/)) isPrivate = true;

  let profilePicUrl =
    html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)?.[1] ||
    "";
  if (profilePicUrl) profilePicUrl = decodeHtmlEntities(profilePicUrl);

  const relayPic = html.match(/"profile_pic_url(?:_hd)?":\s*"([^"]+)"/);
  if (relayPic?.[1]) {
    const cleanRelayPic = relayPic[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
    if (cleanRelayPic && !cleanRelayPic.includes("static.cdninstagram.com")) {
      profilePicUrl = cleanRelayPic;
    }
  }

  let ogTitle =
    html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1] ||
    "";
  if (ogTitle) ogTitle = decodeHtmlEntities(ogTitle);
  if (!fullName && ogTitle) {
    fullName = ogTitle.match(/^(.+?)\s*\(@/)?.[1]?.trim() ?? "";
  }

  let description =
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i)?.[1] ||
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
    "";
  if (description) description = decodeHtmlEntities(description);

  if (description) {
    if (!followerCount) {
      const match = description.match(/([\d.,]+(?:\s*[KkMm]|mil|mi)?)\s*(?:seguidores|followers)/i);
      if (match?.[1]) followerCount = parseCompactNumber(match[1]) || "";
    }
    if (!followingCount) {
      const match =
        description.match(/([\d.,]+(?:\s*[KkMm]|mil|mi)?)\s*(?:following|seguindo|seguidos)/i) ||
        description.match(/(?:seguindo|following)\s*([\d.,]+(?:\s*[KkMm]|mil|mi)?)/i);
      if (match?.[1]) followingCount = parseCompactNumber(match[1]) || "";
    }
    if (!mediaCount) {
      const match = description.match(
        /([\d.,]+(?:\s*[KkMm]|mil|mi)?)\s*(?:posts|publicações|publicacoes)/i,
      );
      if (match?.[1]) mediaCount = parseCompactNumber(match[1]) || "";
    }
    if (!biography) {
      biography = description.match(/n[oa] Instagram:\s*"(.*)"$/i)?.[1] ?? "";
    }
  }

  const mediaThumbnails: string[] = [];
  const imgRegex =
    /(https:\/\/[^"'\s]+\.cdninstagram\.com\/[^"'\s]+|https:\/\/[^"'\s]+\.fbcdn\.net\/[^"'\s]+)/g;
  const seen = new Set<string>([profilePicUrl]);
  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(html)) !== null) {
    const matchStr = match[1];
    if (!matchStr) continue;
    const raw = decodeHtmlEntities(matchStr)
      .replace(/\\u0026/g, "&")
      .replace(/\\\//g, "/");
    if (
      !seen.has(raw) &&
      !raw.includes("s150x150") &&
      !raw.includes("static.cdninstagram.com") &&
      !raw.includes("rsrc.php") &&
      (raw.includes(".jpg") || raw.includes(".webp") || raw.includes("dst-jpg"))
    ) {
      seen.add(raw);
      mediaThumbnails.push(raw);
    }
  }

  return {
    username: cleanUser,
    fullName,
    profilePicUrl,
    biography,
    followerCount,
    followingCount,
    mediaCount,
    isPrivate,
    isVerified,
    mediaThumbnails: mediaThumbnails.slice(0, 12),
  };
}
