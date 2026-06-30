/**
 * Validateurs CNOU — utilisés sur les formulaires web.
 * Chaque fonction retourne { valid: boolean, msg: string }.
 */

// Email inscription étudiant : uniquement @gmail.com
const RE_EMAIL = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
// Email connexion : tout format valide (admins, partenaires, etc.)
const RE_EMAIL_LOGIN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Téléphone mauritanien : commence par 2, 3 ou 4, exactement 8 chiffres
const RE_TEL = /^[234]\d{7}$/;

// NNI : exactement 10 chiffres
// Matricule : 1 lettre + 5 chiffres
// Mot de passe : min 8 car., maj+min+chiffre+spécial
const RE_NNI       = /^[0-9]{10}$/;
const RE_MATRICULE = /^[A-Za-z]\d{5}$/;
const RE_PASSWORD  = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export function vNni(v) {
  if (!v) return { valid: false, msg: "Le NNI est obligatoire." };
  if (!/^\d+$/.test(v)) return { valid: false, msg: "Le NNI ne doit contenir que des chiffres." };
  if (v.length < 10) return { valid: false, msg: `Le NNI doit contenir 10 chiffres (${v.length}/10 saisis).` };
  if (v.length > 10) return { valid: false, msg: "Le NNI ne doit pas dépasser 10 chiffres." };
  return { valid: true, msg: "NNI valide." };
}

export function vMatricule(v) {
  if (!v) return { valid: false, msg: "Le matricule est obligatoire." };
  if (!RE_MATRICULE.test(v.trim()))
    return { valid: false, msg: "Format attendu : 1 lettre + 5 chiffres (ex : I25099)." };
  return { valid: true, msg: "Matricule valide." };
}

/** Pour l'inscription étudiant — restreint à @gmail.com */
export function vEmail(v) {
  if (!v) return { valid: false, msg: "L'email est obligatoire." };
  if (!v.includes("@")) return { valid: false, msg: "Adresse email invalide." };
  if (!RE_EMAIL.test(v.trim()))
    return { valid: false, msg: "Seules les adresses @gmail.com sont acceptées." };
  return { valid: true, msg: "Email valide." };
}

/** Pour la connexion — accepte tout format valide (admins, partenaires inclus) */
export function vEmailLogin(v) {
  if (!v) return { valid: false, msg: "L'email est obligatoire." };
  if (!RE_EMAIL_LOGIN.test(v.trim()))
    return { valid: false, msg: "Adresse email invalide." };
  return { valid: true, msg: "Email valide." };
}

export function vTelephone(v) {
  if (!v) return { valid: false, msg: "Le numéro de téléphone est obligatoire." };
  const clean = v.trim().replace(/\s/g, "");
  if (!/^\d+$/.test(clean)) return { valid: false, msg: "Le numéro ne doit contenir que des chiffres." };
  if (!RE_TEL.test(clean))
    return { valid: false, msg: "Numéro invalide — 8 chiffres commençant par 2, 3 ou 4 (ex : 41234567)." };
  return { valid: true, msg: "Numéro valide." };
}

export function vPassword(v) {
  if (!v) return { valid: false, msg: "Le mot de passe est obligatoire." };
  if (v.length < 8) return { valid: false, msg: "Minimum 8 caractères requis." };
  if (!/[a-z]/.test(v)) return { valid: false, msg: "Au moins une lettre minuscule (a-z) requise." };
  if (!/[A-Z]/.test(v)) return { valid: false, msg: "Au moins une lettre majuscule (A-Z) requise." };
  if (!/\d/.test(v))    return { valid: false, msg: "Au moins un chiffre (0-9) requis." };
  if (!/[@$!%*?&]/.test(v)) return { valid: false, msg: "Au moins un caractère spécial (@$!%*?&) requis." };
  return { valid: true, msg: "Mot de passe sécurisé." };
}

export function vPasswordLogin(v) {
  if (!v) return { valid: false, msg: "Le mot de passe est obligatoire." };
  if (v.length < 8) return { valid: false, msg: "Minimum 8 caractères." };
  return { valid: true, msg: "Mot de passe saisi." };
}

export function vPasswordConfirm(v, password) {
  if (!v) return { valid: false, msg: "Veuillez confirmer votre mot de passe." };
  if (v !== password) return { valid: false, msg: "Les mots de passe ne correspondent pas." };
  return { valid: true, msg: "Les mots de passe correspondent." };
}

/** Retourne 'is-valid', 'is-invalid', ou '' selon l'état du champ. */
export function inputState(touched, valid) {
  if (!touched) return "";
  return valid ? "is-valid" : "is-invalid";
}
