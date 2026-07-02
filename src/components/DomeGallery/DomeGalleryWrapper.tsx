'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { DomeGalleryProps } from './index'

const DynamicDomeGallery = dynamic(
  () => import('./index').then((mod) => mod.DomeGallery),
  { ssr: false },
)

export function DomeGalleryWrapper(props: DomeGalleryProps) {
  return <DynamicDomeGallery {...props} />
}
