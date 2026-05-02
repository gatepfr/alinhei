-- Migration 004: Job CRM
-- Adiciona suporte a CRM (gestão de candidaturas) na tabela de análises.

ALTER TABLE public.analyses
ADD COLUMN status text NOT NULL DEFAULT 'analisado',
ADD COLUMN job_title text,
ADD COLUMN company_name text;

ALTER TABLE public.analyses
ADD CONSTRAINT analyses_status_check
CHECK (status IN ('analisado', 'candidatado', 'entrevista', 'feedback', 'reprovado'));

CREATE INDEX analyses_status_idx ON public.analyses(status);
