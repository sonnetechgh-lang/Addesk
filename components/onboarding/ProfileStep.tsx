'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'

import { updateProfile } from '@/actions/onboarding'
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

const profileSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().max(500, { message: 'Bio is too long.' }).optional(),
  instagramHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  twitterHandle: z.string().optional(),
})

interface ProfileStepProps {
  onNext: () => void
  initialData: any
}

export function ProfileStep({ onNext, initialData }: ProfileStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialData?.full_name || '',
      username: initialData?.username || '',
      bio: initialData?.bio || '',
      instagramHandle: initialData?.instagram_handle || '',
      tiktokHandle: initialData?.tiktok_handle || '',
      twitterHandle: initialData?.twitter_handle || '',
    },
  })

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('fullName', values.fullName)
      formData.append('username', values.username)
      if (values.bio) formData.append('bio', values.bio)
      if (values.instagramHandle) formData.append('instagramHandle', values.instagramHandle)
      if (values.tiktokHandle) formData.append('tiktokHandle', values.tiktokHandle)
      if (values.twitterHandle) formData.append('twitterHandle', values.twitterHandle)

      const result = await updateProfile(formData)
      
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
        <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-secondary">Step 1: Complete your profile</h2>
        <p className="text-text-secondary mt-1">
          This information will be displayed on your public booking page.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Kwame Nkrumah" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="kwame_n" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will be your booking link suffix: /book/{field.value || 'username'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  {/* Fallback to simply an input if textual area is missing from standard shadcn install */}
                  <Input placeholder="Tell brands about yourself and your audience..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Social Handles (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="instagramHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="@" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tiktokHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TikTok</FormLabel>
                    <FormControl>
                      <Input placeholder="@" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="twitterHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>X (Twitter)</FormLabel>
                    <FormControl>
                      <Input placeholder="@" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md">{error}</div>
          )}
          
          <div className="flex justify-end pt-4">
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
