'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Permanent_Marker } from 'next/font/google'
import React, { useEffect, useRef, useState } from 'react'
import { Repeat2 } from 'lucide-react'

import { ProductGridItem } from '@/components/ProductGridItem'
import type { Product } from '@/payload-types'

import styles from './index.module.css'

type GalleryItem = {
  alt: string
  height?: number | null
  id: number
  mimeType?: string | null
  previewUrl?: string | null
  products: Product[]
  submittedBy?: string | null
  url: string
  width?: number | null
}

type Props = {
  items: GalleryItem[]
}

const markerFont = Permanent_Marker({
  subsets: ['latin'],
  weight: '400',
})

const getColumns = (width: number) => {
  if (width < 640) return 2
  if (width < 1024) return 3
  return 4
}

const getRatio = (item: GalleryItem, ratios: Record<number, number>) => ratios[item.id] || 1

const polaroidTilts = [-1.4, 0.8, -0.5, 1.2, -0.9, 0.4]
const signatureTilts = [-2.4, 1.1, -0.7, 2, -1.6, 0.5, 1.7]

const getPolaroidTilt = (id: number) => polaroidTilts[Math.abs(id) % polaroidTilts.length]
const getSignatureTilt = (id: number) =>
  signatureTilts[(Math.abs(id) * 5 + 2) % signatureTilts.length]

const packItems = (items: GalleryItem[], ratios: Record<number, number>, columnCount: number) => {
  const columns = Array.from({ length: columnCount }, () => [] as GalleryItem[])
  const columnHeights = Array.from({ length: columnCount }, () => 0)

  // Preserve the shuffled input order while continuously filling the shortest column.
  for (const item of items) {
    const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights))
    columns[shortestColumn].push(item)
    columnHeights[shortestColumn] += 1 / getRatio(item, ratios) + 0.04
  }

  return columns
}

