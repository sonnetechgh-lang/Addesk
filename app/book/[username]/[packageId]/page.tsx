'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2, ArrowLeft, ShieldCheck, ImagePlus, X, AlertCircle, MapPin, Calendar, Package, Monitor } from 'lucide-react'
import { use } from 'react'
import dynamic from 'next/dynamic'

import { logClientConsent } from '@/app/actions/consent'
import { createClient } from '@/lib/supabase/client'
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

// Dynamically import the Paystack button so it doesn't break SSR window requirements
const PaystackButton = dynamic(() => import('@/components/payment/PaystackButton'), {
  ssr: false,
})

const checkoutSchema = z.object({
  clientName: z.string().min(2, 'Name must be at least 2 characters'),
  clientEmail: z.string().email('Valid email is required').min(5, 'Email is required'),
  brief: z.string().min(10, 'Brief must be at least 10 characters').max(2000, 'Brief must be under 2000 characters'),
  // Delivery fields (conditionally required via refinement)
  deliveryType: z.enum(['digital', 'physical', 'on_premise']),
  street: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  addressNotes: z.string().optional(),
  onPremiseDate: z.string().optional(),
  onPremiseLocation: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms to continue",
  }),
}).superRefine((data, ctx) => {
  if (data.deliveryType === 'physical') {
    if (!data.street || data.street.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Street address is required', path: ['street'] })
    if (!data.city || data.city.length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City is required', path: ['city'] })
    if (!data.region || data.region.length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Region is required', path: ['region'] })
  }
  if (data.deliveryType === 'on_premise') {
    if (!data.onPremiseDate) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A preferred date is required', path: ['onPremiseDate'] })
    if (!data.onPremiseLocation || data.onPremiseLocation.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Location is required', path: ['onPremiseLocation'] })
  }
})

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE_MB = 5
const MAX_IMAGES = 5

interface CheckoutPageProps {
  params: Promise<{
    username: string
    packageId: string
  }>
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const router = useRouter()
  const { username, packageId } = use(params)
  
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [pkg, setPkg] = useState<any>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  // Track if the form is valid and frozen, ready for payment
  const [isFormLocked, setIsFormLocked] = useState(false)

  // Brief image state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [briefImages, setBriefImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, paystack_subaccount_code, is_onboarded')
        .eq('username', username)
        .single()

      if (!profileData) {
        setPageError("Creator profile not found.")
        setIsLoading(false)
        return
      }

      const { data: packageData } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .eq('influencer_id', profileData.id)
        .single()

      if (!packageData) {
        setPageError("This package was not found or is no longer active.")
        setIsLoading(false)
        return
      }

      // Check if influencer is onboarded (has set up payment account)
      if (!profileData.is_onboarded || !profileData.paystack_subaccount_code) {
        setPageError("This creator is not currently accepting payments. Please contact them directly.")
        setIsLoading(false)
        return
      }

      setProfile(profileData)
      setPkg(packageData)
      setIsLoading(false)
    }

    fetchData()
  }, [username, packageId])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [imagePreviewUrls])

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      brief: '',
      deliveryType: 'digital',
      street: '',
      city: '',
      region: '',
      zip: '',
      country: 'Ghana',
      addressNotes: '',
      onPremiseDate: '',
      onPremiseLocation: '',
      acceptTerms: false,
    },
  })

  const watchDeliveryType = form.watch('deliveryType')

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError(null)
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remaining = MAX_IMAGES - briefImages.length
    if (files.length > remaining) {
      setImageError(`You can only upload up to ${MAX_IMAGES} images total.`)
      return
    }

    const invalid = files.find(f => !ALLOWED_IMAGE_TYPES.includes(f.type))
    if (invalid) {
      setImageError('Only JPEG, PNG, WebP, or GIF images are allowed.')
      return
    }

    const oversized = files.find(f => f.size > MAX_IMAGE_SIZE_MB * 1024 * 1024)
    if (oversized) {
      setImageError(`Each image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`)
      return
    }

    const newPreviews = files.map(f => URL.createObjectURL(f))
    setBriefImages(prev => [...prev, ...files])
    setImagePreviewUrls(prev => [...prev, ...newPreviews])

    // Reset input so same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(imagePreviewUrls[index])
    setBriefImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadBriefImages(): Promise<string[]> {
    if (briefImages.length === 0) return []

    const supabase = createClient()
    const urls: string[] = []
    const timestamp = Date.now()

    for (let i = 0; i < briefImages.length; i++) {
      const file = briefImages[i]
      const ext = file.name.split('.').pop() || 'jpg'
      // Use a path that includes a timestamp + index for uniqueness
      const filePath = `briefs/${username}/${timestamp}-${i}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('brief-assets')
        .upload(filePath, file, { upsert: false })

      if (uploadError) {
        console.error('Brief image upload error:', uploadError)
        throw new Error(`Failed to upload image ${i + 1}: ${uploadError.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('brief-assets')
        .getPublicUrl(filePath)

      urls.push(publicUrl)
    }

    return urls
  }

  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
    setIsSubmitting(true)
    setFormError(null)

    try {
      // Upload brief images first if any were selected
      if (briefImages.length > 0) {
        setIsUploadingImages(true)
        const urls = await uploadBriefImages()
        setUploadedImageUrls(urls)
        setIsUploadingImages(false)
      }

      // Log client consent to the database via Server Action
      const consentResult = await logClientConsent(profile.id, values.clientEmail)
      if (!consentResult.success) {
        throw new Error(consentResult.error || "Failed to record consent")
      }

      // Lock the form and reveal the Paystack button
      setIsFormLocked(true)
    } catch (err: any) {
      setIsUploadingImages(false)
      setFormError(err.message || 'Failed to upload images. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Build delivery address object from form values
  function getDeliveryAddress() {
    if (form.getValues('deliveryType') !== 'physical') return null
    return {
      street: form.getValues('street') || '',
      city: form.getValues('city') || '',
      region: form.getValues('region') || '',
      zip: form.getValues('zip') || '',
      country: form.getValues('country') || 'Ghana',
      notes: form.getValues('addressNotes') || '',
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-surface-light flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-brand-success"/></div>
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-surface-light py-24 px-4 flex justify-center items-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-border">
          <div className="text-red-500 mb-6 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-brand-secondary mb-3">Checkout Error</h2>
          <p className="text-text-secondary mb-8">{pageError}</p>
          <Button onClick={() => router.push(`/book/${username}`)} className="w-full h-12 text-base">
             Go back to Profile
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-light font-sans text-text-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        
        <div className="mb-8">
          <Link href={`/book/${username}`} className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-brand-success transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to {profile.full_name}'s Profile
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Order Summary */}
          <div className="lg:col-span-5 space-y-10">
            <div>
              <h1 className="text-4xl lg:text-5xl font-display font-bold text-brand-secondary mb-4 tracking-tight">Complete your Booking</h1>
              <p className="text-text-secondary text-lg leading-relaxed">You're booking a service with <span className="font-semibold text-brand-secondary">{profile.full_name}</span>. Fill out the brief and proceed to secure payment.</p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
              <h3 className="font-bold text-xs uppercase tracking-widest text-text-secondary mb-6">Order Summary</h3>
              <div className="pb-6 border-b border-border">
                <h2 className="text-2xl font-display font-bold text-brand-secondary leading-tight">{pkg.title}</h2>
                {pkg.description && (
                  <p className="mt-3 text-text-secondary text-sm line-clamp-3 leading-relaxed">{pkg.description}</p>
                )}
              </div>
              <div className="pt-6 space-y-5">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-text-secondary">Expected Delivery</span>
                  <span className="text-brand-secondary font-bold bg-muted px-3 py-1 rounded-md">{pkg.delivery_days} Days</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-text-secondary">Platform Fee</span>
                  <span className="text-text-muted">Included</span>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-border flex justify-between items-end">
                <span className="font-bold text-text-secondary mb-1">Total Amount</span>
                <span className="text-4xl font-display font-bold text-brand-secondary">GHS {(pkg.price / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Form */}
          <div className="lg:col-span-7">
            <div className="bg-surface-card rounded-3xl p-8 sm:p-10 border border-border shadow-sm">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand / Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Nike Africa / Jane Doe" {...field} disabled={isFormLocked} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="clientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notification Email</FormLabel>
                          <FormControl>
                            <Input placeholder="marketing@example.com" {...field} disabled={isFormLocked} />
                          </FormControl>
                          <FormDescription>Where deliverables will be sent</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="brief"
                    render={({ field }) => (
                      <FormItem className="pt-2">
                        <FormLabel>Campaign Brief</FormLabel>
                        <FormControl>
                           <Textarea 
                              placeholder="Describe what you want the creator to make. Include links to assets or references." 
                              className="h-32 resize-none" 
                              disabled={isFormLocked}
                              {...field} 
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Delivery Type Selector */}
                  {(pkg.requires_physical_delivery || pkg.requires_on_premise) && (
                    <div className="space-y-4 pt-2">
                      <label className="text-sm font-medium text-text-primary">Delivery Method</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => form.setValue('deliveryType', 'digital')}
                          disabled={isFormLocked}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            watchDeliveryType === 'digital'
                              ? 'border-brand-success bg-brand-success/5 text-brand-success'
                              : 'border-border text-text-muted hover:border-brand-success/30'
                          }`}
                        >
                          <Monitor className="h-5 w-5" />
                          <span className="text-sm font-semibold">Digital</span>
                          <span className="text-[11px] text-text-muted">Delivered online</span>
                        </button>
                        {pkg.requires_physical_delivery && (
                          <button
                            type="button"
                            onClick={() => form.setValue('deliveryType', 'physical')}
                            disabled={isFormLocked}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                              watchDeliveryType === 'physical'
                                ? 'border-brand-success bg-brand-success/5 text-brand-success'
                                : 'border-border text-text-muted hover:border-brand-success/30'
                            }`}
                          >
                            <Package className="h-5 w-5" />
                            <span className="text-sm font-semibold">Physical</span>
                            <span className="text-[11px] text-text-muted">Ship a product</span>
                          </button>
                        )}
                        {pkg.requires_on_premise && (
                          <button
                            type="button"
                            onClick={() => form.setValue('deliveryType', 'on_premise')}
                            disabled={isFormLocked}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                              watchDeliveryType === 'on_premise'
                                ? 'border-brand-success bg-brand-success/5 text-brand-success'
                                : 'border-border text-text-muted hover:border-brand-success/30'
                            }`}
                          >
                            <MapPin className="h-5 w-5" />
                            <span className="text-sm font-semibold">On‑Premise</span>
                            <span className="text-[11px] text-text-muted">Creator comes to you</span>
                          </button>
                        )}
                      </div>

                      {/* Physical Delivery Address Form */}
                      {watchDeliveryType === 'physical' && !isFormLocked && (
                        <div className="space-y-4 p-5 bg-surface-light rounded-xl border border-border animate-fade-in-up">
                          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            <Package className="h-4 w-4 text-brand-success" /> Shipping Address
                          </h4>
                          <FormField control={form.control} name="street" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address</FormLabel>
                              <FormControl><Input placeholder="123 Independence Ave" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="city" render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl><Input placeholder="Accra" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="region" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Region</FormLabel>
                                <FormControl><Input placeholder="Greater Accra" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="zip" render={({ field }) => (
                              <FormItem>
                                <FormLabel>ZIP / Postal Code</FormLabel>
                                <FormControl><Input placeholder="00233" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="country" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl><Input placeholder="Ghana" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name="addressNotes" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Notes <span className="text-text-muted font-normal">(optional)</span></FormLabel>
                              <FormControl><Input placeholder="Gate code, landmarks, etc." {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      )}

                      {/* On-Premise Date & Location */}
                      {watchDeliveryType === 'on_premise' && !isFormLocked && (
                        <div className="space-y-4 p-5 bg-surface-light rounded-xl border border-border animate-fade-in-up">
                          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-brand-success" /> Schedule On‑Premise Visit
                          </h4>
                          <FormField control={form.control} name="onPremiseDate" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Date &amp; Time</FormLabel>
                              <FormControl><Input type="datetime-local" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="onPremiseLocation" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location / Venue</FormLabel>
                              <FormControl><Input placeholder="Event hall, studio address, etc." {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Brief Image Upload */}
                  {!isFormLocked && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-text-primary">
                          Reference Images <span className="text-text-muted font-normal">(optional)</span>
                        </label>
                        <span className="text-[11px] text-text-muted">{briefImages.length}/{MAX_IMAGES}</span>
                      </div>

                      {/* Image Preview Grid */}
                      {imagePreviewUrls.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {imagePreviewUrls.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-border">
                              <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {/* Add more slot */}
                          {briefImages.length < MAX_IMAGES && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-brand-success/50 hover:bg-brand-success/5 flex flex-col items-center justify-center text-text-muted hover:text-brand-success transition-all"
                            >
                              <ImagePlus className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Upload trigger (shown when no images yet) */}
                      {imagePreviewUrls.length === 0 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-text-muted hover:border-brand-success/50 hover:bg-brand-success/5 hover:text-brand-success transition-all"
                        >
                          <ImagePlus className="h-6 w-6" />
                          <span className="text-[13px] font-medium">Add brand assets, references, or mood board</span>
                          <span className="text-[11px]">JPEG, PNG, WebP, GIF · max {MAX_IMAGE_SIZE_MB}MB each · up to {MAX_IMAGES} files</span>
                        </button>
                      )}

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_IMAGE_TYPES.join(',')}
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                      />

                      {imageError && (
                        <div className="flex items-center gap-2 text-[12px] text-error font-medium">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {imageError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Locked: show uploaded images summary */}
                  {isFormLocked && uploadedImageUrls.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[12px] font-semibold text-text-muted uppercase tracking-widest">Attached Images</p>
                      <div className="grid grid-cols-5 gap-2">
                        {uploadedImageUrls.map((url, idx) => (
                          <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-border">
                            <img src={url} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formError && (
                    <div className="text-red-500 text-sm font-medium bg-red-50 p-4 rounded-xl border border-red-200">
                      {formError}
                    </div>
                  )}

                  {!isFormLocked && (
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border p-4 bg-surface-light">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-5 w-5 rounded-md border-border text-brand-success focus:ring-brand-success/20 transition-all mt-0.5"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none flex-1">
                            <FormLabel className="text-sm font-medium cursor-pointer">
                              I accept the Terms of Service & Privacy Policy
                            </FormLabel>
                            <FormDescription className="text-[12px] mt-1.5 leading-snug">
                              By checking this box, you agree to our <Link href="/terms" target="_blank" className="underline hover:text-brand-success">Terms</Link> and <Link href="/privacy" target="_blank" className="underline hover:text-brand-success">Privacy Policy</Link>.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="pt-6">
                    {!isFormLocked ? (
                      <Button type="submit" size="lg" className="w-full h-14 text-lg font-semibold shadow-none rounded-xl" disabled={isSubmitting}>
                        {isSubmitting ? (
                          isUploadingImages
                            ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Uploading Images...</>
                            : <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing Checkout...</>
                        ) : (
                          `Continue to Payment`
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-xl border border-border flex items-start gap-3">
                          <ShieldCheck className="h-5 w-5 text-brand-success mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-brand-secondary">Brief Locked & Ready</p>
                            <p className="text-xs text-text-secondary mt-0.5">Your information is secure. Proceed to complete your payment.</p>
                          </div>
                        </div>
                        <PaystackButton
                          amount={pkg.price}
                          email={form.getValues('clientEmail')}
                          subaccountCode={profile.paystack_subaccount_code}
                          influencerId={profile.id}
                          packageId={pkg.id}
                          clientName={form.getValues('clientName')}
                          brief={form.getValues('brief')}
                          briefImageUrls={uploadedImageUrls}
                          isSubmitting={isSubmitting}
                          creatorUsername={username}
                          deliveryType={form.getValues('deliveryType')}
                          deliveryAddress={getDeliveryAddress()}
                          onPremiseDate={form.getValues('onPremiseDate') || null}
                          onPremiseLocation={form.getValues('onPremiseLocation') || null}
                        />
                      </div>
                    )}
                    <p className="text-xs text-center text-text-muted mt-4 flex items-center justify-center gap-1.5 font-medium">
                       <ShieldCheck className="h-3.5 w-3.5" /> Secured by Paystack
                    </p>
                  </div>
                </form>
              </Form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
