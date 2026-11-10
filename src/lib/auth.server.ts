import { createClient } from '@supabase/supabase-js';
import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import type { APIContext } from 'astro';
import { env } from './env.server';

function authClient() {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_PUBLISHABLE_KEY');
  if (!url || !key) throw new Error('Supabase Auth configuration is required');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const cookieOptions = (secure: boolean) => ({ httpOnly: true, secure, sameSite: 'strict' as const, path: '/', maxAge: 60 * 60 * 24 * 7 });

function localKey() {
  const value = env('ADMIN_SESSION_KEY');
  const bytes = Buffer.from(value || '', 'base64');
  if (bytes.length !== 32) throw new Error('ADMIN_SESSION_KEY must be 32 base64-encoded bytes');
  return bytes;
}

function localMode() {
  return Boolean(env('ADMIN_EMAIL') && env('ADMIN_PASSWORD_SALT') && env('ADMIN_PASSWORD_HASH'));
}

function localSession() {
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const body = `v1.${expires}`;
  const signature = createHmac('sha256', localKey()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function validLocalSession(value: string) {
  if (!localMode()) return false;
  const match = /^v1\.(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match || Number(match[1]) < Date.now()) return false;
  const body = `v1.${match[1]}`;
  const expected = createHmac('sha256', localKey()).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(match[2], 'base64url'));
}

export async function signIn(context: APIContext, email: string, password: string) {
  if (localMode()) {
    const salt = Buffer.from(env('ADMIN_PASSWORD_SALT') || '', 'base64');
    const stored = Buffer.from(env('ADMIN_PASSWORD_HASH') || '', 'base64');
    if (salt.length < 16 || stored.length !== 64) throw new Error('Invalid local admin password configuration');
    const candidate = scryptSync(password.slice(0, 1024), salt, 64);
    if (email.toLocaleLowerCase('en') !== env('ADMIN_EMAIL')?.toLocaleLowerCase('en') || !timingSafeEqual(candidate, stored)) return false;
    context.cookies.set('admin_local', localSession(), cookieOptions(context.url.protocol === 'https:'));
    return true;
  }
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
  const local = context.cookies.get('admin_local')?.value;
  if (local && validLocalSession(local)) return true;
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
  context.cookies.delete('admin_local', { path: '/' });
  context.cookies.delete('admin_access', { path: '/' });
  context.cookies.delete('admin_refresh', { path: '/' });
}
