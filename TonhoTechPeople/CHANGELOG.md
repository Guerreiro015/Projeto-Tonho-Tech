# Changelog

## 0.6.1
- Login por nome de usuário usando resolução segura do e-mail interno.
- Compatibilidade com o administrador já criado como `admin@tonhotech.com.br`.
- Troca obrigatória de senha no primeiro acesso.
- Mensagem genérica para usuário ou senha inválidos.
- Migration `007_login_username_and_first_access.sql`.


## 0.6.0 — Security Foundation
- Login por usuário e senha, sem exposição da lista de usuários.
- Supabase Auth e restauração segura de sessão.
- Gestão de usuários exclusiva do Administrador.
- Edge Function `admin-users` para criação, edição, bloqueio e redefinição de senha.
- RLS por perfil e regional.
- Suporte Regional limitado aos colaboradores de sua regional e às próprias solicitações.
- Migration `006_security_foundation.sql` e guia de implantação.

## 0.5.1 — Cloud Ready
- Estrutura preparada para GitHub e Cloudflare Pages.
