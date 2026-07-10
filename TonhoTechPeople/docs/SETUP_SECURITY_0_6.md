# Configuração da Segurança 0.6.0

## 1. Execute a migration
No Supabase, abra **SQL Editor**, copie todo o conteúdo de `database/migrations/006_security_foundation.sql` e execute.

## 2. Crie o primeiro administrador no Supabase Auth
Em **Authentication > Users > Add user**, crie:

- Email técnico: `admin@usuarios.tonhotech.app`
- Senha: escolha uma senha forte com pelo menos 8 caracteres
- Marque o email como confirmado.

Copie o UUID do usuário criado.

## 3. Vincule o administrador à tabela pública
No SQL Editor, substitua `UUID_DO_ADMIN` e execute:

```sql
update public.usuarios
set auth_id = 'UUID_DO_ADMIN',
    login_email = 'admin@usuarios.tonhotech.app',
    usuario = 'admin',
    perfil = 'ADMIN',
    ativo = true,
    primeiro_acesso = false
where usuario = 'admin';
```

Caso a linha `admin` não exista:

```sql
insert into public.usuarios
(auth_id,nome,usuario,login_email,perfil,ativo,primeiro_acesso)
values
('UUID_DO_ADMIN','Administrador','admin','admin@usuarios.tonhotech.app','ADMIN',true,false);
```

## 4. Publique a Edge Function
Instale a Supabase CLI, faça login e vincule o projeto. Dentro da raiz do projeto:

```bash
supabase login
supabase link --project-ref avuuryawpgvunwxjfypo
supabase functions deploy admin-users
```

A Edge Function recebe automaticamente as chaves do projeto no ambiente Supabase. A chave `service_role` nunca deve ser colocada no React, no GitHub ou no Cloudflare.

## 5. Teste
1. Abra o site.
2. Digite `admin` e a senha criada no Supabase Auth.
3. Entre em **Administração**.
4. Crie um usuário Suporte com senha inicial e regional.
5. Saia e teste a nova conta.

## Regra de login
O usuário digita apenas `regional.campinas`. Internamente o sistema usa `regional.campinas@usuarios.tonhotech.app` para autenticação, sem exibir esse endereço técnico.
