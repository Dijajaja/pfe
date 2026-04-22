export function LoadingSkeleton({ lines = 3 }) {
  return (
    <div className="sehily-surface p-3">
      <div className="sehily-skeleton mb-3" style={{ width: "42%", height: 14 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="sehily-skeleton mb-2" style={{ width: `${96 - i * 8}%`, height: 12 }} />
      ))}
    </div>
  );
}

