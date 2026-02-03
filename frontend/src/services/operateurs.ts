import api from './api'

export async function fetchOperateurs() {
  try {
    const response = await api.get('/operateurs')
    return response.data
  } catch (e) {
    return []
  }
}

export async function fetchOperateursByType(type: 'orange' | 'airtel' | 'mpesa') {
  try {
    const response = await api.get(`/operateurs`, { params: { operateur: type } })
    return response.data
  } catch (e) {
    return []
  }
}
