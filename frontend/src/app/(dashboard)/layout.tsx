"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleBackground } from "@/components/shared/ParticleBackground";
import { DeployedBotsProvider } from "@/lib/DeployedBotsContext";
import { getBaseURL } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isBackendConnected, setIsBackendConnected] = React.useState<boolean>(true);
  const [isChecking, setIsChecking] = React.useState<boolean>(false);

  const [backendTargetUrl, setBackendTargetUrl] = React.useState<string>("https://ai-store-87n2.onrender.com");

  const checkConnection = React.useCallback(async () => {
    setIsChecking(true);
    try {
      const apiBase = getBaseURL();
      const healthUrl = apiBase.replace(/\/api\/?$/, "/health");
      const targetDisplay = apiBase.replace(/\/api\/?$/, "");

      setBackendTargetUrl(targetDisplay);

      const res = await fetch(healthUrl, { method: "GET" });
      if (res.ok) {
        setIsBackendConnected(true);
      } else {
        setIsBackendConnected(false);
      }
    } catch {
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
          <main className="flex-1 overflow-y-auto p-4 pb-32 md:p-8 md:pb-12 mesh-bg relative">
            <ParticleBackground />
            <div className="max-w-7xl mx-auto space-y-6 pb-8 relative z-10">
              {!isBackendConnected && (
                <div className="p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/90 dark:bg-amber-950/20 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3.5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
                      <WifiOff className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-xs sm:text-sm">Connecting to Cloud Intelligence Engine</h4>
                      <p className="text-amber-700 dark:text-zinc-400 text-[11px] sm:text-xs mt-0.5">
                        Waking up backend service at <code className="text-amber-900 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/40 px-1 py-0.5 rounded font-mono text-[10px]">{backendTargetUrl}</code>. Client offline fallback session is active.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={checkConnection}
                    disabled={isChecking}
                    variant="outline"
                    size="sm"
                    className="border-amber-300 hover:bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:hover:bg-amber-500/10 dark:text-amber-300 self-start md:self-center font-semibold text-xs gap-1.5 h-8 rounded-xl cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
                    {isChecking ? "Connecting..." : "Reconnect"}
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
