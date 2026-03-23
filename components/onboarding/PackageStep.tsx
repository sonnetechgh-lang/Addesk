'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2, Package, MapPin } from 'lucide-react'

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const packageSchema = z.object({
  title: z.string().min(3, { message: 'Title is required' }),
  description: z.string().optional(),
  priceGHS: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
    message: 'Price must be at least 1 GHS',
  }),
  deliveryDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
    message: 'Delivery time must be at least 1 day',
  }),
  requiresPhysicalDelivery: z.boolean(),
  requiresOnPremise: z.boolean(),
})

interface PackageStepProps {
  onNext: () => void
  onBack: () => void
}

export function PackageStep({ onNext, onBack }: PackageStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof packageSchema>>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      title: '',
      description: '',
      priceGHS: '100',
      deliveryDays: '3',
      requiresPhysicalDelivery: false,
      requiresOnPremise: false,
    },
  })

  async function onSubmit(values: z.infer<typeof packageSchema>) {
    setIsLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('title', values.title)
      if (values.description) formData.append('description', values.description)
      formData.append('priceGHS', values.priceGHS.toString())
      formData.append('deliveryDays', values.deliveryDays.toString())
      formData.append('requiresPhysicalDelivery', values.requiresPhysicalDelivery ? 'true' : 'false')
      formData.append('requiresOnPremise', values.requiresOnPremise ? 'true' : 'false')

      const result = await createPackage(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        onNext()
      }
    } catch (err: any) {
      setError('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-secondary">Step 2: Create your first package</h2>
        <p className="text-text-secondary mt-1">
          What service are you offering? (e.g., "Dedicated Instagram Post", "UGC Video")
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Package Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Dedicated Instagram Post" {...field} />
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
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="What does this package include?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="priceGHS"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (GHS)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormDescription>
                    You will receive 94% after a 6% platform fee.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deliveryDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Time (Days)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Delivery Flags */}
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium text-text-primary">Delivery Options</label>
            <FormField
              control={form.control}
              name="requiresPhysicalDelivery"
              render={({ field }) => (
                <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  field.value ? 'border-brand-success bg-brand-success/5' : 'border-border hover:border-brand-success/30'
                }`}>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-border text-brand-success focus:ring-brand-success"
                  />
                  <Package className="h-4 w-4 text-text-muted" />
                  <div>
                    <span className="text-sm font-semibold text-text-primary">Physical Product</span>
                    <p className="text-[11px] text-text-muted">Client can ship a product to you</p>
                  </div>
                </label>
              )}
            />
            <FormField
              control={form.control}
              name="requiresOnPremise"
              render={({ field }) => (
                <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  field.value ? 'border-brand-success bg-brand-success/5' : 'border-border hover:border-brand-success/30'
                }`}>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-border text-brand-success focus:ring-brand-success"
                  />
                  <MapPin className="h-4 w-4 text-text-muted" />
                  <div>
                    <span className="text-sm font-semibold text-text-primary">On‑Premise Visit</span>
                    <p className="text-[11px] text-text-muted">You'll go to the client's location</p>
                  </div>
                </label>
              )}
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md">{error}</div>
          )}
          
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
              Back
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Continue
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
