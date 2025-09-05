"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { PDFContent, DocumentState } from '../types'
import { useBucketDocuments } from '../hooks/useBucketDocuments'

interface DocumentContextType extends DocumentState {
  // Actions
  refreshDocuments: () => Promise<void>
  getDocumentsByType: (type: string) => PDFContent[]
  searchDocuments: (query: string) => PDFContent[]
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

interface DocumentProviderProps {
  children: ReactNode
}

export function DocumentProvider({ children }: DocumentProviderProps) {
  const {
    documents,
    isLoading,
    error,
    refreshDocuments,
    documentCount,
    lastUpdated
  } = useBucketDocuments()

  const getDocumentsByType = useCallback((type: string): PDFContent[] => {
    return documents.filter(doc => 
      doc.doc_type.toLowerCase().includes(type.toLowerCase()) ||
      doc.title.toLowerCase().includes(type.toLowerCase())
    )
  }, [documents])

  const searchDocuments = useCallback((query: string): PDFContent[] => {
    if (!query.trim()) return documents

    const queryLower = query.toLowerCase()
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(queryLower) ||
      doc.content.toLowerCase().includes(queryLower) ||
      doc.doc_type.toLowerCase().includes(queryLower)
    )
  }, [documents])

  const value: DocumentContextType = {
    // State
    documents,
    isLoading,
    error,
    documentCount,
    lastUpdated,
    // Actions
    refreshDocuments,
    getDocumentsByType,
    searchDocuments
  }

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocuments() {
  const context = useContext(DocumentContext)
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider')
  }
  return context
}
