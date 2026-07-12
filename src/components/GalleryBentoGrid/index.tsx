'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

type GalleryItem = {
  alt: string
  height?: number | null
  id: number
  mimeType?: string | null
  previewUrl?: string | null
  products: {
    slug: string
    title: string
  }[]
  submittedBy?: string | null
  url: string
  width?: number | null
}

type Props = {
  items: GalleryItem[]
}

const getColumns = (width: number) => {
  if (width < 640) return 2
  if (width < 1024) return 3
  return 4
}

const getRatio = (item: GalleryItem, ratios: Record<number, number>) => ratios[item.id] || 1

const packItems = (items: GalleryItem[], ratios: Record<number, number>, columnCount: number) => {
  const columns = Array.from({ length: columnCount }, () => [] as GalleryItem[])
  const columnHeights = Array.from({ length: columnCount }, () => 0)

  // Place tall pieces first, then continuously fill the shortest column.
  const sortedItems = [...items].sort((a, b) => getRatio(a, ratios) - getRatio(b, ratios))

  for (const item of sortedItems) {
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

  const columns = packItems(items, ratios, columnCount)

  return (
    <div
      className="grid items-start gap-2 md:gap-3"
      ref={gridRef}
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {columns.map((column, columnIndex) => (
        <div className="flex min-w-0 flex-col gap-2 md:gap-3" key={columnIndex}>
          {column.map((item) => {
            const ratio = getRatio(item, ratios)
            const isVideo = item.mimeType?.startsWith('video/')
            const showFullImage = fullImagesLoaded[item.id]

            return (
              <figure
                className="group relative w-full overflow-hidden border border-neutral-100 bg-neutral-100 dark:border-neutral-900 dark:bg-neutral-950"
                key={item.id}
                style={{ aspectRatio: ratio }}
              >
                <button
                  aria-label={`View ${item.alt}`}
                  className="absolute inset-0 cursor-pointer text-left"
                  onClick={() => setSelectedItem(item)}
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
                          setRatios((current) => ({ ...current, [item.id]: videoWidth / videoHeight }))
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
                {item.submittedBy && (
                  <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-10 text-xs tracking-wide text-white transition-transform duration-300 group-hover:translate-y-0">
                    Shared by {item.submittedBy}
                  </figcaption>
                )}
              </figure>
            )
          })}
        </div>
      ))}
      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null)
        }}
      >
        {selectedItem && (
          <DialogContent className="!w-auto !max-w-none overflow-visible border-0 bg-transparent p-0 shadow-none" showCloseButton={false}>
            <DialogTitle className="sr-only">{selectedItem.alt}</DialogTitle>
            <div className="gallery-look-card justify-self-center" key={selectedItem.id}>
              <div className="gallery-look-card__inner">
                <div className="gallery-look-card__face gallery-look-card__front">
                  <button
                    aria-label="Close look details"
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={() => setSelectedItem(null)}
                    type="button"
                  />
                  {selectedItem.mimeType?.startsWith('video/') ? (
                    <video autoPlay className="size-full object-contain" loop muted playsInline src={selectedItem.url} />
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
                <div className="gallery-look-card__face gallery-look-card__back">
                  <p className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                    Worn by
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    {selectedItem.submittedBy || 'The Honeylooms community'}
                  </h2>
                  <div className="mt-8 border-y border-neutral-200 py-4 dark:border-neutral-800">
                    <p className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                      Wearing
                    </p>
                    {selectedItem.products.length ? (
                      <ul className="mt-3 space-y-2">
                        {selectedItem.products.map((product) => (
                          <li key={product.slug}>
                            <Link className="text-sm underline underline-offset-4 hover:text-neutral-500" href={`/products/${product.slug}`}>
                              {product.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Honeylooms pieces</p>
                    )}
                  </div>
                  {selectedItem.products[0] && (
                    <Link
                      className="mt-7 inline-flex w-full items-center justify-center bg-neutral-900 px-5 py-3 font-mono text-xs tracking-widest text-white uppercase transition-colors hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200"
                      href={`/products/${selectedItem.products[0].slug}`}
                    >
                      Shop this look
                    </Link>
                  )}
                  <button className="mt-4 w-full text-xs text-neutral-500 underline underline-offset-4" onClick={() => setSelectedItem(null)} type="button">
                    Back to gallery
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
