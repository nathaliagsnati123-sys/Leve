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
-- Planos Comerciais LEVE:
-- - 🆓 LEVE Gratuito (R$0): leve_gratuito = true (Acesso somente ao "Meu Dia")
-- - ⭐ LEVE Especial (R$49,90): leve_especial = true (Todas as áreas, exceto LEVIA)
-- - 👑 LEVE VIP (R$65,90): leve_vip = true (Todas as áreas + LEVIA)
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT,
  plan_name TEXT DEFAULT 'gratuito',
  leve_gratuito BOOLEAN DEFAULT true NOT NULL,
  leve_especial BOOLEAN DEFAULT false NOT NULL,
  leve_vip BOOLEAN DEFAULT false NOT NULL,
  lia_access BOOLEAN DEFAULT false NOT NULL,
  hotmart_status TEXT DEFAULT 'gratuito',
  hotmart_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Migrações seguras caso a tabela já exista com colunas antigas:
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS leve_gratuito BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS leve_especial BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS leve_vip BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS lia_access BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS hotmart_status TEXT DEFAULT 'gratuito';
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS hotmart_transaction_id TEXT;

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários autenticados podem ler suas próprias permissões" ON public.user_entitlements;
CREATE POLICY "Usuários autenticados podem ler suas próprias permissões"
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários autenticados podem inserir permissão gratuita inicial" ON public.user_entitlements;
CREATE POLICY "Usuários autenticados podem inserir permissão gratuita inicial"
  ON public.user_entitlements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND leve_especial = false AND leve_vip = false);

-- Trigger: Todo novo usuário cadastrado recebe automaticamente o plano LEVE Gratuito
CREATE OR REPLACE FUNCTION public.handle_new_user_entitlements()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_entitlements (
    user_id,
    email,
    plan_name,
    leve_gratuito,
    leve_especial,
    leve_vip,
    lia_access,
    hotmart_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    'gratuito',
    true,
    false,
    false,
    false,
    'gratuito'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_entitlements ON auth.users;
CREATE TRIGGER on_auth_user_created_entitlements
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_entitlements();

-- Índices para alta performance
CREATE INDEX IF NOT EXISTS idx_leve_user_data_user_id ON public.leve_user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_leve_my_life_user_category ON public.leve_my_life(user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON public.user_entitlements(user_id);

-- 5. Tabela de perfis do usuário (profiles) com preferência de tratamento
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  full_name TEXT,
  treatment_preference TEXT DEFAULT 'neutro' CHECK (treatment_preference IN ('feminino', 'masculino', 'neutro', 'nao_informar')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Garantir que a coluna exista em tabelas de perfis já existentes sem quebrar dados
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS treatment_preference TEXT DEFAULT 'neutro';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
