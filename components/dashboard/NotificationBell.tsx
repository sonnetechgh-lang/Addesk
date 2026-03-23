'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, CheckCheck, ShoppingCart, AlertCircle, Info } from 'lucide-react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/actions/notifications'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [now, setNow] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNow(Date.now())
  }, [])

  const fetchNotifications = async () => {
    const result = await getNotifications()
    setNotifications(result.notifications)
    setUnreadCount(result.unreadCount)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    const tick = setInterval(() => setNow(Date.now()), 60000)
    return () => { clearInterval(interval); clearInterval(tick) }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleMarkRead = (id: string, link: string | null) => {
    startTransition(async () => {
      await markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      if (link) {
        setOpen(false)
        router.push(link)
      }
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    })
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'new_order': return <ShoppingCart className="h-4 w-4 text-brand-success" />
      case 'order_completed': return <Check className="h-4 w-4 text-success" />
      case 'order_cancelled': return <AlertCircle className="h-4 w-4 text-error" />
      default: return <Info className="h-4 w-4 text-info" />
    }
  }

  const timeAgo = useCallback((dateStr: string) => {
    const seconds = Math.floor((now - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }, [now])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications() }}
        className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 relative hover:text-slate-600 cursor-pointer shadow-sm transition-colors"
      >
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <Bell className="h-4.5 w-4.5" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-surface-card border border-border rounded-2xl shadow-elevation-high z-50 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="flex items-center gap-1 text-xs font-semibold text-brand-success hover:text-brand-success-dark transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="h-8 w-8 text-text-muted mb-2" />
                <p className="text-sm font-medium text-text-muted">No notifications yet</p>
                <p className="text-xs text-text-muted mt-1">We&apos;ll notify you when something happens</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id, n.link)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-light transition-colors border-b border-border/50 last:border-b-0 ${
                    !n.is_read ? 'bg-brand-success/5' : ''
                  }`}
                >
                  <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    !n.is_read ? 'bg-brand-success/10' : 'bg-surface-light'
                  }`}>
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${!n.is_read ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-brand-success shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-text-muted mt-1 font-medium">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
