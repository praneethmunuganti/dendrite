'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buildNoteTree } from '@/lib/utils'
import type { Topic, NoteWithChildren } from '@/types'
import NoteTreeItem from './NoteTreeItem'
import { LayoutDashboard, BookOpen, Plus, LogOut, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  userId: string
  userEmail: string
}

export default function Sidebar({ userId, userEmail }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [topics, setTopics] = useState<Topic[]>([])
  const [notesByTopic, setNotesByTopic] = useState<Record<string, NoteWithChildren[]>>({})
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: topicsData } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')

    if (!topicsData) return
    setTopics(topicsData)

    const { data: notesData } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')

    if (!notesData) return

    const grouped: Record<string, NoteWithChildren[]> = {}
    topicsData.forEach((t) => {
      const topicNotes = notesData.filter((n) => n.topic_id === t.id)
      grouped[t.id] = buildNoteTree(topicNotes)
    })
    setNotesByTopic(grouped)
  }, [userId, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  function toggleTopic(topicId: string) {
    setExpandedTopics((prev) => {
      const next = new Set(prev)
      if (next.has(topicId)) next.delete(topicId)
      else next.add(topicId)
      return next
    })
  }

  return (
    <aside className="w-64 flex flex-col bg-white border-r border-gray-200 h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-200">
        <Link href="/dashboard" className="text-lg font-bold text-gray-900">
          Dendrite
        </Link>
      </div>

      {/* Nav */}
      <nav className="px-2 py-3 space-y-0.5">
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            pathname === '/dashboard'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          href="/dashboard/notes/new"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            pathname === '/dashboard/notes/new'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <BookOpen className="w-4 h-4" />
          New Note
        </Link>
      </nav>

      {/* Topics & Note Tree */}
      <div className="flex-1 overflow-auto px-2 py-2">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Topics</span>
          <Link
            href="/dashboard/topics/new"
            title="New topic"
            className="text-gray-400 hover:text-gray-700"
          >
            <Plus className="w-3.5 h-3.5" />
          </Link>
        </div>

        {topics.length === 0 && (
          <p className="text-xs text-gray-400 px-3">No topics yet</p>
        )}

        {topics.map((topic) => {
          const isExpanded = expandedTopics.has(topic.id)
          const notes = notesByTopic[topic.id] ?? []
          return (
            <div key={topic.id}>
              <div className="flex items-center group">
                <button
                  onClick={() => toggleTopic(topic.id)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
                <Link
                  href={`/dashboard/topics/${topic.id}`}
                  className={cn(
                    'flex-1 px-1 py-1.5 text-sm font-medium truncate transition-colors',
                    pathname === `/dashboard/topics/${topic.id}`
                      ? 'text-gray-900'
                      : 'text-gray-700 hover:text-gray-900'
                  )}
                >
                  {topic.name}
                </Link>
                <Link
                  href={`/dashboard/notes/new?topicId=${topic.id}`}
                  title="Add note"
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700"
                >
                  <Plus className="w-3 h-3" />
                </Link>
              </div>
              {isExpanded && (
                <div className="ml-3">
                  {notes.map((note) => (
                    <NoteTreeItem key={note.id} note={note} depth={0} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* User footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
