export function DashboardKpiCard({
  label,
  value,
  subLabel = "",
  tone = "neutral",
  trend = null,
  icon: Icon = null,
  variant = "admin",
}) {
  const isAdmin = variant === "admin";
  const cardClass = isAdmin ? "admin-kpi-card" : "partner-kpi-card";
  const iconClass = isAdmin ? `admin-kpi-icon admin-kpi-icon-${tone}` : `partner-kpi-icon partner-kpi-icon-${tone}`;
  const numericValue = typeof value === "number" ? value.toLocaleString() : value;
  const showTrend = typeof trend === "number";
  const trendClass = trend >= 0 ? "admin-trend-up" : "admin-trend-down";

  return (
    <div className={`sehily-surface p-3 h-100 ${cardClass}`}>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div className="small dashboard-kpi-label">{label}</div>
        <span className={iconClass}>{Icon ? <Icon size={15} /> : null}</span>
      </div>
      <div className="h4 mb-1 dashboard-kpi-value">{numericValue}</div>
      {showTrend ? (
        <div className={`small fw-semibold ${trendClass}`}>
          {trend >= 0 ? "↗" : "↘"} {Math.abs(trend).toFixed(1)}% depuis le mois dernier
        </div>
      ) : (
        <div className="small text-muted">{subLabel}</div>
      )}
    </div>
  );
}
