import { useMutation } from "@tanstack/react-query";

import { adminApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";

function download(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminExportsPage() {
  const { pushSuccess, pushError } = useAppToast();
  const exportMutation = useMutation({
    mutationFn: () => adminApi.exportPaiementsXlsx(),
    onSuccess: (blob) => {
      download("export_paiements.xlsx", blob);
      pushSuccess("Export téléchargé.");
    },
    onError: (err) => pushError(getApiErrorMessage(err, "Échec export paiements.")),
  });

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Admin — Exports</h1>
        <div className="text-muted">Téléchargement CSV/Excel (démo UI).</div>
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3 d-flex gap-2 flex-wrap">
          <button className="btn sehily-btn-accent" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
            Télécharger Excel (backend)
          </button>
        </div>
      </div>
    </div>
  );
}

