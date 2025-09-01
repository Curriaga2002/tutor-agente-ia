interface ResultsPanelProps {
  currentPlanningData: any
}

export default function ResultsPanel({ currentPlanningData }: ResultsPanelProps) {
  if (!currentPlanningData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Resultado de la Planeación</h2>
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📚</div>
          <p>Complete el formulario y haga clic en "Generar Planeación" para ver los resultados aquí.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Resultado de la Planeación</h2>

      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
        <p className="text-green-800 text-sm">✅ Planeación generada exitosamente</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
          {JSON.stringify(currentPlanningData, null, 2)}
        </pre>
      </div>
    </div>
  )
}
