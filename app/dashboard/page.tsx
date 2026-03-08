import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user!.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Notes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{notes?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Topics</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{topics?.length ?? 0}</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Notes</h2>
          <Link href="/dashboard/notes/new" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            + New note
          </Link>
        </div>
        {notes && notes.length > 0 ? (
          <div className="space-y-2">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/dashboard/notes/${note.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-400 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{note.title || 'Untitled'}</p>
                  {note.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {note.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400">{formatDate(note.updated_at)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500 mb-3">No notes yet</p>
            <Link href="/dashboard/notes/new" className="text-sm text-gray-900 font-medium hover:underline">
              Create your first note
            </Link>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Topics</h2>
          <Link href="/dashboard/topics/new" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            + New topic
          </Link>
        </div>
        {topics && topics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/dashboard/topics/${topic.id}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-400 transition-colors"
              >
                <p className="font-medium text-gray-900">{topic.name}</p>
                {topic.description && (
                  <p className="text-sm text-gray-500 mt-1 truncate">{topic.description}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500 mb-3">No topics yet</p>
            <Link href="/dashboard/topics/new" className="text-sm text-gray-900 font-medium hover:underline">
              Create your first topic
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
