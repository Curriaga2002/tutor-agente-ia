# 🚀 Sistema de Búsqueda Vectorial para Planeación Didáctica

## 📋 Descripción General

Este sistema implementa una búsqueda híbrida inteligente que combina **búsqueda de texto completo**, **similitud vectorial** y **filtrado por metadatos** para encontrar contenido educativo relevante en documentos PDF.

### 🎯 Caso de Uso Principal

Cuando un docente solicita: **"Plan de clase 8° sobre robótica con Arduino"**, el sistema:

1. **Crea embedding** de la consulta usando Gemini AI
2. **Busca en chunks** con:
   - Full-text search (filtra palabras clave)
   - Vector similarity (coseno sobre embeddings de 1536 dimensiones)
   - Filtrado por metadata->'grado' = 8
3. **Combina y devuelve** los top-N fragmentos más relevantes

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PDF Upload    │───▶│  PDF Processor   │───▶│  Text Chunks    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Gemini Embeddings│    │  PostgreSQL    │
                       │   (1536 dims)    │    │   + pgvector   │
                       └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Vector Search    │◀───│  Hybrid Query  │
                       │   Service        │    │   Engine       │
                       └──────────────────┘    └─────────────────┘
```

## 🔧 Componentes Principales

### 1. **PDF Processor** (`lib/pdf-processor.ts`)
- Extrae texto de PDFs usando `pdf-parse` y `pdf-lib`
- Divide contenido en chunks optimizados (600-1000 tokens)
- Aplica overlap de 100-200 tokens para contexto
- Preserva metadatos estructurados

### 2. **Gemini Embeddings** (`lib/gemini-embeddings.ts`)
- Genera embeddings de 1536 dimensiones usando Google Gemini
- Procesa chunks en batch para eficiencia
- Valida calidad de embeddings
- Calcula similitud de coseno

### 3. **Vector Search** (`lib/vector-search.ts`)
- Búsqueda híbrida: texto + vector + metadatos
- Fallback a búsqueda solo por texto
- Filtrado inteligente por grado, tema, tipo de documento
- Ranking combinado (40% texto + 60% vector)

### 4. **Document Indexer** (`lib/document-indexer.ts`)
- Coordina todo el proceso de indexación
- Maneja batch processing de múltiples PDFs
- Progreso en tiempo real
- Verificación de integridad

### 5. **UI Components**
- **DocumentIndexer**: Subida y procesamiento de PDFs
- **IntelligentSearch**: Búsqueda avanzada con filtros

## 🗄️ Base de Datos

### Tablas Principales

#### `documents`
```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  doc_type text CHECK (doc_type IN ('plan','revision','orientaciones','pei')),
  url text,
  created_at timestamptz DEFAULT now()
);
```

#### `chunks`
```sql
CREATE TABLE chunks (
  id bigserial PRIMARY KEY,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  content text NOT NULL,
  metadata jsonb,
  embedding vector(1536)
);
```

### Funciones SQL Clave

#### `search_educational_content()`
```sql
-- Búsqueda híbrida principal
SELECT * FROM search_educational_content(
  'Plan de clase 8° sobre robótica',
  embedding_vector,
  '8°',           -- grado_filter
  'plan',         -- doc_type_filter
  0.7,            -- match_threshold
  10              -- max_results
);
```

#### `insert_educational_document()`
```sql
-- Inserta documento completo con chunks y embeddings
SELECT insert_educational_document(
  'Título del documento',
  'plan',
  NULL,           -- url
  '8°',           -- grado
  'Robótica',     -- tema
  '2 horas',      -- duración
  3,              -- sesiones
  ARRAY['chunk1', 'chunk2'],  -- chunks
  ARRAY[embedding1, embedding2] -- embeddings
);
```

## 🚀 Instalación y Configuración

### 1. **Dependencias**
```bash
# Instalar dependencias
pnpm install

# Dependencias principales
- pdf-lib: Procesamiento de PDFs
- pdf-parse: Extracción de texto
- @supabase/supabase-js: Cliente de Supabase
- buffer: Manejo de buffers en Node.js
```

### 2. **Variables de Entorno**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. **Configuración de Base de Datos**
```bash
# Ejecutar en Supabase SQL Editor
\i sql/vector_search_functions.sql

# Verificar extensión vector
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. **Script de Configuración Automática**
```bash
# Hacer ejecutable y ejecutar
chmod +x setup-vector-search.sh
./setup-vector-search.sh
```

## 📖 Uso del Sistema

### 1. **Indexar Documentos PDF**

```typescript
import { documentIndexer } from '../lib/document-indexer'

// Configurar callback de progreso
documentIndexer.setProgressCallback((progress) => {
  console.log(`${progress.stage}: ${progress.progress}%`)
})

// Indexar un documento
const result = await documentIndexer.indexDocument(pdfBuffer, {
  doc_type: 'plan',
  grado: '8°',
  tema: 'Robótica con Arduino',
  componente: 'Tecnología e Informática',
  estrategia: 'Aprendizaje basado en proyectos',
  duracion: '2 horas',
  sesiones: 3
})
```

### 2. **Búsqueda Inteligente**

