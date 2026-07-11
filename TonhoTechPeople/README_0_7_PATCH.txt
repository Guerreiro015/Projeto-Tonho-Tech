TONHO TECH People 0.7.0 — Escopo Regional e Auditoria

ORDEM SEGURA:
1. No Supabase SQL Editor, execute database/migrations/008_access_scope_and_audit.sql
2. Copie a pasta src para a raiz do projeto e confirme a substituição.
3. Copie supabase/functions/admin-users/index.ts para a mesma pasta do projeto.
4. No terminal do projeto, publique a função atualizada:
   npx supabase functions deploy admin-users
5. Teste localmente:
   npm run dev
6. Valide ADMIN, RH/DP e depois um SUPORTE com regional vinculada.
7. Execute npm run build antes do commit/push.

ALTERAÇÕES:
- Menu dinâmico por perfil.
- RH/DP recebe acesso direto a Importar Base.
- Suporte recebe Pessoas, Nova Solicitação e Solicitações da Regional.
- Dashboard e saudação personalizados por horário e escopo.
- Contadores e solicitações do Suporte filtrados pela regional.
- RLS de solicitações ajustada para o escopo regional.
- Tabela de auditoria e registro de login, troca de senha e ações administrativas.

OBSERVAÇÃO:
O bloqueio por tentativas inválidas deve ser configurado depois em Authentication > Rate Limits,
pois é uma política de plataforma e não deve ser simulada apenas no navegador.
