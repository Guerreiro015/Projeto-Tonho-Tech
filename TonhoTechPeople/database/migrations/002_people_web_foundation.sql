-- TONHO TECH People Web - Cloud Foundation
-- Execute no SQL Editor do Supabase se ainda não tiver as tabelas base.

create table if not exists regionais (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean default true,
  criado_em timestamp default now()
);

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  usuario text not null unique,
  perfil text not null check (perfil in ('ADMIN', 'RHDP', 'SUPORTE')),
  regional_id uuid references regionais(id),
  regional_nome text,
  pin text default '1234',
  ativo boolean default true,
  ultimo_acesso timestamp,
  criado_em timestamp default now()
);

create table if not exists colaboradores (
  id uuid primary key default gen_random_uuid(),
  matricula text unique,
  nome text not null,
  cpf text,
  cargo text,
  regional text,
  folha text,
  horario text,
  situacao text,
  admissao text,
  atualizado_em timestamp default now()
);

create table if not exists solicitacoes (
  id uuid primary key default gen_random_uuid(),
  protocolo text not null unique,
  colaborador_id uuid references colaboradores(id),
  colaborador_nome text,
  colaborador_matricula text,
  tipo text not null,
  status text default 'GERADA',
  usuario text,
  perfil text,
  regional_usuario text,
  regional_colaborador text,
  dados jsonb,
  criado_em timestamp default now()
);

insert into usuarios (nome, usuario, perfil, pin, regional_nome)
values
('Administrador', 'admin', 'ADMIN', '1234', null),
('RH/DP', 'rhdp', 'RHDP', '1234', null),
('Suporte Regional', 'suporte', 'SUPORTE', '1234', 'MATRIZ')
on conflict (usuario) do update
set nome = excluded.nome,
    perfil = excluded.perfil,
    pin = excluded.pin,
    regional_nome = excluded.regional_nome;
