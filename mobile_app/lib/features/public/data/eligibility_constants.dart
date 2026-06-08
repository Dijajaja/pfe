/// Wilayas et niveaux alignés sur la page web.
abstract final class EligibilityConstants {
  static const wilayas = [
    'Adrar',
    'Assaba',
    'Brakna',
    'Dakhlet Nouadhibou',
    'Gorgol',
    'Guidimakha',
    'Hodh Ech Chargui',
    'Hodh El Gharbi',
    'Inchiri',
    'Nouakchott-Nord',
    'Nouakchott-Ouest',
    'Nouakchott-Sud',
    'Tagant',
    'Tiris Zemmour',
    'Trarza',
  ];

  static const niveaux = [
    ('L1', 'L1'),
    ('L2', 'L2'),
    ('L3', 'L3'),
    ('M1', 'Master 1'),
    ('M2', 'Master 2'),
  ];
}

String eligibilityMessage(String? i18nKey, {Map<String, dynamic>? params}) {
  const fr = {
    'eligMsgDateInvalide': 'Date de naissance invalide.',
    'eligMsgAge': 'Vous avez dépassé la limite d’âge de 24 ans.',
    'eligMsgWilayaManquante': 'Veuillez indiquer la wilaya d’obtention du baccalauréat.',
    'eligMsgHorsNkc': 'Éligible — baccalauréat obtenu hors Nouakchott.',
    'eligMsgNkcL3': 'Éligible — baccalauréat obtenu à Nouakchott et niveau actuel L3.',
    'eligMsgNkcPasL3': 'Non éligible — baccalauréat obtenu à Nouakchott : le niveau L3 est requis.',
  };
  if (i18nKey == null || i18nKey.isEmpty) return 'Résultat indisponible.';
  return fr[i18nKey] ?? i18nKey;
}
