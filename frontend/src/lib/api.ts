import axios from "axios";

const getBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
    return envUrl;
  }

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    // ── VS Code Dev Tunnels ─────────────────────────────────────────
    if (hostname.endsWith(".devtunnels.ms")) {
      const backendHost = hostname.replace(/-(\d+)(\.devtunnels\.ms)$/, "-5000$2");
      return `https://${backendHost}/api`;
    }

    // ── GitHub Codespaces ───────────────────────────────────────────
    if (hostname.endsWith(".app.github.dev")) {
      const backendHost = hostname.replace(/-(\d+)(\.app\.github\.dev)$/, "-5000$2");
      return `https://${backendHost}/api`;
    }

    // ── Ngrok / Localtunnel / Cloudflare Tunnels ───────────────────
    if (
      hostname.endsWith(".ngrok-free.app") ||
      hostname.endsWith(".ngrok.io") ||
      hostname.endsWith(".loca.lt") ||
      hostname.endsWith(".trycloudflare.com")
    ) {
      const match = hostname.match(/-(\d{4,5})(?=\.)/);
      if (match) {
        const backendHost = hostname.replace(`-${match[1]}`, "-5000");
        return `https://${backendHost}/api`;
      }
    }

    // ── Plain local / IP fallback ────────────────────────────────────
    return `${protocol}//${hostname}:5000/api`;
  }
  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send httpOnly cookies with every request
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.baseURL = getBaseURL();
    const token = localStorage.getItem("nexora_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    const config = error.config;
    if (
      config &&
      !config._retry &&
      error.response &&
      error.response.status >= 500 &&
      error.response.status < 600
    ) {
      config._retry = true;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return api(config);
    }

    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("nexora_logged_in");
      localStorage.removeItem("nexora_auth_token");

      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === "/login" || currentPath === "/register" || currentPath === "/";
      const isAuthEndpoint = error.config?.url?.includes("/auth/");

      if (!isAuthPage && !isAuthEndpoint) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
