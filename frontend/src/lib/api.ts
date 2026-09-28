import axios from "axios";

const getBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
    return envUrl;
  }

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    // ── Dev Tunnels / Codespaces / Ngrok / Cloudflare Tunnel / Port Forwarding ──
    const tunnelPortMatch = hostname.match(/-(\d{4,5})(?=[.\-]|$)/);
    if (tunnelPortMatch) {
      const backendHost = hostname.replace(`-${tunnelPortMatch[1]}`, "-5000");
      return `${protocol}//${backendHost}/api`;
    }
    
    // If we are on production frontend (onrender.com), point directly to the backend
    if (hostname.includes("onrender.com")) {
      return "https://ai-store-87n2.onrender.com/api";
    }

    // ── Plain local / IP fallback ────────────────────────────────────
    return `${protocol}//${hostname}:5000/api`;
  }
  return "https://ai-store-87n2.onrender.com/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 120000, // 2 minutes to handle Render cold-start wakeups
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
