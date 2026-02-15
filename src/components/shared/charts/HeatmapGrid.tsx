'use client';

import { useMemo } from 'react';

interface HeatmapGridProps {
  /** Map of ISO date strings ('YYYY-MM-DD') to a count/intensity value */
  data: Record<string, number>;
  /** Number of weeks to show (default 52 = 1 year) */
  weeks?: number;
  /** Colour for filled cells — should be an accent colour */
  colour?: string;
  /** End date (defaults to today) */
  endDate?: Date;
  className?: string;
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const CELL_SIZE = 12;
const CELL_GAP = 2;

function getIntensity(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  const ratio = value / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export default function HeatmapGrid({
  data,
  weeks = 52,
  colour = 'var(--accent)',
  endDate,
  className = '',
}: HeatmapGridProps) {
  const { cells, months, maxValue } = useMemo(() => {
    const end = endDate ?? new Date();
    const totalDays = weeks * 7;
    const start = new Date(end);
    start.setDate(start.getDate() - totalDays + 1);
    // Align start to Sunday
    start.setDate(start.getDate() - start.getDay());

    let max = 0;
    const values = Object.values(data);
    for (const v of values) if (v > max) max = v;

    const grid: { date: string; value: number; col: number; row: number }[] = [];
    const monthMarkers: { label: string; col: number }[] = [];
    let prevMonth = -1;

    const cursor = new Date(start);
    for (let d = 0; cursor <= end; d++) {
      const iso = cursor.toISOString().slice(0, 10);
      const col = Math.floor(d / 7);
      const row = d % 7;

      const month = cursor.getMonth();
      if (month !== prevMonth) {
        monthMarkers.push({
          label: cursor.toLocaleDateString('en-GB', { month: 'short' }),
          col,
        });
        prevMonth = month;
      }

      grid.push({ date: iso, value: data[iso] ?? 0, col, row });
      cursor.setDate(cursor.getDate() + 1);
    }

    return { cells: grid, months: monthMarkers, maxValue: max };
  }, [data, weeks, endDate]);

  const totalCols = cells.length > 0 ? cells[cells.length - 1].col + 1 : 0;
  const svgWidth = 28 + totalCols * (CELL_SIZE + CELL_GAP);
  const svgHeight = 20 + 7 * (CELL_SIZE + CELL_GAP);

  return (
    <div className={`overflow-x-auto ${className}`}>
      <svg width={svgWidth} height={svgHeight} className="block">
        {/* Day labels */}
        {DAY_LABELS.map((label, i) =>
          label ? (
            <text
              key={i}
              x={0}
              y={20 + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE * 0.75}
              className="fill-dim"
              fontSize={9}
            >
              {label}
            </text>
          ) : null,
        )}

        {/* Month labels */}
        {months.map((m, i) => (
          <text
            key={i}
            x={28 + m.col * (CELL_SIZE + CELL_GAP)}
            y={12}
            className="fill-dim"
            fontSize={9}
          >
            {m.label}
          </text>
        ))}

        {/* Cells */}
        {cells.map((cell) => {
          const intensity = getIntensity(cell.value, maxValue);
          const opacityMap = [0.06, 0.25, 0.5, 0.75, 1];
          return (
            <rect
              key={cell.date}
              x={28 + cell.col * (CELL_SIZE + CELL_GAP)}
              y={20 + cell.row * (CELL_SIZE + CELL_GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={colour}
              opacity={opacityMap[intensity]}
              className="transition-opacity duration-200"
            >
              <title>{`${cell.date}: ${cell.value}`}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}
