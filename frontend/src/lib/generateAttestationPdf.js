import { jsPDF } from "jspdf";

import appIcon from "../assets/app-icon.png";
import { abbreviateEtablissement, formatEmissionDate } from "./attestationFormat";

// ── Couleurs design ───────────────────────────────────────────────────────────
const C = {
  darkGreen:  "#1B4D3E",
  teal:       "#2E7D6B",
  bgGrey:     "#F4F7F6",
  border:     "#D1DDD9",
  textDark:   "#1A2E28",
  textMid:    "#5A7A70",
  lightGreen: "#90C4B8",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function setFill(doc, hex) {
  const { r, g, b } = hexToRgb(hex);
  doc.setFillColor(r, g, b);
}

function setText(doc, hex) {
  const { r, g, b } = hexToRgb(hex);
  doc.setTextColor(r, g, b);
}

function setDraw(doc, hex) {
  const { r, g, b } = hexToRgb(hex);
  doc.setDrawColor(r, g, b);
}

function pdfSafeText(value) {
  if (value == null || value === "") return "—";
  return String(value)
    .normalize("NFC")
    .replace(/[\u00a0\u202f\u2007\u2060]/g, " ");
}

function formatMruAmount(amount) {
  const n = Math.max(0, Math.round(Number(amount) || 0));
  // Séparateur de milliers sans espace insécable (jsPDF ne le supporte pas)
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " MRU";
}

function loadImageDataUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 48;
      canvas.height = img.naturalHeight || 48;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas indisponible")); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Image introuvable"));
    img.src = src;
  });
}

async function loadImageSafely(src) {
  try { return await loadImageDataUrl(src); }
  catch { return null; }
}

// ── Composants PDF ────────────────────────────────────────────────────────────

/** Cellule de la grille étudiant */
function drawCell(doc, x, y, w, h, label, value) {
  setText(doc, C.textMid);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(label.toUpperCase(), x + 6, y + 7);

  setText(doc, C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(pdfSafeText(value), w - 10);
  doc.text(lines, x + 6, y + 13);
}

/** Petit rectangle gris clair (date / référence) */
function drawMetaBox(doc, x, y, w, h, label, value) {
  setFill(doc, C.bgGrey);
  setDraw(doc, C.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");

  setText(doc, C.textMid);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(label.toUpperCase(), x + 5, y + 6);

  setText(doc, C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(pdfSafeText(value), x + 5, y + 13);
}

// ── Export principal ──────────────────────────────────────────────────────────
export async function generateAttestationPdf(data) {
  const logoData = await loadImageSafely(appIcon);

  const doc   = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = 0;

  // Fond blanc
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");

  // ── 1. EN-TÊTE ────────────────────────────────────────────────────────────
  const headerH = 22;
  setFill(doc, C.darkGreen);
  doc.rect(0, 0, pageW, headerH, "F");

  if (logoData) {
    doc.addImage(logoData, "PNG", margin, 3, 16, 16);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SEHILY", margin + 20, 11);

  setText(doc, C.lightGreen);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Bourses universitaires, simplifiées", margin + 20, 18);

  y = headerH + 10;

  // ── 2. TITRE ──────────────────────────────────────────────────────────────
  setText(doc, C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ATTESTATION DE BOURSE", pageW / 2, y, { align: "center" });
  y += 5;

  // Ligne fine sous le titre
  setDraw(doc, C.teal);
  doc.setLineWidth(0.5);
  doc.line(margin + 15, y, pageW - margin - 15, y);
  y += 5;

  // Sous-titre CNOU
  setText(doc, C.textMid);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Centre National des Œuvres Universitaires — CNOU", pageW / 2, y, { align: "center" });
  y += 8;

  // Texte d'introduction
  doc.setFontSize(9.5);
  setText(doc, "#444444");
  doc.text(
    "Nous attestons que l'étudiant(e) ci-dessous bénéficie d'une bourse universitaire",
    pageW / 2, y, { align: "center" },
  );
  y += 5;
  doc.text(
    "pour l'année académique indiquée.",
    pageW / 2, y, { align: "center" },
  );
  y += 12;

  // ── 3. BLOC INFORMATIONS ÉTUDIANT ─────────────────────────────────────────
  const rowCount = 3;
  const gridH   = 21 * rowCount; // 21 mm par ligne
  const rowH    = gridH / rowCount;
  const colW    = (contentW - 1) / 2; // -1 pour le séparateur vertical

  setFill(doc, C.bgGrey);
  setDraw(doc, C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, gridH, 3, 3, "FD");

  // Séparateurs horizontaux
  doc.setLineWidth(0.22);
  setDraw(doc, C.border);
  for (let i = 1; i < rowCount; i++) {
    doc.line(margin + 5, y + rowH * i, margin + contentW - 5, y + rowH * i);
  }

  // Séparateur vertical central
  doc.line(margin + colW, y + 4, margin + colW, y + gridH - 4);

  const etabAbbr = abbreviateEtablissement(data.etablissement);
  const col1x = margin;
  const col2x = margin + colW + 1;

  drawCell(doc, col1x,  y,             colW, rowH, "Nom complet",         data.nomComplet);
  drawCell(doc, col2x,  y,             colW, rowH, "Établissement",        etabAbbr);
  drawCell(doc, col1x,  y + rowH,      colW, rowH, "Numéro NNI",          data.nni);
  drawCell(doc, col2x,  y + rowH,      colW, rowH, "Niveau académique",    data.niveau);
  drawCell(doc, col1x,  y + rowH * 2,  colW, rowH, "Filière",             data.filiere);
  drawCell(doc, col2x,  y + rowH * 2,  colW, rowH, "Année universitaire", data.anneeUniversitaire);

  y += gridH + 8;

  // ── 4. MONTANT DE LA BOURSE ───────────────────────────────────────────────
  const amountH = 24;
  setFill(doc, C.darkGreen);
  doc.roundedRect(margin, y, contentW, amountH, 3, 3, "F");

  setText(doc, C.lightGreen);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("MONTANT MENSUEL DE LA BOURSE", margin + 8, y + 9);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(formatMruAmount(data.montantBourse), margin + 8, y + 19);

  y += amountH + 8;

  // ── 5. DATE & RÉFÉRENCE ───────────────────────────────────────────────────
  const metaH = 19;
  const metaW = (contentW - 5) / 2;
  const emissionDate = pdfSafeText(formatEmissionDate(data.dateEmission));
  const ref = pdfSafeText(data.reference || `ATT-${Date.now()}`);

  drawMetaBox(doc, margin,             y, metaW, metaH, "Date d'émission", emissionDate);
  drawMetaBox(doc, margin + metaW + 5, y, metaW, metaH, "Référence",       ref);

  y += metaH + 14;

  // ── 6. PIED DE PAGE ───────────────────────────────────────────────────────
  setDraw(doc, C.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  setText(doc, C.textMid);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Centre National des Œuvres Universitaires — Nouakchott, République Islamique de Mauritanie",
    pageW / 2, y, { align: "center" },
  );
  y += 5;
  doc.text(
    "Document généré électroniquement par la plateforme Sehily.",
    pageW / 2, y, { align: "center" },
  );

  const filename = `attestation-bourse-${ref.replace(/[^a-zA-Z0-9-]/g, "")}.pdf`;
  doc.save(filename);
}
