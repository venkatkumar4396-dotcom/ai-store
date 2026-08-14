"use client";

import * as React from "react";
import {
  Sparkles,
  ArrowRight,
  Bot as BotIcon,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Zap,
  Plane,
  TrendingUp,
  FileText,
  Sun,
  Sunrise,
  Moon,
  Store,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { BotGrid } from "@/components/dashboard/BotGrid";
import { DashboardUsageChart } from "@/components/dashboard/DashboardUsageChart";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FEATURED_BOTS } from "@/lib/constants";
import type { ActivityItem } from "@/types";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { useDeployedBots } from "@/lib/DeployedBotsContext";
import { ROUTE_TO_BOT_ID } from "@/lib/nav-bot-map";

interface DashboardStats {
  totalUsers: number;
  totalBots: number;
  activeBotInstances: number;
  totalMessages: number;
  totalFileActivities: number;
  recentActivities: unknown[];
  botUsage: unknown[];
  messagesByDay: { date: string; inbound: number; outbound: number; total: number }[];
}

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", icon: <Sunrise className="h-5 w-5 text-amber-400" /> };
  if (hour < 17) return { text: "Good Afternoon", icon: <Sun className="h-5 w-5 text-amber-400" /> };
  return { text: "Good Evening", icon: <Moon className="h-5 w-5 text-indigo-400" /> };
}

const QUICK_ACTIONS = [
  { label: "Travel Search", href: "/travel-booking", icon: Plane, color: "from-blue-600 to-cyan-500" },
  { label: "Stock Analysis", href: "/stock-intelligence", icon: TrendingUp, color: "from-emerald-600 to-green-500" },
  { label: "AI Playground", href: "/ai-playground", icon: Zap, color: "from-violet-600 to-purple-500" },
  { label: "Documents", href: "/document-agent", icon: FileText, color: "from-amber-600 to-orange-500" },
];

