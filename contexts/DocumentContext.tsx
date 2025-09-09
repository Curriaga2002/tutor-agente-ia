"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { PDFContent, DocumentState } from '../types'

// El sistema de documentos/bucket ha sido eliminado. Este contexto puede ser adaptado o eliminado si ya no es necesario.

const DocumentContext = createContext<DocumentState | undefined>(undefined)

export function DocumentProvider({ children }: { children: ReactNode }) {
  // Puedes dejar el estado vacío o adaptarlo según necesidades futuras
  const value: DocumentState = {
    documents: [],
    isLoading: false,
    error: null,
    documentCount: 0,
    lastUpdated: null,
    refreshDocuments: () => {},
  }
  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocumentContext() {
  const context = useContext(DocumentContext)
  if (context === undefined) {
    throw new Error('useDocumentContext must be used within a DocumentProvider')
  }
  return context
}
