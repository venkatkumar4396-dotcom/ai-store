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
  Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface HealthLog {
  id: string;
  userId: string;
  agentId: string;
  action: string;
  description: string;
  reasoning: string;
  status: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [logs, setLogs] = React.useState<HealthLog[]>([]);

  const [isLoadingStats, setIsLoadingStats] = React.useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = React.useState(false);
  const [userSearch, setUserSearch] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

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
    loadLogs();
    loadDbModels();
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

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.get("/admin/logs");
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const toggleUserRole = async (targetUser: UserItem) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    try {
      const res = await api.put(`/admin/users/${targetUser.id}`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: res.data.role } : u))
      );
      // If updating yourself, update the state
      if (profile && profile.id === targetUser.id) {
        setProfile((prev: any) => ({ ...prev, role: res.data.role }));
        if (res.data.role !== "admin") {
          setIsAdmin(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update role");
    }
  };

  // Filter users
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // loading check
  if (isAdmin === null) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
          <p className="text-sm text-zinc-500 font-semibold">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // Access Denied
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
                The Nexora Administrator panel is restricted to system operators. Log in with an admin account or request promotion from database owners.
              </p>
            </div>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-zinc-900 border border-zinc-800 text-white font-semibold rounded-lg px-6"
            >
              Return to Workspace
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2.5">
            Admin Console <ShieldCheck className="h-6 w-6 text-indigo-400 animate-pulse" />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Global operational overview of active users, bot deployments, and platform intelligence logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={loadAdminData}
            variant="outline"
            size="sm"
            className="border-zinc-800 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40 font-semibold gap-1.5 h-9 rounded-lg"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Sync Data
          </Button>
          <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1">
            Root Operator
          </Badge>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Platform Users", value: stats?.users ?? 0, icon: Users, color: "text-indigo-400 bg-indigo-500/5 border-indigo-500/10" },
          { label: "AI Travel Reservations", value: stats?.travelBookings ?? 0, icon: Calendar, color: "text-violet-400 bg-violet-500/5 border-violet-500/10" },
          { label: "Total Tasks Scheduled", value: stats?.activeTasks ?? 0, icon: Activity, color: "text-cyan-400 bg-cyan-500/5 border-cyan-500/10" },
          { label: "WhatsApp Chatbots", value: stats?.whatsappSessions ?? 0, icon: MessageSquare, color: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-zinc-950/40 border-zinc-900 overflow-hidden relative">
              <div className="absolute top-0 right-0 h-16 w-16 bg-white/5 rounded-full blur-xl pointer-events-none" />
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{stat.label}</span>
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                </div>
                <div className={`h-11 w-11 rounded-lg border flex items-center justify-center shrink-0 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-zinc-900/60 border border-zinc-800/80 p-0.5 rounded-lg mb-6">
          <TabsTrigger value="users" className="rounded-md text-xs py-1.5">
            <Users className="h-3.5 w-3.5 mr-1.5" /> User Directory
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-md text-xs py-1.5">
            <Terminal className="h-3.5 w-3.5 mr-1.5" /> Platform Health logs
          </TabsTrigger>
          <TabsTrigger value="db" className="rounded-md text-xs py-1.5">
            <Database className="h-3.5 w-3.5 mr-1.5" /> Database Explorer
          </TabsTrigger>
        </TabsList>

        {/* USER MANAGER TAB */}
        <TabsContent value="users" className="space-y-4 outline-none">
          <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-zinc-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-white">Registered Users</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Manage roles, check auth providers, and audit user permissions.
                </CardDescription>
              </div>
              <div className="relative w-full max-w-xs shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Search email or name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-zinc-900/40 border-zinc-800 focus-visible:ring-indigo-500 text-white rounded-lg pl-9 h-9 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {isLoadingUsers ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No matching users found.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-400 bg-zinc-900/10">
                      <th className="p-4 font-bold">User Name</th>
                      <th className="p-4 font-bold">Email</th>
                      <th className="p-4 font-bold">Role</th>
                      <th className="p-4 font-bold">Auth Source</th>
                      <th className="p-4 font-bold">Registered Date</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-zinc-900/60 hover:bg-white/2 transition-colors">
                        <td className="p-4 font-bold text-white">{user.name}</td>
                        <td className="p-4 text-zinc-300 font-mono">{user.email}</td>
                        <td className="p-4">
                          <Badge className={user.role === "admin" ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25" : "bg-zinc-800 text-zinc-400 border-none"}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="capitalize text-zinc-400">{user.provider || "Credentials"}</span>
                        </td>
                        <td className="p-4 text-zinc-400">
                          {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            onClick={() => toggleUserRole(user)}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] font-bold text-indigo-400 hover:text-white hover:bg-indigo-600/10 rounded-md border border-indigo-500/15 px-2.5"
                          >
                            {user.role === "admin" ? "Demote" : "Promote Admin"}
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

        {/* HEALTH LOGS TAB */}
        <TabsContent value="logs" className="space-y-4 outline-none">
          <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-zinc-900/60 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-400" /> Platform Transaction stream
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Real-time cognitive operation logs recorded by AI agent routines.
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 font-mono text-[9px] uppercase font-bold animate-pulse px-2 py-0.5 rounded">
                Live stream
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 px-4 pb-4">
              {isLoadingLogs ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-zinc-550">
                  <Terminal className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-xs">No activity logs recorded yet.</p>
                </div>
              ) : (
                <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 font-mono text-[11px] text-zinc-300 space-y-3.5 max-h-[500px] overflow-y-auto shadow-inner">
                  {logs.map((log) => {
                    const badgeColor =
                      log.status === "success"
                        ? "text-emerald-450 bg-emerald-500/5 border-emerald-500/10"
                        : "text-rose-400 bg-rose-500/5 border-rose-500/10";

                    return (
                      <div key={log.id} className="border-b border-zinc-900 pb-3 last:border-b-0 last:pb-0">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 font-bold">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-mono text-[9px] uppercase px-1.5 py-0.2">
                              {log.agentId}
                            </Badge>
                            <span className="font-bold text-white">{log.action}</span>
                          </div>
                          <Badge className={`border rounded text-[9px] uppercase ${badgeColor}`}>
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-zinc-400 mt-1 pl-4 leading-normal">{log.description}</p>
                        {log.reasoning && (
                          <div className="mt-1 pl-4 text-zinc-500 flex items-start gap-1">
                            <span className="text-indigo-400/80">Reasoning:</span>
                            <span className="italic leading-normal">{log.reasoning}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-zinc-650 mt-1 pl-4">
                          User: <strong className="text-zinc-400 font-medium">{log.user?.name}</strong> ({log.user?.email})
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATABASE EXPLORER TAB */}
        <TabsContent value="db" className="space-y-4 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar: Models List */}
            <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md lg:col-span-1 flex flex-col max-h-[700px]">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-400" /> Database Tables
                </CardTitle>
                <div className="relative w-full mt-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <Input
                    placeholder="Search tables..."
                    value={dbModelSearch}
                    onChange={(e) => setDbModelSearch(e.target.value)}
                    className="bg-zinc-900/40 border-zinc-800 text-white rounded-lg pl-8 h-8 text-[11px]"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-2 overflow-y-auto flex-1 space-y-1 font-sans">
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
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          selectedModel === m.name
                            ? "bg-indigo-600/15 border border-indigo-500/25 text-white font-bold"
                            : "hover:bg-white/2 text-zinc-400 border border-transparent"
                        }`}
                      >
                        <span className="truncate">{m.name}</span>
                        <Badge className="bg-zinc-850 text-zinc-400 border-none scale-90 px-1.5 py-0.5 font-mono">
                          {m.count}
                        </Badge>
                      </button>
                    ))
                )}
              </CardContent>
            </Card>

            {/* Main Section: Records and Dev Console */}
            <div className="lg:col-span-3 space-y-6">
              <Tabs defaultValue="records" className="w-full font-sans">
                <TabsList className="bg-zinc-900/40 border border-zinc-800/80 p-0.5 rounded-lg mb-4 flex w-fit gap-1">
                  <TabsTrigger value="records" className="rounded-md text-[11px] py-1 px-3">
                    Records Viewer
                  </TabsTrigger>
                  <TabsTrigger value="console" className="rounded-md text-[11px] py-1 px-3">
                    Prisma Console
                  </TabsTrigger>
                </TabsList>

                {/* Records Viewer Content */}
                <TabsContent value="records" className="outline-none space-y-4">
                  <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md flex flex-col min-h-[500px]">
                    <CardHeader className="p-4 pb-3 border-b border-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                          {selectedModel || "No Table Selected"}
                          <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                            {dbRecordTotal} Rows
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-zinc-500 text-[11px] mt-0.5">
                          Manage and query records in the `{selectedModel}` table.
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        <div className="relative w-full sm:w-44">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                          <Input
                            placeholder="Quick search..."
                            value={dbSearch}
                            onChange={(e) => {
                              setDbSearch(e.target.value);
                              setDbPage(1);
                            }}
                            className="bg-zinc-900/40 border-zinc-800 text-white rounded-lg pl-8 h-8 text-[11px]"
                          />
                        </div>
                        <Button
                          onClick={() => loadDbRecords(selectedModel)}
                          variant="outline"
                          size="sm"
                          className="h-8 border-zinc-800 bg-transparent text-zinc-400 hover:text-white px-2.5 rounded-lg"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={openCreateModal}
                          size="sm"
                          className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 rounded-lg flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> New Row
                        </Button>
                      </div>
                    </CardHeader>

                    {crudError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 m-4 mb-0 rounded-lg text-xs flex items-center gap-2">
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
                        <table className="w-full text-left text-[11px] border-collapse font-sans">
                          <thead>
                            <tr className="border-b border-zinc-900 text-zinc-400 bg-zinc-900/10">
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
                              <th className="p-3 font-bold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dbRecords.map((record) => {
                              const fields = dbModels
                                .find(m => m.name === selectedModel)
                                ?.fields.filter((f: any) => f.kind === 'scalar' && !f.isList)
                                .slice(0, 5) || [];
                              
                              const idField = dbModels.find(m => m.name === selectedModel)?.fields.find((f: any) => f.isId)?.name || "id";

                              return (
                                <tr key={record[idField]} className="border-b border-zinc-900/60 hover:bg-white/2 transition-colors">
                                  {fields.map((field: any) => {
                                    let val = record[field.name];
                                    if (val === null || val === undefined) val = "null";
                                    else if (typeof val === 'boolean') val = val ? "true" : "false";
                                    else if (typeof val === 'object') val = JSON.stringify(val);
                                    else if (field.type === 'DateTime') val = new Date(val).toLocaleString();
                                    
                                    return (
                                      <td key={field.name} className="p-3 max-w-[200px] truncate text-zinc-300 font-mono">
                                        {String(val)}
                                      </td>
                                    );
                                  })}
                                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setActiveRecord(record);
                                        setIsViewOpen(true);
                                      }}
                                      className="h-7 w-7 p-0 text-zinc-400 hover:text-white rounded-md hover:bg-white/5"
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => openEditModal(record)}
                                      className="h-7 w-7 p-0 text-indigo-400 hover:text-white rounded-md hover:bg-indigo-600/10"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteRecord(record)}
                                      className="h-7 w-7 p-0 text-rose-400 hover:text-white rounded-md hover:bg-rose-600/10"
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
                      <div className="p-3 border-t border-zinc-900/60 flex items-center justify-between text-xs text-zinc-500">
                        <span>
                          Showing {(dbPage - 1) * dbLimit + 1} to {Math.min(dbPage * dbLimit, dbRecordTotal)} of {dbRecordTotal} records
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDbPage(p => Math.max(1, p - 1))}
                            disabled={dbPage === 1}
                            className="h-7 px-2 border-zinc-800 bg-transparent text-zinc-400 hover:text-white"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDbPage(p => p + 1)}
                            disabled={dbPage * dbLimit >= dbRecordTotal}
                            className="h-7 px-2 border-zinc-800 bg-transparent text-zinc-400 hover:text-white"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                {/* Prisma Console Content */}
                <TabsContent value="console" className="outline-none space-y-4 font-sans">
                  <Card className="bg-zinc-950/40 border-zinc-900 backdrop-blur-md p-4 min-h-[500px] flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                      {/* Left: Input */}
                      <div className="space-y-3 flex flex-col">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1 flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Model</span>
                            <select
                              value={consoleModel}
                              onChange={(e) => setConsoleModel(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg text-xs p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            >
                              {dbModels.map(m => (
                                <option key={m.name} value={m.name}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1 flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Operation</span>
                            <select
                              value={consoleOp}
                              onChange={(e) => setConsoleOp(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg text-xs p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            >
                              {["findMany", "findFirst", "findUnique", "count", "create", "update", "delete"].map(op => (
                                <option key={op} value={op}>{op}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col space-y-1">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Query Arguments (JSON)</span>
                          <textarea
                            value={consoleArgs}
                            onChange={(e) => setConsoleArgs(e.target.value)}
                            className="w-full flex-1 bg-zinc-900/60 border border-zinc-850 p-3 rounded-xl font-mono text-[11px] text-zinc-300 focus:ring-1 focus:ring-indigo-500 focus:outline-none min-h-[250px]"
                          />
                        </div>
                        <Button
                          onClick={handleExecuteConsole}
                          disabled={isExecutingConsole || !consoleModel}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-9 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15"
                        >
                          {isExecutingConsole ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Running...</>
                          ) : (
                            <><Play className="h-3.5 w-3.5 fill-current" /> Execute Query</>
                          )}
                        </Button>
                      </div>

                      {/* Right: Output */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Execution Output</span>
                        <div className="w-full flex-1 bg-zinc-950 border border-zinc-900 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-auto max-h-[420px] shadow-inner">
                          {consoleResult ? (
                            <pre className="whitespace-pre">{consoleResult}</pre>
                          ) : (
                            <span className="text-zinc-650 italic">No output recorded. Run a query to view results.</span>
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

      {/* ─── DATABASE EXPLORER MODALS ─── */}
      <AnimatePresence>
        {isViewOpen && activeRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-900 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col text-white"
            >
              <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
                <div>
                  <h3 className="font-bold text-white text-base">Record Details</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">Table: {selectedModel}</span>
                </div>
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg flex items-center justify-center hover:bg-white/5 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="p-5 overflow-auto max-h-[500px] font-mono text-[11px] text-zinc-300 bg-zinc-950">
                <pre className="whitespace-pre-wrap">{JSON.stringify(activeRecord, null, 2)}</pre>
              </div>
              <div className="p-4 border-t border-zinc-900 bg-zinc-900/10 flex justify-end">
                <Button
                  onClick={() => setIsViewOpen(false)}
                  className="bg-zinc-900 border border-zinc-800 text-white font-semibold text-xs px-4 py-1.5 rounded-lg"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isEditOpen && activeRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-900 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col text-white"
            >
              <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
                <div>
                  <h3 className="font-bold text-white text-base">Modify Row Data</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">Table: {selectedModel}</span>
                </div>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg flex items-center justify-center hover:bg-white/5 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="p-5 flex-1 flex flex-col space-y-3 bg-zinc-950">
                {crudError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{crudError}</span>
                  </div>
                )}
                <div className="flex-1 flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Edit Payload (JSON)</span>
                  <textarea
                    value={editorJson}
                    onChange={(e) => setEditorJson(e.target.value)}
                    className="w-full flex-1 min-h-[300px] bg-zinc-900 border border-zinc-850 p-4 rounded-xl font-mono text-[11px] text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-zinc-900 bg-zinc-900/10 flex justify-end gap-2">
                <Button
                  onClick={() => setIsEditOpen(false)}
                  variant="ghost"
                  className="text-zinc-500 hover:text-white hover:bg-white/5 text-xs font-semibold px-4 animate-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-1.5 rounded-lg shadow-lg shadow-indigo-600/15"
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-900 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col text-white"
            >
              <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
                <div>
                  <h3 className="font-bold text-white text-base">Insert New Record</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">Table: {selectedModel}</span>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg flex items-center justify-center hover:bg-white/5 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="p-5 flex-1 flex flex-col space-y-3 bg-zinc-950">
                {crudError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{crudError}</span>
                  </div>
                )}
                <div className="flex-1 flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Create Payload (JSON)</span>
                  <textarea
                    value={editorJson}
                    onChange={(e) => setEditorJson(e.target.value)}
                    className="w-full flex-1 min-h-[300px] bg-zinc-900 border border-zinc-850 p-4 rounded-xl font-mono text-[11px] text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-zinc-900 bg-zinc-900/10 flex justify-end gap-2">
                <Button
                  onClick={() => setIsCreateOpen(false)}
                  variant="ghost"
                  className="text-zinc-500 hover:text-white hover:bg-white/5 text-xs font-semibold px-4 animate-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCreate}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-1.5 rounded-lg shadow-lg shadow-indigo-600/15"
                >
                  Insert Row
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
