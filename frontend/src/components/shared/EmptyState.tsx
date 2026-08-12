import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-xl bg-zinc-950/20 backdrop-blur-sm max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-zinc-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default" className="shadow-lg shadow-indigo-600/20">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
