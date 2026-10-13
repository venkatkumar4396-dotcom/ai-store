"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface UsageDataPoint {
  date: string;
  inbound: number;
  outbound: number;
  total: number;
}

interface DashboardUsageChartProps {
  data: UsageDataPoint[];
}

export function DashboardUsageChart({ data }: DashboardUsageChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(500);
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const height = 220;
  const paddingX = 40;
  const paddingY = 20;

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="h-[260px] flex flex-col items-center justify-center gap-3 text-[#475569] text-sm">
        <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
          <TrendingUp className="h-5 w-5" />
        </div>
        <span>No analytical usage data available.</span>
      </div>
    );
  }

  // Detect empty activity state across all days
  const totalActivity = data.reduce((acc, d) => acc + (d.total || (d.inbound + d.outbound)), 0);
  const isAllZero = totalActivity === 0;

  // Find max value for scaling
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.inbound, d.outbound, 10)),
    10
  );

  const pointsCount = data.length;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Calculate coordinates
  const getCoordinates = (type: "inbound" | "outbound") => {
    return data.map((d, idx) => {
      const x = paddingX + (idx / (pointsCount - 1)) * chartWidth;
      const val = type === "inbound" ? d.inbound : d.outbound;
      const y = paddingY + chartHeight - (val / maxVal) * chartHeight;
      return { x, y };
    });
  };

  const inboundCoords = getCoordinates("inbound");
  const outboundCoords = getCoordinates("outbound");

  // Create path strings
  const getPathString = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return "";
    return coords.reduce(
      (path, c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `${path} L ${c.x} ${c.y}`),
      ""
    );
  };

  const getAreaPathString = (coords: { x: number; y: number }[]) => {
    const linePath = getPathString(coords);
    if (!linePath) return "";
    return `${linePath} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`;
  };

  const inboundPath = getPathString(inboundCoords);
  const outboundPath = getPathString(outboundCoords);
  const inboundAreaPath = getAreaPathString(inboundCoords);
  const outboundAreaPath = getAreaPathString(outboundCoords);

  // Format date labels
  const formatDateLabel = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Find closest point to mouse for interactivity
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    
    // Find index of closest coordinate
    let closestIdx = 0;
    let minDiff = Infinity;
    
    for (let i = 0; i < pointsCount; i++) {
      const xCoord = paddingX + (i / (pointsCount - 1)) * chartWidth;
      const diff = Math.abs(mouseX - xCoord);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setHoveredIdx(closestIdx);
  };

  return (
    <div ref={containerRef} className="w-full space-y-4">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#4F46E5]" />
          <span className="text-sm font-bold text-[#0F172A] dark:text-zinc-100">AI Usage Frequency</span>
          {isAllZero && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] dark:bg-amber-500/10 dark:text-amber-400">
              No requests recorded this week
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-[#334155] dark:text-zinc-300">
            <span className="w-2.5 h-2.5 rounded bg-[#4F46E5]" /> Inbound
          </span>
          <span className="flex items-center gap-1.5 text-[#334155] dark:text-zinc-300">
            <span className="w-2.5 h-2.5 rounded bg-[#0284C7]" /> Outbound
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative bg-[#F8FAFC] dark:bg-zinc-950/40 border border-[rgba(15,23,42,0.10)] dark:border-white/5 rounded-xl p-4 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-violet-500/0 to-cyan-500/0 group-hover:from-indigo-500/2 group-hover:to-cyan-500/2 transition-all duration-500 pointer-events-none" />

        {isAllZero && (
          <div className="absolute inset-0 flex items-center justify-center z-15 pointer-events-none">
            <div className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-950/85 border border-[#CBD5E1] dark:border-zinc-800 shadow-md flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
              <span className="text-xs font-semibold text-[#475569] dark:text-zinc-300">
                No requests recorded this week
              </span>
            </div>
          </div>
        )}
        
        <svg
          width="100%"
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(null)}
          className="relative z-10 overflow-visible cursor-crosshair"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingY + ratio * chartHeight;
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="var(--glass-border)"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Vertical indicator line on hover */}
          {hoveredIdx !== null && (
            <line
              x1={paddingX + (hoveredIdx / (pointsCount - 1)) * chartWidth}
              y1={paddingY}
              x2={paddingX + (hoveredIdx / (pointsCount - 1)) * chartWidth}
              y2={height - paddingY}
              stroke="rgba(139, 92, 246, 0.25)"
              strokeWidth="2"
            />
          )}

          {/* Inbound Area & Path */}
          <motion.path
            initial={{ d: `M ${paddingX} ${height - paddingY} L ${width - paddingX} ${height - paddingY}` }}
            animate={{ d: inboundAreaPath }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            fill="url(#inboundGrad)"
          />
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            d={inboundPath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Outbound Area & Path */}
          <motion.path
            initial={{ d: `M ${paddingX} ${height - paddingY} L ${width - paddingX} ${height - paddingY}` }}
            animate={{ d: outboundAreaPath }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            fill="url(#outboundGrad)"
          />
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            d={outboundPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Horizontal Labels */}
          {data.map((d, idx) => {
            const x = paddingX + (idx / (pointsCount - 1)) * chartWidth;
            return (
              <text
                key={idx}
                x={x}
                y={height - 2}
                fill="#52525b"
                fontSize="10"
                fontWeight="500"
                textAnchor="middle"
              >
                {formatDateLabel(d.date)}
              </text>
            );
          })}

          {/* Hover nodes */}
          {hoveredIdx !== null && (
            <>
              {/* Inbound node */}
              <circle
                cx={inboundCoords[hoveredIdx].x}
                cy={inboundCoords[hoveredIdx].y}
                r="6"
                fill="#6366f1"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="2"
                style={{ filter: "drop-shadow(0 0 6px rgba(99,102,241,0.6))" }}
              />
              {/* Outbound node */}
              <circle
                cx={outboundCoords[hoveredIdx].x}
                cy={outboundCoords[hoveredIdx].y}
                r="6"
                fill="#06b6d4"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="2"
                style={{ filter: "drop-shadow(0 0 6px rgba(6,182,212,0.6))" }}
              />
            </>
          )}
        </svg>

        {/* Dynamic Interactive Tooltip Card */}
        {hoveredIdx !== null && (
          <div
            className="absolute z-20 pointer-events-none p-3.5 bg-white/95 dark:bg-zinc-950/90 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col gap-1.5 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: Math.max(
                12,
                Math.min(
                  width - 180,
                  paddingX + (hoveredIdx / (pointsCount - 1)) * chartWidth - 85
                )
              ),
              top: 10,
              minWidth: "155px",
            }}
          >
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
              {new Date(data[hoveredIdx].date).toLocaleDateString(undefined, {
                 month: "long",
                 day: "numeric",
                 year: "numeric",
               })}
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600 dark:text-zinc-400">Inbound Messages</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {data[hoveredIdx].inbound}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600 dark:text-zinc-400">Outbound Replies</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {data[hoveredIdx].outbound}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-white/5 my-1" />
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-900 dark:text-zinc-100">Total Messages</span>
                <span className="font-mono text-slate-900 dark:text-zinc-100">
                  {data[hoveredIdx].total}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
