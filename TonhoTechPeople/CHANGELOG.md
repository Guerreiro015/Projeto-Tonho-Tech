# TONHO TECH People v3.0

## Cloud Foundation

### Novidades
- Primeira integração com Supabase.
- Configuração oficial do projeto `tonho-tech-people`.
- Serviço `SupabaseService` criado.
- Teste automático de conexão com a nuvem ao iniciar o sistema.
- Indicador de status da nuvem na lateral e na Home.
- Importação do Excel agora salva localmente e tenta sincronizar com a tabela `colaboradores` no Supabase.
- A coluna `Folha` continua sendo tratada como Regional/Folha.
- Regionais encontradas na base são sincronizadas com a tabela `regionais`.
- Solicitações geradas continuam funcionando localmente e também tentam ser salvas na tabela `solicitacoes`.

### Observações
- Se o Supabase estiver indisponível, o sistema continua funcionando em modo local.
- Esta versão é a primeira fundação para acesso web pelas regionais.
