-- ============================================================
-- TONHO TECH People Web 0.7.0 — Regional Scope & Audit
-- Execute após 007_login_username_and_first_access.sql.
-- ============================================================

create table if not exists public.auditoria (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  ator_auth_id uuid references auth.users(id) on delete set null,
  ator_nome text,
  ator_usuario text,
  ator_perfil text,
  acao text not null,
  entidade text,
  entidade_id text,
  detalhes jsonb not null default '{}'::jsonb
);

create index if not exists idx_auditoria_criado_em on public.auditoria(criado_em desc);
create index if not exists idx_auditoria_ator_auth_id on public.auditoria(ator_auth_id);
create index if not exists idx_auditoria_acao on public.auditoria(acao);

alter table public.auditoria enable row level security;

drop policy if exists auditoria_admin_select on public.auditoria;
create policy auditoria_admin_select on public.auditoria
for select to authenticated
using (public.current_user_role() = 'ADMIN');

-- Eventos do próprio usuário (login, troca de senha etc.).
create or replace function public.log_audit_event(
  p_acao text,
  p_entidade text default null,
  p_entidade_id text default null,
  p_detalhes jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.usuarios;
begin
  select * into v_user
  from public.usuarios
  where auth_id = auth.uid() and ativo = true
  limit 1;

  if v_user.id is null then
    raise exception 'Usuário não autorizado';
  end if;

  insert into public.auditoria (
    ator_auth_id, ator_nome, ator_usuario, ator_perfil,
    acao, entidade, entidade_id, detalhes
  ) values (
    auth.uid(), v_user.nome, v_user.usuario, v_user.perfil,
    upper(trim(p_acao)), p_entidade, p_entidade_id, coalesce(p_detalhes, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.log_audit_event(text,text,text,jsonb) from public;
grant execute on function public.log_audit_event(text,text,text,jsonb) to authenticated;

-- Suporte enxerga solicitações da sua regional. ADMIN e RH/DP enxergam todas.
drop policy if exists solicitacoes_select_by_scope on public.solicitacoes;
create policy solicitacoes_select_by_scope on public.solicitacoes
for select to authenticated
using (
  public.current_user_role() in ('ADMIN','RHDP')
  or (
    public.current_user_role() = 'SUPORTE'
    and regional_colaborador = public.current_user_regional()
  )
);

-- Mantém criação restrita à regional autorizada.
drop policy if exists solicitacoes_insert_authenticated on public.solicitacoes;
create policy solicitacoes_insert_authenticated on public.solicitacoes
for insert to authenticated
with check (
  criado_por = auth.uid()
  and (
    public.current_user_role() in ('ADMIN','RHDP')
    or (
      public.current_user_role() = 'SUPORTE'
      and regional_colaborador = public.current_user_regional()
    )
  )
);

insert into public.sistema_configuracoes (chave, valor, atualizado_em)
values ('database_version', '0.7.0', now())
on conflict (chave) do update
set valor = excluded.valor, atualizado_em = now();
