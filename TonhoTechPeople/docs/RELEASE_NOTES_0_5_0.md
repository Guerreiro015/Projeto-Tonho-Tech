# Release Notes — 0.5.0 Deploy Ready

## Objetivo
Preparar o TONHO TECH People Web para publicação inicial no Cloudflare Pages.

## Novidades

- Correção no serviço de solicitações.
- Migration `005_security_prepare_deploy.sql`.
- Documentação de deploy no Cloudflare Pages.
- Documentação de segurança.
- Ajustes de versionamento.

## Antes de publicar

1. Executar a migration 005 no Supabase.
2. Confirmar variáveis de ambiente no Cloudflare.
3. Rodar `npm run build` localmente.
4. Fazer push para o GitHub.
5. Conectar o repositório ao Cloudflare Pages.
