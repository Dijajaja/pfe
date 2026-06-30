class EligibilityStudentRef {
  const EligibilityStudentRef({
    required this.nni,
    required this.matricule,
    required this.nomComplet,
    required this.etablissement,
    required this.formation,
    required this.anneeCourante,
    required this.wilaya,
  });

  final String nni;
  final String matricule;
  final String nomComplet;
  final String etablissement;
  final String formation;
  final String anneeCourante;
  final String wilaya;

  factory EligibilityStudentRef.fromJson(Map<String, dynamic> json) {
    return EligibilityStudentRef(
      nni:           json['nni']?.toString() ?? '',
      matricule:     json['matricule']?.toString() ?? '',
      nomComplet:    json['nom_complet']?.toString() ?? '',
      etablissement: json['etablissement']?.toString() ?? '',
      formation:     json['formation']?.toString() ?? '',
      anneeCourante: json['annee_courante']?.toString() ?? '',
      wilaya:        json['wilaya']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'nni':           nni,
        'matricule':     matricule,
        'nom_complet':   nomComplet,
        'etablissement': etablissement,
        'formation':     formation,
        'annee_courante': anneeCourante,
        'wilaya':        wilaya,
      };
}

class EligibilityResult {
  const EligibilityResult({
    required this.found,
    required this.ok,
    this.code,
    this.message,
    this.motif,
    this.etudiant,
  });

  final bool found;
  final bool ok;
  final String? code;
  final String? message;
  final String? motif;
  final EligibilityStudentRef? etudiant;

  factory EligibilityResult.fromJson(Map<String, dynamic> json) {
    final etudiantRaw = json['etudiant'];
    return EligibilityResult(
      found:    json['found'] == true,
      ok:       json['ok'] == true || json['eligible'] == true,
      code:     json['code']?.toString(),
      message:  json['message']?.toString(),
      motif:    json['motif']?.toString(),
      etudiant: etudiantRaw is Map<String, dynamic>
          ? EligibilityStudentRef.fromJson(etudiantRaw)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'found':    found,
        'ok':       ok,
        'eligible': ok,
        'code':     code,
        'message':  message,
        'motif':    motif,
        if (etudiant != null) 'etudiant': etudiant!.toJson(),
      };
}
