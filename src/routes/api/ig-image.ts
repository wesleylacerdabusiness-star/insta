import { createFileRoute } from "@tanstack/react-router";

import { verifyProxiedImageUrl } from "@/lib/instagram/image-proxy";

const ONE_DAY_SECONDS = 86_400;
export const Route = createFileRoute("/api/ig-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const target = url.searchParams.get("u");
        const signature = url.searchParams.get("s");

        if (!(await verifyProxiedImageUrl(target, signature))) {
          return new Response("Invalid image signature", { status: 403 });
        }

        try {
          const upstream = await fetch(target!, {
            headers: {
              "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
              accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
              referer: "https://www.instagram.com/",
            },
            signal: AbortSignal.timeout(10_000),
          });

          if (!upstream.ok || !upstream.body) {

            return new Response("Image unavailable", { status: 404 });
          }

          return new Response(upstream.body, {
            status: 200,
            headers: {
              "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
              "cache-control": `public, max-age=${ONE_DAY_SECONDS}, s-maxage=${ONE_DAY_SECONDS}, immutable`,
              "cross-origin-resource-policy": "cross-origin",
            },
          });
        } catch {
          return new Response("Image fetch failed", { status: 504 });
        }
      },
    },
  },
});
