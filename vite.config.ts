import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import utwm from "unplugin-tailwindcss-mangle/vite";
import JavaScriptObfuscator from "javascript-obfuscator";

function buildObfuscatorPlugin() {
  return {
    name: "post-build-obfuscator",
    enforce: "post" as const,
    apply: "build" as const,
    generateBundle(options: any, bundle: any) {
      if (options.isSsr || (options.dir && options.dir.includes("ssr"))) {
        return;
      }

      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === "chunk" && fileName.endsWith(".js")) {
          const ids = (chunk.moduleIds ?? []).filter((id: string) => !id.startsWith("\0"));
          const isVendor = ids.length > 0 && ids.every((id: string) => id.includes("node_modules"));
          if (isVendor) continue;

          const isServerInfrastructure =
            fileName.startsWith("server") ||
            fileName.startsWith("ssr") ||
            ids.some((id: string) => id.includes("src/server.ts") || id.includes("nitro"));
          if (isServerInfrastructure) continue;

          try {
            const obf = JavaScriptObfuscator.obfuscate(chunk.code, {
              compact: true,
              controlFlowFlattening: false,
              deadCodeInjection: false,
              identifierNamesGenerator: "hexadecimal",
              log: false,
              renameGlobals: false,
              stringArray: true,
              stringArrayEncoding: ["base64"],
              stringArrayThreshold: 1,
              splitStrings: false,
              unicodeEscapeSequence: false,
              ignoreRequireImports: true,
            });
            chunk.code = obf.getObfuscatedCode();
          } catch (err) {
            console.warn(`[obfuscator] Aviso ao ofuscar ${fileName}:`, err);
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    utwm({
      generator: {
        classPrefix: "css-",
        customGenerate: () => {
          const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
          const len = 7;
          let s = "";
          for (let i = 0; i < len; i++) {
            s += alphabet[Math.floor(Math.random() * alphabet.length)];
          }
          return `css-${s}`;
        },
      },
    }),
    buildObfuscatorPlugin(),
  ],
  tanstackStart: {
    server: { entry: "server" },
  },
});
