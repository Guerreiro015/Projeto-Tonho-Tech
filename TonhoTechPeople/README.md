# TONHO TECH People Web

Gestão Inteligente de Pessoas — versão Web com React, Vite e Supabase.

## Versão

0.4.0 — Administração Online

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse:

```text
http://localhost:5173
```

## Supabase

Configure o `.env`:

```env
VITE_SUPABASE_URL=https://avuuryawpgvunwxjfypo.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_PUBLIC_KEY
```

## Migration desta versão

Execute no SQL Editor do Supabase:

```text
database/migrations/004_admin_users.sql
```

## Usuários padrão

- admin / 1234 — ADMIN
- rhdp / 1234 — RH/DP
- suporte / 1234 — SUPORTE

## Novidades 0.4.0

- Administração Online de usuários.
- Criação de usuários por perfil.
- Vínculo de Suporte Regional com Regional.
- Ativar/Inativar usuários.
- Base preparada para gestão multiunidades.


## v0.4.1

Após criar uma solicitação, use o botão **Imprimir / Salvar PDF**. O navegador abrirá a janela de impressão; para salvar em PDF, escolha o destino **Salvar como PDF**.
