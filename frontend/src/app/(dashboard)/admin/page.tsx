"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Activity,
  UserCheck,
  Calendar,
  AlertTriangle,
  Loader2,
  Lock,
  ArrowUpRight,
  Database,
  Terminal,
  RefreshCw,
  Search,
  CheckCircle,
  MessageSquare,
  Bot,
  Trash2,
  Edit,
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  Play,
  Settings,
  Eye,
  Radio,
  Clock,
  ExternalLink,
  Sparkles,
  Plane,
  Workflow,
  Check,
  X,
  Smartphone,
  Server
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api";

interface AdminStats {
  users: number;
  botInstances: number;
  whatsappSessions: number;
  fileTrackers: number;
  totalActivityLogs: number;
  travelBookings: number;
  activeTasks: number;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  provider: string;
  createdAt: string;
}

interface LiveFeedItem {
  id: string;
  type: string;
  agentId: string;
  title: string;
  description: string;
  reasoning?: string;
  status: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [liveFeed, setLiveFeed] = React.useState<LiveFeedItem[]>([]);
  const [logs, setLogs] = React.useState<any[]>([]);

  // Polling state for live activity
  const [isAutoRefresh, setIsAutoRefresh] = React.useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<Date>(new Date());

  const [isLoadingStats, setIsLoadingStats] = React.useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = React.useState(false);
  const [userSearch, setUserSearch] = React.useState("");
  const [feedSearch, setFeedSearch] = React.useState("");
  const [selectedAgentFilter, setSelectedAgentFilter] = React.useState<string>("all");
  const [error, setError] = React.useState<string | null>(null);

  // User Dossier Inspector state
  const [selectedUserDossier, setSelectedUserDossier] = React.useState<any>(null);
  const [isLoadingDossier, setIsLoadingDossier] = React.useState(false);
  const [isDossierOpen, setIsDossierOpen] = React.useState(false);

  // Database Explorer states
  const [dbModels, setDbModels] = React.useState<any[]>([]);
  const [selectedModel, setSelectedModel] = React.useState<string>("");
  const [dbRecords, setDbRecords] = React.useState<any[]>([]);
  const [dbRecordTotal, setDbRecordTotal] = React.useState(0);
  const [dbPage, setDbPage] = React.useState(1);
  const [dbLimit, setDbLimit] = React.useState(15);
  const [dbSearch, setDbSearch] = React.useState("");
  const [dbSortBy, setDbSortBy] = React.useState("");
  const [dbSortOrder, setDbSortOrder] = React.useState<"asc" | "desc">("desc");
  const [dbModelSearch, setDbModelSearch] = React.useState("");

  const [isLoadingModels, setIsLoadingModels] = React.useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = React.useState(false);

