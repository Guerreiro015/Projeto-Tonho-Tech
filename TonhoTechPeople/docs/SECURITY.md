# Segurança — TONHO TECH People Web

## Estado atual

A aplicação já possui perfis na interface:

- ADMIN
- RHDP
- SUPORTE

O perfil SUPORTE não visualiza importação de base e pesquisa apenas colaboradores da sua regional.

## RLS

Na fase atual, as policies do Supabase estão preparadas para desenvolvimento e deploy inicial, mas ainda permissivas para o papel `anon`, porque a autenticação atual é feita pela tabela `usuarios` dentro da aplicação.

## Próximo marco de segurança

Para produção oficial:

1. Migrar login para Supabase Auth ou Edge Functions.
2. Usar claims de perfil e regional no JWT.
3. Criar policies reais:
   - ADMIN: acesso total.
   - RHDP: acesso operacional completo, sem administração crítica.
   - SUPORTE: apenas colaboradores e solicitações da sua regional.
4. Criptografar PIN/senha.
5. Registrar auditoria de login, importação, alterações e documentos.

## Recomendação

A versão 0.5.0 pode ser usada para testes controlados e homologação. Para exposição pública ampla, aplicar o marco de segurança acima.
