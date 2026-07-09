# Deploy no Cloudflare Pages

## 1. Repositório
Use o repositório atual do GitHub:

`Guerreiro015/Projeto-Tonho-Tech`

## 2. Configuração do Cloudflare Pages
No Cloudflare Pages, crie um projeto conectado ao GitHub.

Configurações:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** deixe vazio se o projeto React estiver na raiz. Se estiver em uma subpasta, informe o nome da subpasta.

## 3. Variáveis de ambiente
Configure em **Settings > Environment variables**:

```text
VITE_SUPABASE_URL=https://avuuryawpgvunwxjfypo.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_public_key
```

## 4. Build local de validação
Antes de publicar, rode:

```bash
npm install
npm run build
npm run preview
```

## 5. Observação de segurança
A versão 0.5.0 prepara o projeto para deploy inicial. As policies RLS ainda estão em modo de desenvolvimento controlado. Antes da produção oficial, ativaremos policies restritivas por perfil/regional usando Supabase Auth ou uma API intermediária.
