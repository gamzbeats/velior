'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false })

export default function SplineScene() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Spline
      scene="https://prod.spline.design/07RapDKBrHI70s66/scene.splinecode"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
