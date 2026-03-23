'use client'

import { useState, useEffect } from 'react'
import { Copy, ExternalLink, Check } from 'lucide-react'

export function ShareLink({ username }: { username: string | undefined | null }) {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const fullUrl = `${origin}/book/${username || 'username'}`
  const displayUrl = origin ? `${origin.replace(/^https?:\/\//, '')}/book/${username || 'username'}` : `.../book/${username || 'username'}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 overflow-hidden">
        <span className="font-mono text-sm font-medium truncate text-white/90 italic">
          {displayUrl}
        </span>
      </div>
      
      <div className="grid gap-3 mt-6">
        <button 
          onClick={copyToClipboard}
          className="flex items-center justify-center gap-3 py-4 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-sm font-bold active:scale-[0.98]"
        >
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />} 
          {copied ? 'Copied!' : 'Copy Your Link'}
        </button>
        <a 
          href={`/book/${username}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center justify-center gap-3 py-4 bg-brand-success text-brand-secondary hover:bg-white transition-all rounded-xl text-sm font-bold active:scale-[0.98]"
        >
          <ExternalLink className="h-4 w-4" /> View Public Page
        </a>
      </div>
    </div>
  )
}
