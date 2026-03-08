'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import type { Note, NoteVersion } from '@/types'
import { formatDate } from '@/lib/utils'
import {
  Save, Trash2, History, ArrowLeft, ChevronDown, ChevronUp,
  Sparkles, Plus, RotateCcw, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false })

interface NoteEditorProps {
  note: Note & { topic?: { name: string } | null }
  versions: NoteVersion[]
  childNotes: Note[]
}

export default function NoteEditor({ note, versions, childNotes }: NoteEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [tags, setTags] = useState((note.tags ?? []).join(', '))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [versionMessage, setVersionMessage] = useState('')
  const [showVersions, setShowVersions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [currentVersions, setCurrentVersions] = useState<NoteVersion[]>(versions)

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const tagsArray = tags.split(',').map((t) => t.trim()).filter(Boolean)

    const { error: updateError } = await supabase
      .from('notes')
      .update({ title: title.trim(), content, tags: tagsArray, updated_at: new Date().toISOString() })
      .eq('id', note.id)

    if (updateError) { setError(updateError.message); setSaving(false); return }

    const nextVersion = (currentVersions[0]?.version_number ?? 0) + 1
    const { data: newVersion } = await supabase
      .from('note_versions')
      .insert({
        note_id: note.id,
        content,
        title: title.trim(),
        version_number: nextVersion,
        message: versionMessage || null,
      })
      .select()
      .single()

    if (newVersion) {
      setCurrentVersions([newVersion, ...currentVersions])
    }
    setVersionMessage('')
    setSuccess('Saved!')
    setTimeout(() => setSuccess(null), 2000)
    setSaving(false)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('notes').delete().eq('id', note.id)
    router.push('/dashboard')
    router.refresh()
  }

  async function handleRestore(version: NoteVersion) {
    setTitle(version.title)
    setContent(version.content)
    setShowVersions(false)
    setSuccess(`Restored to version ${version.version_number} — save to confirm.`)
    setTimeout(() => setSuccess(null), 4000)
  }

  async function handleSummarize() {
    setAiLoading(true)
    setAiSummary(null)
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title }),
      })
      const data = await res.json()
      if (data.summary) setAiSummary(data.summary)
      else setError(data.error || 'Failed to generate summary')
    } catch {
      setError('Failed to reach AI service')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSummarizeBranch() {
    setAiLoading(true)
    setAiSummary(null)
    try {
      const res = await fetch('/api/ai/summarize-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id }),
      })
      const data = await res.json()
      if (data.summary) setAiSummary(data.summary)
      else setError(data.error || 'Failed to generate summary')
    } catch {
      setError('Failed to reach AI service')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {note.topic && (
            <Link
              href={`/dashboard/topics/${note.topic_id}`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {note.topic.name}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <History className="w-4 h-4" />
            History ({currentVersions.length})
          </button>
          <button
            onClick={handleSummarize}
            disabled={aiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {aiLoading ? 'Thinking…' : 'Summarize'}
          </button>
          {childNotes.length > 0 && (
            <button
              onClick={handleSummarizeBranch}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Summarize Branch
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-gray-400 hover:text-red-600 border border-transparent hover:border-red-200 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* AI Summary */}
      {aiSummary && (
        <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> AI Summary
            </h3>
            <button onClick={() => setAiSummary(null)} className="text-purple-400 hover:text-purple-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-purple-800 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
        </div>
      )}

      {/* Version History Panel */}
      {showVersions && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Version History</h3>
            <button onClick={() => setShowVersions(false)} className="text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 max-h-64 overflow-auto">
            {currentVersions.map((v) => (
              <div key={v.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      v{v.version_number}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{v.title}</span>
                  </div>
                  {v.message && <p className="text-xs text-gray-500 mt-0.5">{v.message}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(v.created_at)}</p>
                </div>
                <button
                  onClick={() => handleRestore(v)}
                  className="flex items-center gap-1 text-xs text-gray-600 border border-gray-300 px-2 py-1 rounded hover:bg-gray-100"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="w-full text-2xl font-bold border-0 border-b border-gray-200 pb-2 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-transparent"
        />

        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma-separated)"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />

        <RichTextEditor content={content} onChange={setContent} />

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={versionMessage}
            onChange={(e) => setVersionMessage(e.target.value)}
            placeholder="Version message (optional, like a git commit message)"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Last updated: {formatDate(note.updated_at)}
        </p>
      </div>

      {/* Child Notes */}
      {childNotes.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Sub-notes ({childNotes.length})</h3>
          <div className="space-y-2">
            {childNotes.map((child) => (
              <Link
                key={child.id}
                href={`/dashboard/notes/${child.id}`}
                className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-400 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">{child.title || 'Untitled'}</span>
                <span className="text-xs text-gray-400">{formatDate(child.updated_at)}</span>
              </Link>
            ))}
          </div>
          <Link
            href={`/dashboard/notes/new?parentId=${note.id}&topicId=${note.topic_id}`}
            className="mt-2 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <Plus className="w-4 h-4" />
            Add sub-note
          </Link>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete this note?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete &ldquo;{note.title}&rdquo; and all its versions. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
