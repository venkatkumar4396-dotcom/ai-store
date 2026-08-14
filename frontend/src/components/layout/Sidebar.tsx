"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Store,
  MessageCircle,
  FileSearch,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronDown,
  LogOut,
  User,
  TrendingUp,
  Rocket,
  FlaskConical,
  GraduationCap,
  Workflow,
  Plane,
  FileText,
  Brain,
  Crown,
  CheckSquare,
  Compass,
  Target,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api";
import { useDeployedBots } from "@/lib/DeployedBotsContext";
import { ROUTE_TO_BOT_ID } from "@/lib/nav-bot-map";

interface NavGroup {
  items: { label: string; href: string; icon: string; badge?: string }[];
  label: string;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    label: "AI Agents",
    items: [
      { label: "Booking Hub", href: "/booking-hub", icon: "Brain" },
      { label: "Travel Booking", href: "/travel-booking", icon: "Plane" },
      { label: "Compass Travel Advisor", href: "/compass", icon: "Compass" },
      { label: "Stock Intelligence", href: "/stock-intelligence", icon: "TrendingUp", badge: "New" },
      { label: "Career Accelerator", href: "/career-accelerator", icon: "GraduationCap" },
      { label: "Productivity", href: "/productivity", icon: "CheckSquare" },
      { label: "Document Agent", href: "/document-agent", icon: "FileText" },
      { label: "Startup Co-Founder", href: "/startup-cofounder", icon: "Rocket" },
      { label: "Research Scientist", href: "/research-scientist", icon: "FlaskConical" },
      { label: "Business Automator", href: "/business-automator", icon: "Workflow" },
      { label: "Sales Agent", href: "/sales-agent", icon: "Target", badge: "New" },
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
    items: [
      { label: "Admin Console", href: "/admin", icon: "ShieldCheck", badge: "Admin" },
      { label: "Settings", href: "/settings", icon: "Settings" },
    ],
  },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
  CheckSquare,
  Compass,
  Target,
  ShieldCheck,
};

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    Overview: true,
    "AI Agents": true,
    Tools: true,
    System: true,
  });
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
        // silently fail — keep default
      }
    };
    fetchProfile();
  }, []);

  const initials = React.useMemo(() => {
    const parts = profile.name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }, [profile.name]);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  /** Check if a nav item should be visible based on deployment status */
  const isNavItemVisible = (href: string): boolean => {
    const requiredBotId = ROUTE_TO_BOT_ID[href];
    // If not in the map, it's always visible (Dashboard, Bot Store, Settings, AI Playground)
    if (!requiredBotId) return true;
    // While loading, hide gated items to avoid flash
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
    <motion.aside
      animate={{ width: isCollapsed ? 70 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-screen bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-200/10 dark:border-white/[0.06] shrink-0 sticky top-0 text-zinc-100 z-40 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-200/10 dark:border-white/[0.06]">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-500 flex items-center justify-center font-bold text-[#ffffff] shadow-lg shadow-indigo-500/20">
                N
              </div>
              <span className="font-bold text-lg gradient-text-white">
                Nexora
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-500 flex items-center justify-center font-bold text-[#ffffff] mx-auto shadow-lg shadow-indigo-500/20">
            N
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/10 h-8 w-8"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform duration-300", isCollapsed && "rotate-180")}
          />
        </Button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto scrollbar-none space-y-1">
        {NAV_GROUPS.map((group) => {
          // Filter visible items within this group
          const visibleItems = group.items.filter((item) => isNavItemVisible(item.href));

          // Hide entire group if no visible items
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-1">
              {/* Group Header */}
              {!isCollapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest hover:text-zinc-400 transition-colors"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      !expandedGroups[group.label] && "-rotate-90"
                    )}
                  />
                </button>
              )}

              {/* Collapsed divider */}
              {isCollapsed && group.label !== "Overview" && (
                <div className="mx-3 my-2 h-px bg-white/5" />
              )}

              {/* Group Items */}
              <AnimatePresence initial={false}>
                {(isCollapsed || expandedGroups[group.label]) && (
                  <motion.div
                    initial={isCollapsed ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden space-y-0.5"
                  >
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = ICON_MAP[item.icon] || Sparkles;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={isCollapsed ? item.label : undefined}
                          className={cn(
                            "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                            isCollapsed && "justify-center px-0 mx-1",
                            isActive
                              ? "text-indigo-400 bg-indigo-600/10"
                              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/10"
                          )}
                        >
                          {/* Active indicator pill */}
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-active"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-full shadow-md shadow-indigo-500/50"
                              transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                          )}

                          <span className={cn(
                            "transition-colors shrink-0",
                            isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                          )}>
                            <Icon className="h-[18px] w-[18px]" />
                          </span>

                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.2, delay: 0.05 }}
                              className="flex-1 truncate"
                            >
                              {item.label}
                            </motion.span>
                          )}

                          {/* Badge */}
                          {!isCollapsed && item.badge && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-full">
                              {item.badge}
                            </span>
                          )}

                          {/* Active glow dot (collapsed) */}
                          {isActive && isCollapsed && (
                            <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-md shadow-indigo-400/50" />
                          )}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Upgrade Banner (collapsed = hidden) */}
      {!isCollapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-transparent border border-indigo-500/10">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold text-white">Upgrade to Pro</span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed mb-2">
            Unlock unlimited agents, API access, and priority support.
          </p>
          <Button className="w-full h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold" asChild>
            <Link href="/billing">View Plans</Link>
          </Button>
        </div>
      )}

      {/* User Info / Footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
          <Avatar className="h-9 w-9 border border-zinc-200/10 dark:border-white/10 shrink-0 shadow-lg shadow-indigo-500/5">
            <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-[#ffffff] font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold truncate text-zinc-100">{profile.name}</span>
              <span className="text-[11px] text-zinc-500 truncate">{profile.email || "Free Plan"}</span>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-full mt-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.aside>
  );
}
