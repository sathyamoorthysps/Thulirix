import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Columns3, Download, Upload } from 'lucide-react';
import { useTestCases, useDeleteTestCase } from '@/hooks/useTestCases';
import { useRole } from '@/hooks/useRole';
import { useQueryClient } from '@tanstack/react-query';
import SearchInput from '@/components/common/SearchInput';
import Pagination from '@/components/common/Pagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import PriorityBadge from '@/components/common/PriorityBadge';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ImportTestCasesModal from '@/components/testcases/ImportTestCasesModal';
import { exportToCsv, exportToJson } from '@/utils/testCaseImportExport';
import { testCaseApi } from '@/api/testCaseApi';
import { timeAgo } from '@/utils/helpers';

// ── Column definitions ──────────────────────────────────────────────────────

type ColumnId = 'key' | 'title' | 'priority' | 'status' | 'automation' | 'tags' | 'updated' | 'actions';

interface ColumnDef {
  id: ColumnId;
  label: string;
  alwaysVisible?: boolean;
  /** Roles that see this column by default. Empty = visible to all by default. */
  defaultRoles?: string[];
}

const COLUMNS: ColumnDef[] = [
  { id: 'key',        label: 'Key',        alwaysVisible: true },
  { id: 'title',      label: 'Title',      alwaysVisible: true },
  { id: 'priority',   label: 'Priority' },
  { id: 'status',     label: 'Status' },
  { id: 'automation', label: 'Automation', defaultRoles: ['SYSTEM_ADMIN', 'TEST_LEAD'] },
  { id: 'tags',       label: 'Tags',       defaultRoles: ['SYSTEM_ADMIN', 'TEST_LEAD'] },
  { id: 'updated',    label: 'Updated' },
  { id: 'actions',    label: 'Actions',    alwaysVisible: true },
];

function getDefaultVisible(roles: string[]): Set<ColumnId> {
  return new Set(
    COLUMNS
      .filter((c) => c.alwaysVisible || !c.defaultRoles || c.defaultRoles.some((r) => roles.includes(r)))
      .map((c) => c.id),
  );
}

function storageKey(roles: string[]) {
  const role = roles.includes('SYSTEM_ADMIN') ? 'admin'
    : roles.includes('TEST_LEAD') ? 'lead'
    : 'tester';
  return `thulirix-tc-columns-${role}`;
}

function loadVisible(roles: string[]): Set<ColumnId> {
  try {
    const raw = localStorage.getItem(storageKey(roles));
    if (raw) {
      const parsed: ColumnId[] = JSON.parse(raw);
      // Always enforce alwaysVisible columns
      const always = COLUMNS.filter((c) => c.alwaysVisible).map((c) => c.id);
      return new Set([...always, ...parsed]);
    }
  } catch { /* ignore */ }
  return getDefaultVisible(roles);
}

function saveVisible(roles: string[], visible: Set<ColumnId>) {
  const toggable = [...visible].filter((id) => !COLUMNS.find((c) => c.id === id)?.alwaysVisible);
  localStorage.setItem(storageKey(roles), JSON.stringify(toggable));
}

// ── Component ───────────────────────────────────────────────────────────────

