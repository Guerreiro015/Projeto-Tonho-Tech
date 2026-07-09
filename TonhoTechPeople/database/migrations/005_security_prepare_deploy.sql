-- ============================================================
-- TONHO TECH People Web 0.5.0
-- Preparação de segurança para deploy
-- ============================================================
-- Observação importante:
-- Esta migration prepara colunas e índices para controle por perfil/regional.
-- O projeto ainda usa autenticação própria via tabela public.usuarios.
-- As policies permissivas abaixo mantêm o desenvolvimento funcionando.
-- Antes da produção oficial, migraremos para Supabase Auth/JWT ou Edge Functions.

alter table colaboradores enable row level security;
alter table regionais enable row level security;
alter table solicitacoes enable row level security;
alter table usuarios enable row level security;

-- Remove policies antigas desta etapa, se existirem
DROP POLICY IF EXISTS "dev_colaboradores_select" ON colaboradores;
DROP POLICY IF EXISTS "dev_colaboradores_insert" ON colaboradores;
DROP POLICY IF EXISTS "dev_colaboradores_update" ON colaboradores;
DROP POLICY IF EXISTS "dev_regionais_all" ON regionais;
DROP POLICY IF EXISTS "dev_solicitacoes_all" ON solicitacoes;
DROP POLICY IF EXISTS "dev_usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "dev_usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "dev_usuarios_update" ON usuarios;

-- Policies de desenvolvimento controlado.
-- Mantemos anon liberado para a aplicação atual funcionar no Cloudflare Pages.
-- A camada de interface já restringe Suporte Regional por regional.
CREATE POLICY "dev_colaboradores_select" ON colaboradores FOR SELECT TO anon USING (true);
CREATE POLICY "dev_colaboradores_insert" ON colaboradores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "dev_colaboradores_update" ON colaboradores FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "dev_regionais_all" ON regionais FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "dev_solicitacoes_all" ON solicitacoes FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "dev_usuarios_select" ON usuarios FOR SELECT TO anon USING (true);
CREATE POLICY "dev_usuarios_insert" ON usuarios FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "dev_usuarios_update" ON usuarios FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Índices úteis para pesquisa e relatórios
create index if not exists idx_colaboradores_matricula on colaboradores (matricula);
create index if not exists idx_colaboradores_regional on colaboradores (regional);
create index if not exists idx_colaboradores_nome on colaboradores (nome);
create index if not exists idx_solicitacoes_usuario on solicitacoes (usuario);
create index if not exists idx_solicitacoes_tipo on solicitacoes (tipo);
create index if not exists idx_solicitacoes_regional_usuario on solicitacoes (regional_usuario);
create index if not exists idx_solicitacoes_regional_colaborador on solicitacoes (regional_colaborador);
create index if not exists idx_solicitacoes_criado_em on solicitacoes (criado_em desc);

-- Controle de versão do banco
create table if not exists sistema_configuracoes (
  chave text primary key,
  valor text,
  atualizado_em timestamp default now()
);

insert into sistema_configuracoes (chave, valor, atualizado_em)
values ('database_version', '0.5.0', now())
on conflict (chave) do update set valor = excluded.valor, atualizado_em = now();
