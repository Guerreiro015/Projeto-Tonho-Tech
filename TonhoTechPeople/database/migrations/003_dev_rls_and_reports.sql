-- TONHO TECH People Web 0.3.0
-- Migration de desenvolvimento para liberar acesso via anon key durante a fase inicial.
-- Execute no Supabase SQL Editor somente no ambiente de desenvolvimento.

alter table colaboradores disable row level security;
alter table regionais disable row level security;
alter table solicitacoes disable row level security;
alter table usuarios disable row level security;

-- Índices úteis para relatórios e pesquisa
create index if not exists idx_solicitacoes_criado_em on solicitacoes (criado_em desc);
create index if not exists idx_solicitacoes_tipo on solicitacoes (tipo);
create index if not exists idx_solicitacoes_regional_colaborador on solicitacoes (regional_colaborador);
create index if not exists idx_solicitacoes_usuario on solicitacoes (usuario);
create index if not exists idx_colaboradores_regional on colaboradores (regional);
