'use client'

import { useState } from 'react'
import { Upload, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { uploadProofOfRun } from '@/actions/schedule'
import { useRouter } from 'next/navigation'

type ProofUploadProps = {
  entryId: string
  existingProofs: string[]
}

export function ProofUpload({ entryId, existingProofs }: ProofUploadProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploading(true)
    const fd = new FormData(e.currentTarget)
    await uploadProofOfRun(entryId, fd)
    setUploading(false)
    setShowForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {/* Existing proofs */}
      {existingProofs.length > 0 && (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
          {existingProofs.map((url, i) => {
            const isImage =
              url.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null

            return (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-zinc-200 overflow-hidden hover:border-emerald-300 transition-colors"
              >
                {isImage ? (
                  <Image
                    src={url}
                    alt={`Proof ${i + 1}`}
                    width={320}
                    height={180}
                    className="aspect-video w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-zinc-50">
                    <ImageIcon className="h-6 w-6 text-zinc-300" />
                  </div>
                )}
                <p className="px-2 py-1 text-[10px] text-zinc-500 truncate">
                  Proof {i + 1}
                </p>
              </a>
            )
          })}
        </div>
      )}

      {/* Upload toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Proof of Run
        </button>
      ) : (
        <form
          onSubmit={handleUpload}
          className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-3"
        >
          <div>
            <input
              name="file"
              type="file"
              required
              accept="image/*,.pdf"
              className="w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-zinc-500 hover:text-zinc-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
