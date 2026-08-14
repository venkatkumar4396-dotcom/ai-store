"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleBackground } from "@/components/shared/ParticleBackground";
import { DeployedBotsProvider } from "@/lib/DeployedBotsContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isBackendConnected, setIsBackendConnected] = React.useState<boolean>(true);
  const [isChecking, setIsChecking] = React.useState<boolean>(false);

  const checkConnection = React.useCallback(async () => {
    setIsChecking(true);
    try {
      let healthUrl = "";
      if (process.env.NEXT_PUBLIC_API_URL) {
        healthUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "/health");
      } else if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        const match = hostname.match(/-(\d+)(?=\.|$)/);
        if (match) {
          const currentPort = match[1];
          const backendHostname = hostname.replace(`-${currentPort}`, "-5000");
          healthUrl = `https://${backendHostname}/health`;
        } else if (hostname.includes("onrender.com")) {
          healthUrl = "https://ai-store-87n2.onrender.com/health";
        } else {
          healthUrl = `${window.location.protocol}//${window.location.hostname}:5000/health`;
        }
      } else {
        healthUrl = "https://ai-store-87n2.onrender.com/health";
      }
      const res = await fetch(healthUrl, { method: "GET" });
      if (res.ok) {
        setIsBackendConnected(true);
      } else {
        setIsBackendConnected(false);
      }
    } catch (err) {
      setIsBackendConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  React.useEffect(() => {
    // Synchronous auth check — redirect before any render
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("nexora_logged_in");
      if (loggedIn !== "true") {
        window.location.replace("/login");
        return;
      }
    }
    setIsMounted(true);
    checkConnection();

    // Periodic health check every 30 seconds
    const interval = setInterval(() => {
      checkConnection();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  if (!isMounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-xl scale-150 animate-pulse" />
          </div>
          <span className="text-sm font-semibold tracking-wider animate-pulse text-zinc-400">
            Initializing Nexora Workspace...
          </span>
        </div>
      </div>
    );
  }

  return (
    <DeployedBotsProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Sidebar - Collapsible desktop panel */}
        <Sidebar />

        {/* Main Container */}
        <div className="flex-1 flex flex-col h-screen min-w-0">
          {/* Top Header */}
          <Header />

          {/* Dynamic Route Content */}
          <main className="flex-1 overflow-y-auto p-4 pb-28 md:p-8 md:pb-8 mesh-bg relative">
            <ParticleBackground />
            <div className="max-w-7xl mx-auto space-y-6 relative z-10">
              {!isBackendConnected && (
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-rose-950/10 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                      <WifiOff className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-rose-200 text-sm">Backend API Server Unreachable</h4>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        The frontend cannot connect to the backend server at <code className="text-rose-300 bg-rose-950/40 px-1 py-0.5 rounded font-mono text-[11px]">{typeof window !== "undefined" ? (window.location.hostname.match(/-(\d+)(?=\.|$)/) ? window.location.hostname.replace(/-(\d+)(?=\.|$)/, "-5000") : `${window.location.hostname}:5000`) : "localhost:5000"}</code>. Please ensure it is running (<code className="text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded font-mono text-[11px]">npm run dev</code> in the backend folder).
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={checkConnection}
                    disabled={isChecking}
                    variant="outline"
                    size="sm"
                    className="border-rose-500/30 hover:bg-rose-500/10 text-rose-300 hover:text-rose-200 self-start md:self-center font-semibold text-xs gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
                    {isChecking ? "Retrying..." : "Retry Connection"}
                  </Button>
                </div>
              )}
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <BottomNav />
      </div>
    </DeployedBotsProvider>
  );
}
