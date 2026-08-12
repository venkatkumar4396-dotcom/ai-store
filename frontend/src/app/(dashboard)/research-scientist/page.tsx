"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  Search,
  BookOpen,
  FileText,
  Brain,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Target,
  Lightbulb,
  Map,
  Link2,
  GraduationCap,
  Microscope,
  ClipboardList,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

interface ResearchResult {
  id: string;
  topic: string;
  summary: string;
  keyFindings: string[];
  methodology: {
    recommended: string;
    steps: string[];
  };
  citations: {
    title: string;
    authors: string;
    year: string;
    journal: string;
    relevance: string;
  }[];
  researchGaps: string[];
  futureDirections: string[];
  datasets: { name: string; description: string; url: string }[];
  analyzedAt: string;
}

export default function ResearchScientistPage() {
  const [topic, setTopic] = React.useState("");
  const [context, setContext] = React.useState("");
  const [result, setResult] = React.useState<ResearchResult | null>(null);
  const [savedProjects, setSavedProjects] = React.useState<ResearchResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("research");

  React.useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await api.get("/agents/research/projects");
      setSavedProjects(res.data || []);
    } catch {} finally {
      setIsLoadingProjects(false);
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(id);
    try {
      await api.delete(`/agents/research/projects/${id}`);
      setSavedProjects((prev) => prev.filter((p) => p.id !== id));
      if (result?.id === id) setResult(null);
    } catch (err: any) {
      console.error("Failed to delete research project:", err);
    } finally {
      setIsDeleting(null);
    }
  };

  const doResearch = async () => {
    if (!topic.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await api.post("/agents/research/project", { title: topic, topic, description: context || topic });
      setResult(res.data);
      loadProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || "Research analysis failed. Check AI provider keys in Settings.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/20">
            <FlaskConical className="h-6 w-6 text-violet-400" />
          </div>
          Research Scientist Agent
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          AI-powered literature review, citation extraction, research gap identification, and methodology recommendations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-white/10 p-1 w-full overflow-x-auto scrollbar-none flex justify-start sm:justify-center min-w-0">
          <TabsTrigger value="research" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Microscope className="h-4 w-4 mr-2" /> New Research
          </TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <BookOpen className="h-4 w-4 mr-2" /> Saved ({savedProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="research" className="space-y-6">
          {/* Input */}
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardContent className="p-6 space-y-4">
              <Input
                placeholder="Research topic (e.g., Transformer architectures in NLP)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-11"
              />
              <Textarea
                placeholder="Additional context, specific questions, or area of focus (optional)..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 min-h-[100px] resize-none"
              />
              <Button
                onClick={doResearch}
                disabled={isAnalyzing || !topic.trim()}
                className="bg-violet-600 hover:bg-violet-500 text-white px-8 h-11 shadow-lg shadow-violet-600/20"
              >
                {isAnalyzing ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Researching...</>
                ) : (
                  <><Brain className="h-4 w-4 mr-2" /> Start Research</>
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
                <div className="w-16 h-16 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
                <FlaskConical className="absolute inset-0 m-auto h-6 w-6 text-violet-400" />
              </div>
              <p className="text-sm text-zinc-400">Conducting comprehensive literature review on <span className="text-violet-400 font-semibold">{topic}</span>...</p>
              <p className="text-xs text-zinc-600">Extracting citations, identifying gaps, building methodology</p>
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence>
            {!isAnalyzing && result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Summary */}
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-violet-400" /> Research Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{result.summary}</p>
                  </CardContent>
                </Card>

                {/* Key Findings */}
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-400" /> Key Findings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.keyFindings.map((finding, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-sm text-zinc-300">{finding}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Methodology */}
                  <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-cyan-400" /> Recommended Methodology
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-cyan-500/5 rounded-lg border border-cyan-500/10">
                        <span className="text-sm font-semibold text-cyan-400">{result.methodology.recommended}</span>
                      </div>
                      <div className="space-y-2">
                        {result.methodology.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                            <span className="text-cyan-400 font-mono font-bold text-xs mt-0.5">{String(i + 1).padStart(2, "0")}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Research Gaps */}
                  <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <Target className="h-5 w-5 text-rose-400" /> Research Gaps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {result.researchGaps.map((gap, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-rose-500/5 rounded-lg border border-rose-500/10">
                          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-zinc-300">{gap}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Citations */}
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <Link2 className="h-5 w-5 text-indigo-400" /> Citations & References
                    </CardTitle>
                    <CardDescription className="text-zinc-500 text-xs mt-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      Academic Disclaimer: Citations are generated via RAG/LLM synthesization and should be independently cross-verified before publication.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.citations.map((cite, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-1">
                          <h4 className="text-sm font-semibold text-white">{cite.title}</h4>
                          <p className="text-xs text-zinc-400">{cite.authors} • {cite.year} • {cite.journal}</p>
                          <p className="text-xs text-zinc-500 italic">{cite.relevance}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Future Directions */}
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-emerald-400" /> Future Research Directions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.futureDirections.map((dir, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                        <ChevronRight className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{dir}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty */}
          {!isAnalyzing && !result && !error && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="p-4 rounded-full bg-violet-500/10 border border-violet-500/20">
                <FlaskConical className="h-10 w-10 text-violet-500/50" />
              </div>
              <h3 className="text-lg font-semibold text-white">Enter a Research Topic</h3>
              <p className="text-sm text-zinc-500 max-w-md text-center">
                Type your research topic above. The AI will produce a comprehensive literature review, identify key citations, highlight research gaps, recommend methodologies, and suggest future directions.
              </p>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {["Transformer Architectures", "CRISPR Gene Editing", "Quantum Computing", "Climate ML"].map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant="outline"
                    onClick={() => { setTopic(t); }}
                    className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Saved Projects */}
        <TabsContent value="saved" className="space-y-4">
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Saved Research Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white/5 animate-pulse rounded-lg border border-white/5" />
                  ))}
                </div>
              ) : savedProjects.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-sm">
                  <BookOpen className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
                  No saved projects yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedProjects.map((proj) => (
                    <div key={proj.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-white">{proj.topic}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-1">{proj.summary?.slice(0, 100)}...</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setResult(proj); setActiveTab("research"); }}
                          className="text-zinc-400 hover:text-white"
                        >
                          View <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isDeleting === proj.id}
                          onClick={(e) => deleteProject(proj.id, e)}
                          className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          {isDeleting === proj.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
