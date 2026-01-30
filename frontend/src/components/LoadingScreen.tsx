import React, { useState, useEffect } from 'react'

interface LoadingScreenProps {
  userName?: string
  isModal?: boolean
  showGreeting?: boolean
}

export default function LoadingScreen({ userName, isModal = false, showGreeting = true }: LoadingScreenProps) {
  const [greeting, setGreeting] = useState<'morning' | 'evening'>('morning')
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour >= 18 || hour < 6 ? 'evening' : 'morning')
    
    // Format user name: capitalize first letter
    if (userName) {
      const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase()
      setDisplayName(formattedName)
    }
  }, [userName])

  const greetingText = greeting === 'morning' ? 'Bonjour' : 'Bonsoir'
  const fullGreeting = displayName ? `${greetingText} ${displayName}!` : greetingText
  const containerClass = isModal ? 'fixed inset-0 z-[999] bg-black/40' : 'fixed inset-0 z-[9999]'

  return (
    <div className={containerClass + ' flex flex-col items-center justify-center px-4 overflow-hidden'} style={isModal ? { backgroundColor: 'rgba(0, 0, 0, 0.4)' } : {}}>
      {/* Animated background elements - only on non-modal */}
      {!isModal && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Title */}
        <div className={isModal ? 'mb-8' : 'mb-16'} style={{ animation: isModal ? 'none' : 'fade-in-down 0.8s ease-out' }}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-center leading-tight">
            <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
              VISAFINANCE
            </span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-violet-600 bg-clip-text text-transparent text-4xl sm:text-5xl md:text-6xl mt-2" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
              IA
            </span>
          </h1>
        </div>

        {/* Spinner */}
        <div className={isModal ? 'mb-6' : 'mb-12'}>
          <div className="animate-spin rounded-full h-20 w-20 sm:h-24 sm:w-24 border-4 border-gray-300 border-t-violet-600 border-r-purple-600 shadow-xl"></div>
        </div>

        {/* Greeting Message */}
        <div className={`text-center ${isModal ? 'mb-6' : 'mb-10'} animate-fade-in-up`}>
          {showGreeting ? (
            <>
              <p className="text-2xl sm:text-3xl md:text-4xl text-gray-800 font-semibold mb-2">
                {fullGreeting}
              </p>
              {!isModal && (
                <p className="text-sm sm:text-base text-gray-600 max-w-md">
                  👋 Bienvenue sur VISAFINANCE IA
                </p>
              )}
            </>
          ) : (
            <p className="text-2xl sm:text-3xl md:text-4xl text-gray-800 font-semibold mb-2">
              VISAFINANCE IA
            </p>
          )}
        </div>

        {/* Status messages */}
        <div className="text-center">
          <div className="inline-block">
            <p className="text-xs sm:text-sm text-gray-600 animate-pulse">
              {isModal ? '⏳ Authentification en cours...' : '⏳ Nous initialisons votre session...'}
            </p>
            <div className="flex justify-center gap-1 mt-3">
              <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>

        {/* Connection status - only on non-modal */}
        {!isModal && (
          <div className="mt-12 text-center text-xs sm:text-sm text-gray-500">
            <p>Veuillez patienter pendant que nous optimisons vos données</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}
