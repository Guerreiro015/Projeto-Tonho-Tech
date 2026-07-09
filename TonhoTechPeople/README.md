# TONHO TECH People Web

**TONHO TECH — Software & Business Solutions**  
Produto: **People — Gestão Inteligente de Pessoas**

## Versão

`0.5.0 — Deploy Ready`

## Tecnologias

- React
- Vite
- Supabase
- PostgreSQL
- SheetJS/XLSX
- Cloudflare Pages

## Instalação local

```bash
npm install
npm run dev
```

Acesse:

```text
http://localhost:5173
```

## Build

```bash
npm run build
npm run preview
```

## Variáveis de ambiente

Crie `.env` com:

```text
VITE_SUPABASE_URL=https://avuuryawpgvunwxjfypo.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_public_key
```

## Supabase

Antes de testar a versão 0.5.0, execute no SQL Editor:

```text
database/migrations/005_security_prepare_deploy.sql
```

## Deploy

Veja:

```text
docs/DEPLOY_CLOUDFLARE.md
```

## Segurança

Veja:

```text
docs/SECURITY.md
```

## Observação

A versão 0.5.0 é indicada para homologação e publicação inicial controlada. Antes da produção oficial ampla, a segurança será reforçada com Supabase Auth/JWT ou API intermediária.
