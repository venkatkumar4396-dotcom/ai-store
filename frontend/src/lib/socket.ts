"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketURL = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    // ── VS Code Dev Tunnels ─────────────────────────────────────────
    if (hostname.endsWith(".devtunnels.ms")) {
      const backendHost = hostname.replace(/-(\d+)(\.devtunnels\.ms)$/, "-5000$2");
      return `https://${backendHost}`;
    }

    // ── GitHub Codespaces ───────────────────────────────────────────
    if (hostname.endsWith(".app.github.dev")) {
      const backendHost = hostname.replace(/-(\d+)(\.app\.github\.dev)$/, "-5000$2");
      return `https://${backendHost}`;
    }

    // ── Generic tunnel (ngrok, etc.) ────────────────────────────────
    const portInHostMatch = hostname.match(/-(\d{4,5})(?=[.\-]|$)/);
    if (portInHostMatch) {
      const backendHost = hostname.replace(`-${portInHostMatch[1]}`, "-5000");
      return `https://${backendHost}`;
    }

    if (hostname.includes("onrender.com")) {
      return "https://ai-store-87n2.onrender.com";
    }

    // ── Plain local fallback ────────────────────────────────────────
    return `${protocol}//${hostname}:5000`;
  }
  return "https://ai-store-87n2.onrender.com";
};

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getSocketURL(), {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }
  return socket;
}

export function connectSocket(token?: string): Socket {
  const s = getSocket();
  if (token) {
    s.auth = { token };
  }
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
