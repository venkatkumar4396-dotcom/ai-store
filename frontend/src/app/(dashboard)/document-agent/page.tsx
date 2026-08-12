"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  BookOpen,
  TrendingUp,
  Brain,
  Shield,
  Layers,
  ArrowRight,
  List,
  Upload,
  Info,
  Copy,
  Check,
  ChevronRight,
  History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

interface DocHistoryItem {
  id: string;
  fileName: string;
  operationType: "summarize" | "analyze" | "generate_pdf";
  summary?: string;
  keyPoints?: string; // JSON string
  createdAt: string;
}

export default function DocumentAgentPage() {
  const [fileName, setFileName] = React.useState("");
  const [documentContent, setDocumentContent] = React.useState("");
  
  const [isSummarizing, setIsSummarizing] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const [summaryResult, setSummaryResult] = React.useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<{
    keyTakeaways: string[];
    actionItems: string[];
    riskFactors: string[];
    entitiesMentioned: string[];
  } | null>(null);

  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<DocHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);

  React.useEffect(() => {
    loadHistory();
    // Default mock document values
    setFileName("Product launch requirements.txt");
    setDocumentContent(
      `Project Nexora Launch Requirements document.\n\nNexora is designed as an autonomous booking bot agent marketplace. The target launch date is October 15th, 2026. Lead engineer: Amanda. Branding director: Robert.\n\nRequirements outline:\n1. Rebrand existing dashboard from NexusForge to Nexora and update state keys.\n2. Incorporate Google OAuth and GitHub OAuth inside the login module.\n3. Integrate Stripe checkout flows to support Pro subscriptions ($49/month).\n4. Build Travel, Productivity and Document core agent microservices.\n\nRisks and constraints:\n- API rate limits from Ollama/Gemini may bottleneck AI response speeds.\n- Live OAuth keys must be configured correctly in staging environments to prevent credentials leak.\n- Stripe webhook validation must support raw body parsing to avoid transaction drops.`
    );
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.get("/agents/document/history");
      setHistory(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSummarize = async () => {
    if (!fileName.trim() || !documentContent.trim()) {
      setError("Please fill in the document title and contents.");
      return;
    }
    setIsSummarizing(true);
    setError(null);
    setSummaryResult(null);
    setAnalysisResult(null);

    try {
      const res = await api.post("/agents/document/summarize", {
        fileName,
        content: documentContent
      });
      setSummaryResult(res.data.summary);
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || "Summarization failed. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!fileName.trim() || !documentContent.trim()) {
      setError("Please fill in the document title and contents.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setSummaryResult(null);
    setAnalysisResult(null);

    try {
      const res = await api.post("/agents/document/analyze", {
        fileName,
        content: documentContent
      });
      const parsed = JSON.parse(res.data.keyPoints);
      setAnalysisResult(parsed);
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!fileName.trim() || !documentContent.trim()) {
      setError("Please fill in the document title and contents.");
      return;
    }
    setIsGeneratingPdf(true);
    setError(null);

    try {
      const res = await api.post(
        "/agents/document/generate-pdf",
        {
          title: fileName.replace(/\.[^/.]+$/, ""), // strip extension if present
          content: documentContent
        },
        { responseType: "blob" }
      );

      // Download file on browser
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${fileName.replace(/\.[^/.]+$/, "")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      loadHistory();
    } catch (err: any) {
      setError("Failed to generate PDF. Make sure server libraries are compiled.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSelectHistoryItem = (item: DocHistoryItem) => {
    setError(null);
    setFileName(item.fileName);
    
    if (item.operationType === "summarize") {
      setSummaryResult(item.summary || null);
      setAnalysisResult(null);
    } else if (item.operationType === "analyze") {
      setSummaryResult(null);
      try {
        setAnalysisResult(JSON.parse(item.keyPoints || "{}"));
      } catch {
        setAnalysisResult(null);
      }
    } else {
      setSummaryResult(`PDF file generated: ${item.fileName}. Open history and download.`);
      setAnalysisResult(null);
    }
  };

  const copyToClipboard = () => {
    if (summaryResult) {
      navigator.clipboard.writeText(summaryResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2.5">
            Document Analysis Agent <FileText className="h-6 w-6 text-indigo-400 animate-pulse" />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Instantly summarize lengthy articles, parse complex PDF guidelines, and compile exportable PDF transcripts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Brain className="h-4 w-4" /> Cognitive PDF Parser
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: Input panel */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-zinc-900/60">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-400" /> Document Intake
              </CardTitle>
              <CardDescription>
                Provide a title and paste raw text below to run cognitive operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Document Title / File Name</label>
                <Input
                  placeholder="E.g., Business Strategy Plan.txt"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Document Contents</label>
                <textarea
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  placeholder="Paste your documents, notes, reports, or raw guidelines here..."
                  className="w-full min-h-[220px] p-3.5 bg-zinc-900/40 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y font-sans leading-relaxed"
                />
              </div>

              {/* Operation triggers */}
              <div className="flex flex-wrap gap-3 justify-between items-center pt-2">
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    onClick={handleSummarize}
                    disabled={isSummarizing || isAnalyzing || isGeneratingPdf}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                  >
                    {isSummarizing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Summarizing...
                      </>
                    ) : (
                      "Summarize Document"
                    )}
                  </Button>

                  <Button
                    onClick={handleAnalyze}
                    disabled={isSummarizing || isAnalyzing || isGeneratingPdf}
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      "Deep Business Analysis"
                    )}
                  </Button>
                </div>

                <Button
                  onClick={handleGeneratePdf}
                  disabled={isSummarizing || isAnalyzing || isGeneratingPdf}
                  variant="outline"
                  className="bg-transparent border-zinc-850 hover:bg-zinc-900 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" /> Export PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results display */}
          <AnimatePresence mode="wait">
            {summaryResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="bg-zinc-950/40 border-zinc-900">
                  <CardHeader className="pb-3 border-b border-zinc-900/60 flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" /> Executive Summary
                      </CardTitle>
                      <CardDescription className="text-zinc-400 text-xs mt-0.5">
                        Generated by AI agent analysis.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={copyToClipboard}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-zinc-400 hover:text-white"
                    >
                      {copied ? <Check className="h-4 w-4 mr-1.5 text-emerald-400" /> : <Copy className="h-4 w-4 mr-1.5" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {summaryResult}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Takeaways Card */}
                  <Card className="bg-zinc-950/40 border-zinc-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" /> Key Takeaways
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysisResult.keyTakeaways.map((item, idx) => (
                        <div key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Action items Card */}
                  <Card className="bg-zinc-950/40 border-zinc-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                        <List className="h-4 w-4" /> Action Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysisResult.actionItems.map((item, idx) => (
                        <div key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                          <div className="h-1.5 w-1.5 bg-violet-500 rounded-full shrink-0 mt-2" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Risks Card */}
                  <Card className="bg-zinc-950/40 border-zinc-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> Identified Risks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysisResult.riskFactors.map((item, idx) => (
                        <div key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                          <div className="h-1.5 w-1.5 bg-rose-500 rounded-full shrink-0 mt-2" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Mentioned entities */}
                  <Card className="bg-zinc-950/40 border-zinc-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="h-4 w-4" /> Mentioned Entities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {analysisResult.entitiesMentioned.length === 0 ? (
                          <span className="text-xs text-zinc-500">No key names or items mentioned.</span>
                        ) : (
                          analysisResult.entitiesMentioned.map((item, idx) => (
                            <Badge key={idx} className="bg-zinc-900 text-zinc-300 hover:bg-zinc-900 border-zinc-800">
                              {item}
                            </Badge>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: History logs */}
        <div className="lg:col-span-1">
          <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md h-full">
            <CardHeader className="pb-3 border-b border-zinc-900/60">
              <CardTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-4 w-4 text-zinc-500" /> Intake History
              </CardTitle>
              <CardDescription className="text-zinc-400 text-[10px]">
                Browse through files compiled previously.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-3">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">No previous operations.</p>
              ) : (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectHistoryItem(item)}
                      className="w-full text-left p-2.5 bg-zinc-900/20 hover:bg-zinc-900/50 border border-zinc-900 hover:border-zinc-800 rounded-lg flex flex-col gap-1 transition-all cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-white truncate w-full">{item.fileName}</p>
                      <div className="flex justify-between items-center w-full mt-1">
                        <Badge className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/10 border-none px-1.5 py-0.2 rounded text-[9px] uppercase font-bold">
                          {item.operationType === "generate_pdf" ? "PDF" : item.operationType}
                        </Badge>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
