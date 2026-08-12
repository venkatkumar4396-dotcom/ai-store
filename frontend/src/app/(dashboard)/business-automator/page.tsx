"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Workflow,
  Users,
  Mail,
  FileText,
  Brain,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Plus,
  Trash2,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Clock,
  Phone,
  Send,
  UserPlus,
  Zap,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  value: number;
  notes: string;
  createdAt: string;
}

interface WorkflowItem {
  id: string;
  name: string;
  trigger: string;
  action: string;
  isActive: boolean;
  createdAt: string;
}

interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  items: { description: string; quantity: number; rate: number }[];
  totalAmount: number;
  status: "draft" | "sent" | "paid";
  createdAt: string;
}

interface EmailDraft {
  subject: string;
  body: string;
}

const statusColors: Record<string, string> = {
  new: "border-blue-500/20 text-blue-400 bg-blue-500/10",
  contacted: "border-amber-500/20 text-amber-400 bg-amber-500/10",
  qualified: "border-cyan-500/20 text-cyan-400 bg-cyan-500/10",
  proposal: "border-violet-500/20 text-violet-400 bg-violet-500/10",
  won: "border-emerald-500/20 text-emerald-400 bg-emerald-500/10",
  lost: "border-rose-500/20 text-rose-400 bg-rose-500/10",
};

