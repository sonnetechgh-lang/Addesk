'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Building2, ChevronDown, Check } from 'lucide-react'
import { switchOrganization } from '@/actions/organizations'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type OrgOption = {
  organization_id: string
  role: string
  organizations: {
    id: string
    name: string
    slug: string
    type: string
    logo_url: string | null
  }
}

export function OrgSwitcher({
  organizations,
  currentOrgId,
}: {
  organizations: OrgOption[]
  currentOrgId: string | null
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const current = organizations.find(
    (o) => o.organizations.id === currentOrgId
  )

  // Solo influencers with only 1 org don't need the switcher
  if (organizations.length <= 1) {
    return null
  }

  const handleSwitch = (orgId: string) => {
    if (orgId === currentOrgId) {
      setOpen(false)
      return
    }

    startTransition(async () => {
      await switchOrganization(orgId)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
          'bg-surface-card-secondary border border-border hover:bg-surface-light',
          isPending && 'opacity-60 cursor-wait'
        )}
      >
        {current?.organizations.logo_url ? (
          <Image
            src={current.organizations.logo_url}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg object-cover shrink-0"
            unoptimized
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
            <Building2 className="h-3.5 w-3.5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-text-primary truncate leading-tight">
            {current?.organizations.name ?? 'Select Org'}
          </p>
          <p className="text-[10px] text-text-tertiary truncate capitalize">
            {current?.role}
          </p>
        </div>
        <ChevronDown className={cn(
          'h-3.5 w-3.5 text-text-tertiary transition-transform',
          open && 'rotate-180'
        )} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-zinc-200 bg-white shadow-lg py-1 max-h-60 overflow-y-auto">
            {organizations.map((o) => (
              <button
                key={o.organizations.id}
                onClick={() => handleSwitch(o.organizations.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-zinc-50 transition-colors',
                  o.organizations.id === currentOrgId && 'bg-emerald-50'
                )}
              >
                {o.organizations.logo_url ? (
                  <Image
                    src={o.organizations.logo_url}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-md object-cover shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 shrink-0">
                    <Building2 className="h-3 w-3" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-900 truncate">
                    {o.organizations.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 capitalize">{o.role}</p>
                </div>
                {o.organizations.id === currentOrgId && (
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
