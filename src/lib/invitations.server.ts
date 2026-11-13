import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { db } from './db.server';
import { env } from './env.server';
import { hashToken, makeToken } from './tokens';
import { ADMIN_PAGE_SIZE, paginationForTotal } from './pagination';
import type { InvitationListFilters } from './admin-management';
import type { Locale } from './i18n';

export type ResponseStatus = 'pending' | 'yes' | 'no';
export type BusRoute = 'outbound' | 'return' | 'both';
export interface Guest {
  id: string; invitation_id: string; name: string; response: ResponseStatus;
  allergies: string; observations: string; bus_seat: boolean | null; bus_route: BusRoute | null; food_data_consent: boolean;
  responded_at: Date | null;
}
export interface Invitation {
  id: string; addressee: string; email: string | null; personal_note: string | null; personal_note_uk: string | null;
  group_id: string | null; locale: Locale;
  token_encrypted: string; sent_at: Date | null; revoked_at: Date | null;
  created_at: Date; guests: Guest[];
}
export interface Settings { rsvp_enabled: boolean; rsvp_deadline: string | null }
export interface InvitationGroup { id: string; name: string; locale: Locale }

function key() {
  const value = env('INVITATION_LINK_KEY');
  if (!value) throw new Error('INVITATION_LINK_KEY is required');
  const bytes = Buffer.from(value, 'base64');
  if (bytes.length !== 32) throw new Error('INVITATION_LINK_KEY must be 32 base64-encoded bytes');
  return bytes;
}

function encrypt(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
}
export function invitationToken(value: string) {
  const bytes = Buffer.from(value, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8');
}

const invitationColumns = 'id, addressee, email, personal_note, personal_note_uk, group_id, locale, token_encrypted, sent_at, revoked_at, created_at';
export async function listGroups() {
  return (await db().query<InvitationGroup>('select id, name, locale from wedding.invitation_groups order by name')).rows;
}
export async function ensureValenciaGroup() {
  await db().query("insert into wedding.invitation_groups (name, locale) values ('Valencia', 'es') on conflict (name) do nothing");
}
export async function createGroup(name: string, locale: Locale) {
  await db().query('insert into wedding.invitation_groups (name, locale) values ($1, $2)', [name, locale]);
}
export async function updateGroup(id: string, name: string, locale: Locale) {
  const client = await db().connect();
  try {
    await client.query('begin');
    const result = await client.query('update wedding.invitation_groups set name=$2, locale=$3 where id=$1', [id, name, locale]);
    if (!result.rowCount) throw new Error('No hem trobat el grup.');
    await client.query('update wedding.invitations set locale=$2, updated_at=now() where group_id=$1', [id, locale]);
    await client.query('commit');
  } catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
}
async function attachGuests<T extends Omit<Invitation, 'guests'>>(rows: T[]): Promise<(T & { guests: Guest[] })[]> {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const guests = (await db().query<Guest>('select id, invitation_id, name, response, allergies, observations, bus_seat, bus_route, food_data_consent, responded_at from wedding.guests where invitation_id = any($1::uuid[]) order by invitation_id, sort_order, created_at, id', [ids])).rows;
  const byInvitation = new Map<string, Guest[]>();
  for (const guest of guests) {
    const group = byInvitation.get(guest.invitation_id) ?? [];
    group.push(guest);
    byInvitation.set(guest.invitation_id, group);
  }
  return rows.map((row) => ({ ...row, guests: byInvitation.get(row.id) ?? [] }));
}

export async function listInvitations() {
  const rows = (await db().query<Omit<Invitation, 'guests'>>(`select ${invitationColumns} from wedding.invitations order by created_at desc, id`)).rows;
  return attachGuests(rows);
}
export type AdminRevisionScope = 'list' | 'groups' | 'settings' | 'detail';
const groupsDigest = "(select coalesce(md5(string_agg(id::text || ':' || name || ':' || locale, '|' order by id)), '') from wedding.invitation_groups)";
export async function adminDataRevision(scope: AdminRevisionScope, invitationId?: string) {
  const invitationRevision = "(select count(*)::text || ':' || coalesce(max(updated_at)::text, '') from wedding.invitations)";
  const guestRevision = "(select count(*)::text || ':' || coalesce(max(updated_at)::text, '') from wedding.guests)";
  let expression: string;
  let values: string[] = [];
  if (scope === 'list') expression = `md5(${invitationRevision} || '|' || ${guestRevision} || '|' || ${groupsDigest})`;
  else if (scope === 'groups') expression = `md5(${groupsDigest})`;
  else if (scope === 'settings') expression = "coalesce((select updated_at::text from wedding.settings where id=true), '')";
  else {
    if (!invitationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invitationId)) throw new Error('Invalid invitation ID');
    expression = `md5(coalesce((select updated_at::text from wedding.invitations where id=$1), 'missing')
      || '|' || (select count(*)::text || ':' || coalesce(max(updated_at)::text, '') from wedding.guests where invitation_id=$1)
      || '|' || ${groupsDigest})`;
    values = [invitationId];
  }
  const result = await db().query<{ revision: string }>(`select ${expression} as revision`, values);
  return result.rows[0]?.revision ?? '';
}
export async function listInvitationsPage(filters: InvitationListFilters, rawPage: string | null) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  const parameter = (value: unknown) => { values.push(value); return `$${values.length}`; };

  if (filters.search) {
    const search = parameter(filters.search.toLocaleLowerCase('ca-ES'));
    conditions.push(`(strpos(lower(i.addressee), ${search}) > 0
      or strpos(lower(coalesce(i.email, '')), ${search}) > 0
      or exists (select 1 from wedding.guests search_guest where search_guest.invitation_id = i.id and strpos(lower(search_guest.name), ${search}) > 0))`);
  }
  if (filters.status === 'sent') conditions.push('i.sent_at is not null and i.revoked_at is null');
  if (filters.status === 'unsent') conditions.push('i.sent_at is null and i.revoked_at is null');
  if (filters.status === 'revoked') conditions.push('i.revoked_at is not null');
  if (filters.response !== 'all') {
    const response = parameter(filters.response);
    conditions.push(`i.revoked_at is null and exists (select 1 from wedding.guests answer where answer.invitation_id = i.id and answer.response = ${response})`);
  }
  if (filters.group === 'none') conditions.push('i.group_id is null');
  else if (filters.group !== 'all') {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.group)) conditions.push(`i.group_id = ${parameter(filters.group)}::uuid`);
    else conditions.push('false');
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const count = await db().query<{ total: string }>(`select count(*)::text as total from wedding.invitations i ${where}`, values);
  const pagination = paginationForTotal(Number(count.rows[0]?.total ?? 0), rawPage);
  const rows = (await db().query<Omit<Invitation, 'guests'> & { group_name: string | null }>(
    `select ${invitationColumns.split(', ').map((column) => `i.${column}`).join(', ')}, grp.name as group_name from wedding.invitations i left join wedding.invitation_groups grp on grp.id = i.group_id ${where} order by i.created_at desc, i.id limit $${values.length + 1} offset $${values.length + 2}`,
    [...values, ADMIN_PAGE_SIZE, pagination.offset],
  )).rows;
  return { ...pagination, items: await attachGuests(rows) };
}
export async function invitationById(id: string) {
  const rows = (await db().query<Omit<Invitation, 'guests'>>(`select ${invitationColumns} from wedding.invitations where id = $1`, [id])).rows;
  return (await attachGuests(rows))[0] ?? null;
}
export async function invitationByToken(token: string) {
  const rows = (await db().query<Omit<Invitation, 'guests'>>(`select ${invitationColumns} from wedding.invitations where token_hash = $1 and revoked_at is null`, [hashToken(token)])).rows;
  return (await attachGuests(rows))[0] ?? null;
}
export async function settings(): Promise<Settings> {
  const result = await db().query<{ rsvp_enabled: boolean; rsvp_deadline: string | null }>('select rsvp_enabled, rsvp_deadline::text from wedding.settings where id = true');
  return result.rows[0] ?? { rsvp_enabled: true, rsvp_deadline: null };
}
export function canRespond(value: Settings) {
  const todayInSpain = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return value.rsvp_enabled && (!value.rsvp_deadline || value.rsvp_deadline >= todayInSpain);
}

