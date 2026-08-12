"use client";

import * as React from "react";
import { Search, User2, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatTime } from "@/lib/utils";
import type { Contact } from "@/types";

interface ChatListProps {
  contacts: Contact[];
  selectedContactId?: string;
  onSelectContact: (contact: Contact) => void;
}

export function ChatList({ contacts, selectedContactId, onSelectContact }: ChatListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  );

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "lead":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "vip":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "support":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
    }
  };

  return (
    <div className="flex flex-col h-full border border-white/10 bg-zinc-950/20 rounded-xl overflow-hidden text-white">
      {/* Search Header */}
      <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-400">
          <MessageSquare className="h-4.5 w-4.5" />
          Active Conversations
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 placeholder-zinc-500 h-9"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No contacts found
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = contact.id === selectedContactId;
              return (
                <button
                  key={contact.id}
                  onClick={() => onSelectContact(contact)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all relative group",
                    isSelected
                      ? "bg-indigo-600/10 border-l-2 border-indigo-500"
                      : "hover:bg-white/5"
                  )}
                >
                  <Avatar className="h-10 w-10 border border-white/5 shrink-0">
                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-sm">
                      <User2 className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-white truncate group-hover:text-indigo-300 transition-colors">
                        {contact.name}
                      </span>
                      {contact.lastMessageTime && (
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {formatTime(contact.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    {contact.lastMessage && (
                      <p className="text-xs text-zinc-400 truncate leading-relaxed pr-2">
                        {contact.lastMessage}
                      </p>
                    )}
                    {contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {contact.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className={cn("text-[9px] px-1.5 py-0", getTagColor(tag))}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {contact.unreadCount > 0 && (
                    <span className="absolute right-3 top-3 h-5 min-w-[20px] px-1.5 rounded-full bg-indigo-600 text-[10px] font-bold flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                      {contact.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
