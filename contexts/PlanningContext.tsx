"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Planeacion, Message, PlanningState } from '../types'

interface PlanningContextType extends PlanningState {
  // Actions
  setCurrentPlanningData: (data: Planeacion | null) => void
  setChatHistory: (history: Message[]) => void
  addToChatHistory: (message: Message) => void
  clearPlanningData: () => void
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined)

interface PlanningProviderProps {
  children: ReactNode
}

export function PlanningProvider({ children }: PlanningProviderProps) {
  const [currentPlanningData, setCurrentPlanningData] = useState<Planeacion | null>(null)
  const [chatHistory, setChatHistory] = useState<Message[]>([])

  const addToChatHistory = useCallback((message: Message) => {
    setChatHistory(prev => [...prev, message])
  }, [])

  const clearPlanningData = useCallback(() => {
    setCurrentPlanningData(null)
    setChatHistory([])
  }, [])

  const value: PlanningContextType = {
    // State
    currentPlanningData,
    chatHistory,
    // Actions
    setCurrentPlanningData,
    setChatHistory,
    addToChatHistory,
    clearPlanningData
  }

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  )
}

export function usePlanning() {
  const context = useContext(PlanningContext)
  if (context === undefined) {
    throw new Error('usePlanning must be used within a PlanningProvider')
  }
  return context
}
