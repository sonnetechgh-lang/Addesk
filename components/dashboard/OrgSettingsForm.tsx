'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { Loader2, Camera, Building2 } from 'lucide-react'
import { updateOrganization, uploadOrgLogo } from '@/actions/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Organization } from '@/types/roles'

export function OrgSettingsForm({ organization }: { organization: Organization }) {
  const [name, setName] = useState(organization.name)
  const [slug, setSlug] = useState(organization.slug)
  const [website, setWebsite] = useState(organization.website ?? '')
  const [logoUrl, setLogoUrl] = useState(organization.logo_url)
  const [isPending, startTransition] = useTransition()
  const [logoUploading, setLogoUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<Record<string, string[]> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    setError(null)

    startTransition(async () => {
      const fd = new FormData()
      fd.set('name', name)
      fd.set('slug', slug)
      fd.set('website', website)

      const result = await updateOrganization(organization.id, fd)
      if (result.error) {
        setError(result.error as Record<string, string[]>)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoUploading(true)
    const fd = new FormData()
    fd.set('logo', file)

    const result = await uploadOrgLogo(organization.id, fd)
    if (result.error) {
      setError({ logo: [typeof result.error === 'string' ? result.error : 'Upload failed'] })
    } else if (result.url) {
      setLogoUrl(result.url)
    }
    setLogoUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-8">
      {/* Logo Section */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Organization Logo</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={organization.name}
                width={80}
                height={80}
                className="h-20 w-20 rounded-xl object-cover border border-zinc-200"
                unoptimized
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Building2 className="h-8 w-8" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={logoUploading}
              className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {logoUploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
            </button>
          </div>
          <div>
            <p className="text-xs text-zinc-500">JPEG, PNG, or WebP. Max 2MB.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
        {error?.logo && (
          <p className="mt-2 text-xs text-red-600">{error.logo[0]}</p>
        )}
      </div>

      {/* Details Section */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-zinc-900">Organization Details</h2>

        <div className="space-y-2">
          <label htmlFor="org-name" className="block text-xs font-medium text-zinc-700">
            Name
          </label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Organization name"
          />
          {error?.name && <p className="text-xs text-red-600">{error.name[0]}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="org-slug" className="block text-xs font-medium text-zinc-700">
            Slug
          </label>
          <Input
            id="org-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            placeholder="organization-slug"
          />
          <p className="text-[11px] text-zinc-400">
            Used in your public URL: addesk.app/{slug}
          </p>
          {error?.slug && <p className="text-xs text-red-600">{error.slug[0]}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="org-website" className="block text-xs font-medium text-zinc-700">
            Website
          </label>
          <Input
            id="org-website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            type="url"
          />
          {error?.website && <p className="text-xs text-red-600">{error.website[0]}</p>}
        </div>

        {error?._form && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
            {error._form[0]}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
            Settings saved successfully.
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </form>
    </div>
  )
}
