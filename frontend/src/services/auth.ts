import api, { getCsrfToken, setAuthToken } from './api'

async function ensureCsrfCookie() {
  try {
    await api.get('/csrf/', { withCredentials: true })
  } catch (e) {
    // ignore if backend doesn't enforce CSRF
  }
}

function csrfHeader() {
  const token = getCsrfToken()
  return token ? { 'X-CSRFToken': token } : undefined
}

export const authService = {
  async login(payload: { identifier: string; password: string }) {
    await ensureCsrfCookie()
    const email = payload.identifier
    const res = await api.post('/auth/login', { email, password: payload.password }, { headers: csrfHeader() })
    const access_token = res.data.access_token || res.data.token || null
    const refresh_token = res.data.refresh_token || res.data.refresh || null
    const user = res.data.user
    if (access_token) setAuthToken(access_token)
    try { if (refresh_token) localStorage.setItem('refresh_token', refresh_token) } catch (e) {}
    return { user, access_token }
  },
  async loginWithGoogle(googleToken: string) {
    // Google login not supported on this backend
     await ensureCsrfCookie()
     const res = await api.post('/auth/google', { token: googleToken }, { headers: csrfHeader() })
     const access_token = res.data.access_token || res.data.token || null
     const refresh_token = res.data.refresh_token || res.data.refresh || null
     const user = res.data.user
     if (access_token) setAuthToken(access_token)
     try { if (refresh_token) localStorage.setItem('refresh_token', refresh_token) } catch (e) {}
     return { user, access_token }
  },
  async register(payload: { name: string; email?: string; phone?: string; password: string; [key: string]: any }) {
    await ensureCsrfCookie()
    const fullName = (payload.name || '').trim()
    const [firstName, ...rest] = fullName.split(' ')
    const lastName = rest.join(' ')
    const email = payload.email || ''
    const username = (payload.username || email.split('@')[0] || fullName.replace(/\s+/g, '').toLowerCase())
    const referralCode = payload.referralCode || payload.ref || ''

    const res = await api.post('/auth/register', {
      name: payload.name,
      email,
      username,
      password: payload.password,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: payload.phone,
      countryCode: payload.countryCode,
      referralCode,
      ref: referralCode
    }, { headers: csrfHeader() })
    const access_token = res.data.access_token || res.data.token || null
    const refresh_token = res.data.refresh_token || res.data.refresh || null
    const user = res.data.user
    const referral_bonus = res.data.referral_bonus || 0
    if (access_token) setAuthToken(access_token)
    try { if (refresh_token) localStorage.setItem('refresh_token', refresh_token) } catch (e) {}
    return { user, access_token, referral_bonus }
  },
  async refresh() {
    // This helper can be used by other parts if needed. api interceptor already attempts refresh.
    try {
      // prefer body-sent refresh token from localStorage (dev convenience)
      const body: Record<string, any> = {}
      try { const rt = localStorage.getItem('refresh_token'); if (rt) body.refresh_token = rt } catch (e) {}
      const res = await api.post('/auth/refresh', body)
      const access_token = res.data.access_token || res.data.token || null
      if (access_token) setAuthToken(access_token)
      return access_token
    } catch (err) {
      setAuthToken(null)
      throw err
    }
  },
  async logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setAuthToken(null)
    }
  }
}

export default authService
