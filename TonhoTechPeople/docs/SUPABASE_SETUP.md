# Supabase Setup — TONHO TECH People

## Projeto

Projeto Supabase: `tonho-tech-people`

## Project URL

```text
https://avuuryawpgvunwxjfypo.supabase.co
```

## Integração

O arquivo responsável pela conexão é:

```text
services/supabase.service.js
```

## Fluxo de sincronização

```text
Excel
  ↓
SheetJS
  ↓
TONHO TECH People
  ↓
Supabase
  ↓
Tabelas: regionais, colaboradores, solicitacoes
```

## Próximos passos planejados

- Migrar usuários para Supabase.
- Criar login real com perfis online.
- Carregar colaboradores diretamente do banco para as regionais.
- Centralizar histórico e relatórios online.
