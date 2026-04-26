/**
 * Référentiel des établissements d’enseignement supérieur (Mauritanie) — publics
 * et principaux établissements privés reconnus.
 * Les filières proposées dépendent de l’établissement (`getFilieresPourEtablissement`).
 *
 * Les `value` sont les chaînes envoyées à l’API (CharField côté backend).
 */

const RAW_ETABLISSEMENTS = [
  // --- Universités (public) ---
  "Université de Nouakchott Al-Aasriya (UNA)",
  "Université des sciences de la santé de Nouakchott (USSN)",
  "Université des sciences islamiques à Aioun (USIA)",
  "Université de Nouadhibou",
  "Université moderne de Chinguittî",

  // --- Écoles nationales / académies ---
  "Académie navale mauritanienne",
  "École nationale d’administration, de journalisme et de magistrature (ENAJM)",
  "École normale supérieure de Nouakchott",
  "École supérieure polytechnique (ESP) — Nouakchott",
  "La Grande Mahdara Chinguitiya à Akjoujt",
  "Nouakchott Business School (École de commerce de Nouakchott)",

  // --- Instituts & centres (Nouakchott et hors capitale) ---
  "Centre régional d’enseignement spécialisé de Nouakchott",
  "Institut national de formation des cadres de l’éducation (Nouakchott)",
  "Institut national polytechnique de Nouakchott (INPN)",
  "Institut supérieur d’anglais — Nouakchott",
  "Institut supérieur d’économie et de commerce — Nouakchott",
  "Institut supérieur d’études et de recherches islamiques (ISERI) — Nouakchott",
  "Institut supérieur d’histoire et d’islamologie — Nouakchott",
  "Institut supérieur d’informatique — Nouakchott",
  "Institut supérieur d’enseignement technologique de Rosso (ISET)",
  "Institut supérieur de comptabilité et d’administration des entreprises (ISCAE) — Nouakchott",
  "Institut supérieur de formation de professeurs — Nouakchott",
  "Institut supérieur de génie industriel (ISGI) — Nouakchott",
  "Institut supérieur de l’environnement — Nouakchott",
  "Institut supérieur du numérique — Nouakchott",
  "Institut supérieur professionnel des langues, de la traduction et de l’interprétariat — Nouakchott",
  "Institut supérieur des études appliquées — Nouadhibou",
  "Institut supérieur des sciences appliquées et de technologie (ISSAT) — Atar",
  "Institut supérieur des sciences appliquées et de technologie (ISSAT) — Kaédi",
  "Institut supérieur des sciences appliquées et de technologie (ISSAT) — Nouadhibou",
  "Institut supérieur des sciences appliquées et de technologie (ISSAT) — Nouakchott",
  "Institut supérieur des sciences de la mer — Nouadhibou",
  "Institut supérieur des technologies de l’information et de la communication — Nouakchott",

  // --- Instituts supérieurs d’éducation (formation des enseignants, par wilaya) ---
  "Institut supérieur d’éducation (Aioun)",
  "Institut supérieur d’éducation (Atar)",
  "Institut supérieur d’éducation (Kaédi)",
  "Institut supérieur d’éducation (Kiffa)",
  "Institut supérieur d’éducation (Néma)",
  "Institut supérieur d’éducation (Nouadhibou)",
  "Institut supérieur d’éducation (Rosso)",
  "Institut supérieur d’éducation (Sélibaby)",

  // --- Enseignement supérieur privé (reconnu / conventionné, à affiner) ---
  "EDGE Business School — campus Nouakchott",
  "ESPRI — École supérieure professionnelle et interdisciplinaire (Nouakchott)",
  "Institut des sciences de l’environnement de Mauritanie (ISEM)",
  "Université libanaise internationale en Mauritanie (ULIM)",
];

function dedupeAndSortEtablissements(strings) {
  const seen = new Map();
  for (const raw of strings) {
    const value = raw.replace(/\s+/g, " ").trim();
    if (!value) continue;
    const key = value
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/['’`]/g, "'")
      .toLowerCase();
    if (!seen.has(key)) seen.set(key, value);
  }
  return [...seen.values()]
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }))
    .map((value) => ({ value }));
}

export const ETABLISSEMENTS_MAURITANIE = dedupeAndSortEtablissements(RAW_ETABLISSEMENTS);