export default function BusinessAutomatorPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [workflows, setWorkflows] = React.useState<WorkflowItem[]>([]);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("leads");
  const [emailDraft, setEmailDraft] = React.useState<EmailDraft | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = React.useState(false);
  const [copiedEmail, setCopiedEmail] = React.useState(false);

  // Lead form
  const [leadName, setLeadName] = React.useState("");
  const [leadEmail, setLeadEmail] = React.useState("");
  const [leadCompany, setLeadCompany] = React.useState("");
  const [leadValue, setLeadValue] = React.useState("");
  const [showLeadForm, setShowLeadForm] = React.useState(false);

  // Invoice form
  const [invClient, setInvClient] = React.useState("");
  const [invEmail, setInvEmail] = React.useState("");
  const [invItems, setInvItems] = React.useState([{ description: "", quantity: 1, rate: 0 }]);
  const [showInvoiceForm, setShowInvoiceForm] = React.useState(false);

  // Email generation
  const [emailContext, setEmailContext] = React.useState("");

  React.useEffect(() => {
    loadLeads();
    loadWorkflows();
    loadInvoices();
  }, []);

  const loadLeads = async () => {
    try {
      const res = await api.get("/agents/automator/leads");
      setLeads(res.data || []);
    } catch {}
  };

  const loadWorkflows = async () => {
    try {
      const res = await api.get("/agents/automator/workflows");
      setWorkflows(res.data || []);
    } catch {}
  };

  const loadInvoices = async () => {
    try {
      const res = await api.get("/agents/automator/invoices");
      setInvoices(res.data || []);
    } catch {}
  };

  const addLead = async () => {
    if (!leadName.trim()) return;
    try {
      await api.post("/agents/automator/leads", {
        name: leadName,
        email: leadEmail,
        notes: `Company: ${leadCompany || 'N/A'} | Deal Value: $${leadValue || '0'}`,
      });
      setLeadName("");
      setLeadEmail("");
      setLeadCompany("");
      setLeadValue("");
      setShowLeadForm(false);
      loadLeads();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add lead.");
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      await api.post(`/agents/automator/leads/${leadId}/status`, { status });
      loadLeads();
    } catch {}
  };

  const deleteLead = async (leadId: string) => {
    // Mark as lost instead of deleting (no delete route)
    try {
      await api.post(`/agents/automator/leads/${leadId}/status`, { status: 'lost' });
      loadLeads();
    } catch {}
  };

  const createInvoice = async () => {
    if (!invClient.trim()) return;
    try {
      await api.post("/agents/automator/invoices", {
        clientName: invClient,
        clientEmail: invEmail,
        items: invItems.filter((i) => i.description.trim()),
      });
      setInvClient("");
      setInvEmail("");
      setInvItems([{ description: "", quantity: 1, rate: 0 }]);
      setShowInvoiceForm(false);
      loadInvoices();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create invoice.");
    }
  };

  const generateFollowUpEmail = async (leadId?: string) => {
    setIsGeneratingEmail(true);
    setError(null);
    try {
      // If we have a specific lead, use the lead-specific endpoint
      if (leadId) {
        const res = await api.post(`/agents/automator/leads/${leadId}/email`, {
          pitchGoal: emailContext || "Follow up on potential partnership",
        });
        setEmailDraft(res.data);
      } else {
        // For general email, pick the first lead or use a generic context
        const firstLead = leads.length > 0 ? leads[0] : null;
        if (firstLead) {
          const res = await api.post(`/agents/automator/leads/${firstLead.id}/email`, {
            pitchGoal: emailContext || "Follow up on potential partnership",
          });
          setEmailDraft(res.data);
        } else {
          setError("Please add at least one lead before generating an email draft.");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Email generation failed.");
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const toggleWorkflow = async (wfId: string, isActive: boolean) => {
    try {
      await api.post(`/agents/automator/workflows/${wfId}/toggle`);
      loadWorkflows();
    } catch {}
  };

  const pipelineStats = React.useMemo(() => {
    const total = leads.length;
    const totalValue = leads.reduce((s, l) => s + l.value, 0);
    const wonValue = leads.filter((l) => l.status === "won").reduce((s, l) => s + l.value, 0);
    const convRate = total > 0 ? ((leads.filter((l) => l.status === "won").length / total) * 100).toFixed(1) : "0";
    return { total, totalValue, wonValue, convRate };
  }, [leads]);

  const addInvoiceItem = () => {
    setInvItems([...invItems, { description: "", quantity: 1, rate: 0 }]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-pink-500/20">
            <Workflow className="h-6 w-6 text-pink-400" />
          </div>
          Business Automation Agent
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Lead management, email drafting, invoice creation, workflow automation, and productivity analytics.
        </p>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Users className="h-5 w-5 text-blue-400" /></div>
            <div>
              <div className="text-xl font-bold text-white">{pipelineStats.total}</div>
              <div className="text-xs text-zinc-500">Total Leads</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><DollarSign className="h-5 w-5 text-emerald-400" /></div>
            <div>
              <div className="text-xl font-bold text-white">${pipelineStats.totalValue.toLocaleString()}</div>
              <div className="text-xs text-zinc-500">Pipeline Value</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><CheckCircle2 className="h-5 w-5 text-amber-400" /></div>
            <div>
              <div className="text-xl font-bold text-white">${pipelineStats.wonValue.toLocaleString()}</div>
              <div className="text-xs text-zinc-500">Won Value</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10"><BarChart3 className="h-5 w-5 text-violet-400" /></div>
            <div>
              <div className="text-xl font-bold text-white">{pipelineStats.convRate}%</div>
              <div className="text-xs text-zinc-500">Conversion Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border border-rose-500/30 bg-rose-500/10">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                <p className="text-sm text-rose-300">{error}</p>
                <Button size="sm" variant="ghost" onClick={() => setError(null)} className="ml-auto text-zinc-400">✕</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-white/10 p-1 w-full overflow-x-auto scrollbar-none flex justify-start sm:justify-center min-w-0">
          <TabsTrigger value="leads" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Users className="h-4 w-4 mr-2" /> Leads CRM
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Mail className="h-4 w-4 mr-2" /> Email Drafts
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <FileText className="h-4 w-4 mr-2" /> Invoices
          </TabsTrigger>
          <TabsTrigger value="workflows" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
            <Zap className="h-4 w-4 mr-2" /> Workflows
          </TabsTrigger>
        </TabsList>

        {/* ─── LEADS TAB ─── */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Lead Pipeline</h3>
            <Button
              onClick={() => setShowLeadForm(!showLeadForm)}
              className="bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-600/20"
            >
              <UserPlus className="h-4 w-4 mr-2" /> Add Lead
            </Button>
          </div>

          {/* Add Lead Form */}
          <AnimatePresence>
            {showLeadForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="Name" value={leadName} onChange={(e) => setLeadName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                      <Input placeholder="Email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                      <Input placeholder="Company" value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                      <Input placeholder="Deal Value ($)" type="number" value={leadValue} onChange={(e) => setLeadValue(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addLead} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                        <Plus className="h-4 w-4 mr-1" /> Save Lead
                      </Button>
                      <Button variant="ghost" onClick={() => setShowLeadForm(false)} className="text-zinc-400">Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lead List */}
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardContent className="p-0">
              {leads.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  <Users className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
                  No leads yet. Add your first lead to start building your pipeline.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-zinc-500 border-b border-white/5">
                        <th className="text-left p-4 font-medium">Name</th>
                        <th className="text-left p-4 font-medium">Company</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-right p-4 font-medium">Value</th>
                        <th className="text-right p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="p-4">
                            <div className="font-semibold text-white">{lead.name}</div>
                            <div className="text-xs text-zinc-500">{lead.email}</div>
                          </td>
                          <td className="p-4 text-zinc-300">{lead.company || "—"}</td>
                          <td className="p-4">
                            <Select
                              value={lead.status}
                              onValueChange={(val) => updateLeadStatus(lead.id, val)}
                            >
                              <SelectTrigger className="w-32 h-8 bg-transparent border-white/10 text-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-white/10">
                                {["new", "contacted", "qualified", "proposal", "won", "lost"].map((s) => (
                                  <SelectItem key={s} value={s} className="text-zinc-300 text-xs capitalize">
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-4 text-right font-mono text-emerald-400">${lead.value.toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => { setEmailContext(`Follow up with ${lead.name} from ${lead.company}`); setActiveTab("email"); }} className="text-zinc-400 hover:text-white" title="Draft Email">
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteLead(lead.id)} className="text-zinc-400 hover:text-rose-400" title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── EMAIL TAB ─── */}
        <TabsContent value="email" className="space-y-4">
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-cyan-400" /> AI Email Draft Generator
              </CardTitle>
              <CardDescription className="text-zinc-400">Describe the context and the AI will draft a professional email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g., Follow-up email for a potential client who showed interest in our enterprise plan..."
                value={emailContext}
                onChange={(e) => setEmailContext(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 min-h-[100px] resize-none"
              />
              <Button
                onClick={() => generateFollowUpEmail()}
                disabled={isGeneratingEmail || !emailContext.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20"
              >
                {isGeneratingEmail ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
                ) : (
                  <><Brain className="h-4 w-4 mr-2" /> Generate Email</>
                )}
              </Button>

              {emailDraft && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Draft Result</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`); setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000); }}
                      className="border-white/10 text-zinc-300"
                    >
                      {copiedEmail ? <><Check className="h-4 w-4 mr-1 text-emerald-400" /> Copied</> : <><Copy className="h-4 w-4 mr-1" /> Copy</>}
                    </Button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-2">
                    <div className="text-xs text-zinc-500">Subject:</div>
                    <div className="text-sm font-semibold text-white">{emailDraft.subject}</div>
                    <div className="border-t border-white/5 pt-3 mt-3">
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{emailDraft.body}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── INVOICES TAB ─── */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Invoices</h3>
            <Button
              onClick={() => setShowInvoiceForm(!showInvoiceForm)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Invoice
            </Button>
          </div>

          {/* Invoice Form */}
          <AnimatePresence>
            {showInvoiceForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="Client Name" value={invClient} onChange={(e) => setInvClient(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                      <Input placeholder="Client Email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-zinc-400">Line Items</h4>
                      {invItems.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => { const copy = [...invItems]; copy[idx].description = e.target.value; setInvItems(copy); }}
                            className="flex-1 bg-white/5 border-white/10 text-white"
                          />
                          <Input
                            placeholder="Qty"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => { const copy = [...invItems]; copy[idx].quantity = parseInt(e.target.value) || 1; setInvItems(copy); }}
                            className="w-20 bg-white/5 border-white/10 text-white"
                          />
                          <Input
                            placeholder="Rate"
                            type="number"
                            value={item.rate}
                            onChange={(e) => { const copy = [...invItems]; copy[idx].rate = parseFloat(e.target.value) || 0; setInvItems(copy); }}
                            className="w-28 bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      ))}
                      <Button size="sm" variant="ghost" onClick={addInvoiceItem} className="text-zinc-400 hover:text-white">
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                      </Button>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="text-sm text-zinc-400">
                        Total: <span className="text-white font-mono font-semibold">${invItems.reduce((s, i) => s + i.quantity * i.rate, 0).toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={createInvoice} className="bg-emerald-600 hover:bg-emerald-500 text-white">Save Invoice</Button>
                        <Button variant="ghost" onClick={() => setShowInvoiceForm(false)} className="text-zinc-400">Cancel</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Invoice List */}
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  <FileText className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
                  No invoices yet.
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-white/5">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition">
                      <div className="space-y-1">
                        <div className="font-semibold text-white">{inv.clientName}</div>
                        <div className="text-xs text-zinc-500">{inv.clientEmail}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold font-mono text-emerald-400">${inv.totalAmount.toFixed(2)}</span>
                        <Badge variant="outline" className={inv.status === "paid" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10" : inv.status === "sent" ? "border-amber-500/20 text-amber-400 bg-amber-500/10" : "border-zinc-500/20 text-zinc-400 bg-zinc-500/10"}>
                          {inv.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── WORKFLOWS TAB ─── */}
        <TabsContent value="workflows" className="space-y-4">
          <Card className="border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" /> Automation Workflows
              </CardTitle>
              <CardDescription className="text-zinc-400">Configure automated workflows for recurring business tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              {workflows.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-sm">
                  <Workflow className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
                  No workflows configured yet. Workflows will appear here as you use the platform.
                </div>
              ) : (
                <div className="space-y-3">
                  {workflows.map((wf) => (
                    <div key={wf.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${wf.isActive ? "bg-emerald-400 shadow-lg shadow-emerald-400/50" : "bg-zinc-600"}`} />
                        <div>
                          <h4 className="font-semibold text-white">{wf.name}</h4>
                          <p className="text-xs text-zinc-500">{wf.trigger} → {wf.action}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleWorkflow(wf.id, wf.isActive)}
                        className={wf.isActive ? "border-emerald-500/20 text-emerald-400" : "border-white/10 text-zinc-400"}
                      >
                        {wf.isActive ? "Active" : "Paused"}
                      </Button>
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
