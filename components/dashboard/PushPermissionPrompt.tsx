'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { saveSubscription, removeSubscription } from '@/actions/notifications'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'push-prompt-dismissed'
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function PushPermissionPrompt() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true

    if (
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !VAPID_PUBLIC_KEY ||
      Notification.permission === 'granted' ||
      Notification.permission === 'denied' ||
      localStorage.getItem(STORAGE_KEY)
    ) return

    setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  const enable = async () => {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { dismiss(); return }

      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) await removeSubscription(existing.endpoint)

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      await saveSubscription(sub.toJSON())
      dismiss()
    } catch (err) {
      console.error('Push subscription failed:', err)
      dismiss()
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50 animate-fade-in-up">
      <div className="bg-surface-card border border-border rounded-2xl shadow-elevation-high p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-brand-success/10 flex items-center justify-center shrink-0">
          <Bell className="h-4.5 w-4.5 text-brand-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary">Enable notifications</p>
          <p className="text-xs text-text-muted mt-0.5">Get notified instantly when you receive a new booking.</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="primary" onClick={enable} isLoading={loading}>
              Enable
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button onClick={dismiss} className="text-text-muted hover:text-text-primary transition-colors shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
