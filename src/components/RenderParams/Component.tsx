'use client'

import { useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'
import { Info } from 'lucide-react'

import { Message } from '../Message'

const ACCOUNT_LOGIN_WARNING = 'Please login to access your account settings.'

export type Props = {
  className?: string
  message?: string
  onParams?: (paramValues: ((null | string | undefined) | string[])[]) => void
  params?: string[]
}

export const RenderParamsComponent: React.FC<Props> = ({
  className,
  onParams,
  params = ['error', 'warning', 'success', 'message'],
}) => {
  const searchParams = useSearchParams()
  const paramValues = params.map((param) => searchParams?.get(param))

  useEffect(() => {
    if (paramValues.length && onParams) {
      onParams(paramValues)
    }
  }, [paramValues, onParams])

  if (paramValues.length) {
    return (
      <div className={className}>
        {paramValues.map((paramValue, index) => {
          if (!paramValue) return null

          if (paramValue === ACCOUNT_LOGIN_WARNING) {
            return (
              <div
                className="mb-8 flex items-center gap-2 border-y border-[#24231f] bg-[#24231f] px-4 py-3 text-sm text-white"
                key={paramValue}
                role="status"
              >
                <Info aria-hidden="true" className="size-4 shrink-0 text-white/70" />
                <p className="font-medium tracking-[0.01em]">{paramValue}</p>
              </div>
            )
          }

          return (
            <Message
              className="mb-8"
              key={paramValue}
              {...{
                [params[index]]: paramValue,
              }}
            />
          )
        })}
      </div>
    )
  }

  return null
}
