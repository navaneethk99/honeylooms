'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

type Review = {
  createdAt: string
  customerEmail: string
  id: number
  rating: number
  review: string
}

export const ProductReviewsManager: React.FC = () => {
  const { id: documentID } = useDocumentInfo()
  const productID = typeof documentID === 'number' ? documentID : Number(documentID)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingID, setDeletingID] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isInteger(productID) || productID < 1) return

    const controller = new AbortController()
    fetch(`/api/reviews?limit=100&sort=-createdAt&where[product][equals]=${productID}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load reviews.')
        return response.json()
      })
      .then((data) => setReviews(data.docs || []))
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') {
          console.error(loadError)
          setError('Unable to load product reviews.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [productID])

  const deleteReview = async (reviewID: number) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return

    setDeletingID(reviewID)
    setError(null)
    try {
      const response = await fetch(`/api/reviews/${reviewID}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Unable to delete review.')
      setReviews((current) => current.filter((review) => review.id !== reviewID))
    } catch (deleteError) {
      console.error(deleteError)
      setError('Unable to delete the review. Please try again.')
    } finally {
      setDeletingID(null)
    }
  }

  if (!Number.isInteger(productID) || productID < 1) {
    return <p style={{ opacity: 0.55 }}>Save this product before managing its reviews.</p>
  }

  return (
    <div style={{ marginTop: '24px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '10px', opacity: 0.65, textTransform: 'uppercase' }}>
        Product reviews
      </label>
      {error ? <p style={{ color: 'var(--theme-error-500)', fontSize: '13px' }}>{error}</p> : null}
      {loading ? <p style={{ fontSize: '13px', opacity: 0.55 }}>Loading reviews…</p> : null}
      {!loading && !reviews.length ? <p style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.55 }}>No reviews yet.</p> : null}
      {!loading && reviews.length ? (
        <div style={{ display: 'grid', gap: '10px' }}>
          {reviews.map((review) => (
            <article key={review.id} style={{ background: 'var(--theme-input-bg)', border: '1px solid var(--theme-border-color)', borderRadius: '4px', padding: '12px' }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                <strong>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</strong>
                <button type="button" onClick={() => void deleteReview(review.id)} disabled={deletingID === review.id} style={{ background: 'transparent', border: '1px solid #d92d20', borderRadius: '4px', color: '#d92d20', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '6px 10px' }}>
                  {deletingID === review.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.5, margin: '10px 0 6px' }}>{review.review}</p>
              <small style={{ opacity: 0.55 }}>{review.customerEmail} · {new Date(review.createdAt).toLocaleDateString()}</small>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}