export async function createInvitation(input: { addressee: string; email: string | null; personalNote: string | null; personalNoteUk: string | null; groupId: string | null; locale: Locale; names: string[] }) {
  const token = makeToken();
  const client = await db().connect();
  try {
    await client.query('begin');
    let locale = input.locale;
    if (input.groupId) {
      const group = await client.query<InvitationGroup>('select id, name, locale from wedding.invitation_groups where id=$1 for share', [input.groupId]);
      if (!group.rows[0]) throw new Error('No hem trobat el grup.');
      locale = group.rows[0].locale;
    }
    const row = await client.query<{ id: string }>('insert into wedding.invitations (token_hash, token_encrypted, addressee, email, personal_note, personal_note_uk, group_id, locale) values ($1, $2, $3, $4, $5, $6, $7, $8) returning id', [hashToken(token), encrypt(token), input.addressee, input.email, input.personalNote, input.personalNoteUk, input.groupId, locale]);
    for (const [order, name] of input.names.entries()) await client.query('insert into wedding.guests (invitation_id, name, sort_order) values ($1, $2, $3)', [row.rows[0].id, name, order]);
    await client.query('commit');
    return row.rows[0].id;
  } catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
}
export async function updateInvitation(id: string, input: { addressee: string; email: string | null; personalNote: string | null; personalNoteUk: string | null; groupId: string | null; locale: Locale }) {
  const client = await db().connect();
  try {
    await client.query('begin');
    let locale = input.locale;
    if (input.groupId) {
      const group = await client.query<InvitationGroup>('select id, name, locale from wedding.invitation_groups where id=$1 for share', [input.groupId]);
      if (!group.rows[0]) throw new Error('No hem trobat el grup.');
      locale = group.rows[0].locale;
    }
    await client.query('update wedding.invitations set addressee=$2, email=$3, personal_note=$4, personal_note_uk=$5, group_id=$6, locale=$7, updated_at=now() where id=$1', [id, input.addressee, input.email, input.personalNote, input.personalNoteUk, input.groupId, locale]);
    await client.query('commit');
  } catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
}
export async function updateManagedInvitation(id: string, input: { addressee: string; groupId: string | null; email: string | null; personalNote: string | null; personalNoteUk: string | null }) {
  const client = await db().connect();
  try {
    await client.query('begin');
    const group = input.groupId ? await client.query<InvitationGroup>('select id, name, locale from wedding.invitation_groups where id=$1 for share', [input.groupId]) : null;
    if (input.groupId && !group?.rows[0]) throw new Error('No hem trobat el grup.');
    const result = await client.query('update wedding.invitations set addressee=$2, group_id=$3, locale=coalesce($4,locale), email=$5, personal_note=$6, personal_note_uk=$7, updated_at=now() where id=$1', [id, input.addressee, input.groupId, group?.rows[0].locale ?? null, input.email, input.personalNote, input.personalNoteUk]);
    if (!result.rowCount) throw new Error('No hem trobat la invitació.');
    await client.query('update wedding.guests set name=$2, updated_at=now() where invitation_id=$1 and (select count(*) from wedding.guests where invitation_id=$1)=1', [id, input.addressee]);
    await client.query('commit');
  } catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
}
export async function updateInvitationState(id: string, action: 'sent' | 'unsent' | 'revoke' | 'restore' | 'rotate') {
  if (action === 'rotate') {
    const token = makeToken();
    await db().query('update wedding.invitations set token_hash=$2, token_encrypted=$3, updated_at=now() where id=$1', [id, hashToken(token), encrypt(token)]);
  } else {
    const column = action === 'sent' || action === 'unsent' ? 'sent_at' : 'revoked_at';
    const value = action === 'sent' || action === 'revoke' ? 'now()' : 'null';
    await db().query(`update wedding.invitations set ${column}=${value}, updated_at=now() where id=$1`, [id]);
  }
}
export async function addGuest(invitationId: string, name: string) {
  await db().query('insert into wedding.guests (invitation_id, name, sort_order) select $1, $2, coalesce(max(sort_order), -1) + 1 from wedding.guests where invitation_id=$1', [invitationId, name]);
}
export async function updateGuest(id: string, invitationId: string, input: { name: string; response: ResponseStatus; allergies: string; observations: string; busSeat: boolean | null; busRoute: BusRoute | null; consent: boolean }) {
  await db().query(`update wedding.guests set name=$3, response=$4::text, allergies=$5, dietary_notes='', observations=$6, food_data_consent=$7, bus_seat=$8, bus_route=$9, responded_at=case when $4::text='pending' then null else coalesce(responded_at, now()) end, updated_at=now() where id=$1 and invitation_id=$2`, [id, invitationId, input.name, input.response, input.response === 'yes' ? input.allergies : '', input.response === 'yes' ? input.observations : '', input.response === 'yes' && input.consent, input.busSeat, input.busRoute]);
}
export async function removeGuest(id: string, invitationId: string) {
  await db().query('delete from wedding.guests where id=$1 and invitation_id=$2', [id, invitationId]);
}
export async function deleteInvitation(id: string) {
  await db().query('delete from wedding.invitations where id=$1', [id]);
}
export async function saveSettings(input: Settings) {
  await db().query('update wedding.settings set rsvp_enabled=$1, rsvp_deadline=$2, updated_at=now() where id=true', [input.rsvp_enabled, input.rsvp_deadline]);
}
export async function saveRsvp(invitationId: string, responses: { id: string; response: 'yes' | 'no'; allergies: string; busSeat: boolean | null; busRoute: BusRoute | null; consent: boolean }[]) {
  const client = await db().connect();
  try {
    await client.query('begin');
    const locked = await client.query<{ id: string }>('select id from wedding.invitations where id=$1 and revoked_at is null for update', [invitationId]);
    if (!locked.rowCount) throw new Error('La invitació no està disponible');
    const current = await client.query<{ id: string }>('select id from wedding.guests where invitation_id=$1 for update', [invitationId]);
    if (current.rowCount !== responses.length || current.rows.some(({ id }) => !responses.some((response) => response.id === id))) throw new Error('La llista de persones convidades ha canviat');
    for (const response of responses) {
      await client.query("update wedding.guests set response=$3::text, allergies=$4, dietary_notes='', observations=case when $3::text='yes' then observations else '' end, food_data_consent=$5, bus_seat=$6, bus_route=$7, responded_at=now(), updated_at=now() where id=$1 and invitation_id=$2", [response.id, invitationId, response.response, response.response === 'yes' ? response.allergies : '', response.response === 'yes' && response.consent, response.busSeat, response.busRoute]);
    }
    await client.query('commit');
  } catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
}
