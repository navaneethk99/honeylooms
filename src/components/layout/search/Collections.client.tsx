'use client'
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'

import { Collection } from '@/payload-types'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import clsx from 'clsx'

type Props = {
  collection: Collection
}

export const CollectionItem: React.FC<Props> = ({ collection }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = useMemo(() => {
    return searchParams.get('collection') === String(collection.id)
  }, [collection.id, searchParams])

  const setQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (isActive) {
      params.delete('collection')
    } else {
      params.set('collection', String(collection.id))
    }

    params.delete('page')
    const newParams = params.toString()

    router.push(pathname + '?' + newParams)
  }, [collection.id, isActive, pathname, router, searchParams])

  return (
    <button
      aria-pressed={isActive}
      onClick={() => setQuery()}
      className={clsx(
        'group -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-2.5 px-2 py-1.5 text-left text-[13px] leading-snug transition-colors duration-200',
        isActive
          ? 'bg-[#D9A322]/15 font-medium text-[#24231f]'
          : 'text-[#6c675d] hover:bg-[#24231f]/[0.035] hover:text-[#24231f]',
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'size-1.5 shrink-0 rounded-full transition-[background-color,transform] duration-200',
          isActive
            ? 'scale-100 bg-[#D9A322]'
            : 'scale-75 bg-[#24231f]/15 group-hover:scale-100 group-hover:bg-[#24231f]/35',
        )}
      />
      <span className="min-w-0 flex-1 truncate">{collection.title}</span>
    </button>
  )
}

export const CollectionSelect: React.FC<{ collections: Collection[] }> = ({ collections }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeCollection = useMemo(() => {
    const id = searchParams.get('collection')
    return collections.find((col) => String(col.id) === id)
  }, [collections, searchParams])

  const activeLabel = activeCollection ? activeCollection.title : 'All Collections'

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (collectionId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (!collectionId) {
      params.delete('collection')
    } else {
      params.set('collection', collectionId)
    }

    params.delete('page')
    setIsOpen(false)
    router.push(pathname + '?' + params.toString())
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-background border border-neutral-200 dark:border-neutral-800 text-sm py-2 pl-3 pr-2.5 text-left text-neutral-800 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors focus:outline-none rounded-none"
      >
        <span className="truncate">{activeLabel}</span>
        <svg
          className={`h-4 w-4 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-1 w-full bg-background border border-neutral-200 dark:border-neutral-800 shadow-lg max-h-60 overflow-y-auto rounded-none">
          <ul className="py-1">
            <li>
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 ${
                  !activeCollection
                    ? 'font-semibold text-neutral-950 dark:text-neutral-50 bg-neutral-50/50 dark:bg-neutral-900/50'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                All Collections
              </button>
            </li>
            {collections.map((col) => {
              const isActive = activeCollection?.id === col.id
              return (
                <li key={col.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(String(col.id))}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 ${
                      isActive
                        ? 'font-semibold text-neutral-950 dark:text-neutral-50 bg-neutral-50/50 dark:bg-neutral-900/50'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {col.title}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
