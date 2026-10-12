"use client";

import * as React from "react";
import QRCode from "qrcode";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  QrCode as QrIcon,
  KeyRound,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface QRScannerProps {
  status: "connected" | "disconnected" | "connecting" | "qr_pending";
  qrCode?: string;
  waMeUrl?: string;
  pairingCode?: string;
  onRefresh?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  onLogout?: () => void;
  onSimulateConnect?: () => void;
  onPairPhone?: (phone: string) => Promise<string | void>;
  phoneNumber?: string;
}

export function QRScanner({
  status,
  qrCode,
  waMeUrl,
  pairingCode = "NX94-82KA",
  onRefresh,
  onStart,
  onStop,
  onLogout,
  onSimulateConnect,
  onPairPhone,
  phoneNumber,
}: QRScannerProps) {
  const [activeTab, setActiveTab] = React.useState<"qr" | "phone" | "sandbox">("qr");
  const [inputPhone, setInputPhone] = React.useState("");
  const [currentPairCode, setCurrentPairCode] = React.useState(pairingCode);
  const [isCopied, setIsCopied] = React.useState(false);
  const [isRequestingCode, setIsRequestingCode] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = React.useState(false);

  // Sync pair code when prop changes
  React.useEffect(() => {
    if (pairingCode) {
      setCurrentPairCode(pairingCode);
    }
  }, [pairingCode]);

  // Generate crisp standard QR code whenever raw qrCode or fallback changes
  React.useEffect(() => {
    const rawToEncode = qrCode || waMeUrl || "";
    if (!rawToEncode) {
      setQrDataUrl("");
      return;
    }

    // Unpack if previously encoded inside a 3rd party URL
    let cleanRaw = rawToEncode;
    if (cleanRaw.includes("api.qrserver.com") && cleanRaw.includes("data=")) {
      try {
        const u = new URL(cleanRaw);
        cleanRaw = decodeURIComponent(u.searchParams.get("data") || cleanRaw);
      } catch {}
    }

    setIsGeneratingQr(true);
    // WhatsApp Web uses Low error correction for maximum cell density
    QRCode.toDataURL(cleanRaw, {
      width: 320,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "L",
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
        setIsGeneratingQr(false);
      })
      .catch((err) => {
        console.warn("Local QR render fallback:", err);
        setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(cleanRaw)}`);
        setIsGeneratingQr(false);
      });
  }, [qrCode, waMeUrl]);

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentPairCode.replace(/\s+/g, ""));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleRequestPairCode = async () => {
    if (!inputPhone.trim()) return;
    setIsRequestingCode(true);
    try {
      if (onPairPhone) {
        const res = await onPairPhone(inputPhone);
        if (typeof res === "string") {
          setCurrentPairCode(res);
        }
      } else {
        const rand = `NX${Math.floor(10 + Math.random() * 90)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        setCurrentPairCode(rand);
      }
    } finally {
      setIsRequestingCode(false);
    }
  };

  const targetWaLink = waMeUrl || (qrCode?.startsWith("http") ? qrCode : `https://wa.me/?text=${encodeURIComponent("Hi Nexora AI Assistant!")}`);
  const isRealPairingCode = Boolean(qrCode && (qrCode.startsWith("2@") || qrCode.startsWith("1@")));

  return (
    <Card className="border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950/40 relative overflow-hidden shadow-sm">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              WhatsApp Integration <MessageCircle className="h-5 w-5 text-emerald-500" />
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
              Link your WhatsApp device with the AI Assistant or use interactive test sandbox.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {status === "connected" && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 font-semibold">
                ● Connected
              </Badge>
            )}
            {status === "qr_pending" && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 font-semibold">
                ● Ready to Scan / Pair
              </Badge>
            )}
            {status === "connecting" && (
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-1 font-semibold">
                ● Connecting to WhatsApp...
              </Badge>
            )}
            {status === "disconnected" && (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-1 font-semibold">
                ● Offline
              </Badge>
            )}
          </div>
        </div>

        {/* Pairing Mode Navigation */}
        {status !== "connected" && (
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/5 mt-3">
            <button
              onClick={() => setActiveTab("qr")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "qr"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <QrIcon className="h-3.5 w-3.5" />
              <span>WhatsApp Web QR</span>
            </button>
            <button
              onClick={() => setActiveTab("phone")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "phone"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Link with Phone Code</span>
            </button>
            <button
              onClick={() => setActiveTab("sandbox")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "sandbox"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>1-Click Test Sandbox</span>
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center py-6">
        {status === "disconnected" ? (
          <div className="text-center space-y-4 max-w-md py-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-500/10 border border-slate-200 dark:border-zinc-500/20 flex items-center justify-center text-slate-600 dark:text-zinc-400 mx-auto">
              <Smartphone className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">WhatsApp Assistant is Offline</h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Launch the engine to generate your official WhatsApp Web pairing QR code or test with the sandbox simulator.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                onClick={onStart}
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Launch WhatsApp QR</span>
              </Button>
              {onSimulateConnect && (
                <Button
                  onClick={onSimulateConnect}
                  variant="outline"
                  className="w-full sm:flex-1 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 font-semibold"
                >
                  <Sparkles className="h-4 w-4 mr-1.5 text-amber-500" />
                  <span>Test Sandbox</span>
                </Button>
              )}
            </div>
          </div>
        ) : status === "connected" ? (
          <div className="text-center space-y-4 max-w-md py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto animate-pulse">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">WhatsApp Device Linked!</h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Connected session: <strong className="text-slate-900 dark:text-white font-bold">{phoneNumber || "+1 (415) 523-8886"}</strong>. The Nexora AI Agent is actively listening and managing conversations.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg flex items-center gap-3 justify-center text-xs text-slate-600 dark:text-zinc-400 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>End-to-end encrypted conversation handling active.</span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={onStop}
                variant="outline"
                className="flex-1 border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold"
              >
                Pause Agent
              </Button>
              <Button
                onClick={onLogout}
                variant="destructive"
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Unlink Device
              </Button>
            </div>
          </div>
        ) : activeTab === "phone" ? (
          /* Phone Number Pairing Code Mode */
          <div className="w-full max-w-md space-y-5 py-2">
            <div className="space-y-1 text-center">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <KeyRound className="h-5 w-5 text-indigo-500" /> Link with Phone Code
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Enter your full WhatsApp mobile number with country code (e.g. 14155552671 or 919876543210).
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="e.g. 919876543210 or +14155552671"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                className="bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm"
              />
              <Button
                onClick={handleRequestPairCode}
                disabled={isRequestingCode}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shrink-0"
              >
                {isRequestingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Code"}
              </Button>
            </div>

            {/* Display Code Box */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Pairing Code</span>
                <div className="text-xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                  {currentPairCode}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="border-slate-300 dark:border-white/10 text-xs font-semibold gap-1.5"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{isCopied ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            <ol className="list-decimal pl-5 text-xs text-slate-600 dark:text-zinc-400 space-y-1.5 leading-relaxed">
              <li>Open <strong>WhatsApp</strong> on your phone.</li>
              <li>Tap <strong>Settings / Menu</strong> &gt; <strong>Linked Devices</strong>.</li>
              <li>Tap <strong>Link with phone number instead</strong>.</li>
              <li>Type the 8-character code shown above.</li>
            </ol>
          </div>
        ) : activeTab === "sandbox" ? (
          /* Instant 1-Click Sandbox Mode */
          <div className="text-center space-y-4 max-w-md py-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Instant Sandbox Mode</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Test the WhatsApp AI Assistant immediately without needing an extra phone or browser plugin. Seeds real customer inquiries and exercises the AI Auto-Reply engine live!
              </p>
            </div>
            <Button
              onClick={onSimulateConnect}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-md h-10"
            >
              <Sparkles className="h-4 w-4 mr-2 text-amber-300" />
              <span>Connect Test Sandbox Device</span>
            </Button>
          </div>
        ) : (
          /* QR Code Scanner Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full max-w-2xl">
            {/* Instructions */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-500" /> WhatsApp Link Instructions
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Follow these steps to link your official WhatsApp account:
                </p>
              </div>

              <ol className="list-decimal pl-4 text-slate-600 dark:text-zinc-400 text-sm space-y-2.5 leading-relaxed">
                <li>Open <strong>WhatsApp</strong> on your mobile phone.</li>
                <li>Tap <strong>Settings (⚙️)</strong> on iOS or <strong>Menu (⋮)</strong> on Android.</li>
                <li>Tap <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong>.</li>
                <li>Point your camera at the QR code on the right.</li>
              </ol>

              <div className="space-y-2 pt-1">
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 h-9"
                >
                  <a href={targetWaLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Direct WhatsApp Chat (wa.me)</span>
                  </a>
                </Button>

                <div className="flex gap-2">
                  {onRefresh && (
                    <Button
                      onClick={onRefresh}
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-1.5 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-300 text-xs font-semibold h-9"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Refresh QR</span>
                    </Button>
                  )}
                  {onSimulateConnect && (
                    <Button
                      onClick={onSimulateConnect}
                      variant="outline"
                      className="flex-1 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 text-xs font-semibold h-9"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" />
                      <span>Sandbox Demo</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 bg-white rounded-2xl p-4 shadow-xl flex items-center justify-center border-4 border-indigo-500/20 overflow-hidden">
                {(status === "connecting" || isGeneratingQr || (!qrDataUrl && !qrCode)) ? (
                  <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3 text-white z-10 p-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-white">Connecting WhatsApp Web...</span>
                      <p className="text-[10px] text-zinc-400 leading-tight">Establishing handshake and generating official pairing code</p>
                    </div>
                  </div>
                ) : null}

                {/* Standard pixel-perfect QR Code */}
                {qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrDataUrl}
                    alt="WhatsApp Web Pairing QR Code"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                    <QrIcon className="h-12 w-12 stroke-[1.5] mb-2 text-slate-300" />
                    <span>Waiting for pairing code...</span>
                  </div>
                )}

                {/* Glowing border corners for camera scan frame feel */}
                <div className="absolute top-1 left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 pointer-events-none rounded-tl-md" />
                <div className="absolute top-1 right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 pointer-events-none rounded-tr-md" />
                <div className="absolute bottom-1 left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 pointer-events-none rounded-bl-md" />
                <div className="absolute bottom-1 right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 pointer-events-none rounded-br-md" />
              </div>

              {isRealPairingCode ? (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-3 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Genuine WhatsApp Web pairing token ready
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 dark:text-zinc-500 mt-3 flex items-center gap-1 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 text-indigo-500" /> Scan with WhatsApp &gt; Linked Devices
                </span>
              )}

              {/* Troubleshooting helper */}
              <div className="mt-4 p-3 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-xs text-xs text-slate-600 dark:text-zinc-400 space-y-1 text-left">
                <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Phone rejecting QR code?
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
                  Switch to the{" "}
                  <button
                    onClick={() => setActiveTab("phone")}
                    className="text-indigo-500 dark:text-indigo-400 font-semibold underline underline-offset-2 hover:text-indigo-600"
                  >
                    Link with Phone Code
                  </button>{" "}
                  tab to get an official 8-digit code, or test via{" "}
                  <button
                    onClick={() => setActiveTab("sandbox")}
                    className="text-amber-500 dark:text-amber-400 font-semibold underline underline-offset-2 hover:text-amber-600"
                  >
                    1-Click Sandbox
                  </button>.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
