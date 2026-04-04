import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Ban,
  SkipForward,
  Clock,
} from 'lucide-react';
import { executionApi } from '@/api/executionApi';
import { testCaseApi } from '@/api/testCaseApi';
import Modal from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/utils/helpers';
import type { ExecutionResult, TestPlanResponse, TestRunResponse, ExecutionResponse } from '@/types';

const resultIcons: Record<string, { icon: React.ElementType; color: string }> = {
  PASS: { icon: CheckCircle2, color: 'text-emerald-600' },
  FAIL: { icon: XCircle, color: 'text-red-600' },
  BLOCKED: { icon: Ban, color: 'text-amber-600' },
  SKIPPED: { icon: SkipForward, color: 'text-purple-600' },
  PENDING: { icon: Clock, color: 'text-slate-400' },
};

export default function ExecutionsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();

  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCreateRun, setShowCreateRun] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [runName, setRunName] = useState('');

  // Fetch plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans', projectId],
    queryFn: () => executionApi.listPlans(projectId!),
    enabled: !!projectId,
  });

  // Fetch test cases for plan creation
  const { data: tcData } = useQuery({
    queryKey: ['testCases', projectId, { size: 200 }],
    queryFn: () => testCaseApi.list(projectId!, { size: 200 }),
    enabled: !!projectId && showCreatePlan,
  });

  const [selectedTcIds, setSelectedTcIds] = useState<string[]>([]);

  // Fetch runs when plan expanded
  const { data: runs = [] } = useQuery({
    queryKey: ['runs', projectId, expandedPlan],
    queryFn: () => executionApi.listRuns(projectId!, expandedPlan!),
    enabled: !!projectId && !!expandedPlan,
  });

  // Fetch executions when run expanded
  const { data: executions = [] } = useQuery({
    queryKey: ['executions', projectId, expandedPlan, expandedRun],
    queryFn: () => executionApi.getExecutions(projectId!, expandedPlan!, expandedRun!),
    enabled: !!projectId && !!expandedPlan && !!expandedRun,
  });

  // Create plan mutation
  const createPlanMut = useMutation({
    mutationFn: () =>
      executionApi.createPlan(projectId!, { name: planName, description: planDesc, testCaseIds: selectedTcIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans', projectId] });
      toast.success('Test plan created');
      setShowCreatePlan(false);
      setPlanName('');
      setPlanDesc('');
      setSelectedTcIds([]);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create plan'),
  });

  // Create run mutation
  const createRunMut = useMutation({
    mutationFn: (planId: string) =>
      executionApi.createRun(projectId!, planId, { name: runName }),
    onSuccess: (_, planId) => {
      qc.invalidateQueries({ queryKey: ['runs', projectId, planId] });
      toast.success('Run started');
      setShowCreateRun(null);
      setRunName('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create run'),
  });

  // Update execution result
  const updateExecMut = useMutation({
    mutationFn: ({ execId, result }: { execId: string; result: ExecutionResult }) =>
      executionApi.updateExecution(projectId!, expandedPlan!, expandedRun!, execId, { result }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['executions', projectId, expandedPlan, expandedRun] });
      qc.invalidateQueries({ queryKey: ['runs', projectId, expandedPlan] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  if (isLoading) return <LoadingSpinner label="Loading test plans..." />;

  const toggleTc = (id: string) => {
    setSelectedTcIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Summary bar for a run
  const RunSummary = ({ run }: { run: TestRunResponse }) => {
    const total = run.totalCases || 1;
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-emerald-600 font-medium">{run.passed}P</span>
        <span className="text-red-600 font-medium">{run.failed}F</span>
        <span className="text-amber-600 font-medium">{run.blocked}B</span>
        <span className="text-purple-600 font-medium">{run.skipped}S</span>
        <span className="text-slate-400 font-medium">{run.pending}?</span>
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[80px]">
          <div className="h-full flex">
            <div className="bg-emerald-500" style={{ width: `${(run.passed / total) * 100}%` }} />
            <div className="bg-red-500" style={{ width: `${(run.failed / total) * 100}%` }} />
            <div className="bg-amber-500" style={{ width: `${(run.blocked / total) * 100}%` }} />
            <div className="bg-purple-500" style={{ width: `${(run.skipped / total) * 100}%` }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Executions</h1>
          <p className="text-sm text-slate-500 mt-1">Test plans and execution runs</p>
        </div>
        <button
          onClick={() => setShowCreatePlan(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          title="No test plans yet"
          description="Create a test plan to organize and execute your test cases."
          action={{ label: 'Create Plan', onClick: () => setShowCreatePlan(true) }}
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow-sm border border-slate-200">
              {/* Plan Header */}
              <button
                onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {expandedPlan === plan.id ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {plan.testCaseIds?.length ?? 0} test cases
                </span>
              </button>

              {/* Runs */}
              {expandedPlan === plan.id && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Runs
                    </h4>
                    <button
                      onClick={() => { setShowCreateRun(plan.id); setRunName(''); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      Start Run
                    </button>
                  </div>

                  {runs.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">No runs yet</p>
                  ) : (
                    <div className="space-y-2">
                      {runs.map((run) => (
                        <div key={run.id}>
                          <button
                            onClick={() =>
                              setExpandedRun(expandedRun === run.id ? null : run.id)
                            }
                            className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              {expandedRun === run.id ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                              )}
                              <span className="text-sm font-medium text-slate-700">
                                {run.name}
                              </span>
                              <span className="text-xs text-slate-400 ml-2">
                                {run.status}
                              </span>
                            </div>
                            <div className="w-48">
                              <RunSummary run={run} />
                            </div>
                          </button>

                          {/* Executions Table */}
                          {expandedRun === run.id && (
                            <div className="mt-2 ml-6 overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                                    <th className="pb-2 font-medium">Test Case</th>
                                    <th className="pb-2 font-medium">Title</th>
                                    <th className="pb-2 font-medium">Result</th>
                                    <th className="pb-2 font-medium">Executed</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {executions.map((exec) => {
                                    const IconInfo = resultIcons[exec.result] ?? resultIcons.PENDING;
                                    const Icon = IconInfo.icon;
                                    return (
                                      <tr key={exec.id}>
                                        <td className="py-2 font-mono text-xs text-slate-500">
                                          {exec.testCaseKey}
                                        </td>
                                        <td className="py-2 text-slate-700">{exec.testCaseTitle}</td>
                                        <td className="py-2">
                                          <div className="flex items-center gap-2">
                                            <Icon className={`h-4 w-4 ${IconInfo.color}`} />
                                            <select
                                              value={exec.result}
                                              onChange={(e) =>
                                                updateExecMut.mutate({
                                                  execId: exec.id,
                                                  result: e.target.value as ExecutionResult,
                                                })
                                              }
                                              className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            >
                                              <option value="PENDING">Pending</option>
                                              <option value="PASS">Pass</option>
                                              <option value="FAIL">Fail</option>
                                              <option value="BLOCKED">Blocked</option>
                                              <option value="SKIPPED">Skipped</option>
                                            </select>
                                          </div>
                                        </td>
                                        <td className="py-2 text-xs text-slate-500">
                                          {exec.executedAt ? formatDateTime(exec.executedAt) : '-'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal
        isOpen={showCreatePlan}
        onClose={() => setShowCreatePlan(false)}
        title="Create Test Plan"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Sprint 42 Regression"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={planDesc}
              onChange={(e) => setPlanDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Test Cases ({selectedTcIds.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
              {(tcData?.content ?? []).map((tc) => (
                <label
                  key={tc.id}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTcIds.includes(tc.id)}
                    onChange={() => toggleTc(tc.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                  />
                  <span className="font-mono text-xs text-slate-400">{tc.testCaseKey}</span>
                  <span className="text-sm text-slate-700 truncate">{tc.title}</span>
                </label>
              ))}
              {(tcData?.content ?? []).length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">No test cases available</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCreatePlan(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => createPlanMut.mutate()}
              disabled={!planName || selectedTcIds.length === 0 || createPlanMut.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {createPlanMut.isPending ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Run Modal */}
      <Modal
        isOpen={!!showCreateRun}
        onClose={() => setShowCreateRun(null)}
        title="Start Test Run"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Run Name</label>
            <input
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Run 1"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCreateRun(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => showCreateRun && createRunMut.mutate(showCreateRun)}
              disabled={!runName || createRunMut.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {createRunMut.isPending ? 'Starting...' : 'Start Run'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