export default function TestCasesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { canEdit, roles } = useRole();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [automationStatus, setAutomationStatus] = useState('');
  const [sort, setSort] = useState('updatedAt,desc');
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<ColumnId>>(() => loadVisible(roles));
  const colMenuRef = useRef<HTMLDivElement>(null);
  const [showImport, setShowImport] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Close menus on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setColMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleExport(format: 'csv' | 'json') {
    setExportMenuOpen(false);
    setExporting(true);
    try {
      // Fetch all matching records (up to 5000) with current filters applied
      const result = await testCaseApi.list(projectId!, {
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
        automationStatus: automationStatus || undefined,
        size: 5000,
        page: 0,
      });
      // Fetch full details for each (needed for steps)
      const full = await Promise.all(
        result.content.map((tc) => testCaseApi.get(projectId!, tc.id))
      );
      if (format === 'csv') exportToCsv(full);
      else exportToJson(full);
    } finally {
      setExporting(false);
    }
  }

  const toggleCol = (id: ColumnId) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveVisible(roles, next);
      return next;
    });
  };

  const show = (id: ColumnId) => visibleCols.has(id);

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
        <div className="flex items-center gap-2">
          {/* Export */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen((v) => !v)}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting…' : 'Export'}
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>

          {/* Import */}
          {canEdit && (
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
          )}

          <button
            onClick={() => navigate(`/projects/${projectId}/test-cases/new`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Test Case
          </button>
        </div>
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

          {/* Column visibility toggle */}
          <div className="relative" ref={colMenuRef}>
            <button
              onClick={() => setColMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white hover:bg-slate-50"
              title="Toggle columns"
            >
              <Columns3 className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">Columns</span>
            </button>
            {colMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Visible Columns
                </p>
                {COLUMNS.filter((c) => !c.alwaysVisible).map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols.has(col.id)}
                      onChange={() => toggleCol(col.id)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {col.label}
                    {col.defaultRoles && (
                      <span className="ml-auto text-[10px] text-slate-400">
                        {col.defaultRoles.includes('SYSTEM_ADMIN') ? 'Admin' : 'Lead'}+
                      </span>
                    )}
                  </label>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1 px-3 pb-1">
                  <button
                    onClick={() => {
                      const def = getDefaultVisible(roles);
                      setVisibleCols(def);
                      saveVisible(roles, def);
                    }}
                    className="text-xs text-brand-600 hover:text-brand-700"
                  >
                    Reset to defaults
                  </button>
                </div>
              </div>
            )}
          </div>
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
                  {show('key')        && <th className="px-4 py-3 font-medium">Key</th>}
                  {show('title')      && <th className="px-4 py-3 font-medium">Title</th>}
                  {show('priority')   && <th className="px-4 py-3 font-medium">Priority</th>}
                  {show('status')     && <th className="px-4 py-3 font-medium">Status</th>}
                  {show('automation') && <th className="px-4 py-3 font-medium">Automation</th>}
                  {show('tags')       && <th className="px-4 py-3 font-medium">Tags</th>}
                  {show('updated')    && <th className="px-4 py-3 font-medium">Updated</th>}
                  {show('actions')    && <th className="px-4 py-3 font-medium w-28">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-50 transition-colors">
                    {show('key') && (
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{tc.testCaseKey}</td>
                    )}
                    {show('title') && (
                      <td className="px-4 py-3 font-medium text-slate-700 max-w-xs truncate">{tc.title}</td>
                    )}
                    {show('priority') && (
                      <td className="px-4 py-3"><PriorityBadge priority={tc.priority} /></td>
                    )}
                    {show('status') && (
                      <td className="px-4 py-3"><StatusBadge status={tc.status} /></td>
                    )}
                    {show('automation') && (
                      <td className="px-4 py-3 text-xs text-slate-600">{tc.automationStatus}</td>
                    )}
                    {show('tags') && (
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
                    )}
                    {show('updated') && (
                      <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(tc.updatedAt)}</td>
                    )}
                    {show('actions') && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/projects/${projectId}/test-cases/${tc.id}`)}
                            title="View"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canEdit ? (
                            <button
                              onClick={() => navigate(`/projects/${projectId}/test-cases/${tc.id}/edit`)}
                              title="Edit"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              title="Edit (requires Admin or Lead role)"
                              disabled
                              className="p-1.5 rounded-lg text-slate-200 cursor-not-allowed"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(tc.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
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

      {showImport && (
        <ImportTestCasesModal
          projectId={projectId!}
          onClose={() => setShowImport(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['testCases', projectId] })}
        />
      )}
    </div>
  );
}
