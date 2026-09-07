-- ====================================================================
-- LEVE - Supabase Database Schema & Row Level Security (RLS) Policies
-- ====================================================================
-- Este script configura o armazenamento de dados pessoais do usuário,
-- garantindo que NENHUM usuário consiga visualizar ou alterar dados de outros.

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela principal de dados sincronizados do usuário (LEVE completo)
CREATE TABLE IF NOT EXISTS public.leve_user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.leve_user_data ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para leve_user_data (Isolamento total por auth.uid())
DROP POLICY IF EXISTS "Usuários podem ver apenas seus próprios dados" ON public.leve_user_data;
CREATE POLICY "Usuários podem ver apenas seus próprios dados"
  ON public.leve_user_data
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios dados" ON public.leve_user_data;
CREATE POLICY "Usuários podem inserir seus próprios dados"
  ON public.leve_user_data
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON public.leve_user_data;
CREATE POLICY "Usuários podem atualizar seus próprios dados"
  ON public.leve_user_data
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem excluir seus próprios dados" ON public.leve_user_data;
CREATE POLICY "Usuários podem excluir seus próprios dados"
  ON public.leve_user_data
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Tabela dedicada para "Minha Vida" (opcional para consultas relacionais pontuais)
CREATE TABLE IF NOT EXISTS public.leve_my_life (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('books', 'movies', 'series', 'hobbies', 'places', 'dreams')),
  item_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.leve_my_life ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso restrito ao próprio dono dos itens de Minha Vida" ON public.leve_my_life;
CREATE POLICY "Acesso restrito ao próprio dono dos itens de Minha Vida"
  ON public.leve_my_life
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Tabela de permissões e planos de acesso (user_entitlements)
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  plan_name TEXT DEFAULT 'gratuito',
  leve_access BOOLEAN DEFAULT false NOT NULL,
  special_access BOOLEAN DEFAULT false NOT NULL,
  lia_access BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários autenticados podem ler suas próprias permissões" ON public.user_entitlements;
CREATE POLICY "Usuários autenticados podem ler suas próprias permissões"
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Índices para alta performance
CREATE INDEX IF NOT EXISTS idx_leve_user_data_user_id ON public.leve_user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_leve_my_life_user_category ON public.leve_my_life(user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON public.user_entitlements(user_id);
