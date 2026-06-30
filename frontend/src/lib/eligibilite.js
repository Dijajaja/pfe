import { api } from "./api";
import { endpoints } from "./endpoints";

export async function evaluerEligibiliteBackend({ nni, matricule }) {
  const r = await api.post(endpoints.public.eligibilite, {
    nni: String(nni || "").trim(),
    matricule: String(matricule || "").trim(),
  });
  return r.data;
}
