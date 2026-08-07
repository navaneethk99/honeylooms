'use client'
import { RotateCcw } from 'lucide-react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import React from 'react'

export function ClearFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hasActiveFilters =
    searchParams.has('category') || searchParams.has('collection') || searchParams.has('q')

  if (!hasActiveFilters) return null

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('collection')
    params.delete('q')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <button
      type="button"
      onClick={handleClear}
      title="Reset filters"
      className="absolute -top-10 right-0 z-20 inline-flex h-8 cursor-pointer items-center gap-2 border border-neutral-200 bg-background/95 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600 shadow-[0_5px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-colors duration-200 hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800 md:right-4 md:top-5 md:h-auto md:border-0 md:bg-transparent md:p-0 md:text-[8px] md:font-normal md:tracking-[0.16em] md:text-white/60 md:shadow-none md:hover:bg-transparent md:hover:text-white dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-900 dark:hover:text-white dark:focus-visible:outline-neutral-200"
    >
      <RotateCcw aria-hidden="true" className="size-3" strokeWidth={1.8} />
      <span>Reset</span>
    </button>
  )
}
