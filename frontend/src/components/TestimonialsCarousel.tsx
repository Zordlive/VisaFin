import React, { useState, useEffect } from 'react'

interface Testimonial {
  id: number
  type: 'testimony' | 'investment_proof' | 'withdrawal_proof'
  title: string
  author: string
  amount?: number
  currency?: string
  date: string
  description: string
  image?: string
  verified: boolean
  category?: string
}

const TestimonialsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [autoPlay, setAutoPlay] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Données mockées - À remplacer par des données réelles de l'API
  const testimonials: Testimonial[] = [
    {
      id: 1,
      type: 'testimony',
      title: 'Plateforme extraordinaire',
      author: 'Jean Dupont',
      date: '2024-01-28',
      description: '📱 Capture conversation: "Bonjour, mon investissement a été confirmé!" - Support: "Merci! Bienvenue parmi nos investisseurs" ✓',
      verified: true,
      category: '🇫🇷 France'
    },
    {
      id: 2,
      type: 'investment_proof',
      title: 'Preuve de paiement - Bitcoin',
      author: 'Amara Diallo',
      amount: 500,
      currency: 'USD',
      date: '2024-01-27',
      description: '✅ Capture: Hash TX 3a2c9f... | Montant: $500 | Status: CONFIRMÉ ✓ | Timestamp: 27/01/2024 14:32 | Blockchain vérifié',
      verified: true,
      category: '🇸🇳 Sénégal'
    },
    {
      id: 3,
      type: 'withdrawal_proof',
      title: 'Capture recharge compte',
      author: 'Emma Wilson',
      amount: 1200,
      currency: 'USD',
      date: '2024-01-26',
      description: '💳 Capture: Recharge confirmée | Bénéficiaire: E. Wilson | $1200 | Virement bancaire | ✓ Crédité en 23h42',
      verified: true,
      category: '🇬🇧 Royaume-Uni'
    },
    {
      id: 4,
      type: 'testimony',
      title: 'Très satisfait',
      author: 'Marco Rossetti',
      date: '2024-01-25',
      description: '💬 Screenshot: "Mes gains: $342 cette semaine!" - "Bravo! Continuez" | 📸 Portefeuille croissant régulièrement',
      verified: true,
      category: '🇮🇹 Italie'
    },
    {
      id: 5,
      type: 'investment_proof',
      title: 'Preuve Ethereum - Multi-crypto',
      author: 'Kofi Mensah',
      amount: 1000,
      currency: 'USD',
      date: '2024-01-24',
      description: '✅ Capture: Portfolio $1000 ETH + $500 LTC = $1500 | Rendement: +12.5% | 📊 Graphique gains en hausse',
      verified: true,
      category: '🇬🇭 Ghana'
    },
    {
      id: 6,
      type: 'withdrawal_proof',
      title: 'Capture transaction rapide',
      author: 'Jennifer Chen',
      amount: 850,
      currency: 'USD',
      date: '2024-01-23',
      description: '💰 Capture: Retrait approuvé | $850 | Compte ****5678 | Status: TRANSFÉRÉ ✓ | Temps: 45 minutes',
      verified: true,
      category: '🇺🇸 États-Unis'
    },
    {
      id: 7,
      type: 'testimony',
      title: 'Meilleur choix',
      author: 'Ana García',
      date: '2024-01-22',
      description: '📱 Capture support: "Faut-il des frais?" - "Zéro frais cette semaine!" | ✓ Support rapide et transparent',
      verified: true,
      category: '🇪🇸 Espagne'
    },
    {
      id: 8,
      type: 'investment_proof',
      title: 'Preuve Paiement - Composition',
      author: 'Zainab Okafor',
      amount: 2500,
      currency: 'USD',
      date: '2024-01-21',
      description: '✅ Capture: Investissement $2500 | Intérêts composés: ACTIVÉS ✓ | Rendement: +18% annuel | Fin: 21/01/2025',
      verified: true,
      category: '🇳🇬 Nigéria'
    },
    {
      id: 9,
      type: 'testimony',
      title: 'Incroyable expérience',
      author: 'Klaus Mueller',
      date: '2024-01-20',
      description: '💬 Screenshot support: "Accès VIP demandé" - "Activé! Priorité donnée" | 👑 Avantages VIP confirmés',
      verified: true,
      category: '🇩🇪 Allemagne'
    },
    {
      id: 10,
      type: 'withdrawal_proof',
      title: 'Capture Mobile Money',
      author: 'Stella Mukamusoni',
      amount: 650,
      currency: 'USD',
      date: '2024-01-19',
      description: '💳 Capture: Paiement réussi | $650 | Mobile Money +250... | ✓ Reçu et confirmé immédiatement',
      verified: true,
      category: '🇷🇼 Rwanda'
    },
    {
      id: 11,
      type: 'investment_proof',
      title: 'Preuve Multi-devises',
      author: 'James Wilson',
      amount: 1800,
      currency: 'USD',
      date: '2024-01-18',
      description: '✅ Capture: BTC $800 + ETH $600 + USDC $400 = $1800 | Portfolio protégé | Gains: +15%',
      verified: true,
      category: '🇨🇦 Canada'
    },
    {
      id: 12,
      type: 'testimony',
      title: 'Révolutionne ma vie',
      author: 'Layla Hassan',
      date: '2024-01-17',
      description: '📱 Capture: "Merci! Premiers $250 cette semaine!" - "Bravo! Continuez" | 🎉 Succès confirmé!',
      verified: true,
      category: '🇸🇴 Somalie'
    }
  ]

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return

    const timer = setInterval(() => {
      handleNext()
    }, 3000)

    return () => clearInterval(timer)
  }, [autoPlay, currentIndex])

  const handleNext = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setDirection('next')
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handlePrev = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setDirection('prev')
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handleDotClick = (index: number) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setDirection(index > currentIndex ? 'next' : 'prev')
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'testimony':
        return '💬'
      case 'investment_proof':
        return '📊'
      case 'withdrawal_proof':
        return '✅'
      default:
        return '⭐'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'testimony':
        return 'from-blue-500 to-blue-600'
      case 'investment_proof':
        return 'from-green-500 to-green-600'
      case 'withdrawal_proof':
        return 'from-purple-500 to-purple-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const current = testimonials[currentIndex]

  return (
    <div className="w-full">
      {/* Section Slider */}
      <div
        className="bg-white p-4 md:p-6 rounded-2xl shadow mb-6 relative overflow-hidden"
        onMouseEnter={() => setAutoPlay(false)}
        onMouseLeave={() => setAutoPlay(true)}
      >
        {/* Décoration de fond */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>

        {/* Header */}
        <div className="relative z-10 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getTypeIcon(current.type)}</span>
            <h2 className="font-bold text-lg md:text-2xl text-gray-800">
              {current.type === 'testimony' && 'Témoignages'}
              {current.type === 'investment_proof' && 'Preuves d\'investissement'}
              {current.type === 'withdrawal_proof' && 'Preuves de retraits'}
            </h2>
          </div>
          <p className="text-xs md:text-sm text-gray-500">Découvrez les succès de nos utilisateurs</p>
        </div>

        {/* Slide Container */}
        <div className="relative h-auto md:h-80 overflow-hidden rounded-xl">
          {/* Slide Items */}
          {testimonials.map((item, index) => {
            const isActive = index === currentIndex
            const isNext = (index - currentIndex + testimonials.length) % testimonials.length === 1
            const isPrev = (index - currentIndex + testimonials.length) % testimonials.length === testimonials.length - 1

            let opacity = 0
            let transform = ''

            if (isActive) {
              opacity = 1
              transform = 'translateX(0) scale(1)'
            } else if (isNext) {
              opacity = 0
              transform = direction === 'next' ? 'translateX(100%) scale(0.95)' : 'translateX(-100%) scale(0.95)'
            } else if (isPrev) {
              opacity = 0
              transform = direction === 'next' ? 'translateX(-100%) scale(0.95)' : 'translateX(100%) scale(0.95)'
            } else {
              opacity = 0
              transform = 'translateX(0) scale(0.9)'
            }

            return (
              <div
                key={item.id}
                className={`absolute inset-0 transition-all duration-500 ease-out`}
                style={{
                  opacity,
                  transform,
                  pointerEvents: isActive ? 'auto' : 'none'
                }}
              >
                <div className={`bg-gradient-to-br ${getTypeColor(item.type)} rounded-xl p-6 md:p-8 h-full text-white relative overflow-hidden`}>
                  {/* Décoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

                  {/* Contenu */}
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    {/* Top Section */}
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl md:text-2xl font-bold mb-1">{item.title}</h3>
                          <p className="text-white/80 text-sm md:text-base">Par {item.author}</p>
                        </div>
                        {item.verified && (
                          <div className="flex-shrink-0 bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <span>✓</span>
                            <span>Vérifié</span>
                          </div>
                        )}
                      </div>

                      {item.amount && (
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-lg mb-4 inline-block">
                          <p className="text-white/70 text-xs md:text-sm">Montant</p>
                          <p className="text-2xl md:text-3xl font-bold">
                            {item.amount.toLocaleString()} {item.currency}
                          </p>
                        </div>
                      )}

                      <p className="text-white/90 text-sm md:text-base leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex items-end justify-between pt-4 border-t border-white/20">
                      <div className="text-xs md:text-sm text-white/70">
                        {new Date(item.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                        {item.category}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 relative z-10">
          <button
            onClick={handlePrev}
            className="group p-2 md:p-3 bg-gray-100 hover:bg-violet-600 text-gray-700 hover:text-white rounded-full transition-all duration-300 flex-shrink-0"
            aria-label="Slide précédent"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Pagination Dots */}
          <div className="flex gap-2 flex-wrap justify-center">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'bg-violet-600 w-8 h-3'
                    : 'bg-gray-300 hover:bg-gray-400 w-3 h-3'
                }`}
                aria-label={`Aller au slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="group p-2 md:p-3 bg-gray-100 hover:bg-violet-600 text-gray-700 hover:text-white rounded-full transition-all duration-300 flex-shrink-0"
            aria-label="Slide suivant"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Indicateur de slides */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs md:text-sm text-gray-500 relative z-10">
          <span className="font-semibold text-gray-700">{currentIndex + 1}</span>
          <span>/</span>
          <span>{testimonials.length}</span>
        </div>

        {/* Auto-play indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 relative z-10">
          <div className={`w-2 h-2 rounded-full ${autoPlay ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span>{autoPlay ? 'Auto-lecture en cours' : 'Survolez pour plus de temps'}</span>
        </div>
      </div>
    </div>
  )
}

export default TestimonialsCarousel
