import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Instagram, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ProfileViewTracker } from '@/components/booking/ProfileViewTracker'

interface PublicProfileProps {
  params: Promise<{
    username: string
  }>
}

export default async function PublicProfilePage({ params }: PublicProfileProps) {
  const { username } = await params
  const supabase = await createClient()

  // Fetch influencer profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, bio, profile_photo_url, instagram_handle, tiktok_handle, twitter_handle, is_onboarded')
    .eq('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  // Check if influencer is onboarded (can accept payments)
  const isAcceptingPayments = profile.is_onboarded === true

  // Fetch active packages for this influencer
  const { data: packages, error: packagesError } = await supabase
    .from('packages')
    .select('*')
    .eq('influencer_id', profile.id)
    .eq('is_active', true)
    // Order by price ascending
    .order('price', { ascending: true })

  if (packagesError) {
    console.error('Failed to fetch packages:', packagesError)
  }

  return (
    <div className="min-h-screen bg-surface-light font-sans text-text-primary selection:bg-brand-success/20">
      <ProfileViewTracker profileId={profile.id} />
      {/* Cover / Banner Area */}
      <div className="h-48 sm:h-64 w-full bg-brand-secondary relative overflow-hidden">
        {/* Subtle decorative mesh in banner */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-[-50%] left-[20%] w-[50%] h-[150%] rounded-full bg-brand-success blur-[100px] mix-blend-screen opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[150%] rounded-full bg-brand-accent blur-[100px] mix-blend-screen opacity-50" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-20 relative z-10">
        {/* Profile Header */}
        <div className="bg-surface-card rounded-2xl border border-border p-8 text-center space-y-6 mb-12 shadow-[0_1px_3px_rgba(0,0,0,0.06)] relative">
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 h-28 w-28 rounded-2xl border-2 border-border overflow-hidden bg-surface-light flex items-center justify-center">
            {profile.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_photo_url} alt={profile.full_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-text-muted text-5xl font-bold">
                {profile.full_name.charAt(0)}
              </span>
            )}
          </div>
          
          <div className="pt-12">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary tracking-tight">{profile.full_name}</h1>
            <p className="text-text-secondary mt-1 text-lg font-medium">@{username}</p>
          </div>
          
          {profile.bio && (
            <p className="max-w-2xl mx-auto text-base text-text-secondary leading-relaxed">
              {profile.bio}
            </p>
          )}
          
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {profile.instagram_handle && (
               <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-light border border-border text-sm font-medium text-text-secondary hover:text-brand-success hover:border-brand-success/30 transition-colors">
                 <Instagram className="h-4 w-4" />
                 <a href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                   {profile.instagram_handle}
                 </a>
               </div>
             )}
            {profile.tiktok_handle && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-light border border-border text-sm font-medium text-text-secondary hover:text-brand-success hover:border-brand-success/30 transition-colors">
                  <span className="font-bold text-xs uppercase tracking-wider">TikTok:</span>
                  <a href={`https://tiktok.com/@${profile.tiktok_handle}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {profile.tiktok_handle}
                  </a>
                </div>
              )}
            {profile.twitter_handle && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-light border border-border text-sm font-medium text-text-secondary hover:text-brand-success hover:border-brand-success/30 transition-colors">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <a href={`https://x.com/${profile.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {profile.twitter_handle}
                  </a>
                </div>
              )}
          </div>
        </div>

        {/* Packages Grid */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-text-primary tracking-tight">Available <span className="text-brand-success">Packages</span></h2>
          
          {!isAcceptingPayments && (
            <div className="text-center p-6 bg-warning/10 border border-warning/20 rounded-2xl mb-8">
              <p className="text-warning font-medium">This creator is not currently accepting new bookings.</p>
            </div>
          )}
          
          {packages && packages.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2">
              {packages.map((pkg) => (
                <div key={pkg.id} className="flex flex-col h-full bg-brand-success rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(15,100,67,0.25)] hover:-translate-y-1 transition-all overflow-hidden group">
                  <div className="p-8 pb-0">
                    <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">{pkg.title}</h3>
                    <div className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-wider">
                       <Clock className="h-3.5 w-3.5" /> {pkg.delivery_days} Days Delivery
                    </div>
                  </div>
                  
                  <div className="p-8 pt-6 flex-1">
                    <p className="text-white/80 line-clamp-3 leading-relaxed text-sm">
                      {pkg.description || 'Dedicated quality content creation and distribution across social channels.'}
                    </p>
                    <div className="mt-8 flex items-baseline gap-1">
                      <span className="text-sm font-bold text-white/60">GHS</span>
                      <span className="text-4xl font-display font-bold text-white">
                        {(pkg.price / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8 pt-0">
                    {isAcceptingPayments ? (
                      <Button asChild className="w-full h-12 rounded-xl font-bold text-base bg-white text-brand-success hover:bg-white/90 shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
                        <Link href={`/book/${username}/${pkg.id}`} className="block">
                          Book Now
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full h-12 rounded-xl bg-white/10 border-white/20 text-white/60 font-bold text-base cursor-not-allowed" disabled>
                        Unavailable
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center p-12 bg-surface-card rounded-2xl border border-dashed border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
               <p className="text-text-secondary text-lg">This creator has no active packages available.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
