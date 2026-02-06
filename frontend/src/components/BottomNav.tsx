import { NavLink } from 'react-router-dom'
import { Home, ShoppingBag, Wallet, Crown } from 'lucide-react'

export default function BottomNav() {
  const baseItem =
    'group relative flex flex-col items-center text-[10px] sm:text-xs whitespace-nowrap px-2 py-2 rounded-2xl transition-all duration-300'

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50">
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
  )
}
