"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  BarChart3,
  Zap,
  FileSearch,
  Headphones,
  Megaphone,
  Code2,
  DollarSign,
  Star,
  Users,
  Settings2,
  ChevronRight,
  Sparkles,
  Plane,
  TrendingUp,
  GraduationCap,
  CheckSquare,
  FileText,
  Rocket,
  Compass,
  Hotel,
  ExternalLink,
  Target,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Bot } from "@/types";

interface BotGridProps {
  bots: Bot[];
  onConfigure?: (botId: string) => void;
  onDeploy?: (botId: string) => void;
  isLoading?: boolean;
  installedBotIds?: Set<string>;
}

export function BotGrid({ bots, onConfigure, onDeploy, installedBotIds }: BotGridProps) {
  const getBotIcon = (iconName: string) => {
    const props = { className: "h-6 w-6 text-white" };
    switch (iconName) {
      case "MessageCircle": return <MessageCircle {...props} />;
      case "BarChart3": return <BarChart3 {...props} />;
      case "Zap": return <Zap {...props} />;
      case "FileSearch": return <FileSearch {...props} />;
      case "Headphones": return <Headphones {...props} />;
      case "Megaphone": return <Megaphone {...props} />;
      case "Code2": return <Code2 {...props} />;
      case "DollarSign": return <DollarSign {...props} />;
      case "Plane": return <Plane {...props} />;
      case "TrendingUp": return <TrendingUp {...props} />;
      case "GraduationCap": return <GraduationCap {...props} />;
      case "CheckSquare": return <CheckSquare {...props} />;
      case "FileText": return <FileText {...props} />;
      case "Rocket": return <Rocket {...props} />;
      case "Compass": return <Compass {...props} />;
      case "Hotel": return <Hotel {...props} />;
      case "Target": return <Target {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  const getIconGradient = (category: string) => {
    switch (category) {
      case "automation": return "from-amber-600 to-orange-500";
      case "communication": return "from-indigo-600 to-blue-500";
      case "analytics": return "from-emerald-600 to-cyan-500";
      case "productivity": return "from-violet-600 to-purple-500";
      default: return "from-indigo-600 to-violet-500";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "automation": return "bg-amber-500/10 text-amber-400 border border-amber-500/15";
      case "communication": return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15";
      case "analytics": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15";
      case "productivity": return "bg-violet-500/10 text-violet-400 border border-violet-500/15";
      default: return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/15";
    }
  };

  const container = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 120, damping: 16 },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {bots.map((bot) => (
        <motion.div key={bot.id} variants={item}>
          <Card className="h-full flex flex-col justify-between overflow-hidden group border border-white/[0.06] bg-zinc-950/40 relative hover:border-indigo-500/20 transition-all duration-300 card-3d">
            {/* Installed badge */}
            {installedBotIds?.has(bot.id) && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
                <CheckCircle2 className="h-3 w-3" /> Installed
              </div>
            )}
            {/* Top gradient accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${getIconGradient(bot.category)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/[0.07] group-hover:to-violet-500/[0.03] rounded-full blur-2xl transition-all duration-500 pointer-events-none" />
            
            <CardHeader className="p-5 relative">
              <div className="flex items-start justify-between gap-3">
                {/* Icon with gradient */}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${getIconGradient(bot.category)} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300 shrink-0`}>
                  {getBotIcon(bot.icon)}
                </div>
                {/* Category Badge */}
                <Badge variant="outline" className={`text-[10px] capitalize ${getCategoryColor(bot.category)}`}>
                  {bot.category}
                </Badge>
              </div>

              <div className="mt-3.5">
                <CardTitle className="text-[15px] font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5 leading-tight">
                  {bot.name}
                  {bot.status === "beta" && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/30 bg-amber-500/5 text-amber-400 font-bold">
                      BETA
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-zinc-500 text-[13px] mt-1.5 leading-relaxed line-clamp-2">
                  {bot.description}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-5 pb-2 flex items-center justify-between text-xs text-zinc-500 border-t border-white/[0.04] pt-3">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400/30 text-amber-400" />
                <span className="text-zinc-300 font-semibold">{bot.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-zinc-600" />
                <span>{bot.usageCount.toLocaleString()}</span>
              </div>
              <div className="font-semibold">
                {bot.price === "free" ? (
                  <span className="text-emerald-400">Free</span>
                ) : (
                  <span className="text-white">${bot.price}/mo</span>
                )}
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-2 border-t border-white/[0.04] mt-1 flex flex-wrap gap-2">
              {bot.standaloneUrl ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 h-9"
                    onClick={() => window.open(bot.standaloneUrl, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Launch Standalone
                  </Button>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 h-9"
                    onClick={() => onDeploy?.(bot.id)}
                  >
                    Open Here
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/[0.08] hover:bg-white/5 text-zinc-400 hover:text-white h-9"
                    onClick={() => onConfigure?.(bot.id)}
                  >
                    <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                    Configure
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 h-9"
                    onClick={() => onDeploy?.(bot.id)}
                  >
                    Deploy
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
