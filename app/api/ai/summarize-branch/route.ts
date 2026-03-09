import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildNoteTree, collectBranchNotes } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { noteId } = await request.json()

    const { data: rootNote } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single()

    if (!rootNote) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    const { data: topicNotes } = await supabase
      .from('notes')
      .select('*')
      .eq('topic_id', rootNote.topic_id)
      .eq('user_id', user.id)

    const tree = buildNoteTree(topicNotes ?? [])

    const findNode = (nodes: ReturnType<typeof buildNoteTree>, id: string): ReturnType<typeof buildNoteTree>[0] | null => {
      for (const node of nodes) {
        if (node.id === id) return node
        const found = findNode(node.children, id)
        if (found) return found
      }
      return null
    }

    const rootNode = findNode(tree, noteId)
    if (!rootNode) return NextResponse.json({ error: 'Node not found in tree' }, { status: 404 })

    const branchNotes = collectBranchNotes(rootNode)

    const combinedText = branchNotes
      .map((n) => {
        const plain = n.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        return `## ${n.title}\n${plain}`
      })
      .join('\n\n')

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured in environment variables' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are summarizing a branch of related notes. Below are ${branchNotes.length} notes from a topic tree. Please create a comprehensive overview that captures the key themes, insights, and connections across all these notes.

${combinedText}

Provide a structured summary with:
1. A brief overview paragraph
2. Key themes and ideas
3. Notable connections between notes`,
        },
      ],
    })

    const summary = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
