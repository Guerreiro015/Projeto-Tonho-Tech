-- ============================================================
-- TONHO TECH People Web 0.8.0 — Biblioteca RH
-- Execute após 008_access_scope_and_audit.sql.
-- ============================================================

create table if not exists public.biblioteca_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  icone text not null default '📚',
  cor text not null default 'blue',
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.biblioteca_artigos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  resumo text,
  conteudo text not null default '',
  categoria_id uuid references public.biblioteca_categorias(id) on delete set null,
  status text not null default 'RASCUNHO' check (status in ('RASCUNHO','PUBLICADO','ARQUIVADO')),
  versao integer not null default 1,
  autor_auth_id uuid references auth.users(id) on delete set null,
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_biblioteca_artigos_status on public.biblioteca_artigos(status);
create index if not exists idx_biblioteca_artigos_categoria on public.biblioteca_artigos(categoria_id);
create index if not exists idx_biblioteca_artigos_titulo on public.biblioteca_artigos(lower(titulo));

alter table public.biblioteca_categorias enable row level security;
alter table public.biblioteca_artigos enable row level security;

drop policy if exists biblioteca_categorias_select on public.biblioteca_categorias;
create policy biblioteca_categorias_select on public.biblioteca_categorias
for select to authenticated using (ativo = true or public.current_user_role() in ('ADMIN','RHDP'));

drop policy if exists biblioteca_categorias_manage on public.biblioteca_categorias;
create policy biblioteca_categorias_manage on public.biblioteca_categorias
for all to authenticated
using (public.current_user_role() in ('ADMIN','RHDP'))
with check (public.current_user_role() in ('ADMIN','RHDP'));

drop policy if exists biblioteca_artigos_select on public.biblioteca_artigos;
create policy biblioteca_artigos_select on public.biblioteca_artigos
for select to authenticated
using (status = 'PUBLICADO' or public.current_user_role() in ('ADMIN','RHDP'));

drop policy if exists biblioteca_artigos_manage on public.biblioteca_artigos;
create policy biblioteca_artigos_manage on public.biblioteca_artigos
for all to authenticated
using (public.current_user_role() in ('ADMIN','RHDP'))
with check (public.current_user_role() in ('ADMIN','RHDP'));

insert into public.biblioteca_categorias (nome, descricao, icone, cor, ordem)
values
  ('Procedimento', 'Rotinas e orientações operacionais do RH.', '📘', 'blue', 10),
  ('Benefício', 'Informações sobre benefícios corporativos.', '💙', 'green', 20),
  ('Financeiro', 'Reembolsos e orientações financeiras.', '💰', 'orange', 30),
  ('RH', 'Movimentações e rotinas de pessoas.', '👥', 'purple', 40),
  ('Documentos', 'Modelos, declarações e formulários.', '📄', 'blue', 50)
on conflict (nome) do update set
  descricao = excluded.descricao,
  icone = excluded.icone,
  cor = excluded.cor,
  ordem = excluded.ordem,
  atualizado_em = now();

insert into public.biblioteca_artigos (titulo, resumo, conteudo, categoria_id, status, publicado_em)
select x.titulo, x.resumo, x.conteudo, c.id, 'PUBLICADO', now()
from (values
  ('Vale Transporte', 'Orientações para inclusão, alteração e desistência de vale transporte.', 'Consulte as regras internas e confirme os dados do colaborador antes de abrir a solicitação. Informe endereço, linhas utilizadas e data desejada para início.'),
  ('2ª Via de Crachá', 'Quando emitir, motivos aceitos e assinatura do colaborador.', 'A segunda via deve ser solicitada quando houver perda, dano, alteração de nome ou mudança de função que exija atualização do crachá.'),
  ('Convênio Médico', 'Inclusão, exclusão de titular e dependentes, prazos e observações.', 'Confira os documentos obrigatórios e os prazos de movimentação da operadora antes de registrar a solicitação.'),
  ('Convênio Farmácia', 'Solicitação, alteração e cancelamento do convênio farmácia.', 'Valide a elegibilidade do colaborador e registre a inclusão, alteração ou cancelamento conforme o calendário do benefício.'),
  ('Reembolso', 'Autorização, dados bancários e motivo do reembolso.', 'Anexe comprovantes legíveis, informe os dados bancários do titular e descreva claramente o motivo da despesa.'),
  ('Movimentação de Local', 'Registro de alteração de local de trabalho e data de início.', 'Informe o local atual, o novo local, a data de vigência e a autorização necessária para a movimentação.'),
  ('Movimentação de Horário', 'Registro de novo horário, motivo e data de início.', 'Confirme a jornada atual, a nova jornada, o motivo da alteração e a data de vigência.'),
  ('Declaração de Residência', 'Modelo para declaração e atualização de endereço do colaborador.', 'Utilize o modelo oficial, preencha todos os campos, assine e anexe o comprovante disponível quando aplicável.')
) as x(titulo, resumo, conteudo)
join public.biblioteca_categorias c on c.nome = case
  when x.titulo in ('Vale Transporte','2ª Via de Crachá') then 'Procedimento'
  when x.titulo in ('Convênio Médico','Convênio Farmácia') then 'Benefício'
  when x.titulo = 'Reembolso' then 'Financeiro'
  when x.titulo in ('Movimentação de Local','Movimentação de Horário') then 'RH'
  else 'Documentos'
end
where not exists (
  select 1 from public.biblioteca_artigos a where lower(a.titulo) = lower(x.titulo)
);

insert into public.sistema_configuracoes (chave, valor, atualizado_em)
values ('database_version', '0.8.0', now())
on conflict (chave) do update set valor = excluded.valor, atualizado_em = now();
