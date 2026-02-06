import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../contexts/NotificationsProvider'
import { useTranslation } from 'react-i18next'
import { Bell, LogOut } from 'lucide-react'

export default function HeaderActions() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const { notifications, markRead, markAllRead } = useNotifications()
  const safeNotifications = Array.isArray(notifications) ? notifications : []

  const [open, setOpen] = React.useState(false)
  const unread = safeNotifications.filter(n => !n.read).length

  return (
    <div className="flex items-center gap-3 relative">
      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-white/60 rounded-full px-2.5 py-2 shadow-sm">
        {/* Notifications */}
        <button
          onClick={() => setOpen(o => !o)}
          className="relative w-9 h-9 rounded-full bg-violet-50 text-violet-700 flex items-center justify-center hover:bg-violet-100 transition"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1.5">
              {unread}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-black transition"
          aria-label="Déconnexion"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b bg-gradient-to-r from-violet-50 to-white">
            <span className="font-semibold text-sm text-gray-800">
              {t('notifications.title') ?? 'Notifications'}
            </span>
            <button
              onClick={markAllRead}
              className="text-xs text-violet-600 hover:underline"
            >
              Tout lire
            </button>
          </div>

          <div className="max-h-64 overflow-auto">
            {safeNotifications.length === 0 && (
              <p className="px-4 py-4 text-sm text-gray-500">
                {t('notifications.none') ?? 'Aucune notification'}
              </p>
            )}

            {safeNotifications.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`px-4 py-3 text-sm cursor-pointer border-b last:border-none transition
                  ${n.read ? 'bg-white' : 'bg-violet-50/60'}
                `}
              >
                <p className="font-medium text-gray-900">{n.title}</p>
                <p className="text-gray-600">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.date || '').toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
