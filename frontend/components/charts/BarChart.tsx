'use client';

interface BarChartProps {
  data: {
    label: string;
    value: number;
    maxValue?: number;
  }[];
  showValues?: boolean;
}

export function BarChart({ data, showValues = true }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.maxValue || d.value));

  const getColor = (value: number, max: number) => {
    const pct = (value / max) * 100;
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 60) return 'bg-blue-500';
    if (pct >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const max = item.maxValue || maxValue;
        const percentage = (item.value / max) * 100;

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">{item.label}</span>
              {showValues && (
                <span className="text-gray-500">{item.value}/{max}</span>
              )}
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getColor(item.value, max)}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
