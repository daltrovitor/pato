-- Remove a politica antiga
drop policy if exists "Permitir leitura/escrita para chaves autorizadas" on public.passwords;

-- Cria a nova que abrange todo mundo (ou logado ou deslogado)
create policy "Permitir full access"
  on public.passwords
  as permissive for all
  using (true)
  with check (true);
