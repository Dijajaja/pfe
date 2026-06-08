class AnneeUniversitaire {
  AnneeUniversitaire({required this.id, required this.libelle, this.actif = true});

  final int id;
  final String libelle;
  final bool actif;

  factory AnneeUniversitaire.fromJson(Map<String, dynamic> json) {
    return AnneeUniversitaire(
      id: json['id'] as int,
      libelle: (json['libelle'] ?? '').toString(),
      actif: json['actif'] as bool? ?? true,
    );
  }
}

class DossierDocument {
  DossierDocument({
    required this.id,
    required this.typePiece,
    this.nomFichier,
    this.fichier,
    this.dateDepot,
  });

  final int id;
  final String typePiece;
  final String? nomFichier;
  final String? fichier;
  final String? dateDepot;

  factory DossierDocument.fromJson(Map<String, dynamic> json) {
    return DossierDocument(
      id: json['id'] as int,
      typePiece: (json['type_piece'] ?? '').toString(),
      nomFichier: json['nom_fichier']?.toString(),
      fichier: json['fichier']?.toString(),
      dateDepot: json['date_depot']?.toString(),
    );
  }
}

class DossierBourse {
  DossierBourse({
    required this.id,
    required this.statut,
    this.niveau = 'L1',
    this.numeroCni = '',
    this.telephone = '',
    this.montantBourse = 0,
    this.anneeUniversitaire,
    this.etudiantEmail,
    this.commentaireAdmin,
    this.dateSoumission,
    this.creeLe,
    this.modifieLe,
    this.statutPaiement,
    this.instructeur,
    this.documents = const [],
  });

  final int id;
  final String statut;
  final String niveau;
  final String numeroCni;
  final String telephone;
  final double montantBourse;
  final int? anneeUniversitaire;
  final String? etudiantEmail;
  final String? commentaireAdmin;
  final String? dateSoumission;
  final String? creeLe;
  final String? modifieLe;
  final String? statutPaiement;
  final dynamic instructeur;
  final List<DossierDocument> documents;

  factory DossierBourse.fromJson(Map<String, dynamic> json) {
    final docs = json['documents'];
    return DossierBourse(
      id: json['id'] as int,
      statut: (json['statut'] ?? 'BROUILLON').toString(),
      niveau: (json['niveau'] ?? 'L1').toString(),
      numeroCni: (json['numero_cni'] ?? '').toString(),
      telephone: (json['telephone'] ?? '').toString(),
      montantBourse: double.tryParse('${json['montant_bourse']}') ?? 0,
      anneeUniversitaire: json['annee_universitaire'] as int?,
      etudiantEmail: json['etudiant_email']?.toString(),
      commentaireAdmin: json['commentaire_admin']?.toString(),
      dateSoumission: json['date_soumission']?.toString(),
      creeLe: json['cree_le']?.toString(),
      modifieLe: json['modifie_le']?.toString(),
      statutPaiement: json['statut_paiement']?.toString(),
      instructeur: json['instructeur'],
      documents: docs is List
          ? docs.map((e) => DossierDocument.fromJson(e as Map<String, dynamic>)).toList()
          : const [],
    );
  }
}

class PaiementEtudiant {
  PaiementEtudiant({
    required this.id,
    required this.statut,
    required this.montant,
    this.dateOperation,
    this.listeReference,
    this.referenceExterne,
  });

  final int id;
  final String statut;
  final double montant;
  final String? dateOperation;
  final String? listeReference;
  final String? referenceExterne;

  factory PaiementEtudiant.fromJson(Map<String, dynamic> json) {
    return PaiementEtudiant(
      id: json['id'] as int,
      statut: (json['statut'] ?? '').toString(),
      montant: double.tryParse('${json['montant']}') ?? 0,
      dateOperation: json['date_operation']?.toString(),
      listeReference: json['liste_reference']?.toString(),
      referenceExterne: json['reference_externe']?.toString(),
    );
  }
}

class Reclamation {
  Reclamation({
    required this.id,
    required this.objet,
    required this.description,
    required this.statut,
    required this.dateCreation,
    this.dateMaj,
  });

