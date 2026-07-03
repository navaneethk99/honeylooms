'use client'
import React, { useCallback, useMemo } from 'react'

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

    const newParams = params.toString()

    router.push(pathname + '?' + newParams)
  }, [collection.id, isActive, pathname, router, searchParams])

  return (
    <button
      onClick={() => setQuery()}
      className={clsx('hover:cursor-pointer', {
        'underline': isActive,
      })}
    >
      {collection.title}
    </button>
  )
}
