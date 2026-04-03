interface RiskBadgeProps {
  zone: 'RED' | 'YELLOW' | 'GREEN' | string;
  size?: 'sm' | 'md' | 'lg';
}

const config = {
  RED: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-500', label: 'Зона риска' },
  YELLOW: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', dot: 'bg-yellow-500', label: 'Внимание' },
  GREEN: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-500', label: 'Норма' },
};

export function RiskBadge({ zone, size = 'md' }: RiskBadgeProps) {
  const c = config[zone as keyof typeof config] || config.GREEN;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${c.bg} ${c.text} ${c.border} ${sizeClass}`}>
      <span className={`w-2 h-2 rounded-full mr-1.5 ${c.dot}`} />
      {c.label}
    </span>
  );
}
