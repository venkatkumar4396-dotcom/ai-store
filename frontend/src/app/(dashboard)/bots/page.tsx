"use client";

import * as React from "react";
import { Store, Search, SlidersHorizontal, Info, ArrowUpDown, Rocket, Star, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { BotGrid } from "@/components/dashboard/BotGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FEATURED_BOTS, BOT_CATEGORIES } from "@/lib/constants";
import type { Bot, BotCategory } from "@/types";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { useDeployedBots } from "@/lib/DeployedBotsContext";

type SortOption = "rating" | "popularity" | "name";

export default function BotStorePage() {
  const { addToast } = useToast();
  const { refreshDeployedBots, isBotDeployed } = useDeployedBots();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<BotCategory | "all">("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("rating");

  const filteredBots = React.useMemo(() => {
    let bots = FEATURED_BOTS.filter((bot) => {
      const matchesSearch =
        bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || bot.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort
    switch (sortBy) {
      case "rating":
        bots = [...bots].sort((a, b) => b.rating - a.rating);
        break;
      case "popularity":
        bots = [...bots].sort((a, b) => b.usageCount - a.usageCount);
        break;
      case "name":
        bots = [...bots].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return bots;
  }, [searchQuery, selectedCategory, sortBy]);

  const handleConfigure = (botId: string) => {
    const bot = FEATURED_BOTS.find(b => b.id === botId);
    if (!bot) return;
    if (botId === "bot-1") { window.location.href = "/whatsapp"; return; }
    if (botId === "bot-4") { window.location.href = "/file-tracker"; return; }
    if (botId === "bot-compass") { window.location.href = "/compass"; return; }
    switch (bot.category) {
      case "communication": window.location.href = "/whatsapp"; break;
      case "productivity": window.location.href = "/file-tracker"; break;
      case "analytics": window.location.href = "/ai-playground"; break;
      default: window.location.href = "/settings"; break;
    }
  };

  const handleDeploy = async (botId: string) => {
    try {
      await api.post(`/bots/instances/${botId}/install`);
      addToast({ type: "success", title: "Agent Deployed!", description: "Go to the respective page to configure it." });
      refreshDeployedBots();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      if (errorMsg?.includes("already installed")) {
        addToast({ type: "info", title: "Already Installed", description: "This agent is already active. Go to Configure to set it up." });
      } else {
        addToast({ type: "error", title: "Deploy Failed", description: errorMsg || "Could not deploy the agent." });
      }
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* ═══ Hero Banner ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-indigo-600/[0.10] via-violet-600/[0.05] to-transparent p-6 md:p-8"
      >
        <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-violet-500/8 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Store className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">AI Agent Marketplace</h1>
            </div>
            <p className="text-zinc-400 text-sm max-w-lg">
              Browse and deploy pre-trained AI agents for business automation, travel booking, stock analysis, and more.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-300">
              <Rocket className="h-3.5 w-3.5 text-indigo-400" />
              <span>{FEATURED_BOTS.length} Agents</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-300">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              <span>4.8 avg. rating</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-300">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span>100k+ users</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <Zap className="h-3.5 w-3.5" />
              <span>All Free</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-zinc-950/40 border border-white/[0.06] p-3 rounded-xl"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search agents by name, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/[0.03] border-white/[0.06] text-white placeholder-zinc-600 focus-visible:ring-indigo-500 h-9"
          />
        </div>
        <div className="flex gap-2">
          {/* Sort Dropdown */}
          <Button
            variant="outline"
            onClick={() => setSortBy(sortBy === "rating" ? "popularity" : sortBy === "popularity" ? "name" : "rating")}
            className="border-white/[0.08] hover:bg-white/5 text-zinc-400 hover:text-white gap-1.5 h-9 text-xs"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortBy === "rating" ? "By Rating" : sortBy === "popularity" ? "By Popular" : "By Name"}
          </Button>
        </div>
      </motion.div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`h-8 rounded-full text-xs font-semibold px-4 shrink-0 border transition-all duration-200 ${
            selectedCategory === "all"
              ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
              : "border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/5 bg-transparent"
          }`}
        >
          All Agents
        </button>
        {BOT_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`h-8 rounded-full text-xs font-semibold px-4 capitalize whitespace-nowrap shrink-0 border transition-all duration-200 ${
              selectedCategory === cat.value
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                : "border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/5 bg-transparent"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid Display */}
      {filteredBots.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-zinc-950/20 max-w-md mx-auto space-y-4"
        >
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 mx-auto">
            <Info className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-lg">No Agents Found</h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">
              Try adjusting your filters or search keywords to discover an agent.
            </p>
          </div>
          <Button
            onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
            variant="outline"
            className="border-white/10 text-zinc-300 hover:text-white"
          >
            Reset Filters
          </Button>
        </motion.div>
      ) : (
        <BotGrid bots={filteredBots} onConfigure={handleConfigure} onDeploy={handleDeploy} />
      )}
    </div>
  );
}
