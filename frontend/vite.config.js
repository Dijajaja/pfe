import { exec } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Ouvre le front dans Microsoft Edge (pas l’aperçu intégré de l’éditeur). Désactiver : `set VITE_NO_OPEN=1` puis `npm run dev`. */
function openEdgeOnDev() {
  return {
    name: "open-edge-on-dev",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        if (process.env.VITE_NO_OPEN === "1") return;
        const addr = server.httpServer?.address();
        const port = typeof addr === "object" && addr && "port" in addr ? addr.port : 5173;
        const host = server.config.server.host === true ? "127.0.0.1" : server.config.server.host || "127.0.0.1";
        const url = `http://${host === "::" ? "127.0.0.1" : host}:${port}/`;
        if (process.platform === "win32") {
          exec(`start msedge "${url}"`, { shell: true, windowsHide: true });
        } else if (process.platform === "darwin") {
          exec(`open -a "Microsoft Edge" "${url}"`);
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), openEdgeOnDev()],
  base: process.env.NODE_ENV === "production" ? "/pfe/" : "/",
});
