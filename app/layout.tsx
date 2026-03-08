import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dendrite – Note-taking with branches',
  description: 'A git-like versioned note-taking app with topic trees and AI summarization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
