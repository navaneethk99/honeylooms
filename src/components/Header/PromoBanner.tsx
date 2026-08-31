'use client'

import React, { useEffect, useState } from 'react'
import type { PromoBanner as PromoBannerType } from '@/payload-types'

type Props = {
  promoBanner: PromoBannerType | null
}

export function PromoBanner({ promoBanner }: Props) {
  const { enabled, messages, interval = 4 } = promoBanner || {}

  // If banner is disabled, or there are no messages, don't render anything
  if (!enabled || !messages || messages.length === 0) {
    return null
  }

  return <PromoBannerClient messages={messages} interval={interval ?? 4} />
}

function PromoBannerClient({
  messages,
  interval,
}: {
  messages: NonNullable<PromoBannerType['messages']>
  interval: number
}) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (messages.length <= 1) return

    const msInterval = interval * 1000

    const timer = setInterval(() => {
      // Start fade out
      setIsFading(true)

      // Wait 300ms for fade out transition to complete, then change text and fade in
      const timeout = setTimeout(() => {
        setCurrentIdx((prevIdx) => (prevIdx + 1) % messages.length)
        setIsFading(false)
      }, 300)

      return () => clearTimeout(timeout)
    }, msInterval)

    return () => clearInterval(timer)
  }, [messages, interval])

  const currentMessage = messages[currentIdx]?.text || ''

  return (
    <div className="w-full select-none bg-[#D9A322] px-4 py-3 text-lg text-white transition-all duration-300">
      <div className="container mx-auto flex items-center justify-center text-center font-medium tracking-wider uppercase text-[13px]">
        <div
          className={`transition-all duration-300 ease-out transform ${
            isFading ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'
          }`}
        >
          {currentMessage}
        </div>
      </div>
    </div>
  )
}
