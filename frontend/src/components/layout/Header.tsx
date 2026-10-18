"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  Sun,
  Moon,
  Menu,
  Settings,
  LogOut,
  User,
  ChevronRight,
  Command,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import api from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileNav } from "./MobileNav";
import { NAV_ITEMS } from "@/lib/constants";

// Map route segments to readable labels
const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  bots: "Bot Store",
  whatsapp: "WhatsApp",
  "file-tracker": "File Tracker",
  "ai-playground": "AI Playground",
  settings: "Settings",
  "travel-booking": "Travel Booking",
  "stock-intelligence": "Stock Intelligence",
  "career-accelerator": "Career Accelerator",
  productivity: "Productivity",
  "document-agent": "Document Agent",
  "startup-cofounder": "Startup Co-Founder",
  "research-scientist": "Research Scientist",
  "business-automator": "Business Automator",
  "booking-hub": "Booking Hub",
  "sales-agent": "Sales Agent",
  compass: "Compass Travel Advisor",
  admin: "Admin",
  billing: "Billing",
};

export function Header() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  const [profile, setProfile] = React.useState({ name: "User", email: "" });

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (typeof window !== "undefined" && !localStorage.getItem("nexora_logged_in")) {
        return;
      }
      try {
        const res = await api.get("/user/me");
        if (res.data) {
          setProfile({
            name: res.data.name || "User",
            email: res.data.email || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile in Header:", err);
      }
    };
    fetchProfile();
  }, []);

  const initials = React.useMemo(() => {
    if (!profile.name) return "U";
    const parts = profile.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }, [profile.name]);
  const [notifications, setNotifications] = React.useState([
    { id: 1, title: "WhatsApp Bot connected", desc: "Session configured successfully", time: "5m ago", read: false },
    { id: 2, title: "File modified detected", desc: "config.json was updated in folder", time: "1h ago", read: false },
    { id: 3, title: "API call warning", desc: "Rate limit reached 90% capacity", time: "2h ago", read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
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

  // Build breadcrumbs from pathname
  const breadcrumbs = React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg, idx) => ({
      label: BREADCRUMB_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
      href: "/" + segments.slice(0, idx + 1).join("/"),
      isLast: idx === segments.length - 1,
    }));
  }, [pathname]);

  // Trigger command palette
  const triggerCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  };

  return (
    <header className="h-14 border-b border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl px-3 md:px-6 flex items-center justify-between sticky top-0 z-30 text-slate-800 dark:text-zinc-100 shrink-0 shadow-xs">
      {/* Left: Mobile nav trigger + Brand / Desktop: Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile nav trigger & Brand */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open navigation menu"
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 h-9 w-9 rounded-xl dark:hover:bg-white/[0.06]"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {/* Current page name on mobile */}
          <span className="font-semibold text-sm text-slate-900 dark:text-white truncate max-w-[140px]">
            {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : "Nexora"}
          </span>
        </div>

        {/* Desktop Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm">
          <Link
            href="/dashboard"
            className="text-[#475569] hover:text-[#0F172A] dark:text-zinc-400 dark:hover:text-white transition-colors font-medium text-xs"
          >
            Home
          </Link>
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.href}>
              <ChevronRight className="h-3 w-3 text-[#475569] dark:text-zinc-600" />
              {crumb.isLast ? (
                <span className="text-[#0F172A] dark:text-white font-semibold text-xs">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-[#475569] hover:text-[#0F172A] dark:text-zinc-400 dark:hover:text-white transition-colors font-medium text-xs"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right Side actions */}
      <div className="flex items-center gap-1.5 md:gap-2 ml-auto">
        {/* Command Palette Trigger - Desktop */}
        <Button
          variant="ghost"
          onClick={triggerCommandPalette}
          className="hidden md:flex items-center gap-2 h-8 px-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 dark:text-zinc-500 dark:hover:text-zinc-400 dark:hover:bg-zinc-800/10 border border-slate-200 dark:border-zinc-200/10 rounded-lg shadow-2xs"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="ml-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800/10 border border-slate-200 dark:border-zinc-200/20 rounded text-[10px] text-slate-600 dark:text-zinc-500 font-mono">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/10 h-8 w-8 rounded-lg"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/10 h-8 w-8 rounded-lg relative"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="absolute w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 right-0 mt-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 shadow-xl rounded-2xl p-0 overflow-hidden" align="end">
            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-white/5">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-zinc-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-slate-400 dark:text-zinc-600" />
                  No new notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-white/5 flex gap-3 ${
                      !n.read ? "bg-indigo-50/40 dark:bg-indigo-600/10" : ""
                    }`}
                  >
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500 mt-2 shrink-0" />
                    )}
                    <div className={`flex flex-col gap-0.5 min-w-0 ${n.read ? "ml-5" : ""}`}>
                      <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">{n.title}</span>
                      <span className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug">{n.desc}</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{n.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 border border-slate-200 dark:border-white/10 hover:border-indigo-500/30 transition-colors cursor-pointer">
              <Avatar className="h-8 w-8 bg-[#4F46E5]">
                <AvatarFallback className="bg-[#4F46E5] bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-semibold text-xs" style={{ backgroundColor: "#4F46E5" }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 right-0 mt-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 shadow-xl rounded-2xl p-1.5" align="end">
            <DropdownMenuLabel className="flex flex-col px-3 py-2">
              <span className="font-semibold text-slate-900 dark:text-white text-sm">{profile.name}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-500 truncate">{profile.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-white/5" />
            <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer rounded-xl">
              <User className="mr-2 h-4 w-4 text-slate-500 dark:text-zinc-400" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer rounded-xl">
              <Settings className="mr-2 h-4 w-4 text-slate-500 dark:text-zinc-400" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-white/5" />
            <DropdownMenuItem onClick={handleLogout} className="text-rose-600 dark:text-rose-400 focus:text-rose-700 dark:focus:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer rounded-xl">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </header>
  );
}
