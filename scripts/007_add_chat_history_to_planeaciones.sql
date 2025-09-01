-- Add chat history field to planeaciones table
-- This will store the complete conversation history for each planning

-- Add the chat_history column to store the complete chat conversation
ALTER TABLE planeaciones ADD COLUMN IF NOT EXISTS chat_history JSONB;

-- Add a comment to explain the field
COMMENT ON COLUMN planeaciones.chat_history IS 'Complete chat conversation history including planning generation and follow-up questions';

-- Update existing records to have an empty chat_history
UPDATE planeaciones SET chat_history = '[]'::jsonb WHERE chat_history IS NULL;

-- Create an index for better performance when querying chat history
CREATE INDEX IF NOT EXISTS idx_planeaciones_chat_history ON planeaciones USING GIN (chat_history);

-- Example of how the chat_history will be structured:
-- [
--   {
--     "id": "1",
--     "text": "🎓 ASISTENTE DE PLANEACIÓN DIDÁCTICA...",
--     "isUser": false,
--     "timestamp": "2024-01-01T10:00:00Z",
--     "isFormatted": true
--   },
--   {
--     "id": "2",
--     "text": "¿Cómo puedo hacer la planeación más interactiva?",
--     "isUser": true,
--     "timestamp": "2024-01-01T10:05:00Z",
--     "isFormatted": false
--   },
--   {
--     "id": "3",
--     "text": "Para hacer la planeación más interactiva...",
--     "isUser": false,
--     "timestamp": "2024-01-01T10:06:00Z",
--     "isFormatted": true
--   }
-- ]
