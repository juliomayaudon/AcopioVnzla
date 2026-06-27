import * as React from "react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: "navy" | "cyan" | "green" | "amber";
  suffix?: string;
}

// Iconos en un solo color (gris) para todas las tarjetas
const colors = {
  navy:  "bg-gray-100 text-gray-500",
  cyan:  "bg-gray-100 text-gray-500",
  green: "bg-gray-100 text-gray-500",
  amber: "bg-gray-100 text-gray-500",
};

export function StatCard({ title, value, icon, color = "navy", suffix }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 leading-tight">{title}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
            {typeof value === "number" ? formatNumber(value) : value}
            {suffix && <span className="text-sm font-normal text-gray-400 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={cn("rounded-full p-2 sm:p-3 shrink-0", colors[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
