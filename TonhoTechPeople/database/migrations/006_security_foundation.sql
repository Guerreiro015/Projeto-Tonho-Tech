-- ============================================================
-- TONHO TECH People Web 0.6.0 — Security Foundation
-- Execute no SQL Editor antes de publicar a versão 0.6.0.
-- Depois crie/vincule o primeiro ADMIN conforme docs/SETUP_SECURITY_0_6.md.
-- ============================================================

alter table public.usuarios add column if not exists auth_id uuid unique references auth.users(id) on delete cascade;
alter table public.usuarios add column if not exists login_email text unique;
alter table public.usuarios add column if not exists primeiro_acesso boolean not null default true;
alter table public.solicitacoes add column if not exists criado_por uuid references auth.users(id);

-- PIN deixa de ser credencial. Mantido temporariamente apenas para migração/rollback.
comment on column public.usuarios.pin is 'LEGADO: não usar para autenticação a partir da versão 0.6.0';

create or replace function public.current_user_profile()
returns public.usuarios
language sql stable security definer set search_path = public
as $$ select u from public.usuarios u where u.auth_id = auth.uid() and u.ativo = true limit 1 $$;

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public
as $$ select perfil from public.usuarios where auth_id = auth.uid() and ativo = true limit 1 $$;

create or replace function public.current_user_regional()
returns text language sql stable security definer set search_path = public
as $$ select regional_nome from public.usuarios where auth_id = auth.uid() and ativo = true limit 1 $$;

revoke all on function public.current_user_profile() from public;
revoke all on function public.current_user_role() from public;
revoke all on function public.current_user_regional() from public;
grant execute on function public.current_user_profile() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_regional() to authenticated;

create or replace function public.touch_last_access()
returns void language sql security definer set search_path = public
as $$ update public.usuarios set ultimo_acesso = now() where auth_id = auth.uid() $$;

create or replace function public.mark_password_changed()
returns void language sql security definer set search_path = public
as $$ update public.usuarios set primeiro_acesso = false where auth_id = auth.uid() $$;

grant execute on function public.touch_last_access() to authenticated;
grant execute on function public.mark_password_changed() to authenticated;

alter table public.usuarios enable row level security;
alter table public.colaboradores enable row level security;
alter table public.regionais enable row level security;
alter table public.solicitacoes enable row level security;

-- Remove policies permissivas anteriores.
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname='public' and tablename in ('usuarios','colaboradores','regionais','solicitacoes') loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- PERFIS / USUÁRIOS
create policy usuarios_self_select on public.usuarios for select to authenticated
using (auth_id = auth.uid() or public.current_user_role() = 'ADMIN');
-- Criação/alteração administrativa é feita pela Edge Function com service_role.

-- REGIONAIS
create policy regionais_authenticated_select on public.regionais for select to authenticated using (true);
create policy regionais_management_all on public.regionais for all to authenticated
using (public.current_user_role() in ('ADMIN','RHDP')) with check (public.current_user_role() in ('ADMIN','RHDP'));

-- COLABORADORES
create policy colaboradores_select_by_scope on public.colaboradores for select to authenticated
using (
  public.current_user_role() in ('ADMIN','RHDP')
  or (public.current_user_role() = 'SUPORTE' and regional = public.current_user_regional())
);
create policy colaboradores_import_insert on public.colaboradores for insert to authenticated
with check (public.current_user_role() in ('ADMIN','RHDP'));
create policy colaboradores_import_update on public.colaboradores for update to authenticated
using (public.current_user_role() in ('ADMIN','RHDP'))
with check (public.current_user_role() in ('ADMIN','RHDP'));

-- SOLICITAÇÕES
create policy solicitacoes_select_by_scope on public.solicitacoes for select to authenticated
using (
  public.current_user_role() in ('ADMIN','RHDP')
  or (public.current_user_role() = 'SUPORTE' and criado_por = auth.uid())
);
create policy solicitacoes_insert_authenticated on public.solicitacoes for insert to authenticated
with check (
  criado_por = auth.uid()
  and (
    public.current_user_role() in ('ADMIN','RHDP')
    or (public.current_user_role() = 'SUPORTE' and regional_colaborador = public.current_user_regional())
  )
);
create policy solicitacoes_update_management on public.solicitacoes for update to authenticated
using (public.current_user_role() in ('ADMIN','RHDP'))
with check (public.current_user_role() in ('ADMIN','RHDP'));

create index if not exists idx_usuarios_auth_id on public.usuarios(auth_id);
create index if not exists idx_solicitacoes_criado_por on public.solicitacoes(criado_por);

insert into public.sistema_configuracoes (chave, valor, atualizado_em)
values ('database_version', '0.6.0', now())
on conflict (chave) do update set valor=excluded.valor, atualizado_em=now();
