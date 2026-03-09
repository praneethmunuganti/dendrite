'use client'

import { RotateCcw } from 'lucide-react'
import type { NoteVersion } from '@/types'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface VersionGraphProps {
  versions: NoteVersion[]
  onRestore: (version: NoteVersion) => void
}

export default function VersionGraph({ versions, onRestore }: VersionGraphProps) {
  if (versions.length === 0) {
    return <p className="text-sm text-gray-400 px-4 py-3">No versions yet.</p>
  }

  // versions are already sorted newest-first
  const latest = versions[0]

  return (
    <div className="py-2">
      {versions.map((v, index) => {
        const isLatest = index === 0
        const isLast = index === versions.length - 1

        return (
          <div key={v.id} className="flex items-start gap-0">
            {/* Graph column */}
            <div className="flex flex-col items-center w-10 shrink-0">
              {/* Line above the dot (not for first item) */}
              <div className={cn('w-px flex-none', isLatest ? 'h-3' : 'h-3 bg-gray-300')} />

              {/* Dot */}
              <div
                className={cn(
                  'w-3 h-3 rounded-full border-2 shrink-0 z-10',
                  isLatest
                    ? 'bg-gray-900 border-gray-900'
                    : 'bg-white border-gray-400 hover:border-gray-700'
                )}
              />

              {/* Line below the dot (not for last item) */}
              {!isLast && <div className="w-px flex-1 bg-gray-300 min-h-[2.5rem]" />}
            </div>

            {/* Content */}
            <div
              className={cn(
                'group flex-1 flex items-start justify-between pb-5 pl-3',
                isLast && 'pb-2'
              )}
            >
              <div className="min-w-0">
                {/* Version badge + HEAD label */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'text-xs font-mono px-1.5 py-0.5 rounded font-semibold',
                      isLatest
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    v{v.version_number}
                  </span>
                  {isLatest && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                      HEAD
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {v.title}
                  </span>
                </div>

                {/* Commit message */}
                {v.message && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">&ldquo;{v.message}&rdquo;</p>
                )}

                {/* Timestamp */}
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(v.created_at)}</p>
              </div>

              {/* Restore button — hidden for the current HEAD */}
              {!isLatest && (
                <button
                  onClick={() => onRestore(v)}
                  className="opacity-0 group-hover:opacity-100 ml-3 flex items-center gap-1 text-xs text-gray-600 border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 transition-all shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
