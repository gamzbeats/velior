'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { updateProfile } from '@/lib/actions'
import { type Profile } from '@/lib/types'

export default function ProfileEditForm({ profile, email }: { profile: Profile; email: string }) {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(false)
    const res = await updateProfile(new FormData(e.currentTarget))
    if (res?.error) { setError(res.error); setPending(false) }
    else { setSuccess(true); setPending(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-xl">
      {/* Avatar */}
      <div>
        <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">Photo</p>
        <div className="flex items-center gap-6">
          <div className="relative w-16 h-16 bg-muted overflow-hidden shrink-0">
            {avatarPreview ? (
              <Image src={avatarPreview} alt="Avatar" fill className="object-cover" sizes="64px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-lg font-medium text-muted-foreground">
                {(profile.full_name ?? email)[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs font-medium tracking-[0.15em] uppercase border border-border px-4 py-2 hover:bg-muted transition-colors"
          >
            Change photo
          </button>
          <input ref={fileRef} type="file" name="avatar" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-5">
        <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">Personal info</p>

        {[
          { name: 'full_name', label: 'Full name', defaultValue: profile.full_name ?? '', type: 'text' },
          { name: 'username', label: 'Username', defaultValue: profile.username ?? '', type: 'text' },
          { name: 'location', label: 'Location', defaultValue: profile.location ?? '', type: 'text' },
          { name: 'phone', label: 'Phone', defaultValue: profile.phone ?? '', type: 'tel' },
        ].map((field) => (
          <div key={field.name}>
            <label className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground block mb-2">
              {field.label}
            </label>
            <input
              type={field.type}
              name={field.name}
              defaultValue={field.defaultValue}
              className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
        ))}

        <div>
          <label className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground block mb-2">Bio</label>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ''}
            rows={4}
            className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
            placeholder="A few words about yourself…"
          />
        </div>
      </div>

      {/* Email (read-only) */}
      <div>
        <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-2">Email</p>
        <p className="text-sm text-muted-foreground px-4 py-3 border border-border/50 bg-muted/30">{email}</p>
        <p className="text-[10px] text-muted-foreground mt-1">To change your email, contact support.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">Profile updated successfully.</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
