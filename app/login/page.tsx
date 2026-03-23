'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2, Zap } from 'lucide-react'
import type { AuthError } from '@supabase/supabase-js'

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

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
})

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      if (signInError) throw signInError
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      console.error('Login error:', err)
      const authError = err as AuthError | Error
      setError(authError?.message || 'Invalid email or password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen font-sans text-text-primary">

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex w-[45%] bg-brand-secondary flex-col justify-between p-12 relative overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-brand-success blur-[100px] opacity-25 pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full bg-brand-accent blur-[100px] opacity-15 pointer-events-none" />
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand-success flex items-center justify-center shadow-[0_2px_8px_rgba(15,100,67,0.5)]">
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">AdDesk</span>
        </Link>

        {/* Testimonial card */}
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
              &ldquo;AdDesk completely transformed how I manage brand partnerships. Payments are instant and everything is so organized.&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-success/30 border border-brand-success/40 flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
              <div>
                <p className="text-white font-semibold text-[13px]">Ama K.</p>
                <p className="text-white/50 text-[12px]">Lifestyle Creator, Accra</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-surface-light">
        <div className="w-full max-w-105">

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="h-8 w-8 rounded-lg bg-brand-success flex items-center justify-center shadow-[0_2px_8px_rgba(15,100,67,0.4)]">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="font-bold text-xl text-text-primary">AdDesk</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Welcome back</h1>
            <p className="text-text-secondary mt-2 text-[15px]">Sign in to your AdDesk account to continue.</p>
          </div>

          <div className="bg-surface-card rounded-2xl border border-border p-7 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>
          </div>

          <p className="mt-6 text-center text-[14px] text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-brand-success hover:text-brand-success/80 font-semibold transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
