# TONHO TECH People Web — 0.5.1 Cloud Ready

Versão preparada para deploy no Cloudflare Pages.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build local

```bash
npm run build
npm run preview
```

## Cloudflare Pages

Se este projeto estiver dentro da pasta `TonhoTechPeople` no repositório GitHub, configure:

- Framework preset: `None`
- Root directory: `TonhoTechPeople`
- Build command: `npm run build`
- Build output directory: `dist`

Variáveis de ambiente:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Importante

Não envie para o GitHub:

- `node_modules/`
- `dist/`
- `.env`
- planilhas reais
- arquivos com senhas ou chaves privadas

Esses itens já estão protegidos pelo `.gitignore` desta versão.
