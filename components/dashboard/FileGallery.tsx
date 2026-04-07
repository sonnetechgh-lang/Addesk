'use client'

import { Star, Download, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'

type FileItem = {
  id: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  version: number
  is_final: boolean
  notes: string | null
  created_at: string
}

type FileGalleryProps = {
  files: FileItem[]
  onMarkFinal?: (fileId: string) => void
  onDelete?: (fileId: string) => void
}

export function FileGallery({ files, onMarkFinal, onDelete }: FileGalleryProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center">
        <Upload className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
        <p className="text-sm text-zinc-400">No files uploaded yet.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file) => {
        const isImage = file.file_type?.startsWith('image/')

        return (
          <div
            key={file.id}
            className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm"
          >
            {/* Preview area */}
            {isImage ? (
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-video bg-zinc-100 overflow-hidden"
              >
                <Image
                  src={file.file_url}
                  alt={file.file_name}
                  width={400}
                  height={225}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </a>
            ) : (
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex aspect-video items-center justify-center bg-zinc-50"
              >
                <span className="text-2xl font-bold text-zinc-300 uppercase">
                  {file.file_name.split('.').pop()}
                </span>
              </a>
            )}

            {/* Info */}
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-medium text-zinc-900 truncate flex-1">
                  {file.file_name}
                </span>
                <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                  v{file.version}
                </span>
                {file.is_final && (
                  <Star className="h-3 w-3 shrink-0 text-amber-500 fill-amber-500" />
                )}
              </div>

              <p className="text-[11px] text-zinc-400">
                {file.file_size
                  ? `${(file.file_size / 1024).toFixed(0)} KB`
                  : ''}
                {file.notes && ` · ${file.notes}`}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-1 mt-2">
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 text-zinc-400 hover:text-emerald-600 transition-colors"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                {!file.is_final && onMarkFinal && (
                  <button
                    onClick={() => onMarkFinal(file.id)}
                    className="rounded p-1 text-zinc-400 hover:text-amber-500 transition-colors"
                    title="Mark as Final"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(file.id)}
                    className="rounded p-1 text-zinc-300 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
