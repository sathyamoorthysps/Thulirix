import { cn } from '@/utils/helpers';

const variants: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-800',
  danger: 'bg-red-100 text-red-800',
  warning: 'bg-amber-100 text-amber-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-slate-100 text-slate-700',
};

interface BadgeProps {
  label: string;
  variant?: keyof typeof variants;
  className?: string;
}

export default function Badge({ label, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant] ?? variants.neutral,
        className,
      )}
    >
      {label}
    </span>
  );
}
