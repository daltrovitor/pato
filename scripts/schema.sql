-- SUPABASE SQL SCHEMA FOR Pato do Lafa
-- Run this in the SQL Editor of your Supabase project

-- 1. Table structure
create table if not exists public.passwords (
  id uuid default gen_random_uuid() primary key,
  codigo text not null unique,
  nome text,
  foi_ativada boolean default false,
  criado_em timestamp with time zone default now(),
  data_expiracao timestamp with time zone
);

-- 2. Performance Indexes
create index if not exists passwords_codigo_idx on public.passwords (codigo);
create index if not exists passwords_foi_ativada_idx on public.passwords (foi_ativada);

-- 3. Security (RLS)
alter table public.passwords enable row level security;

-- Drop existing policy if necessary
drop policy if exists "Permitir full access" on public.passwords;

-- Policy that allows all operations for now (as requested previously)
-- In a production environment, you might want to restrict 'insert' and 'select all' to authenticated users
create policy "Permitir full access"
  on public.passwords
  for all
  using (true)
  with check (true);

-- Adiciona a coluna 'nome' caso ela não exista
alter table public.passwords 
add column if not exists nome text;

-- Recarrega o cache do PostgREST (Supabase) para reconhecer a nova coluna
notify pgrst, 'reload schema';
