'use client'
import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export const PrintInvoiceButton: React.FC = () => {
  const { id: docId } = useDocumentInfo()
  const [printing, setPrinting] = useState(false)

  // Get order ID from document info or URL fallback
  const orderId = docId || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '')

  // If we are creating a new order (no ID), do not render the print button
  if (!orderId || orderId === 'create') {
    return null
  }

  const handlePrint = async () => {
    setPrinting(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`)
      if (!response.ok) {
        throw new Error('Failed to fetch invoice PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      // Create a hidden iframe to trigger the browser's native print dialog
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.src = url

      document.body.appendChild(iframe)

      iframe.onload = () => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        
        // Clean up after print dialog closes
        setTimeout(() => {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(url)
        }, 1000)
      }
    } catch (err) {
      console.error('Error printing invoice:', err)
      alert('Error printing invoice. Please try again.')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div style={{ marginBottom: '20px', marginTop: '10px' }}>
      <button
        type="button"
        onClick={handlePrint}
        disabled={printing}
        style={{
          backgroundColor: '#141414',
          color: '#ffffff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          fontSize: '13px',
          fontWeight: 'bold',
          cursor: printing ? 'not-allowed' : 'pointer',
          opacity: printing ? 0.7 : 1,
          transition: 'background-color 0.2s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {printing ? (
          <>
            <svg
              style={{
                animation: 'spin-loading 1s linear infinite',
                width: '14px',
                height: '14px',
              }}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                style={{ opacity: 0.25 }}
              />
              <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating PDF...
          </>
        ) : (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print Invoice
          </>
        )}
      </button>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-loading {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  )
}
