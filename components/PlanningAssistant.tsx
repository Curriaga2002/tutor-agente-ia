"use client"

import { useState } from "react"
import Header from "./Header"
import Navigation from "./Navigation"
import PlanningForm from "./PlanningForm"
import ResultsPanel from "./ResultsPanel"
import ResourcesBank from "./ResourcesBank"

export default function PlanningAssistant() {
  const [activeTab, setActiveTab] = useState<"generar" | "historial">("generar")
  const [currentPlanningData, setCurrentPlanningData] = useState(null)

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Header />
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "generar" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <PlanningForm currentPlanningData={currentPlanningData} setCurrentPlanningData={setCurrentPlanningData} />
            <ResultsPanel currentPlanningData={currentPlanningData} />
          </div>
        )}

        {activeTab === "historial" && (
          <ResourcesBank setActiveTab={setActiveTab} setCurrentPlanningData={setCurrentPlanningData} />
        )}
      </div>
    </div>
  )
}
