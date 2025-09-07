import { PlanningAssistant } from "@/components/PlanningAssistant"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto p-4 space-y-6">
        <PlanningAssistant />
      </div>
    </div>
  )
}