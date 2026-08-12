"use client";

import * as React from "react";
import { Settings, ShieldAlert, Plus, Trash2, Key, Globe, Eye, EyeOff, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useToast } from "@/components/ui/toaster";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiKey } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "@/lib/api";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  // Deployed Bot Instances State
  const [botInstances, setBotInstances] = React.useState<any[]>([]);
  const [loadingBots, setLoadingBots] = React.useState(true);
  const [editingBot, setEditingBot] = React.useState<any>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = React.useState(false);
  const [botConfigText, setBotConfigText] = React.useState("");

  const fetchBotInstances = async () => {
    try {
      setLoadingBots(true);
      const { data } = await api.get("/bots/instances/user");
      setBotInstances(data);
    } catch (err) {
      console.error("Failed to fetch bot instances:", err);
    } finally {
      setLoadingBots(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/me");
      setProfile({
        name: res.data.name || "User",
        email: res.data.email || "",
        role: res.data.role || "user",
        plan: res.data.subscription?.plan || "Free",
      });
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  const fetchKeys = async () => {
    try {
      const { data } = await api.get("/user/api-keys");
      const mapped = data.map((k: any) => ({
        id: k.id,
        provider: k.provider,
        name: k.label,
        key: "••••••••••••••••",
        isActive: k.isActive,
        lastUsed: k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never",
        createdAt: new Date(k.createdAt).toISOString().split("T")[0],
      }));
      setKeys(mapped);
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
    }
  };

  React.useEffect(() => {
    fetchBotInstances();
    fetchProfile();
    fetchKeys();
  }, []);

  const handleToggleBotStatus = async (botId: string) => {
    try {
      await api.post(`/bots/instances/${botId}/toggle`);
      fetchBotInstances();
    } catch (err: any) {
      addToast({ type: "error", title: "Toggle Failed", description: err.response?.data?.error || err.message });
    }
  };

  const handleUninstallBot = async (botId: string) => {
    if (!confirm("Are you sure you want to uninstall this bot instance?")) return;
    try {
      await api.delete(`/bots/instances/${botId}/uninstall`);
      setBotInstances(prev => prev.filter(inst => inst.botId !== botId));
      addToast({ type: "success", title: "Bot Uninstalled", description: "Agent instance removed successfully." });
    } catch (err: any) {
      addToast({ type: "error", title: "Uninstall Failed", description: err.response?.data?.error || err.message });
    }
  };

  const handleOpenConfigDialog = (instance: any) => {
    setEditingBot(instance);
    setBotConfigText(JSON.stringify(instance.config || {}, null, 2));
    setIsConfigDialogOpen(true);
  };

  const handleSaveBotConfig = async () => {
    if (!editingBot) return;
    try {
      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(botConfigText);
      } catch {
        addToast({ type: "warning", title: "Invalid JSON", description: "Please check your config structure." });
        return;
      }

      await api.post(`/bots/instances/${editingBot.botId}/config`, {
        config: parsedConfig
      });
      setIsConfigDialogOpen(false);
      fetchBotInstances();
      addToast({ type: "success", title: "Config Updated", description: "Bot configuration saved successfully." });
    } catch (err: any) {
      addToast({ type: "error", title: "Save Failed", description: err.response?.data?.error || err.message });
    }
  };

  // Live Profile Info
  const [profile, setProfile] = React.useState({
    name: "",
    email: "",
    role: "",
    plan: "",
  });

  // Real Keys Info from Database
  const [keys, setKeys] = React.useState<ApiKey[]>([]);

  const [webhookUrl, setWebhookUrl] = React.useState("https://api.nexusforge.ai/v1/webhooks/whatsapp");
  const [isSaved, setIsSaved] = React.useState(false);
  const [snowEnabled, setSnowEnabled] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexora_snow_enabled");
      setSnowEnabled(stored !== "false");
    }
  }, []);

  // Key creation state
  const [newKeyName, setNewKeyName] = React.useState("");
  const [newKeyProvider, setNewKeyProvider] = React.useState("gemini");
  const [newKeyValue, setNewKeyValue] = React.useState("");

  const handleToggleKey = async (id: string) => {
    try {
      const { data } = await api.put(`/user/api-keys/${id}/toggle`);
      setKeys(prev =>
        prev.map((k) => (k.id === id ? { ...k, isActive: data.isActive } : k))
      );
      addToast({ type: "success", title: "Key Status Updated", description: "API key status changed successfully." });
    } catch (err: any) {
      addToast({ type: "error", title: "Toggle Key Failed", description: err.response?.data?.error || err.message });
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;
    try {
      await api.delete(`/user/api-keys/${id}`);
      setKeys(prev => prev.filter((k) => k.id !== id));
      addToast({ type: "success", title: "API Key Deleted", description: "The API key was removed successfully." });
    } catch (err: any) {
      addToast({ type: "error", title: "Delete Key Failed", description: err.response?.data?.error || err.message });
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || !newKeyValue) return;

    try {
      await api.post("/user/api-keys", {
        provider: newKeyProvider.toLowerCase(),
        key: newKeyValue,
        label: newKeyName,
      });
      addToast({ type: "success", title: "API Key Bound", description: "Your API key is securely saved to database." });
      setNewKeyName("");
      setNewKeyValue("");
      fetchKeys();
    } catch (err: any) {
      addToast({ type: "error", title: "Bind Key Failed", description: err.response?.data?.error || err.message });
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.put("/user/profile", { name: profile.name });
      addToast({ type: "success", title: "Profile Saved", description: "Your workspace profile has been updated." });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      addToast({ type: "error", title: "Save Failed", description: err.response?.data?.error || err.message });
    }
  };

  return (
    <div className="space-y-6 text-white max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Workspace Settings <Settings className="h-5.5 w-5.5 text-indigo-400 animate-spin-slow" />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Coordinate profile access details, API keys, theme controls, and webhook links.
          </p>
        </div>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2 animate-slide-up">
          <CheckCircle className="h-4 w-4" />
          <span>Workspace preferences saved successfully.</span>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-zinc-950/40 border border-white/[0.06] p-1 w-full md:w-auto flex overflow-x-auto scrollbar-none">
          <TabsTrigger value="general" className="data-[state=active]:bg-indigo-600/10 data-[state=active]:text-indigo-400 text-zinc-400 font-medium px-4 py-2">
            General
          </TabsTrigger>
          <TabsTrigger value="keys" className="data-[state=active]:bg-indigo-600/10 data-[state=active]:text-indigo-400 text-zinc-400 font-medium px-4 py-2">
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-indigo-600/10 data-[state=active]:text-indigo-400 text-zinc-400 font-medium px-4 py-2">
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-indigo-600/10 data-[state=active]:text-indigo-400 text-zinc-400 font-medium px-4 py-2">
            Deployed Agents
          </TabsTrigger>
        </TabsList>

        {/* ─── GENERAL TAB ─── */}
        <TabsContent value="general" className="space-y-6 animate-fade-in-scale">
          {/* 1. Profile Information */}
          <Card className="border border-white/10 bg-zinc-950/40">
            <CardHeader>
              <CardTitle className="text-base text-white">Profile Details</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Your login identity info.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prof-name">Name</Label>
                  <Input
                    id="prof-name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prof-email">Email</Label>
                  <Input
                    id="prof-email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-white/5 border-white/10 text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <div>
                  <span className="text-xs text-zinc-500 block">Workspace Role</span>
                  <Badge variant="outline" className="mt-1 bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-semibold">
                    {profile.role}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">Billing Plan</span>
                  <Badge variant="outline" className="mt-1 bg-violet-500/10 border-violet-500/20 text-violet-400 font-semibold">
                    {profile.plan} Plan
                  </Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-4">
              <Button onClick={handleSaveSettings} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                Save Profile Info
              </Button>
            </CardFooter>
          </Card>

          {/* Appearance & Theme */}
          <Card className="border border-white/10 bg-zinc-950/40">
            <CardHeader>
              <CardTitle className="text-base text-white">Appearance & Theme</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Customize workspace display settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-semibold text-sm text-white">Toggle Light Mode</span>
                  <p className="text-xs text-zinc-500">Enable light theme background overlays.</p>
                </div>
                <Switch
                  checked={theme === "light"}
                  onCheckedChange={toggleTheme}
                />
              </div>

              <Separator className="bg-white/5" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-semibold text-sm text-white">Snow Particles</span>
                  <p className="text-xs text-zinc-500">Enable floating particle background on the landing page.</p>
                </div>
                <Switch
                  checked={snowEnabled}
                  onCheckedChange={(val) => {
                    setSnowEnabled(val);
                    localStorage.setItem("nexora_snow_enabled", val ? "true" : "false");
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("nexora_snow_toggled"));
                    }
                    addToast({
                      type: "success",
                      title: val ? "Snow Particles Enabled" : "Snow Particles Disabled",
                      description: val ? "Snow particle background turned on." : "Snow particle background turned off.",
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border border-rose-500/20 bg-rose-950/5">
            <CardHeader>
              <CardTitle className="text-base text-rose-400 flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5" /> Danger Zone
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Irreversible account operations and workspace purges.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-semibold text-sm text-white">Clear All Local Data</span>
                <p className="text-xs text-zinc-500">Resets the paper trading simulation and deletes cached variables.</p>
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Resetting local data will clear paper trading logs and workspace caches. Proceed?")) {
                    localStorage.removeItem("nexora_paper_trading");
                    addToast({ type: "success", title: "Local Caches Purged", description: "Simulation values reset." });
                  }
                }}
                className="font-semibold border-rose-500/20 text-white shrink-0"
              >
                Purge Cache
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── API KEYS TAB ─── */}
        <TabsContent value="keys" className="space-y-6 animate-fade-in-scale">
          <Card className="border border-white/10 bg-zinc-950/40">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Key className="h-4.5 w-4.5 text-indigo-400" /> AI Provider API Keys
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                API keys required for local or global LLM orchestration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Table List */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-500 text-xs uppercase">
                      <th className="py-2.5">Provider</th>
                      <th className="py-2.5">Name</th>
                      <th className="py-2.5">Masked Key</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5">Last Used</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {keys.map((k) => (
                      <tr key={k.id} className="hover:bg-white/5">
                        <td className="py-3 font-semibold text-white">{k.provider}</td>
                        <td className="py-3 text-xs text-zinc-400">{k.name}</td>
                        <td className="py-3 font-mono text-xs text-zinc-500">{k.key}</td>
                        <td className="py-3">
                          <Switch
                            checked={k.isActive}
                            onCheckedChange={() => handleToggleKey(k.id)}
                            className="scale-90"
                          />
                        </td>
                        <td className="py-3 text-xs text-zinc-500">{k.lastUsed || "Never"}</td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteKey(k.id)}
                            className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                            title="Delete key"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator className="bg-white/10" />

              {/* Add Key Form */}
              <form onSubmit={handleAddKey} className="space-y-4">
                <h4 className="text-sm font-semibold text-white">Add API Key</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="key-name">Key Identifier</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g. Sandbox Key"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="key-provider">Provider</Label>
                    <Input
                      id="key-provider"
                      placeholder="e.g. OpenAI / Groq"
                      value={newKeyProvider}
                      onChange={(e) => setNewKeyProvider(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="key-val">Key Value</Label>
                    <Input
                      id="key-val"
                      type="password"
                      placeholder="sk-proj-..."
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={!newKeyName || !newKeyValue} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                  <Plus className="h-4 w-4 mr-1.5" /> Bind Key
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── WEBHOOKS TAB ─── */}
        <TabsContent value="webhooks" className="space-y-6 animate-fade-in-scale">
          <Card className="border border-white/10 bg-zinc-950/40">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Globe className="h-4.5 w-4.5 text-indigo-400" /> Webhook Routing URL
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Define target webhook URLs for receiving channel events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="webhook-url">Inbound Message Webhook</Label>
                <Input
                  id="webhook-url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg flex items-center gap-2.5 text-xs text-zinc-400">
                <ShieldAlert className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span>Ensure this URL resolves HTTPS events securely. Retries are configured for 3 failed responses.</span>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-4">
              <Button onClick={handleSaveSettings} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                Save Webhook Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ─── DEPLOYED AGENTS TAB ─── */}
        <TabsContent value="agents" className="space-y-6 animate-fade-in-scale">
          <Card className="border border-white/10 bg-zinc-950/40">
            <CardHeader>
              <CardTitle className="text-base text-white">Deployed Agent Instances</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Manage your deployed bots, toggle statuses, and customize configurations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingBots ? (
                <div className="text-center py-6 text-sm text-zinc-500">
                  Loading active bot instances...
                </div>
              ) : botInstances.length === 0 ? (
                <div className="text-center py-6 text-sm text-zinc-500">
                  No bots currently deployed. Go to the <a href="/bots" className="text-indigo-400 hover:underline">Marketplace</a> to deploy agents.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {botInstances.map((inst) => (
                    <div key={inst.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">{inst.bot?.name}</span>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono border-indigo-500/20 bg-indigo-500/5 text-indigo-400">
                            {inst.bot?.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-1">{inst.bot?.description}</p>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          ID: {inst.botId} &bull; Deployed: {new Date(inst.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto">
                        {/* Active Toggle */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400">{inst.status === "active" ? "Active" : "Inactive"}</span>
                          <Switch
                            checked={inst.status === "active"}
                            onCheckedChange={() => handleToggleBotStatus(inst.botId)}
                            className="scale-90"
                          />
                        </div>

                        {/* Configure Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenConfigDialog(inst)}
                          className="h-8 border-white/10 hover:bg-white/5 text-zinc-300"
                        >
                          Configure
                        </Button>

                        {/* Uninstall Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUninstallBot(inst.botId)}
                          className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          title="Uninstall bot"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Bot Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-lg bg-zinc-950 border border-white/10 text-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Configure {editingBot?.bot?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-1">
              Customize JSON configuration parameters and prompt overrides for your AI instance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="bot-config">Configuration JSON</Label>
              <textarea
                id="bot-config"
                rows={8}
                value={botConfigText}
                onChange={(e) => setBotConfigText(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white font-mono text-sm p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder='{\n  "systemPrompt": "Custom instruction...",\n  "temperature": 0.7\n}'
              />
              <p className="text-[11px] text-zinc-500">
                Ensure you enter valid JSON. You can customize "systemPrompt", "temperature", "maxTokens", or other model parameters.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-white/5 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsConfigDialogOpen(false)} className="border-white/10 text-zinc-300">
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveBotConfig} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
