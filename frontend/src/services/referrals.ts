import api from './api'

export async function fetchMyReferrals() {
  const res = await api.get('/referrals/me')
  return res.data
}

export async function getReferralStats() {
  try {
    const res = await api.get('/referrals/me')
    const { code, referrals = [], stats = {} } = res.data
    
    return {
      code: code?.code,
      codeData: code,
      referrals,
      stats: {
        total_referred: stats?.total_referred || 0,
        used: stats?.used || 0,
        pending: stats?.pending || 0,
        vip_breakdown: stats?.vip_breakdown || {}
      }
    }
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return {
      code: null,
      codeData: null,
      referrals: [],
      stats: {
        total_referred: 0,
        used: 0,
        pending: 0,
        vip_breakdown: {}
      }
    }
  }
}

export default { fetchMyReferrals, getReferralStats }
