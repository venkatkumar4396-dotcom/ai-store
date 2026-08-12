"use client";

import * as React from "react";
import { FileText, Play, Pause, Archive, Trash, Clock, RefreshCcw, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDate } from "@/lib/utils";
import type { FileTracker } from "@/types";

interface FileGridProps {
  files: FileTracker[];
  onToggleStatus: (id: string, currentStatus: FileTracker["status"]) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetails: (file: FileTracker) => void;
}

export function FileGrid({
  files,
  onToggleStatus,
  onArchive,
  onDelete,
  onViewDetails,
}: FileGridProps) {
  const getStatusBadge = (status: FileTracker["status"]) => {
    switch (status) {
      case "monitoring":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "paused":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "archived":
        return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {files.map((file) => (
        <Card key={file.id} className="h-full flex flex-col justify-between overflow-hidden group">
          <CardHeader className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <Badge variant="outline" className={getStatusBadge(file.status)}>
                {file.status}
              </Badge>
            </div>
            
            <div className="mt-3">
              <CardTitle className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors truncate" title={file.fileName}>
                {file.fileName}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 font-mono truncate mt-1">
                {file.path}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-5 pb-2 text-xs space-y-2.5">
            <div className="flex justify-between items-center text-zinc-400">
              <span>Size:</span>
              <span className="font-medium text-white">{formatBytes(file.fileSize)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Changes Detected:</span>
              <span className="font-medium text-indigo-400 bg-indigo-600/10 px-2 py-0.5 rounded-full border border-indigo-500/10">
                {file.changeCount} changes
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-zinc-500" /> Last Modified:
              </span>
              <span className="font-medium text-zinc-300">{formatDate(file.lastModified)}</span>
            </div>
          </CardContent>

          <CardFooter className="p-5 pt-3 border-t border-white/5 mt-3 flex justify-between gap-2 shrink-0">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleStatus(file.id, file.status)}
                className="h-8 w-8 text-zinc-400 hover:text-white"
                title={file.status === "monitoring" ? "Pause Monitoring" : "Start Monitoring"}
              >
                {file.status === "monitoring" ? <Pause className="h-4 w-4 text-amber-400" /> : <Play className="h-4 w-4 text-emerald-400" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={file.status === "archived"}
                onClick={() => onArchive(file.id)}
                className="h-8 w-8 text-zinc-400 hover:text-white disabled:opacity-30"
                title="Archive File"
              >
                <Archive className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(file.id)}
                className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                title="Delete Tracker"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(file)}
              className="h-8 border-white/10 text-xs hover:bg-white/5 text-zinc-300 hover:text-white"
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> View Logs
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
