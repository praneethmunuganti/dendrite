import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, title } = await request.json()

  // Strip HTML tags for the AI prompt
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

  if (!plainText) {
    return NextResponse.json({ error: 'Note content is empty' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Please summarize the following note in 3-5 concise bullet points. Focus on the key ideas and takeaways.

Title: ${title}

Content:
${plainText}

Provide a clear, structured summary.`,
      },
    ],
  })

  const summary = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ summary })
}
