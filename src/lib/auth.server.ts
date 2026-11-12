import { createClient } from '@supabase/supabase-js';
import type { APIContext } from 'astro';
import { env } from './env.server';

function authClient() {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_PUBLISHABLE_KEY');
  if (!url || !key) throw new Error('Supabase Auth configuration is required');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const cookieOptions = (secure: boolean) => ({ httpOnly: true, secure, sameSite: 'strict' as const, path: '/', maxAge: 60 * 60 * 24 * 7 });

export async function signIn(context: APIContext, email: string, password: string) {
  const client = authClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) return false;
  if (!allowedAdmin(data.user.id)) return false;
  const secure = context.url.protocol === 'https:';
  context.cookies.set('admin_access', data.session.access_token, { ...cookieOptions(secure), maxAge: data.session.expires_in });
  context.cookies.set('admin_refresh', data.session.refresh_token, cookieOptions(secure));
  return true;
}

function allowedAdmin(id: string) {
  return (env('ADMIN_USER_IDS') || '').split(',').map((s) => s.trim()).includes(id);
}

export async function requireAdmin(context: APIContext) {
  const access = context.cookies.get('admin_access')?.value;
  const refresh = context.cookies.get('admin_refresh')?.value;
  if (!access && !refresh) return false;
  const client = authClient();
  if (access) {
    const { data } = await client.auth.getUser(access);
    if (data.user && allowedAdmin(data.user.id)) return true;
  }
  if (!refresh) return false;
  const { data, error } = await client.auth.refreshSession({ refresh_token: refresh });
  if (error || !data.session || !data.user || !allowedAdmin(data.user.id)) return false;
  const secure = context.url.protocol === 'https:';
  context.cookies.set('admin_access', data.session.access_token, { ...cookieOptions(secure), maxAge: data.session.expires_in });
  context.cookies.set('admin_refresh', data.session.refresh_token, cookieOptions(secure));
  return true;
}

export function signOut(context: APIContext) {
  context.cookies.delete('admin_access', { path: '/' });
  context.cookies.delete('admin_refresh', { path: '/' });
}
