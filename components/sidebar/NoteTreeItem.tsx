'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, ChevronDown, FileText, Plus } from 'lucide-react'
import type { NoteWithChildren } from '@/types'
import { cn } from '@/lib/utils'

interface NoteTreeItemProps {
  note: NoteWithChildren
  depth: number
}

export default function NoteTreeItem({ note, depth }: NoteTreeItemProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const hasChildren = note.children.length > 0
  const isActive = pathname === `/dashboard/notes/${note.id}`

  return (
    <div>
      <div
        className={cn(
          'flex items-center group rounded-lg transition-colors',
          isActive ? 'bg-gray-100' : 'hover:bg-gray-50',
        )}
        style={{ paddingLeft: `${depth * 8}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn('p-1 text-gray-400', hasChildren ? 'hover:text-gray-700' : 'invisible')}
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        <FileText className="w-3 h-3 text-gray-400 mr-1 shrink-0" />

        <Link
          href={`/dashboard/notes/${note.id}`}
          className={cn(
            'flex-1 py-1 text-xs truncate',
            isActive ? 'text-gray-900 font-medium' : 'text-gray-600'
          )}
        >
          {note.title || 'Untitled'}
        </Link>

        <Link
          href={`/dashboard/notes/new?parentId=${note.id}&topicId=${note.topic_id}`}
          title="Add child note"
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700"
        >
          <Plus className="w-3 h-3" />
        </Link>
      </div>

      {expanded && hasChildren && (
        <div>
          {note.children.map((child) => (
            <NoteTreeItem key={child.id} note={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
