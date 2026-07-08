# TONHO TECH People Web

Aplicação Web do TONHO TECH People usando React + Vite + Supabase.

## Versão atual

**0.2.0 - Workspace Web e Design System Inicial**

## Como rodar localmente

1. Instale o Node.js.
2. Abra a pasta no VS Code.
3. Execute:

```bash
npm install
npm run dev
```

4. Abra o endereço exibido no terminal, normalmente:

```text
http://localhost:5173
```

## Login padrão

- admin / 1234
- rhdp / 1234
- suporte / 1234

## Supabase

O arquivo `.env` já está configurado com a URL e anon key informadas para desenvolvimento.

Execute o script em `database/migrations/002_people_web_foundation.sql` no SQL Editor do Supabase caso ainda não tenha executado.

## Novidades da versão 0.2.0

- Home executiva conectada aos dados online.
- Central de Processos.
- Solicitações por processo configurável.
- Dossiê 360° inicial.
- Componentes reutilizáveis do Design System TONHO TECH.

## Deploy futuro

Preparado para GitHub + Cloudflare Pages.

- Comando de build: `npm run build`
- Pasta de saída: `dist`
