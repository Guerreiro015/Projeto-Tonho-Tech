# TONHO TECH People v3.0

**TONHO TECH**  
Software & Business Solutions

Produto: **People**  
Slogan: **Gestão Inteligente de Pessoas**

## O que há nesta versão

Esta é a primeira versão com fundação cloud usando Supabase.

Ela mantém o funcionamento local e adiciona sincronização inicial com o banco online.

## Fluxo da base Excel

1. Administrador/RH importa a planilha `QUADRO GERAL.xlsm`.
2. O sistema lê a planilha com SheetJS.
3. Os dados são salvos localmente no navegador.
4. O sistema tenta sincronizar os colaboradores com o Supabase.
5. As regionais da coluna `Folha` são registradas na tabela `regionais`.

## Tabelas esperadas no Supabase

- `regionais`
- `usuarios`
- `colaboradores`
- `solicitacoes`

## Como testar

1. Abra o projeto com Live Server.
2. Entre com usuário Administrador e PIN `1234`.
3. Importe a planilha Excel.
4. Verifique se o indicador **Nuvem** aparece como `Online`.
5. No Supabase, abra a tabela `colaboradores` e confira se os dados foram gravados.
6. Gere uma solicitação e confira a tabela `solicitacoes`.

## Modo local

Se o Supabase estiver fora do ar ou a internet falhar, o sistema continua funcionando localmente.

## Segurança

Esta versão usa a `anon public key`, própria para uso no navegador.  
Não use a `service_role key` no frontend.
