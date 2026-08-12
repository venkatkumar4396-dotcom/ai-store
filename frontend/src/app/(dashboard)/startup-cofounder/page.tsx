"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Lightbulb,
  Target,
  TrendingUp,
  Shield,
  AlertTriangle,
  Brain,
  ChevronRight,
  Loader2,
  Sparkles,
  DollarSign,
  Users,
  BarChart3,
  Zap,
  Clock,
  Map,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

interface StartupAnalysis {
  id: string;
  name: string;
  description: string;
  industry?: string;
  scores: {
    startupScore: number;
    marketOpportunity: number;
    revenuePotential: number;
    risk: number;
  };
  swotAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  revenueModel: {
    pricingTiers: { name: string; price: string; features: string[] }[];
    streams: string[];
  };
  roadmap: { phase: string; timeframe: string; actions: string[] }[];
  competitorResearch: { name: string; marketShare: string; differentiator: string }[];
  aiExplanation: string;
  createdAt: string;
}

const ScoreTile = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
  <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
    <CardContent className="p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 border border-opacity-20`} style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold text-white font-mono">{value}<span className="text-sm text-zinc-500">/100</span></div>
        <div className="text-xs text-zinc-400">{label}</div>
      </div>
      <div className="w-16 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </CardContent>
  </Card>
);

const SwotCard = ({ title, items, icon: Icon, color, bgColor, dotColor }: { title: string; items: string[]; icon: any; color: string; bgColor: string; dotColor: string }) => (
  <Card className={`border ${bgColor} bg-zinc-950/60 backdrop-blur-xl`}>
    <CardHeader className="pb-2">
      <CardTitle className={`text-sm font-semibold ${color} flex items-center gap-2`}>
        <Icon className="h-4 w-4" /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: dotColor }} />
          <span>{item}</span>
        </div>
      ))}
    </CardContent>
  </Card>
);

const INDUSTRIES = ["General", "SaaS & Software", "AI & Machine Learning", "FinTech", "HealthTech", "E-Commerce", "Marketplace", "Developer Tools", "Consumer Tech"];

