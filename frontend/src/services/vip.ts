import api from './api'

export async function fetchVIPLevels() {
  const res = await api.get('/vip-levels')
  return res.data
}

export async function fetchUserVIPSubscriptions() {
  const res = await api.get('/vip-subscriptions/me')
  return res.data
}

export async function purchaseVIPLevel(levelId: number) {
  const res = await api.post('/vip-subscriptions/purchase', { level_id: levelId })
  return res.data
}

export async function getQuantificationGains() {
  const res = await api.get('/quantification/gains')
  return res.data
}

export async function claimGains() {
  const res = await api.post('/quantification/claim')
  return res.data
}
