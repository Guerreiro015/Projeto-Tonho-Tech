import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOGIN_DOMAIN = 'usuarios.tonhotech.app';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const usernameToEmail = (username: string) => `${String(username || '').trim().toLowerCase()}@${LOGIN_DOMAIN}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Sessão não informada.' }, 401);

    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) return json({ error: 'Sessão inválida.' }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: callerProfile } = await admin.from('usuarios').select('perfil,ativo').eq('auth_id', caller.id).maybeSingle();
    if (!callerProfile || callerProfile.ativo === false || callerProfile.perfil !== 'ADMIN') return json({ error: 'Somente o Administrador pode gerenciar usuários.' }, 403);

    const body = await req.json();
    const action = body.action;

    if (action === 'create') {
      const u = body.user;
      const email = usernameToEmail(u.usuario);
      const { data: created, error } = await admin.auth.admin.createUser({
        email, password: u.senha, email_confirm: true,
        user_metadata: { nome: u.nome, usuario: u.usuario }
      });
      if (error) throw error;
      const { data, error: profileError } = await admin.from('usuarios').insert({
        auth_id: created.user.id, nome: u.nome, usuario: u.usuario, login_email: email,
        perfil: u.perfil, regional_nome: u.perfil === 'SUPORTE' ? u.regional_nome : null,
        ativo: u.ativo, primeiro_acesso: u.primeiro_acesso !== false
      }).select().single();
      if (profileError) { await admin.auth.admin.deleteUser(created.user.id); throw profileError; }
      return json({ user: data });
    }

    if (action === 'update') {
      const u = body.user;
      const email = usernameToEmail(u.usuario);
      const attrs: Record<string, unknown> = { email, email_confirm: true, user_metadata: { nome: u.nome, usuario: u.usuario }, ban_duration: u.ativo ? 'none' : '876000h' };
      if (u.senha) attrs.password = u.senha;
      const { error } = await admin.auth.admin.updateUserById(u.auth_id, attrs);
      if (error) throw error;
      const { data, error: profileError } = await admin.from('usuarios').update({
        nome: u.nome, usuario: u.usuario, login_email: email, perfil: u.perfil,
        regional_nome: u.perfil === 'SUPORTE' ? u.regional_nome : null,
        ativo: u.ativo, primeiro_acesso: u.primeiro_acesso
      }).eq('id', u.id).select().single();
      if (profileError) throw profileError;
      return json({ user: data });
    }

    if (action === 'status') {
      const { error } = await admin.auth.admin.updateUserById(body.authId, { ban_duration: body.ativo ? 'none' : '876000h' });
      if (error) throw error;
      const { error: profileError } = await admin.from('usuarios').update({ ativo: body.ativo }).eq('id', body.userId);
      if (profileError) throw profileError;
      return json({ success: true });
    }

    if (action === 'password') {
      const { error } = await admin.auth.admin.updateUserById(body.authId, { password: body.senha });
      if (error) throw error;
      await admin.from('usuarios').update({ primeiro_acesso: true }).eq('id', body.userId);
      return json({ success: true });
    }

    return json({ error: 'Ação inválida.' }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Erro interno.' }, 400);
  }
});
