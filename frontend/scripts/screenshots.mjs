/**
 * Génère des captures PNG de toutes les routes principales du front.
 *
 * Prérequis (une fois) dans frontend/ :
 *   npm install
 *   npx playwright install chromium
 *
 * Lancement du serveur Vite dans un autre terminal :
 *   npm run dev
 *
 * Puis :
 *   npm run screenshots
 *   ou SCREENSHOT_BASE_URL=http://127.0.0.1:5174 npm run screenshots
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error(
    "Playwright manquant. Dans frontend/ exécute : npm install && npx playwright install chromium",
  );
  process.exit(1);
}

const BASE_URL = (process.env.SCREENSHOT_BASE_URL || "http://localhost:5173").replace(/\/$/, "");

/** Routes publiques (toujours visibles sans JWT). */
const PUBLIC_PAGES = [
  ["/", "01-accueil"],
  ["/eligibilite", "02-eligibilite"],
  ["/auth/login", "03-auth-login"],
  ["/auth/register", "04-auth-register"],
  ["/auth/reset", "05-auth-reset"],
  ["/403", "06-forbidden"],
];

/**
 * Zones protégées : sans token tu obtiens souvent la redirection login —
 * la capture documente quand même l’URL demandée (utile pour le rapport).
 */
const APP_PAGES = [
  ["/app", "app-landing-role"],
  ["/app/demarches", "app-demarches"],
  ["/app/guide-pfe", "app-guide-pfe"],
  ["/app/notifications-center", "app-notifications-center"],
  ["/app/messages-center", "app-messages-center"],
  ["/app/student/dashboard", "etu-dashboard"],
  ["/app/student/dossier", "etu-dossier"],
  ["/app/student/suivi", "etu-suivi"],
  ["/app/student/reclamations", "etu-reclamations"],
  ["/app/student/paiements", "etu-paiements"],
  ["/app/student/notifications", "etu-notifications"],
  ["/app/admin/dashboard", "admin-dashboard"],
  ["/app/admin/dossiers", "admin-dossiers"],
  ["/app/admin/users", "admin-users"],
  ["/app/admin/exports", "admin-exports"],
  ["/app/admin/reclamations", "admin-reclamations"],
  ["/app/partner/dashboard", "partner-dashboard"],
  ["/app/partner/to-process", "partner-to-process"],
  ["/app/partner/completed", "partner-completed"],
  ["/app/partner/history", "partner-history"],
  ["/app/partner/reports", "partner-reports"],
  ["/app/partner/notifications", "partner-notifications"],
  ["/app/partner/settings", "partner-settings"],
];

const REDIRECTS = [
  ["/admin", "redirect-admin-root"],
  ["/mauriposte", "redirect-mauriposte-root"],
];

async function main() {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const outDir = path.join(__dirname, "..", "screenshots-export", stamp);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "fr-FR",
  });
  const page = await context.newPage();

  async function shot(relUrl, fileSlug) {
    const url = `${BASE_URL}${relUrl}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
      await new Promise((r) => setTimeout(r, 800));
      const fp = path.join(outDir, `${fileSlug}.png`);
      await page.screenshot({ path: fp, fullPage: true });
      console.log("OK", url, "→", fp);
    } catch (e) {
      console.error("FAIL", url, e.message);
    }
  }

  console.log(`Export dans : ${outDir}`);
  console.log(`Base URL    : ${BASE_URL}\n`);

  for (const [rel, slug] of PUBLIC_PAGES) await shot(rel, slug);
  for (const [rel, slug] of REDIRECTS) await shot(rel, slug);
  for (const [rel, slug] of APP_PAGES) await shot(rel, slug);

  await browser.close();
  console.log("\nTerminé. Pour les pages étudiant/admin/partner complètes, reconnecte-toi puis relance ou utilise StorageState Playwright.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
