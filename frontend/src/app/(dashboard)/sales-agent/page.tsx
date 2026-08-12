"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Users,
  Mail,
  Calendar,
  Loader2,
  AlertTriangle,
  Search,
  Sparkles,
  Send,
  Clock,
  TrendingUp,
  BarChart3,
  UserPlus,
  ChevronRight,
  Trash2,
  ExternalLink,
  Zap,
  Star,
  RefreshCw,
  Video,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

/* ─── Types ──────────────────────────────────────────── */

interface SalesLead {
  id: string;
  name: string;
  email: string;
  company: string;
  industry: string;
  role: string;
  companySize?: string;
  leadScore: number;
  status: string;
  notes?: string;
  enrichment?: string | Record<string, any>;
  createdAt: string;
}

interface SalesEmail {
  id: string;
  leadId?: string;
  subject: string;
  body: string;
  emailType: string;
  tone: string;
  status: string;
  sentAt?: string;
  createdAt: string;
  lead?: SalesLead;
}

interface SalesMeeting {
  id: string;
  leadId?: string;
  title: string;
  attendees: { name: string; email: string }[];
  dateTime: string;
  duration: number;
  agenda?: string;
  status: string;
  meetingLink?: string;
  lead?: SalesLead;
}

interface DashboardData {
  stats: {
    totalLeads: number;
    totalEmails: number;
    sentEmails: number;
    meetings: number;
    conversionRate: number;
  };
  recentLeads: SalesLead[];
  recentEmails: SalesEmail[];
  upcomingMeetings: SalesMeeting[];
}

/* ─── Helpers ────────────────────────────────────────── */

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  new: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  contacted: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  qualified: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  meeting_set: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  won: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  lost: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  draft: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" },
  sent: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  scheduled: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  completed: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  cancelled: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
};

const getStatusStyle = (status: string) => statusColors[status] || statusColors.new;

const scoreColor = (score: number) => {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#3b82f6";
  return "#ef4444";
};

/* ─── Stat Tile ──────────────────────────────────────── */

const StatCard = ({ label, value, icon: Icon, color, suffix }: { label: string; value: number; icon: any; color: string; suffix?: string }) => (
  <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
    <CardContent className="p-5 flex items-center gap-4">
      <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, borderWidth: 1 }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold text-white font-mono">
          {value}<span className="text-sm text-zinc-500">{suffix || ""}</span>
        </div>
        <div className="text-xs text-zinc-400">{label}</div>
      </div>
    </CardContent>
  </Card>
);

/* ─── Main Page ──────────────────────────────────────── */

