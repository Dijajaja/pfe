import { jsPDF } from "jspdf";

import appIcon from "../assets/app-icon.png";
import { SEHILY_COLORS } from "./attestationConstants";

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

/** jsPDF ne gère pas les espaces insécables (U+202F) — ils s'affichent en « & ». */
function pdfSafeText(value) {
  if (value == null || value === "") return "—";
  return String(value)
    .normalize("NFC")
    .replace(/[\u00a0\u202f\u2007\u2060]/g, " ");
}

/** Montant lisible dans le PDF, sans séparateur de milliers. */
function formatMruAmount(amount) {
  const n = Math.max(0, Math.round(Number(amount) || 0));
  return `${n} MRU`;
}

function loadImageDataUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 48;
      canvas.height = img.naturalHeight || 48;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas indisponible"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Logo Sehily introuvable"));
    img.src = src;
  });
}

/** Dessine un cachet CNOU simulé (cercles + texte, sans image). */
function drawCnouSeal(doc, cx, cy, radius) {
  setDraw(doc, SEHILY_COLORS.petrol);
  doc.setLineWidth(1.2);
  doc.circle(cx, cy, radius, "S");

  setDraw(doc, SEHILY_COLORS.green);
  doc.setLineWidth(0.6);
  doc.circle(cx, cy, radius * 0.72, "S");

  setFill(doc, SEHILY_COLORS.lightGreen);
  doc.circle(cx, cy, radius * 0.45, "F");

  setText(doc, SEHILY_COLORS.petrol);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CNOU", cx, cy + 1.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.text("VALIDÉ", cx, cy + 5.5, { align: "center" });
}

/**
 * @param {object} data
 * @param {string} data.nomComplet
 * @param {string} data.nni
 * @param {string} data.etablissement
 * @param {string} data.filiere
 * @param {string} data.niveau
 * @param {string} data.anneeUniversitaire
 * @param {string|number} data.montantBourse
 * @param {string} data.reference
 */
export async function generateAttestationPdf(data) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;

  setFill(doc, SEHILY_COLORS.cream);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F");

  setFill(doc, SEHILY_COLORS.petrol);
  doc.rect(0, 0, pageW, 28, "F");

  try {
    const logoData = await loadImageDataUrl(appIcon);
    doc.addImage(logoData, "PNG", margin, 6, 16, 16);
  } catch {
    // Pas de fallback texte : le logo officiel doit être présent dans assets/app-icon.png
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("SEHILY", margin + 20, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Bourses universitaires, simplifiées", margin + 20, 21);

  y = 40;
  setText(doc, SEHILY_COLORS.petrol);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ATTESTATION DE BOURSE", pageW / 2, y, { align: "center" });

  y += 8;
  setDraw(doc, SEHILY_COLORS.green);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);

  y += 12;
  doc.setFontSize(11);
  const fields = [
    ["Nom complet", pdfSafeText(data.nomComplet)],
    ["Numéro NNI", pdfSafeText(data.nni)],
    ["Établissement", pdfSafeText(data.etablissement)],
    ["Filière", pdfSafeText(data.filiere)],
    ["Niveau académique", pdfSafeText(data.niveau)],
    ["Année universitaire", pdfSafeText(data.anneeUniversitaire)],
    ["Montant mensuel de la bourse", formatMruAmount(data.montantBourse)],
  ];

  fields.forEach(([label, value]) => {
    setText(doc, SEHILY_COLORS.green);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, margin, y);
    setText(doc, SEHILY_COLORS.petrol);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(value, margin, y + 5);
    y += 14;
  });

  const emissionDate = pdfSafeText(
    new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  );
  setText(doc, SEHILY_COLORS.petrol);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Date d'émission", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(emissionDate, margin, y + 5);
  y += 16;

  const ref = pdfSafeText(data.reference || `ATT-${Date.now()}`);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Référence", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(ref, margin, y + 5);

  drawCnouSeal(doc, pageW - margin - 22, y - 8, 18);

  y += 22;
  setDraw(doc, SEHILY_COLORS.coral);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);

  y += 8;
  setText(doc, "#5c6570");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const footer =
    "Centre National des Œuvres Universitaires (CNOU) — Nouakchott, République Islamique de Mauritanie. " +
    "Document généré électroniquement par la plateforme Sehily. Toute falsification est passible de sanctions.";
  const footerLines = doc.splitTextToSize(footer, pageW - margin * 2);
  doc.text(footerLines, margin, y);

  const filename = `attestation-bourse-${ref.replace(/[^a-zA-Z0-9-]/g, "")}.pdf`;
  doc.save(filename);
}
