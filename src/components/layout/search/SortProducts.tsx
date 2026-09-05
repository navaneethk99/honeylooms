'use client'

import { sorting } from '@/lib/constants'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export function SortProducts() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const currentSort = searchParams.get('sort') || ''
  const selectedSort = sorting.some((item) => item.slug === currentSort) ? currentSort : ''

  return (
    <div className="flex items-center gap-3 text-sm">
      <label className="shrink-0 text-neutral-600" htmlFor="product-sort">
        Sort by
      </label>
      <select
        aria-busy={isPending}
        className="min-h-11 min-w-0 border border-neutral-300 bg-background px-3 py-2 text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
        disabled={isPending}
        id="product-sort"
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString())
          if (event.target.value) params.set('sort', event.target.value)
          else params.delete('sort')
          params.delete('page')
          const query = params.toString()
          startTransition(() => router.push(query ? `${pathname}?${query}` : pathname))
        }}
        value={selectedSort}
      >
        {sorting.map((item) => (
          <option key={item.slug || 'featured'} value={item.slug || ''}>
            {item.slug ? item.title : 'Featured'}
          </option>
        ))}
      </select>
      <span className="sr-only" role="status">
        {isPending ? 'Updating products…' : ''}
      </span>
    </div>
  )
}
