"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { useThemeColors } from "./useThemeColors";

export function BarRanking({ data }: { data: { name: string; percentage: number }[] }) {
  const c = useThemeColors();
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 48, top: 4, bottom: 4 }} barCategoryGap={10}>
          <CartesianGrid horizontal={false} stroke={c.line} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: c.muted }}
            stroke={c.line}
          />
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: c.ink }} stroke={c.line} />
          <Tooltip
            cursor={{ fill: c.line, opacity: 0.35 }}
            contentStyle={{ background: c.surface, border: `1px solid ${c.line}`, borderRadius: 10, fontSize: 12 }}
            formatter={(v: unknown) => [`${Number(v).toFixed(2)}%`, "Kecocokan"]}
          />
          <Bar dataKey="percentage" radius={[0, 6, 6, 0]}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={idx === 0 ? c.brand : c.muted} fillOpacity={idx === 0 ? 1 : 0.45} />
            ))}
            <LabelList
              dataKey="percentage"
              position="right"
              formatter={(v: unknown) => `${Number(v).toFixed(1)}%`}
              style={{ fontSize: 11, fill: c.ink, fontFamily: "var(--font-mono)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
