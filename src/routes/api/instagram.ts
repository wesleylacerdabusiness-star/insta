import { createFileRoute } from "@tanstack/react-router";

import { getInstagramProfile } from "@/lib/instagram/server";
import { isInstagramError, normalizeUsername } from "@/lib/instagram/types";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const hits = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const entry = hits.get(clientId);

  if (!entry || entry.resetAt < now) {
    hits.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    if (hits.size > 5_000) {
      for (const [key, value] of hits) if (value.resetAt < now) hits.delete(key);
    }
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function clientIdFrom(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function json(body: unknown, status: number, cacheSeconds = 0): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheSeconds
        ? `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 4}`
        : "no-store",
    },
  });
}

export const Route = createFileRoute("/api/instagram")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const username = normalizeUsername(
          url.searchParams.get("username") ?? url.searchParams.get("u"),
        );

        if (!username) {
          return json(
            { status: "error", error: "Missing username", code: "invalid_username" },
            400,
          );
        }

        if (isRateLimited(clientIdFrom(request))) {
          return json(
            { status: "error", error: "Too many requests", code: "rate_limited", username },
            429,
          );
        }

        const profile = await getInstagramProfile(username, {
          forceRefresh: url.searchParams.get("refresh") === "1",
        });

        if (!isInstagramError(profile)) return json(profile, 200, 900);

        const statusByCode: Record<string, number> = {
          invalid_username: 400,
          not_found: 404,
          rate_limited: 429,
          blocked: 502,
          network_error: 504,
        };

        return json(
          {
            status: "error",
            error: profile.errorCode === "not_found" ? "User not found" : profile.error,
            message: profile.error,
            code: profile.errorCode,
            username: profile.username,
          },
          statusByCode[profile.errorCode] ?? 502,
        );
      },
    },
  },
});
