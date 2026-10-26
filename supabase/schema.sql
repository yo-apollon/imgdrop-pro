-- =========================================================
-- IMGDROP PRO: SUPABASE DATABASE & AUTH SCHEMA
-- Execute este script no SQL Editor do seu projeto Supabase
-- =========================================================

-- 1. Tabela de Perfis de Usuário (vinculada ao auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  api_key TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. Função e Trigger para criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_key TEXT;
BEGIN
  -- Gera uma chave de API aleatória para o desenvolvedor
  generated_key := 'itu_live_' || encode(gen_random_bytes(24), 'hex');
  
  INSERT INTO public.profiles (id, email, full_name, avatar_url, api_key, plan)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', NULL),
    generated_key,
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Tabela de Imagens
CREATE TABLE IF NOT EXISTS public.images (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  url TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  delete_token TEXT NOT NULL,
  views BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS em images
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa com o link pode visualizar os metadados da imagem
CREATE POLICY "Leitura pública de imagens" 
ON public.images FOR SELECT 
USING (true);

-- Usuários logados podem inserir imagens associadas ao seu ID
CREATE POLICY "Usuários autenticados podem inserir imagens" 
ON public.images FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Usuários logados podem apagar suas próprias imagens
CREATE POLICY "Usuários podem deletar suas próprias imagens" 
ON public.images FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Função para obter usuário pela Chave de API REST
CREATE OR REPLACE FUNCTION public.get_user_by_api_key(search_api_key TEXT)
RETURNS TABLE (user_id UUID, email TEXT, plan TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT id, p.email, p.plan
  FROM public.profiles p
  WHERE p.api_key = search_api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
