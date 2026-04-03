'use client';

interface ProgressPoint {
  date: string;
  percentage: number;
  riskZone?: string;
}

interface ProgressChartProps {
  data: ProgressPoint[];
  height?: number;
}

export function ProgressChart({ data, height = 200 }: ProgressChartProps) {
  if (data.length < 2) return null;

  const width = 400;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxY = 100;
  const minY = 0;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.percentage - minY) / (maxY - minY)) * chartHeight,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  const getColor = (zone?: string) => zone === 'RED' ? '#EF4444' : zone === 'YELLOW' ? '#F59E0B' : '#10B981';

  const yLabels = [0, 25, 50, 75, 100];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-md mx-auto">
        {/* Grid lines */}
        {yLabels.map(v => {
          const y = padding.top + chartHeight - (v / maxY) * chartHeight;
          return (
            <g key={v}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#F3F4F6" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-400" fontSize="10">{v}%</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="#3B82F6" fillOpacity="0.1" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={getColor(p.riskZone)} stroke="white" strokeWidth="2" />
            <text x={p.x} y={padding.top + chartHeight + 20} textAnchor="middle" className="text-[9px] fill-gray-500" fontSize="9">
              {new Date(p.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
            </text>
          </g>
        ))}
      </svg>

      {/* Trend indicator */}
      {data.length >= 2 && (() => {
        const first = data[0].percentage;
        const last = data[data.length - 1].percentage;
        const diff = last - first;
        const trend = diff > 5 ? 'up' : diff < -5 ? 'down' : 'stable';
        const trendConfig = {
          up: { label: 'Рост', color: 'text-green-600', icon: '\u2191' },
          down: { label: 'Снижение', color: 'text-red-600', icon: '\u2193' },
          stable: { label: 'Стабильно', color: 'text-gray-600', icon: '\u2192' },
        };
        const t = trendConfig[trend];
        return (
          <p className={`text-center text-sm font-medium mt-2 ${t.color}`}>
            {t.icon} {t.label} ({diff > 0 ? '+' : ''}{diff}% за {data.length} тестирований)
          </p>
        );
      })()}
    </div>
  );
}
