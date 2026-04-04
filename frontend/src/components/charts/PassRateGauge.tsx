interface PassRateGaugeProps {
  rate: number;
}

export default function PassRateGauge({ rate }: PassRateGaugeProps) {
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const progress = (rate / 100) * circumference;
  const color = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform="rotate(-90 60 60)"
          className="transition-all duration-700"
        />
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-slate-800 text-lg font-bold"
          fontSize="20"
        >
          {Math.round(rate)}%
        </text>
      </svg>
      <p className="text-xs text-slate-500 mt-1">Pass Rate</p>
    </div>
  );
}
