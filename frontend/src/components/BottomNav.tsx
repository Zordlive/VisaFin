import { NavLink } from 'react-router-dom'
import { Home, ShoppingBag, Wallet, Crown } from 'lucide-react'

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 overflow-x-auto">

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs whitespace-nowrap px-1 ${
              isActive ? 'text-violet-600' : 'text-gray-400'
            }`
          }
        >
          <Home size={20} />
          <span>Maison</span>
        </NavLink>

        <NavLink
          to="/market"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs whitespace-nowrap px-1 ${
              isActive ? 'text-violet-600' : 'text-gray-400'
            }`
          }
        >
          <ShoppingBag size={20} />
          <span>Marché</span>
        </NavLink>

        <NavLink
          to="/wallets"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs whitespace-nowrap px-1 ${
              isActive ? 'text-violet-600' : 'text-gray-400'
            }`
          }
        >
          <Wallet size={20} />
          <span>Portefeuille</span>
        </NavLink>

        <NavLink
          to="/vip"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs whitespace-nowrap px-1 ${
              isActive ? 'text-violet-600' : 'text-gray-400'
            }`
          }
        >
          <Crown size={20} />
          <span>VIP</span>
        </NavLink>

        <NavLink
          to="/quantification"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs whitespace-nowrap px-1 ${
              isActive ? 'text-violet-600' : 'text-gray-400'
            }`
          }
        >
          <Wallet size={20} />
          <span>Quantification</span>
        </NavLink>

      </div>
    </nav>
  )
}
