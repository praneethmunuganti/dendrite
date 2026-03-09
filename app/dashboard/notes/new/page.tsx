'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false })

function NewNoteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topicId = searchParams.get('topicId')
  const parentId = searchParams.get('parentId')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: user!.id,
        topic_id: topicId || null,
        parent_note_id: parentId || null,
        title: title.trim(),
        content,
        tags: tagsArray,
      })
      .select()
      .single()

    if (noteError) { setError(noteError.message); setSaving(false); return }

    // Create first version
    await supabase.from('note_versions').insert({
      note_id: note.id,
      content,
      title: title.trim(),
      version_number: 1,
      message: 'Initial version',
    })

    router.push(`/dashboard/notes/${note.id}`)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Note</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="w-full text-2xl font-bold text-gray-900 border-0 border-b border-gray-200 pb-2 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-transparent"
        />

        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma-separated, e.g. ai, research, ideas)"
          className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />

        <RichTextEditor content={content} onChange={setContent} />

        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewNotePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <NewNoteForm />
    </Suspense>
  )
}
