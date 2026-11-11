import type { APIRoute } from 'astro';
import { requireAdmin } from '../../lib/auth.server';
import { listInvitations, listGroups } from '../../lib/invitations.server';
import { localeName } from '../../lib/i18n';
export const prerender = false;
const cell = (value: unknown) => {
  const raw = String(value ?? '');
  const safe = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
};
export const GET: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return context.redirect('/admin/login', 303);
  const [invitations, groups] = await Promise.all([listInvitations(), listGroups()]);
  const rows = [['Invitació', 'Grup', 'Idioma', 'Correu', 'Enviada', 'Revocada', 'Persona convidada', 'Resposta', 'Plaça a l’autobús', 'Trajecte de l’autobús', 'Al·lèrgies i intoleràncies', 'Altres necessitats alimentàries', 'Observacions', 'Data de resposta']];
  for (const invitation of invitations) for (const guest of invitation.guests) rows.push([
    invitation.addressee, groups.find((group) => group.id === invitation.group_id)?.name ?? '', localeName[invitation.locale], invitation.email ?? '', invitation.sent_at?.toISOString() ?? '', invitation.revoked_at?.toISOString() ?? '', guest.name,
    guest.response === 'yes' ? 'Assistirà' : guest.response === 'no' ? 'No assistirà' : 'Pendent', guest.bus_seat === true ? 'Sí' : guest.bus_seat === false ? 'No' : '', guest.bus_route === 'outbound' ? 'Només anada' : guest.bus_route === 'return' ? 'Només tornada' : guest.bus_route === 'both' ? 'Anada i tornada' : '', guest.allergies, guest.dietary_notes, guest.observations, guest.responded_at?.toISOString() ?? '',
  ]);
  return new Response('\ufeff' + rows.map((row) => row.map(cell).join(',')).join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="respostes-boda.csv"', 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
};
