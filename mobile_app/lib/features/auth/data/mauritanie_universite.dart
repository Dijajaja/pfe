/// Référentiel établissements / filières — aligné sur `frontend/src/data/mauritanieUniversite.js`.

const _rawEtablissements = [
  'Université de Nouakchott Al-Aasriya (UNA)',
  'Université des sciences de la santé de Nouakchott (USSN)',
  'Université des sciences islamiques à Aioun (USIA)',
  'Université de Nouadhibou',
  'Université moderne de Chinguittî',
  'Académie navale mauritanienne',
  'École nationale d’administration, de journalisme et de magistrature (ENAJM)',
  'École normale supérieure de Nouakchott',
  'École supérieure polytechnique (ESP) — Nouakchott',
  'La Grande Mahdara Chinguitiya à Akjoujt',
  'Nouakchott Business School (École de commerce de Nouakchott)',
  'Centre régional d’enseignement spécialisé de Nouakchott',
  'Institut national de formation des cadres de l’éducation (Nouakchott)',
  'Institut national polytechnique de Nouakchott (INPN)',
  'Institut supérieur d’anglais — Nouakchott',
  'Institut supérieur d’économie et de commerce — Nouakchott',
  'Institut supérieur d’études et de recherches islamiques (ISERI) — Nouakchott',
  'Institut supérieur d’histoire et d’islamologie — Nouakchott',
  'Institut supérieur d’informatique — Nouakchott',
  'Institut supérieur d’enseignement technologique de Rosso (ISET)',
  'Institut supérieur de comptabilité et d’administration des entreprises (ISCAE) — Nouakchott',
  'Institut supérieur de formation de professeurs — Nouakchott',
  'Institut supérieur de génie industriel (ISGI) — Nouakchott',
  'Institut supérieur de l’environnement — Nouakchott',
  'Institut supérieur du numérique — Nouakchott',
  'Institut supérieur professionnel des langues, de la traduction et de l’interprétariat — Nouakchott',
  'Institut supérieur des études appliquées — Nouadhibou',
  'Institut supérieur des sciences appliquées et de technologie (ISSAT) — Atar',
  'Institut supérieur des sciences appliquées et de technologie (ISSAT) — Kaédi',
  'Institut supérieur des sciences appliquées et de technologie (ISSAT) — Nouadhibou',
  'Institut supérieur des sciences appliquées et de technologie (ISSAT) — Nouakchott',
  'Institut supérieur des sciences de la mer — Nouadhibou',
  'Institut supérieur des technologies de l’information et de la communication — Nouakchott',
  'Institut supérieur d’éducation (Aioun)',
  'Institut supérieur d’éducation (Atar)',
  'Institut supérieur d’éducation (Kaédi)',
  'Institut supérieur d’éducation (Kiffa)',
  'Institut supérieur d’éducation (Néma)',
  'Institut supérieur d’éducation (Nouadhibou)',
  'Institut supérieur d’éducation (Rosso)',
  'Institut supérieur d’éducation (Sélibaby)',
  'EDGE Business School — campus Nouakchott',
  'ESPRI — École supérieure professionnelle et interdisciplinaire (Nouakchott)',
  'Institut des sciences de l’environnement de Mauritanie (ISEM)',
  'Université libanaise internationale en Mauritanie (ULIM)',
];

