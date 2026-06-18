import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { router } from "expo-router";
import { API_BASE_URL } from "./config";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./tokenStore";

/**
 * HTTP client (README §1.3 / §2.5). Single axios instance with:
 *  - a request interceptor that attaches `Authorization: Bearer <access>`,
 *  - a response interceptor that, on 401, performs a single-flight refresh via
 *    `POST /auth/refresh`, retries the original request, and on refresh failure
 *    clears the tokens and routes back to /login.
 */
export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh: concurrent 401s share one refresh round-trip.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  try {
    // Bare axios (not `client`) so this request skips the interceptors.
    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    );
    await setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    await clearTokens();
    return null;
  }
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const isAuthRoute = original?.url?.includes("/auth/");
    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;

      if (!refreshing) {
        refreshing = refreshAccessToken().finally(() => {
          refreshing = null;
        });
      }
      const newToken = await refreshing;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original);
      }

      // Refresh failed — session is over.
      router.replace("/login");
    }

    return Promise.reject(error);
  },
);
