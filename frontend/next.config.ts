import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow VS Code Dev Tunnels, GitHub Codespaces, and ngrok URLs during development.
  // Without this Next.js throws "Invalid Host header" for all tunnel traffic.
  allowedDevOrigins: [
    "*.devtunnels.ms",      // VS Code Dev Tunnels
    "*.app.github.dev",     // GitHub Codespaces
    "*.ngrok.io",           // ngrok (legacy)
    "*.ngrok-free.app",     // ngrok (free tier)
    "*.loca.lt",            // localtunnel
    "*.trycloudflare.com",  // Cloudflare Quick Tunnels
  ],
  async rewrites() {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
