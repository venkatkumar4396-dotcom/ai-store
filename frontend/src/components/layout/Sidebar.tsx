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

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

interface NavCategory {
  name: string;
  items: NavItem[];
}

interface NavGroup {
  label: string;
  items?: NavItem[];
  categories?: NavCategory[];
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
    categories: [
      {
        name: "Finance",
        items: [
          { label: "Stock Intelligence", href: "/stock-intelligence", icon: "TrendingUp", badge: "New" },
          { label: "Startup Co-Founder", href: "/startup-cofounder", icon: "Rocket" },
          { label: "Sales Agent", href: "/sales-agent", icon: "Target", badge: "New" },
        ],
      },
      {
        name: "Travel",
        items: [
          { label: "Booking Hub", href: "/booking-hub", icon: "Brain" },
          { label: "Travel Booking", href: "/travel-booking", icon: "Plane" },
          { label: "Compass Travel Advisor", href: "/compass", icon: "Compass" },
        ],
      },
      {
        name: "Productivity",
        items: [
          { label: "Productivity", href: "/productivity", icon: "CheckSquare" },
          { label: "Document Agent", href: "/document-agent", icon: "FileText" },
          { label: "Career Accelerator", href: "/career-accelerator", icon: "GraduationCap" },
          { label: "Business Automator", href: "/business-automator", icon: "Workflow" },
          { label: "Research Scientist", href: "/research-scientist", icon: "FlaskConical" },
        ],
      },
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
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({
    Finance: false,
    Travel: false,
    Productivity: false,
  });
  const { isBotDeployed, isLoading: isBotsLoading } = useDeployedBots();
  const [profile, setProfile] = React.useState({ name: "User", email: "" });

  // Auto-expand category if active route is inside it
  React.useEffect(() => {
    NAV_GROUPS.forEach((group) => {
      if (group.categories) {
        group.categories.forEach((cat) => {
          const hasActive = cat.items.some(
            (item) => pathname === item.href || pathname.startsWith(item.href + "/")
          );
          if (hasActive) {
            setExpandedCategories((prev) => ({ ...prev, [cat.name]: true }));
          }
        });
      }
    });
  }, [pathname]);

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

  const toggleCategory = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  /** Check if a nav item should be visible based on deployment status */
  /** All nav items always visible for immediate workspace access */
  const isNavItemVisible = (_href: string): boolean => {
    return true;
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

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = ICON_MAP[item.icon] || Sparkles;

    return (
      <Link
        key={item.href}
        href={item.href}
        title={isCollapsed ? item.label : undefined}
        className={cn(
          "relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group",
          isCollapsed && "justify-center px-0 mx-1",
          isActive
            ? "text-indigo-600 bg-indigo-50/90 border border-indigo-200/60 font-semibold shadow-xs dark:text-indigo-400 dark:bg-indigo-600/15 dark:border-indigo-500/20"
            : "text-[#334155] dark:text-zinc-400 hover:text-[#0F172A] dark:hover:text-zinc-100 hover:bg-[#F1F5F9] dark:hover:bg-zinc-800/20 font-medium"
        )}
      >
        {/* Active indicator pill */}
        {isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-600 dark:bg-indigo-500 rounded-full shadow-xs transition-all duration-150"
          />
        )}

        <span
          className={cn(
            "transition-colors shrink-0",
            isActive ? "text-indigo-600 dark:text-indigo-400" : "text-[#475569] dark:text-zinc-500 group-hover:text-[#0F172A] dark:group-hover:text-zinc-300"
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>

        {!isCollapsed && (
          <span className="flex-1 truncate transition-opacity duration-150">
            {item.label}
          </span>
        )}

        {/* Badge */}
        {!isCollapsed && item.badge && (
          <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] dark:bg-indigo-600/20 dark:text-indigo-400 dark:border-indigo-500/20 rounded-full">
            {item.badge}
          </span>
        )}

        {/* Active glow dot (collapsed) */}
        {isActive && isCollapsed && (
          <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-xs" />
        )}
      </Link>
    );
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 70 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-screen bg-white dark:bg-zinc-950/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-white/[0.06] shrink-0 sticky top-0 text-slate-800 dark:text-zinc-100 z-40 overflow-hidden shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/80 dark:border-white/[0.06]">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-500 flex items-center justify-center font-bold text-[#ffffff] shadow-md shadow-indigo-600/20">
                N
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                Nexora
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-500 flex items-center justify-center font-bold text-[#ffffff] mx-auto shadow-md shadow-indigo-600/20">
            N
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/10 h-8 w-8 rounded-lg"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform duration-300", isCollapsed && "rotate-180")}
          />
        </Button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto scrollbar-none space-y-1">
        {NAV_GROUPS.map((group) => {
          return (
            <div key={group.label} className="mb-1">
              {/* Group Header */}
              {!isCollapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-[#475569] dark:text-zinc-400 uppercase tracking-widest hover:text-[#0F172A] dark:hover:text-zinc-200 transition-colors"
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
                <div className="mx-3 my-2 h-px bg-slate-200 dark:bg-white/5" />
              )}

              {/* Group Content */}
              <AnimatePresence initial={false}>
                {(isCollapsed || expandedGroups[group.label]) && (
                  <motion.div
                    initial={isCollapsed ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden space-y-0.5"
                  >
                    {/* Render Category-based groups (e.g. AI Agents) */}
                    {group.categories ? (
                      isCollapsed ? (
                        <div className="space-y-0.5">
                          {group.categories
                            .flatMap((c) => c.items)
                            .filter((item) => isNavItemVisible(item.href))
                            .map(renderNavItem)}
                        </div>
                      ) : (
                        <div className="space-y-1 py-0.5">
                          {group.categories.map((cat) => {
                            const isCategoryOpen = !!expandedCategories[cat.name];
                            const catHasActive = cat.items.some(
                              (item) => pathname === item.href || pathname.startsWith(item.href + "/")
                            );
                            const visibleCategoryItems = cat.items.filter((item) => isNavItemVisible(item.href));
                            if (visibleCategoryItems.length === 0) return null;

                            return (
                              <div key={cat.name} className="space-y-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => toggleCategory(cat.name, e)}
                                  className={cn(
                                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all group",
                                    catHasActive
                                      ? "text-indigo-700 bg-indigo-50/80 dark:text-indigo-300 dark:bg-indigo-500/10"
                                      : "text-[#334155] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800/40"
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={cn(
                                        "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
                                        catHasActive ? "bg-indigo-600 dark:bg-indigo-400" : "bg-slate-400 dark:bg-zinc-500 group-hover:bg-slate-600 dark:group-hover:bg-zinc-300"
                                      )}
                                    />
                                    <span className="truncate">{cat.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-white/[0.04]">
                                      {visibleCategoryItems.length}
                                    </span>
                                    <ChevronDown
                                      className={cn(
                                        "h-3 w-3 text-[#475569] dark:text-zinc-500 group-hover:text-[#0F172A] dark:group-hover:text-zinc-300 transition-transform duration-200",
                                        !isCategoryOpen && "-rotate-90"
                                      )}
                                    />
                                  </div>
                                </button>

                                <AnimatePresence initial={false}>
                                  {isCategoryOpen && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2, ease: "easeInOut" }}
                                      className="overflow-hidden space-y-0.5 pl-2 ml-2 border-l border-slate-200 dark:border-zinc-800/60"
                                    >
                                      {visibleCategoryItems.map(renderNavItem)}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      /* Render standard flat group items */
                      group.items
                        ?.filter((item) => isNavItemVisible(item.href))
                        .map(renderNavItem)
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Upgrade Banner (collapsed = hidden) */}
      {!isCollapsed && (
        <div className="mx-3 mb-3 p-3 rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50/50 to-white dark:from-indigo-600/10 dark:via-violet-600/5 dark:to-transparent border border-indigo-100 dark:border-indigo-500/10 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Upgrade to Pro</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed mb-2.5">
            Unlock unlimited agents, API access, and priority compute.
          </p>
          <Button className="w-full h-8 text-xs bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-xl shadow-xs" asChild>
            <Link href="/billing">View Plans</Link>
          </Button>
        </div>
      )}

      {/* User Info / Footer */}
      <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.06]">
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
          <Avatar className="h-9 w-9 border border-slate-200 dark:border-white/10 shrink-0 shadow-xs bg-[#4F46E5]">
            <AvatarFallback className="bg-[#4F46E5] bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-semibold text-sm" style={{ backgroundColor: "#4F46E5" }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold truncate text-slate-900 dark:text-zinc-100">{profile.name}</span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-500 truncate">{profile.email || "Free Plan"}</span>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg shrink-0"
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
