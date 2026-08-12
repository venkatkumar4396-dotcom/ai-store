"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Store,
  Plane,
  FileText,
  Brain,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeployedBots } from "@/lib/DeployedBotsContext";
import { ROUTE_TO_BOT_ID } from "@/lib/nav-bot-map";

export function BottomNav() {
  const pathname = usePathname();
  const { isBotDeployed, isLoading: isBotsLoading } = useDeployedBots();

  // If path is auth (login/register) or main home landing page, do not render BottomNav
  const isAuthOrLanding = pathname === "/" || pathname === "/login" || pathname === "/register";

  if (isAuthOrLanding) return null;

  // All possible bottom nav items
  const allItems = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Booking", href: "/booking-hub", icon: Brain },
    { label: "Travel", href: "/travel-booking", icon: Plane },
    { label: "Docs", href: "/document-agent", icon: FileText },
    { label: "Store", href: "/bots", icon: Store },
  ];

  // Filter items based on deployed bots
  const items = allItems.filter((item) => {
    const requiredBotId = ROUTE_TO_BOT_ID[item.href];
    if (!requiredBotId) return true; // Always visible (Home, Store)
    if (isBotsLoading) return false;
    return isBotDeployed(requiredBotId);
  });

  // If only "Home" and "Store" are left, also add Settings for a cleaner bar
  if (items.length <= 2) {
    items.push({ label: "Settings", href: "/settings", icon: Settings });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/75 border-t border-white/10 backdrop-blur-md z-[45] px-4 flex items-center justify-around text-white">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 h-full relative py-1 group"
          >
            <span
              className={cn(
                "transition-all p-1.5 rounded-lg",
                isActive
                  ? "text-indigo-400 bg-indigo-600/10 scale-110"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span
              className={cn(
                "text-[9px] font-semibold mt-0.5 tracking-tight",
                isActive ? "text-indigo-450" : "text-zinc-500"
              )}
            >
              {item.label}
            </span>

            {/* Neon Active Dot */}
            {isActive && (
              <motion.span
                layoutId="activeBottomDot"
                className="absolute top-1 w-1 h-1 rounded-full bg-indigo-450 shadow-md shadow-indigo-400"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
