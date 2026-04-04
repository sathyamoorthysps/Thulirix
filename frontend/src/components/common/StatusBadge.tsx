import { cn, statusColor } from '@/utils/helpers';

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusColor(status),
      )}
    >
      {status}
    </span>
  );
}
