import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Archive, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTestCase, useDeleteTestCase } from '@/hooks/useTestCases';
import { testCaseApi } from '@/api/testCaseApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PriorityBadge from '@/components/common/PriorityBadge';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatDateTime, timeAgo } from '@/utils/helpers';
import type { TestCaseResponse } from '@/types';

export default function TestCaseDetailPage() {
  const { projectId, testCaseId } = useParams<{ projectId: string; testCaseId: string }>();
  const navigate = useNavigate();
  const { data: tc, isLoading, error } = useTestCase(projectId, testCaseId);
  const deleteMutation = useDeleteTestCase(projectId!);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: versions = [] } = useQuery({
    queryKey: ['testCaseVersions', projectId, testCaseId],
    queryFn: () => testCaseApi.getVersions(projectId!, testCaseId!),
    enabled: !!projectId && !!testCaseId,
  });

  if (isLoading) return <LoadingSpinner label="Loading test case..." />;
  if (error || !tc) return <p className="text-red-600 text-sm">Failed to load test case.</p>;

  const handleDelete = () => {
    deleteMutation.mutate(tc.id, {
      onSuccess: () => navigate(`/projects/${projectId}/test-cases`),
    });
  };

  const handleArchive = async () => {
    await testCaseApi.archive(projectId!, tc.id);
    navigate(`/projects/${projectId}/test-cases`);
  };

  const infoItems = [
    { label: 'Priority', content: <PriorityBadge priority={tc.priority} /> },
    { label: 'Status', content: <StatusBadge status={tc.status} /> },
    { label: 'Automation', content: <span className="text-sm text-slate-700">{tc.automationStatus}</span> },
    { label: 'Version', content: <span className="text-sm text-slate-700">v{tc.version}</span> },
    { label: 'Created', content: <span className="text-sm text-slate-500">{formatDateTime(tc.createdAt)}</span> },
    { label: 'Updated', content: <span className="text-sm text-slate-500">{timeAgo(tc.updatedAt)}</span> },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(`/projects/${projectId}/test-cases`)}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Test Cases
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-slate-400">{tc.testCaseKey}</span>
            <h1 className="text-xl font-bold text-slate-800 mt-1">{tc.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <PriorityBadge priority={tc.priority} />
              <StatusBadge status={tc.status} />
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">
                {tc.automationStatus}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleArchive}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {infoItems.map((item) => (
            <div key={item.label}>
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              {item.content}
            </div>
          ))}
        </div>
      </div>

      {/* Description / Objective / Conditions */}
      {(tc.objective || tc.description || tc.preconditions || tc.postconditions) && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6 space-y-4">
          {tc.objective && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Objective</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{tc.objective}</p>
            </div>
          )}
          {tc.description && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{tc.description}</p>
            </div>
          )}
          {tc.preconditions && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Preconditions</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{tc.preconditions}</p>
            </div>
          )}
          {tc.postconditions && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Postconditions</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{tc.postconditions}</p>
            </div>
          )}
        </div>
      )}

      {/* Steps */}
      {tc.steps.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Test Steps</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="pb-2 font-medium w-12">#</th>
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">Expected Result</th>
                  <th className="pb-2 font-medium">Test Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tc.steps
                  .sort((a, b) => a.stepNumber - b.stepNumber)
                  .map((step) => (
                    <tr key={step.id}>
                      <td className="py-2.5 text-slate-400 font-medium">{step.stepNumber}</td>
                      <td className="py-2.5 text-slate-700 whitespace-pre-wrap">{step.action}</td>
                      <td className="py-2.5 text-slate-600 whitespace-pre-wrap">{step.expectedResult || '-'}</td>
                      <td className="py-2.5 text-slate-500 whitespace-pre-wrap">{step.testData || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tags */}
      {tc.tags.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tc.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Version History */}
      {versions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Version History</h2>
          <div className="space-y-3">
            {versions.map((v) => (
              <div
                key={v.version}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Version {v.version}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(v.updatedAt)}</p>
                  </div>
                </div>
                {v.version !== tc.version && (
                  <button
                    onClick={async () => {
                      await testCaseApi.restoreVersion(projectId!, testCaseId!, v.version);
                      window.location.reload();
                    }}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Restore
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Test Case"
        message={`Are you sure you want to delete "${tc.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
