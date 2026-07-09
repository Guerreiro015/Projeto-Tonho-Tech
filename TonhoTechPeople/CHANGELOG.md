# CHANGELOG

## 0.5.1 — Cloud Ready

### Corrigido
- Removidos arquivos que não devem ir para produção: `node_modules`, `dist`, `.env`, planilhas e arquivos com senha.
- Adicionado `.gitignore` oficial do projeto.
- Adicionado `vite.config.js` para build no Cloudflare Pages.
- Revisado `package.json` com dependências estáveis e Node 20+.

### Deploy
- Root directory: `TonhoTechPeople`
- Build command: `npm run build`
- Build output directory: `dist`
- Variáveis necessárias:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
