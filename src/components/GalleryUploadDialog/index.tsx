'use client'

import { CheckCircle2, ImagePlus, Upload, X } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ProductOption = {
  id: number
  title: string
}

type Props = {
  products: ProductOption[]
}

const MAX_FILES = 10

export const GalleryUploadDialog: React.FC<Props> = ({ products }) => {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [product, setProduct] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const resetForm = () => {
    setName('')
    setProduct('')
    setFiles([])
    setIsSuccess(false)
    setSubmitError('')
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) resetForm()
  }

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).filter((file) => /^(image|video)\//.test(file.type))
    const nextFiles = [...files, ...selected].slice(0, MAX_FILES)

    if (selected.length !== event.target.files?.length) {
      toast.error('Only image and video files can be added.')
    }
    if (files.length + selected.length > MAX_FILES) {
      toast.error(`You can upload up to ${MAX_FILES} files at once.`)
    }

    setFiles(nextFiles)
    event.target.value = ''
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim() || !product || files.length === 0) {
      const error = 'Add your name, the item you purchased, and at least one file.'
      setSubmitError(error)
      toast.error(error)
      return
    }

    setSubmitError('')
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('product', product)
      files.forEach((file) => formData.append('files', file))

      const response = await fetch('/api/gallery', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send your submission.')

      setIsSuccess(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send your submission.'
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-auto rounded-none bg-neutral-900 px-7 py-4 font-mono text-xs tracking-widest text-white uppercase hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200">
          <ImagePlus className="size-4" />
          Upload your images
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-none border-neutral-200 bg-background p-7 text-foreground dark:border-neutral-800">
        {isSuccess ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
            <CheckCircle2 className="size-12 text-emerald-600" />
            <DialogTitle>Thank you for sharing.</DialogTitle>
            <DialogDescription className="max-w-sm text-neutral-500 dark:text-neutral-400">
              Your submission is with our team for review. Approved images and videos will appear in
              the gallery.
            </DialogDescription>
            <Button className="mt-2 rounded-none" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold tracking-tight">Share your Honeylooms</DialogTitle>
              <DialogDescription className="leading-relaxed text-neutral-500 dark:text-neutral-400">
                Show us how you wear your piece. Every submission is reviewed before it is published.
              </DialogDescription>
            </DialogHeader>
            <form className="mt-2 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="gallery-name">Your name</Label>
                <Input
                  id="gallery-name"
                  maxLength={100}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                  value={name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gallery-product">Item purchased</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:bg-neutral-950"
                  id="gallery-product"
                  onChange={(event) => setProduct(event.target.value)}
                  required
                  value={product}
                >
                  <option value="">Select your item</option>
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gallery-files">Images or videos</Label>
                <label
                  className="flex cursor-pointer flex-col items-center gap-2 border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                  htmlFor="gallery-files"
                >
                  <Upload className="size-5 text-neutral-500 dark:text-neutral-400" />
                  <span className="text-sm font-medium">Choose files</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Images or videos, up to 50 MB each
                  </span>
                </label>
                <Input
                  className="sr-only"
                  id="gallery-files"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFiles}
                  type="file"
                />
                {files.length > 0 && (
                  <ul className="max-h-32 space-y-1 overflow-y-auto border border-neutral-200 p-2 text-sm dark:border-neutral-800">
                    {files.map((file, index) => (
                      <li className="flex items-center justify-between gap-3" key={`${file.name}-${index}`}>
                        <span className="truncate">{file.name}</span>
                        <button
                          aria-label={`Remove ${file.name}`}
                          className="shrink-0 p-1 text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50"
                          onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                          type="button"
                        >
                          <X className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button className="w-full rounded-none" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Sending...' : 'Send for review'}
              </Button>
              {submitError && <p className="text-center text-sm text-destructive">{submitError}</p>}
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
