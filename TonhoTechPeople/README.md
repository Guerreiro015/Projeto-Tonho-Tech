# TONHO TECH People v3.1

Primeira evolução da fase cloud.

## O que testar
1. Execute `database/migrations/001_cloud_users.sql` no Supabase.
2. Abra o sistema pelo Live Server.
3. Faça login com `Administrador • Admin` e PIN `1234`.
4. Verifique no Supabase se a tabela `usuarios` recebeu os usuários padrão.
5. Importe a base Excel e confira `colaboradores` e `regionais`.

## Perfis
- Admin
- RH/DP
- Suporte Regional

## Segurança
A anon public key é usada no frontend. Não use a service_role key no navegador.
