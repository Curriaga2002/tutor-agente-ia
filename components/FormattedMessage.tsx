"use client"

import React from 'react'
import { processMarkdown } from '../utils/markdown'

interface FormattedMessageProps {
  text: string
  isFormatted: boolean
  className?: string
}

export function FormattedMessage({ text, isFormatted, className = "" }: FormattedMessageProps) {
  if (isFormatted) {
    return (
      <div 
        className={`prose prose-sm max-w-none break-words ${className}`}
        dangerouslySetInnerHTML={{ 
          __html: processMarkdown(text)
        }} 
      />
    )
  }

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {text}
    </div>
  )
}
