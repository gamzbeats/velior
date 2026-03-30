import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { markMessagesRead, sendMessage } from '@/lib/actions'

interface MessageRow {
  id: string
  listing_id: string
  sender_id: string | null
  recipient_id: string
  content: string
  read: boolean
  created_at: string
  sender_name: string | null
  sender_email: string | null
  listing: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
  } | null
  sender_profile: {
    full_name: string | null
    username: string | null
  } | null
}

interface Thread {
  listingId: string
  listing: MessageRow['listing']
  messages: MessageRow[]
  unread: number
  lastAt: string
}

function groupByListing(messages: MessageRow[]): Thread[] {
  const map = new Map<string, Thread>()
  for (const msg of messages) {
    const key = msg.listing_id
    if (!map.has(key)) {
      map.set(key, { listingId: key, listing: msg.listing, messages: [], unread: 0, lastAt: msg.created_at })
    }
    const thread = map.get(key)!
    thread.messages.push(msg)
    if (!msg.read) thread.unread++
    if (msg.created_at > thread.lastAt) thread.lastAt = msg.created_at
  }
  return Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt))
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string }>
}) {
  const { listing: selectedListingId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawMessages } = await supabase
    .from('messages')
    .select(`
      *,
      listing:listings(id, title, brand, model, images),
      sender_profile:profiles!sender_id(full_name, username)
    `)
    .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
    .order('created_at', { ascending: true })

  const messages = (rawMessages ?? []) as MessageRow[]
  const threads = groupByListing(messages)
  const activeThread = selectedListingId
    ? threads.find((t) => t.listingId === selectedListingId) ?? null
    : threads[0] ?? null

  // Mark as read when viewing a thread
  if (activeThread) {
    await markMessagesRead(activeThread.listingId)
  }

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen">
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-10">
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground mb-2">Inbox</p>
            <h1 className="font-display text-4xl font-light">Messages</h1>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          {threads.length === 0 ? (
            <div className="py-32 text-center">
              <p className="font-display text-3xl font-light text-muted-foreground/40 mb-6">No messages yet</p>
              <Link href="/listings" className="text-xs font-medium tracking-[0.2em] uppercase border-b border-foreground pb-0.5">
                Browse Watches
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-[600px] border-x border-b border-border">
              {/* Thread list */}
              <div className="border-r border-border divide-y divide-border">
                {threads.map((thread) => {
                  const lastMsg = thread.messages[thread.messages.length - 1]
                  const isActive = thread.listingId === (activeThread?.listingId ?? threads[0]?.listingId)
                  return (
                    <Link
                      key={thread.listingId}
                      href={`/messages?listing=${thread.listingId}`}
                      className={`flex items-start gap-3 p-4 hover:bg-card transition-colors ${isActive ? 'bg-card' : ''}`}
                    >
                      {/* Listing thumbnail */}
                      <div className="relative w-12 h-12 bg-muted shrink-0 overflow-hidden">
                        {thread.listing?.images?.[0] ? (
                          <Image src={thread.listing.images[0]} alt={thread.listing.brand ?? ''} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="absolute inset-0 bg-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium truncate">
                            {thread.listing?.brand} {thread.listing?.model}
                          </p>
                          <p className="text-[10px] text-muted-foreground shrink-0">{formatDate(thread.lastAt)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsg.content.slice(0, 60)}{lastMsg.content.length > 60 ? '…' : ''}</p>
                        {thread.unread > 0 && (
                          <span className="mt-1 inline-block bg-foreground text-background text-[10px] px-1.5 py-0.5 font-medium">
                            {thread.unread} new
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Thread detail */}
              {activeThread ? (
                <div className="flex flex-col">
                  {/* Thread header */}
                  <div className="border-b border-border px-6 py-4 flex items-center gap-4">
                    {activeThread.listing?.images?.[0] && (
                      <div className="relative w-10 h-10 bg-muted overflow-hidden shrink-0">
                        <Image src={activeThread.listing.images[0]} alt="" fill className="object-cover" sizes="40px" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium">{activeThread.listing?.brand} {activeThread.listing?.model}</p>
                      <Link href={`/listings/${activeThread.listingId}`} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                        View listing →
                      </Link>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                    {activeThread.messages.map((msg) => {
                      const isOwn = msg.sender_id === user.id
                      const senderName = isOwn
                        ? 'You'
                        : (msg.sender_profile?.full_name ?? msg.sender_name ?? msg.sender_email ?? 'Buyer')
                      const isOffer = msg.content.startsWith('OFFER: €')

                      return (
                        <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                          <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground mb-1">
                            {senderName} · {formatDate(msg.created_at)}
                          </p>
                          <div className={`max-w-sm px-4 py-3 text-sm leading-relaxed ${
                            isOffer
                              ? 'border border-foreground bg-background font-medium'
                              : isOwn
                              ? 'bg-foreground text-background'
                              : 'bg-card border border-border'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Reply form */}
                  <div className="border-t border-border p-4">
                    <form
                      action={async (formData) => {
                        'use server'
                        await sendMessage(formData)
                      }}
                      className="flex gap-3"
                    >
                      <input type="hidden" name="listing_id" value={activeThread.listingId} />
                      <input type="hidden" name="recipient_id" value={
                        activeThread.messages[0]?.sender_id === user.id
                          ? activeThread.messages[0]?.recipient_id
                          : activeThread.messages[0]?.sender_id ?? ''
                      } />
                      <input
                        type="text"
                        name="content"
                        required
                        placeholder="Type a message…"
                        className="flex-1 border border-border bg-transparent px-4 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                      />
                      <button
                        type="submit"
                        className="bg-foreground text-background px-6 py-2 text-xs font-medium tracking-[0.15em] uppercase hover:bg-foreground/90 transition-colors shrink-0"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center text-muted-foreground/30 font-display text-2xl font-light">
                  Select a conversation
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
