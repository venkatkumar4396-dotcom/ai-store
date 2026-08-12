"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Smartphone, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QRScannerProps {
  status: "connected" | "disconnected" | "connecting" | "qr_pending";
  qrCode?: string;
  onRefresh?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  onLogout?: () => void;
  phoneNumber?: string;
}

export function QRScanner({
  status,
  qrCode,
  onRefresh,
  onStart,
  onStop,
  onLogout,
  phoneNumber,
}: QRScannerProps) {
  return (
    <Card className="border border-white/10 bg-zinc-950/40 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              WhatsApp Integration
            </CardTitle>
            <CardDescription className="text-zinc-400 text-sm mt-1">
              Link your WhatsApp Business account via QR code to power your AI Agent.
            </CardDescription>
          </div>
          {status === "connected" && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1">
              Connected
            </Badge>
          )}
          {status === "qr_pending" && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1">
              Ready to Scan
            </Badge>
          )}
          {status === "connecting" && (
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1">
              Connecting
            </Badge>
          )}
          {status === "disconnected" && (
            <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1">
              Stopped
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center py-8">
        {status === "disconnected" ? (
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-full bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-400 mx-auto">
              <Smartphone className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">WhatsApp Bot is Offline</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                The auto-reply engine, live message synchronization, and analytics are currently stopped. Click "Start Bot" to launch the client.
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={onStart}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Start WhatsApp Bot</span>
              </Button>
            </div>
          </div>
        ) : status === "connected" ? (
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto animate-pulse">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">Successfully Linked!</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Your phone number <strong className="text-white">{phoneNumber || "connected device"}</strong> is connected. The AI Agent is actively listening and managing conversations.
              </p>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-lg flex items-center gap-3 justify-center text-xs text-zinc-400 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>End-to-end encrypted AI conversation management.</span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={onStop}
                variant="outline"
                className="flex-1 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs font-semibold"
              >
                Stop Bot
              </Button>
              <Button
                onClick={onLogout}
                variant="destructive"
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Log Out / Unlink
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full max-w-2xl">
            {/* Instructions */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">How to connect:</h3>
              <ol className="list-decimal pl-4 text-zinc-400 text-sm space-y-3 leading-relaxed">
                <li>Open <strong className="text-white">WhatsApp</strong> on your phone.</li>
                <li>Tap <strong className="text-white">Menu</strong> (three dots) or <strong className="text-white">Settings</strong>.</li>
                <li>Select <strong className="text-white">Linked Devices</strong> and tap <strong className="text-white">Link a Device</strong>.</li>
                <li>Point your phone camera at this screen to capture the QR code.</li>
              </ol>
              <div className="space-y-3 pt-2">
                {status === "qr_pending" && onRefresh && (
                  <Button
                    onClick={onRefresh}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white text-xs font-semibold"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh QR Code</span>
                  </Button>
                )}
                
                <div className="flex gap-3">
                  <Button
                    onClick={onStop}
                    variant="outline"
                    className="flex-1 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs font-semibold"
                  >
                    Stop Bot
                  </Button>
                  <Button
                    onClick={onLogout}
                    variant="destructive"
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                  >
                    Log Out / Cancel
                  </Button>
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-52 h-52 bg-white rounded-xl p-3 shadow-2xl flex items-center justify-center border-4 border-indigo-600/20">
                {status === "connecting" && (
                  <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-2 text-white z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    <span className="text-xs font-medium text-zinc-300">Initializing...</span>
                  </div>
                )}

                {/* QR Code Graphic Mock */}
                {qrCode ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrCode}
                    alt="WhatsApp QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-100 rounded flex flex-col items-center justify-center text-zinc-400 text-center gap-1.5 p-4 border border-zinc-200">
                    <Smartphone className="h-8 w-8 text-indigo-600 animate-bounce" />
                    <span className="text-xs font-semibold text-zinc-700">Scan Pending</span>
                  </div>
                )}

                {/* Glowing border corners for camera scan frame feel */}
                <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-indigo-600 pointer-events-none rounded-tl-sm" />
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-indigo-600 pointer-events-none rounded-tr-sm" />
                <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-indigo-600 pointer-events-none rounded-bl-sm" />
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-indigo-600 pointer-events-none rounded-br-sm" />
              </div>
              <span className="text-xs text-zinc-500 mt-3 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Code expires in 60 seconds
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
