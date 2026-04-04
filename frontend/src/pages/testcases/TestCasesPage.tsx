import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { useTestCases, useDeleteTestCase } from '@/hooks/useTestCases';
import SearchInput from '@/components/common/SearchInput';
import Pagination from '@/components/common/Pagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import PriorityBadge from '@/components/common/PriorityBadge';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { timeAgo } from '@/utils/helpers';

export default function TestCasesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [automationStatus, setAutomationStatus] = useState('');
  const [sort, setSort] = useState('updatedAt,desc');
  const [page, setPage] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading, error } = useTestCases(projectId, {
    page,
    size: 20,
    search: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
    automationStatus: automationStatus || undefined,
    sort: sort || undefined,
  });

  const deleteMutation = useDeleteTestCase(projectId!);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) });
  };

  if (isLoading) return <LoadingSpinner label="Loading test cases..." />;
  if (error) return <p className="text-red-600 text-sm">Failed to load test cases.</p>;

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const selectClass =
    'px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Test Cases</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.totalElements ?? 0} test case{(data?.totalElements ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate(`/projects/${projectId}/test-cases/new`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Test Case
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <SearchInput value={search} onChange={setSearch} placeholder="Search test cases..." />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className={selectClass}>
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="ARCHIVED">Archived</option>
            <option value="DEPRECATED">Deprecated</option>
          </select>
          <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(0); }} className={selectClass}>
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select value={automationStatus} onChange={(e) => { setAutomationStatus(e.target.value); setPage(0); }} className={selectClass}>
            <option value="">All Automation</option>
            <option value="NOT_AUTOMATED">Not Automated</option>
            <option value="AUTOMATED">Automated</option>
            <option value="AUTOMATION_CANDIDATE">Automation Candidate</option>
            <option value="AUTOMATION_BROKEN">Automation Broken</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass}>
            <option value="updatedAt,desc">Latest Updated</option>
            <option value="updatedAt,asc">Oldest Updated</option>
            <option value="title,asc">Title A-Z</option>
            <option value="title,desc">Title Z-A</option>
            <option value="priority,desc">Priority High-Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState
          title="No test cases found"
          description={search ? 'Try adjusting your search or filters.' : 'Create your first test case to get started.'}
          action={!search ? { label: 'New Test Case', onClick: () => navigate(`/projects/${projectId}/test-cases/new`) } : undefined}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Automation</th>
                  <th className="px-4 py-3 font-medium">Tags</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{tc.testCaseKey}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 max-w-xs truncate">
                      {tc.title}
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={tc.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={tc.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-600">{tc.automationStatus}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {tc.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {tc.tags.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{tc.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(tc.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/projects/${projectId}/test-cases/${tc.id}`)}
                          title="View"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tc.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Test Case"
        message="Are you sure you want to delete this test case? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
