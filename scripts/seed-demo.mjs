import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';

const namespace = 'wedding-invitation-demo-300-v1';
const invitationCount = 120;
const guestCount = 300;
const demoId = (kind, index) => {
  const hex = createHash('sha256').update(`${namespace}:${kind}:${index}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};
const groupIds = [demoId('group', 0), demoId('group', 1)];
const invitationIds = Array.from({ length: invitationCount }, (_, i) => demoId('invitation', i));
const firstNames = ['Marta', 'Pau', 'Laia', 'Jordi', 'Núria', 'Vicent', 'Clara', 'Sergi', 'Olena', 'Andriy', 'Kateryna', 'Dmytro', 'Iryna', 'Maksym', 'Sofia', 'Taras'];
const lastNames = ['Ferrer', 'Soler', 'Navarro', 'Martí', 'Gil', 'Vidal', 'Costa', 'Roca', 'Kovalenko', 'Shevchenko', 'Melnyk', 'Bondarenko', 'Tkachenko', 'Kravchenko'];
const allergies = ['Gluten', 'Lactosa', 'Fruits secs', 'Marisc', 'Ou', 'Sèsam'];
const observations = ['Menú vegetarià, per favor.', 'Preferisc un menú vegà.', 'Necessite accés sense escalons.', 'Vindré amb cadira de rodes.'];

function makeInvitation(i, key) {
  const token = randomBytes(32).toString('base64url');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const encrypted = Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
  const groupId = i % 10 === 0 ? null : groupIds[i % 3 === 0 ? 1 : 0];
  const locale = groupId === groupIds[1] ? 'uk' : 'es';
  const first = firstNames[(i * 7) % firstNames.length];
  const last = lastNames[(i * 5 + Math.floor(i / 14)) % lastNames.length];
  const createdAt = new Date(Date.now() - (119 - i) * 86400000);
  return {
    id: invitationIds[i], groupId, locale,
    addressee: `[DEMO ${String(i + 1).padStart(3, '0')}] ${first} ${last}`,
    email: `demo-${String(i + 1).padStart(3, '0')}@wedding.invalid`,
    note: i % 9 === 0 ? 'Ens farà molta il·lusió compartir este dia amb vosaltres.' : null,
    noteUk: i % 9 === 0 ? 'Будемо дуже раді розділити цей день із вами.' : null,
    tokenHash: createHash('sha256').update(token).digest('hex'), encrypted,
    sentAt: i % 7 === 0 ? null : new Date(createdAt.getTime() + 86400000),
    revokedAt: i % 31 === 0 ? new Date(createdAt.getTime() + 3 * 86400000) : null,
    createdAt,
  };
}

function makeGuests() {
  const guests = [];
  for (let i = 0; i < invitationCount; i++) {
    const count = i % 4 + 1;
    for (let order = 0; order < count; order++) {
      const n = guests.length;
      const response = n % 4 < 2 ? 'yes' : n % 4 === 2 ? 'no' : 'pending';
      const hasAllergy = response === 'yes' && n % 7 === 0;
      const bus = response === 'yes' ? (n % 6 === 0 ? null : n % 3 !== 0) : null;
      const route = bus === true ? ['outbound', 'return', 'both', null][n % 4] : null;
      const createdAt = new Date(Date.now() - (119 - i) * 86400000);
      guests.push({
        id: demoId('guest', n), invitationId: invitationIds[i], order,
        name: `${firstNames[(n * 3 + order) % firstNames.length]} ${lastNames[(n * 5 + i) % lastNames.length]}`,
        response, allergies: hasAllergy ? allergies[n % allergies.length] : '',
        observations: response === 'yes' && n % 11 === 0 ? observations[n % observations.length] : '',
        bus, route, consent: hasAllergy, respondedAt: response === 'pending' ? null : new Date(createdAt.getTime() + 2 * 86400000),
        createdAt,
      });
    }
  }
  if (guests.length !== guestCount) throw new Error(`Expected ${guestCount} guests, got ${guests.length}`);
  return guests;
}

async function main() {
  const mode = process.argv[2] ?? '--seed';
  if (!['--seed', '--plan', '--verify', '--cleanup'].includes(mode)) throw new Error('Use --seed, --plan, --verify or --cleanup');
  const guests = makeGuests();
  if (mode === '--plan') {
    console.log({ invitations: invitationCount, guests: guests.length, responses: guests.reduce((counts, guest) => ({ ...counts, [guest.response]: counts[guest.response] + 1 }), { yes: 0, no: 0, pending: 0 }) });
    return;
  }

  const key = Buffer.from(process.env.INVITATION_LINK_KEY ?? '', 'base64');
  if (mode !== '--cleanup' && key.length !== 32) throw new Error('INVITATION_LINK_KEY must contain 32 base64-encoded bytes');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const host = new URL(url).hostname;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(host);
  const client = new pg.Client({ connectionString: url, ssl: local ? false : { ca: readFileSync(new URL('../src/lib/prod-ca-2021.crt', import.meta.url), 'utf8'), rejectUnauthorized: true }, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    await client.query('begin');
    const existing = await client.query('select count(*)::int as count from wedding.invitations where id = any($1::uuid[])', [invitationIds]);
    if (mode === '--seed') {
      if (existing.rows[0].count) throw new Error('Demo invitations already exist. No data was added.');
      await client.query("insert into wedding.invitation_groups (id, name, locale) values ($1, 'DEMO · València', 'es'), ($2, 'DEMO · Україна', 'uk')", groupIds);
      const invitations = invitationIds.map((_, i) => makeInvitation(i, key));
      const invitationValues = invitations.flatMap((row) => [row.id, row.tokenHash, row.encrypted, row.addressee, row.email, row.note, row.noteUk, row.groupId, row.locale, row.sentAt, row.revokedAt, row.createdAt]);
      const invitationSql = invitations.map((_, i) => `(${Array.from({ length: 12 }, (_, j) => `$${i * 12 + j + 1}`).join(',')})`).join(',');
      await client.query(`insert into wedding.invitations (id, token_hash, token_encrypted, addressee, email, personal_note, personal_note_uk, group_id, locale, sent_at, revoked_at, created_at) values ${invitationSql}`, invitationValues);
      const guestValues = guests.flatMap((row) => [row.id, row.invitationId, row.order, row.name, row.response, row.allergies, row.observations, row.bus, row.route, row.consent, row.respondedAt, row.createdAt]);
      const guestSql = guests.map((_, i) => `(${Array.from({ length: 12 }, (_, j) => `$${i * 12 + j + 1}`).join(',')})`).join(',');
      await client.query(`insert into wedding.guests (id, invitation_id, sort_order, name, response, allergies, observations, bus_seat, bus_route, food_data_consent, responded_at, created_at) values ${guestSql}`, guestValues);
    } else if (mode === '--verify') {
      const result = await client.query(`select count(distinct i.id)::int as invitations, count(g.id)::int as guests,
        count(g.id) filter (where g.response = 'yes')::int as yes,
        count(g.id) filter (where g.response = 'no')::int as no,
        count(g.id) filter (where g.response = 'pending')::int as pending,
        count(g.id) filter (where g.allergies <> '')::int as allergies,
        count(g.id) filter (where g.bus_seat = true)::int as bus
        from wedding.invitations i left join wedding.guests g on g.invitation_id = i.id
        where i.id = any($1::uuid[])`, [invitationIds]);
      const counts = result.rows[0];
      if (counts.invitations !== invitationCount || counts.guests !== guestCount || counts.yes !== 150 || counts.no !== 75 || counts.pending !== 75) throw new Error(`Demo counts do not match: ${JSON.stringify(counts)}`);
      const tokenRow = await client.query('select token_hash, token_encrypted from wedding.invitations where id=$1', [invitationIds[0]]);
      const encrypted = Buffer.from(tokenRow.rows[0].token_encrypted, 'base64url');
      const decipher = createDecipheriv('aes-256-gcm', key, encrypted.subarray(0, 12));
      decipher.setAuthTag(encrypted.subarray(12, 28));
      const token = Buffer.concat([decipher.update(encrypted.subarray(28)), decipher.final()]).toString('utf8');
      if (createHash('sha256').update(token).digest('hex') !== tokenRow.rows[0].token_hash) throw new Error('Demo invitation token is invalid');
      console.log({ ...counts, sampleTokenValid: true });
    } else {
      await client.query('delete from wedding.invitations where id = any($1::uuid[])', [invitationIds]);
      await client.query('delete from wedding.invitation_groups g where g.id = any($1::uuid[]) and not exists (select 1 from wedding.invitations i where i.group_id = g.id)', [groupIds]);
    }
    await client.query('commit');
    if (mode !== '--verify') console.log(mode === '--seed' ? `Created ${invitationCount} demo invitations with ${guestCount} guests.` : `Removed ${existing.rows[0].count} demo invitations and their guests.`);
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
