import axios, { AxiosResponse, AxiosRequestConfig } from "axios";

const getBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
    return envUrl;
  }

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    // If we are on production frontend (onrender.com), point directly to the backend
    if (hostname.includes("onrender.com")) {
      return "https://ai-store-87n2.onrender.com/api";
    }

    // ── Dev Tunnels / Codespaces / Ngrok / Cloudflare Tunnel / Port Forwarding ──
    const tunnelPortMatch = hostname.match(/-(\d{4,5})(?=[.\-]|$)/);
    if (tunnelPortMatch) {
      const backendHost = hostname.replace(`-${tunnelPortMatch[1]}`, "-5000");
      return `${protocol}//${backendHost}/api`;
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
      const currentPath = window.location.pathname;
      const isAdminCheck = currentPath.startsWith("/admin") || error.config?.url?.includes("/admin");

      if (!isAdminCheck) {
        localStorage.removeItem("nexora_logged_in");
        localStorage.removeItem("nexora_auth_token");

        const isAuthPage = currentPath === "/login" || currentPath === "/register" || currentPath === "/";
        const isAuthEndpoint = error.config?.url?.includes("/auth/");

        if (!isAuthPage && !isAuthEndpoint) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// In-memory cache for high-frequency GET routes to eliminate backend lag during agent switching
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 30_000; // 30s cache

const CACHEABLE_PREFIXES = [
  "/user/me",
  "/bots/instances/user",
  "/bots",
  "/analytics/dashboard",
];

const originalGet = api.get.bind(api);
api.get = function <T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  config?: AxiosRequestConfig<D> & { skipCache?: boolean }
): Promise<R> {
  const isCacheable =
    !config?.skipCache &&
    CACHEABLE_PREFIXES.some((prefix) => url === prefix || url.startsWith(prefix + "?"));

  if (isCacheable) {
    const cached = memoryCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: "OK",
        headers: {},
        config: config || {},
      } as unknown as R);
    }
  }

  return originalGet(url, config).then((response: any) => {
    if (isCacheable && response.status === 200) {
      memoryCache.set(url, { data: response.data, timestamp: Date.now() });
    }
    return response;
  });
} as any;

// Automatically clear cache on mutations to keep UI in sync
const originalPost = api.post.bind(api);
api.post = function (...args: any[]) {
  memoryCache.clear();
  return (originalPost as any)(...args);
} as any;

const originalPut = api.put.bind(api);
api.put = function (...args: any[]) {
  memoryCache.clear();
  return (originalPut as any)(...args);
} as any;

const originalDelete = api.delete.bind(api);
api.delete = function (...args: any[]) {
  memoryCache.clear();
  return (originalDelete as any)(...args);
} as any;

const originalPatch = api.patch.bind(api);
api.patch = function (...args: any[]) {
  memoryCache.clear();
  return (originalPatch as any)(...args);
} as any;

export default api;
