'use client'

import { useState, useRef } from 'react'
import { createListing } from '@/lib/actions'
import Image from 'next/image'

const BRANDS = ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'IWC', 'Jaeger-LeCoultre', 'Vacheron Constantin', 'A. Lange & Söhne', 'Cartier', 'Breitling', 'Tudor', 'Tag Heuer', 'Zenith', 'Panerai', 'Hublot', 'Other']
const MOVEMENTS = ['Automatic', 'Manual', 'Quartz', 'Solar', 'Spring Drive']

export default function ListingForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
  }

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const res = await createListing(formData)
    if (res?.error) {
      setError(res.error)
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-12">
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
              placeholder="0"
              className="w-full border border-border bg-transparent pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
        </div>
      </fieldset>

      {/* Section: Images */}
      <fieldset className="space-y-6">
        <legend className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground border-b border-border w-full pb-3">
          Images
        </legend>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            name="images"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-border px-8 py-10 w-full text-center hover:border-foreground transition-colors group"
          >
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">
              Upload Images
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">JPG, PNG — up to 10 photos</p>
          </button>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square bg-muted overflow-hidden">
                  <Image src={src} alt={`Preview ${i + 1}`} fill className="object-cover" sizes="20vw" />
                </div>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background px-12 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {pending ? 'Publishing…' : 'Publish Listing'}
      </button>
    </form>
  )
}
