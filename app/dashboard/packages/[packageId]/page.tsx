'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2, ArrowLeft, Trash, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

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

const packageSchema = z.object({
  title: z.string().min(3, { message: 'Title is required' }),
  description: z.string().optional(),
  priceGHS: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
    message: 'Price must be at least 1 GHS',
  }),
  deliveryDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
    message: 'Delivery time must be at least 1 day',
  }),
})

interface EditPackagePageProps {
  params: Promise<{
    packageId: string
  }>
}

export default function EditPackagePage({ params }: EditPackagePageProps) {
  const router = useRouter()
  const { packageId } = use(params)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof packageSchema>>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      title: '',
      description: '',
      priceGHS: '',
      deliveryDays: '',
    },
  })

  useEffect(() => {
    async function fetchPackage() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .eq('influencer_id', user.id)
        .single()

      if (error || !data) {
        setFormError('Could not load package. It may have been deleted.')
        setIsLoading(false)
        return
      }

      form.reset({
        title: data.title,
        description: data.description || '',
        priceGHS: (data.price / 100).toString(),
        deliveryDays: data.delivery_days.toString()
      })
      
      setIsLoading(false)
    }

    fetchPackage()
  }, [packageId, router, form])

  async function onSubmit(values: z.infer<typeof packageSchema>) {
    setIsSubmitting(true)
    setFormError(null)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const pricePesewas = Math.round(Number(values.priceGHS) * 100)

      const { error } = await supabase
        .from('packages')
        .update({
          title: values.title,
          description: values.description || null,
          price: pricePesewas,
          delivery_days: Number(values.deliveryDays)
        })
        .eq('id', packageId)
        .eq('influencer_id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      router.push('/dashboard/packages')
      router.refresh()
    } catch (err: any) {
      setFormError(err.message || "An error occurred updating the package")
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-brand-success"/></div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-12">
      <div className="flex items-center gap-6">
        <Link 
          href="/dashboard/packages" 
          className="h-12 w-12 flex items-center justify-center rounded-xl bg-white border border-border text-text-secondary hover:text-brand-success transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-4xl font-display font-bold text-brand-secondary tracking-tight">Edit Package</h2>
          <p className="text-text-secondary mt-2 text-lg">
            Update your service details or pricing.
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-3xl p-8 sm:p-12 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block">Package Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 1x TikTok Dedicated Video" 
                      className="h-14 bg-surface-light border-border/60 focus:ring-brand-success/20 rounded-xl"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe exactly what the brand receives."
                      className="resize-none min-h-[160px] bg-surface-light border-border/60 focus:ring-brand-success/20 rounded-xl pt-4"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="priceGHS"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block">Price (GHS)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">GHS</span>
                        <Input 
                          type="number" 
                          min="1" 
                          className="h-14 pl-14 bg-surface-light border-border/60 focus:ring-brand-success/20 rounded-xl font-display font-bold text-lg"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block">Delivery Time (Days)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          min="1" 
                          className="h-14 bg-surface-light border-border/60 focus:ring-brand-success/20 rounded-xl font-bold"
                          {...field} 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">Days</span>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-text-muted mt-1">Estimated days for delivery.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {formError && (
              <div className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                <AlertCircle className="h-5 w-5" />
                {formError}
              </div>
            )}
            
            <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-border mt-10">
              <Button 
                variant="destructive" 
                type="button" 
                size="icon" 
                disabled 
                className="h-14 w-14 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none cursor-not-allowed hidden sm:flex items-center justify-center"
              >
                 <Trash className="h-5 w-5" />
              </Button>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/dashboard/packages" className="w-full sm:w-auto">
                  <Button variant="outline" type="button" className="w-full h-14 px-8 rounded-xl border-border text-text-secondary font-bold hover:bg-muted transition-all">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-14 px-10 rounded-xl bg-brand-success text-white font-bold text-lg hover:bg-brand-success-dark transition-all shadow-[0_2px_12px_rgba(15,100,67,0.3)]">
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
