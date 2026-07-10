-- ============================================================
-- TONHO TECH People Web 0.6.1
-- Login por nome de usuário + troca obrigatória no primeiro acesso
-- Execute após a migration 006_security_foundation.sql.
-- ============================================================

create or replace function public.resolve_login_email(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select login_email
  from public.usuarios
  where lower(trim(usuario)) = lower(trim(p_username))
    and ativo = true
    and login_email is not null
  limit 1
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

insert into public.sistema_configuracoes (chave, valor, atualizado_em)
values ('database_version', '0.6.1', now())
on conflict (chave) do update set valor=excluded.valor, atualizado_em=now();
