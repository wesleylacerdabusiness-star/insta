export interface RawHttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}
const dynamicImport = (specifier: string): Promise<unknown> => import(specifier);
type Http2Module = typeof import("node:http2");
type ZlibModule = typeof import("node:zlib");
let modulesPromise: Promise<{ http2: Http2Module; zlib: ZlibModule } | null> | undefined;
async function loadNodeModules() {
  if (!modulesPromise) {
    modulesPromise = (async () => {
      const isNode =
        typeof process !== "undefined" &&
        !!process.versions?.node &&

        typeof (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime === "undefined";
      if (!isNode) return null;

      try {
        const [http2, zlib] = await Promise.all([
          dynamicImport("node:http2") as Promise<Http2Module>,
          dynamicImport("node:zlib") as Promise<ZlibModule>,
        ]);
        return { http2, zlib };
      } catch {
        return null;
      }
    })();
  }
  return modulesPromise;
}

export async function isHttp2Available(): Promise<boolean> {
  return (await loadNodeModules()) !== null;
}

function decodeBody(zlib: ZlibModule, buffer: Buffer, encoding: string | undefined): string {
  try {
    if (encoding === "gzip") return zlib.gunzipSync(buffer).toString("utf8");
    if (encoding === "br") return zlib.brotliDecompressSync(buffer).toString("utf8");
    if (encoding === "deflate") return zlib.inflateSync(buffer).toString("utf8");
  } catch {

  }
  return buffer.toString("utf8");
}

export interface Http2RequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;

  maxBytes?: number;
}

export async function http2Get(
  url: string,
  { headers = {}, timeoutMs = 12_000, maxBytes = 8 * 1024 * 1024 }: Http2RequestOptions = {},
): Promise<RawHttpResponse | null> {
  const modules = await loadNodeModules();
  if (!modules) return null;

  const { http2, zlib } = modules;
  const target = new URL(url);
  const origin = `${target.protocol}//${target.host}`;
  const path = `${target.pathname}${target.search}`;
  return new Promise<RawHttpResponse>((resolve, reject) => {
    const session = http2.connect(origin, { settings: { enablePush: false } });
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        session.close();
      } catch {

      }
      fn();
    };

    const timer = setTimeout(
      () => finish(() => reject(new Error(`HTTP/2 timeout após ${timeoutMs}ms: ${origin}`))),
      timeoutMs,
    );

    session.on("error", (err) => finish(() => reject(err)));

    const request = session.request({
      ":method": "GET",
      ":path": path,
      ":scheme": "https",
      ":authority": target.host,
      ...headers,
    });
    const chunks: Buffer[] = [];
    let received = 0;
    let status = 0;
    let responseHeaders: Record<string, string> = {};

    request.on("response", (incoming) => {
      status = Number(incoming[":status"] ?? 0);
      responseHeaders = Object.fromEntries(
        Object.entries(incoming)
          .filter(([key]) => !key.startsWith(":"))
          .map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(", ") : String(value ?? ""),
          ]),
      );
    });

    request.on("data", (chunk: Buffer) => {
      received += chunk.length;
      if (received > maxBytes) {
        request.close();
        return;
      }
      chunks.push(chunk);
    });

    request.on("error", (err) => finish(() => reject(err)));

    request.on("end", () =>
      finish(() =>
        resolve({
          status,
          headers: responseHeaders,
          body: decodeBody(zlib, Buffer.concat(chunks), responseHeaders["content-encoding"]),
        }),
      ),
    );

    request.end();
  });
}
