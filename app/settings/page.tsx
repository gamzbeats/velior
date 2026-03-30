import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProfileEditForm from '@/components/profile/ProfileEditForm'
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/')

  return (
    <>
      <Navbar user={user} />
      <main className="pt-16 min-h-screen">
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground mb-2">Account</p>
            <h1 className="font-display text-4xl font-light">Settings</h1>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
          <ProfileEditForm profile={profile} email={user.email ?? ''} />
        </div>
      </main>
      <Footer />
    </>
  )
}
