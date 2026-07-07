'use client'

import React, { useState, useEffect } from 'react'
import { Copy, Check, X } from 'lucide-react'
import { toast } from 'sonner'

// ==========================================
// CONFIGURATION: Set to false to disable this popup completely.
// ==========================================
export const ENABLE_PROMO_POPUP = true

export function PromoPopup() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isVisible, setIsVisible] = useState(false) // For smooth transition animations

  useEffect(() => {
    if (!ENABLE_PROMO_POPUP) return

    // Trigger popup after a small delay for a premium experience
    const timer = setTimeout(() => {
      setOpen(true)
      setTimeout(() => setIsVisible(true), 50)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (!ENABLE_PROMO_POPUP || !open) return null

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      setOpen(false)
    }, 300)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText('HONEY20')
      setCopied(true)
      toast.success("Promo code 'HONEY20' copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy code. Please copy it manually.')
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Editorial dark backdrop overlay */}
      <div
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-xs cursor-pointer transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal Container: Sharp, Minimalist, High-Fashion Design */}
      <div
        className={`relative w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none p-8 md:p-10 shadow-2xl z-10 transition-all duration-300 transform ${
          isVisible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors duration-200 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div className="flex flex-col items-start text-left space-y-6">
          {/* Category/Type header */}
          {/*<span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-semibold">
            Limited Time Offer
          </span>*/}

          <div className="space-y-2">
            {/* Main Headline */}
            <h2 className="text-2xl font-light tracking-tight text-neutral-950 dark:text-neutral-50 font-sans">
              We have something special for you!
            </h2>
            {/* Subtext */}
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
              Use code{' '}
              <strong className="font-semibold text-neutral-900 dark:text-white">HONEY20</strong> at
              checkout for an extra 20% discount on your order.
            </p>
          </div>

          {/* Minimal Code Display & Copy Box */}
          <div className="w-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between pl-4 pr-1 py-1 rounded-none">
            <span className="text-lg font-mono font-bold tracking-widest text-neutral-950 dark:text-white">
              HONEY20
            </span>
            <button
              onClick={copyToClipboard}
              className="bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-[10px] font-mono uppercase tracking-wider py-2.5 px-5 transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="w-full pt-4 flex flex-col gap-3">
            <button
              onClick={handleClose}
              className="w-full py-3.5 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-mono text-xs uppercase tracking-widest transition-colors duration-200 cursor-pointer active:scale-[0.99] shadow-sm"
            >
              Continue Shopping
            </button>
            {/*<button
              onClick={handleClose}
              className="w-full text-center text-[10px] font-mono uppercase tracking-widest text-neutral-400 hover:text-neutral-950 dark:text-neutral-500 dark:hover:text-white transition-colors duration-250 cursor-pointer"
            >
              Continue Browsing
            </button>*/}
          </div>
        </div>
      </div>
    </div>
  )
}
