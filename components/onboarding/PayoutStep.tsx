'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'

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

const payoutSchema = z.object({
  bankCode: z.string().min(3, { message: 'Please select a valid bank' }),
  accountNumber: z.string().min(10, { message: 'Account number must be 10 digits' }),
  accountName: z.string().min(2, { message: 'Account name is required' }),
})

interface PayoutStepProps {
  onBack: () => void
}

export function PayoutStep({ onBack }: PayoutStepProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof payoutSchema>>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      bankCode: '',
      accountNumber: '',
      accountName: '',
    },
  })

  async function onSubmit(values: z.infer<typeof payoutSchema>) {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/onboarding/subaccount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect payout account')
      }

      // If successful, they have fully onboarded!
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-secondary">Step 3: Connect your Bank Account</h2>
        <p className="text-text-secondary mt-1">
          Where should we send your money? (Powered securely by Paystack)
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="bankCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 044 (Access Bank), MTN (Mobile Money)" {...field} />
                </FormControl>
                <FormDescription>For Ghana Mobile Money, use MTN, VOD, or TIGO</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number (or Mobile Number)</FormLabel>
                <FormControl>
                  <Input placeholder="054XXXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl>
                  <Input placeholder="Kwame Nkrumah" {...field} />
                </FormControl>
                <FormDescription>
                  Must exactly match the name registered on the bank/mobile money account.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {error && (
            <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md">{error}</div>
          )}
          
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
              Back
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Onboarding
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
