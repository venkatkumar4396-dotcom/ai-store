"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Store,
  Brain,
  Sparkles,
  Settings,
  TrendingUp,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Core nav items always visible on mobile
const BOTTOM_NAV_ITEMS = [
  { label: "Home",    href: "/dashboard",         icon: LayoutDashboard },
  { label: "Agents",  href: "/stock-intelligence", icon: TrendingUp },
  { label: "Travel",  href: "/booking-hub",        icon: Plane },
  { label: "AI Chat", href: "/ai-playground",      icon: Sparkles },
  { label: "Store",   href: "/bots",               icon: Store },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on auth and landing pages
  const isAuthOrLanding =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register";
  if (isAuthOrLanding) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[60]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Frosted glass bar */}
      <div className="bg-zinc-950/85 border-t border-white/[0.07] backdrop-blur-2xl px-2 py-1.5">
        <div className="flex items-center justify-around">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5 relative group"
              >
                {/* Active pill indicator */}
                {isActive && (
                  <motion.span
                    layoutId="bottomNavPill"
                    className="absolute inset-0 rounded-xl bg-indigo-600/12 mx-0.5"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}

                <span
                  className={cn(
                    "relative z-10 p-1.5 rounded-lg transition-all duration-200",
                    isActive
                      ? "text-indigo-400 scale-110"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.2 : 1.7} />
                </span>

                <span
                  className={cn(
                    "relative z-10 text-[9px] font-semibold tracking-tight transition-colors duration-200",
                    isActive ? "text-indigo-400" : "text-zinc-600 group-hover:text-zinc-400"
                  )}
                >
                  {item.label}
                </span>

                {/* Active dot */}
                {isActive && (
                  <motion.span
                    layoutId="bottomNavDot"
                    className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/60"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
