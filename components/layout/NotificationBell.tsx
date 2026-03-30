'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { markAllNotificationsRead, markNotificationRead, deleteNotification } from '@/lib/actions'
import { type Notification } from '@/lib/types'

function notifHref(n: Notification): string {
  if (n.type === 'message' || n.type === 'offer') {
    return n.listing_id ? `/messages?listing=${n.listing_id}` : '/messages'
  }
  return n.listing_id ? `/listings/${n.listing_id}` : '/'
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
  const router = useRouter()

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => setNotifications((prev) => [payload.new as Notification, ...prev])
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => setNotifications((prev) =>
          prev.map((n) => (n.id === (payload.new as Notification).id ? (payload.new as Notification) : n))
        )
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => setNotifications((prev) => prev.filter((n) => n.id !== (payload.old as Notification).id))
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

  function handleOpen() {
    setOpen((prev) => !prev)
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await markAllNotificationsRead()
  }

  async function handleMarkRead(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    await markNotificationRead(id)
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await deleteNotification(id)
  }

  async function handleNotifClick(n: Notification) {
    setOpen(false)
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))
      await markNotificationRead(n.id)
    }
    router.push(notifHref(n))
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
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
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-[10px] font-medium tracking-[0.25em] uppercase">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors tracking-wide"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-10 text-xs text-muted-foreground text-center">No notifications yet</p>
          ) : (
            <ul className="max-h-[340px] overflow-y-auto divide-y divide-border/50">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`group flex items-start gap-2 px-3 py-3 hover:bg-muted/20 transition-colors cursor-pointer ${n.read ? '' : 'bg-muted/30'}`}
                  onClick={() => handleNotifClick(n)}
                >
                  <NotifDot type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-snug">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground/50 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {/* Actions — visibles au hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                    {!n.read && (
                      <button
                        onClick={(e) => handleMarkRead(e, n.id)}
                        title="Mark as read"
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Check size={11} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      title="Delete"
                      className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </div>
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
  return <span className={`w-1.5 h-1.5 mt-1.5 shrink-0 ${colors[type] ?? 'bg-muted-foreground'}`} />
}
