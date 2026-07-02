'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/utilities/cn'

interface LottieLoaderProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  loop?: boolean
  autoplay?: boolean
}

export function LottieLoader({
  className,
  size = 'md',
  loop = true,
  autoplay = true,
}: LottieLoaderProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [Player, setPlayer] = useState<any>(null)

  useEffect(() => {
    setIsMounted(true)
    // Dynamically load the Lottie Player client-side only
    import('@lottiefiles/dotlottie-react')
      .then((mod) => {
        setPlayer(() => mod.DotLottieReact)
      })
      .catch((err) => {
        console.error('Failed to load @lottiefiles/dotlottie-react', err)
      })
  }, [])

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
    full: 'w-full h-full max-w-[280px] max-h-[280px]',
  }

  const isFullScreen = size === 'full'

  // Premium loading placeholder while player script loads
  if (!isMounted || !Player) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          isFullScreen
            ? 'fixed inset-0 z-[9999] bg-[#D9A322]'
            : className,
        )}
      >
        <div
          className={cn(
            'animate-pulse rounded-full bg-white/30',
            sizeClasses[size === 'full' ? 'xl' : size],
          )}
        />
      </div>
    )
  }

  const loaderContent = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 transition-all duration-300',
        isFullScreen ? 'p-8 animate-fade-in' : '',
        className,
      )}
    >
      <Player
        src="/Cat.lottie"
        loop={loop}
        autoplay={autoplay}
        className={sizeClasses[size] || sizeClasses.md}
      />
    </div>
  )

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#D9A322] transition-all duration-300 animate-fade-in">
        {loaderContent}
      </div>
    )
  }

  return loaderContent
}
