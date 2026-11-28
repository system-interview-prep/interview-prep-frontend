"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

/** One series (score 0–10 per interview). Marks follow the dataviz specs: 2px line, r4 dots with a surface ring. */
export type ScorePoint = {
  key: string;
  x: string;
  score: number;
  detail?: string;
  /** Smoothed estimate and its 80% band; when given, the raw scores are drawn as faint dots. */
  estimate?: number | null;
  band?: [number, number] | null;
};
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
      {point.estimate != null && <p className="mt-0.5 tabular-nums text-[#204195]">≈ {point.estimate.toFixed(1)}</p>}
      {point.detail && <p className="mt-0.5 text-[#607096]">{point.detail}</p>}
    </div>
  );
}

export function ScoreLineChart({
  points,
  markers = [],
  height = 140,
  target,
  targetLabel,
  ariaLabel,
}: {
  points: ScorePoint[];
  markers?: ScoreMarker[];
  height?: number;
  /** A dashed goal line (e.g. 7/10), labelled at the left edge. */
  target?: number;
  targetLabel?: string;
  ariaLabel: string;
}) {
  const last = points[points.length - 1];
  const smoothed = points.some((p) => p.estimate != null);
  const lastValue = last ? (smoothed && last.estimate != null ? last.estimate : last.score) : null;
  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 16, right: 28, bottom: 0, left: -24 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="x" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" />
          <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} />
          {target !== undefined ? (
            <ReferenceLine
              y={target}
              stroke="#287A4B"
              strokeWidth={1}
              strokeDasharray="4 4"
              label={targetLabel ? { value: targetLabel, position: "insideTopLeft", fontSize: 10, fill: "#287A4B" } : undefined}
            />
          ) : null}
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
          {smoothed && (
            <Area
              type="monotone"
              dataKey="band"
              stroke="none"
              fill={LINE}
              fillOpacity={0.1}
              isAnimationActive={false}
              connectNulls
            />
          )}
          {smoothed && (
            <Line
              type="monotone"
              dataKey="score"
              stroke="none"
              dot={{ r: 3, fill: "#9AA6C2", stroke: "#FFFFFF", strokeWidth: 1 }}
              activeDot={{ r: 5, fill: "#607096", stroke: "#FFFFFF", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          )}
          <Line
            type="monotone"
            dataKey={smoothed ? "estimate" : "score"}
            connectNulls
            stroke={LINE}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={smoothed ? false : { r: 4, fill: LINE, stroke: "#FFFFFF", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: LINE, stroke: "#FFFFFF", strokeWidth: 2 }}
            isAnimationActive={false}
            label={(props: { index?: number; x?: number | string; y?: number | string }) =>
              props.index === points.length - 1 && lastValue !== null ? (
                <text
                  x={Number(props.x) + 8}
                  y={Number(props.y) - 8}
                  fontSize={11}
                  fontWeight={600}
                  fill="#14244B"
                >
                  {lastValue.toFixed(1)}
                </text>
              ) : (
                <g />
              )
            }
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
