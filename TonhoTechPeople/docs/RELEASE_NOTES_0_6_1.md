# TONHO TECH People Web 0.6.1

## Login seguro

- O usuário informa apenas nome de usuário e senha.
- Nenhuma lista de contas é exibida.
- A aplicação resolve internamente o e-mail do Supabase Auth.
- Contas inativas não conseguem entrar.
- Usuários marcados como primeiro acesso devem trocar a senha antes de abrir o sistema.

## Implantação

1. Execute `database/migrations/007_login_username_and_first_access.sql`.
2. Substitua os arquivos do projeto pela versão 0.6.1.
3. Rode `npm install` e `npm run build`.
4. Faça commit e push para o GitHub.
5. Aguarde o deploy automático do Cloudflare Pages.
