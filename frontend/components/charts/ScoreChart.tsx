'use client';

import { useMemo } from 'react';

interface ScoreChartProps {
  score: number;
  maxScore: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreChart({ score, maxScore, size = 'md', showLabel = true }: ScoreChartProps) {
  const percentage = useMemo(() => Math.round((score / maxScore) * 100), [score, maxScore]);

  const sizes = {
    sm: { width: 80, strokeWidth: 6 },
    md: { width: 120, strokeWidth: 8 },
    lg: { width: 160, strokeWidth: 10 },
  };

  const { width, strokeWidth } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 80) return '#22c55e'; // green
    if (pct >= 60) return '#3b82f6'; // blue
    if (pct >= 40) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  const color = getColor(percentage);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={width} height={width} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{percentage}%</span>
          <span className="text-xs text-gray-500">{score}/{maxScore}</span>
        </div>
      )}
    </div>
  );
}
