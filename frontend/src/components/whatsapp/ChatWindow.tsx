"use client";

import * as React from "react";
import { Send, Sparkles, Paperclip, MoreVertical, Smartphone, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Contact, Message } from "@/types";

interface ChatWindowProps {
  contact?: Contact;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isAiEnabled?: boolean;
  onToggleAi?: (enabled: boolean) => void;
}

export function ChatWindow({
  contact,
  messages,
  onSendMessage,
  isAiEnabled = true,
  onToggleAi,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = React.useState("");
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue("");
  };

  if (!contact) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950/20 border border-white/10 rounded-xl p-8">
        <EmptyState
          title="No Active Conversation"
          description="Select a contact from the sidebar to view message history and start chatting."
          icon={Smartphone}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border border-white/10 bg-zinc-950/20 rounded-xl overflow-hidden text-white">
      {/* Contact Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-zinc-950/40">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-white/5">
            <AvatarFallback className="bg-zinc-800 text-zinc-300">
              {contact.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{contact.name}</span>
            <span className="text-xs text-zinc-500">{contact.phoneNumber}</span>
          </div>
        </div>

        {/* AI Auto-reply Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-full px-3 py-1.5">
            <Bot className={isAiEnabled ? "h-4 w-4 text-indigo-400" : "h-4 w-4 text-zinc-500"} />
            <Label htmlFor="ai-toggle" className="text-xs cursor-pointer select-none">
              AI Auto-Reply
            </Label>
            <Switch
              id="ai-toggle"
              checked={isAiEnabled}
              onCheckedChange={onToggleAi}
              className="scale-90"
            />
          </div>
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <MoreVertical className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 p-4 overflow-y-auto" ref={scrollContainerRef}>
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
            No messages yet. Send a message to start the conversation.
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-zinc-950/40 shrink-0 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white shrink-0"
        >
          <Paperclip className="h-4.5 w-4.5" />
        </Button>

        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isAiEnabled ? "Type a reply (AI will learn from this)..." : "Type a message..."}
          className="flex-1 bg-white/5 border-white/10 text-white placeholder-zinc-500 focus-visible:ring-indigo-500 h-10"
        />

        <Button
          type="submit"
          disabled={!inputValue.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
