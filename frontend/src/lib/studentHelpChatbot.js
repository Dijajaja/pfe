import { StatutDossier, StatutPaiement } from "./statuts";

const STATUT_LABELS = {
  BROUILLON: "Brouillon",
  SOUMIS: "Soumis",
  EN_INSTRUCTION: "En instruction",
  VALIDE: "Validé par le CNOU",
  REJETE: "Rejeté",
  COMPLEMENT_DEMANDE: "Complément demandé",
};

const PAIEMENT_LABELS = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  ENVOYE: "Envoyé",
  EFFECTUE: "Effectué (Mauripost)",
  ECHEC: "Échec",
};

export function buildStudentHelpContext({ dossier, attestation, user }) {
  const profile = user?.profil_etudiant || {};
  const statut = dossier?.statut || attestation?.statut_dossier || null;
  const statutPaiement = dossier?.statut_paiement || attestation?.statut_paiement || null;

  return {
    dossierStatut: statut,
    dossierStatutLabel: STATUT_LABELS[statut] || statut || "—",
    statutPaiement,
    statutPaiementLabel: PAIEMENT_LABELS[statutPaiement] || statutPaiement || "—",
    niveau: dossier?.niveau || attestation?.dossier?.niveau || "—",
    wilaya: profile.wilaya || "",
    etablissement: profile.etablissement || "",
    filiere: profile.filiere || "",
    dossierValide:
      attestation?.dossier_valide ?? statut === StatutDossier.VALIDE,
    virementConfirme:
      attestation?.virement_confirme ?? statutPaiement === StatutPaiement.EFFECTUE,
    paiementAttestation: Boolean(attestation?.paiement_attestation),
    montantAttestation: attestation?.montant_attestation ?? 50,
    hasDossier: Boolean(dossier?.id),
    canDeposerAgain: !dossier || statut === StatutDossier.BROUILLON || statut === StatutDossier.REJETE,
  };
}

export function getEligibilityPersonalHint(ctx) {
  if (ctx.etablissement || ctx.filiere) {
    return (
      "Votre éligibilité a été confirmée via le référentiel CNOU lors de votre inscription.\n" +
      `Établissement : ${ctx.etablissement || "—"}\n` +
      `Formation : ${ctx.filiere || "—"}\n` +
      `Niveau : ${ctx.niveau || "—"}`
    );
  }
  return (
    "Avant inscription, vérifiez votre éligibilité sur la page « Vérifier mon éligibilité » " +
    "en saisissant uniquement votre NNI et votre matricule."
  );
}

export const ELIGIBILITY_RULES_TEXT =
  "Vérification d'éligibilité (CNOU) :\n" +
  "• Saisissez votre NNI et votre matricule sur la page « Vérifier mon éligibilité ».\n" +
  "• Le système consulte le référentiel CNOU et affiche vos données académiques en lecture seule.\n" +
  "• Motifs possibles de non-éligibilité : étudiant non bénéficiaire, établissement non conventionné, niveau non ouvert, etc.\n" +
  "• Si vous êtes éligible, créez votre compte (e-mail, téléphone et mot de passe uniquement).";

export const DOSSIER_ONCE_TEXT =
  "Le dépôt de dossier ne peut se faire qu'une seule fois par période. Une fois votre dossier soumis, vous ne pouvez plus en déposer un nouveau tant que le CNOU n'a pas ouvert un nouvel ordre de dépôt pour une nouvelle année universitaire.";

export const ATTESTATION_PAYMENT_TEXT =
  "L'attestation de bourse n'est téléchargeable qu'après paiement des frais de service de 50 MRU via Bankily, Masrvi ou Sedad. Sans ce paiement, aucune attestation ne peut être obtenue, même si votre dossier est validé par le CNOU et le virement Mauripost est effectué.";

export function getDossierStatusHint(ctx) {
  if (!ctx.hasDossier) {
    return "Vous n'avez pas encore de dossier. Vous pouvez en créer un depuis la page « Mon dossier » lorsque le dépôt est ouvert.";
  }
  if (ctx.dossierStatut === StatutDossier.BROUILLON) {
    return `Vous avez un dossier en brouillon. Statut actuel : ${ctx.dossierStatutLabel}. Finalisez-le puis soumettez-le avant la clôture.`;
  }
  if (ctx.dossierStatut === StatutDossier.REJETE) {
    return `Votre dernier dossier est rejeté (statut : ${ctx.dossierStatutLabel}). Un nouvel ordre de dépôt du CNOU est nécessaire pour déposer à nouveau.`;
  }
  return `Votre dossier est enregistré. Statut actuel : ${ctx.dossierStatutLabel}. Vous ne pouvez pas déposer un second dossier pour la même période.`;
}

