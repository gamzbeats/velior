'use client'

import { useState, useRef } from 'react'
import { createListing, updateListing } from '@/lib/actions'
import Image from 'next/image'
import { X } from 'lucide-react'
import { type Listing } from '@/lib/types'

const BRANDS = ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'IWC', 'Jaeger-LeCoultre', 'Vacheron Constantin', 'A. Lange & Söhne', 'Cartier', 'Breitling', 'Tudor', 'Tag Heuer', 'Zenith', 'Panerai', 'Hublot', 'Other']
const MOVEMENTS = ['Automatic', 'Manual', 'Quartz', 'Solar', 'Spring Drive']

interface ListingFormProps {
  listing?: Listing
}

export default function ListingForm({ listing }: ListingFormProps) {
  const isEdit = !!listing
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // For edit mode: track which existing images to keep
  const [existingImages, setExistingImages] = useState<string[]>(listing?.images ?? [])
  // New files to upload
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalImages = existingImages.length + files.length

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? [])
    if (!newFiles.length) return
    const merged = [...files, ...newFiles].slice(0, 10 - existingImages.length)
    setFiles(merged)
    setPreviews(merged.map((f) => URL.createObjectURL(f)))
    e.target.value = ''
  }

  function removeNewImage(index: number) {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)))
  }

  function removeExistingImage(index: number) {
    setExistingImages(existingImages.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.delete('images')
    files.forEach((f) => formData.append('images', f))

    if (isEdit) {
      formData.set('existing_images', JSON.stringify(existingImages))
    }

    try {
      const action = isEdit
        ? () => updateListing(listing.id, formData)
        : () => createListing(formData)
      const res = await action()
      if (res?.error) {
        setError(res.error)
        setPending(false)
      }
    } catch (err: unknown) {
      if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) return
      setError('Something went wrong. Please try again.')
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {/* Section: Basics */}
      <fieldset className="space-y-6">
        <legend className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground border-b border-border w-full pb-3">
          Watch Details
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={listing?.title}
              placeholder="e.g. Rolex Submariner Date 116610LN"
              className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
              Brand *
            </label>
            <select
              name="brand"
              required
              defaultValue={listing?.brand ?? ''}
              className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors appearance-none cursor-pointer"
            >
              <option value="">Select brand…</option>
              {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
              Model *
            </label>
            <input
              type="text"
              name="model"
              required
              defaultValue={listing?.model}
              placeholder="e.g. Submariner Date"
              className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
              Reference Number
            </label>
            <input
              type="text"
              name="reference_number"
              defaultValue={listing?.reference_number ?? ''}
              placeholder="e.g. 116610LN"
              className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
              Year
            </label>
            <input
              type="number"
              name="year"
              min="1900"
              max="2025"
              defaultValue={listing?.year ?? ''}
              placeholder="e.g. 2019"
              className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
              Movement
            </label>
            <select
              name="movement"
              defaultValue={listing?.movement ?? ''}
              className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors appearance-none cursor-pointer"
            >
              <option value="">Select…</option>
              {MOVEMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
              Case Size (mm)
            </label>
            <input
              type="text"
              name="case_size"
              defaultValue={listing?.case_size ?? ''}
              placeholder="e.g. 40"
              className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
              Condition *
            </label>
            <select
              name="condition"
              required
              defaultValue={listing?.condition ?? ''}
              className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors appearance-none cursor-pointer"
            >
              <option value="">Select condition…</option>
              <option value="mint">Mint — Unworn or pristine</option>
              <option value="excellent">Excellent — Minor wear only</option>
              <option value="good">Good — Normal wear</option>
              <option value="fair">Fair — Visible wear</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
            Description
          </label>
          <textarea
            name="description"
            rows={5}
            defaultValue={listing?.description ?? ''}
            placeholder="Describe the watch, its history, included papers, box…"
            className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
          />
        </div>
      </fieldset>

      {/* Section: Pricing */}
      <fieldset className="space-y-6">
        <legend className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground border-b border-border w-full pb-3">
          Pricing
        </legend>
        <div className="max-w-xs">
          <label className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground block mb-2">
            Asking Price (€) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
            <input
              type="number"
              name="price"
              required
              min="1"
              step="1"
              defaultValue={listing?.price ?? ''}
              placeholder="0"
              className="w-full border border-border bg-transparent pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
        </div>
      </fieldset>

      {/* Section: Images */}
      <fieldset className="space-y-6">
        <legend className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground border-b border-border w-full pb-3">
          Images {totalImages > 0 && <span className="text-foreground">({totalImages}/10)</span>}
        </legend>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="hidden"
        />

        {totalImages < 10 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-border px-8 py-10 w-full text-center hover:border-foreground transition-colors group"
          >
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">
              {totalImages === 0 ? 'Upload Images' : '+ Add More Photos'}
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              JPG, PNG — {totalImages}/10 photos
            </p>
          </button>
        )}

        {/* Existing images (edit mode) */}
        {existingImages.length > 0 && (
          <div>
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Current Photos</p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {existingImages.map((src, i) => (
                <div key={src} className="relative aspect-square bg-muted overflow-hidden group">
                  <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="20vw" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(i)}
                    className="absolute top-1 right-1 bg-foreground text-background rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New image previews */}
        {previews.length > 0 && (
          <div>
            {isEdit && <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">New Photos</p>}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square bg-muted overflow-hidden group">
                  <Image src={src} alt={`New photo ${i + 1}`} fill className="object-cover" sizes="20vw" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute top-1 right-1 bg-foreground text-background rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      {error && (
        <p className="text-sm text-destructive border border-destructive/30 px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background px-12 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {pending ? (isEdit ? 'Saving…' : 'Publishing…') : (isEdit ? 'Save Changes' : 'Publish Listing')}
      </button>
    </form>
  )
}
