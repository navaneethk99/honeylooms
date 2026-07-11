'use client'

import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'

type GalleryItem = {
  alt: string
  height?: number | null
  id: number
  mimeType?: string | null
  submittedBy?: string | null
  url: string
  width?: number | null
}

type TileLayout = {
  columnSpan: number
  rowSpan: number
}

type Props = {
  items: GalleryItem[]
}

const getColumns = (width: number) => {
  if (width < 640) return 2
  if (width < 768) return 4
  return 6
}

const getColumnSpan = (ratio: number, columns: number) => {
  if (columns === 2) return ratio >= 1.35 ? 2 : 1
  if (columns === 4) return ratio >= 1.75 ? 3 : ratio >= 1.15 ? 2 : 1
  return ratio >= 1.75 ? 3 : ratio >= 1.15 ? 2 : ratio < 0.72 ? 1 : 2
}

export const GalleryBentoGrid: React.FC<Props> = ({ items }) => {
  const gridRef = useRef<HTMLDivElement>(null)
  const [ratios, setRatios] = useState<Record<number, number>>(() =>
    Object.fromEntries(
      items.map((item) => [item.id, item.width && item.height ? item.width / item.height : 1]),
    ),
  )
  const [layout, setLayout] = useState<Record<number, TileLayout>>({})

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const updateLayout = () => {
      const columns = getColumns(grid.clientWidth)
      const gap = grid.clientWidth < 768 ? 8 : 12
      const columnWidth = (grid.clientWidth - gap * (columns - 1)) / columns
      const rowHeight = 8

      setLayout(
        Object.fromEntries(
          items.map((item) => {
            const ratio = ratios[item.id] || 1
            const columnSpan = getColumnSpan(ratio, columns)
            const tileWidth = columnWidth * columnSpan + gap * (columnSpan - 1)
            const tileHeight = tileWidth / ratio
            const rowSpan = Math.ceil((tileHeight + gap) / (rowHeight + gap))

            return [item.id, { columnSpan, rowSpan }]
          }),
        ),
      )
    }

    const observer = new ResizeObserver(updateLayout)
    observer.observe(grid)
    updateLayout()

    return () => observer.disconnect()
  }, [items, ratios])

  return (
    <div
      className="grid auto-rows-[8px] grid-flow-dense grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 md:gap-3"
      ref={gridRef}
    >
      {items.map((item) => {
        const ratio = ratios[item.id] || 1
        const tile = layout[item.id]
        const isVideo = item.mimeType?.startsWith('video/')

        return (
          <figure
            className="group relative w-full self-start overflow-hidden border border-neutral-100 bg-neutral-100 dark:border-neutral-900 dark:bg-neutral-950"
            key={item.id}
            style={{
              aspectRatio: ratio,
              gridColumn: `span ${tile?.columnSpan || 1}`,
              gridRow: `span ${tile?.rowSpan || 20}`,
            }}
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
              <Image
                alt={item.alt}
                className="object-contain"
                fill
                onLoad={(event) => {
                  const { naturalHeight, naturalWidth } = event.currentTarget
                  if (naturalWidth && naturalHeight) {
                    const ratio = naturalWidth / naturalHeight
                    setRatios((current) =>
                      current[item.id] === ratio ? current : { ...current, [item.id]: ratio },
                    )
                  }
                }}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, 33vw"
                src={item.url}
                unoptimized
              />
            )}
            {item.submittedBy && (
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-10 text-xs tracking-wide text-white transition-transform duration-300 group-hover:translate-y-0">
                Shared by {item.submittedBy}
              </figcaption>
            )}
          </figure>
        )
      })}
    </div>
  )
}
