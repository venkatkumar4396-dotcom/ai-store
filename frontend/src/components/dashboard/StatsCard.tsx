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
    <Card className="relative overflow-hidden group border border-white/[0.06] bg-zinc-950/40">
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-violet-500/0 to-cyan-500/0 group-hover:from-indigo-500/5 group-hover:to-cyan-500/5 transition-all duration-500" />
      
      <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">{label}</span>
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
            <IconComponent className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
            </h2>
            {change !== undefined && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {changeType === "increase" && (
                  <span className="flex items-center text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/15">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    {change}%
                  </span>
                )}
                {changeType === "decrease" && (
                  <span className="flex items-center text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full border border-rose-500/15">
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    {change}%
                  </span>
                )}
                {changeType === "neutral" && (
                  <span className="flex items-center text-[10px] font-semibold text-zinc-400 bg-zinc-500/10 px-1.5 py-0.5 rounded-full border border-zinc-500/15">
                    <Minus className="h-3 w-3 mr-0.5" />
                    {change}%
                  </span>
                )}
                <span className="text-[10px] text-zinc-500 font-medium">vs last month</span>
              </div>
            )}
          </div>

          {/* Sparkline Chart */}
          <div className="shrink-0 h-[34px] w-[70px] relative">
            <svg width="70" height="34" className="overflow-visible">
              <polyline
                fill="none"
                stroke={sparklineColor}
                strokeWidth="1.8"
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
