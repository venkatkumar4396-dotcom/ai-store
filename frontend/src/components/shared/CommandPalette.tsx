"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  Store,
  MessageCircle,
  FileSearch,
  Sparkles,
  Settings,
  TrendingUp,
  Rocket,
  FlaskConical,
  GraduationCap,
  Workflow,
  Plane,
  FileText,
  Brain,
  ArrowRight,
  Command,
  CornerDownLeft,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
  Store: <Store className="h-4 w-4" />,
  MessageCircle: <MessageCircle className="h-4 w-4" />,
  FileSearch: <FileSearch className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Rocket: <Rocket className="h-4 w-4" />,
  FlaskConical: <FlaskConical className="h-4 w-4" />,
  GraduationCap: <GraduationCap className="h-4 w-4" />,
  Workflow: <Workflow className="h-4 w-4" />,
  Plane: <Plane className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Brain: <Brain className="h-4 w-4" />,
};

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return NAV_ITEMS;
    const q = query.toLowerCase();
    return NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q)
    );
  }, [query]);

  // Global keyboard shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Auto-focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex].href);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={() => setIsOpen(false)}
          />

          {/* Command Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[201]"
          >
            <div className="mx-4 bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <Search className="h-5 w-5 text-zinc-500 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search agents, pages, settings..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-zinc-500 font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[320px] overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-zinc-500">
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  filtered.map((item, idx) => (
                    <button
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                        idx === selectedIndex
                          ? "bg-indigo-600/10 text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className={idx === selectedIndex ? "text-indigo-400" : "text-zinc-500"}>
                        {ICON_MAP[item.icon] || <Sparkles className="h-4 w-4" />}
                      </span>
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {idx === selectedIndex && (
                        <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-600">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-zinc-500 font-mono">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-zinc-500 font-mono">
                      <CornerDownLeft className="h-2.5 w-2.5 inline" />
                    </kbd>
                    Select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Command className="h-2.5 w-2.5" />K to toggle
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
