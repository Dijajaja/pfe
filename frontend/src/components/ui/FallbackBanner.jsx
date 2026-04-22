import { useEffect, useState } from "react";

import {
  clearFallbackEndpoints,
  getFallbackEndpoints,
  subscribeFallback,
} from "../../app/fallbackMode";

export function FallbackBanner() {
  const [endpoints, setEndpoints] = useState(getFallbackEndpoints());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return subscribeFallback(() => setEndpoints(getFallbackEndpoints()));
  }, []);

  if (!endpoints.length) return null;

  return (
    <div className="alert alert-warning d-flex flex-column gap-2 mb-3">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <div>
          <div className="fw-semibold">Mode fallback/mock actif</div>
          <div className="small">
            Certains endpoints backend sont indisponibles. L’UI affiche des données de démonstration.
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

