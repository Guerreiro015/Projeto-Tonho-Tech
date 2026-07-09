# TONHO TECH People Web 0.4.2

Versão com ajuste de permissões para o perfil **Suporte Regional**.

## Como rodar

```bash
npm install
npm run dev
```

Acesse o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

## Regras aplicadas

- **ADMIN** e **RH/DP** podem importar/carregar a base de colaboradores.
- **SUPORTE** não pode importar a base.
- **SUPORTE** pesquisa e visualiza apenas colaboradores da sua própria regional (`regional_nome`).
- **SUPORTE** vê somente suas solicitações na Home e em Minhas Solicitações.

## Próxima etapa recomendada

Criar políticas RLS no Supabase para garantir essas regras também no banco de dados.
