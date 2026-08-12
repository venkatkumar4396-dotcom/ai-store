"use client";

import * as React from "react";
import {
  MessageCircle,
  Megaphone,
  FileText,
  Users,
  BarChart3,
  Sparkles,
  UserCheck2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatList } from "@/components/whatsapp/ChatList";
import { ChatWindow } from "@/components/whatsapp/ChatWindow";
import { QRScanner } from "@/components/whatsapp/QRScanner";
import type { Contact, Message, WhatsAppTemplate } from "@/types";
import api from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useToast } from "@/components/ui/toaster";

export default function WhatsAppControlCenterPage() {
  const { addToast } = useToast();
  const [sessionStatus, setSessionStatus] = React.useState<"connected" | "disconnected" | "connecting" | "qr_pending">("disconnected");
  const [qrCode, setQrCode] = React.useState<string>("");
  const [selectedContact, setSelectedContact] = React.useState<Contact | undefined>(undefined);
  const [isAiEnabled, setIsAiEnabled] = React.useState(true);
  const [session, setSession] = React.useState<any>(null);

  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [messages, setMessages] = React.useState<Record<string, Message[]>>({});
  const [templates, setTemplates] = React.useState<WhatsAppTemplate[]>([]);

  // Track seen message IDs to prevent duplicates from multiple socket events
  const seenMessageIds = React.useRef<Set<string>>(new Set());

  const fetchSession = async () => {
    try {
      const { data } = await api.get("/whatsapp/session");
      setSession(data.session);
      setSessionStatus(data.status);
      setIsAiEnabled(data.session?.isAiEnabled ?? true);
      if (data.qrCode) {
        setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrCode)}`);
      } else {
        setQrCode("");
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/whatsapp/chats");
      const mappedContacts: Contact[] = data.map((item: any) => ({
        id: item.phone,
        name: item.contactName || item.phone,
        phoneNumber: item.phone,
        tags: item.tags || [],
        unreadCount: item.unreadCount || 0,
        lastMessage: item.lastMessage?.body || "",
        lastMessageTime: item.lastMessage?.timestamp || new Date().toISOString(),
      }));
      setContacts(mappedContacts);
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    }
  };

  const fetchMessagesForContact = async (phone: string) => {
    try {
      const { data } = await api.get(`/whatsapp/chats/${phone}/messages`);
      const mappedMessages: Message[] = data.map((msg: any) => {
        if (msg.id) {
          seenMessageIds.current.add(msg.id);
        }
        return {
          id: msg.id,
          sessionId: msg.sessionId,
          contactId: phone,
          content: msg.body,
          type: msg.messageType || "text",
          direction: msg.direction === "inbound" ? "incoming" : "outgoing",
          status: msg.direction === "inbound" ? "read" : "sent",
          timestamp: msg.timestamp,
        };
      });
      setMessages((prev) => ({
        ...prev,
        [phone]: mappedMessages,
      }));
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get("/whatsapp/templates");
      const mappedTemplates: WhatsAppTemplate[] = data.map((t: any) => ({
        id: t.id,
        name: t.name,
        content: t.body,
        category: t.category,
        status: "approved",
        language: "English",
        variables: t.variables ? JSON.parse(t.variables) : [],
      }));
      setTemplates(mappedTemplates);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  };

  React.useEffect(() => {
    fetchSession();
    fetchChats();
    fetchTemplates();

    // Socket authenticates via httpOnly cookies (withCredentials: true)
    const socket = connectSocket();

    socket.on("whatsapp:qr", ({ qr }: { qr: string }) => {
      setSessionStatus("qr_pending");
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`);
    });

    socket.on("whatsapp:ready", () => {
      setSessionStatus("connected");
      setQrCode("");
      fetchChats();
      fetchSession();
    });

    socket.on("whatsapp:disconnected", () => {
      setSessionStatus("disconnected");
      setQrCode("");
    });

    socket.on("whatsapp:auth_failure", () => {
      setSessionStatus("disconnected");
      setQrCode("");
    });

    socket.on("whatsapp:message", ({ message }: { message: any }) => {
      // Deduplicate: skip if we've already seen this message ID
      if (seenMessageIds.current.has(message.id)) return;
      seenMessageIds.current.add(message.id);

      fetchChats();
      const partner = message.direction === "inbound" ? message.from : message.to;
      const phone = partner.replace("@c.us", "").replace("@g.us", "");

      const mapped: Message = {
        id: message.id,
        sessionId: message.sessionId,
        contactId: phone,
        content: message.body,
        type: message.messageType || "text",
        direction: message.direction === "inbound" ? "incoming" : "outgoing",
        status: "read",
        timestamp: message.timestamp,
      };

      setMessages((prev) => ({
        ...prev,
        [phone]: [...(prev[phone] || []), mapped],
      }));
    });

    socket.on("whatsapp:message_sent", ({ message }: { message: any }) => {
      // Deduplicate: skip if we've already seen this message ID
      if (seenMessageIds.current.has(message.id)) return;
      seenMessageIds.current.add(message.id);

      fetchChats();
      const partner = message.direction === "inbound" ? message.from : message.to;
      const phone = partner.replace("@c.us", "").replace("@g.us", "");

      const mapped: Message = {
        id: message.id,
        sessionId: message.sessionId,
        contactId: phone,
        content: message.body,
        type: message.messageType || "text",
        direction: message.direction === "inbound" ? "incoming" : "outgoing",
        status: "sent",
        timestamp: message.timestamp,
      };

      setMessages((prev) => ({
        ...prev,
        [phone]: [...(prev[phone] || []), mapped],
      }));
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    fetchMessagesForContact(contact.phoneNumber);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedContact) return;
    try {
      await api.post("/whatsapp/messages/send", {
        to: selectedContact.phoneNumber,
        body: content,
      });
      addToast({ type: "success", title: "Message Sent", description: `Outbound text sent to ${selectedContact.name}.` });
    } catch (err: any) {
      console.error("Failed to send message:", err);
      addToast({ type: "error", title: "Send Failed", description: err.response?.data?.error || err.message });
    }
  };

  const handleToggleAi = async (enabled: boolean) => {
    try {
      await api.post("/whatsapp/session/toggle-ai", { isAiEnabled: enabled });
      setIsAiEnabled(enabled);
      addToast({ type: "success", title: "AI Assistant", description: enabled ? "AI auto-reply enabled." : "AI auto-reply disabled." });
    } catch (err: any) {
      console.error("Failed to toggle AI auto-reply:", err);
      addToast({ type: "error", title: "Action Failed", description: err.response?.data?.error || err.message });
    }
  };

  const handleStartBot = async () => {
    setSessionStatus("connecting");
    setQrCode("");
    try {
      await api.post("/whatsapp/session/initialize");
      addToast({ type: "success", title: "WhatsApp Session", description: "Bot initialization started." });
    } catch (err: any) {
      console.error("Failed to initialize session:", err);
      setSessionStatus("disconnected");
      addToast({ type: "error", title: "Start Failed", description: err.response?.data?.error || err.message });
    }
  };

  const handleStopBot = async () => {
    try {
      await api.post("/whatsapp/session/disconnect");
      setSessionStatus("disconnected");
      setQrCode("");
      addToast({ type: "success", title: "WhatsApp Session", description: "Bot stopped. Auto-reply and syncing paused." });
    } catch (err: any) {
      console.error("Failed to stop session:", err);
      addToast({ type: "error", title: "Stop Failed", description: err.response?.data?.error || err.message });
    }
  };

  const handleLogoutBot = async () => {
    try {
      await api.post("/whatsapp/session/logout");
      setSessionStatus("disconnected");
      setQrCode("");
      addToast({ type: "success", title: "WhatsApp Session", description: "Logged out and device unlinked successfully." });
    } catch (err: any) {
      console.error("Failed to logout session:", err);
      addToast({ type: "error", title: "Logout Failed", description: err.response?.data?.error || err.message });
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            WhatsApp Control Center <MessageCircle className="h-6 w-6 text-indigo-400" />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Link WhatsApp account, monitor automated chats, launch broadcasts, and examine messaging analytics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.location.href = "/whatsapp/setup"} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            Configure AI Setup Wizard <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* QR Link Block */}
      <QRScanner
        status={sessionStatus}
        phoneNumber={session?.businessName || undefined}
        onRefresh={handleStartBot}
        onStart={handleStartBot}
        onStop={handleStopBot}
        onLogout={handleLogoutBot}
        qrCode={qrCode}
      />

      {/* Control Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="bg-zinc-950/40 border border-white/10 w-full md:w-auto flex justify-start overflow-x-auto">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Live Chat
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Message Templates
          </TabsTrigger>
          <TabsTrigger value="broadcasts" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Broadcasts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics Reports
          </TabsTrigger>
        </TabsList>

        {/* 1. LIVE CHAT TAB */}
        <TabsContent value="chat" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[550px] items-stretch">
            <div className="md:col-span-1">
              <ChatList
                contacts={contacts}
                selectedContactId={selectedContact?.id}
                onSelectContact={handleSelectContact}
              />
            </div>
            <div className="md:col-span-2">
              <ChatWindow
                contact={selectedContact}
                messages={selectedContact ? (messages[selectedContact.id] || []) : []}
                onSendMessage={handleSendMessage}
                isAiEnabled={isAiEnabled}
                onToggleAi={handleToggleAi}
              />
            </div>
          </div>
        </TabsContent>

        {/* 2. MESSAGE TEMPLATES TAB */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          <Card className="border border-white/10 bg-zinc-950/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-white">Registered Templates</CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-1">
                  Message templates approved by WhatsApp for customer outreach.
                </CardDescription>
              </div>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                <Plus className="h-4 w-4 mr-1" /> Create Template
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-500 text-xs uppercase">
                      <th className="py-2.5">Template Name</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5">Language</th>
                      <th className="py-2.5">Preview Content</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {templates.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5">
                        <td className="py-3 font-semibold text-white font-mono text-xs">{t.name}</td>
                        <td className="py-3">{t.category}</td>
                        <td className="py-3">
                          {t.status === "approved" ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5">
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5">
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="py-3">{t.language}</td>
                        <td className="py-3 text-xs text-zinc-400 font-mono truncate max-w-[200px]" title={t.content}>
                          {t.content}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. BROADCASTS TAB */}
        <TabsContent value="broadcasts" className="mt-4">
          <Card className="border border-white/10 bg-zinc-950/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-white">Broadcast Campaigns</CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-1">
                  Launch message streams to tag cohorts in mass.
                </CardDescription>
              </div>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                <Megaphone className="h-4 w-4 mr-1.5" /> Launch Broadcast
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-lg">
                <Users className="h-5 w-5 text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-white text-sm block">Summer Announcement VIPs</span>
                  <p className="text-xs text-zinc-400 mt-0.5">Dispatched welcome templates to 1,245 VIP recipients.</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sent 100%</Badge>
                  <span className="text-[10px] text-zinc-500 block mt-1">2 days ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. ANALYTICS TAB */}
        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-white/10 bg-zinc-950/40">
              <CardHeader className="p-4">
                <CardTitle className="text-xs uppercase text-zinc-500 font-semibold tracking-wider">Messages Delivered</CardTitle>
                <h3 className="text-3xl font-extrabold text-white mt-2">98.4%</h3>
                <span className="text-[11px] text-emerald-400 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> +1.2% this week
                </span>
              </CardHeader>
            </Card>
            <Card className="border border-white/10 bg-zinc-950/40">
              <CardHeader className="p-4">
                <CardTitle className="text-xs uppercase text-zinc-500 font-semibold tracking-wider">Read-through Rate</CardTitle>
                <h3 className="text-3xl font-extrabold text-white mt-2">84.2%</h3>
                <span className="text-[11px] text-emerald-400 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> +2.4% this week
                </span>
              </CardHeader>
            </Card>
            <Card className="border border-white/10 bg-zinc-950/40">
              <CardHeader className="p-4">
                <CardTitle className="text-xs uppercase text-zinc-500 font-semibold tracking-wider">AI Handling Rate</CardTitle>
                <h3 className="text-3xl font-extrabold text-white mt-2">91.6%</h3>
                <span className="text-[11px] text-emerald-400 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> +4.8% this week
                </span>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
