'use client';

interface RadarDataPoint {
  label: string;
  value: number; // 0-100
  maxValue?: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  color?: string;
}

export function RadarChart({ data, size = 250, color = '#3B82F6' }: RadarChartProps) {
  if (data.length < 3) return null;

  const center = size / 2;
  const radius = (size / 2) - 30;
  const angleStep = (2 * Math.PI) / data.length;

  // Calculate points for the data polygon
  const dataPoints = data.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (d.value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Axis lines and labels
  const axes = data.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const endX = center + radius * Math.cos(angle);
    const endY = center + radius * Math.sin(angle);
    const labelX = center + (radius + 18) * Math.cos(angle);
    const labelY = center + (radius + 18) * Math.sin(angle);
    return { endX, endY, labelX, labelY, label: d.label, value: d.value };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {levels.map((level, li) => {
          const points = data.map((_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            const r = level * radius;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');
          return <polygon key={li} points={points} fill="none" stroke="#E5E7EB" strokeWidth="1" />;
        })}

        {/* Axes */}
        {axes.map((a, i) => (
          <g key={i}>
            <line x1={center} y1={center} x2={a.endX} y2={a.endY} stroke="#D1D5DB" strokeWidth="1" />
            <text x={a.labelX} y={a.labelY} textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-gray-500">
              {a.label}
            </text>
          </g>
        ))}

        {/* Data polygon */}
        <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} stroke="white" strokeWidth="2" />
        ))}
      </svg>

      {/* Legend with values */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span>{d.label}: {d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
