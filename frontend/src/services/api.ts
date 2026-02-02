import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

// Use environment variable, or detect from window.location for production
let BASE = import.meta.env.VITE_API_BASE_URL as string

// Fallback: if in production and no env var, use api subdomain
if (!BASE && typeof window !== 'undefined') {
  const hostname = window.location.hostname
  if (hostname === 'visafin-gest.org' || hostname === 'www.visafin-gest.org') {
    BASE = 'http://api.visafin-gest.org/api'
  }
}

console.log('🔗 API Base URL:', BASE)

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
  try {
    if (token) localStorage.setItem('access_token', token)
    else localStorage.removeItem('access_token')
  } catch (e) {}
}

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})

// Initialize authToken from localStorage so page reloads keep the session (dev convenience)
try {
  const stored = localStorage.getItem('access_token')
  if (stored) authToken = stored
} catch (e) {}

// Attach Authorization header from module-scoped token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.Authorization = authToken ? `Bearer ${authToken}` : ''
  return config
})

// Response interceptor: on 401 try refresh once and retry request
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (err: any) => void
  config: AxiosRequestConfig
}> = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else {
      if (token && p.config.headers) p.config.headers.Authorization = `Bearer ${token}`
      p.resolve(api(p.config))
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalConfig = err.config as AxiosRequestConfig & { _retry?: boolean }
    if (err.response && err.response.status === 401 && !originalConfig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalConfig })
        })
      }

      originalConfig._retry = true
      isRefreshing = true

      try {
        // call refresh endpoint with a plain axios instance to avoid interceptors
        const resp = await axios.post(
          `${BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = (resp.data && (resp.data.access_token || resp.data.token)) || null
        setAuthToken(newToken)
        processQueue(null, newToken)
        return api(originalConfig)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default api

export interface CryptoAddress {
  id: number
  network: string
  network_display: string
  address: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getCryptoAddresses(): Promise<CryptoAddress[]> {
  const resp = await api.get<{ results: CryptoAddress[] } | CryptoAddress[]>('/crypto-addresses/')
  // Handle both paginated response and direct array response
  if (Array.isArray(resp.data)) {
    return resp.data
  }
  return resp.data.results || []
}

export interface SocialLinks {
  id?: number
  whatsapp_channel: string | null
  whatsapp_group: string | null
  telegram_channel: string | null
  telegram_group: string | null
  created_at?: string
  updated_at?: string
}

export async function getSocialLinks(): Promise<SocialLinks> {
  const resp = await api.get<SocialLinks>('/social-links/')
  return resp.data || {
    whatsapp_channel: null,
    whatsapp_group: null,
    telegram_channel: null,
    telegram_group: null
  }
}