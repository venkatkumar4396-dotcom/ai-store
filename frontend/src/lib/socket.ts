"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketURL = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    // ── Dev Tunnels / Codespaces / Ngrok / Cloudflare Tunnel / Port Forwarding ──
    const tunnelPortMatch = hostname.match(/-(\d{4,5})(?=[.\-]|$)/);
    if (tunnelPortMatch) {
      const backendHost = hostname.replace(`-${tunnelPortMatch[1]}`, "-5000");
      return `${protocol}//${backendHost}`;
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