  // Detail / CRUD modals
  const [activeRecord, setActiveRecord] = React.useState<any>(null);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editorJson, setEditorJson] = React.useState("");
  const [crudError, setCrudError] = React.useState<string | null>(null);

  // Dev Console states
  const [consoleModel, setConsoleModel] = React.useState("");
  const [consoleOp, setConsoleOp] = React.useState("findMany");
  const [consoleArgs, setConsoleArgs] = React.useState("{\n  \"take\": 5\n}");
  const [consoleResult, setConsoleResult] = React.useState("");
  const [isExecutingConsole, setIsExecutingConsole] = React.useState(false);

  React.useEffect(() => {
    verifyRole();
  }, []);

  // Live feed auto-polling interval
  React.useEffect(() => {
    if (!isAdmin || !isAutoRefresh) return;
    const interval = setInterval(() => {
      loadLiveFeed(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAdmin, isAutoRefresh]);

  const verifyRole = async () => {
    try {
      const res = await api.get("/user/me");
      setProfile(res.data);
      if (res.data && res.data.role === "admin") {
        setIsAdmin(true);
        loadAdminData();
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error(err);
      setIsAdmin(false);
    }
  };

  const loadAdminData = () => {
    loadStats();
    loadUsers();
    loadLiveFeed();
    loadDbModels();
  };

  const loadLiveFeed = async (isBackground = false) => {
    if (!isBackground) setIsLoadingFeed(true);
    try {
      const res = await api.get("/admin/live-feed");
      setLiveFeed(res.data || []);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error("Failed to load live feed", err);
    } finally {
      if (!isBackground) setIsLoadingFeed(false);
    }
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const inspectUser = async (userId: string) => {
    setIsLoadingDossier(true);
    setIsDossierOpen(true);
    try {
      const res = await api.get(`/admin/users/${userId}/dossier`);
      setSelectedUserDossier(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load user dossier");
      setIsDossierOpen(false);
    } finally {
      setIsLoadingDossier(false);
    }
  };

  const loadDbModels = async () => {
    setIsLoadingModels(true);
    try {
      const res = await api.get("/admin/db/models");
      const modelsList = res.data || [];
      setDbModels(modelsList);
      if (modelsList.length > 0 && !selectedModel) {
        setSelectedModel(modelsList[0].name);
        setConsoleModel(modelsList[0].name);
      }
    } catch (err) {
      console.error("Failed to load db models", err);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const loadDbRecords = async (modelName: string) => {
    if (!modelName) return;
    setIsLoadingRecords(true);
    setCrudError(null);
    try {
      const res = await api.get(
        `/admin/db/models/${modelName}?page=${dbPage}&limit=${dbLimit}&search=${dbSearch}&sortBy=${dbSortBy}&sortOrder=${dbSortOrder}`
      );
      setDbRecords(res.data?.records || []);
      setDbRecordTotal(res.data?.total || 0);
    } catch (err: any) {
      console.error("Failed to load db records", err);
      setCrudError(err.response?.data?.error || "Failed to load database records.");
    } finally {
      setIsLoadingRecords(false);
    }
  };

  React.useEffect(() => {
    if (isAdmin && selectedModel) {
      loadDbRecords(selectedModel);
    }
  }, [selectedModel, dbPage, dbLimit, dbSearch, dbSortBy, dbSortOrder, isAdmin]);

  const handleSaveEdit = async () => {
    if (!selectedModel || !activeRecord) return;
    setCrudError(null);
    try {
      const parsed = JSON.parse(editorJson);
      const modelMeta = dbModels.find(m => m.name === selectedModel);
      const idField = modelMeta?.fields.find((f: any) => f.isId)?.name || "id";
      const idVal = activeRecord[idField];
      
      const res = await api.put(`/admin/db/models/${selectedModel}/${idVal}`, parsed);
      setDbRecords(prev => prev.map(r => r[idField] === idVal ? res.data : r));
      setIsEditOpen(false);
    } catch (err: any) {
      setCrudError(err.message || err.response?.data?.error || "JSON parse error or server update failure.");
    }
  };

  const handleSaveCreate = async () => {
    if (!selectedModel) return;
    setCrudError(null);
    try {
      const parsed = JSON.parse(editorJson);
      const res = await api.post(`/admin/db/models/${selectedModel}`, parsed);
      setDbRecords(prev => [res.data, ...prev]);
      setDbRecordTotal(prev => prev + 1);
      setIsCreateOpen(false);
    } catch (err: any) {
      setCrudError(err.message || err.response?.data?.error || "JSON parse error or server creation failure.");
    }
  };

  const handleDeleteRecord = async (record: any) => {
    if (!selectedModel) return;
    const modelMeta = dbModels.find(m => m.name === selectedModel);
    const idField = modelMeta?.fields.find((f: any) => f.isId)?.name || "id";
    const idVal = record[idField];
    
    if (!confirm(`Are you sure you want to delete this record from ${selectedModel}?`)) return;
    
    try {
      await api.delete(`/admin/db/models/${selectedModel}/${idVal}`);
      setDbRecords(prev => prev.filter(r => r[idField] !== idVal));
      setDbRecordTotal(prev => prev - 1);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete record");
    }
  };

  const handleExecuteConsole = async () => {
    if (!consoleModel) return;
    setIsExecutingConsole(true);
    setConsoleResult("");
    try {
      const parsedArgs = JSON.parse(consoleArgs);
      const res = await api.post("/admin/db/query", {
        model: consoleModel,
        operation: consoleOp,
        args: parsedArgs
      });
      setConsoleResult(JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      setConsoleResult(`Error: ${err.message || err.response?.data?.error || "Invalid arguments JSON or query failed"}`);
    } finally {
      setIsExecutingConsole(false);
    }
  };

  const openEditModal = (record: any) => {
    setActiveRecord(record);
    const editableFields: any = {};
    const modelMeta = dbModels.find(m => m.name === selectedModel);
    if (modelMeta) {
      modelMeta.fields.forEach((field: any) => {
        if (field.kind === 'scalar' && !field.isId && record[field.name] !== undefined) {
          editableFields[field.name] = record[field.name];
        }
      });
    }
    setEditorJson(JSON.stringify(editableFields, null, 2));
    setCrudError(null);
    setIsEditOpen(true);
  };

  const openCreateModal = () => {
    const template: any = {};
    const modelMeta = dbModels.find(m => m.name === selectedModel);
    if (modelMeta) {
      modelMeta.fields.forEach((field: any) => {
        if (field.kind === 'scalar' && !field.isId) {
          if (field.type === 'String') template[field.name] = "";
          else if (field.type === 'Int' || field.type === 'Float') template[field.name] = 0;
          else if (field.type === 'Boolean') template[field.name] = false;
          else if (field.type === 'DateTime') template[field.name] = new Date().toISOString();
          else template[field.name] = null;
        }
      });
    }
    setEditorJson(JSON.stringify(template, null, 2));
    setCrudError(null);
    setIsCreateOpen(true);
  };

  const toggleUserRole = async (targetUser: UserItem) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    try {
      const res = await api.put(`/admin/users/${targetUser.id}`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: res.data.role } : u))
      );
      if (profile && profile.id === targetUser.id) {
        setProfile((prev: any) => ({ ...prev, role: res.data.role }));
        if (res.data.role !== "admin") setIsAdmin(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update role");
    }
  };

  // Filtered users
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filtered live feed
  const filteredFeed = liveFeed.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(feedSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(feedSearch.toLowerCase()) ||
      (item.user && item.user.name.toLowerCase().includes(feedSearch.toLowerCase())) ||
      (item.user && item.user.email.toLowerCase().includes(feedSearch.toLowerCase()));

    const matchesAgent =
      selectedAgentFilter === "all" || item.agentId === selectedAgentFilter;

    return matchesSearch && matchesAgent;
  });

  // Access check
  if (isAdmin === null) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
          <p className="text-sm text-zinc-500 font-semibold">Verifying administrative access...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border border-rose-500/20 bg-zinc-950/40 backdrop-blur-md text-center py-10 px-6 space-y-6">
            <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Lock className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Access Gated Area</h2>
              <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                The Nexora Administrator panel is restricted to system operators. Log in with an admin account to view live telemetry and user activities.
              </p>
            </div>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-6"
            >
              Return to Workspace
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header & Live Heartbeat ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
              Admin & Live Activity Monitor
            </h1>
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5 text-[10px] uppercase font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </Badge>
          </div>
          <p className="text-zinc-400 text-xs md:text-sm mt-1">
            Real-time telemetry of active users, queries, bot deployments, and transactions.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            variant="outline"
            size="sm"
            className={`h-9 text-xs rounded-xl border transition-all ${
              isAutoRefresh
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                : "border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Radio className={`h-3.5 w-3.5 mr-1.5 ${isAutoRefresh ? "animate-pulse text-emerald-400" : ""}`} />
            {isAutoRefresh ? "Auto-refresh: 4s" : "Auto-refresh: Paused"}
          </Button>

          <Button
            onClick={() => loadAdminData()}
            variant="outline"
            size="sm"
            className="border-zinc-800 bg-transparent text-zinc-300 hover:text-white hover:bg-white/5 font-semibold gap-1.5 h-9 rounded-xl text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingFeed ? "animate-spin" : ""}`} /> Sync Now
          </Button>
        </div>
      </div>

      {/* ─── Platform Metric Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Platform Users", value: stats?.users ?? 0, icon: Users, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
          { label: "Active Bot Deployments", value: stats?.botInstances ?? 0, icon: Bot, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
          { label: "Travel Reservations", value: stats?.travelBookings ?? 0, icon: Calendar, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
          { label: "WhatsApp Sessions", value: stats?.whatsappSessions ?? 0, icon: MessageSquare, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-zinc-950/50 border-white/[0.07] backdrop-blur-md overflow-hidden relative rounded-2xl">
              <div className="absolute top-0 right-0 h-16 w-16 bg-white/[0.03] rounded-full blur-xl pointer-events-none" />
              <CardContent className="p-4 md:p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{stat.label}</span>
                  <p className="text-2xl md:text-3xl font-black text-white">{stat.value}</p>
                </div>
                <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl border flex items-center justify-center shrink-0 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Navigation Tabs ─── */}
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="bg-zinc-900/60 border border-white/[0.06] p-1 rounded-xl mb-6 grid grid-cols-3 max-w-md">
          <TabsTrigger value="feed" className="rounded-lg text-xs py-1.5 flex items-center gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Activity className="h-3.5 w-3.5" />
            <span>Live Stream</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg text-xs py-1.5 flex items-center gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Users className="h-3.5 w-3.5" />
            <span>User Directory</span>
          </TabsTrigger>
          <TabsTrigger value="db" className="rounded-lg text-xs py-1.5 flex items-center gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Database className="h-3.5 w-3.5" />
            <span>DB Explorer</span>
          </TabsTrigger>
        </TabsList>

        {/* ══════════ TAB 1: REAL-TIME LIVE ACTIVITY STREAM ══════════ */}
        <TabsContent value="feed" className="space-y-4 outline-none">
          <Card className="bg-zinc-950/50 border-white/[0.07] backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="p-4 md:p-5 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  Live User Actions & AI Agent Execution Log
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs mt-0.5">
                  Chronological real-time audit of what users are searching, booking, automating, and running.
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <Input
                    placeholder="Filter by user or action..."
                    value={feedSearch}
                    onChange={(e) => setFeedSearch(e.target.value)}
                    className="bg-white/[0.03] border-white/10 text-white rounded-xl pl-8 h-8 text-xs placeholder:text-zinc-600"
                  />
                </div>

                <select
                  value={selectedAgentFilter}
                  onChange={(e) => setSelectedAgentFilter(e.target.value)}
                  className="bg-white/[0.04] border border-white/10 text-zinc-300 rounded-xl px-2.5 h-8 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Agents & Events</option>
                  <option value="travel">Travel Booking</option>
                  <option value="stock">Stock Intelligence</option>
                  <option value="startup">Startup Co-Founder</option>
                  <option value="career">Career Accelerator</option>
                  <option value="automator">Business Automator</option>
                  <option value="sales">Sales Agent</option>
                  <option value="whatsapp">WhatsApp Bot</option>
                  <option value="system">System & Auth</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoadingFeed && liveFeed.length === 0 ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                </div>
              ) : filteredFeed.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 space-y-2">
                  <Activity className="h-10 w-10 mx-auto opacity-20" />
                  <p className="text-sm">No activity matching your filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
                  {filteredFeed.map((item) => {
                    const isSuccess = item.status === "success" || item.status === "completed";
                    const isFailed = item.status === "failed" || item.status === "error";

                    return (
                      <div
                        key={item.id}
                        className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* User Avatar */}
                          <button
                            onClick={() => item.user?.id && inspectUser(item.user.id)}
                            className="shrink-0 mt-0.5 group/avatar"
                            title="Click to inspect user dossier"
                          >
                            <Avatar className="h-9 w-9 border border-white/10 group-hover/avatar:border-indigo-500 transition-colors">
                              <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold text-xs">
                                {item.user?.name ? item.user.name.slice(0, 2).toUpperCase() : "U"}
                              </AvatarFallback>
                            </Avatar>
                          </button>

                          {/* Event info */}
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {item.user ? (
                                <button
                                  onClick={() => item.user?.id && inspectUser(item.user.id)}
                                  className="font-bold text-white hover:text-indigo-400 transition-colors text-left truncate max-w-[150px] sm:max-w-[200px]"
                                >
                                  {item.user.name}
                                </button>
                              ) : (
                                <span className="font-semibold text-zinc-500">System</span>
                              )}

                              <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono px-1.5 py-0.2 rounded-md">
                                {item.agentId || "agent"}
                              </Badge>

                              <span className="font-semibold text-zinc-200">{item.title}</span>
                            </div>

                            <p className="text-zinc-400 text-xs leading-relaxed">
                              {item.description}
                            </p>

                            {item.reasoning && (
                              <p className="text-[11px] text-zinc-500 italic pl-2 border-l-2 border-indigo-500/40">
                                Reasoning: {item.reasoning}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Timestamp & Status */}
                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1.5 shrink-0 pl-12 sm:pl-0">
                          <Badge
                            className={`text-[10px] capitalize font-medium rounded-full px-2 py-0.5 ${
                              isSuccess
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isFailed
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-zinc-800 text-zinc-400 border-none"
                            }`}
                          >
                            {item.status}
                          </Badge>

                          <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════ TAB 2: USER DIRECTORY & DOSSIER INSPECTOR ══════════ */}
        <TabsContent value="users" className="space-y-4 outline-none">
          <Card className="bg-zinc-950/50 border-white/[0.07] backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="p-4 md:p-5 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-white">Registered Users Directory</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Inspect user dossiers, check authentication sources, and manage admin privileges.
                </CardDescription>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <Input
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-white/[0.03] border-white/10 text-white rounded-xl pl-9 h-9 text-xs placeholder:text-zinc-600"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {isLoadingUsers ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No matching users found.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-zinc-400 bg-white/[0.02]">
                      <th className="p-4 font-bold">User</th>
                      <th className="p-4 font-bold">Email</th>
                      <th className="p-4 font-bold">Role</th>
                      <th className="p-4 font-bold">Auth Provider</th>
                      <th className="p-4 font-bold">Joined</th>
                      <th className="p-4 font-bold text-right">Dossier / Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <button
                            onClick={() => inspectUser(user.id)}
                            className="flex items-center gap-2.5 font-bold text-white hover:text-indigo-400 transition-colors text-left"
                          >
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
                                {user.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </button>
                        </td>

                        <td className="p-4 text-zinc-300 font-mono text-[11px]">{user.email}</td>

                        <td className="p-4">
                          <Badge className={user.role === "admin" ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25" : "bg-zinc-800 text-zinc-400 border-none"}>
                            {user.role}
                          </Badge>
                        </td>

                        <td className="p-4 text-zinc-400 capitalize">{user.provider || "Credentials"}</td>

                        <td className="p-4 text-zinc-500">
                          {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>

                        <td className="p-4 text-right space-x-2">
                          <Button
                            onClick={() => inspectUser(user.id)}
                            size="sm"
                            className="h-7 text-xs bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg px-2.5"
                          >
                            <Eye className="h-3 w-3 mr-1" /> Dossier
                          </Button>

                          <Button
                            onClick={() => toggleUserRole(user)}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-zinc-400 hover:text-white rounded-lg px-2"
                          >
                            {user.role === "admin" ? "Demote" : "Make Admin"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════ TAB 3: DATABASE EXPLORER & PRISMA CONSOLE ══════════ */}
        <TabsContent value="db" className="space-y-4 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar: Models List */}
            <Card className="bg-zinc-950/50 border-white/[0.07] backdrop-blur-xl lg:col-span-1 flex flex-col max-h-[700px] rounded-2xl">
              <CardHeader className="p-4 pb-2 border-b border-white/[0.06]">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-400" /> Database Tables
                </CardTitle>
                <div className="relative w-full mt-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <Input
                    placeholder="Search tables..."
                    value={dbModelSearch}
                    onChange={(e) => setDbModelSearch(e.target.value)}
                    className="bg-white/[0.03] border-white/10 text-white rounded-xl pl-8 h-8 text-[11px]"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-2 overflow-y-auto flex-1 space-y-1">
                {isLoadingModels ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                  </div>
                ) : (
                  dbModels
                    .filter(m => m.name.toLowerCase().includes(dbModelSearch.toLowerCase()))
                    .map((m) => (
                      <button
                        key={m.name}
                        onClick={() => {
                          setSelectedModel(m.name);
                          setConsoleModel(m.name);
                          setDbPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          selectedModel === m.name
                            ? "bg-indigo-600/15 border border-indigo-500/25 text-white font-bold"
                            : "hover:bg-white/[0.03] text-zinc-400 border border-transparent"
                        }`}
                      >
                        <span className="truncate">{m.name}</span>
                        <Badge className="bg-zinc-800 text-zinc-400 border-none px-1.5 py-0.5 font-mono text-[10px]">
                          {m.count}
                        </Badge>
                      </button>
                    ))
                )}
              </CardContent>
            </Card>

            {/* Main Section */}
            <div className="lg:col-span-3 space-y-6">
              <Tabs defaultValue="records" className="w-full">
                <TabsList className="bg-zinc-900/40 border border-white/[0.06] p-1 rounded-xl mb-4 flex w-fit gap-1">
                  <TabsTrigger value="records" className="rounded-lg text-xs py-1 px-3">
                    Records Viewer
                  </TabsTrigger>
                  <TabsTrigger value="console" className="rounded-lg text-xs py-1 px-3">
                    Prisma Console
                  </TabsTrigger>
                </TabsList>

                {/* Records Viewer Content */}
                <TabsContent value="records" className="outline-none space-y-4">
                  <Card className="bg-zinc-950/50 border-white/[0.07] backdrop-blur-xl flex flex-col min-h-[500px] rounded-2xl overflow-hidden">
                    <CardHeader className="p-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                          {selectedModel || "No Table Selected"}
                          <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                            {dbRecordTotal} Rows
                          </Badge>
                        </CardTitle>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-40">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                          <Input
                            placeholder="Search..."
                            value={dbSearch}
                            onChange={(e) => { setDbSearch(e.target.value); setDbPage(1); }}
                            className="bg-white/[0.03] border-white/10 text-white rounded-xl pl-8 h-8 text-xs"
                          />
                        </div>
                        <Button onClick={() => loadDbRecords(selectedModel)} variant="outline" size="sm" className="h-8 border-white/10 bg-transparent text-zinc-400 hover:text-white rounded-xl px-2.5">
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button onClick={openCreateModal} size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 rounded-xl flex items-center gap-1 text-xs">
                          <Plus className="h-3.5 w-3.5" /> New Row
                        </Button>
                      </div>
                    </CardHeader>

                    {crudError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 m-4 rounded-xl text-xs flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{crudError}</span>
                      </div>
                    )}

                    <CardContent className="p-0 overflow-x-auto flex-1">
                      {isLoadingRecords ? (
                        <div className="flex justify-center items-center py-20">
                          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        </div>
                      ) : dbRecords.length === 0 ? (
                        <div className="text-center py-20 text-zinc-500 text-xs">
                          <Database className="h-8 w-8 mx-auto mb-2 opacity-25" />
                          No records found in this table.
                        </div>
                      ) : (
                        <table className="w-full text-left text-[11px] border-collapse font-mono">
                          <thead>
                            <tr className="border-b border-white/[0.06] text-zinc-400 bg-white/[0.02]">
                              {dbModels
                                .find(m => m.name === selectedModel)
                                ?.fields.filter((f: any) => f.kind === 'scalar' && !f.isList)
                                .slice(0, 5)
                                .map((f: any) => (
                                  <th
                                    key={f.name}
                                    onClick={() => {
                                      setDbSortBy(f.name);
                                      setDbSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                    }}
                                    className="p-3 font-bold cursor-pointer hover:text-white"
                                  >
                                    {f.name} {dbSortBy === f.name ? (dbSortOrder === 'asc' ? '↑' : '↓') : ''}
                                  </th>
                                ))}
                              <th className="p-3 font-bold text-right font-sans">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {dbRecords.map((record) => {
                              const fields = dbModels
                                .find(m => m.name === selectedModel)
                                ?.fields.filter((f: any) => f.kind === 'scalar' && !f.isList)
                                .slice(0, 5) || [];
                              
                              const idField = dbModels.find(m => m.name === selectedModel)?.fields.find((f: any) => f.isId)?.name || "id";

                              return (
                                <tr key={record[idField]} className="hover:bg-white/[0.02] transition-colors">
                                  {fields.map((field: any) => {
                                    let val = record[field.name];
                                    if (val === null || val === undefined) val = "null";
                                    else if (typeof val === 'boolean') val = val ? "true" : "false";
                                    else if (typeof val === 'object') val = JSON.stringify(val);
                                    else if (field.type === 'DateTime') val = new Date(val).toLocaleString();
                                    
                                    return (
                                      <td key={field.name} className="p-3 max-w-[200px] truncate text-zinc-300">
                                        {String(val)}
                                      </td>
                                    );
                                  })}
                                  <td className="p-3 text-right space-x-1 whitespace-nowrap font-sans">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => { setActiveRecord(record); setIsViewOpen(true); }}
                                      className="h-7 w-7 p-0 text-zinc-400 hover:text-white rounded-lg"
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => openEditModal(record)}
                                      className="h-7 w-7 p-0 text-indigo-400 hover:text-white rounded-lg"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteRecord(record)}
                                      className="h-7 w-7 p-0 text-rose-400 hover:text-white rounded-lg"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </CardContent>

                    {/* Pagination */}
                    {dbRecordTotal > dbLimit && (
                      <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
                        <span>
                          Showing {(dbPage - 1) * dbLimit + 1} to {Math.min(dbPage * dbLimit, dbRecordTotal)} of {dbRecordTotal} records
                        </span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setDbPage(p => Math.max(1, p - 1))} disabled={dbPage === 1} className="h-7 px-2 border-white/10 bg-transparent text-zinc-400">
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setDbPage(p => p + 1)} disabled={dbPage * dbLimit >= dbRecordTotal} className="h-7 px-2 border-white/10 bg-transparent text-zinc-400">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                {/* Prisma Console Content */}
                <TabsContent value="console" className="outline-none space-y-4">
                  <Card className="bg-zinc-950/50 border-white/[0.07] backdrop-blur-xl p-4 min-h-[500px] flex flex-col rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                      {/* Left: Input */}
                      <div className="space-y-3 flex flex-col">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Model</span>
                            <select
                              value={consoleModel}
                              onChange={(e) => setConsoleModel(e.target.value)}
                              className="w-full bg-white/[0.04] border border-white/10 text-white rounded-xl text-xs p-2 focus:ring-1 focus:ring-indigo-500"
                            >
                              {dbModels.map(m => (
                                <option key={m.name} value={m.name}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Operation</span>
                            <select
                              value={consoleOp}
                              onChange={(e) => setConsoleOp(e.target.value)}
                              className="w-full bg-white/[0.04] border border-white/10 text-white rounded-xl text-xs p-2 focus:ring-1 focus:ring-indigo-500"
                            >
                              {["findMany", "findFirst", "findUnique", "count"].map(op => (
                                <option key={op} value={op}>{op}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col space-y-1">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Arguments (JSON)</span>
                          <textarea
                            value={consoleArgs}
                            onChange={(e) => setConsoleArgs(e.target.value)}
                            className="w-full flex-1 bg-white/[0.03] border border-white/10 p-3 rounded-xl font-mono text-[11px] text-zinc-300 focus:ring-1 focus:ring-indigo-500 min-h-[220px]"
                          />
                        </div>

                        <Button
                          onClick={handleExecuteConsole}
                          disabled={isExecutingConsole || !consoleModel}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
                        >
                          {isExecutingConsole ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Executing...</>
                          ) : (
                            <><Play className="h-3.5 w-3.5 fill-current" /> Run Query</>
                          )}
                        </Button>
                      </div>

                      {/* Right: Output */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">JSON Result</span>
                        <div className="w-full flex-1 bg-zinc-950 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-auto max-h-[420px]">
                          {consoleResult ? (
                            <pre className="whitespace-pre">{consoleResult}</pre>
                          ) : (
                            <span className="text-zinc-600 italic">No output recorded. Run a query to view results.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ════════════ USER DEEP DOSSIER INSPECTOR MODAL ════════════ */}
      <AnimatePresence>
        {isDossierOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-white"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
                    {selectedUserDossier?.name ? selectedUserDossier.name.slice(0, 2).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      {selectedUserDossier?.name || "Loading Dossier..."}
                      {selectedUserDossier?.role === "admin" && (
                        <Badge className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 text-[10px]">Admin</Badge>
                      )}
                    </h3>
                    <p className="text-xs text-zinc-400">{selectedUserDossier?.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDossierOpen(false)}
                  className="h-8 w-8 text-zinc-500 hover:text-white rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-6">
                {isLoadingDossier ? (
                  <div className="py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400">Compiling user activity dossier...</p>
                  </div>
                ) : selectedUserDossier ? (
                  <>
                    {/* User Metadata Quick Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[10px] text-zinc-500 font-medium">Joined Date</span>
                        <p className="text-xs font-bold text-zinc-200 mt-0.5">
                          {new Date(selectedUserDossier.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[10px] text-zinc-500 font-medium">Auth Source</span>
                        <p className="text-xs font-bold text-zinc-200 mt-0.5 capitalize">
                          {selectedUserDossier.provider || "Credentials"}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[10px] text-zinc-500 font-medium">Installed Bots</span>
                        <p className="text-xs font-bold text-indigo-400 mt-0.5">
                          {selectedUserDossier.botInstances?.length || 0} Bots
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[10px] text-zinc-500 font-medium">Total AI Log Events</span>
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">
                          {selectedUserDossier.agentLogs?.length || 0} Events
                        </p>
                      </div>
                    </div>

                    {/* Deployed Bots */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Deployed Bot Instances</h4>
                      {selectedUserDossier.botInstances?.length === 0 ? (
                        <p className="text-xs text-zinc-600 italic">No bots installed yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedUserDossier.botInstances?.map((inst: any) => (
                            <div key={inst.id} className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                              <div>
                                <p className="font-semibold text-white">{inst.bot?.name || "AI Bot"}</p>
                                <span className="text-[10px] text-zinc-500 capitalize">{inst.bot?.category || "Automation"}</span>
                              </div>
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                                {inst.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent AI Agent Activities */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent AI Agent Actions</h4>
                      {selectedUserDossier.agentLogs?.length === 0 ? (
                        <p className="text-xs text-zinc-600 italic">No AI activity recorded.</p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                          {selectedUserDossier.agentLogs?.map((log: any) => (
                            <div key={log.id} className="p-3 rounded-xl border border-white/[0.04] bg-white/[0.02] space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-indigo-300">[{log.agentId}] {log.action}</span>
                                <span className="text-[10px] text-zinc-500">{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                              <p className="text-zinc-400 text-xs">{log.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Travel Searches & Bookings */}
                    {selectedUserDossier.bookingSearches?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Travel Searches</h4>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
                          {selectedUserDossier.bookingSearches.map((s: any) => (
                            <div key={s.id} className="p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] flex items-center justify-between">
                              <span className="text-zinc-300">{s.mode.toUpperCase()}: {s.origin} ➔ {s.destination}</span>
                              <span className="text-[10px] text-zinc-500">{new Date(s.createdAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-white/[0.02] flex justify-end">
                <Button onClick={() => setIsDossierOpen(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl px-5">
                  Close Dossier
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Database Record View Modal ─── */}
      <AnimatePresence>
        {isViewOpen && activeRecord && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col text-white">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-bold text-white text-sm">Record Details ({selectedModel})</h3>
                <button onClick={() => setIsViewOpen(false)} className="h-7 w-7 text-zinc-500 hover:text-white rounded-lg">✕</button>
              </div>
              <div className="p-4 overflow-auto max-h-[500px] font-mono text-xs text-zinc-300">
                <pre className="whitespace-pre-wrap">{JSON.stringify(activeRecord, null, 2)}</pre>
              </div>
              <div className="p-3 border-t border-white/10 flex justify-end">
                <Button onClick={() => setIsViewOpen(false)} className="bg-zinc-900 text-white text-xs rounded-lg px-4">Close</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
