"use client";

import * as React from "react";
import { PlusCircle, Edit3, Trash2, Tag, Move, HelpCircle, User, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate, formatTime } from "@/lib/utils";
import type { FileActivity } from "@/types";

interface ActivityTimelineProps {
  activities: FileActivity[];
  fileNameMap?: Record<string, string>; // Maps fileId to fileName
}

export function ActivityTimeline({ activities, fileNameMap }: ActivityTimelineProps) {
  const getActionStyle = (action: FileActivity["action"]) => {
    switch (action) {
      case "created":
        return {
          icon: <PlusCircle className="h-4 w-4" />,
          colorClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        };
      case "modified":
        return {
          icon: <Edit3 className="h-4 w-4" />,
          colorClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        };
      case "deleted":
        return {
          icon: <Trash2 className="h-4 w-4" />,
          colorClass: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        };
      case "renamed":
        return {
          icon: <Tag className="h-4 w-4" />,
          colorClass: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
        };
      case "moved":
        return {
          icon: <Move className="h-4 w-4" />,
          colorClass: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
        };
      default:
        return {
          icon: <HelpCircle className="h-4 w-4" />,
          colorClass: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
        };
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-400" />
          File Audit Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No recent file activity detected.
          </div>
        ) : (
          <div className="relative border-l border-white/5 ml-3 pl-6 space-y-6">
            {activities.map((activity) => {
              const { icon, colorClass } = getActionStyle(activity.action);
              const fileName = fileNameMap?.[activity.fileId] || "Unknown File";
              
              return (
                <div key={activity.id} className="relative group">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${colorClass}`}>
                    {icon}
                  </div>

                  <div className="flex flex-col gap-1 text-white">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-sm group-hover:text-indigo-300 transition-colors">
                        {activity.description}
                      </span>
                      <span className="text-xs text-zinc-500 shrink-0">
                        {formatDate(activity.timestamp)} at {formatTime(activity.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                      <span className="flex items-center gap-1 font-mono text-[11px] bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        File: {fileName}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-zinc-500" /> {activity.user}
                      </span>
                    </div>

                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 p-2 rounded bg-zinc-950/40 text-[10px] text-zinc-500 border border-white/5 font-mono max-h-24 overflow-y-auto">
                        {Object.entries(activity.metadata).map(([key, val]) => (
                          <div key={key} className="flex gap-1.5">
                            <span className="text-indigo-400 font-semibold">{key}:</span>
                            <span className="truncate">{JSON.stringify(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
