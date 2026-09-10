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
-- CONTROLE MANUAL DE PLANOS PELA ADMINISTRADORA NO SUPABASE:
--
-- 🆓 GRATUITO:
-- "leve gratuito" = true (ou leve_gratuito = true)
-- leve_especial = false
-- leve_vip = false
--
-- ⭐ ESPECIAL:
-- "leve gratuito" = false (ou leve_gratuito = false)
-- leve_especial = true
-- leve_vip = false
--
-- 👑 VIP:
-- "leve gratuito" = false (ou leve_gratuito = false)
-- leve_especial = false
-- leve_vip = true
--
-- O sistema respeita estritamente as alterações manuais feitas pela administradora.
-- Nenhuma sincronização automática reverte alterações manuais sem uma nova ação válida da Hotmart.
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

-- Migrações seguras caso a tabela já exista:
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS leve_gratuito BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS leve_especial BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS leve_vip BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS lia_access BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS hotmart_status TEXT DEFAULT 'gratuito';
ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS hotmart_transaction_id TEXT;

-- Suporte à coluna com espaço "leve gratuito":
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.user_entitlements ADD COLUMN IF NOT EXISTS "leve gratuito" BOOLEAN DEFAULT true;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Trigger para manter sincronizadas as colunas "leve gratuito" e leve_gratuito caso ambas existam:
CREATE OR REPLACE FUNCTION public.sync_user_entitlements_columns()
RETURNS trigger AS $$
BEGIN
  IF NEW."leve gratuito" IS NOT NULL AND NEW.leve_gratuito IS NULL THEN
    NEW.leve_gratuito := NEW."leve gratuito";
  ELSIF NEW.leve_gratuito IS NOT NULL AND NEW."leve gratuito" IS NULL THEN
    NEW."leve gratuito" := NEW.leve_gratuito;
  ELSIF NEW."leve gratuito" IS NOT NULL AND NEW.leve_gratuito IS NOT NULL THEN
    -- Se um deles foi modificado no update manual
    IF TG_OP = 'UPDATE' THEN
      IF NEW."leve gratuito" IS DISTINCT FROM OLD."leve gratuito" THEN
        NEW.leve_gratuito := NEW."leve gratuito";
      ELSIF NEW.leve_gratuito IS DISTINCT FROM OLD.leve_gratuito THEN
        NEW."leve gratuito" := NEW.leve_gratuito;
      END IF;
    END IF;
  END IF;

  -- Se o plano foi alterado para VIP manualmente, mantém plan_name e lia_access em harmonia
  IF NEW.leve_vip = true THEN
    NEW.plan_name := 'vip';
    NEW.lia_access := true;
  ELSIF NEW.leve_especial = true THEN
    NEW.plan_name := 'especial';
    NEW.lia_access := false;
  ELSIF NEW.leve_gratuito = true OR NEW."leve gratuito" = true THEN
    NEW.plan_name := 'gratuito';
    NEW.lia_access := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_user_entitlements_columns ON public.user_entitlements;
CREATE TRIGGER trg_sync_user_entitlements_columns
BEFORE INSERT OR UPDATE ON public.user_entitlements
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_entitlements_columns();

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários autenticados podem ler suas próprias permissões" ON public.user_entitlements;
CREATE POLICY "Usuários autenticados podem ler suas próprias permissões"
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR (email IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
  );

DROP POLICY IF EXISTS "Usuários autenticados podem associar seu user_id à sua compra por email" ON public.user_entitlements;
CREATE POLICY "Usuários autenticados podem associar seu user_id à sua compra por email"
  ON public.user_entitlements
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR (email IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
  )
  WITH CHECK (auth.uid() = user_id);

-- Trigger: Se já existir compra Hotmart prévia para o e-mail, associa ao novo usuário; caso contrário, cria LEVE Gratuito
CREATE OR REPLACE FUNCTION public.handle_new_user_entitlements()
RETURNS trigger AS $$
DECLARE
  existing_row_id UUID;
BEGIN
  -- 1. Verifica se já existe registro prévio (ex: webhook Hotmart antes do cadastro) para este e-mail
  SELECT id INTO existing_row_id 
  FROM public.user_entitlements 
  WHERE lower(email) = lower(NEW.email) 
  ORDER BY 
    CASE 
      WHEN leve_vip = true OR plan_name = 'vip' THEN 1
      WHEN leve_especial = true OR plan_name = 'especial' THEN 2
      ELSE 3
    END
  LIMIT 1;

  IF existing_row_id IS NOT NULL THEN
    -- Associa a compra existente ao novo usuário criado automaticamente
    UPDATE public.user_entitlements 
    SET user_id = NEW.id, updated_at = now() 
    WHERE id = existing_row_id;
  ELSE
    -- Caso não exista compra prévia, cadastra o plano LEVE Gratuito padrão
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
  END IF;

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
  treatment_preference TEXT DEFAULT 'nao_informar' CHECK (treatment_preference IN ('feminino', 'masculino', 'neutro', 'nao_informar')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Garantir que a coluna exista em tabelas de perfis já existentes sem quebrar dados
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS treatment_preference TEXT DEFAULT 'nao_informar';

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
