import * as XLSX from "xlsx";

function formatAmount(value) {
  return Math.round(Number(value) || 0);
}

/**
 * @param {Array<object>} rows
 * @param {{ etablissement?: string }} [options]
 */
export function exportBoursiersXlsx(rows, options = {}) {
  const sheetRows = rows.map((row) => ({
    "Année universitaire": options.anneeUniversitaire || "",
    "Nom complet": row.nom_complet || "",
    NNI: row.nni || "",
    Établissement: row.etablissement || "",
    Filière: row.filiere || "",
    Niveau: row.niveau || "",
    "Montant bourse (MRU)": formatAmount(row.montant_bourse),
    "Statut paiement Mauripost": row.statut_paiement_label || row.statut_paiement || "Non envoyé",
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Boursiers");

  const suffix =
    options.etablissement && options.etablissement !== "ALL"
      ? `-${String(options.etablissement).replace(/[^a-zA-Z0-9]/g, "")}`
      : "";
  XLSX.writeFile(workbook, `sehily-boursiers${suffix}-${Date.now()}.xlsx`);
}