  final int id;
  final String objet;
  final String description;
  final String statut;
  final String dateCreation;
  final String? dateMaj;

  factory Reclamation.fromJson(Map<String, dynamic> json) {
    return Reclamation(
      id: json['id'] as int,
      objet: (json['objet'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      statut: (json['statut'] ?? 'SOUMISE').toString(),
      dateCreation: (json['date_creation'] ?? '').toString(),
      dateMaj: json['date_maj']?.toString(),
    );
  }
}

class AttestationStatus {
  AttestationStatus({
    required this.eligible,
    this.statutDossier,
    this.statutPaiement,
    this.dossierValide = false,
    this.virementConfirme = false,
    this.paiementAttestation = false,
    this.montantAttestation = 50,
    this.codeCommercant,
    this.dossierId,
    this.reference,
    this.payeLe,
    this.methode,
    this.nomComplet,
    this.email,
    this.nni,
    this.etablissement,
    this.filiere,
    this.niveau,
    this.anneeUniversitaire,
    this.montantBourse,
  });

  final bool eligible;
  final String? statutDossier;
  final String? statutPaiement;
  final bool dossierValide;
  final bool virementConfirme;
  final bool paiementAttestation;
  final double montantAttestation;
  final String? codeCommercant;
  final int? dossierId;
  final String? reference;
  final String? payeLe;
  final String? methode;
  final String? nomComplet;
  final String? email;
  final String? nni;
  final String? etablissement;
  final String? filiere;
  final String? niveau;
  final String? anneeUniversitaire;
  final double? montantBourse;

  bool get canPrint => paiementAttestation && reference != null;

  factory AttestationStatus.fromJson(Map<String, dynamic> json) {
    final att = json['attestation'];
    final etu = json['etudiant'];
    final doss = json['dossier'];
    Map<String, dynamic>? attMap;
    Map<String, dynamic>? etuMap;
    Map<String, dynamic>? dossMap;
    if (att is Map<String, dynamic>) attMap = att;
    if (etu is Map<String, dynamic>) etuMap = etu;
    if (doss is Map<String, dynamic>) dossMap = doss;
    return AttestationStatus(
      eligible: json['eligible'] as bool? ?? false,
      statutDossier: json['statut_dossier']?.toString(),
      statutPaiement: json['statut_paiement']?.toString(),
      dossierValide: json['dossier_valide'] as bool? ?? false,
      virementConfirme: json['virement_confirme'] as bool? ?? false,
      paiementAttestation: json['paiement_attestation'] as bool? ?? false,
      montantAttestation: double.tryParse('${json['montant_attestation']}') ?? 50,
      codeCommercant: json['code_commercant']?.toString(),
      dossierId: json['dossier_id'] as int?,
      reference: attMap?['reference']?.toString(),
      payeLe: attMap?['paye_le']?.toString(),
      methode: attMap?['methode']?.toString(),
      nomComplet: etuMap?['nom_complet']?.toString(),
      email: etuMap?['email']?.toString(),
      nni: etuMap?['nni']?.toString(),
      etablissement: etuMap?['etablissement']?.toString(),
      filiere: etuMap?['filiere']?.toString(),
      niveau: dossMap?['niveau']?.toString(),
      anneeUniversitaire: dossMap?['annee_universitaire']?.toString(),
      montantBourse: double.tryParse('${dossMap?['montant_bourse']}'),
    );
  }
}

class SuiviEntry {
  SuiviEntry({
    required this.id,
    required this.date,
    required this.statut,
    required this.auteur,
    required this.commentaire,
  });

  final String id;
  final String? date;
  final String statut;
  final String auteur;
  final String commentaire;
}

class StudentNotificationItem {
  StudentNotificationItem({
    required this.id,
    required this.titre,
    required this.message,
    required this.date,
    this.lu = false,
  });

  final String id;
  final String titre;
  final String message;
  final String? date;
  final bool lu;

  StudentNotificationItem copyWith({bool? lu}) {
    return StudentNotificationItem(
      id: id,
      titre: titre,
      message: message,
      date: date,
      lu: lu ?? this.lu,
    );
  }
}
