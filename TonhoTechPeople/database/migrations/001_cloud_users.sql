-- TONHO TECH People v3.1
-- Execute no Supabase SQL Editor antes de usar login/usuários em nuvem.

alter table if exists usuarios
  add column if not exists pin text default '1234';

alter table if exists usuarios
  add column if not exists regional_nome text;

alter table if exists usuarios
  add column if not exists atualizado_em timestamp default now();

create index if not exists idx_usuarios_usuario on usuarios(usuario);
create index if not exists idx_usuarios_perfil on usuarios(perfil);
create index if not exists idx_colaboradores_matricula on colaboradores(matricula);
create index if not exists idx_solicitacoes_protocolo on solicitacoes(protocolo);
create index if not exists idx_solicitacoes_regional_usuario on solicitacoes(regional_usuario);
create index if not exists idx_solicitacoes_regional_colaborador on solicitacoes(regional_colaborador);
