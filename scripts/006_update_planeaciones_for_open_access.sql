-- Update planeaciones table to work without authentication
-- Remove RLS policies and make table publicly accessible

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can view their own planeaciones" ON planeaciones;
DROP POLICY IF EXISTS "Users can insert their own planeaciones" ON planeaciones;
DROP POLICY IF EXISTS "Users can update their own planeaciones" ON planeaciones;
DROP POLICY IF EXISTS "Users can delete their own planeaciones" ON planeaciones;

-- Disable RLS for open access
ALTER TABLE planeaciones DISABLE ROW LEVEL SECURITY;

-- Make user_id nullable since we're not using authentication
ALTER TABLE planeaciones ALTER COLUMN user_id DROP NOT NULL;

-- Create public access policies
CREATE POLICY "Allow public read access" ON planeaciones FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON planeaciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON planeaciones FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON planeaciones FOR DELETE USING (true);

-- Re-enable RLS with public policies
ALTER TABLE planeaciones ENABLE ROW LEVEL SECURITY;

-- Add some sample data for testing
INSERT INTO planeaciones (grado, tema, duracion, sesiones, contenido, user_id) VALUES
('8°', 'Algoritmos Básicos', '2 horas', 3, '{
  "estrategia": "Construcción-Fabricación",
  "objetivos": [
    "Comprender los conceptos fundamentales de algoritmos",
    "Aplicar lógica secuencial en la resolución de problemas",
    "Desarrollar pensamiento computacional"
  ],
  "planeacion": {
    "inicio": "Presentación de situaciones problema cotidianas",
    "desarrollo": "Construcción colaborativa de algoritmos paso a paso",
    "cierre": "Evaluación y retroalimentación de algoritmos creados"
  },
  "recursos": ["Computadores", "Papel y lápiz", "Diagramas de flujo"],
  "evidencias": ["Algoritmo escrito", "Diagrama de flujo"],
  "evaluacion": {
    "criterios": [
      {
        "criterio": "Lógica algorítmica",
        "nivel1": "Básico - Identifica pasos secuenciales",
        "nivel2": "Intermedio - Organiza pasos lógicamente",
        "nivel3": "Avanzado - Optimiza secuencias algorítmicas"
      }
    ]
  }
}', null),
('9°', 'Ecosistemas y Biodiversidad', '1 hora', 4, '{
  "estrategia": "Investigación-Exploración",
  "objetivos": [
    "Identificar componentes de un ecosistema",
    "Analizar relaciones entre organismos",
    "Valorar la importancia de la biodiversidad"
  ],
  "planeacion": {
    "inicio": "Observación de video sobre ecosistemas locales",
    "desarrollo": "Investigación grupal sobre ecosistemas colombianos",
    "cierre": "Presentación de hallazgos y conclusiones"
  },
  "recursos": ["Internet", "Material audiovisual", "Guías de campo"],
  "evidencias": ["Informe de investigación", "Presentación grupal"],
  "evaluacion": {
    "criterios": [
      {
        "criterio": "Comprensión ecológica",
        "nivel1": "Básico - Identifica componentes básicos",
        "nivel2": "Intermedio - Relaciona componentes",
        "nivel3": "Avanzado - Analiza interacciones complejas"
      }
    ]
  }
}', null);
