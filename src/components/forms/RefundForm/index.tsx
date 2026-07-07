'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormItem } from '@/components/forms/FormItem'
import { toast } from 'sonner'
import { X, Upload, CheckCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  orderId: string
  customerEmail: string
  customerPhone: string
  accessToken?: string
  email?: string
}

export const RefundForm: React.FC<Props> = ({
  orderId,
  customerEmail,
  customerPhone,
  accessToken,
  email,
}) => {
  const router = useRouter()
  const [reason, setReason] = useState('size_issue')
  const [resolution, setResolution] = useState('original_payment')
  const [contactEmail, setContactEmail] = useState(customerEmail)
  const [contactPhone, setContactPhone] = useState(customerPhone)
  const [explanation, setExplanation] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      // Keep only images
      const validImages = filesArray.filter((file) => file.type.startsWith('image/'))
      setImageFiles((prev) => [...prev, ...validImages])
    }
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contactEmail.trim() || !contactPhone.trim() || !explanation.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (imageFiles.length < 3) {
      toast.error('Please upload at least 3 images of the product.')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('orderId', orderId)
      formData.append('reason', reason)
      formData.append('explanation', explanation)
      formData.append('contactEmail', contactEmail)
      formData.append('contactPhone', contactPhone)
      formData.append('resolution', resolution)
      if (email) formData.append('email', email)
      if (accessToken) formData.append('accessToken', accessToken)

      imageFiles.forEach((file) => {
        formData.append('images', file)
      })

      const res = await fetch('/api/refunds', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request')
      }

      setIsSuccess(true)
      toast.success('Return/refund request submitted successfully!')
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during submission.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800">
        <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Request Submitted</h2>
        <p className="text-sm text-neutral-500 max-w-md mb-6">
          Thank you. Your request for return/refund has been submitted. Our team will review it and
          contact you shortly.
        </p>
        <Button
          onClick={() => {
            router.push(
              `/orders/${orderId}${email ? `?email=${encodeURIComponent(email)}&accessToken=${encodeURIComponent(accessToken || '')}` : ''}`,
            )
            router.refresh()
          }}
        >
          Return to Order
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormItem>
          <Label htmlFor="contactEmail">Contact Email *</Label>
          <Input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </FormItem>
        <FormItem>
          <Label htmlFor="contactPhone">Contact Phone *</Label>
          <Input
            id="contactPhone"
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            required
            placeholder="Phone number"
          />
        </FormItem>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormItem>
          <Label htmlFor="reason">Reason for Return/Refund *</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger id="reason" className="w-full">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="size_issue">Size Issue</SelectItem>
              <SelectItem value="manufacturing_defect">Manufacturing Defect</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>

        <FormItem>
          <Label htmlFor="resolution">Preferred Resolution *</Label>
          <Select value={resolution} onValueChange={setResolution}>
            <SelectTrigger id="resolution" className="w-full">
              <SelectValue placeholder="Select resolution option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original_payment">Refund to original payment method</SelectItem>
              <SelectItem value="replacement">Replacement</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      </div>

      <FormItem>
        <Label htmlFor="explanation">Detailed Explanation *</Label>
        <Textarea
          id="explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          required
          placeholder="Please explain the reason for the return or refund in detail..."
        />
      </FormItem>

      <FormItem>
        <Label>Attach Product Images * (At least 3 images required)</Label>
        <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-6 flex flex-col items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-300 relative group cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />
          <Upload className="w-8 h-8 text-neutral-400 mb-2 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-300" />
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Click to upload images
          </span>
          <span className="text-xs text-neutral-400 mt-1">
            Supports PNG, JPG, JPEG (Max 5MB per file)
          </span>
        </div>

        {imageFiles.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4">
            {imageFiles.map((file, idx) => {
              const url = URL.createObjectURL(file)
              return (
                <div
                  key={idx}
                  className="relative aspect-square border border-neutral-200 dark:border-neutral-800 rounded-md overflow-hidden bg-neutral-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onLoad={() => URL.revokeObjectURL(url)}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black text-white rounded-full transition-colors duration-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </FormItem>

      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </form>
  )
}
