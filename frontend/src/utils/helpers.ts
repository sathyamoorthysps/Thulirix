import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800';
    case 'LOW':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'APPROVED':
    case 'PASS':
      return 'bg-emerald-100 text-emerald-800';
    case 'READY':
      return 'bg-blue-100 text-blue-800';
    case 'DRAFT':
    case 'PENDING':
      return 'bg-slate-100 text-slate-700';
    case 'DEPRECATED':
    case 'FAIL':
      return 'bg-red-100 text-red-800';
    case 'BLOCKED':
      return 'bg-amber-100 text-amber-800';
    case 'SKIPPED':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export function resultIcon(result: string): { icon: string; color: string } {
  switch (result) {
    case 'PASS':
      return { icon: 'CheckCircle2', color: 'text-emerald-600' };
    case 'FAIL':
      return { icon: 'XCircle', color: 'text-red-600' };
    case 'BLOCKED':
      return { icon: 'Ban', color: 'text-amber-600' };
    case 'SKIPPED':
      return { icon: 'SkipForward', color: 'text-purple-600' };
    default:
      return { icon: 'Clock', color: 'text-slate-400' };
  }
}