export default function StartupCofounderPage() {
  const [ideaTitle, setIdeaTitle] = React.useState("");
  const [industry, setIndustry] = React.useState("General");
  const [ideaDescription, setIdeaDescription] = React.useState("");
  const [analysis, setAnalysis] = React.useState<StartupAnalysis | null>(null);
  const [savedIdeas, setSavedIdeas] = React.useState<StartupAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("analyze");

  React.useEffect(() => {
    loadSavedIdeas();
  }, []);

  const loadSavedIdeas = async () => {
    try {
      const res = await api.get("/agents/startup/ideas");
      setSavedIdeas(res.data || []);
    } catch {}
  };

  const analyzeIdea = async () => {
    if (!ideaTitle.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await api.post("/agents/startup/analyze", {
        name: ideaTitle,
        industry: industry,
        description: ideaDescription,
      });
      setAnalysis(res.data);
      loadSavedIdeas();
    } catch (err: any) {
      setError(err.response?.data?.error || "Analysis failed. Please check your AI provider keys in Settings.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteIdea = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(id);
    try {
      await api.delete(`/agents/startup/ideas/${id}`);
      setSavedIdeas((prev) => prev.filter((item) => item.id !== id));
      if (analysis?.id === id) setAnalysis(null);
    } catch (err: any) {
      console.error("Failed to delete idea:", err);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-600/20 to-rose-600/20 border border-orange-500/20">
            <Rocket className="h-6 w-6 text-orange-400" />
          </div>
          Startup Co-Founder Agent
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          AI-powered business validation, SWOT analysis, revenue modeling, and investor readiness scoring.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-white/10 p-1 w-full overflow-x-auto scrollbar-none flex justify-start sm:justify-center min-w-0">
          <TabsTrigger value="analyze" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Lightbulb className="h-4 w-4 mr-2" /> Analyze Idea
          </TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Rocket className="h-4 w-4 mr-2" /> Saved Ideas ({savedIdeas.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── ANALYZE TAB ─── */}
        <TabsContent value="analyze" className="space-y-6">
          {/* Input Form */}
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Startup idea title (e.g., AI-Powered Calendar SaaS)"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-11"
                  />
                </div>
                <div>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 text-white rounded-md h-11 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind} className="bg-zinc-900 text-white">
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Textarea
                placeholder="Describe your startup idea in detail. Include target market, problem it solves, and any initial thoughts on monetization..."
                value={ideaDescription}
                onChange={(e) => setIdeaDescription(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 min-h-[120px] resize-none"
              />
              <Button
                onClick={analyzeIdea}
                disabled={isAnalyzing || !ideaTitle.trim()}
                className="bg-orange-600 hover:bg-orange-500 text-white px-8 h-11 shadow-lg shadow-orange-600/20"
              >
                {isAnalyzing ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing Idea...</>
                ) : (
                  <><Brain className="h-4 w-4 mr-2" /> Validate & Analyze</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border border-rose-500/30 bg-rose-500/10">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                    <p className="text-sm text-rose-300">{error}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          {isAnalyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-orange-500/30 border-t-orange-400 animate-spin" />
                <Rocket className="absolute inset-0 m-auto h-6 w-6 text-orange-400" />
              </div>
              <p className="text-sm text-zinc-400">Running comprehensive startup analysis...</p>
              <p className="text-xs text-zinc-600">SWOT analysis, market sizing, revenue modeling, competitor research</p>
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence>
            {!isAnalyzing && analysis && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Title */}
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold text-white">{analysis.name}</h2>
                    <p className="text-zinc-400 text-sm mt-2">{analysis.description}</p>
                  </CardContent>
                </Card>

                {/* Score Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Startup Score", value: analysis.scores.startupScore, icon: Rocket, color: "#f97316" },
                    { label: "Market Opportunity", value: analysis.scores.marketOpportunity, icon: Target, color: "#06b6d4" },
                    { label: "Revenue Potential", value: analysis.scores.revenuePotential, icon: DollarSign, color: "#10b981" },
                    { label: "Risk Level", value: analysis.scores.risk, icon: Shield, color: "#ef4444" },
                  ].map((tile, idx) => (
                    <motion.div
                      key={tile.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                    >
                      <ScoreTile label={tile.label} value={tile.value} icon={tile.icon} color={tile.color} />
                    </motion.div>
                  ))}
                </div>

                {/* SWOT Matrix */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-400" /> SWOT Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: "Strengths", items: analysis.swotAnalysis?.strengths || [], icon: CheckCircle2, color: "text-emerald-400", bgColor: "border-emerald-500/20", dotColor: "#10b981" },
                      { title: "Weaknesses", items: analysis.swotAnalysis?.weaknesses || [], icon: XCircle, color: "text-amber-400", bgColor: "border-amber-500/20", dotColor: "#f59e0b" },
                      { title: "Opportunities", items: analysis.swotAnalysis?.opportunities || [], icon: TrendingUp, color: "text-cyan-400", bgColor: "border-cyan-500/20", dotColor: "#06b6d4" },
                      { title: "Threats", items: analysis.swotAnalysis?.threats || [], icon: AlertTriangle, color: "text-rose-400", bgColor: "border-rose-500/20", dotColor: "#ef4444" },
                    ].map((card, idx) => (
                      <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
                      >
                        <SwotCard title={card.title} items={card.items} icon={card.icon} color={card.color} bgColor={card.bgColor} dotColor={card.dotColor} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Revenue + MVP + Roadmap */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue & Pricing */}
                  <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-400" /> Revenue Strategy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-400 mb-2">Revenue Streams</h4>
                        <div className="flex flex-wrap gap-2">
                          {(analysis.revenueModel?.streams || []).map((stream, i) => (
                            <Badge key={i} variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10">
                              {stream}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {(analysis.revenueModel?.pricingTiers || []).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-cyan-400">Pricing Tiers</h4>
                          {analysis.revenueModel.pricingTiers.map((tier, i) => (
                            <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-white">{tier.name}</span>
                                <span className="text-sm font-bold text-emerald-400">{tier.price}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {tier.features.map((f, j) => (
                                  <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">{f}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Competitor Research */}
                  <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-400" /> Competitor Landscape
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(analysis.competitorResearch || []).map((comp, i) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 bg-white/5 rounded-lg border border-white/5">
                          <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{comp.name} <span className="text-zinc-500 font-normal">· {comp.marketShare}</span></p>
                            <p className="text-xs text-zinc-400 mt-0.5">{comp.differentiator}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Roadmap */}
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <Map className="h-5 w-5 text-violet-400" /> Product Roadmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.roadmap.map((phase, i) => (
                        <div key={i} className="relative pl-8 pb-4 border-l-2 border-white/10 last:border-0">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-violet-600 border-2 border-zinc-950" />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-white">{phase.phase}</h4>
                              <Badge variant="outline" className="border-violet-500/20 text-violet-400 bg-violet-500/10 text-xs">
                                <Clock className="h-3 w-3 mr-1" /> {phase.timeframe}
                              </Badge>
                            </div>
                            <ul className="space-y-1">
                              {(phase.actions || []).map((m, j) => (
                                <li key={j} className="text-sm text-zinc-400 flex items-center gap-2">
                                  <ChevronRight className="h-3 w-3 text-zinc-600" /> {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                {analysis.aiExplanation && (
                  <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-cyan-400" /> AI Strategic Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap prose prose-invert max-w-none">{analysis.aiExplanation}</div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!isAnalyzing && !analysis && !error && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="p-4 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Lightbulb className="h-10 w-10 text-orange-500/50" />
              </div>
              <h3 className="text-lg font-semibold text-white">Describe Your Startup Idea</h3>
              <p className="text-sm text-zinc-500 max-w-md text-center">
                Enter your startup concept above. The AI will generate a comprehensive SWOT analysis, revenue models, MVP roadmap, competitor insights, and investor readiness assessment.
              </p>
            </div>
          )}
        </TabsContent>

        {/* ─── SAVED IDEAS TAB ─── */}
        <TabsContent value="saved" className="space-y-4">
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Saved Startup Ideas</CardTitle>
              <CardDescription className="text-zinc-400">Review and revisit previous startup analyses.</CardDescription>
            </CardHeader>
            <CardContent>
              {savedIdeas.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-sm">
                  <Rocket className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
                  No saved ideas yet. Analyze your first startup idea to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedIdeas.map((idea) => (
                    <div key={idea.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-white">{idea.name}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-1">{idea.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-orange-500/20 text-orange-400 bg-orange-500/10">
                          Score: {idea.scores.startupScore}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setAnalysis(idea); setActiveTab("analyze"); }}
                          className="text-zinc-400 hover:text-white"
                        >
                          View <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isDeleting === idea.id}
                          onClick={(e) => deleteIdea(idea.id, e)}
                          className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          {isDeleting === idea.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
