import { useParams } from 'react-router-dom';
import {
  FlaskConical,
  TrendingUp,
  Cpu,
  PlayCircle,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TrendChart from '@/components/charts/TrendChart';
import StatusDonutChart from '@/components/charts/StatusDonutChart';
import PassRateGauge from '@/components/charts/PassRateGauge';
import { formatDateTime } from '@/utils/helpers';

export default function DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data, isLoading, error } = useDashboard(projectId);

  if (isLoading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error || !data)
    return <p className="text-red-600 text-sm">Failed to load dashboard.</p>;

  const stats = [
    {
      label: 'Total Tests',
      value: data.totalTestCases,
      icon: FlaskConical,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Pass Rate',
      value: data.passRate != null ? `${Math.round(data.passRate)}%` : 'N/A',
      icon: TrendingUp,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Automated',
      value: `${Math.round(data.automatedPercentage ?? 0)}%`,
      icon: Cpu,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Executions',
      value: data.totalExecutions,
      icon: PlayCircle,
      color: 'bg-amber-100 text-amber-600',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Execution Trend (14 days)
          </h2>
          {data.trend.length > 0 ? (
            <TrendChart data={data.trend} />
          ) : (
            <p className="text-sm text-slate-400 py-12 text-center">No trend data yet</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 flex flex-col items-center justify-center">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Status Breakdown</h2>
          {Object.keys(data.statusBreakdown).length > 0 ? (
            <StatusDonutChart data={data.statusBreakdown} />
          ) : (
            <p className="text-sm text-slate-400 py-8">No data</p>
          )}
        </div>
      </div>

      {/* Pass Rate + Recent Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 flex flex-col items-center justify-center">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Pass Rate</h2>
          <PassRateGauge rate={data.passRate} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent Runs</h2>
          {data.recentRuns.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No runs yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                    <th className="pb-2 font-medium">Run</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Progress</th>
                    <th className="pb-2 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentRuns.map((run) => {
                    const total = run.totalCases || 1;
                    const passPercent = Math.round((run.passed / total) * 100);
                    const failPercent = Math.round((run.failed / total) * 100);
                    return (
                      <tr key={run.id} className="border-b border-slate-50">
                        <td className="py-2.5 font-medium text-slate-700">{run.name}</td>
                        <td className="py-2.5">
                          <span className="text-xs font-medium text-slate-600">{run.status}</span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${passPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-10 text-right">
                              {passPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 text-xs text-slate-500">
                          {formatDateTime(run.startedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