export const GalleryBentoGrid: React.FC<Props> = ({ items }) => {
  const gridRef = useRef<HTMLDivElement>(null)
  const [ratios, setRatios] = useState<Record<number, number>>(() =>
    Object.fromEntries(
      items.map((item) => [item.id, item.width && item.height ? item.width / item.height : 1]),
    ),
  )
  const [columnCount, setColumnCount] = useState(1)
  const [fullImagesLoaded, setFullImagesLoaded] = useState<Record<number, boolean>>({})
  const [isLookFlipped, setIsLookFlipped] = useState(false)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const updateColumnCount = () => setColumnCount(getColumns(grid.clientWidth))

    const observer = new ResizeObserver(updateColumnCount)
    observer.observe(grid)
    updateColumnCount()

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!selectedItem) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedItem(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selectedItem])

  useEffect(() => {
    if (!selectedItem) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [selectedItem])

  const columns = packItems(items, ratios, columnCount)

  return (
    <div
      className="grid items-start gap-5 px-1 py-3 md:gap-7 md:px-2"
      ref={gridRef}
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {columns.map((column, columnIndex) => (
        <div className="flex min-w-0 flex-col gap-5 md:gap-7" key={columnIndex}>
          {column.map((item) => {
            const ratio = getRatio(item, ratios)
            const isVideo = item.mimeType?.startsWith('video/')
            const showFullImage = fullImagesLoaded[item.id]

            return (
              <figure
                className={`${styles.polaroid} group relative w-full rotate-[var(--polaroid-tilt)] bg-[#f8f3e7] p-2 pb-3 shadow-[0_5px_12px_rgba(65,42,12,0.2),0_18px_32px_rgba(65,42,12,0.12)] transition-[transform,box-shadow] duration-300 ease-out hover:z-10 hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_8px_18px_rgba(65,42,12,0.24),0_24px_42px_rgba(65,42,12,0.16)] sm:p-3 sm:pb-4`}
                key={item.id}
                style={
                  { '--polaroid-tilt': `${getPolaroidTilt(item.id)}deg` } as React.CSSProperties
                }
              >
                <button
                  aria-label={`View ${item.alt}`}
                  className="relative block w-full cursor-pointer overflow-hidden bg-[#ddd5c5] text-left"
                  onClick={() => {
                    setIsLookFlipped(false)
                    setSelectedItem(item)
                    window.setTimeout(() => setIsLookFlipped(true), 420)
                  }}
                  style={{ aspectRatio: ratio }}
                  type="button"
                >
                  {isVideo ? (
                    <video
                      autoPlay
                      className="size-full object-contain"
                      loop
                      muted
                      onLoadedMetadata={(event) => {
                        const { videoHeight, videoWidth } = event.currentTarget
                        if (videoWidth && videoHeight) {
                          setRatios((current) => ({
                            ...current,
                            [item.id]: videoWidth / videoHeight,
                          }))
                        }
                      }}
                      playsInline
                      src={item.url}
                    />
                  ) : (
                    <>
                      {item.previewUrl && (
                        <Image
                          alt=""
                          aria-hidden
                          className="object-contain blur-[1px]"
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          src={item.previewUrl}
                          unoptimized
                        />
                      )}
                      <Image
                        alt={item.alt}
                        className={`object-contain transition-opacity duration-500 ${
                          showFullImage || !item.previewUrl ? 'opacity-100' : 'opacity-0'
                        }`}
                        fill
                        onLoad={(event) => {
                          const { naturalHeight, naturalWidth } = event.currentTarget
                          if (naturalWidth && naturalHeight) {
                            const nextRatio = naturalWidth / naturalHeight
                            setRatios((current) =>
                              current[item.id] === nextRatio
                                ? current
                                : { ...current, [item.id]: nextRatio },
                            )
                          }
                          setFullImagesLoaded((current) => ({ ...current, [item.id]: true }))
                        }}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        src={item.url}
                        unoptimized
                      />
                    </>
                  )}
                </button>
                <figcaption className="flex min-h-11 items-center overflow-hidden px-1 py-2 text-[#D8A322] sm:min-h-14 sm:px-2 sm:py-3">
                  <span
                    className={`${markerFont.className} ${styles.signature} inline-block text-base leading-none sm:text-3xl`}
                    style={
                      {
                        '--signature-tilt': `${getSignatureTilt(item.id)}deg`,
                      } as React.CSSProperties
                    }
                  >
                    {item.submittedBy || 'Honeylooms'}
                  </span>
                </figcaption>
              </figure>
            )
          })}
        </div>
      ))}
      {selectedItem && (
        <div
          aria-label={selectedItem.alt}
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
        >
          <button
            aria-label="Close look details"
            className="absolute inset-0 bg-black/70"
            onClick={() => setSelectedItem(null)}
            type="button"
          />
          <div
            className="relative z-10"
            key={selectedItem.id}
            style={{
              animation: 'gallery-look-enter 260ms ease-out both',
              aspectRatio: '3 / 4',
              perspective: '1200px',
              width: 'min(90vw, 60vh, 34rem)',
            }}
          >
            <div
              className="relative size-full"
              style={{
                transform: isLookFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transformStyle: 'preserve-3d',
                transition: 'transform 700ms cubic-bezier(0.22, 0.61, 0.36, 1)',
              }}
            >
              <div
                className={`absolute inset-0 overflow-hidden bg-background ${isLookFlipped ? 'pointer-events-none' : ''}`}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <button
                  aria-label="Close look details"
                  className="absolute inset-0 z-10 cursor-pointer"
                  onClick={() => setSelectedItem(null)}
                  type="button"
                />
                {selectedItem.mimeType?.startsWith('video/') ? (
                  <video
                    autoPlay
                    className="size-full object-contain"
                    loop
                    muted
                    playsInline
                    src={selectedItem.url}
                  />
                ) : (
                  <Image
                    alt={selectedItem.alt}
                    className="object-contain"
                    fill
                    sizes="90vw"
                    src={selectedItem.url}
                    unoptimized
                  />
                )}
              </div>
              <div
                className={`absolute inset-0 flex flex-col overflow-hidden bg-background p-5 text-foreground sm:p-6 ${isLookFlipped ? '' : 'pointer-events-none'}`}
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div
                  className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]"
                  onTouchMove={(event) => event.stopPropagation()}
                  onWheel={(event) => event.stopPropagation()}
                >
                  <p className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                    Worn by
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    {selectedItem.submittedBy || 'The Honeylooms community'}
                  </h2>
                  <div className="justify-center items-center mt-5 border-t border-neutral-200 py-4 dark:border-neutral-800">
                    <p className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                      Wearing
                    </p>
                    {selectedItem.products.length ? (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {selectedItem.products.map((product) => (
                          <div className="[&>a:first-child]:h-auto" key={product.id}>
                            <ProductGridItem product={product} showShopCta />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Honeylooms pieces
                        </p>
                        <Link
                          className="mt-3 inline-flex w-full items-center justify-center bg-[#D9A322] px-3 py-2.5 font-mono text-[10px] font-semibold tracking-wider text-[#24231f] uppercase transition-colors hover:bg-[#bf8d16]"
                          href="/shop"
                        >
                          Shop this look
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                {/*<button
                  className="mt-4 w-full shrink-0 text-xs text-neutral-500 underline underline-offset-4"
                  onClick={() => setSelectedItem(null)}
                  type="button"
                >
                  Back to gallery
                </button>*/}
              </div>
            </div>
            <button
              aria-label={isLookFlipped ? 'Flip to image' : 'Flip to shopping details'}
              className="absolute left-1/2 top-[calc(100%+0.75rem)] z-20 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/65"
              onClick={() => setIsLookFlipped((current) => !current)}
              type="button"
            >
              <Repeat2 className="size-3.5" aria-hidden="true" />
              Flip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