/** Catalogue complet des filières (référence unique des libellés). */
const ALL_FILIERE_VALUES = [
  "Administration publique",
  "Agronomie / Sciences agronomiques",
  "Architecture",
  "Chimie",
  "Comptabilité et finance",
  "Droit",
  "Économie",
  "Génie civil",
  "Génie des procédés",
  "Génie électrique et énergie",
  "Génie informatique / Informatique",
  "Géographie",
  "Gestion des entreprises",
  "Histoire",
  "Journalisme et communication",
  "Langue et littérature arabes",
  "Langue et littérature françaises",
  "Langue anglaise",
  "Lettres et civilisation",
  "Mathématiques",
  "Médecine",
  "Médecine dentaire",
  "Métallurgie",
  "Mines et géologie",
  "Pédagogie / Sciences de l’éducation",
  "Pharmacie",
  "Philosophie",
  "Physique",
  "Sciences biologiques",
  "Sciences de gestion",
  "Sciences et technologies",
  "Sciences humaines et sociales",
  "Sciences islamiques",
  "Sciences religieuses",
  "Sciences infirmières",
  "Sociologie",
  "Télécommunications / Réseaux",
  "Télé-informatique",
  "Banques & Assurances",
  "Finance & Comptabilité",
  "Gestion des Ressources Humaines",
  "Techniques Commerciales et Marketing",
  "Développement Informatique",
  "Informatique de Gestion",
  "Réseaux informatiques et Télécommunications",
  "Statistique Appliquée à l'Economie",
];

export const FILIERES_MAURITANIE = [...ALL_FILIERE_VALUES]
  .sort((a, b) => a.localeCompare(b, "fr"))
  .map((value) => ({ value }));

const SANTE = [
  "Médecine",
  "Pharmacie",
  "Médecine dentaire",
  "Sciences infirmières",
  "Sciences biologiques",
];

const UNA_LMD = [
  "Droit",
  "Économie",
  "Lettres et civilisation",
  "Langue et littérature arabes",
  "Langue et littérature françaises",
  "Langue anglaise",
  "Mathématiques",
  "Physique",
  "Chimie",
  "Histoire",
  "Géographie",
  "Philosophie",
  "Sciences biologiques",
  "Sciences humaines et sociales",
  "Sociologie",
  "Sciences islamiques",
  "Administration publique",
  "Journalisme et communication",
  "Gestion des entreprises",
  "Sciences de gestion",
  "Comptabilité et finance",
];

const ISLAMIQUE = [
  "Sciences islamiques",
  "Sciences religieuses",
  "Langue et littérature arabes",
  "Philosophie",
  "Histoire",
  "Droit",
];

const ENAJM_FIL = [
  "Administration publique",
  "Journalisme et communication",
  "Droit",
  "Économie",
  "Sciences de gestion",
  "Comptabilité et finance",
];

const FORMATION_ENSEIGNEMENT = [
  "Pédagogie / Sciences de l’éducation",
  "Mathématiques",
  "Physique",
  "Chimie",
  "Sciences biologiques",
  "Langue et littérature arabes",
  "Langue et littérature françaises",
  "Langue anglaise",
  "Histoire",
  "Géographie",
  "Philosophie",
  "Lettres et civilisation",
  "Sciences humaines et sociales",
];

const INGENIERIE = [
  "Génie civil",
  "Génie électrique et énergie",
  "Génie informatique / Informatique",
  "Génie des procédés",
  "Télécommunications / Réseaux",
  "Télé-informatique",
  "Métallurgie",
  "Mines et géologie",
  "Architecture",
  "Chimie",
  "Physique",
  "Mathématiques",
  "Sciences et technologies",
  "Sciences biologiques",
];

const INGENIERIE_AGRO = [...INGENIERIE, "Agronomie / Sciences agronomiques"];

const NUMERIQUE_TIC = [
  "Génie informatique / Informatique",
  "Télécommunications / Réseaux",
  "Télé-informatique",
  "Sciences et technologies",
  "Mathématiques",
  "Physique",
];

const GESTION_COMPTA = [
  "Comptabilité et finance",
  "Économie",
  "Gestion des entreprises",
  "Sciences de gestion",
  "Droit",
  "Administration publique",
];

/** Filières proposées à l'ISCAE — Nouakchott (grille 4+4, ordre d'affichage). */
const ISCAE_FILIERES = [
  "Banques & Assurances",
  "Finance & Comptabilité",
  "Gestion des Ressources Humaines",
  "Techniques Commerciales et Marketing",
  "Développement Informatique",
  "Informatique de Gestion",
  "Réseaux informatiques et Télécommunications",
  "Statistique Appliquée à l'Economie",
];

export const ISCAE_FILIERES_COLONNE_GAUCHE = ISCAE_FILIERES.slice(0, 4);
export const ISCAE_FILIERES_COLONNE_DROITE = ISCAE_FILIERES.slice(4, 8);

const LANGUES = [
  "Langue anglaise",
  "Langue et littérature françaises",
  "Langue et littérature arabes",
  "Lettres et civilisation",
  "Journalisme et communication",
];

