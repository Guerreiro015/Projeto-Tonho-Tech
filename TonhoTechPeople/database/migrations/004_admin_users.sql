-- TONHO TECH People Web 0.4.0
-- Administração online de usuários e regionais.

alter table usuarios
add column if not exists pin text default '1234';

alter table usuarios
add column if not exists regional_nome text;

alter table usuarios
add column if not exists ultimo_acesso timestamp;

alter table usuarios
add column if not exists ativo boolean default true;

insert into usuarios (nome, usuario, perfil, pin, regional_nome, ativo)
values
('Administrador', 'admin', 'ADMIN', '1234', null, true),
('RH/DP', 'rhdp', 'RHDP', '1234', null, true),
('Suporte Regional', 'suporte', 'SUPORTE', '1234', 'MATRIZ', true)
on conflict (usuario) do update
set
  nome = excluded.nome,
  perfil = excluded.perfil,
  pin = excluded.pin,
  regional_nome = excluded.regional_nome,
  ativo = excluded.ativo;
