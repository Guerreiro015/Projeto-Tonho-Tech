# TONHO TECH People v3.1

## Novidades
- Login preparado para consultar usuários no Supabase.
- Sincronização automática dos usuários locais padrão para a tabela `usuarios`.
- Migration SQL para campos `pin`, `regional_nome` e índices de performance.
- Fallback local mantido: se a nuvem falhar, o sistema continua entrando pelos usuários locais.

## Observação importante
Execute `database/migrations/001_cloud_users.sql` no SQL Editor do Supabase antes de usar o login em nuvem.
