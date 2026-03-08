import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import NoteEditor from './NoteEditor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NotePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: note } = await supabase
    .from('notes')
    .select('*, topic:topics(*)')
    .eq('id', id)
    .single()

  if (!note) notFound()

  const { data: versions } = await supabase
    .from('note_versions')
    .select('*')
    .eq('note_id', id)
    .order('version_number', { ascending: false })

  const { data: childNotes } = await supabase
    .from('notes')
    .select('*')
    .eq('parent_note_id', id)

  return (
    <NoteEditor
      note={note}
      versions={versions ?? []}
      childNotes={childNotes ?? []}
    />
  )
}
