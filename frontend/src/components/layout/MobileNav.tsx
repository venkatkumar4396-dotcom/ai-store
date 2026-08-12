"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
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
  LogOut,
  Crown,
  CheckSquare,
  Compass,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useDeployedBots } from "@/lib/DeployedBotsContext";
import { ROUTE_TO_BOT_ID } from "@/lib/nav-bot-map";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Store, MessageCircle, FileSearch, Sparkles, Settings,
  TrendingUp, Rocket, FlaskConical, GraduationCap, Workflow, Plane, FileText, Brain, CheckSquare, Compass, Target,
};

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" }],
  },
  {
    label: "AI Agents",
    items: [
      { label: "Booking Hub", href: "/booking-hub", icon: "Brain" },
      { label: "Travel Booking", href: "/travel-booking", icon: "Plane" },
      { label: "Compass Travel Advisor", href: "/compass", icon: "Compass" },
      { label: "Stock Intelligence", href: "/stock-intelligence", icon: "TrendingUp" },
      { label: "Career Accelerator", href: "/career-accelerator", icon: "GraduationCap" },
      { label: "Productivity", href: "/productivity", icon: "CheckSquare" },
      { label: "Document Agent", href: "/document-agent", icon: "FileText" },
      { label: "Startup Co-Founder", href: "/startup-cofounder", icon: "Rocket" },
      { label: "Research Scientist", href: "/research-scientist", icon: "FlaskConical" },
      { label: "Business Automator", href: "/business-automator", icon: "Workflow" },
      { label: "Sales Agent", href: "/sales-agent", icon: "Target" },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Bot Store", href: "/bots", icon: "Store" },
      { label: "WhatsApp", href: "/whatsapp", icon: "MessageCircle" },
      { label: "File Tracker", href: "/file-tracker", icon: "FileSearch" },
      { label: "AI Playground", href: "/ai-playground", icon: "Sparkles" },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/settings", icon: "Settings" }],
  },
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { isBotDeployed, isLoading: isBotsLoading } = useDeployedBots();
  const [profile, setProfile] = React.useState({ name: "User", email: "" });

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (typeof window !== "undefined" && !localStorage.getItem("nexora_logged_in")) return;
      try {
        const res = await api.get("/user/me");
        if (res.data) {
          setProfile({ name: res.data.name || "User", email: res.data.email || "" });
        }
      } catch {
        // keep default
      }
    };
    fetchProfile();
  }, []);

  const initials = React.useMemo(() => {
    if (!profile.name) return "U";
    const parts = profile.name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }, [profile.name]);

  /** Check if a nav item should be visible based on deployment status */
  const isNavItemVisible = (href: string): boolean => {
    const requiredBotId = ROUTE_TO_BOT_ID[href];
    if (!requiredBotId) return true;
    if (isBotsLoading) return false;
    return isBotDeployed(requiredBotId);
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("nexora_logged_in");
      localStorage.removeItem("nexora_auth_token");
      window.location.href = "/login";
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-zinc-950/98 backdrop-blur-2xl border-r border-zinc-200/10 dark:border-white/[0.06] z-[101] flex flex-col text-zinc-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-200/10 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-500 flex items-center justify-center font-bold text-[#ffffff] shadow-lg shadow-indigo-500/20">
                  N
                </div>
                <span className="font-bold text-lg text-zinc-100">Nexora</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-zinc-500 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* User Card */}
            <div className="px-4 py-3 border-b border-zinc-200/10 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-zinc-200/10 dark:border-white/10 shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-[#ffffff] font-semibold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-zinc-100 truncate">{profile.name}</span>
                  <span className="text-[11px] text-zinc-500 truncate">{profile.email || "Free Plan"}</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              {NAV_GROUPS.map((group) => {
                const visibleItems = group.items.filter((item) => isNavItemVisible(item.href));
                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.label} className="mb-2">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                      {group.label}
                    </div>
                    <div className="space-y-0.5">
                      {visibleItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        const Icon = ICON_MAP[item.icon] || Sparkles;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                              isActive
                                ? "text-white bg-indigo-600/10 border-l-2 border-indigo-500"
                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                            )}
                          >
                            <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-indigo-400" : "text-zinc-500")} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Upgrade Banner */}
            <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-transparent border border-indigo-500/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-white">Upgrade to Pro</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed mb-2">
                Unlock unlimited agents & priority support.
              </p>
              <Button className="w-full h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold" asChild>
                <Link href="/billing" onClick={onClose}>View Plans</Link>
              </Button>
            </div>

            {/* Logout */}
            <div className="p-3 border-t border-white/[0.06]">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full flex items-center justify-start gap-3 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sign Out</span>
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
