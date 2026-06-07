import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import appIcon from "../assets/app-icon.png";
import { SEHILY_COLORS } from "./attestationConstants";

const COLUMNS = [
  "Nom complet",
  "NNI",
  "Établissement",
  "Filière",
  "Niveau",
  "Montant (MRU)",
  "Statut Mauripost",
];

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

function pdfSafeText(value) {
  if (value == null || value === "") return "—";
  return String(value).replace(/[\u00a0\u202f\u2007\u2060]/g, " ");
}

function formatAmount(value) {
  return String(Math.round(Number(value) || 0));
}

/**
 * @param {Array<object>} rows
 * @param {{ etablissement?: string }} [options]
 */
export async function exportBoursiersPdf(rows, options = {}) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(27, 77, 74);
  doc.rect(0, 0, pageW, 24, "F");

  try {
    const logoData = await loadImageDataUrl(appIcon);
    doc.addImage(logoData, "PNG", margin, 4, 16, 16);
  } catch {
    // ignore
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SEHILY", margin + 20, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Liste des boursiers — CNOU", margin + 20, 18);

  const filterLabel =
    options.etablissement && options.etablissement !== "ALL"
      ? `Établissement : ${options.etablissement}`
      : "Tous les établissements";
  const anneeLabel = options.anneeUniversitaire ? `Année : ${options.anneeUniversitaire}` : "";
  const generatedAt = new Date().toLocaleString("fr-FR");

  doc.setTextColor(27, 77, 74);
  doc.setFontSize(10);
  doc.text(filterLabel, margin, 32);
  if (anneeLabel) doc.text(anneeLabel, margin, 38);
  doc.text(`Généré le ${pdfSafeText(generatedAt)}`, margin, anneeLabel ? 44 : 38);

  const body = rows.map((row) => [
    pdfSafeText(row.nom_complet),
    pdfSafeText(row.nni),
    pdfSafeText(row.etablissement),
    pdfSafeText(row.filiere),
    pdfSafeText(row.niveau),
    formatAmount(row.montant_bourse),
    pdfSafeText(row.statut_paiement_label || row.statut_paiement || "Non envoyé"),
  ]);

  autoTable(doc, {
    startY: anneeLabel ? 48 : 42,
    head: [COLUMNS],
    body,
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [27, 77, 74],
    },
    headStyles: {
      fillColor: [46, 125, 114],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [250, 247, 242],
    },
    margin: { left: margin, right: margin },
  });

  const suffix =
    options.etablissement && options.etablissement !== "ALL"
      ? `-${String(options.etablissement).replace(/[^a-zA-Z0-9]/g, "")}`
      : "";
  doc.save(`sehily-boursiers${suffix}-${Date.now()}.pdf`);
}
