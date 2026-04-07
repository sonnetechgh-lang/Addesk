'use client'

import { useState } from 'react'
import type { ChannelType } from '@/types/channels'
import {
  PAGE_SIZE_LABELS,
  COLOR_MODE_LABELS,
  POSITION_LABELS,
  DAYPART_LABELS,
} from '@/types/channels'

type Props = {
  channelType: ChannelType
  initialSpecs?: Record<string, unknown>
  onChange: (specs: Record<string, unknown>) => void
}

export function SlotSpecsForm({ channelType, initialSpecs = {}, onChange }: Props) {
  const [specs, setSpecs] = useState<Record<string, unknown>>(initialSpecs)

  const update = (key: string, value: unknown) => {
    const next = { ...specs, [key]: value }
    setSpecs(next)
    onChange(next)
  }

  const inputClass =
    'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors'
  const labelClass = 'block text-xs font-semibold text-zinc-500 mb-1.5'
  const selectClass =
    'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors appearance-none'

  if (channelType === 'print') {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-zinc-700">Print Specifications</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Page Size</label>
            <select
              className={selectClass}
              value={(specs.pageSize as string) || ''}
              onChange={(e) => update('pageSize', e.target.value)}
            >
              <option value="">Select size</option>
              {Object.entries(PAGE_SIZE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Color Mode</label>
            <select
              className={selectClass}
              value={(specs.colorMode as string) || ''}
              onChange={(e) => update('colorMode', e.target.value)}
            >
              <option value="">Select color</option>
              {Object.entries(COLOR_MODE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Section</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g., Front Page, Sports"
              value={(specs.section as string) || ''}
              onChange={(e) => update('section', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Position</label>
            <select
              className={selectClass}
              value={(specs.position as string) || ''}
              onChange={(e) => update('position', e.target.value)}
            >
              <option value="">Select position</option>
              {Object.entries(POSITION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        {(specs.pageSize === 'custom') && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Width (mm)</label>
              <input type="number" className={inputClass} placeholder="210"
                value={(specs.width_mm as number) || ''} onChange={(e) => update('width_mm', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Height (mm)</label>
              <input type="number" className={inputClass} placeholder="297"
                value={(specs.height_mm as number) || ''} onChange={(e) => update('height_mm', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Bleed (mm)</label>
              <input type="number" className={inputClass} placeholder="3"
                value={(specs.bleed_mm as number) || ''} onChange={(e) => update('bleed_mm', Number(e.target.value))} />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (channelType === 'broadcast_tv' || channelType === 'broadcast_radio') {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-zinc-700">Broadcast Specifications</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Duration</label>
            <select className={selectClass} value={(specs.duration_seconds as number) || ''}
              onChange={(e) => update('duration_seconds', Number(e.target.value))}>
              <option value="">Select duration</option>
              {[15, 30, 45, 60, 90, 120].map((d) => (
                <option key={d} value={d}>{d}s</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Daypart</label>
            <select className={selectClass} value={(specs.daypart as string) || ''}
              onChange={(e) => update('daypart', e.target.value)}>
              <option value="">Select daypart</option>
              {Object.entries(DAYPART_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Program</label>
            <input type="text" className={inputClass} placeholder="e.g., Morning Show"
              value={(specs.program as string) || ''} onChange={(e) => update('program', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Format</label>
            <select className={selectClass} value={(specs.format as string) || ''}
              onChange={(e) => update('format', e.target.value)}>
              <option value="">Select format</option>
              <option value="live_read">Live Read</option>
              <option value="pre_recorded">Pre-recorded</option>
              <option value="sponsorship">Sponsorship</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  if (channelType === 'digital') {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-zinc-700">Digital Specifications</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Placement</label>
            <select className={selectClass} value={(specs.placement as string) || ''}
              onChange={(e) => update('placement', e.target.value)}>
              <option value="">Select placement</option>
              <option value="banner">Banner</option>
              <option value="sidebar">Sidebar</option>
              <option value="interstitial">Interstitial</option>
              <option value="native">Native</option>
              <option value="video_pre_roll">Video Pre-roll</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Pricing Model</label>
            <select className={selectClass} value={(specs.pricing_model as string) || ''}
              onChange={(e) => update('pricing_model', e.target.value)}>
              <option value="">Select model</option>
              <option value="flat">Flat Rate</option>
              <option value="cpm">CPM</option>
              <option value="cpc">CPC</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Width (px)</label>
            <input type="number" className={inputClass} placeholder="728"
              value={(specs.width_px as number) || ''} onChange={(e) => update('width_px', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Height (px)</label>
            <input type="number" className={inputClass} placeholder="90"
              value={(specs.height_px as number) || ''} onChange={(e) => update('height_px', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Max File Size (MB)</label>
            <input type="number" className={inputClass} placeholder="5"
              value={(specs.max_file_size_mb as number) || ''} onChange={(e) => update('max_file_size_mb', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Accepted File Types</label>
            <input type="text" className={inputClass} placeholder="jpg, png, gif, mp4"
              value={(specs.file_types as string) || ''} onChange={(e) => update('file_types', e.target.value)} />
          </div>
        </div>
      </div>
    )
  }

  // Influencer / default
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-zinc-700">Creator Specifications</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Platform</label>
          <select className={selectClass} value={(specs.platform as string) || ''}
            onChange={(e) => update('platform', e.target.value)}>
            <option value="">Select platform</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="twitter">Twitter / X</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Content Type</label>
          <select className={selectClass} value={(specs.content_type as string) || ''}
            onChange={(e) => update('content_type', e.target.value)}>
            <option value="">Select type</option>
            <option value="post">Post</option>
            <option value="story">Story</option>
            <option value="reel">Reel</option>
            <option value="video">Video</option>
            <option value="thread">Thread</option>
          </select>
        </div>
      </div>
    </div>
  )
}
