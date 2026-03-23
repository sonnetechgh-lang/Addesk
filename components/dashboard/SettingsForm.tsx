'use client'

import { useState, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2, User, Wallet, CheckCircle2, ShieldCheck, Camera, Trash2 } from 'lucide-react'

import { updateProfileSettings, updatePayoutSettings, uploadProfilePhoto, deleteProfilePhoto } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  instagramHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  twitterHandle: z.string().optional(),
})

const payoutSchema = z.object({
  bankCode: z.string().min(3, 'Bank code is required'),
  accountNumber: z.string().min(10, 'Account number is too short'),
  accountName: z.string().min(2, 'Account name is required'),
})

interface SettingsFormProps {
  initialProfile: any
}

export function SettingsForm({ initialProfile }: SettingsFormProps) {
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isPayoutLoading, setIsPayoutLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [payoutSuccess, setPayoutSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [payoutError, setPayoutError] = useState<string | null>(null)

  // Photo upload state
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialProfile?.profile_photo_url || null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoDeleting, setPhotoDeleting] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleDeletePhoto() {
    setPhotoDeleting(true)
    setPhotoError(null)
    try {
      const result = await deleteProfilePhoto()
      if (result.error) {
        setPhotoError(result.error)
      } else {
        setPhotoUrl(null)
      }
    } catch {
      setPhotoError('Failed to remove photo.')
    } finally {
      setPhotoDeleting(false)
    }
  }

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialProfile?.full_name || '',
      username: initialProfile?.username || '',
      bio: initialProfile?.bio || '',
      instagramHandle: initialProfile?.instagram_handle || '',
      tiktokHandle: initialProfile?.tiktok_handle || '',
      twitterHandle: initialProfile?.twitter_handle || '',
    },
  })

  const payoutForm = useForm<z.infer<typeof payoutSchema>>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      bankCode: '', // We don't have the existing bank code easily available from the profile unless we fetch it from Paystack
      accountNumber: '',
      accountName: '',
    },
  })

  async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    setIsProfileLoading(true)
    setProfileSuccess(false)
    setProfileError(null)
    
    try {
      const formData = new FormData()
      formData.append('fullName', values.fullName)
      formData.append('username', values.username)
      if (values.bio) formData.append('bio', values.bio)
      if (values.instagramHandle) formData.append('instagramHandle', values.instagramHandle)
      if (values.tiktokHandle) formData.append('tiktokHandle', values.tiktokHandle)
      if (values.twitterHandle) formData.append('twitterHandle', values.twitterHandle)

      const result = await updateProfileSettings(formData)
      
      if (result.error) {
        setProfileError(result.error)
      } else {
        setProfileSuccess(true)
        setTimeout(() => setProfileSuccess(false), 5000)
      }
    } catch (err: any) {
      setProfileError('An unexpected error occurred.')
    } finally {
      setIsProfileLoading(false)
    }
  }

  async function onPayoutSubmit(values: z.infer<typeof payoutSchema>) {
    setIsPayoutLoading(true)
    setPayoutSuccess(false)
    setPayoutError(null)
    
    try {
      const result = await updatePayoutSettings(values)
      
      if (result.error) {
        setPayoutError(result.error)
      } else {
        setPayoutSuccess(true)
        setTimeout(() => setPayoutSuccess(false), 5000)
      }
    } catch (err: any) {
      setPayoutError('An unexpected error occurred.')
    } finally {
      setIsPayoutLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      {/* Profile Section */}
      <section className="bg-surface-card rounded-2xl border border-border p-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 text-border/30">
          <User className="h-20 w-20" />
        </div>
        
        <div className="relative z-10">
          <h3 className="text-lg font-bold text-text-primary mb-1.5">Profile Information</h3>
          <p className="text-text-secondary text-[14px] mb-7">This information is visible on your public booking page.</p>

          {/* Photo Upload */}
          <div className="flex items-center gap-5 mb-8 pb-7 border-b border-border">
            <div className="relative group">
              <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-border bg-surface-light flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-text-muted">
                    {initialProfile?.full_name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg bg-brand-success text-white flex items-center justify-center shadow-[0_2px_8px_rgba(15,100,67,0.4)] hover:bg-brand-success/90 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-text-primary">Profile Photo</p>
              <p className="text-[12px] text-text-muted mt-0.5">JPEG, PNG, WebP or GIF. Max 2MB.</p>
              {photoError && (
                <p className="text-[12px] text-error font-medium mt-1">{photoError}</p>
              )}
              {photoUploading && (
                <p className="text-[12px] text-brand-success font-medium mt-1 flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                </p>
              )}
              {photoDeleting && (
                <p className="text-[12px] text-error font-medium mt-1 flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Removing...
                </p>
              )}
              {photoUrl && !photoUploading && !photoDeleting && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-error hover:text-error/80 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove photo
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setPhotoUploading(true)
                setPhotoError(null)
                const fd = new FormData()
                fd.append('photo', file)
                const result = await uploadProfilePhoto(fd)
                if (result.error) {
                  setPhotoError(result.error)
                } else if (result.url) {
                  setPhotoUrl(result.url)
                }
                setPhotoUploading(false)
                e.target.value = '' // reset file input
              }}
            />
          </div>
          
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-text-muted uppercase tracking-wider">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Kwame Nkrumah" className="h-12 bg-surface-light border-border/60" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-text-muted uppercase tracking-wider">Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm border-r pr-3 border-border/60">@</span>
                          <Input className="h-12 pl-10 bg-surface-light border-border/60" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-text-muted uppercase tracking-wider">Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell brands about yourself..." className="min-h-[120px] bg-surface-light border-border/60 resize-none pt-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h4 className="text-[14px] font-bold text-text-primary">Social Media Handles</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="instagramHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder="@" className="bg-surface-light border-border/60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="tiktokHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-text-muted uppercase tracking-wider">TikTok</FormLabel>
                        <FormControl>
                          <Input placeholder="@" className="bg-surface-light border-border/60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="twitterHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-text-muted uppercase tracking-wider">X (Twitter)</FormLabel>
                        <FormControl>
                          <Input placeholder="@" className="bg-surface-light border-border/60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {profileError && (
                <div className="flex items-start gap-2.5 p-3.5 bg-error/8 border border-error/20 rounded-xl text-error text-[13px] font-medium">
                  <span className="mt-0.5">⚠</span>{profileError}
                </div>
              )}
              
              <div className="pt-4 flex items-center gap-4">
                <Button type="submit" disabled={isProfileLoading} variant="success">
                  {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                {profileSuccess && (
                  <span className="text-success text-[13px] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Saved
                  </span>
                )}
              </div>
            </form>
          </Form>
        </div>
      </section>

      {/* Payout Section */}
      <section className="bg-surface-card rounded-2xl border border-border p-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 text-border/30">
          <Wallet className="h-20 w-20" />
        </div>

        <div className="relative z-10">
          <h3 className="text-lg font-bold text-text-primary mb-1.5">Payout Details</h3>
          <p className="text-text-secondary text-[14px] mb-7">Your connected Paystack account for receiving payments. <br/><span className="text-[11px] text-text-muted">Current Subaccount: {initialProfile?.paystack_subaccount_code}</span></p>
          
          <Form {...payoutForm}>
            <form onSubmit={payoutForm.handleSubmit(onPayoutSubmit)} className="space-y-6 max-w-xl">
              <FormField
                control={payoutForm.control}
                name="bankCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-text-muted uppercase tracking-wider">Settlement Bank</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 044 (Access Bank), MTN (Mobile Money)" className="h-12 bg-surface-light border-border/60" {...field} />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      For Ghana Mobile Money, use <b>MTN</b>, <b>VOD</b>, or <b>TIGO</b>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={payoutForm.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-text-muted uppercase tracking-wider">Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="054XXXXXXX" className="h-12 bg-surface-light border-border/60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={payoutForm.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-text-muted uppercase tracking-wider">Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name on bank account" className="h-12 bg-surface-light border-border/60" {...field} />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Must match the name on your bank/mobile money account perfectly.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {payoutError && (
                <div className="flex items-start gap-2.5 p-3.5 bg-error/8 border border-error/20 rounded-xl text-error text-[13px] font-medium">
                  <span className="mt-0.5">⚠</span>{payoutError}
                </div>
              )}
              
              <div className="pt-4 flex items-center gap-4">
                <Button type="submit" disabled={isPayoutLoading} variant="default">
                  {isPayoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {initialProfile?.paystack_subaccount_code ? 'Update Payout Account' : 'Connect Payout Account'}
                </Button>
                {payoutSuccess && (
                  <span className="text-success text-[13px] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Account Updated
                  </span>
                )}
              </div>

              <p className="text-[11px] text-text-muted mt-3 flex items-center gap-2 leading-relaxed">
                <ShieldCheck className="h-3 w-3" /> Changes are synced immediately with Paystack. Payments for existing orders will be sent to the updated account on settlement.
              </p>
            </form>
          </Form>
        </div>
      </section>
    </div>
  )
}
