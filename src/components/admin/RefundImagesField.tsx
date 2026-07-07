'use client'

import React, { useEffect, useState } from 'react'
import { useFormFields } from '@payloadcms/ui'

type MediaDoc = {
  id: string | number
  url?: string
  alt?: string
}

export const RefundImagesField: React.FC = () => {
  const images = useFormFields(([fields]) => fields['images']?.value as (string | number | MediaDoc)[] | undefined)
  const [mediaDocs, setMediaDocs] = useState<MediaDoc[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!images || images.length === 0) {
      setMediaDocs([])
      return
    }

    const idsToFetch: (string | number)[] = []
    const resolvedDocs: MediaDoc[] = []

    images.forEach((img) => {
      if (typeof img === 'object' && img !== null && 'url' in img) {
        resolvedDocs.push(img as MediaDoc)
      } else if (typeof img === 'string' || typeof img === 'number') {
        idsToFetch.push(img)
      }
    })

    if (idsToFetch.length === 0) {
      setMediaDocs(resolvedDocs)
      return
    }

    setLoading(true)
    const query = idsToFetch.map((id) => `where[id][in]=${id}`).join('&')
    fetch(`/api/media?limit=0&${query}`)
      .then((res) => res.json())
      .then((data) => {
        const docs = data?.docs || []
        setMediaDocs([...resolvedDocs, ...docs])
      })
      .catch((err) => console.error('Error fetching media:', err))
      .finally(() => setLoading(false))
  }, [images])

  if (!images || images.length === 0) {
    return (
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--theme-text)',
            opacity: 0.65,
            marginBottom: '8px',
          }}
        >
          Product Images Preview
        </label>
        <span style={{ fontSize: '13px', color: 'var(--theme-text)', opacity: 0.45, fontStyle: 'italic' }}>
          No images uploaded for this refund request.
        </span>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--theme-text)',
          opacity: 0.65,
          marginBottom: '8px',
        }}
      >
        Product Images Preview
      </label>

      {loading ? (
        <span style={{ fontSize: '12px', color: 'var(--theme-text)', opacity: 0.5 }}>Loading previews...</span>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {mediaDocs.map((doc) => {
            if (!doc.url) return null
            return (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  border: '1px solid var(--theme-border-color)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  width: '120px',
                  height: '120px',
                  background: 'var(--theme-input-bg)',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.url}
                  alt={doc.alt || 'Product Image'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
