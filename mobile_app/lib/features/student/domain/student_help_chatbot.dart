import '../../auth/data/mauritanie_universite.dart' show getEtablissementAbbreviation;

/// Contexte personnalisé pour l'assistant étudiant.
class StudentHelpContext {
  const StudentHelpContext({
    required this.dossierStatut,
    required this.dossierStatutLabel,
    required this.statutPaiementLabel,
    required this.niveau,
    required this.wilaya,
    this.etablissement = '',
    this.filiere = '',
    required this.dossierValide,
    required this.virementConfirme,
    required this.paiementAttestation,
    required this.montantAttestation,
    required this.hasDossier,
  });

  final String? dossierStatut;
  final String dossierStatutLabel;
  final String statutPaiementLabel;
  final String niveau;
  final String wilaya;
  final String etablissement;
  final String filiere;
  final bool dossierValide;
  final bool virementConfirme;
  final bool paiementAttestation;
  final double montantAttestation;
  final bool hasDossier;
}

class StudentHelpButton {
  const StudentHelpButton({required this.id, required this.label, this.route});

  final String id;
  final String label;
  final String? route;
}

class StudentHelpStep {
  const StudentHelpStep({required this.message, required this.buttons});

  final String message;
  final List<StudentHelpButton> buttons;
}

const _statutLabels = {
  'BROUILLON': 'Brouillon',
  'SOUMIS': 'Soumis',
  'EN_INSTRUCTION': 'En instruction',
  'VALIDE': 'Validé par le CNOU',
  'REJETE': 'Rejeté',
  'COMPLEMENT_DEMANDE': 'Complément demandé',
};

const _paiementLabels = {
  'EN_ATTENTE': 'En attente',
  'EN_COURS': 'En cours',
  'ENVOYE': 'Envoyé',
  'EFFECTUE': 'Effectué (Mauripost)',
  'ECHEC': 'Échec',
};

const eligibilityRulesText =
    'Vérification d\'éligibilité (CNOU) :\n'
    '• Saisissez votre NNI et votre matricule sur « Vérifier mon éligibilité ».\n'
    '• Le système consulte le référentiel CNOU et affiche vos données en lecture seule.\n'
    '• Motifs possibles : non bénéficiaire, établissement non conventionné, niveau non ouvert, etc.\n'
    '• Si éligible, créez votre compte (e-mail, téléphone et mot de passe uniquement).';

const dossierOnceText =
    'Le dépôt de dossier ne peut se faire qu\'une seule fois par période. '
    'Une fois votre dossier soumis, vous ne pouvez plus en déposer un nouveau tant que le CNOU '
    'n\'a pas ouvert un nouvel ordre de dépôt pour une nouvelle année universitaire.';

const attestationPaymentText =
    'L\'attestation de bourse n\'est téléchargeable qu\'après paiement des frais de service de 50 MRU '
    'via Bankily, Masrvi ou Sedad. Sans ce paiement, aucune attestation ne peut être obtenue, '
    'même si votre dossier est validé par le CNOU et le virement Mauripost est effectué.';

StudentHelpContext buildStudentHelpContext({
  String? dossierStatut,
  String? statutPaiement,
  String? niveau,
  String? wilaya,
  String? etablissement,
  String? filiere,
  bool dossierValide = false,
  bool virementConfirme = false,
  bool paiementAttestation = false,
  double montantAttestation = 50,
  bool hasDossier = false,
}) {
  final statut = dossierStatut;
  return StudentHelpContext(
    dossierStatut: statut,
    dossierStatutLabel: _statutLabels[statut] ?? statut ?? '—',
    statutPaiementLabel: _paiementLabels[statutPaiement] ?? statutPaiement ?? '—',
    niveau: (niveau == null || niveau.isEmpty) ? '—' : niveau,
    wilaya: wilaya ?? '',
    etablissement: etablissement ?? '',
    filiere: filiere ?? '',
    dossierValide: dossierValide,
    virementConfirme: virementConfirme,
    paiementAttestation: paiementAttestation,
    montantAttestation: montantAttestation,
    hasDossier: hasDossier,
  );
}

String getEligibilityPersonalHint(StudentHelpContext ctx) {
  if (ctx.etablissement.isNotEmpty || ctx.filiere.isNotEmpty) {
    return 'Votre éligibilité a été confirmée via le référentiel CNOU lors de votre inscription.\n'
        'Établissement : ${ctx.etablissement.isEmpty ? "—" : ctx.etablissement}\n'
        'Formation : ${ctx.filiere.isEmpty ? "—" : ctx.filiere}\n'
        'Niveau : ${ctx.niveau}';
  }
  return 'Avant inscription, vérifiez votre éligibilité sur « Vérifier mon éligibilité » '
      'en saisissant uniquement votre NNI et votre matricule.';
}

String getDossierStatusHint(StudentHelpContext ctx) {
  if (!ctx.hasDossier) {
    return 'Vous n\'avez pas encore de dossier. Vous pouvez en créer un depuis « Mon dossier » lorsque le dépôt est ouvert.';
  }
  if (ctx.dossierStatut == 'BROUILLON') {
    return 'Vous avez un dossier en brouillon. Statut actuel : ${ctx.dossierStatutLabel}. '
        'Finalisez-le puis soumettez-le avant la clôture.';
  }
  if (ctx.dossierStatut == 'REJETE') {
    return 'Votre dernier dossier est rejeté (statut : ${ctx.dossierStatutLabel}). '
        'Un nouvel ordre de dépôt du CNOU est nécessaire pour déposer à nouveau.';
  }
  return 'Votre dossier est enregistré. Statut actuel : ${ctx.dossierStatutLabel}. '
      'Vous ne pouvez pas déposer un second dossier pour la même période.';
}

