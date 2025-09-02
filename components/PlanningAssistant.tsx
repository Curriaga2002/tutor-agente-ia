"use client"

import React, { useState } from 'react'
import Navigation from './Navigation'
import ChatAssistant from './ChatAssistant'
import ResourcesBank from './ResourcesBank'
import AppStatus from './AppStatus'

type ActiveTab = 'generar' | 'estado' | 'historial'

export default function PlanningAssistant() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generar')
  const [currentPlanningData, setCurrentPlanningData] = useState<any>(null)
  const [chatHistory, setChatHistory] = useState<any[]>([])

  const handleChatUpdate = (messages: any[]) => {
    setChatHistory(messages)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'generar' && (
          <div className="space-y-6">
            <ChatAssistant 
              onChatUpdate={handleChatUpdate}
              currentPlanningData={currentPlanningData}
              setCurrentPlanningData={setCurrentPlanningData}
            />
          </div>
        )}
        
        {activeTab === 'estado' && (
          <div className="space-y-6">
            <AppStatus />
          </div>
        )}
        
        {activeTab === 'historial' && (
          <div className="space-y-6">
            <ResourcesBank 
              setActiveTab={setActiveTab}
              setCurrentPlanningData={setCurrentPlanningData}
            />
          </div>
        )}
      </div>
    </div>
  )
}
