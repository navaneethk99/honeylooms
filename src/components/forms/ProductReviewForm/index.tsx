'use client'

import { ImagePlus, Star, X } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utilities/cn'

type Props = {
  accessToken?: string
  email?: string
  orderId: string
  productId: string
}

const MAX_IMAGES = 5

export function ProductReviewForm({ accessToken, email, orderId, productId }: Props) {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const previews = useMemo(() => images.map((file) => ({ file, url: URL.createObjectURL(file) })), [images])

  const addImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).filter(
      (file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024,
    )
    if (selected.length !== (event.target.files?.length || 0)) {
      toast.error('Only images under 5 MB can be attached.')
    }
    setImages((current) => [...current, ...selected].slice(0, MAX_IMAGES))
    event.target.value = ''
  }

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!rating || !review.trim()) {
      toast.error('Please select a star rating and write your review.')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('orderId', orderId)
      formData.append('productId', productId)
      formData.append('rating', String(rating))
      formData.append('review', review.trim())
      if (email) formData.append('email', email)
      if (accessToken) formData.append('accessToken', accessToken)
      images.forEach((image) => formData.append('images', image))

      const response = await fetch('/api/reviews', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to submit your review.')

      setIsComplete(true)
      toast.success('Thank you for reviewing this product!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit your review.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return <p className="text-sm text-[#38624a]">Thank you — your review has been submitted.</p>
  }

  return (
    <form onSubmit={submitReview} className="mt-5 border-t border-[#24231f]/15 pt-5">
      <p className="mb-3 text-sm font-medium text-[#24231f]">Review this product</p>
      <fieldset className="mb-4">
        <legend className="mb-2 text-xs text-[#6c675d]">Your rating</legend>
        <div className="flex gap-1" aria-label="Product rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
              aria-pressed={rating === star}
              onClick={() => setRating(star)}
              className="rounded p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a682f]"
            >
              <Star className={cn('size-6', star <= rating ? 'fill-[#c79b46] text-[#c79b46]' : 'text-[#b8b2a8]')} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mb-4">
        <Label htmlFor={`review-${productId}`} className="mb-2">Your review</Label>
        <Textarea
          id={`review-${productId}`}
          value={review}
          maxLength={2000}
          onChange={(event) => setReview(event.target.value)}
          placeholder="Tell us what you loved, how it fits, or anything other shoppers should know."
          required
        />
      </div>
      <div className="mb-5">
        <Label htmlFor={`review-images-${productId}`} className="mb-2">Add photos (optional, up to 5)</Label>
        <input
          id={`review-images-${productId}`}
          type="file"
          accept="image/*"
          multiple
          onChange={addImages}
          className="sr-only"
        />
        <label htmlFor={`review-images-${productId}`} className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#6c675d] underline underline-offset-4 hover:text-[#24231f]">
          <ImagePlus className="size-4" /> Choose images
        </label>
        {previews.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {previews.map(({ file, url }, index) => (
              <div key={`${file.name}-${index}`} className="relative size-16 overflow-hidden border border-[#24231f]/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Review upload preview" className="size-full object-cover" />
                <button type="button" onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} className="absolute right-0 top-0 bg-[#24231f] p-0.5 text-white" aria-label={`Remove ${file.name}`}>
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting review…' : 'Submit review'}</Button>
    </form>
  )
}
