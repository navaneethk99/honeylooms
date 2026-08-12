import clsx from 'clsx'
import { cacheLife, cacheTag } from 'next/cache'
import React, { Suspense } from 'react'

import { CategoryItem, CategorySelect } from './Categories.client'

async function CategoryList() {
  'use cache'
  cacheLife('days')
  cacheTag('categories')

  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    sort: 'title',
  })

  return (
    <div>
      <h3 className="mb-2 text-xs text-neutral-500 md:mb-3 md:font-mono md:text-[9px] md:font-medium md:uppercase md:tracking-[0.18em] md:text-[#777166] dark:text-neutral-400">
        Categories
      </h3>

      <ul className="hidden md:flex md:flex-col md:gap-0.5">
        {categories.docs.map((category) => {
          return (
            <li key={category.id}>
              <CategoryItem category={category} />
            </li>
          )
        })}
      </ul>

      <div className="block md:hidden">
        <CategorySelect categories={categories.docs} />
      </div>
    </div>
  )
}

const skeleton = 'mb-3 h-4 w-5/6 animate-pulse rounded'
const activeAndTitles = 'bg-neutral-800 dark:bg-neutral-300'
const items = 'bg-neutral-400 dark:bg-neutral-700'

export function Categories() {
  return (
    <Suspense
      fallback={
        <div className="col-span-2 hidden h-[400px] w-full flex-none py-4 lg:block">
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
        </div>
      }
    >
      <CategoryList />
    </Suspense>
  )
}
