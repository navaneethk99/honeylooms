'use client'

import type { SVG3DProps } from '3dsvg'
import dynamic from 'next/dynamic'

function SVG3DLoadingFallback() {
  return (
    <svg
      aria-hidden="true"
      className="size-[42px] shrink-0"
      fill="none"
      height="48"
      viewBox="0 0 48 48"
      width="48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m24 4 17.3 10v20L24 44 6.7 34V14L24 4Z" fill="#D9A322" />
      <path d="m24 12 10.4 6v12L24 36 13.6 30V18L24 12Z" fill="#FFF7E6" />
    </svg>
  )
}

export const SVG3D = dynamic<SVG3DProps>(
  () => import('3dsvg').then((module) => module.SVG3D),
  {
    loading: SVG3DLoadingFallback,
    ssr: false,
  },
)
