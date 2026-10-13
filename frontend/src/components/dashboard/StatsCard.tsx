"use client";

import * as React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: number;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  icon: string;
  prefix?: string;
  suffix?: string;
  trend?: number[];
}

export function StatsCard({
  label,
  value,
  change = 0,
  changeType = "neutral",
  icon,
  prefix = "",
  suffix = "",
  trend,
}: StatsCardProps) {
  // Get Icon dynamically
  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Activity;

  // Generate dynamic sparkline data based on changeType if no custom trend is provided
  const sparklineData = React.useMemo(() => {
    if (trend && trend.length >= 2) return trend;
    switch (changeType) {
      case "increase":
        return [30, 45, 40, 65, 55, 80];
      case "decrease":
        return [80, 60, 65, 45, 50, 30];
      case "neutral":
      default:
        return [50, 52, 48, 51, 49, 50];
    }
  }, [trend, changeType]);

  const sparklineColor = React.useMemo(() => {
    switch (changeType) {
      case "increase":
        return "#10b981"; // emerald-500
      case "decrease":
        return "#f43f5e"; // rose-500
      case "neutral":
      default:
        return "#71717a"; // zinc-500
    }
  }, [changeType]);

  // Generate points for SVG polyline
  const polylinePoints = React.useMemo(() => {
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const height = 30;
    const width = 70;
    return sparklineData
      .map((val, index) => {
        const x = (index / (sparklineData.length - 1)) * width;
        const y = height - ((val - min) / range) * height + 2; // Add padding
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [sparklineData]);

  return (
    <Card className="relative overflow-hidden group rounded-[16px] border border-[rgba(15,23,42,0.10)] dark:border-white/[0.06] bg-white dark:bg-zinc-950/40 shadow-sm hover-lift">
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-violet-500/0 to-cyan-500/0 group-hover:from-indigo-500/5 group-hover:to-cyan-500/5 transition-all duration-500 pointer-events-none" />
      
      <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] text-[#475569] dark:text-zinc-400 font-semibold tracking-wide uppercase">{label}</span>
          <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-white/5 border border-[#C7D2FE] dark:border-white/10 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400 group-hover:bg-[#4F46E5] group-hover:text-white transition-colors">
            <IconComponent className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-[34px] font-extrabold tracking-tight text-[#0F172A] dark:text-white leading-none">
              <AnimatedCounter value={value ?? 0} prefix={prefix} suffix={suffix} />
            </h2>
            {change !== undefined && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {changeType === "increase" && (
                  <span className="flex items-center text-[11px] font-semibold text-[#166534] bg-[#DCFCE7] dark:text-emerald-400 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-[#BBF7D0] dark:border-emerald-500/15">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    {change}%
                  </span>
                )}
                {changeType === "decrease" && (
                  <span className="flex items-center text-[11px] font-semibold text-[#B91C1C] bg-[#FEE2E2] dark:text-rose-400 dark:bg-rose-500/10 px-2 py-0.5 rounded-full border border-[#FECACA] dark:border-rose-500/15">
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    {change}%
                  </span>
                )}
                {changeType === "neutral" && (
                  <span className="flex items-center text-[11px] font-semibold text-[#334155] bg-[#F1F5F9] dark:text-zinc-300 dark:bg-zinc-500/10 px-2 py-0.5 rounded-full border border-[#CBD5E1] dark:border-zinc-500/15">
                    <Minus className="h-3 w-3 mr-0.5" />
                    {change}%
                  </span>
                )}
                <span className="text-[11px] text-[#475569] dark:text-zinc-500 font-medium">vs last month</span>
              </div>
            )}
          </div>

          {/* Sparkline Chart */}
          <div className="shrink-0 h-[34px] w-[70px] relative">
            <svg width="70" height="34" className="overflow-visible">
              <polyline
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
                points={polylinePoints}
                className="sparkline"
              />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