export function getAttestationStatusHint(ctx) {
  const lines = [
    `Statut dossier : ${ctx.dossierStatutLabel}.`,
    `Virement Mauripost : ${ctx.virementConfirme ? "confirmé" : "non confirmé"} (${ctx.statutPaiementLabel}).`,
    `Paiement attestation (50 MRU) : ${ctx.paiementAttestation ? "effectué" : "non effectué"}.`,
  ];

  if (ctx.paiementAttestation) {
    lines.push("Vous pouvez télécharger votre attestation depuis la page Attestation.");
  } else if (ctx.dossierValide && ctx.virementConfirme) {
    lines.push(`Rendez-vous sur la page Attestation pour payer ${ctx.montantAttestation} MRU et télécharger le PDF.`);
  } else {
    lines.push("Complétez d'abord la validation CNOU et le virement Mauripost, puis payez les 50 MRU.");
  }

  return lines.join("\n");
}

export function getRootChatbotMessage(user) {
  const prenom = user?.profil_etudiant?.prenom || user?.first_name || "";
  const trimmed = String(prenom).trim();
  if (trimmed) {
    return `👋 Bonjour ${trimmed} ! Comment puis-je t'aider aujourd'hui ?`;
  }
  return "👋 Bonjour ! Comment puis-je t'aider aujourd'hui ?";
}

export const ROOT_MENU_ICONS = {
  "menu-dossier": "clipboard",
  "menu-eligibilite": "check",
  "menu-attestation": "wallet",
  "menu-autre": "help",
};

export const CHATBOT_MENUS = {
  root: {
    message: "",
    buttons: [
      { id: "menu-dossier", label: "Mon dossier" },
      { id: "menu-eligibilite", label: "Éligibilité" },
      { id: "menu-attestation", label: "Paiement & Attestation" },
      { id: "menu-autre", label: "Autre question" },
    ],
  },
  "menu-dossier": {
    message: "Questions sur votre dossier de bourse :",
    buttons: [
      { id: "dossier-regles", label: "Règle de dépôt unique" },
      { id: "dossier-statut", label: "Mon statut de dossier" },
      { id: "back-root", label: "← Menu principal" },
    ],
  },
  "menu-eligibilite": {
    message: "Questions sur l'éligibilité à la bourse :",
    buttons: [
      { id: "elig-regles", label: "Règles d'éligibilité" },
      { id: "elig-moi", label: "Mon éligibilité" },
      { id: "back-root", label: "← Menu principal" },
    ],
  },
  "menu-attestation": {
    message: "Attestation de bourse et paiement :",
    buttons: [
      { id: "attestation-regles", label: "Comment obtenir l'attestation ?" },
      { id: "attestation-statut", label: "Mon statut attestation" },
      { id: "back-root", label: "← Menu principal" },
    ],
  },
  "menu-autre": {
    message: "Votre question ne figure pas dans la liste ?",
    buttons: [
      { id: "autre-reclamation", label: "Contacter le CNOU (Réclamations)", link: "/app/student/reclamations" },
      { id: "back-root", label: "← Menu principal" },
    ],
  },
};

export function resolveChatbotStep(stepId, ctx) {
  switch (stepId) {
    case "dossier-regles":
      return { message: DOSSIER_ONCE_TEXT, buttons: CHATBOT_MENUS["menu-dossier"].buttons };
    case "dossier-statut":
      return { message: getDossierStatusHint(ctx), buttons: CHATBOT_MENUS["menu-dossier"].buttons };
    case "elig-regles":
      return { message: ELIGIBILITY_RULES_TEXT, buttons: CHATBOT_MENUS["menu-eligibilite"].buttons };
    case "elig-moi":
      return {
        message: `${ELIGIBILITY_RULES_TEXT}\n\n---\n\n${getEligibilityPersonalHint(ctx)}`,
        buttons: CHATBOT_MENUS["menu-eligibilite"].buttons,
      };
    case "attestation-regles":
      return { message: ATTESTATION_PAYMENT_TEXT, buttons: CHATBOT_MENUS["menu-attestation"].buttons };
    case "attestation-statut":
      return { message: getAttestationStatusHint(ctx), buttons: CHATBOT_MENUS["menu-attestation"].buttons };
    case "autre-reclamation":
      return {
        message:
          "Pour toute question non couverte ici, adressez une réclamation au CNOU. Décrivez votre situation et vous recevrez une réponse.",
        buttons: CHATBOT_MENUS["menu-autre"].buttons,
        link: "/app/student/reclamations",
      };
    case "back-root":
      return CHATBOT_MENUS.root;
    default:
      return CHATBOT_MENUS[stepId] || CHATBOT_MENUS.root;
  }
}
