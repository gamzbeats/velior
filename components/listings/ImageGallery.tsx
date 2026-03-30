'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageGalleryProps {
  images: string[]
  alt: string
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!images?.length) {
    return (
      <div className="relative aspect-square bg-muted overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
          <svg className="w-24 h-24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-3a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Primary image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <Image
          src={images[activeIndex]}
          alt={alt}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative aspect-square bg-muted overflow-hidden transition-opacity ${activeIndex === i ? 'ring-2 ring-foreground' : 'opacity-50 hover:opacity-100'}`}
            >
              <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" sizes="25vw" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
