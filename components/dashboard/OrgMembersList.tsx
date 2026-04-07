'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Loader2, UserPlus, Trash2, Shield, ChevronDown } from 'lucide-react'
import { inviteMember, updateMemberRole, removeMember } from '@/actions/organizations'
import { MEMBER_ROLES, type MemberRole } from '@/types/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type MemberData = {
  id: string
  role: string
  is_active: boolean
  invited_email: string | null
  invited_at: string | null
  accepted_at: string | null
  created_at: string
  profiles: {
    full_name: string
    username: string
    email: string
    profile_photo_url: string | null
  } | null
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-50 text-amber-700 border-amber-200',
  admin: 'bg-violet-50 text-violet-700 border-violet-200',
  sales: 'bg-blue-50 text-blue-700 border-blue-200',
  production: 'bg-orange-50 text-orange-700 border-orange-200',
  finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  member: 'bg-zinc-50 text-zinc-700 border-zinc-200',
}

const ASSIGNABLE_ROLES = MEMBER_ROLES.filter((r) => r !== 'owner')

export function OrgMembersList({
  members,
  orgId,
  isAdmin,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentUserId,
}: {
  members: MemberData[]
  orgId: string
  isAdmin: boolean
  currentUserId: string
}) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>('member')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string | null>(null)

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const fd = new FormData()
      fd.set('email', inviteEmail)
      fd.set('role', inviteRole)

      const result = await inviteMember(orgId, fd)
      if ('error' in result) {
        const err = result.error
        const errMsg =
          typeof err === 'string'
            ? err
            : Object.values(err ?? {}).flat().join(', ')
        setError(errMsg)
      } else {
        setSuccess('Member invited successfully')
        setInviteEmail('')
        setTimeout(() => setSuccess(null), 3000)
      }
    })
  }

  const handleRoleChange = (memberId: string, newRole: MemberRole) => {
    setEditingRole(null)
    startTransition(async () => {
      const result = await updateMemberRole(orgId, memberId, newRole)
      if (result.error) setError(typeof result.error === 'string' ? result.error : 'Failed')
    })
  }

  const handleRemove = (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from this organization?`)) return

    startTransition(async () => {
      const result = await removeMember(orgId, memberId)
      if (result.error) setError(typeof result.error === 'string' ? result.error : 'Failed')
    })
  }

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      {isAdmin && (
        <form
          onSubmit={handleInvite}
          className="rounded-2xl border border-zinc-200 bg-white p-5"
        >
          <h2 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="flex-1"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as MemberRole)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          {success && <p className="mt-2 text-xs text-emerald-600">{success}</p>}
        </form>
      )}

      {/* Members List */}
      <div className="rounded-2xl border border-zinc-200 bg-white divide-y divide-zinc-100">
        {members.map((m) => {
          const displayName = m.profiles?.full_name ?? m.invited_email ?? 'Unknown'
          const isPending = !m.accepted_at && m.invited_email

          return (
            <div
              key={m.id}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              {/* Avatar */}
              {m.profiles?.profile_photo_url ? (
                <Image
                  src={m.profiles.profile_photo_url}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover shrink-0"
                  unoptimized
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 text-xs font-medium shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {displayName}
                  {isPending && (
                    <span className="ml-2 text-[10px] font-normal text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">
                      Pending
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {m.profiles?.email ?? m.invited_email ?? ''}
                </p>
              </div>

              {/* Role Badge / Dropdown */}
              <div className="relative shrink-0">
                {isAdmin && m.role !== 'owner' ? (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setEditingRole(editingRole === m.id ? null : m.id)
                      }
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${ROLE_COLORS[m.role] ?? ROLE_COLORS.member}`}
                    >
                      {m.role}
                      <ChevronDown className="h-2.5 w-2.5" />
                    </button>
                    {editingRole === m.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setEditingRole(null)}
                        />
                        <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-zinc-200 bg-white shadow-lg py-1">
                          {ASSIGNABLE_ROLES.map((r) => (
                            <button
                              key={r}
                              onClick={() => handleRoleChange(m.id, r)}
                              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-50 capitalize"
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${ROLE_COLORS[m.role] ?? ROLE_COLORS.member}`}
                  >
                    {m.role === 'owner' && <Shield className="mr-1 h-2.5 w-2.5" />}
                    {m.role}
                  </span>
                )}
              </div>

              {/* Remove */}
              {isAdmin && m.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(m.id, displayName)}
                  className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove member"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        })}

        {members.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">
            No members yet.
          </div>
        )}
      </div>
    </div>
  )
}
