type Props = {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
};

export default function ScoreRing({ score, size = 120, strokeWidth = 8, showLabel = true, className = "" }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? "var(--color-brand-500)" : score >= 75 ? "#F59E0B" : "#EF4444";
  const grade = score >= 95 ? "Excellent" : score >= 85 ? "Great" : score >= 75 ? "Good" : "Fair";

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring"
          style={{
            ["--ring-from" as never]: circumference,
            ["--ring-to" as never]: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-bold" style={{ fontSize: size * 0.28, color }}>{score}</div>
        {showLabel && (
          <>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400" style={{ marginTop: -2 }}>/100</div>
            <div className="text-[10px] font-semibold" style={{ color }}>{grade}</div>
          </>
        )}
      </div>
    </div>
  );
}
