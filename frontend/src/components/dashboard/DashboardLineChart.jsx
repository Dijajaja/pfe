export function DashboardLineChart({
  data,
  series,
  xKey = "month",
  width = 540,
  height = 220,
  className = "",
  labelsClassName = "",
}) {
  const safeData = Array.isArray(data) ? data : [];
  const safeSeries = Array.isArray(series) ? series : [];
  const maxValue = Math.max(
    1,
    ...safeData.map((item) =>
      Math.max(
        ...safeSeries.map((s) => Number(item?.[s.key] || 0))
      )
    )
  );

  function pointsFor(key) {
    if (safeData.length <= 1) return "";
    return safeData
      .map((item, index) => {
        const x = (index * (width - 20)) / (safeData.length - 1) + 10;
        const y = height - (Number(item?.[key] || 0) / maxValue) * (height - 20) - 10;
        return `${x},${y}`;
      })
      .join(" ");
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maxValue * ratio));

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        {yTicks.map((tick, idx) => {
          const y = height - (tick / maxValue) * (height - 20) - 10;
          return (
            <g key={idx}>
              <line x1="10" y1={y} x2={width - 10} y2={y} stroke="rgba(26,92,74,.12)" strokeWidth="1" />
              <text x="2" y={y - 2} fontSize="10" fill="rgba(30,63,56,.65)">
                {tick}
              </text>
            </g>
          );
        })}
        {safeSeries.map((s) => (
          <polyline key={s.key} points={pointsFor(s.key)} fill="none" stroke={s.color} strokeWidth="3" />
        ))}
      </svg>
      <div className={labelsClassName}>
        {safeData.map((point, idx) => (
          <span key={`${point?.[xKey]}-${idx}`}>{point?.[xKey]}</span>
        ))}
      </div>
    </div>
  );
}
