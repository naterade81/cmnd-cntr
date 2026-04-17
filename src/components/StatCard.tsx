import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

export default function StatCard({ label, value, icon: Icon, color, subtitle }: Props) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 hover:border-surface-border-bright transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wider font-display">{label}</p>
          <p className="text-3xl font-display font-bold mt-2" style={{ color }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-text-muted text-xs mt-1 font-body">{subtitle}</p>
          )}
        </div>
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
}
