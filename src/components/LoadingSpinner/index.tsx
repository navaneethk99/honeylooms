import React from 'react'
import { cn } from '@/utilities/cn'
import { VariantProps, cva } from 'class-variance-authority'
import { LottieLoader } from '@/components/LottieLoader'

const spinnerVariants = cva('flex-col items-center justify-center gap-2', {
  variants: {
    show: {
      true: 'flex',
      false: 'hidden',
    },
  },
  defaultVariants: {
    show: true,
  },
})

interface SpinnerContentProps extends VariantProps<typeof spinnerVariants> {
  size?: 'small' | 'medium' | 'large'
  className?: string
  children?: React.ReactNode
}

export function LoadingSpinner({ size, show, children, className }: SpinnerContentProps) {
  const sizeMap: Record<'small' | 'medium' | 'large', 'sm' | 'md' | 'lg'> = {
    small: 'sm',
    medium: 'md',
    large: 'lg',
  }

  const mappedSize = sizeMap[size || 'medium']

  return (
    <span className={spinnerVariants({ show })}>
      <LottieLoader size={mappedSize} className={className} />
      {children}
    </span>
  )
}

