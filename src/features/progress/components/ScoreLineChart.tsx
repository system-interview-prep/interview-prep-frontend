"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

/** One series (score 0–10 per interview). Marks follow the dataviz specs: 2px line, r4 dots with a surface ring. */
export type ScorePoint = { key: string; x: string; score: number; detail?: string };
/** A vertical rule at a level change; its text is listed under the chart (no in-plot labels to collide). */
export type ScoreMarker = { x: string; label: string };

const LINE = "#204195";
const GRID = "#EAEFF8";
const MUTED = "#607096";

function PointTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  const point = active && payload?.length ? (payload[0].payload as ScorePoint) : null;
  if (!point) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs text-[#14244B] shadow-lg ring-1 ring-[#DCE4F3]">
      <p className="font-semibold">{point.x}</p>
      <p className="mt-0.5 tabular-nums">{point.score.toFixed(1)}/10</p>
      {point.detail && <p className="mt-0.5 text-[#607096]">{point.detail}</p>}
    </div>
  );
}

export function ScoreLineChart({
  points,
  markers = [],
  height = 140,
  ariaLabel,
}: {
  points: ScorePoint[];
  markers?: ScoreMarker[];
  height?: number;
  ariaLabel: string;
}) {
  const last = points[points.length - 1];
  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 16, right: 28, bottom: 0, left: -24 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="x" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" />
          <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} />
          {markers.map((marker) => (
            <ReferenceLine
              key={`${marker.x}-${marker.label}`}
              x={marker.x}
              stroke="#D99A19"
              strokeWidth={1}
              strokeDasharray="0"
            />
          ))}
          <Tooltip content={PointTooltip} cursor={{ stroke: GRID, strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="score"
            stroke={LINE}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={{ r: 4, fill: LINE, stroke: "#FFFFFF", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: LINE, stroke: "#FFFFFF", strokeWidth: 2 }}
            isAnimationActive={false}
            label={(props: { index?: number; x?: number | string; y?: number | string }) =>
              props.index === points.length - 1 && last ? (
                <text
                  x={Number(props.x) + 8}
                  y={Number(props.y) - 8}
                  fontSize={11}
                  fontWeight={600}
                  fill="#14244B"
                >
                  {last.score.toFixed(1)}
                </text>
              ) : (
                <g />
              )
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
