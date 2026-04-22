export const studentSummary = {
  dossierNumero: "DOS-2026-00124",
  statut: "EN_VERIFICATION",
  etapeCourante: 3,
  montantPrevu: 32000,
  annee: "2025-2026",
};

export const studentTimeline = [
  { id: 1, titre: "Brouillon créé", date: "2026-03-12", statut: "done" },
  { id: 2, titre: "Dossier soumis", date: "2026-03-15", statut: "done" },
  { id: 3, titre: "En vérification", date: "2026-03-18", statut: "current" },
  { id: 4, titre: "Validé CNOU", date: "-", statut: "todo" },
  { id: 5, titre: "Paiement", date: "-", statut: "todo" },
];

export const studentPayments = [
  {
    id: 1,
    periode: "Mars 2026",
    montant: 32000,
    statut: "EN_ATTENTE",
    reference: "PAY-2026-0009",
  },
  {
    id: 2,
    periode: "Février 2026",
    montant: 32000,
    statut: "EFFECTUE",
    reference: "PAY-2026-0006",
  },
];

export const studentNotifications = [
  {
    id: 1,
    titre: "Dossier en vérification",
    message: "Votre dossier est passé à l’étape En vérification.",
    date: "2026-03-18 10:22",
    lu: false,
  },
  {
    id: 2,
    titre: "Paiement février effectué",
    message: "Votre paiement de février est confirmé par le partenaire.",
    date: "2026-03-04 14:02",
    lu: true,
  },
];

export const adminKpis = {
  totalDossiers: 1284,
  enAttente: 231,
  valides: 845,
  rejetes: 208,
  paiementsEffectues: 740,
};

export const adminDossiers = [
  {
    id: 101,
    numero: "DOS-2026-00101",
    etudiant: "Ahmed Mohamed",
    annee: "2025-2026",
    statut: "EN_VERIFICATION",
    montant: 32000,
  },
  {
    id: 102,
    numero: "DOS-2026-00102",
    etudiant: "Meriem Sidi",
    annee: "2025-2026",
    statut: "SOUMIS",
    montant: 32000,
  },
  {
    id: 103,
    numero: "DOS-2026-00103",
    etudiant: "Cheikh Ould",
    annee: "2025-2026",
    statut: "VALIDE",
    montant: 32000,
  },
];

export const adminUsers = [
  { id: 1, email: "admin@cnou.mr", role: "ADMIN", actif: true },
  { id: 2, email: "etudiant@test.univ.edu.mr", role: "ETUDIANT", actif: true },
  { id: 3, email: "partner@baricash.mr", role: "PARTENAIRE", actif: true },
];

export const partnerBatches = [
  {
    id: "LOT-2026-03-01",
    periode: "Mars 2026",
    nbBeneficiaires: 124,
    montantTotal: 3968000,
    statut: "EN_ATTENTE_CONFIRMATION",
  },
  {
    id: "LOT-2026-02-01",
    periode: "Février 2026",
    nbBeneficiaires: 118,
    montantTotal: 3776000,
    statut: "CONFIRME",
  },
];

