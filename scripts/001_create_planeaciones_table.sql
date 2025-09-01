-- Create table for storing planning data
CREATE TABLE IF NOT EXISTS public.planeaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    grado TEXT NOT NULL,
    tema TEXT NOT NULL,
    duracion TEXT NOT NULL,
    sesiones INTEGER NOT NULL,
    contenido JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.planeaciones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own planeaciones"
    ON public.planeaciones FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planeaciones"
    ON public.planeaciones FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planeaciones"
    ON public.planeaciones FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planeaciones"
    ON public.planeaciones FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_planeaciones_user_id ON public.planeaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_planeaciones_created_at ON public.planeaciones(created_at);
