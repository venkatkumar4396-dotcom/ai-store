"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  FileText,
  Target,
  Brain,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  XCircle,
  Award,
  Briefcase,
  PenTool,
  BookOpen,
  TrendingUp,
  Copy,
  Check,
  Shield,
  MessageSquare,
  Send,
  UserCheck,
  RefreshCw,
  Zap,
  DollarSign,
  Code2,
  FolderGit2,
  ListCheck,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

/* ─── Interfaces ─────────────────────────────────────────── */

interface JobPilotAnalysis {
  summary: string;
  recommendations: string[];
  resumeChanges: { section: string; original: string; improved: string }[];
  missingSkills: string[];
  atsScore: number;
  readinessScore: number;
  matchingKeywords: string[];
  nextSteps: string[];
}

interface ApplicationPackage {
  atsScore: number;
  resumeVersion: string;
  coverLetter: string;
  recruiterEmail: string;
  linkedInSummary: string;
  portfolioDescription: string;
  skillGapReport: { skill: string; gap: string; recommendation: string }[];
  applicationChecklist: string[];
}

interface InterviewSession {
  interviewerMessage: string;
  scores: {
    communication: number;
    technical: number;
    confidence: number;
    problemSolving: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    starTip?: string;
  };
  questionNumber: number;
  questionType: string;
}

interface CareerCoaching {
  targetRole: string;
  salaryEstimate: { entry: string; mid: string; senior: string };
  recommendedCourses: { title: string; platform: string; focus: string }[];
  portfolioProjects: { title: string; description: string; techStack: string[] }[];
  certifications: { name: string; issuer: string; importance: string }[];
  profileAudit: {
    gitHubTips: string[];
    linkedInTips: string[];
    networkingStrategy: string;
  };
}

/* ─── Helper Components ──────────────────────────────────── */

