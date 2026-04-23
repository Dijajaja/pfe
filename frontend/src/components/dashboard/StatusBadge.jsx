const DEFAULT_LABELS = {
  VALIDE: "Validé",
  PAYE: "Payé",
  ENVOYE: "Envoyé",
  REJETE: "Rejeté",
  SOUMIS: "Soumis",
  EN_INSTRUCTION: "En instruction",
  EFFECTUE: "Payé",
  EN_ATTENTE: "En attente",
};

const DEFAULT_CLASSES = {
  VALIDE: "sehily-badge sehily-badge--ok",
  EFFECTUE: "sehily-badge sehily-badge--ok",
  PAYE: "sehily-badge sehily-badge--ok",
  ENVOYE: "sehily-badge sehily-badge--warn",
  REJETE: "sehily-badge sehily-badge--danger",
  SOUMIS: "sehily-badge sehily-badge--warn",
  EN_INSTRUCTION: "sehily-badge sehily-badge--warn",
  EN_ATTENTE: "sehily-badge sehily-badge--warn",
};

export function StatusBadge({ status, labelMap = {}, classMap = {} }) {
  const label = labelMap[status] || DEFAULT_LABELS[status] || status || "-";
  const klass = classMap[status] || DEFAULT_CLASSES[status] || "sehily-badge sehily-badge--warn";
  return <span className={klass}>{label}</span>;
}