const _allFiliereValues = [
  'Administration publique',
  'Agronomie / Sciences agronomiques',
  'Architecture',
  'Chimie',
  'Comptabilité et finance',
  'Droit',
  'Économie',
  'Génie civil',
  'Génie des procédés',
  'Génie électrique et énergie',
  'Génie informatique / Informatique',
  'Géographie',
  'Gestion des entreprises',
  'Histoire',
  'Journalisme et communication',
  'Langue et littérature arabes',
  'Langue et littérature françaises',
  'Langue anglaise',
  'Lettres et civilisation',
  'Mathématiques',
  'Médecine',
  'Médecine dentaire',
  'Métallurgie',
  'Mines et géologie',
  'Pédagogie / Sciences de l’éducation',
  'Pharmacie',
  'Philosophie',
  'Physique',
  'Sciences biologiques',
  'Sciences de gestion',
  'Sciences et technologies',
  'Sciences humaines et sociales',
  'Sciences islamiques',
  'Sciences religieuses',
  'Sciences infirmières',
  'Sociologie',
  'Télécommunications / Réseaux',
  'Télé-informatique',
  'Banques & Assurances',
  'Finance & Comptabilité',
  'Gestion des Ressources Humaines',
  'Techniques Commerciales et Marketing',
  'Développement Informatique',
  'Informatique de Gestion',
  'Réseaux informatiques et Télécommunications',
  'Statistique Appliquée à l\'Economie',
];

const _sante = ['Médecine', 'Pharmacie', 'Médecine dentaire', 'Sciences infirmières', 'Sciences biologiques'];

const _unaLmd = [
  'Droit', 'Économie', 'Lettres et civilisation', 'Langue et littérature arabes',
  'Langue et littérature françaises', 'Langue anglaise', 'Mathématiques', 'Physique', 'Chimie',
  'Histoire', 'Géographie', 'Philosophie', 'Sciences biologiques', 'Sciences humaines et sociales',
  'Sociologie', 'Sciences islamiques', 'Administration publique', 'Journalisme et communication',
  'Gestion des entreprises', 'Sciences de gestion', 'Comptabilité et finance',
];

const _islamique = [
  'Sciences islamiques', 'Sciences religieuses', 'Langue et littérature arabes', 'Philosophie', 'Histoire', 'Droit',
];

const _enajmFil = [
  'Administration publique', 'Journalisme et communication', 'Droit', 'Économie',
  'Sciences de gestion', 'Comptabilité et finance',
];

const _formationEnseignement = [
  'Pédagogie / Sciences de l’éducation', 'Mathématiques', 'Physique', 'Chimie', 'Sciences biologiques',
  'Langue et littérature arabes', 'Langue et littérature françaises', 'Langue anglaise',
  'Histoire', 'Géographie', 'Philosophie', 'Lettres et civilisation', 'Sciences humaines et sociales',
];

const _ingenierie = [
  'Génie civil', 'Génie électrique et énergie', 'Génie informatique / Informatique', 'Génie des procédés',
  'Télécommunications / Réseaux', 'Télé-informatique', 'Métallurgie', 'Mines et géologie',
  'Architecture', 'Chimie', 'Physique', 'Mathématiques', 'Sciences et technologies', 'Sciences biologiques',
];

const _ingenierieAgro = [..._ingenierie, 'Agronomie / Sciences agronomiques'];

const _numeriqueTic = [
  'Génie informatique / Informatique', 'Télécommunications / Réseaux', 'Télé-informatique',
  'Sciences et technologies', 'Mathématiques', 'Physique',
];

const _gestionCompta = [
  'Comptabilité et finance', 'Économie', 'Gestion des entreprises', 'Sciences de gestion', 'Droit', 'Administration publique',
];

const _iscaeFilieres = [
  'Banques & Assurances',
  'Finance & Comptabilité',
  'Gestion des Ressources Humaines',
  'Techniques Commerciales et Marketing',
  'Développement Informatique',
  'Informatique de Gestion',
  'Réseaux informatiques et Télécommunications',
  'Statistique Appliquée à l\'Economie',
];

const _langues = [
  'Langue anglaise', 'Langue et littérature françaises', 'Langue et littérature arabes',
  'Lettres et civilisation', 'Journalisme et communication',
];

const _islamoHist = [
  'Histoire', 'Sciences islamiques', 'Philosophie', 'Géographie', 'Langue et littérature arabes',
];

const _business = [
  'Gestion des entreprises', 'Économie', 'Comptabilité et finance', 'Sciences de gestion', 'Droit',
];

const _envMer = [
  'Agronomie / Sciences agronomiques', 'Mines et géologie', 'Sciences biologiques', 'Chimie',
  'Génie civil', 'Géographie', 'Sciences et technologies',
];

