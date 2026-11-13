import type { APIRoute } from 'astro';
import { requireAdmin } from '../../lib/auth.server';
import { adminDataRevision } from '../../lib/invitations.server';

export const GET: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return context.redirect('/admin/login', 303);
  const scope = context.url.searchParams.get('scope');
  if (scope !== 'list' && scope !== 'groups' && scope !== 'settings' && scope !== 'detail') return new Response('Revisió no vàlida', { status: 400 });
  const id = context.url.searchParams.get('id') ?? undefined;
  if (scope === 'detail' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id ?? '')) return new Response('Invitació no vàlida', { status: 400 });
  try {
    const revision = await adminDataRevision(scope, id);
    return new Response(JSON.stringify({ revision }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch {
    return new Response('No es poden comprovar les actualitzacions', { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
};
