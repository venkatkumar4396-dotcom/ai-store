"use client";

import * as React from "react";
import { Zap, MessageCircle, FileText, Globe, User, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatTime, formatDate } from "@/lib/utils";
import type { ActivityItem } from "@/types";

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "bot_activated":
        return {
          icon: <Zap className="h-4 w-4" />,
          colorClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        };
      case "message_sent":
        return {
          icon: <MessageCircle className="h-4 w-4" />,
          colorClass: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
        };
      case "file_changed":
        return {
          icon: <FileText className="h-4 w-4" />,
          colorClass: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
        };
      case "api_call":
        return {
          icon: <Globe className="h-4 w-4" />,
          colorClass: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
        };
      default:
        return {
          icon: <User className="h-4 w-4" />,
          colorClass: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
        };
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return formatDate(timestamp);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
  };

  return (
    <Card className="h-full border border-white/[0.06] bg-zinc-950/40 relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-400 animate-pulse-glow" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No recent activity to report.
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="relative border-l border-white/5 ml-3 pl-6 space-y-5"
          >
            {activities.map((activity) => {
              const { icon, colorClass } = getActivityIcon(activity.type);
              return (
                <motion.div
                  key={activity.id}
                  variants={itemVariants}
                  className="relative group"
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[35px] top-1 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${colorClass}`}
                  >
                    {icon}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-sm text-white group-hover:text-indigo-300 transition-colors">
                        {activity.title}
                      </span>
                      <span className="text-[11px] text-zinc-500 shrink-0 font-medium">
                        {getRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400">{activity.description}</span>
                    
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-1.5 p-2 rounded bg-white/[0.02] text-[10px] text-zinc-500 border border-white/[0.04] font-mono overflow-x-auto">
                        {JSON.stringify(activity.metadata)}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