const ISLAMO_HIST = [
  "Histoire",
  "Sciences islamiques",
  "Philosophie",
  "Géographie",
  "Langue et littérature arabes",
];

const BUSINESS = [
  "Gestion des entreprises",
  "Économie",
  "Comptabilité et finance",
  "Sciences de gestion",
  "Droit",
];

const ENV_MER = [
  "Agronomie / Sciences agronomiques",
  "Mines et géologie",
  "Sciences biologiques",
  "Chimie",
  "Génie civil",
  "Géographie",
  "Sciences et technologies",
];

const NAVAL = [
  "Génie civil",
  "Génie électrique et énergie",
  "Télécommunications / Réseaux",
  "Mathématiques",
  "Physique",
  "Sciences et technologies",
];

function normalizeKey(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['’`]/g, "'")
    .toLowerCase()
    .trim();
}

/**
 * Détermine le jeu de filières à proposer pour un établissement donné.
 * Règles heuristiques (MVP) — à remplacer par données API si besoin.
 */
function filiereKeysForEtablissement(etablissement) {
  const n = normalizeKey(etablissement);
  if (!n) return null;

  if (n.includes("ussn")) return SANTE;
  if (n.includes("una)") || n.includes("al-aasriya")) return UNA_LMD;
  if (n.includes("usia")) return ISLAMIQUE;
  if (n.includes("universite de nouadhibou")) return UNA_LMD;
  if (n.includes("chinguitt")) return UNA_LMD;
  if (n.includes("academie navale")) return NAVAL;
  if (n.includes("enajm")) return ENAJM_FIL;
  if (n.includes("normale superieure")) return FORMATION_ENSEIGNEMENT;
  if (n.includes("polytechnique") && n.includes("ecole")) return INGENIERIE;
  if (n.includes("mahdara")) return ISLAMIQUE;
  if (n.includes("business school") || n.includes("ecole de commerce")) return BUSINESS;
  if (n.includes("centre regional")) return FORMATION_ENSEIGNEMENT;
  if (n.includes("formation des cadres") || n.includes("infc")) return FORMATION_ENSEIGNEMENT;
  if (n.includes("inpn")) return INGENIERIE;
  if (n.includes("institut superieur d'anglais")) return LANGUES;
  if (n.includes("economie et de commerce")) return GESTION_COMPTA;
  if (n.includes("iseri")) return ISLAMIQUE;
  if (n.includes("islamologie") || n.includes("histoire et d'islamologie")) return ISLAMO_HIST;
  if (n.includes("institut superieur d'informatique")) return NUMERIQUE_TIC;
  if (n.includes("iset") && n.includes("rosso")) return INGENIERIE_AGRO;
  if (n.includes("iscae")) return ISCAE_FILIERES;
  if (n.includes("formation de professeurs")) return FORMATION_ENSEIGNEMENT;
  if (n.includes("isgi")) return INGENIERIE;
  if (n.includes("institut superieur de l'environnement")) return ENV_MER;
  if (n.includes("isplti") || n.includes("traduction et de l'interpretariat")) return LANGUES;
  if (n.includes("etudes appliquees")) return INGENIERIE;
  if (n.includes("issat")) return INGENIERIE;
  if (n.includes("sciences de la mer")) return ENV_MER;
  if (n.includes("technologies de l'information") || n.includes("tic ")) return NUMERIQUE_TIC;
  if (n.includes("numerique")) return NUMERIQUE_TIC;
  if (n.includes("institut superieur d'education")) return FORMATION_ENSEIGNEMENT;
  if (n.includes("edge")) return BUSINESS;
  if (n.includes("espri")) return BUSINESS;
  if (n.includes("isem")) return ENV_MER;
  if (n.includes("ulim")) return ALL_FILIERE_VALUES;

  return ALL_FILIERE_VALUES;
}

function toSortedOptions(values) {
  const allowed = new Set(ALL_FILIERE_VALUES);
  const unique = [...new Set(values.filter((v) => allowed.has(v)))];
  unique.sort((a, b) => a.localeCompare(b, "fr"));
  return unique.map((value) => ({ value }));
}

/**
 * @param {string} etablissement
 * @returns {boolean}
 */
export function isEtablissementIscae(etablissement) {
  return normalizeKey(etablissement).includes("iscae");
}

/**
 * Filières affichées pour l’établissement choisi (tri alphabétique FR).
 * @param {string} etablissement — valeur exacte du select établissement
 * @returns {{ value: string }[]}
 */
export function getFilieresPourEtablissement(etablissement) {
  if (isEtablissementIscae(etablissement)) {
    return ISCAE_FILIERES.map((value) => ({ value }));
  }
  const keys = filiereKeysForEtablissement(etablissement);
  if (!keys) return [];
  return toSortedOptions(keys);
}
