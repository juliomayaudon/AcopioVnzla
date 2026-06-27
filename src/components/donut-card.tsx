"use client";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatNumber } from "@/lib/utils";

// Tarjeta de dona con leyenda lateral (autocontenida)
export function DonutCard({ title, data, emptyText }: {
  title: string;
  data: { name: string; value: number; color: string }[];
  emptyText: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      {total === 0 ? (
        <div className="flex items-center justify-center h-44 text-gray-400 text-sm">{emptyText}</div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={170} className="max-w-[190px]">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
                innerRadius={46} outerRadius={72} paddingAngle={2}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => formatNumber(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 w-full space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
            {data.filter(d => d.value > 0).map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-gray-600 truncate flex-1">{d.name}</span>
                <span className="font-semibold text-gray-800">{formatNumber(d.value)}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{Math.round((d.value / total) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
