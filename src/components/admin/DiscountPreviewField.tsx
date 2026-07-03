'use client'

import React, { useMemo } from 'react'
import { useFormFields } from '@payloadcms/ui'

/**
 * DiscountPreviewField — a custom UI field for the Products admin panel.
 *
 * Watches `priceInUSD` (original price) and `salePrice` in real-time via
 * Payload's `useFormFields` hook and calculates the discount percentage
 * immediately, without requiring the admin to save the document first.
 *
 * Prices are stored as integers (base units with 2 decimals), e.g. 10000 = ₹100.00.
 */
export const DiscountPreviewField: React.FC = () => {
  // Watch the three relevant fields live
  const priceInUSD = useFormFields(([fields]) => fields['priceInUSD']?.value as number | undefined)
  const salePrice = useFormFields(([fields]) => fields['salePrice']?.value as number | undefined)
  const onSale = useFormFields(([fields]) => fields['onSale']?.value as boolean | undefined)

  const discountPct = useMemo(() => {
    if (!onSale || !priceInUSD || !salePrice) return null
    const original = Number(priceInUSD)
    const sale = Number(salePrice)
    if (original <= 0 || sale >= original) return null
    return Math.round(((original - sale) / original) * 100)
  }, [onSale, priceInUSD, salePrice])

  // Only render when the product is on sale
  if (!onSale) return null

  return (
    <div
      style={{
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <label
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--theme-text)',
          opacity: 0.65,
          marginBottom: '2px',
        }}
      >
        Discount Percentage (%)
      </label>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          borderRadius: '4px',
          border: '1px solid var(--theme-border-color)',
          background: 'var(--theme-input-bg)',
          minHeight: '44px',
        }}
      >
        {discountPct !== null ? (
          <>
            {/* Badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: '99px',
                background: 'rgba(220, 38, 38, 0.12)',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '14px',
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.02em',
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              -{discountPct}% OFF
            </span>

            {/* Helper text */}
            <span
              style={{
                fontSize: '12px',
                color: 'var(--theme-text)',
                opacity: 0.5,
              }}
            >
              calculated automatically
            </span>
          </>
        ) : (
          <span
            style={{
              fontSize: '13px',
              color: 'var(--theme-text)',
              opacity: 0.4,
              fontStyle: 'italic',
            }}
          >
            Enter a sale price lower than the original price to see the discount
          </span>
        )}
      </div>

      <p
        style={{
          fontSize: '11px',
          color: 'var(--theme-text)',
          opacity: 0.45,
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        This value is computed from the original price and sale price and saved automatically.
      </p>
    </div>
  )
}
