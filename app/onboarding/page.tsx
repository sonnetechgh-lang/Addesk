'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import { ProfileStep } from '@/components/onboarding/ProfileStep'
import { PackageStep } from '@/components/onboarding/PackageStep'
import { PayoutStep } from '@/components/onboarding/PayoutStep'

interface Profile {
  id: string
  full_name: string | null
  username: string | null
  bio: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  twitter_handle: string | null
  is_onboarded: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkStatus() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data?.is_onboarded) {
        // If they bypass middleware but are already onboarded, kick them to dashboard
        router.push('/dashboard')
        return
      }

      setProfile(data)
      setIsLoading(false)
    }

    checkStatus()
  }, [router])

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="w-full">
      <div className="mb-12 flex justify-between items-center max-w-md mx-auto gap-3">
         <div className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-brand-success' : 'bg-muted'}`} />
         <div className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-brand-success' : 'bg-muted'}`} />
         <div className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${step >= 3 ? 'bg-brand-success' : 'bg-muted'}`} />
      </div>

      {step === 1 && (
        <ProfileStep 
          initialData={profile} 
          onNext={() => setStep(2)} 
        />
      )}
      
      {step === 2 && (
        <PackageStep 
          onBack={() => setStep(1)} 
          onNext={() => setStep(3)} 
        />
      )}
      
      {step === 3 && (
        <PayoutStep 
          onBack={() => setStep(2)} 
        />
      )}
    </div>
  )
}
