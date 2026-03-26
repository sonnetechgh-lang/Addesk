import Link from 'next/link'
import { DEMO_PROFILE } from '@/lib/demo-data'

export default function DemoSettingsPage() {
  return (
    <div className="space-y-7 pb-12 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Settings</h1>
        <p className="text-text-secondary mt-1 text-sm">Manage your profile and account preferences.</p>
      </div>

      <div className="bg-surface-card rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6">
        {/* Profile Photo */}
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-brand-success/10 flex items-center justify-center text-brand-success text-2xl font-bold shrink-0 border border-border">
            {DEMO_PROFILE.full_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-text-primary">{DEMO_PROFILE.full_name}</h3>
            <p className="text-text-secondary text-sm">@{DEMO_PROFILE.username}</p>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Fields */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Full Name</label>
            <input type="text" value={DEMO_PROFILE.full_name} readOnly className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-text-primary text-[14px]" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Username</label>
            <input type="text" value={DEMO_PROFILE.username} readOnly className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-text-primary text-[14px]" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Bio</label>
            <textarea value={DEMO_PROFILE.bio} readOnly rows={3} className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-text-primary text-[14px] resize-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Instagram</label>
            <input type="text" value={DEMO_PROFILE.instagram_handle || ''} readOnly className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-text-primary text-[14px]" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">TikTok</label>
            <input type="text" value={DEMO_PROFILE.tiktok_handle || ''} readOnly className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-text-primary text-[14px]" />
          </div>
        </div>

        <button className="px-6 py-2.5 rounded-xl bg-brand-success text-white text-sm font-semibold cursor-default opacity-80" disabled>
          Save Changes
        </button>
        <p className="text-[11px] text-text-muted">
          Demo mode — settings are read-only.{' '}
          <Link href="/signup" className="text-brand-success font-semibold hover:underline">Sign up</Link> to customize your profile.
        </p>
      </div>
    </div>
  )
}
