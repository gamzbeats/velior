'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  })

  if (error) return { error: error.message }

  return { success: 'Check your email for a magic link.' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

// ─── Listings ────────────────────────────────────────────────────────────────

export async function createListing(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to create a listing.' }

  const images: string[] = []
  const imageFiles = formData.getAll('images') as File[]

  for (const file of imageFiles) {
    if (!file || file.size === 0) continue
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(path, file)
    if (!uploadError) {
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
      images.push(data.publicUrl)
    }
  }

  const { error } = await supabase.from('listings').insert({
    seller_id: user.id,
    title: formData.get('title') as string,
    brand: formData.get('brand') as string,
    model: formData.get('model') as string,
    price: parseFloat(formData.get('price') as string),
    condition: formData.get('condition') as string,
    description: formData.get('description') as string,
    year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
    reference_number: (formData.get('reference_number') as string) || null,
    movement: (formData.get('movement') as string) || null,
    case_size: (formData.get('case_size') as string) || null,
    images,
    status: 'active',
  })

  if (error) return { error: error.message }

  revalidatePath('/listings')
  redirect('/listings')
}

export async function sendMessage(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from('messages').insert({
    listing_id: formData.get('listing_id') as string,
    recipient_id: formData.get('recipient_id') as string,
    content: formData.get('content') as string,
    sender_name: (formData.get('sender_name') as string) || null,
    sender_email: (formData.get('sender_email') as string) || null,
  })

  if (error) return { error: error.message }

  return { success: 'Your message has been sent to the seller.' }
}
