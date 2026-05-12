const DEFAULT_LABELS = {
  VALIDE: "Validé",
  PAYE: "Payé",
  ENVOYE: "Envoyé",
  REJETE: "Rejeté",
  SOUMIS: "Soumis",
  EN_INSTRUCTION: "En instruction",
  BROUILLON: "Brouillon",
  COMPLEMENT_DEMANDE: "Complément demandé",
  EFFECTUE: "Payé",
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  ECHEC: "Échec",
};

const DEFAULT_CLASSES = {
  VALIDE: "sehily-badge sehily-badge--ok",
  EFFECTUE: "sehily-badge sehily-badge--ok",
  PAYE: "sehily-badge sehily-badge--ok",
  ENVOYE: "sehily-badge sehily-badge--warn",
  REJETE: "sehily-badge sehily-badge--danger",
  SOUMIS: "sehily-badge sehily-badge--warn",
  EN_INSTRUCTION: "sehily-badge sehily-badge--warn",
  BROUILLON: "sehily-badge sehily-badge--warn",
  COMPLEMENT_DEMANDE: "sehily-badge sehily-badge--warn",
  EN_ATTENTE: "sehily-badge sehily-badge--warn",
  EN_COURS: "sehily-badge sehily-badge--warn",
  ECHEC: "sehily-badge sehily-badge--danger",
};

export function StatusBadge({ status, labelMap = {}, classMap = {} }) {
  const label = labelMap[status] || DEFAULT_LABELS[status] || status || "-";
  const klass = classMap[status] || DEFAULT_CLASSES[status] || "sehily-badge sehily-badge--warn";
  return <span className={klass}>{label}</span>;
}