String getAttestationStatusHint(StudentHelpContext ctx) {
  final lines = <String>[
    'Statut dossier : ${ctx.dossierStatutLabel}.',
    'Virement Mauripost : ${ctx.virementConfirme ? "confirmé" : "non confirmé"} (${ctx.statutPaiementLabel}).',
    'Paiement attestation (50 MRU) : ${ctx.paiementAttestation ? "effectué" : "non effectué"}.',
  ];

  if (ctx.paiementAttestation) {
    lines.add('Vous pouvez télécharger votre attestation depuis la page Attestation.');
  } else if (ctx.dossierValide && ctx.virementConfirme) {
    lines.add(
      'Rendez-vous sur la page Attestation pour payer ${ctx.montantAttestation.toStringAsFixed(0)} MRU et télécharger le PDF.',
    );
  } else {
    lines.add('Complétez d\'abord la validation CNOU et le virement Mauripost, puis payez les 50 MRU.');
  }

  return lines.join('\n');
}

String getRootChatbotMessage(String? prenom) {
  final trimmed = (prenom ?? '').trim();
  if (trimmed.isNotEmpty) {
    return '👋 Bonjour $trimmed ! Comment puis-je t\'aider aujourd\'hui ?';
  }
  return '👋 Bonjour ! Comment puis-je t\'aider aujourd\'hui ?';
}

final Map<String, StudentHelpStep> chatbotMenus = {
  'root': StudentHelpStep(
    message: '',
    buttons: const [
      StudentHelpButton(id: 'menu-dossier', label: 'Mon dossier'),
      StudentHelpButton(id: 'menu-eligibilite', label: 'Éligibilité'),
      StudentHelpButton(id: 'menu-attestation', label: 'Paiement & Attestation'),
      StudentHelpButton(id: 'menu-autre', label: 'Autre question'),
    ],
  ),
  'menu-dossier': StudentHelpStep(
    message: 'Questions sur votre dossier de bourse :',
    buttons: const [
      StudentHelpButton(id: 'dossier-regles', label: 'Règle de dépôt unique'),
      StudentHelpButton(id: 'dossier-statut', label: 'Mon statut de dossier'),
      StudentHelpButton(id: 'back-root', label: '← Menu principal'),
    ],
  ),
  'menu-eligibilite': StudentHelpStep(
    message: 'Questions sur l\'éligibilité à la bourse :',
    buttons: const [
      StudentHelpButton(id: 'elig-regles', label: 'Règles d\'éligibilité'),
      StudentHelpButton(id: 'elig-moi', label: 'Mon éligibilité'),
      StudentHelpButton(id: 'back-root', label: '← Menu principal'),
    ],
  ),
  'menu-attestation': StudentHelpStep(
    message: 'Attestation de bourse et paiement :',
    buttons: const [
      StudentHelpButton(id: 'attestation-regles', label: 'Comment obtenir l\'attestation ?'),
      StudentHelpButton(id: 'attestation-statut', label: 'Mon statut attestation'),
      StudentHelpButton(id: 'back-root', label: '← Menu principal'),
    ],
  ),
  'menu-autre': StudentHelpStep(
    message: 'Votre question ne figure pas dans la liste ?',
    buttons: const [
      StudentHelpButton(
        id: 'autre-reclamation',
        label: 'Contacter le CNOU (Réclamations)',
        route: '/student/reclamations',
      ),
      StudentHelpButton(id: 'back-root', label: '← Menu principal'),
    ],
  ),
};

StudentHelpStep resolveChatbotStep(String stepId, StudentHelpContext ctx) {
  switch (stepId) {
    case 'dossier-regles':
      return StudentHelpStep(message: dossierOnceText, buttons: chatbotMenus['menu-dossier']!.buttons);
    case 'dossier-statut':
      return StudentHelpStep(message: getDossierStatusHint(ctx), buttons: chatbotMenus['menu-dossier']!.buttons);
    case 'elig-regles':
      return StudentHelpStep(message: eligibilityRulesText, buttons: chatbotMenus['menu-eligibilite']!.buttons);
    case 'elig-moi':
      return StudentHelpStep(
        message: '$eligibilityRulesText\n\n---\n\n${getEligibilityPersonalHint(ctx)}',
        buttons: chatbotMenus['menu-eligibilite']!.buttons,
      );
    case 'attestation-regles':
      return StudentHelpStep(message: attestationPaymentText, buttons: chatbotMenus['menu-attestation']!.buttons);
    case 'attestation-statut':
      return StudentHelpStep(message: getAttestationStatusHint(ctx), buttons: chatbotMenus['menu-attestation']!.buttons);
    case 'autre-reclamation':
      return StudentHelpStep(
        message:
            'Pour toute question non couverte ici, adressez une réclamation au CNOU. '
            'Décrivez votre situation et vous recevrez une réponse.',
        buttons: chatbotMenus['menu-autre']!.buttons,
      );
    default:
      return chatbotMenus[stepId] ?? chatbotMenus['root']!;
  }
}

/// Abréviation établissement pour affichage chatbot (réutilise la logique attestation).
String chatbotEtabAbbrev(String? value) => getEtablissementAbbreviation(value);
