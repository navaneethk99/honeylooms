'use client'
import React, { useMemo } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'

export function ClearFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hasActiveFilters = useMemo(() => {
    return searchParams.has('category') || searchParams.has('collection') || searchParams.has('q')
  }, [searchParams])

  if (!hasActiveFilters) return null

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('collection')
    params.delete('q')
    router.push(pathname + '?' + params.toString())
  }

  return (
    <button
      onClick={handleClear}
      className="text-xs uppercase tracking-wider text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white font-semibold transition-colors text-left hover:cursor-pointer pb-2 border-b border-neutral-100 dark:border-neutral-900"
    >
      Clear Filters &times;
    </button>
  )
}
