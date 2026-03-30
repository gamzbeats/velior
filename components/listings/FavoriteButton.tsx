'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { toggleFavorite } from '@/lib/actions'

interface FavoriteButtonProps {
  listingId: string
  initialFavorited: boolean
  isLoggedIn: boolean
}

export default function FavoriteButton({ listingId, initialFavorited, isLoggedIn }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    const next = !favorited
    setFavorited(next)

    startTransition(async () => {
      const res = await toggleFavorite(listingId)
      if (res?.error === 'login_required') {
        setFavorited(false)
        router.push('/login')
      } else if (res?.error) {
        // Revert optimistic update on limit error
        setFavorited(!next)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={favorited ? 'Remove from watchlist' : 'Save to watchlist'}
      className="absolute top-3 right-3 z-10 bg-background/90 backdrop-blur-sm p-2 transition-opacity hover:bg-background disabled:opacity-50"
    >
      <Heart
        size={16}
        strokeWidth={1.5}
        className={favorited ? 'fill-foreground text-foreground' : 'text-foreground'}
      />
    </button>
  )
}
