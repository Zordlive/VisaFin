# Script de diagnostic - À exécuter dans la console du navigateur (F12)

# 1. Vérifier l'URL de l'API détectée
console.log('🔗 Détection API URL')
console.log('Hostname:', window.location.hostname)
console.log('Protocol:', window.location.protocol)

# 2. Tester la connexion au backend
console.log('\n📡 Test connexion backend...')
fetch('https://api.visafin-gest.org/api/me', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ Backend répond:', response.status)
  console.log('Headers CORS:', {
    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
  })
  return response.json()
})
.then(data => console.log('Data:', data))
.catch(error => console.error('❌ Erreur:', error))

# 3. Vérifier localStorage
console.log('\n💾 LocalStorage')
console.log('Token:', localStorage.getItem('access_token'))

# 4. Test ping backend simple
console.log('\n🏓 Ping backend admin...')
fetch('https://api.visafin-gest.org/admin', { method: 'GET' })
  .then(r => console.log('Admin page status:', r.status))
  .catch(e => console.error('Admin ping error:', e))
