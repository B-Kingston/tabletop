import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// Re-export ApiResponse from shared package
export type { ApiResponse } from '@tabletop/shared'

// ── Token bridge ──────────────────────────────────────────────────────────
// The Clerk token getter is set by the auth bridge component at runtime.
// This avoids importing @clerk/clerk-expo directly into the API module.

type TokenGetter = () => Promise<string | null>
type SignOutHandler = () => void

let tokenGetter: TokenGetter | null = null
let signOutHandler: SignOutHandler | null = null

export function setAuthTokenGetter(getter: TokenGetter) {
  tokenGetter = getter
}

export function setSignOutHandler(handler: SignOutHandler) {
  signOutHandler = handler
}

// ── Axios instance ────────────────────────────────────────────────────────

const BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor: attach Clerk JWT ─────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (tokenGetter) {
      const token = await tokenGetter()
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error: unknown) => Promise.reject(error),
)

// ── Response interceptor: retry once on 401, then sign out ────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status === 401) {
      // Retry once with a fresh token
      if (!originalRequest._retry && tokenGetter) {
        originalRequest._retry = true

        const freshToken = await tokenGetter()
        if (freshToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${freshToken}`
          return api(originalRequest)
        }
      }

      // Token retry exhausted or unavailable — force sign-out
      signOutHandler?.()
    }

    return Promise.reject(error)
  },
)

export default api
