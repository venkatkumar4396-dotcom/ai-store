"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
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
    <header className="h-14 border-b border-zinc-200/10 dark:border-white/[0.06] bg-zinc-950/60 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 text-zinc-100">
      {/* Left: Mobile nav trigger + Brand / Desktop: Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile nav trigger & Brand */}
        <div className="flex items-center gap-2.5 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(true)}
            className="text-zinc-400 hover:text-zinc-100 h-8 w-8"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-[#ffffff] text-xs shadow-lg shadow-indigo-500/20">
              N
            </div>
            <span className="font-semibold text-md">Nexora</span>
          </div>
        </div>

        {/* Desktop Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm">
          <Link
            href="/dashboard"
            className="text-zinc-500 hover:text-zinc-400 transition-colors font-medium"
          >
            Home
          </Link>
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.href}>
              <ChevronRight className="h-3 w-3 text-zinc-600" />
              {crumb.isLast ? (
                <span className="text-zinc-100 font-semibold">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-zinc-500 hover:text-zinc-400 transition-colors font-medium"
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
          className="hidden md:flex items-center gap-2 h-8 px-3 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/10 border border-zinc-200/10 rounded-lg"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="ml-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-800/10 border border-zinc-200/20 rounded text-[10px] text-zinc-500 font-mono">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/10 h-8 w-8"
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
              className="text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/10 h-8 w-8 relative"
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
          <DropdownMenuContent className="w-80 right-0 mt-2" align="end">
            <div className="flex items-center justify-between p-3">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-zinc-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                  No new notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 border-b border-white/5 text-sm transition-colors hover:bg-white/5 flex gap-3 ${
                      !n.read ? "bg-indigo-600/5" : ""
                    }`}
                  >
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                    )}
                    <div className={`flex flex-col gap-0.5 min-w-0 ${n.read ? "ml-5" : ""}`}>
                      <span className="font-semibold text-white text-xs truncate">{n.title}</span>
                      <span className="text-[11px] text-zinc-500">{n.desc}</span>
                      <span className="text-[10px] text-zinc-600 mt-0.5">{n.time}</span>
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
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 border border-white/10 hover:border-indigo-500/30 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-semibold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 right-0 mt-2" align="end">
            <DropdownMenuLabel className="flex flex-col">
              <span className="font-semibold text-white">{profile.name}</span>
              <span className="text-xs text-zinc-500">{profile.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-rose-400 focus:text-rose-300 hover:bg-rose-500/10">
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
