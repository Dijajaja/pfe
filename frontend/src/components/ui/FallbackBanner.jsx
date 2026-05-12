import { useEffect, useState } from "react";

import {
  clearFallbackEndpoints,
  getFallbackEndpoints,
  subscribeFallback,
} from "../../app/fallbackMode";
import { isApiFallbackEnabled } from "../../lib/apiFallbackConfig";

export function FallbackBanner() {
  const fallbackOn = isApiFallbackEnabled();
  const [endpoints, setEndpoints] = useState(() => (fallbackOn ? getFallbackEndpoints() : []));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!fallbackOn) {
      clearFallbackEndpoints();
      setEndpoints([]);
      return undefined;
    }
    setEndpoints(getFallbackEndpoints());
    return subscribeFallback(() => setEndpoints(getFallbackEndpoints()));
  }, [fallbackOn]);

  if (!fallbackOn || !endpoints.length) return null;

  return (
    <div className="alert alert-warning d-flex flex-column gap-2 mb-3">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <div>
          <div className="fw-semibold">Mode fallback / données de démo</div>
          <div className="small">
            <code className="small">VITE_ENABLE_API_FALLBACK=true</code> : certaines erreurs API (404, 405, 501, 503) sont
            remplacées par des mocks. À désactiver en production pour voir les vraies pannes et erreurs métier.
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-dark" onClick={() => setOpen((v) => !v)}>
            {open ? "Masquer" : "Détails"}
          </button>
          <button className="btn btn-sm btn-dark" onClick={clearFallbackEndpoints}>
            Effacer
          </button>
        </div>
      </div>
      {open ? (
        <ul className="mb-0 small">
          {endpoints.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

