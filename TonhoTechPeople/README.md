# TONHO TECH People Web — 0.6.0 Security Foundation

Aplicação React + Vite conectada ao Supabase e publicada no Cloudflare Pages.

## Principais recursos
- Login digitando usuário e senha.
- Supabase Auth com sessão real.
- Perfis ADMIN, RH/DP e SUPORTE.
- Gestão de contas exclusiva do Administrador.
- Restrição de colaboradores por regional no próprio banco (RLS).
- Importação Excel somente para ADMIN e RH/DP.
- Solicitações, relatórios e administração online.

## Atualização obrigatória
Leia `docs/SETUP_SECURITY_0_6.md` antes de publicar. A versão exige:
1. executar `database/migrations/006_security_foundation.sql`;
2. criar/vincular o primeiro administrador no Supabase Auth;
3. publicar a Edge Function `admin-users`.

## Desenvolvimento
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Variáveis do frontend
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Nunca coloque `service_role` no frontend, GitHub ou Cloudflare Pages.
