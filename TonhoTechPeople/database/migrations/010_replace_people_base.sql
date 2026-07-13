-- TONHO TECH People 0.8.1
-- Substituição segura da base de colaboradores e atualização das regionais.

create or replace function public.replace_colaboradores(p_colaboradores jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_total integer := 0;
  v_regionais integer := 0;
begin
  v_role := public.current_user_role();

  if v_role not in ('ADMIN', 'RHDP') then
    raise exception 'Apenas ADMIN ou RH/DP pode substituir a base de colaboradores.';
  end if;

  if jsonb_typeof(p_colaboradores) is distinct from 'array' then
    raise exception 'A base enviada deve ser uma lista de colaboradores.';
  end if;

  if jsonb_array_length(p_colaboradores) = 0 then
    raise exception 'A base enviada está vazia.';
  end if;

  -- Solicitações antigas preservam nome e matrícula. O vínculo por UUID é removido
  -- somente para colaboradores que não existem mais na nova base.
  update public.solicitacoes s
     set colaborador_id = null
   where s.colaborador_id in (
     select c.id
       from public.colaboradores c
      where not exists (
        select 1
          from jsonb_array_elements(p_colaboradores) item
         where nullif(trim(item->>'matricula'), '') = c.matricula
      )
   );

  delete from public.colaboradores c
   where not exists (
     select 1
       from jsonb_array_elements(p_colaboradores) item
      where nullif(trim(item->>'matricula'), '') = c.matricula
   );

  insert into public.colaboradores (
    matricula, nome, cpf, cargo, regional, folha,
    horario, situacao, admissao, atualizado_em
  )
  select
    nullif(trim(item->>'matricula'), ''),
    trim(item->>'nome'),
    nullif(trim(item->>'cpf'), ''),
    nullif(trim(item->>'cargo'), ''),
    coalesce(nullif(trim(item->>'regional'), ''), 'MATRIZ'),
    coalesce(nullif(trim(item->>'folha'), ''), nullif(trim(item->>'regional'), ''), 'MATRIZ'),
    nullif(trim(item->>'horario'), ''),
    nullif(trim(item->>'situacao'), ''),
    nullif(trim(item->>'admissao'), ''),
    now()
  from jsonb_array_elements(p_colaboradores) item
  where nullif(trim(item->>'nome'), '') is not null
    and nullif(trim(item->>'matricula'), '') is not null
  on conflict (matricula) do update set
    nome = excluded.nome,
    cpf = excluded.cpf,
    cargo = excluded.cargo,
    regional = excluded.regional,
    folha = excluded.folha,
    horario = excluded.horario,
    situacao = excluded.situacao,
    admissao = excluded.admissao,
    atualizado_em = now();

  get diagnostics v_total = row_count;

  update public.regionais set ativo = false;

  insert into public.regionais (nome, ativo)
  select distinct
    coalesce(nullif(trim(item->>'regional'), ''), nullif(trim(item->>'folha'), ''), 'MATRIZ'),
    true
  from jsonb_array_elements(p_colaboradores) item
  where nullif(trim(item->>'nome'), '') is not null
  on conflict (nome) do update set ativo = true;

  select count(*) into v_regionais
    from public.regionais
   where ativo = true;

  return jsonb_build_object(
    'colaboradores', (select count(*) from public.colaboradores),
    'regionais', v_regionais,
    'processados', v_total
  );
end;
$$;

grant execute on function public.replace_colaboradores(jsonb) to authenticated;

insert into public.sistema_configuracoes (chave, valor, atualizado_em)
values ('database_version', '0.8.1', now())
on conflict (chave) do update
set valor = excluded.valor, atualizado_em = now();
