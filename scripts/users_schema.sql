-- Tabela pública de usuários que espelha os usuários autenticados
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  nome text,
  role text default 'admin'::text,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS
alter table public.users enable row level security;

-- Política para os usuários lerem seus próprios dados
create policy "Usuários podem ver seus próprios dados"
  on public.users
  for select
  using (auth.uid() = id);

-- Trigger para inserir o usuário público quando um novo usuário se cadastrar no auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, nome)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
