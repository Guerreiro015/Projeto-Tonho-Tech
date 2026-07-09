# Changelog

## 0.4.2 - Permissões do Suporte Regional

### Alterado
- Perfil SUPORTE não vê mais a opção Importar Base no menu lateral.
- Perfil SUPORTE não vê mais a ação rápida Importar Base na Home.
- Rota Importar Base agora bloqueia acesso quando o perfil for SUPORTE.

### Segurança operacional
- Pesquisa de colaboradores filtra pela regional do usuário SUPORTE.
- Indicadores da Home do SUPORTE passam a considerar apenas sua regional e suas solicitações.
- Últimas solicitações da Home do SUPORTE mostram apenas solicitações geradas por ele.

### Observação
- Nesta fase o filtro é aplicado no frontend/serviços. Na etapa de segurança final, criaremos políticas RLS no Supabase para reforçar a regra também no banco.
