-- Funciones para búsqueda híbrida en el sistema de planeación didáctica
-- Combina búsqueda de texto completo, similitud vectorial y filtrado por metadatos

-- 1. Función principal de búsqueda híbrida
CREATE OR REPLACE FUNCTION search_educational_content(
  query_text text,
  query_embedding vector(1536),
  grado_filter text DEFAULT NULL,
  doc_type_filter text DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  chunk_id bigint,
  document_id uuid,
  title text,
  doc_type text,
  content text,
  metadata jsonb,
  text_score float,
  vector_score float,
  combined_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH text_search AS (
    -- Búsqueda de texto completo con ranking
    SELECT 
      c.id as chunk_id,
      c.document_id,
      d.title,
      d.doc_type,
      c.content,
      c.metadata,
      ts_rank(to_tsvector('spanish', c.content), plainto_tsquery('spanish', query_text)) as text_score,
      0.0 as vector_score
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    WHERE to_tsvector('spanish', c.content) @@ plainto_tsquery('spanish', query_text)
      AND (grado_filter IS NULL OR c.metadata->>'grado' = grado_filter)
      AND (doc_type_filter IS NULL OR d.doc_type = doc_type_filter)
  ),
  vector_search AS (
    -- Búsqueda vectorial con similitud de coseno
    SELECT 
      c.id as chunk_id,
      c.document_id,
      d.title,
      d.doc_type,
      c.content,
      c.metadata,
      0.0 as text_score,
      1 - (c.embedding <=> query_embedding) as vector_score
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
      AND (grado_filter IS NULL OR c.metadata->>'grado' = grado_filter)
      AND (doc_type_filter IS NULL OR d.doc_type = doc_type_filter)
  ),
  combined_results AS (
    -- Combinar resultados de ambas búsquedas
    SELECT * FROM text_search
    UNION ALL
    SELECT * FROM vector_search
  ),
  ranked_results AS (
    -- Calcular score combinado y eliminar duplicados
    SELECT 
      chunk_id,
      document_id,
      title,
      doc_type,
      content,
      metadata,
      MAX(text_score) as text_score,
      MAX(vector_score) as vector_score,
      -- Score combinado: 40% texto + 60% vector
      (MAX(text_score) * 0.4 + MAX(vector_score) * 0.6) as combined_score
    FROM combined_results
    GROUP BY chunk_id, document_id, title, doc_type, content, metadata
  )
  SELECT 
    chunk_id,
    document_id,
    title,
    doc_type,
    content,
    metadata,
    text_score,
    vector_score,
    combined_score
  FROM ranked_results
  ORDER BY combined_score DESC
  LIMIT max_results;
END;
$$;

-- 2. Función para búsqueda solo por texto (fallback)
CREATE OR REPLACE FUNCTION search_by_text_only(
  query_text text,
  grado_filter text DEFAULT NULL,
  doc_type_filter text DEFAULT NULL,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  chunk_id bigint,
  document_id uuid,
  title text,
  doc_type text,
  content text,
  metadata jsonb,
  text_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as chunk_id,
    c.document_id,
    d.title,
    d.doc_type,
    c.content,
    c.metadata,
    ts_rank(to_tsvector('spanish', c.content), plainto_tsquery('spanish', query_text)) as text_score
  FROM chunks c
  JOIN documents d ON c.document_id = d.id
  WHERE to_tsvector('spanish', c.content) @@ plainto_tsquery('spanish', query_text)
    AND (grado_filter IS NULL OR c.metadata->>'grado' = grado_filter)
    AND (doc_type_filter IS NULL OR d.doc_type = doc_type_filter)
  ORDER BY text_score DESC
  LIMIT max_results;
END;
$$;

-- 3. Función para búsqueda solo vectorial (fallback)
CREATE OR REPLACE FUNCTION search_by_vector_only(
  query_embedding vector(1536),
  grado_filter text DEFAULT NULL,
  doc_type_filter text DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  chunk_id bigint,
  document_id uuid,
  title text,
  doc_type text,
  content text,
  metadata jsonb,
  vector_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as chunk_id,
    c.document_id,
    d.title,
    d.doc_type,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) as vector_score
  FROM chunks c
  JOIN documents d ON c.document_id = d.id
  WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
    AND (grado_filter IS NULL OR c.metadata->>'grado' = grado_filter)
    AND (doc_type_filter IS NULL OR d.doc_type = doc_type_filter)
  ORDER BY c.embedding <=> query_embedding
  LIMIT max_results;
END;
$$;

-- 4. Función para insertar documentos con chunks y embeddings
CREATE OR REPLACE FUNCTION insert_educational_document(
  p_title text,
  p_doc_type text,
  p_url text DEFAULT NULL,
  p_grado text DEFAULT NULL,
  p_tema text DEFAULT NULL,
  p_duracion text DEFAULT NULL,
  p_sesiones int DEFAULT NULL,
  p_chunks text[],
  p_embeddings vector(1536)[]
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  doc_id uuid;
  i int;
  chunk_metadata jsonb;
BEGIN
  -- Insertar documento principal
  INSERT INTO documents (title, doc_type, url)
  VALUES (p_title, p_doc_type, p_url)
  RETURNING id INTO doc_id;
  
  -- Insertar chunks con embeddings y metadatos
  FOR i IN 1..array_length(p_chunks, 1) LOOP
    -- Crear metadatos para cada chunk
    chunk_metadata := jsonb_build_object(
      'grado', p_grado,
      'tema', p_tema,
      'duracion', p_duracion,
      'sesiones', p_sesiones,
      'chunk_index', i,
      'total_chunks', array_length(p_chunks, 1),
      'document_title', p_title,
      'document_type', p_doc_type
    );
    
    INSERT INTO chunks (document_id, content, embedding, metadata)
    VALUES (doc_id, p_chunks[i], p_embeddings[i], chunk_metadata);
  END LOOP;
  
  RETURN doc_id;
END;
$$;

-- 5. Función para obtener estadísticas de búsqueda
CREATE OR REPLACE FUNCTION get_search_stats()
RETURNS TABLE (
  total_documents bigint,
  total_chunks bigint,
  total_embeddings bigint,
  avg_chunks_per_doc numeric,
  doc_types text[],
  grados text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT d.id)::bigint as total_documents,
    COUNT(c.id)::bigint as total_chunks,
    COUNT(c.embedding)::bigint as total_embeddings,
    ROUND(AVG(chunk_count.chunk_count), 2) as avg_chunks_per_doc,
    ARRAY_AGG(DISTINCT d.doc_type) FILTER (WHERE d.doc_type IS NOT NULL) as doc_types,
    ARRAY_AGG(DISTINCT c.metadata->>'grado') FILTER (WHERE c.metadata->>'grado' IS NOT NULL) as grados
  FROM documents d
  LEFT JOIN chunks c ON d.id = c.document_id
  LEFT JOIN (
    SELECT document_id, COUNT(*) as chunk_count
    FROM chunks
    GROUP BY document_id
  ) chunk_count ON d.id = chunk_count.document_id
  GROUP BY chunk_count.chunk_count;
END;
$$;

-- 6. Índices adicionales para optimizar las búsquedas
CREATE INDEX IF NOT EXISTS idx_chunks_metadata_grado ON chunks USING GIN ((metadata->>'grado'));
CREATE INDEX IF NOT EXISTS idx_chunks_metadata_tema ON chunks USING GIN ((metadata->>'tema'));
CREATE INDEX IF NOT EXISTS idx_chunks_metadata_doc_type ON chunks USING GIN ((metadata->>'document_type'));
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Comentarios para documentación
COMMENT ON FUNCTION search_educational_content IS 'Búsqueda híbrida que combina texto completo, similitud vectorial y filtrado por metadatos';
COMMENT ON FUNCTION insert_educational_document IS 'Inserta un documento educativo con chunks, embeddings y metadatos estructurados';
COMMENT ON FUNCTION get_search_stats IS 'Obtiene estadísticas generales del sistema de búsqueda vectorial';