const _naval = [
  'Génie civil', 'Génie électrique et énergie', 'Télécommunications / Réseaux',
  'Mathématiques', 'Physique', 'Sciences et technologies',
];

String _normalizeKey(String? s) {
  return (s ?? '')
      .toLowerCase()
      .replaceAll(RegExp(r"['’`]", caseSensitive: false), "'")
      .trim();
}

List<String> _dedupeAndSortEtablissements(List<String> strings) {
  final seen = <String, String>{};
  for (final raw in strings) {
    final value = raw.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (value.isEmpty) continue;
    final key = _normalizeKey(value);
    seen.putIfAbsent(key, () => value);
  }
  final list = seen.values.toList()..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
  return list;
}

List<String> _toSortedOptions(List<String> values) {
  final allowed = _allFiliereValues.toSet();
  final unique = values.where(allowed.contains).toSet().toList()
    ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
  return unique;
}

List<String>? _filiereKeysForEtablissement(String? etablissement) {
  final n = _normalizeKey(etablissement);
  if (n.isEmpty) return null;

  if (n.contains('ussn')) return _sante;
  if (n.contains('una)') || n.contains('al-aasriya')) return _unaLmd;
  if (n.contains('usia')) return _islamique;
  if (n.contains('universite de nouadhibou')) return _unaLmd;
  if (n.contains('chinguitt')) return _unaLmd;
  if (n.contains('academie navale')) return _naval;
  if (n.contains('enajm')) return _enajmFil;
  if (n.contains('normale superieure')) return _formationEnseignement;
  if (n.contains('polytechnique') && n.contains('ecole')) return _ingenierie;
  if (n.contains('mahdara')) return _islamique;
  if (n.contains('business school') || n.contains('ecole de commerce')) return _business;
  if (n.contains('centre regional')) return _formationEnseignement;
  if (n.contains('formation des cadres') || n.contains('infc')) return _formationEnseignement;
  if (n.contains('inpn')) return _ingenierie;
  if (n.contains("institut superieur d'anglais")) return _langues;
  if (n.contains('economie et de commerce')) return _gestionCompta;
  if (n.contains('iseri')) return _islamique;
  if (n.contains('islamologie') || n.contains("histoire et d'islamologie")) return _islamoHist;
  if (n.contains("institut superieur d'informatique")) return _numeriqueTic;
  if (n.contains('iset') && n.contains('rosso')) return _ingenierieAgro;
  if (n.contains('iscae')) return _iscaeFilieres;
  if (n.contains('formation de professeurs')) return _formationEnseignement;
  if (n.contains('isgi')) return _ingenierie;
  if (n.contains("institut superieur de l'environnement")) return _envMer;
  if (n.contains('isplti') || n.contains("traduction et de l'interpretariat")) return _langues;
  if (n.contains('etudes appliquees')) return _ingenierie;
  if (n.contains('issat')) return _ingenierie;
  if (n.contains('sciences de la mer')) return _envMer;
  if (n.contains("technologies de l'information") || n.contains('tic ')) return _numeriqueTic;
  if (n.contains('numerique')) return _numeriqueTic;
  if (n.contains("institut superieur d'education")) return _formationEnseignement;
  if (n.contains('edge')) return _business;
  if (n.contains('espri')) return _business;
  if (n.contains('isem')) return _envMer;
  if (n.contains('ulim')) return _allFiliereValues;

  return _allFiliereValues;
}

bool isEtablissementIscae(String? etablissement) => _normalizeKey(etablissement).contains('iscae');

final etablissementsMauritanie = _dedupeAndSortEtablissements(_rawEtablissements);

List<String> getFilieresPourEtablissement(String? etablissement) {
  if (etablissement == null || etablissement.isEmpty) return const [];
  if (isEtablissementIscae(etablissement)) return List<String>.from(_iscaeFilieres);
  final keys = _filiereKeysForEtablissement(etablissement);
  if (keys == null) return const [];
  return _toSortedOptions(keys);
}
