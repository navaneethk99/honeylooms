'use client'

import { XIcon, type XIconHandle } from '@animateicons/react/lucide'
import { ArrowDown, ImagePlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const UPLOAD_SECTION_ID = 'gallery-upload'

export function GalleryUploadShortcut() {
  const [isUploadSectionVisible, setIsUploadSectionVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const closeIconRef = useRef<XIconHandle>(null)

  useEffect(() => {
    const uploadSection = document.getElementById(UPLOAD_SECTION_ID)
    if (!uploadSection) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsUploadSectionVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.1 },
    )

    observer.observe(uploadSection)
    return () => observer.disconnect()
  }, [])

  const isHidden = isUploadSectionVisible || isDismissed

  return (
    <div
      aria-hidden={isHidden}
      className={`fixed inset-x-4 bottom-4 z-40 mx-auto max-w-sm border border-[#24231f]/20 bg-[#fff9ec]/95 text-[#24231f] shadow-[0_8px_28px_rgba(65,42,12,0.24)] backdrop-blur-md transition-[opacity,transform] duration-300 sm:right-8 sm:bottom-8 sm:left-auto sm:mx-0 ${
        isHidden ? 'pointer-events-none translate-y-3 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <a
        className="group flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-white sm:px-5 sm:py-4"
        href={`#${UPLOAD_SECTION_ID}`}
        tabIndex={isHidden ? -1 : undefined}
      >
        <span className="flex size-10 shrink-0 items-center justify-center bg-[#D9A322]">
          <ImagePlus aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-dream-orphanage text-base leading-tight">
            Be part of the Honeylooms community
          </span>
          <span className="mt-0.5 block text-[10px] leading-tight tracking-[0.12em] uppercase">
            Add your pics to our picture wall
          </span>
        </span>
        <ArrowDown
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-y-1"
        />
      </a>
      <button
        aria-label="Close community upload prompt"
        className="absolute -top-2 -left-2 z-10 flex size-7 items-center justify-center rounded-full bg-[#24231f] text-white shadow-md transition-transform hover:scale-110"
        onBlur={() => closeIconRef.current?.stopAnimation()}
        onClick={() => setIsDismissed(true)}
        onFocus={() => closeIconRef.current?.startAnimation()}
        onMouseEnter={() => closeIconRef.current?.startAnimation()}
        onMouseLeave={() => closeIconRef.current?.stopAnimation()}
        tabIndex={isHidden ? -1 : undefined}
        type="button"
      >
        <XIcon className="pointer-events-none" ref={closeIconRef} size={14} />
      </button>
    </div>
  )
}
