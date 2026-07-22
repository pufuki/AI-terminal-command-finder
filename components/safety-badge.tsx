import { Shield, AlertTriangle, Skull } from 'lucide-react';
import type { SafetyLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

const SAFETY_CONFIG: Record<
  SafetyLevel,
  { label: string; className: string; icon: typeof Shield }
> = {
  safe: {
    label: 'Safe',
    className:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: Shield,
  },
  warning: {
    label: 'Warning',
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: AlertTriangle,
  },
  dangerous: {
    label: 'Dangerous',
    className:
      'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    icon: Skull,
  },
};

interface SafetyBadgeProps {
  level: SafetyLevel;
  className?: string;
}

export function SafetyBadge({ level, className }: SafetyBadgeProps) {
  const config = SAFETY_CONFIG[level];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
