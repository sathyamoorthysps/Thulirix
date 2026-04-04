import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS: Record<string, string> = {
  PASS: '#10b981',
  FAIL: '#ef4444',
  BLOCKED: '#f59e0b',
  SKIPPED: '#8b5cf6',
  PENDING: '#94a3b8',
  DRAFT: '#94a3b8',
  READY: '#3b82f6',
  APPROVED: '#10b981',
  DEPRECATED: '#ef4444',
};

interface StatusDonutChartProps {
  data: Record<string, number>;
}

export default function StatusDonutChart({ data }: StatusDonutChartProps) {
  const chartData = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-sm text-slate-400">
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        />
        <Legend
          formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
