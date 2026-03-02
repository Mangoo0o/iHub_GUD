-- Migration to add radio button support for questions
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS options jsonb;

-- Remove the old constraint
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_answer_type_check;

-- Add the updated constraint including 'radio'
ALTER TABLE public.questions ADD CONSTRAINT questions_answer_type_check 
CHECK (answer_type IN ('emoji', 'satisfaction', 'text', 'radio'));
