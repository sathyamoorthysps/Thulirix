import { cn, priorityColor } from '@/utils/helpers';

export default function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        priorityColor(priority),
      )}
    >
      {priority}
    </span>
  );
}