const ScoreMeter = ({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) => (
  <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
    <CardContent className="p-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="text-xs text-zinc-400 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white font-mono mb-2">{value}<span className="text-xs text-zinc-500">/100</span></div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </CardContent>
  </Card>
);

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button size="sm" variant="ghost" onClick={handleCopy} className="text-zinc-400 hover:text-white h-8 text-xs">
      {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
};

/* ─── Main Page ──────────────────────────────────────────── */

export default function JobPilotPage() {
  const [activeTab, setActiveTab] = React.useState("analyze");
  const [error, setError] = React.useState<string | null>(null);

  // Tab 1: ATS Analyzer State
  const [resumeText, setResumeText] = React.useState("");
  const [jobDescription, setJobDescription] = React.useState("");
  const [targetRole, setTargetRole] = React.useState("");
  const [analysis, setAnalysis] = React.useState<JobPilotAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  // Tab 2: Mock Interview State
  const [interviewRole, setInterviewRole] = React.useState("Software Engineer");
  const [experienceLevel, setExperienceLevel] = React.useState("Mid-Senior");
  const [chatHistory, setChatHistory] = React.useState<{ role: string; content: string }[]>([]);
  const [userAnswer, setUserAnswer] = React.useState("");
  const [currentInterview, setCurrentInterview] = React.useState<InterviewSession | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = React.useState(false);

  // Tab 3: Application Package State
  const [pkgJobTitle, setPkgJobTitle] = React.useState("");
  const [pkgCompany, setPkgCompany] = React.useState("");
  const [pkgJobDesc, setPkgJobDesc] = React.useState("");
  const [appPackage, setAppPackage] = React.useState<ApplicationPackage | null>(null);
  const [isPkgGenerating, setIsPkgGenerating] = React.useState(false);

  // Tab 4: Career Coach State
  const [coachRole, setCoachRole] = React.useState("Full Stack Developer");
  const [coachSkills, setCoachSkills] = React.useState("React, TypeScript, Node.js, Express, PostgreSQL");
  const [coachingData, setCoachingData] = React.useState<CareerCoaching | null>(null);
  const [isCoachLoading, setIsCoachLoading] = React.useState(false);

  /* ─── Actions ────────────────────────────────────────────── */

  const runAnalysis = async () => {
    if (!resumeText.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await api.post("/agents/career/jobpilot/analyze", {
        resumeText,
        jobDescription,
        targetRole,
      });
      setAnalysis(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "JobPilot AI analysis failed. Please verify AI configuration in Settings.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startOrContinueInterview = async (msgOverride?: string) => {
    setIsInterviewLoading(true);
    setError(null);
    try {
      const msgToSend = msgOverride !== undefined ? msgOverride : userAnswer;
      const res = await api.post("/agents/career/jobpilot/interview/chat", {
        history: chatHistory,
        userMessage: msgToSend,
        jobRole: interviewRole,
        experienceLevel,
      });

      setCurrentInterview(res.data);
      if (msgToSend) {
        setChatHistory((prev) => [
          ...prev,
          { role: "user", content: msgToSend },
          { role: "assistant", content: res.data.interviewerMessage },
        ]);
      } else {
        setChatHistory([
          { role: "assistant", content: res.data.interviewerMessage },
        ]);
      }
      setUserAnswer("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Mock interview session error.");
    } finally {
      setIsInterviewLoading(false);
    }
  };

  const generatePackage = async () => {
    if (!resumeText.trim() || !pkgJobTitle.trim() || !pkgCompany.trim()) return;
    setIsPkgGenerating(true);
    setError(null);
    try {
      const res = await api.post("/agents/career/jobpilot/application-package", {
        resumeText,
        jobDescription: pkgJobDesc || jobDescription,
        companyName: pkgCompany,
        jobTitle: pkgJobTitle,
      });
      setAppPackage(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Package generation failed.");
    } finally {
      setIsPkgGenerating(false);
    }
  };

  const fetchCoaching = async () => {
    if (!coachRole.trim()) return;
    setIsCoachLoading(true);
    setError(null);
    try {
      const res = await api.post("/agents/career/jobpilot/coaching", {
        targetRole: coachRole,
        currentSkills: coachSkills,
        experienceLevel: "Mid-Senior",
      });
      setCoachingData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Career coaching fetch failed.");
    } finally {
      setIsCoachLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/20">
            <GraduationCap className="h-6 w-6 text-indigo-400" />
          </div>
          JobPilot AI — Career & Application Strategist
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Your personal AI Recruiter, Resume Writer, Interview Coach, and Career Strategist.
        </p>
      </div>

      {/* Error Card */}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-white/10 p-1 flex-wrap">
          <TabsTrigger value="analyze" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Target className="h-4 w-4 mr-2" /> ATS Analyzer & Optimizer
          </TabsTrigger>
          <TabsTrigger value="interview" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <MessageSquare className="h-4 w-4 mr-2" /> Mock Interview Coach
          </TabsTrigger>
          <TabsTrigger value="package" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Briefcase className="h-4 w-4 mr-2" /> Application Package
          </TabsTrigger>
          <TabsTrigger value="coaching" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <TrendingUp className="h-4 w-4 mr-2" /> Career Strategist
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════
            TAB 1: ATS ANALYZER & OPTIMIZER (STRICT 6-STEP FORMAT)
        ════════════════════════════════════════════════════════ */}
        <TabsContent value="analyze" className="space-y-6">
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" /> Resume & Job Match Input
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Paste your resume and target job description. JobPilot AI will analyze compatibility and provide recruiter recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Target Job Title (e.g. Senior Full Stack Engineer, Product Manager)"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-11"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Your Resume Text</label>
                  <Textarea
                    placeholder="Paste your complete resume text here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 min-h-[160px] resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Job Description (Optional)</label>
                  <Textarea
                    placeholder="Paste job posting description, requirements, and responsibilities..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 min-h-[160px] resize-none"
                  />
                </div>
              </div>
              <Button
                onClick={runAnalysis}
                disabled={isAnalyzing || !resumeText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-11 shadow-lg shadow-indigo-600/20"
              >
                {isAnalyzing ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Running JobPilot Analysis...</>
                ) : (
                  <><Brain className="h-4 w-4 mr-2" /> Run JobPilot ATS Analysis</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Loading */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
                <GraduationCap className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-sm text-zinc-400">JobPilot AI is scanning keywords, action verbs & ATS criteria...</p>
            </div>
          )}

          {/* 6-Step Output Results */}
          {!isAnalyzing && analysis && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Score Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ScoreMeter label="ATS Match Score" value={analysis.atsScore} color="#6366f1" icon={Target} />
                <ScoreMeter label="Role Readiness" value={analysis.readinessScore} color="#10b981" icon={CheckCircle2} />
                <ScoreMeter label="Keywords Found" value={analysis.matchingKeywords?.length || 0} color="#06b6d4" icon={TagIcon} />
                <ScoreMeter label="Skills Missing" value={analysis.missingSkills?.length || 0} color="#f59e0b" icon={AlertTriangle} />
              </div>

              {/* 1. Summary */}
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-400" /> 1. Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-300 leading-relaxed">{analysis.summary}</p>
                </CardContent>
              </Card>

              {/* 2. Recommendations */}
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-400" /> 2. Recruiter Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.recommendations?.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                      <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span className="text-sm text-zinc-300">{rec}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 3. Resume Changes (Action-Verb Rewrites) */}
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-cyan-400" /> 3. High-Impact Bullet Rewrites (Before vs After)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.resumeChanges?.map((item, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-2">
                      <Badge variant="outline" className="border-cyan-500/20 text-cyan-400 bg-cyan-500/10 text-[10px]">
                        {item.section}
                      </Badge>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded bg-rose-500/5 border border-rose-500/10 text-rose-300">
                          <span className="font-semibold block mb-1 text-rose-400">Original / Phrasing:</span>
                          {item.original}
                        </div>
                        <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-300">
                          <span className="font-semibold block mb-1 text-emerald-400">JobPilot ATS Rewrite:</span>
                          {item.improved}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 4. Missing Skills */}
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400" /> 4. Missing Skills & Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingSkills?.map((skill, i) => (
                      <Badge key={i} variant="outline" className="border-rose-500/20 text-rose-400 bg-rose-500/10 py-1 px-3">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 5 & 6. ATS Score Breakdown & Next Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-violet-400" /> 5. ATS Keyword Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-zinc-400 mb-2">Matching Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.matchingKeywords?.map((kw, i) => (
                          <Badge key={i} variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10 text-[10px]">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-emerald-400" /> 6. Immediate Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.nextSteps?.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-zinc-300 p-2 bg-white/5 rounded border border-white/5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════
            TAB 2: REAL-TIME MOCK INTERVIEW COACH
        ════════════════════════════════════════════════════════ */}
        <TabsContent value="interview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Setup & Scoreboard */}
            <div className="space-y-4">
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-400" /> Interview Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Target Role</label>
                    <Input
                      value={interviewRole}
                      onChange={(e) => setInterviewRole(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="bg-white/5 border-white/10 text-white h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Seniority</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full h-9 rounded-lg bg-white/5 border border-white/10 text-white text-xs px-2.5 focus:outline-none"
                    >
                      <option value="Entry / Junior" className="bg-zinc-900">Entry / Junior</option>
                      <option value="Mid-Senior" className="bg-zinc-900">Mid-Senior</option>
                      <option value="Lead / Staff Principal" className="bg-zinc-900">Lead / Staff Principal</option>
                    </select>
                  </div>
                  <Button
                    onClick={() => { setChatHistory([]); startOrContinueInterview(""); }}
                    disabled={isInterviewLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-9 text-xs shadow-lg shadow-indigo-600/20"
                  >
                    {isInterviewLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                    Start New Interview
                  </Button>
                </CardContent>
              </Card>

              {/* Real-time 4-Dimension Scores */}
              {currentInterview?.scores && (
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-semibold text-white uppercase tracking-wider">
                      Response Scorecard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ScoreMeter label="Communication" value={currentInterview.scores.communication} color="#3b82f6" icon={MessageSquare} />
                    <ScoreMeter label="Technical Knowledge" value={currentInterview.scores.technical} color="#10b981" icon={Brain} />
                    <ScoreMeter label="Confidence" value={currentInterview.scores.confidence} color="#8b5cf6" icon={Shield} />
                    <ScoreMeter label="Problem Solving" value={currentInterview.scores.problemSolving} color="#f59e0b" icon={Zap} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Chat Box */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl h-[520px] flex flex-col">
                <CardHeader className="pb-3 border-b border-white/10 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <CardTitle className="text-sm font-semibold text-white">
                      JobPilot AI Recruiter Interacting
                    </CardTitle>
                  </div>
                  {currentInterview?.questionType && (
                    <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 bg-indigo-500/10 text-[10px]">
                      {currentInterview.questionType}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3">
                      <MessageSquare className="h-10 w-10 text-indigo-400/50" />
                      <h3 className="text-sm font-semibold text-white">Ready for your Mock Interview?</h3>
                      <p className="text-xs text-zinc-500 max-w-sm">
                        JobPilot AI will act as a senior engineering interviewer. Click "Start New Interview" to begin.
                      </p>
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 text-xs leading-relaxed ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                            <Brain className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={`p-3.5 rounded-xl max-w-[85%] ${
                            msg.role === "user"
                              ? "bg-indigo-600 text-white rounded-br-none"
                              : "bg-white/5 border border-white/5 text-zinc-200 rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Feedback Card attached to last answer */}
                  {currentInterview?.feedback && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                      <p className="font-semibold text-amber-400 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> JobPilot Feedback & STAR Tip:
                      </p>
                      {currentInterview.feedback.starTip && <p>{currentInterview.feedback.starTip}</p>}
                    </div>
                  )}
                </CardContent>

                {/* Input Bar */}
                <div className="p-3 border-t border-white/10 flex items-center gap-2">
                  <Textarea
                    placeholder="Type your response here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (userAnswer.trim()) startOrContinueInterview();
                      }
                    }}
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 text-xs min-h-[44px] max-h-[100px] resize-none"
                  />
                  <Button
                    onClick={() => startOrContinueInterview()}
                    disabled={isInterviewLoading || !userAnswer.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white h-[44px] px-4 shrink-0"
                  >
                    {isInterviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════
            TAB 3: APPLICATION PACKAGE GENERATOR
        ════════════════════════════════════════════════════════ */}
        <TabsContent value="package" className="space-y-6">
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-emerald-400" /> Generate Complete Application Package
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Target Job Title (e.g. Lead Developer)"
                  value={pkgJobTitle}
                  onChange={(e) => setPkgJobTitle(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-10 text-xs"
                />
                <Input
                  placeholder="Company Name (e.g. Acme Corp)"
                  value={pkgCompany}
                  onChange={(e) => setPkgCompany(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-10 text-xs"
                />
              </div>
              <Textarea
                placeholder="Target Job Description text..."
                value={pkgJobDesc}
                onChange={(e) => setPkgJobDesc(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 min-h-[100px] text-xs resize-none"
              />
              <Button
                onClick={generatePackage}
                disabled={isPkgGenerating || !resumeText.trim() || !pkgJobTitle.trim() || !pkgCompany.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 h-10 text-xs shadow-lg shadow-emerald-600/20"
              >
                {isPkgGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate Tailored Application Package
              </Button>
            </CardContent>
          </Card>

          {/* Results Package */}
          {appPackage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ATS Resume Draft */}
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-400" /> ATS-Optimized Resume Draft
                  </CardTitle>
                  <CopyButton text={appPackage.resumeVersion} />
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-white/5 rounded border border-white/5 text-xs text-zinc-300 whitespace-pre-wrap font-mono max-h-[350px] overflow-y-auto">
                    {appPackage.resumeVersion}
                  </div>
                </CardContent>
              </Card>

              {/* Tailored Cover Letter */}
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-cyan-400" /> Tailored Cover Letter
                  </CardTitle>
                  <CopyButton text={appPackage.coverLetter} />
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-white/5 rounded border border-white/5 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto">
                    {appPackage.coverLetter}
                  </div>
                </CardContent>
              </Card>

              {/* Direct Recruiter Email */}
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Send className="h-4 w-4 text-violet-400" /> Direct Recruiter Outreach Email
                  </CardTitle>
                  <CopyButton text={appPackage.recruiterEmail} />
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-white/5 rounded border border-white/5 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {appPackage.recruiterEmail}
                  </div>
                </CardContent>
              </Card>

              {/* LinkedIn Summary & Application Checklist */}
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl space-y-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <ListCheck className="h-4 w-4 text-amber-400" /> Application Checklist & LinkedIn Headline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-amber-400 mb-1">LinkedIn Headline Suggestion</p>
                    <p className="text-xs text-zinc-300 p-2 bg-white/5 rounded border border-white/5">{appPackage.linkedInSummary}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 mb-1">Application Checklist</p>
                    <div className="space-y-1">
                      {appPackage.applicationChecklist?.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="h-3 w-3 text-emerald-400" /> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════
            TAB 4: CAREER STRATEGIST & COACHING
        ════════════════════════════════════════════════════════ */}
        <TabsContent value="coaching" className="space-y-6">
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-400" /> Career Growth & Project Blueprint
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Target Role (e.g. Senior Full Stack Architect)"
                  value={coachRole}
                  onChange={(e) => setCoachRole(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-10 text-xs"
                />
                <Input
                  placeholder="Current Tech Stack / Skills"
                  value={coachSkills}
                  onChange={(e) => setCoachSkills(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-10 text-xs"
                />
              </div>
              <Button
                onClick={fetchCoaching}
                disabled={isCoachLoading || !coachRole.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 h-10 text-xs shadow-lg shadow-indigo-600/20"
              >
                {isCoachLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                Generate JobPilot Career Roadmap
              </Button>
            </CardContent>
          </Card>

          {coachingData && (
            <div className="space-y-6">
              {/* Salary Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl p-4">
                  <div className="text-xs text-zinc-400 mb-1">Entry Level Estimate</div>
                  <div className="text-xl font-bold text-white font-mono">{coachingData.salaryEstimate?.entry}</div>
                </Card>
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl p-4">
                  <div className="text-xs text-zinc-400 mb-1">Mid Level Estimate</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono">{coachingData.salaryEstimate?.mid}</div>
                </Card>
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl p-4">
                  <div className="text-xs text-zinc-400 mb-1">Senior Level Estimate</div>
                  <div className="text-xl font-bold text-indigo-400 font-mono">{coachingData.salaryEstimate?.senior}</div>
                </Card>
              </div>

              {/* Recommended Projects & Courses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <FolderGit2 className="h-4 w-4 text-cyan-400" /> Portfolio Project Ideas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {coachingData.portfolioProjects?.map((proj, i) => (
                      <div key={i} className="p-3 bg-white/5 rounded border border-white/5 space-y-1">
                        <p className="text-xs font-semibold text-white">{proj.title}</p>
                        <p className="text-xs text-zinc-400">{proj.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {proj.techStack?.map((tech, j) => (
                            <Badge key={j} variant="outline" className="border-cyan-500/20 text-cyan-400 bg-cyan-500/10 text-[9px]">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-amber-400" /> Recommended Courses & Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {coachingData.recommendedCourses?.map((course, i) => (
                      <div key={i} className="p-3 bg-white/5 rounded border border-white/5">
                        <p className="text-xs font-semibold text-white">{course.title}</p>
                        <p className="text-[11px] text-zinc-400">{course.platform} · Focus: {course.focus}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const TagIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <Badge variant="outline" className={className} style={style}>
    K
  </Badge>
);
