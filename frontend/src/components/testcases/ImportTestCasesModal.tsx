import { useRef, useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, FileDown } from 'lucide-react';
import { testCaseApi } from '@/api/testCaseApi';
import { parseCsv, parseJson, toCreateRequest, downloadCsvTemplate } from '@/utils/testCaseImportExport';
import type { ImportRow } from '@/utils/testCaseImportExport';

interface Props {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'preview' | 'importing' | 'done';

export default function ImportTestCasesModal({ projectId, onClose, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const [dragOver, setDragOver] = useState(false);

  const validRows = rows.filter((r) => !r._error);
  const invalidRows = rows.filter((r) => r._error);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = file.name.endsWith('.json') ? parseJson(text) : parseCsv(text);
      setRows(parsed);
      setStep('preview');
    };
    reader.readAsText(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function runImport() {
    setStep('importing');
    setProgress({ done: 0, total: validRows.length, errors: 0 });
    let errors = 0;
    for (let i = 0; i < validRows.length; i++) {
      try {
        await testCaseApi.create(projectId, toCreateRequest(validRows[i]));
      } catch {
        errors++;
      }
      setProgress({ done: i + 1, total: validRows.length, errors });
    }
    setStep('done');
    setProgress((p) => ({ ...p, errors }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">Import Test Cases</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Upload a <strong>CSV</strong> or <strong>JSON</strong> file to import test cases into this project.
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-brand-400 bg-brand-50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
                }`}
              >
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">Drop file here or click to browse</p>
                <p className="text-xs text-slate-400 mt-1">Supports .csv and .json</p>
                <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={onFileChange} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Need a template?</span>
                <button
                  onClick={(e) => { e.stopPropagation(); downloadCsvTemplate(); }}
                  className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Download CSV template
                </button>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {validRows.length} valid
                </span>
                {invalidRows.length > 0 && (
                  <span className="flex items-center gap-1.5 text-red-600 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {invalidRows.length} with errors (will be skipped)
                  </span>
                )}
              </div>

              {rows.length === 0 && (
                <p className="text-sm text-slate-500">No rows found in file.</p>
              )}

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-slate-500 uppercase tracking-wider">
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Title</th>
                      <th className="px-3 py-2 font-medium">Priority</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Steps</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, i) => (
                      <tr key={i} className={row._error ? 'bg-red-50' : 'hover:bg-slate-50'}>
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 text-slate-700 max-w-[180px] truncate">{row.title || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{row.priority}</td>
                        <td className="px-3 py-2 text-slate-600">{row.status}</td>
                        <td className="px-3 py-2 text-slate-500">{row.steps.length}</td>
                        <td className="px-3 py-2">
                          {row._error ? (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                              {row._error}
                            </span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-brand-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-sm text-slate-600">
                Importing {progress.done} of {progress.total} test cases…
              </p>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="text-base font-semibold text-slate-800">Import complete</p>
              <p className="text-sm text-slate-600">
                {progress.total - progress.errors} imported successfully
                {progress.errors > 0 && `, ${progress.errors} failed`}.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          {step === 'done' ? (
            <button
              onClick={() => { onSuccess(); onClose(); }}
              className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              {step === 'preview' && (
                <>
                  <button
                    onClick={() => { setRows([]); setStep('upload'); }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={runImport}
                    disabled={validRows.length === 0}
                    className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
                  >
                    Import {validRows.length} Test Case{validRows.length !== 1 ? 's' : ''}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
