
import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, ShoppingBag, Wallet, Crown, ChevronUp } from 'lucide-react'

export default function BottomNav() {
  const baseItem =
    'group relative flex flex-col items-center text-[10px] sm:text-xs whitespace-nowrap px-2 py-2 rounded-2xl transition-all duration-300'

  const [visible, setVisible] = useState(true)
  const [showButton, setShowButton] = useState(false)
  const hideTimeout = useRef<NodeJS.Timeout | null>(null)

  // Cache le BottomNav à la première interaction utilisateur (scroll, click, keydown)
  useEffect(() => {
    const hideNav = (e?: Event) => {
      // Si le clic vient du bouton flottant, ne rien faire
      if (e && (e.target as HTMLElement)?.closest('#show-bottomnav-btn')) return
      setVisible(false)
      setShowButton(true)
    }
    const handleScroll = () => hideNav()
    const handleClick = (e: Event) => hideNav(e)
    const handleKey = () => hideNav()
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [])

  // Affiche le BottomNav quand on clique sur le bouton flottant
  const handleShowNav = () => {
    setVisible(true)
    setShowButton(false)
    // Après 8s d'inactivité, recache automatiquement
    if (hideTimeout.current) clearTimeout(hideTimeout.current)
    hideTimeout.current = setTimeout(() => {
      setVisible(false)
      setShowButton(true)
    }, 8000)
  }

  return (
    <>
      {visible && (
        <nav className="fixed bottom-4 left-0 right-0 z-50 transition-all duration-500">
          <div className="mx-auto w-fit max-w-[92vw]">
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-white/90 backdrop-blur-md shadow-[0_10px_30px_rgba(17,24,39,0.15)] border border-white/60">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `${baseItem} ${
                    isActive
                      ? 'text-violet-700 bg-violet-100 shadow-sm scale-105'
                      : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'
                  }`
                }
              >
                <Home size={18} className="transition-transform duration-300 group-hover:scale-110" />
                <span>Maison</span>
              </NavLink>

              <NavLink
                to="/market"
                className={({ isActive }) =>
                  `${baseItem} ${
                    isActive
                      ? 'text-violet-700 bg-violet-100 shadow-sm scale-105'
                      : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'
                  }`
                }
              >
                <ShoppingBag size={18} className="transition-transform duration-300 group-hover:scale-110" />
                <span>Marché</span>
              </NavLink>

              <NavLink
                to="/wallets"
                className={({ isActive }) =>
                  `${baseItem} ${
                    isActive
                      ? 'text-violet-700 bg-violet-100 shadow-sm scale-105'
                      : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'
                  }`
                }
              >
                <Wallet size={18} className="transition-transform duration-300 group-hover:scale-110" />
                <span>Portefeuille</span>
              </NavLink>

              <NavLink
                to="/vip"
                className={({ isActive }) =>
                  `${baseItem} ${
                    isActive
                      ? 'text-violet-700 bg-violet-100 shadow-sm scale-105'
                      : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'
                  }`
                }
              >
                <Crown size={18} className="transition-transform duration-300 group-hover:scale-110" />
                <span>VIP</span>
              </NavLink>

              <NavLink
                to="/quantification"
                className={({ isActive }) =>
                  `${baseItem} ${
                    isActive
                      ? 'text-violet-700 bg-violet-100 shadow-sm scale-105'
                      : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'
                  }`
                }
              >
                <Wallet size={18} className="transition-transform duration-300 group-hover:scale-110" />
                <span>Quantif</span>
              </NavLink>
            </div>
          </div>
        </nav>
      )}
      {showButton && (
        <button
          id="show-bottomnav-btn"
          aria-label="Afficher la navigation"
          onClick={handleShowNav}
          className="fixed bottom-6 left-6 z-50 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center transition-all duration-300 animate-bounce"
          style={{ boxShadow: '0 4px 16px rgba(80,0,180,0.15)' }}
        >
          <ChevronUp size={28} />
        </button>
      )}
    </>
  )
}
