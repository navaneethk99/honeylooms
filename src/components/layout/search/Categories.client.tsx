'use client'
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'

import { Category } from '@/payload-types'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import clsx from 'clsx'

type Props = {
  category: Category
}

export const CategoryItem: React.FC<Props> = ({ category }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = useMemo(() => {
    return searchParams.get('category') === String(category.id)
  }, [category.id, searchParams])

  const setQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (isActive) {
      params.delete('category')
    } else {
      params.set('category', String(category.id))
    }

    const newParams = params.toString()

    router.push(pathname + '?' + newParams)
  }, [category.id, isActive, pathname, router, searchParams])

  return (
    <button
      onClick={() => setQuery()}
      className={clsx('hover:cursor-pointer', {
        ' underline': isActive,
      })}
    >
      {category.title}
    </button>
  )
}

export const CategorySelect: React.FC<{ categories: Category[] }> = ({ categories }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeCategory = useMemo(() => {
    const id = searchParams.get('category')
    return categories.find((cat) => String(cat.id) === id)
  }, [categories, searchParams])

  const activeLabel = activeCategory ? activeCategory.title : 'All Categories'

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

  const handleSelect = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (!categoryId) {
      params.delete('category')
    } else {
      params.set('category', categoryId)
    }

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
                  !activeCategory
                    ? 'font-semibold text-neutral-950 dark:text-neutral-50 bg-neutral-50/50 dark:bg-neutral-900/50'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                All Categories
              </button>
            </li>
            {categories.map((cat) => {
              const isActive = activeCategory?.id === cat.id
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(String(cat.id))}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 ${
                      isActive
                        ? 'font-semibold text-neutral-950 dark:text-neutral-50 bg-neutral-50/50 dark:bg-neutral-900/50'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {cat.title}
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

