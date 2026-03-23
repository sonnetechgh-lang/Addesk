'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

import { createPackage } from '@/actions/onboarding'
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

// Reused schema for creating a package
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

export default function NewPackagePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof packageSchema>>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      title: '',
      description: '',
      priceGHS: '100',
      deliveryDays: '3',
    },
  })

  async function onSubmit(values: z.infer<typeof packageSchema>) {
    setIsSubmitting(true)
    setFormError(null)
    
    try {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('description', values.description || '')
      formData.append('priceGHS', values.priceGHS)
      formData.append('deliveryDays', values.deliveryDays)
      
      const result = await createPackage(formData)

      if (result?.error) {
        throw new Error(result.error)
      }

      router.push('/dashboard/packages')
      router.refresh()
    } catch (err: any) {
      setFormError(err.message || "An error occurred submitting the form")
      setIsSubmitting(false)
    }
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
        <div>
          <h2 className="text-4xl font-display font-bold text-brand-secondary tracking-tight">Create Package</h2>
          <p className="text-text-secondary mt-2 text-lg">
            Add a new service package for brands to book.
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
                  <FormDescription className="text-xs text-text-muted mt-1">Make it clear and professional.</FormDescription>
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
                      placeholder="Describe exactly what the brand receives (usage rights, revisions, video length, etc.)."
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
                    <FormDescription className="text-xs text-text-muted mt-1">Estimated time until final asset delivery.</FormDescription>
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
            
            <div className="pt-8 flex flex-col sm:flex-row justify-end gap-4 border-t border-border mt-10">
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
                Create Package
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
