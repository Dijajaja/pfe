const swatches = [
  { name: "Pétrole", var: "--sehily-petrole" },
  { name: "Vert pro", var: "--sehily-vert-pro" },
  { name: "Corail", var: "--sehily-corail" },
  { name: "Crème", var: "--sehily-creme" },
  { name: "Sable", var: "--sehily-sable" },
];

export function PalettePage() {
  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Palette</h1>
        <div className="text-muted">Référence UI (pétrole + corail).</div>
      </div>

      <div className="col-12">
        <div className="sehily-surface p-3">
          <div className="fw-bold mb-3">Couleurs</div>
          <div className="d-grid gap-2">
            {swatches.map((s) => (
              <div
                key={s.var}
                className="d-flex align-items-center justify-content-between px-3 py-2 rounded-3"
                style={{
                  border: "1px solid var(--sehily-border)",
                  background: "rgba(255,255,255,.03)",
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span
                    style={{
                      height: 18,
                      width: 18,
                      borderRadius: 999,
                      background: `var(${s.var})`,
                      display: "inline-block",
                      border: "1px solid rgba(255,255,255,.20)",
                    }}
                  />
                  <span className="fw-semibold">{s.name}</span>
                </div>
                <code className="text-muted small">{s.var}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

