'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { markAllNotificationsRead } from '@/lib/actions'
import { type Notification } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  message: 'Message',
  offer: 'Offer',
  favorite: 'Saved',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setNotifications(data as Notification[]) })

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => setNotifications((prev) => [payload.new as Notification, ...prev])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === (payload.new as Notification).id ? (payload.new as Notification) : n))
          )
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleToggle() {
    const next = !open
    setOpen(next)
    if (next && unreadCount > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      await markAllNotificationsRead()
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell size={16} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-foreground text-background text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-80 bg-background border border-border shadow-xl z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[10px] font-medium tracking-[0.25em] uppercase">Notifications</p>
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-10 text-xs text-muted-foreground text-center">No notifications yet</p>
          ) : (
            <ul className="max-h-[340px] overflow-y-auto divide-y divide-border/50">
              {notifications.map((n) => (
                <li key={n.id} className={n.read ? '' : 'bg-muted/30'}>
                  {n.listing_id ? (
                    <Link
                      href={`/listings/${n.listing_id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors block"
                    >
                      <NotifDot type={n.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-snug">{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/50 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 px-4 py-3">
                      <NotifDot type={n.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-snug">{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/50 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="px-4 py-3 border-t border-border">
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              View all messages →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function NotifDot({ type }: { type: string }) {
  const colors: Record<string, string> = {
    message: 'bg-foreground',
    offer: 'bg-[#B8973A]',
    favorite: 'bg-foreground',
  }
  return (
    <span className={`w-1.5 h-1.5 mt-1.5 shrink-0 ${colors[type] ?? 'bg-muted-foreground'}`} />
  )
}