```typescript
import { vectorSearchService } from '../lib/vector-search'

// Búsqueda híbrida
const results = await vectorSearchService.searchEducationalContent({
  query: "Plan de clase 8° sobre robótica con Arduino",
  grado: "8°",
  doc_type: "plan",
  match_threshold: 0.7,
  max_results: 10
})

// Búsqueda específica por grado y tema
const plans = await vectorSearchService.searchPlans("8°", "robótica", 5)
```

### 3. **Componente de Búsqueda**

```tsx
<IntelligentSearch
  onResultsFound={(results) => {
    console.log(`${results.length} resultados encontrados`)
  }}
  context={{
    grado: "8°",
    tema: "robótica",
    doc_type: "plan"
  }}
/>
```

## 🔍 Características de Búsqueda

### **Búsqueda Híbrida**
- **Texto**: Búsqueda de palabras clave con ranking
- **Vector**: Similitud semántica usando embeddings
- **Metadatos**: Filtrado por grado, tema, tipo de documento

### **Algoritmo de Ranking**
```typescript
// Score combinado: 40% texto + 60% vector
combined_score = (text_score * 0.4) + (vector_score * 0.6)
```

### **Filtros Avanzados**
- Grado académico (8°, 9°, 10°, 11°)
- Tipo de documento (plan, revision, orientaciones, PEI)
- Umbral de similitud configurable
- Número máximo de resultados

## 📊 Monitoreo y Estadísticas

### **Estadísticas del Sistema**
```typescript
const stats = await vectorSearchService.getSearchStats()
// {
//   total_documents: 45,
//   total_chunks: 234,
//   total_embeddings: 234,
//   avg_chunks_per_doc: 5.2,
//   doc_types: ['plan', 'revision', 'orientaciones', 'pei'],
//   grados: ['8°', '9°', '10°', '11°']
// }
```

### **Verificación de Integridad**
```typescript
const integrity = await documentIndexer.verifyIndexIntegrity()
// {
//   totalDocuments: 45,
//   totalChunks: 234,
//   chunksWithEmbeddings: 234,
//   orphanedChunks: 0,
//   orphanedEmbeddings: 0
// }
```

## 🚨 Manejo de Errores

### **Fallbacks Automáticos**
1. **Error en embeddings** → Búsqueda solo por texto
2. **Error en PDF parsing** → Usar pdf-lib como fallback
3. **Error en base de datos** → Retry con delay exponencial

### **Validaciones**
- Verificación de dimensiones de embeddings (1536)
- Validación de chunks mínimos (50 caracteres, 10 palabras)
- Verificación de metadatos obligatorios

## 🔧 Optimizaciones

### **Performance**
- Procesamiento en batch para embeddings
- Índices optimizados en PostgreSQL
- Chunking inteligente con overlap
- Rate limiting para APIs externas

### **Escalabilidad**
- Arquitectura modular y extensible
- Soporte para múltiples proveedores de embeddings
- Configuración flexible de parámetros
- Logging detallado para debugging

## 🧪 Testing

### **Script de Prueba**
```bash
# Ejecutar prueba del sistema
node test-vector-search.js
```

### **Casos de Prueba**
- ✅ Extracción de texto de PDFs
- ✅ Generación de embeddings
- ✅ Búsqueda híbrida
- ✅ Filtrado por metadatos
- ✅ Fallbacks de error

## 🚀 Roadmap

### **Fase 1** ✅
- [x] Procesamiento básico de PDFs
- [x] Generación de embeddings con Gemini
- [x] Búsqueda híbrida básica
- [x] UI de indexación

### **Fase 2** 🔄
- [ ] Soporte para múltiples formatos (DOCX, TXT)
- [ ] Cache de embeddings
- [ ] Búsqueda semántica avanzada
- [ ] Analytics de uso

### **Fase 3** 📋
- [ ] Machine Learning para ranking
- [ ] Búsqueda por voz
- [ ] Recomendaciones automáticas
- [ ] Integración con LMS

## 🤝 Contribución

### **Reportar Bugs**
- Usar el sistema de issues de GitHub
- Incluir logs de error y pasos de reproducción
- Especificar versión del sistema y entorno

### **Nuevas Funcionalidades**
- Crear feature request con descripción detallada
- Incluir casos de uso y ejemplos
- Considerar impacto en performance

## 📞 Soporte

### **Documentación**
- Este README
- Comentarios en el código
- Funciones SQL documentadas

### **Comunidad**
- Issues de GitHub
- Wiki del proyecto
- Ejemplos de implementación

---

## 🎯 Resumen

Este sistema proporciona una **búsqueda inteligente y contextual** para documentos educativos, permitiendo a los docentes encontrar rápidamente planeaciones, orientaciones y recursos relevantes basándose en:

- **Contenido semántico** (embeddings vectoriales)
- **Palabras clave** (búsqueda de texto completo)
- **Metadatos estructurados** (grado, tema, tipo de documento)

La implementación es **robusta, escalable y fácil de usar**, con fallbacks automáticos y una interfaz intuitiva para la indexación y búsqueda de documentos.

**¡Sistema listo para revolucionar la búsqueda de recursos educativos! 🚀**
