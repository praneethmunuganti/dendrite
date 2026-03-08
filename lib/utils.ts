import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Note, NoteWithChildren } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildNoteTree(notes: Note[]): NoteWithChildren[] {
  const map = new Map<string, NoteWithChildren>()
  const roots: NoteWithChildren[] = []

  notes.forEach((note) => {
    map.set(note.id, { ...note, children: [] })
  })

  map.forEach((note) => {
    if (note.parent_note_id && map.has(note.parent_note_id)) {
      map.get(note.parent_note_id)!.children.push(note)
    } else {
      roots.push(note)
    }
  })

  return roots
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function collectBranchNotes(note: NoteWithChildren): NoteWithChildren[] {
  const result: NoteWithChildren[] = [note]
  note.children.forEach((child) => {
    result.push(...collectBranchNotes(child))
  })
  return result
}
