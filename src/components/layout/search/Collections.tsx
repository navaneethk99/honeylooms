import configPromise from '@payload-config'
import { getPayload } from 'payload'
import clsx from 'clsx'
import React, { Suspense } from 'react'

import { CollectionItem } from './Collections.client'

async function CollectionList() {
  const payload = await getPayload({ config: configPromise })

  const collections = await payload.find({
    collection: 'collections',
    sort: 'title',
  })

  return (
    <div>
      <h3 className="text-xs mb-2 text-neutral-500 dark:text-neutral-400">Collection</h3>

      <ul>
        {collections.docs.map((collection) => {
          return (
            <li key={collection.id}>
              <CollectionItem collection={collection} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const skeleton = 'mb-3 h-4 w-5/6 animate-pulse rounded'
const activeAndTitles = 'bg-neutral-800 dark:bg-neutral-300'
const items = 'bg-neutral-400 dark:bg-neutral-700'

export function Collections() {
  return (
    <Suspense
      fallback={
        <div className="col-span-2 hidden h-[200px] w-full flex-none py-4 lg:block">
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
        </div>
      }
    >
      <CollectionList />
    </Suspense>
  )
}
