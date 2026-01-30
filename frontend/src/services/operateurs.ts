import api from './api'

export async function fetchOperateurs() {
  const response = await api.get('/operateurs/')
  return response.data
}

export async function fetchOperateursByType(type: 'orange' | 'airtel' | 'mpesa') {
  const response = await api.get(`/operateurs/?operateur=${type}`)
  return response.data
}
