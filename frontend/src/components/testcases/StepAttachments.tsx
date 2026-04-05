import { useRef, useState } from 'react';
import { Paperclip, Upload, Trash2, FileText, Image, X, Loader2 } from 'lucide-react';
import { stepAttachmentApi } from '@/api/testCaseApi';
import type { StepAttachmentResponse } from '@/types';

interface Props {
  stepId: string;
  attachments: StepAttachmentResponse[];
  canEdit?: boolean;
  onAttachmentsChange?: (stepId: string, attachments: StepAttachmentResponse[]) => void;
}

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

function FileIcon({ mimeType }: { mimeType: string }) {
  if (IMAGE_TYPES.has(mimeType)) return <Image className="h-3.5 w-3.5 flex-shrink-0" />;
  return <FileText className="h-3.5 w-3.5 flex-shrink-0" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StepAttachments({ stepId, attachments, canEdit = false, onAttachmentsChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<StepAttachmentResponse | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const att = await stepAttachmentApi.upload(stepId, file);
      onAttachmentsChange?.(stepId, [...attachments, att]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await stepAttachmentApi.delete(id);
      onAttachmentsChange?.(stepId, attachments.filter((a) => a.id !== id));
    } catch {
      // silently ignore
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="mt-2">
      {/* Attachment list */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-xs text-slate-600 max-w-[160px]"
            >
              <FileIcon mimeType={att.mimeType} />
              <button
                onClick={() => IMAGE_TYPES.has(att.mimeType) ? setPreview(att) : window.open(`/api/v1${att.downloadUrl}`, '_blank')}
                className="truncate hover:text-brand-600 text-left"
                title={att.originalName}
              >
                {att.originalName}
              </button>
              <span className="text-slate-400 whitespace-nowrap">{formatBytes(att.fileSize)}</span>
              {canEdit && (
                <button
                  onClick={() => handleDelete(att.id)}
                  disabled={deleting === att.id}
                  className="ml-0.5 text-slate-400 hover:text-red-500 flex-shrink-0"
                >
                  {deleting === att.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <X className="h-3 w-3" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {canEdit && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600 disabled:opacity-50"
          >
            {uploading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
              : <><Paperclip className="h-3.5 w-3.5" /> Attach file</>}
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            onChange={handleUpload}
          />
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      )}

      {/* Image preview modal */}
      {preview && IMAGE_TYPES.has(preview.mimeType) && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200">
              <span className="text-sm font-medium text-slate-700">{preview.originalName}</span>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/v1${preview.downloadUrl}`}
                  download={preview.originalName}
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                >
                  <Upload className="h-3.5 w-3.5 rotate-180" /> Download
                </a>
                <button onClick={() => setPreview(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <img
              src={`/api/v1${preview.downloadUrl}`}
              alt={preview.originalName}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