export default function OverviewDashboardPage() {
  const { addToast } = useToast();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const greeting = getGreeting();
  const { isBotDeployed, deployedBotIds, isLoading: isBotsLoading, refreshDeployedBots } = useDeployedBots();
  const [userName, setUserName] = React.useState("");

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/user/me");
        if (res.data?.name) setUserName(res.data.name.split(" ")[0]);
      } catch { /* silent */ }
    };
    fetchUser();
  }, []);

  // Quick actions suite always available for mobile & desktop fast launch
  const visibleQuickActions = QUICK_ACTIONS;

  const hasNoDeployedBots = false;

  const fetchDashboardData = React.useCallback(async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await api.get("/analytics/dashboard");
      setStats(res.data);
      setError(null);
      if (showToast) {
        addToast({ type: "success", title: "Data Synced", description: "Dashboard metrics updated successfully." });
      }
    } catch (err: unknown) {
      console.error("Failed to load dashboard metrics:", err);
      setError("Failed to sync dashboard metrics. Please check backend connection.");
      if (showToast) {
        addToast({ type: "error", title: "Sync Failed", description: "Could not fetch dashboard data." });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [addToast]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const activeBots = React.useMemo(() => {
    if (isBotsLoading) return FEATURED_BOTS.slice(0, 3);
    const deployed = FEATURED_BOTS.filter((b) => deployedBotIds.has(b.id));
    return deployed.length > 0 ? deployed.slice(0, 6) : FEATURED_BOTS.slice(0, 3);
  }, [isBotsLoading, deployedBotIds]);

  const handleConfigure = (botId: string) => {
    const bot = FEATURED_BOTS.find(b => b.id === botId);
    if (!bot) return;

    // Specific bot overrides first, then category-based routing
    const BOT_ROUTES: Record<string, string> = {
      "bot-1": "/whatsapp",
      "bot-4": "/file-tracker",
      "bot-travel": "/travel-booking",
      "bot-hotel": "/booking-hub",
      "bot-2": "/stock-intelligence",
    };
    const CATEGORY_ROUTES: Record<string, string> = {
      communication: "/whatsapp",
      productivity: "/file-tracker",
      analytics: "/stock-intelligence",
      automation: "/business-automator",
    };

    const target = BOT_ROUTES[botId] || CATEGORY_ROUTES[bot.category] || "/settings";
    window.location.href = target;
  };

  const handleDeploy = async (botId: string) => {
    try {
      await api.post(`/bots/instances/${botId}/install`);
      addToast({ type: "success", title: "Agent Deployed!", description: "Your AI agent is now active and ready to use." });
      fetchDashboardData();
      refreshDeployedBots();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMsg = error.response?.data?.error || error.message;
      if (errorMsg?.includes("already installed")) {
        addToast({ type: "info", title: "Already Installed", description: "This agent is already active in your workspace." });
      } else {
        addToast({ type: "error", title: "Deploy Failed", description: errorMsg || "Could not deploy the agent." });
      }
    }
  };

  // Map backend activity logs to standard ActivityItem for frontend
  const getMappedActivities = (): ActivityItem[] => {
    if (!stats || !stats.recentActivities) return [];
    
    return stats.recentActivities.map((item: unknown) => {
      const act = item as { id: string; action: string; metadata?: string; timestamp: string };
      let type: ActivityItem["type"] = "user_action";
      
      if (act.action.includes("activated") || act.action.includes("installed") || act.action.includes("configure")) {
        type = "bot_activated";
      } else if (act.action.includes("message") || act.action.includes("broadcast")) {
        type = "message_sent";
      } else if (act.action.includes("file") || act.action.includes("tracker")) {
        type = "file_changed";
      } else if (act.action.includes("api") || act.action.includes("model") || act.action.includes("completion")) {
        type = "api_call";
      }

      // Title mapping
      let title = act.action.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      if (act.action === "whatsapp_initialized") title = "WhatsApp AI Channel Initialized";
      else if (act.action === "whatsapp_message_sent") title = "WhatsApp Client Message Outbound";
      else if (act.action === "whatsapp_broadcast_started") title = "WhatsApp Broadcast Campaign Initiated";
      else if (act.action === "whatsapp_business_configured") title = "WhatsApp AI Assistant Profile Configured";
      else if (act.action === "bot_activated") title = "AI Agent Installed";

      // Description mapping
      let description = `Action handled successfully.`;
      if (act.action === "login") {
        description = "Dashboard control session successfully authenticated.";
      } else if (act.action === "whatsapp_message_sent") {
        let dest = null;
        if (act.metadata) {
          try {
            const meta = JSON.parse(act.metadata) as { to?: string };
            dest = meta.to;
          } catch {
            dest = act.metadata;
          }
        }
        description = `Message response generated by LLM dispatched to ${dest || "recipient"}.`;
      } else if (act.action === "whatsapp_broadcast_started") {
        description = "Broadcast message pipeline queued for scheduled recipients.";
      } else if (act.action === "file_tracker_created") {
        description = "Active file monitoring directory hook successfully registered.";
      }

      return {
        id: act.id,
        type,
        title,
        description,
        timestamp: act.timestamp,
      };
    });
  };

  if (isLoading && !stats) {
    return (
      <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-4 text-zinc-400">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
        </div>
        <span className="text-sm font-semibold animate-pulse">Syncing workspace metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══════════ WELCOME BANNER ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-indigo-600/[0.08] via-violet-600/[0.04] to-transparent p-6 md:p-8"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-violet-500/8 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {greeting.icon}
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {greeting.text}{userName ? `, ${userName}` : ""}
              </h1>
            </div>
            <p className="text-zinc-400 text-sm max-w-lg">
              Monitor your AI agents, track performance, and manage your automated workflows from one unified control center.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              variant="outline"
              className="border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Sync
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 gap-1.5" asChild>
              <Link href="/bots">
                Deploy Agent <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════ QUICK ACTIONS ═══════════ */}
      {hasNoDeployedBots ? (
        /* ── Get Started CTA for new users ── */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border border-dashed border-indigo-500/25 bg-gradient-to-br from-indigo-600/[0.06] via-violet-600/[0.03] to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/8 rounded-full blur-2xl pointer-events-none" />
            <CardContent className="p-8 md:p-10 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-500/20 shrink-0">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h3 className="text-xl font-bold text-white">Get Started with AI Agents</h3>
                  <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">
                    Welcome to Nexora! Deploy your first AI agent from the Bot Store to unlock powerful features — stock analysis, travel booking, document processing, and more.
                  </p>
                </div>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 px-6 h-11 font-semibold gap-2 shrink-0"
                  asChild
                >
                  <Link href="/bots">
                    <Store className="h-4 w-4" />
                    Browse Bot Store
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : visibleQuickActions.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {visibleQuickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link
                  href={action.href}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-zinc-950/40 hover:bg-white/[0.04] hover:border-indigo-500/20 transition-all duration-200"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : null}

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {/* ═══════════ STATS WIDGETS ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Active Agents"
          value={stats?.activeBotInstances || 0}
          change={0}
          changeType="neutral"
          icon="Bot"
        />
        <StatsCard
          label="Messages Handled"
          value={stats?.totalMessages || 0}
          change={0}
          changeType="neutral"
          icon="MessageSquare"
        />
        <StatsCard
          label="Files Monitored"
          value={stats?.totalFileActivities || 0}
          change={0}
          changeType="neutral"
          icon="FileSearch"
        />
        <StatsCard
          label="Uptime Rate"
          value={99.9}
          change={0}
          changeType="neutral"
          icon="Shield"
          suffix="%"
        />
      </div>

      {/* ═══════════ MAIN GRID ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Usage Chart */}
          <Card className="border border-white/[0.06] bg-zinc-950/40 relative overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">System Usage Analytics</CardTitle>
              <CardDescription className="text-zinc-500 text-xs">
                Real-time monitor of LLM-generated message payloads and responses.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <DashboardUsageChart data={stats?.messagesByDay || []} />
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <ActivityFeed activities={getMappedActivities()} />
        </div>

        {/* System Integration Status */}
        <Card className="border border-white/[0.06] bg-zinc-950/40 relative overflow-hidden h-full flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" /> Integration Status
            </CardTitle>
            <CardDescription className="text-zinc-500 text-sm mt-1.5">
              Platform health and service connectivity.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 flex-1">
            {[
              { label: "API Gateway", desc: "Connected to local endpoints.", status: "online" },
              { label: "Model Pipeline", desc: "Tokens pipeline fully active.", status: "online" },
              { label: "WhatsApp Bridge", desc: "Core connection channel online.", status: "online" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                <div className={`status-dot ${item.status === "online" ? "status-dot-online" : "status-dot-offline"}`} />
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm text-white">{item.label}</span>
                  <span className="text-[11px] text-zinc-500 truncate">{item.desc}</span>
                </div>
              </div>
            ))}
          </CardContent>

          <div className="p-6 border-t border-white/5">
            <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-zinc-300" asChild>
              <Link href="/settings">
                Configure Keys & Webhooks
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* ═══════════ BOTS GRID ═══════════ */}
      <div className="space-y-4 border-t border-white/5 pt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BotIcon className="h-5 w-5 text-indigo-400" /> Featured Agents
          </h2>
          <Button variant="ghost" className="text-zinc-400 hover:text-white text-sm" asChild>
            <Link href="/bots">
              View Marketplace <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        <BotGrid bots={activeBots} onConfigure={handleConfigure} onDeploy={handleDeploy} />
      </div>
    </div>
  );
}