export default function SalesAgentPage() {
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [dashboard, setDashboard] = React.useState<DashboardData | null>(null);
  const [leads, setLeads] = React.useState<SalesLead[]>([]);
  const [emails, setEmails] = React.useState<SalesEmail[]>([]);
  const [meetings, setMeetings] = React.useState<SalesMeeting[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  // Lead Finder state
  const [industry, setIndustry] = React.useState("");
  const [targetRole, setTargetRole] = React.useState("");
  const [companySize, setCompanySize] = React.useState("");
  const [isFinding, setIsFinding] = React.useState(false);

  // Email Studio state
  const [selectedLeadId, setSelectedLeadId] = React.useState<string>("");
  const [emailType, setEmailType] = React.useState("cold_outreach");
  const [emailTone, setEmailTone] = React.useState("professional");
  const [emailContext, setEmailContext] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [previewEmail, setPreviewEmail] = React.useState<SalesEmail | null>(null);

  // Meeting state
  const [meetingTitle, setMeetingTitle] = React.useState("");
  const [meetingLeadId, setMeetingLeadId] = React.useState<string>("");
  const [meetingDateTime, setMeetingDateTime] = React.useState("");
  const [meetingDuration, setMeetingDuration] = React.useState("30");
  const [meetingAgenda, setMeetingAgenda] = React.useState("");
  const [isScheduling, setIsScheduling] = React.useState(false);

  // Enrich loading
  const [enrichingId, setEnrichingId] = React.useState<string | null>(null);

  /* ─── Data Fetching ─────────────────────────────────── */

  const loadDashboard = React.useCallback(async () => {
    try {
      const res = await api.get("/agents/sales/dashboard");
      setDashboard(res.data);
    } catch {}
  }, []);

  const loadLeads = React.useCallback(async () => {
    try {
      const res = await api.get("/agents/sales/leads");
      setLeads(res.data || []);
    } catch {}
  }, []);

  const loadEmails = React.useCallback(async () => {
    try {
      const res = await api.get("/agents/sales/emails");
      setEmails(res.data || []);
    } catch {}
  }, []);

  const loadMeetings = React.useCallback(async () => {
    try {
      const res = await api.get("/agents/sales/meetings");
      setMeetings(res.data || []);
    } catch {}
  }, []);

  React.useEffect(() => {
    loadDashboard();
    loadLeads();
    loadEmails();
    loadMeetings();
  }, [loadDashboard, loadLeads, loadEmails, loadMeetings]);

  /* ─── Actions ───────────────────────────────────────── */

  const findLeads = async () => {
    if (!industry.trim() || !targetRole.trim()) return;
    setIsFinding(true);
    setError(null);
    try {
      await api.post("/agents/sales/leads/find", { industry, targetRole, companySize: companySize || "10-500" });
      await loadLeads();
      await loadDashboard();
    } catch (err: any) {
      setError(err.response?.data?.error || "Lead generation failed. Check your AI provider keys in Settings.");
    } finally {
      setIsFinding(false);
    }
  };

  const enrichLead = async (leadId: string) => {
    setEnrichingId(leadId);
    try {
      await api.post(`/agents/sales/leads/${leadId}/enrich`);
      await loadLeads();
    } catch (err: any) {
      setError(err.response?.data?.error || "Enrichment failed.");
    } finally {
      setEnrichingId(null);
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      await api.delete(`/agents/sales/leads/${leadId}`);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      await loadDashboard();
    } catch {}
  };

  const generateEmail = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await api.post("/agents/sales/emails/generate", {
        leadId: selectedLeadId || undefined,
        emailType,
        tone: emailTone,
        context: emailContext,
      });
      setPreviewEmail(res.data);
      await loadEmails();
      await loadDashboard();
    } catch (err: any) {
      setError(err.response?.data?.error || "Email generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async (emailId: string) => {
    try {
      await api.post(`/agents/sales/emails/${emailId}/send`);
      await loadEmails();
      await loadLeads();
      await loadDashboard();
      if (previewEmail?.id === emailId) {
        setPreviewEmail({ ...previewEmail, status: "sent" });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Send failed.");
    }
  };

  const deleteEmail = async (emailId: string) => {
    try {
      await api.delete(`/agents/sales/emails/${emailId}`);
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
      if (previewEmail?.id === emailId) setPreviewEmail(null);
      await loadDashboard();
    } catch {}
  };

  const scheduleMeeting = async () => {
    if (!meetingTitle.trim() || !meetingDateTime) return;
    setIsScheduling(true);
    setError(null);
    try {
      await api.post("/agents/sales/meetings", {
        leadId: meetingLeadId || undefined,
        title: meetingTitle,
        dateTime: meetingDateTime,
        duration: parseInt(meetingDuration) || 30,
        agenda: meetingAgenda,
      });
      setMeetingTitle("");
      setMeetingDateTime("");
      setMeetingAgenda("");
      setMeetingLeadId("");
      await loadMeetings();
      await loadLeads();
      await loadDashboard();
    } catch (err: any) {
      setError(err.response?.data?.error || "Meeting scheduling failed.");
    } finally {
      setIsScheduling(false);
    }
  };

  /* ─── Render ────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/20">
            <Target className="h-6 w-6 text-cyan-400" />
          </div>
          AI Sales Agent
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          AI-powered lead discovery, personalized email outreach, and meeting scheduling for startups & SaaS.
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border border-rose-500/30 bg-rose-500/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                  <p className="text-sm text-rose-300">{error}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300">
                  <XCircle className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-white/10 p-1 flex-wrap">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <BarChart3 className="h-4 w-4 mr-2" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="leads" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <UserPlus className="h-4 w-4 mr-2" /> Lead Finder
          </TabsTrigger>
          <TabsTrigger value="emails" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Mail className="h-4 w-4 mr-2" /> Email Studio
          </TabsTrigger>
          <TabsTrigger value="meetings" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Calendar className="h-4 w-4 mr-2" /> Meetings
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════
            TAB 1: DASHBOARD
        ═══════════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Total Leads", value: dashboard?.stats.totalLeads || 0, icon: Users, color: "#3b82f6" },
              { label: "Emails Generated", value: dashboard?.stats.totalEmails || 0, icon: Mail, color: "#8b5cf6" },
              { label: "Emails Sent", value: dashboard?.stats.sentEmails || 0, icon: Send, color: "#10b981" },
              { label: "Meetings Booked", value: dashboard?.stats.meetings || 0, icon: Calendar, color: "#f59e0b" },
              { label: "Conversion Rate", value: dashboard?.stats.conversionRate || 0, icon: TrendingUp, color: "#06b6d4", suffix: "%" },
            ].map((stat, idx) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                <StatCard {...stat} />
              </motion.div>
            ))}
          </div>

          {/* Recent Activity Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Leads */}
            <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" /> Recent Leads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(dashboard?.recentLeads || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No leads yet. Use Lead Finder to get started.</p>
                ) : (
                  (dashboard?.recentLeads || []).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{lead.role} at {lead.company}</p>
                      </div>
                      <Badge variant="outline" className={`${getStatusStyle(lead.status).bg} ${getStatusStyle(lead.status).text} ${getStatusStyle(lead.status).border} text-[10px] shrink-0`}>
                        {lead.leadScore}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Emails */}
            <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Mail className="h-4 w-4 text-violet-400" /> Recent Emails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(dashboard?.recentEmails || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No emails yet. Use Email Studio to create outreach.</p>
                ) : (
                  (dashboard?.recentEmails || []).map((email) => (
                    <div key={email.id} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{email.subject}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{email.lead?.name || "General"}</p>
                      </div>
                      <Badge variant="outline" className={`${getStatusStyle(email.status).bg} ${getStatusStyle(email.status).text} ${getStatusStyle(email.status).border} text-[10px] shrink-0`}>
                        {email.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Upcoming Meetings */}
            <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-400" /> Upcoming Meetings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(dashboard?.upcomingMeetings || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No upcoming meetings.</p>
                ) : (
                  (dashboard?.upcomingMeetings || []).map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{meeting.title}</p>
                        <p className="text-[11px] text-zinc-500">{new Date(meeting.dateTime).toLocaleDateString()} · {meeting.duration}m</p>
                      </div>
                      <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] shrink-0">
                        <Clock className="h-3 w-3 mr-1" /> {new Date(meeting.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Empty Dashboard State */}
          {!dashboard && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <Target className="h-10 w-10 text-cyan-500/50" />
              </div>
              <h3 className="text-lg font-semibold text-white">Your Sales Command Center</h3>
              <p className="text-sm text-zinc-500 max-w-md text-center">
                Start by finding leads, generating emails, and scheduling meetings. Your pipeline analytics will appear here.
              </p>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
            TAB 2: LEAD FINDER
        ═══════════════════════════════════════════════════ */}
        <TabsContent value="leads" className="space-y-6">
          {/* Search Form */}
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Industry (e.g., FinTech, SaaS, Healthcare)"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-11"
                />
                <Input
                  placeholder="Target Role (e.g., VP of Sales, CTO)"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-11"
                />
                <Input
                  placeholder="Company Size (e.g., 50-200)"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-11"
                />
              </div>
              <Button
                onClick={findLeads}
                disabled={isFinding || !industry.trim() || !targetRole.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 h-11 shadow-lg shadow-cyan-600/20"
              >
                {isFinding ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Finding Leads...</>
                ) : (
                  <><Search className="h-4 w-4 mr-2" /> Find Leads with AI</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Loading */}
          {isFinding && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                <Target className="absolute inset-0 m-auto h-6 w-6 text-cyan-400" />
              </div>
              <p className="text-sm text-zinc-400">AI is discovering qualified leads...</p>
              <p className="text-xs text-zinc-600">Analyzing industry, roles, and company profiles</p>
            </motion.div>
          )}

          {/* Leads Grid */}
          {!isFinding && leads.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" /> Your Leads ({leads.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {leads.map((lead, idx) => {
                  const parsedEnrichment = typeof lead.enrichment === 'string' && lead.enrichment
                    ? (() => { try { return JSON.parse(lead.enrichment); } catch { return null; } })()
                    : lead.enrichment;

                  return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl hover:border-white/20 transition-all group">
                        <CardContent className="p-5 space-y-3">
                          {/* Top Row */}
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-white truncate">{lead.name}</h4>
                              <p className="text-xs text-zinc-400 truncate">{lead.role}</p>
                              <p className="text-xs text-zinc-500 truncate">{lead.company} · {lead.industry}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="text-right">
                                <div className="text-lg font-bold font-mono" style={{ color: scoreColor(lead.leadScore) }}>
                                  {lead.leadScore}
                                </div>
                                <div className="text-[10px] text-zinc-500">Score</div>
                              </div>
                            </div>
                          </div>

                          {/* Score Bar */}
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${lead.leadScore}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: scoreColor(lead.leadScore) }}
                            />
                          </div>

                          {/* Status + Email */}
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={`${getStatusStyle(lead.status).bg} ${getStatusStyle(lead.status).text} ${getStatusStyle(lead.status).border} text-[10px]`}>
                              {lead.status.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-[11px] text-zinc-500 truncate ml-2">{lead.email}</span>
                          </div>

                          {/* Notes */}
                          {lead.notes && (
                            <p className="text-xs text-zinc-400 line-clamp-2 bg-white/5 p-2 rounded-lg border border-white/5">{lead.notes}</p>
                          )}

                          {/* Enrichment Preview */}
                          {parsedEnrichment && (
                            <div className="bg-violet-500/5 border border-violet-500/10 rounded-lg p-2.5 space-y-1">
                              <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wide flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> AI Enriched
                              </p>
                              {parsedEnrichment.bestApproach && (
                                <p className="text-xs text-zinc-300">{parsedEnrichment.bestApproach}</p>
                              )}
                              {parsedEnrichment.buyingSignals && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {parsedEnrichment.buyingSignals.slice(0, 2).map((s: string, i: number) => (
                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/15">{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => enrichLead(lead.id)}
                              disabled={enrichingId === lead.id}
                              className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 text-xs flex-1"
                            >
                              {enrichingId === lead.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                              Enrich
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setSelectedLeadId(lead.id); setActiveTab("emails"); }}
                              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 text-xs flex-1"
                            >
                              <Mail className="h-3 w-3 mr-1" /> Email
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setMeetingLeadId(lead.id); setMeetingTitle(`Meeting with ${lead.name}`); setActiveTab("meetings"); }}
                              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 text-xs flex-1"
                            >
                              <Calendar className="h-3 w-3 mr-1" /> Meet
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteLead(lead.id)}
                              className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isFinding && leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Search className="h-10 w-10 text-blue-500/50" />
              </div>
              <h3 className="text-lg font-semibold text-white">Discover Sales Leads</h3>
              <p className="text-sm text-zinc-500 max-w-md text-center">
                Enter an industry and target role above. AI will generate a list of qualified prospects with lead scores, contact info, and engagement insights.
              </p>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
            TAB 3: EMAIL STUDIO
        ═══════════════════════════════════════════════════ */}
        <TabsContent value="emails" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compose Panel */}
            <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-400" /> AI Email Composer
                </CardTitle>
                <CardDescription className="text-zinc-400">Generate personalized sales emails with AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lead Select */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Link to Lead (optional)</label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    <option value="" className="bg-zinc-900">No lead selected</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id} className="bg-zinc-900">
                        {lead.name} — {lead.company}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email Type */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Email Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "cold_outreach", label: "Cold Outreach", icon: Send },
                      { value: "follow_up", label: "Follow Up", icon: RefreshCw },
                      { value: "meeting_request", label: "Meeting Request", icon: Calendar },
                      { value: "proposal", label: "Proposal", icon: Star },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setEmailType(type.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          emailType === type.value
                            ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <type.icon className="h-3.5 w-3.5" /> {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone */}
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Tone</label>
                  <div className="flex gap-2 flex-wrap">
                    {["professional", "casual", "urgent", "friendly"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setEmailTone(t)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium capitalize transition-all ${
                          emailTone === t
                            ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Context */}
                <Textarea
                  placeholder="Additional context (e.g., mention their recent funding round, specific pain point, etc.)"
                  value={emailContext}
                  onChange={(e) => setEmailContext(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 min-h-[80px] resize-none"
                />

                <Button
                  onClick={generateEmail}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white h-11 shadow-lg shadow-violet-600/20"
                >
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Generate Email</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview / History Panel */}
            <div className="space-y-4">
              {/* Email Preview */}
              {previewEmail && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border border-violet-500/20 bg-zinc-950/60 backdrop-blur-xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                          <Eye className="h-4 w-4 text-violet-400" /> Preview
                        </CardTitle>
                        <Badge variant="outline" className={`${getStatusStyle(previewEmail.status).bg} ${getStatusStyle(previewEmail.status).text} ${getStatusStyle(previewEmail.status).border}`}>
                          {previewEmail.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <p className="text-xs text-zinc-500 mb-1">Subject</p>
                        <p className="text-sm font-medium text-white">{previewEmail.subject}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <p className="text-xs text-zinc-500 mb-1">Body</p>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{previewEmail.body}</p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        {previewEmail.status === "draft" && (
                          <Button
                            onClick={() => sendEmail(previewEmail.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                          >
                            <Send className="h-4 w-4 mr-2" /> Send Email
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => deleteEmail(previewEmail.id)}
                          className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Email History */}
              <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Mail className="h-4 w-4 text-cyan-400" /> Email History ({emails.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                  {emails.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-6">No emails generated yet.</p>
                  ) : (
                    emails.map((email) => (
                      <div
                        key={email.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition cursor-pointer"
                        onClick={() => setPreviewEmail(email)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{email.subject}</p>
                          <p className="text-[11px] text-zinc-500 truncate">
                            {email.emailType.replace(/_/g, " ")} · {email.lead?.name || "General"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`${getStatusStyle(email.status).bg} ${getStatusStyle(email.status).text} ${getStatusStyle(email.status).border} text-[10px]`}>
                            {email.status}
                          </Badge>
                          {email.status === "draft" && (
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); sendEmail(email.id); }} className="text-emerald-400 hover:bg-emerald-500/10 h-7 px-2">
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
            TAB 4: MEETINGS
        ═══════════════════════════════════════════════════ */}
        <TabsContent value="meetings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schedule Form */}
            <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-amber-400" /> Schedule Meeting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Link to Lead (optional)</label>
                  <select
                    value={meetingLeadId}
                    onChange={(e) => {
                      setMeetingLeadId(e.target.value);
                      const lead = leads.find((l) => l.id === e.target.value);
                      if (lead && !meetingTitle) setMeetingTitle(`Meeting with ${lead.name}`);
                    }}
                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="" className="bg-zinc-900">No lead selected</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id} className="bg-zinc-900">{lead.name} — {lead.company}</option>
                    ))}
                  </select>
                </div>

                <Input
                  placeholder="Meeting title"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-11"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block">Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={meetingDateTime}
                      onChange={(e) => setMeetingDateTime(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-11 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block">Duration (min)</label>
                    <select
                      value={meetingDuration}
                      onChange={(e) => setMeetingDuration(e.target.value)}
                      className="w-full h-11 rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    >
                      {[15, 30, 45, 60, 90].map((d) => (
                        <option key={d} value={d} className="bg-zinc-900">{d} min</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Textarea
                  placeholder="Meeting agenda (optional)"
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 min-h-[80px] resize-none"
                />

                <Button
                  onClick={scheduleMeeting}
                  disabled={isScheduling || !meetingTitle.trim() || !meetingDateTime}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white h-11 shadow-lg shadow-amber-600/20"
                >
                  {isScheduling ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Scheduling...</>
                  ) : (
                    <><Calendar className="h-4 w-4 mr-2" /> Schedule Meeting</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Meeting Timeline */}
            <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-400" /> All Meetings ({meetings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {meetings.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
                    <p className="text-sm text-zinc-500">No meetings scheduled yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {meetings.map((meeting, i) => {
                      const isPast = new Date(meeting.dateTime) < new Date();
                      return (
                        <motion.div
                          key={meeting.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`relative pl-8 pb-3 ${i < meetings.length - 1 ? "border-l-2 border-white/10" : ""}`}
                        >
                          <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-zinc-950 ${
                            meeting.status === "completed" ? "bg-emerald-500" :
                            meeting.status === "cancelled" ? "bg-rose-500" :
                            isPast ? "bg-zinc-600" : "bg-amber-500"
                          }`} />
                          <div className="bg-white/5 rounded-lg p-3.5 border border-white/5 hover:bg-white/10 transition">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-white text-sm">{meeting.title}</h4>
                              <Badge variant="outline" className={`${getStatusStyle(meeting.status).bg} ${getStatusStyle(meeting.status).text} ${getStatusStyle(meeting.status).border} text-[10px]`}>
                                {meeting.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-400 mb-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {new Date(meeting.dateTime).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {new Date(meeting.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span>{meeting.duration}m</span>
                            </div>
                            {meeting.lead && (
                              <p className="text-xs text-zinc-500">
                                With: {meeting.lead.name} ({meeting.lead.company})
                              </p>
                            )}
                            {meeting.agenda && (
                              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{meeting.agenda}</p>
                            )}
                            {meeting.meetingLink && (
                              <a
                                href={meeting.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-2"
                              >
                                <Video className="h-3 w-3" /> Join Meeting <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
