'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2, CheckCircle2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
})

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        }
      })
      
      if (signUpError) {
        throw signUpError
      }
      
      setSuccess(true)
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const SplitLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen font-sans text-text-primary">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[45%] bg-brand-secondary flex-col justify-between p-12 relative overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-brand-success blur-[100px] opacity-25 pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full bg-brand-accent blur-[100px] opacity-15 pointer-events-none" />
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <div className="grid grid-cols-2 gap-0.5 w-6 h-6 items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-success" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">AdDesk</span>
        </Link>

        <div className="relative z-10 mb-8">
          <div className="bg-white/8 border border-white/12 rounded-2xl p-7 backdrop-blur-sm">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-4 w-4 text-warning fill-warning" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-white text-[16px] leading-relaxed font-medium mb-5">
              "I used to track all my briefs in a spreadsheet. AdDesk made my workflow 10x faster and more professional."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-accent/30 border border-brand-accent/40 flex items-center justify-center text-white font-bold text-sm">
                K
              </div>
              <div>
                <p className="text-white font-semibold text-[13px]">Kojo D.</p>
                <p className="text-white/50 text-[12px]">Tech Reviewer, Kumasi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-surface-light">
        <div className="w-full max-w-105">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6 items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-success" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary" />
            </div>
            <span className="font-bold text-xl text-text-primary">AdDesk</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  )

  if (success) {
    return (
      <SplitLayout>
        <div className="text-center space-y-6">
          <div className="w-14 h-14 bg-success/10 text-success rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Check your email</h1>
          <p className="text-text-secondary text-[15px] leading-relaxed">
            We&apos;ve sent a confirmation link to <strong className="text-text-primary">{form.getValues('email')}</strong>.<br/>
            Click the link to verify your account and start setting up.
          </p>
          <div className="pt-4">
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">Return to login</Link>
            </Button>
          </div>
        </div>
      </SplitLayout>
    )
  }

  return (
    <SplitLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Create an account</h1>
        <p className="text-text-secondary mt-2 text-[15px]">Start managing your brand deals professionally.</p>
      </div>

      <div className="bg-surface-card rounded-2xl border border-border p-7 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold text-text-primary">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Kwame Nkrumah" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold text-text-primary">Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="kwame@example.com" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold text-text-primary">Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-error/8 border border-error/20 rounded-xl text-error text-[13px] font-medium">
                <span className="mt-0.5">⚠</span>
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full mt-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign up'
              )}
            </Button>
          </form>
        </Form>
      </div>

      <p className="mt-6 text-center text-[14px] text-text-secondary">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-success hover:text-brand-success/80 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </SplitLayout>
  )
}
