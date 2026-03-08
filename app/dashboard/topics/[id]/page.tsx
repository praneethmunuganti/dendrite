import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buildNoteTree } from '@/lib/utils'
import TopicNoteTree from './TopicNoteTree'
import { Plus } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TopicPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: topic } = await supabase.from('topics').select('*').eq('id', id).single()
  if (!topic) notFound()

  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('topic_id', id)
    .order('created_at')

  const tree = buildNoteTree(notes ?? [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{topic.name}</h1>
          {topic.description && <p className="text-gray-500 mt-1">{topic.description}</p>}
        </div>
        <Link
          href={`/dashboard/notes/new?topicId=${topic.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700"
        >
          <Plus className="w-4 h-4" />
          New Note
        </Link>
      </div>

      {tree.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 mb-3">No notes in this topic yet</p>
          <Link
            href={`/dashboard/notes/new?topicId=${topic.id}`}
            className="text-sm text-gray-900 font-medium hover:underline"
          >
            Create the first note
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <TopicNoteTree notes={tree} topicId={topic.id} />
        </div>
      )}
    </div>
  )
}
