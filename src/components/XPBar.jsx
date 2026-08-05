/**
 * Reusable animated progress bar. Displays a label row and a fill
 * that animates on width changes.
 */
export default function XPBar({
  label = "",
  value,
  max,
  percent = null,
  fillColor = "",
  ariaLabel = "Progress",
  className = "",
}) {
  const computedPercent =
    percent ?? (max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0);

  return (
    <div className={`xp-bar${className ? ` ${className}` : ""}`}>
      {label && (
        <div className="xp-bar__label">
          <span>{label}</span>
          {value !== undefined && max !== undefined && (
            <span>
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div
        className="xp-bar__track"
        role="progressbar"
        aria-valuenow={computedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <span
          className="xp-bar__fill"
          style={{
            width: `${computedPercent}%`,
            ...(fillColor ? { background: fillColor } : {}),
          }}
        />
      </div>
      {percent !== null && (
        <span className="xp-bar__percent">{computedPercent}%</span>
      )}
    </div>
  );
}
