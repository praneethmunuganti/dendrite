'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { NoteWithChildren } from '@/types'
import { ChevronRight, ChevronDown, FileText, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  notes: NoteWithChildren[]
  topicId: string
}

function NoteRow({
  note,
  depth,
  topicId,
}: {
  note: NoteWithChildren
  depth: number
  topicId: string
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = note.children.length > 0

  return (
    <>
      <div
        className={cn(
          'flex items-center group border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors'
        )}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn('p-2 text-gray-300', hasChildren ? 'hover:text-gray-600' : 'invisible')}
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <FileText className="w-4 h-4 text-gray-400 mr-2" />

        <Link
          href={`/dashboard/notes/${note.id}`}
          className="flex-1 py-3 text-sm font-medium text-gray-900 hover:text-gray-600"
        >
          {note.title || 'Untitled'}
        </Link>

        <div className="flex items-center gap-2 pr-4 opacity-0 group-hover:opacity-100">
          {(note.tags ?? []).slice(0, 2).map((tag: string) => (
            <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              {tag}
            </span>
          ))}
          <span className="text-xs text-gray-400">{formatDate(note.updated_at)}</span>
          <Link
            href={`/dashboard/notes/new?parentId=${note.id}&topicId=${topicId}`}
            title="Add sub-note"
            className="text-gray-400 hover:text-gray-700"
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {expanded &&
        hasChildren &&
        note.children.map((child) => (
          <NoteRow key={child.id} note={child} depth={depth + 1} topicId={topicId} />
        ))}
    </>
  )
}

export default function TopicNoteTree({ notes, topicId }: Props) {
  return (
    <div>
      {notes.map((note) => (
        <NoteRow key={note.id} note={note} depth={0} topicId={topicId} />
      ))}
    </div>
  )
}
