"use client";

import * as React from "react";
import { Check, CheckCheck, AlertCircle } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.direction === "outgoing";

  const renderStatus = () => {
    switch (message.status) {
      case "sent":
        return <Check className="h-3.5 w-3.5 text-zinc-500" />;
      case "delivered":
        return <CheckCheck className="h-3.5 w-3.5 text-zinc-500" />;
      case "read":
        return <CheckCheck className="h-3.5 w-3.5 text-indigo-400" />;
      case "failed":
        return <AlertCircle className="h-3.5 w-3.5 text-rose-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex w-full mb-3", isOutgoing ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-xl px-4 py-2.5 text-sm shadow-md transition-all relative group flex flex-col gap-1",
          isOutgoing
            ? "bg-indigo-600 text-white rounded-tr-none"
            : "bg-zinc-800 text-zinc-200 rounded-tl-none border border-white/5"
        )}
      >
        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        
        <div className="flex items-center justify-end gap-1.5 self-end mt-1 text-[10px]">
          <span className={isOutgoing ? "text-indigo-200" : "text-zinc-500"}>
            {formatTime(message.timestamp)}
          </span>
          {isOutgoing && renderStatus()}
        </div>
      </div>
    </div>
  );
}
