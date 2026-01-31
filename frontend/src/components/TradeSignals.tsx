import React, { useState, useEffect } from 'react'

interface Signal {
  id: number
  symbol: string
  action: 'BUY' | 'SELL'
  price: number
  change: number
  strength: number
  timestamp: string
  emoji: string
  priceHistory: number[]
}

const TradeSignals: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([])
  const [animatingSignals, setAnimatingSignals] = useState<Set<number>>(new Set())
  const [updatingPrices, setUpdatingPrices] = useState<Set<number>>(new Set())
  // Données mockées - signaux trading en temps réel
  const generateSignals = (): Signal[] => [
    {
      id: 1,
      symbol: 'BTC/USD',
      action: 'BUY',
      price: 45230.50,
      change: 2.45,
      strength: 95,
      timestamp: 'À l\'instant',
      emoji: '₿',
      priceHistory: [44800, 44950, 45100, 45180, 45230, 45280, 45230]
    },
    {
      id: 2,
      symbol: 'ETH/USD',
      action: 'SELL',
      price: 2450.75,
      change: -1.23,
      strength: 87,
      timestamp: 'Il y a 2m',
      emoji: 'Ξ',
      priceHistory: [2480, 2475, 2465, 2460, 2455, 2450, 2450]
    },
    {
      id: 3,
      symbol: 'SOL/USD',
      action: 'BUY',
      price: 198.45,
      change: 5.12,
      strength: 98,
      timestamp: 'Il y a 3m',
      emoji: '◎',
      priceHistory: [188, 189, 190, 193, 196, 197, 198]
    },
    {
      id: 4,
      symbol: 'XRP/USD',
      action: 'BUY',
      price: 2.48,
      change: 3.87,
      strength: 92,
      timestamp: 'Il y a 5m',
      emoji: '✕',
      priceHistory: [2.32, 2.36, 2.40, 2.42, 2.45, 2.47, 2.48]
    }
  ]

  useEffect(() => {
    setSignals(generateSignals())
  }, [])

  // Mise à jour des prix toutes les 15 secondes
  useEffect(() => {
    const priceTimer = setInterval(() => {
      setUpdatingPrices(new Set(signals.map(s => s.id)))
      
      setSignals(prev =>
        prev.map(signal => {
          const variation = (Math.random() - 0.5) * 0.02 // ±2% variation
          const newPrice = signal.price * (1 + variation)
          const newChange = ((newPrice - signal.priceHistory[0]) / signal.priceHistory[0]) * 100
          
          return {
            ...signal,
            price: newPrice,
            change: newChange,
            priceHistory: [...signal.priceHistory.slice(1), newPrice]
          }
        })
      )
      
      setTimeout(() => setUpdatingPrices(new Set()), 500)
    }, 15000)

    return () => clearInterval(priceTimer)
  }, [signals])

  const getLineChart = (prices: number[]) => {
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const h = 40

    const points = prices.map((price, i) => {
      const y = h - ((price - min) / range) * h
      const x = (i / (prices.length - 1)) * 100
      return `${x},${y}`
    })

    return `M${points.join(' L')}`
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl shadow-2xl overflow-hidden mb-6 border border-purple-500/30">
      {/* Fond animé */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(139,92,246,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.3),transparent_50%)]"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative p-4 md:p-6 lg:p-8">
        {/* Header avec slogan */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                VISAFINANCE IA
              </h2>
              <p className="text-xs md:text-sm lg:text-base text-gray-300">
                ⚡ Signaux Trading en Temps Réel
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full blur opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-violet-600 to-pink-600 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-white font-bold text-xs md:text-sm">
                EN DIRECT
              </div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-full w-20 md:w-24 animate-pulse"></div>
        </div>

        {/* Grille des signaux - 4 colonnes responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {signals.map((signal, idx) => (
            <div
              key={signal.id}
              className={`group relative transform transition-all duration-500 ${
                animatingSignals.has(idx) ? 'scale-105 animate-pulse' : 'hover:scale-105'
              }`}
            >
              {/* Gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 rounded-2xl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Card - Tailles adaptées */}
              <div
                className={`relative bg-slate-800/80 backdrop-blur-xl rounded-2xl p-3 md:p-4 border border-purple-500/20 group-hover:border-purple-500/50 transition-all duration-300 h-full ${
                  signal.action === 'BUY'
                    ? 'bg-gradient-to-br from-slate-800 to-emerald-900/30'
                    : 'bg-gradient-to-br from-slate-800 to-red-900/30'
                }`}
              >
              {/* Signal badge avec animation */}
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div
                    className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full animate-pulse ${
                      signal.action === 'BUY' ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                  ></div>
                  <span
                    className={`text-xs font-black px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg ${
                      signal.action === 'BUY'
                        ? 'bg-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/30 text-red-300'
                    }`}
                  >
                    {signal.action}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-400">{signal.timestamp}</span>
              </div>

                {/* Symbole et prix */}
                <div className="mb-2 md:mb-3">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                    <span className="text-xl md:text-2xl">{signal.emoji}</span>
                    <div>
                      <div className="text-sm md:text-base font-bold text-white">{signal.symbol}</div>
                      <div className="text-xs text-gray-400">{signal.symbol.split('/')[0]}</div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-lg md:text-xl font-black text-white transition-all duration-500 ${
                      updatingPrices.has(signal.id) ? 'scale-110 text-emerald-300' : ''
                    }`}>
                      ${signal.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs md:text-sm font-bold transition-all duration-300 ${
                        signal.change > 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {signal.change > 0 ? '▲' : '▼'} {Math.abs(signal.change).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Barre de force du signal */}
                <div className="mb-1.5 md:mb-2">
                  <div className="flex items-center justify-between mb-0.5 md:mb-1">
                    <span className="text-xs text-gray-400">Force</span>
                    <span className={`text-xs font-bold ${signal.strength >= 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {signal.strength}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 md:h-2 bg-slate-700/50 rounded-full overflow-hidden border border-purple-500/20">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        signal.strength >= 90
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/50'
                          : 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                      }`}
                      style={{ width: `${signal.strength}%` }}
                    ></div>
                  </div>
                </div>

                {/* Graphique sparkline animé */}
                <div className="mb-2 md:mb-3 bg-slate-700/30 rounded-lg p-2 border border-purple-500/10">
                  <svg 
                    viewBox="0 0 100 40" 
                    className="w-full h-10"
                    preserveAspectRatio="none"
                  >
                    {/* Gradient pour la courbe */}
                    <defs>
                      <linearGradient id={`grad-${signal.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={signal.action === 'BUY' ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={signal.action === 'BUY' ? '#34d399' : '#f87171'} stopOpacity="0.8" />
                      </linearGradient>
                    </defs>
                    
                    {/* Aire sous la courbe */}
                    <path
                      d={`${getLineChart(signal.priceHistory)} L 100 40 L 0 40 Z`}
                      fill={`url(#grad-${signal.id})`}
                      opacity="0.3"
                    />
                    
                    {/* Ligne de prix */}
                    <path
                      d={getLineChart(signal.priceHistory)}
                      stroke={signal.action === 'BUY' ? '#10b981' : '#ef4444'}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-500"
                    />
                    
                    {/* Point final */}
                    <circle
                      cx="100"
                      cy={40 - ((signal.priceHistory[signal.priceHistory.length - 1] - Math.min(...signal.priceHistory)) / (Math.max(...signal.priceHistory) - Math.min(...signal.priceHistory) || 1)) * 40}
                      r="1.5"
                      fill={signal.action === 'BUY' ? '#34d399' : '#f87171'}
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Indicateurs en bas */}
        <div className="mt-8 pt-6 border-t border-purple-500/20 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs sm:text-sm text-gray-300">
              {signals.filter(s => s.action === 'BUY').length} Achats
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
            <span className="text-xs sm:text-sm text-gray-300">
              {signals.filter(s => s.action === 'SELL').length} Ventes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
            <span className="text-xs sm:text-sm text-gray-300">
              {(signals.reduce((acc, s) => acc + s.strength, 0) / signals.length).toFixed(0)}% Précision
            </span>
          </div>
        </div>
      </div>

      {/* Ligne animée en haut */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-pulse"></div>
    </div>
  )
}

export default TradeSignals
