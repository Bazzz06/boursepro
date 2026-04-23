type Props = {
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  variant?: 'default' | 'dark' | 'accent';
  mono?: boolean;
};

export default function KpiCard({
  label,
  value,
  subValue,
  trend,
  variant = 'default',
  mono = true,
}: Props) {
  const bgClass =
    variant === 'dark'
      ? 'bg-neutral-900 text-white'
      : variant === 'accent'
      ? 'bg-accent text-white'
      : 'bg-white border border-neutral-200/60';

  const labelClass =
    variant === 'dark' || variant === 'accent'
      ? 'text-white/60'
      : 'text-neutral-500';

  const subClass =
    variant === 'dark' || variant === 'accent'
      ? 'text-white/60'
      : 'text-neutral-500';

  const trendColor =
    trend === undefined
      ? ''
      : trend >= 0
      ? variant === 'dark' || variant === 'accent'
        ? 'text-emerald-300'
        : 'text-emerald-600'
      : variant === 'dark' || variant === 'accent'
      ? 'text-red-300'
      : 'text-red-600';

  return (
    <div className={`rounded-xl shadow-sm p-4 ${bgClass}`}>
      <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${labelClass}`}>
        {label}
      </div>
      <div className={`text-[24px] font-bold leading-tight ${mono ? 'tabular-nums' : ''} ${trendColor || ''}`}>
        {value}
      </div>
      {subValue && (
        <div className={`text-[11px] mt-0.5 ${mono ? 'tabular-nums' : ''} ${subClass}`}>
          {subValue}
        </div>
      )}
    </div>
  );
}
