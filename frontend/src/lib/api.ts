import axios from 'axios'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const CLERK_JWT_TEMPLATE = import.meta.env.VITE_CLERK_JWT_TEMPLATE

export const api = axios.create({
  baseURL: `${API_BASE_URL}/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

type AuthTokenGetter = (options?: { template?: string }) => Promise<string | null>

let authTokenGetter: AuthTokenGetter | null = null

export function setAuthTokenGetter(getter: AuthTokenGetter) {
  authTokenGetter = getter
}

export async function getConfiguredAuthToken() {
  if (!authTokenGetter) {
    return null
  }
  return authTokenGetter(CLERK_JWT_TEMPLATE ? { template: CLERK_JWT_TEMPLATE } : undefined)
}

api.interceptors.request.use(async (config) => {
  const token = await getConfiguredAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Retry once on 401 with a fresh token (stale-token-on-first-load fix)
    // Only retry if the new token is actually different — same token means
    // the 401 is from a missing DB user, not an expired JWT.
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      authTokenGetter
    ) {
      originalRequest._retry = true
      try {
        const freshToken = await getConfiguredAuthToken()
        const oldToken = originalRequest.headers.Authorization?.toString().replace('Bearer ', '') ?? ''
        if (freshToken && freshToken !== oldToken) {
          originalRequest.headers.Authorization = `Bearer ${freshToken}`
          return api.request(originalRequest)
        }
      } catch {
        // fall through to dispatch unauth event
      }
    }

    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export type ApiResponse<T> = {
  data: T
  error: string | null
}
