export interface Topic {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  parent_note_id: string | null
  topic_id: string | null
  title: string
  content: string
  created_at: string
  updated_at: string
  tags: string[]
  children?: Note[]
  topic?: Topic
}

export interface NoteVersion {
  id: string
  note_id: string
  content: string
  title: string
  version_number: number
  message: string | null
  created_at: string
}

export interface NoteWithChildren extends Note {
  children: NoteWithChildren[]
}
