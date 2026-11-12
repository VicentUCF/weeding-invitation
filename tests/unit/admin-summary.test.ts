import { describe, expect, it } from 'vitest';
import { adminSummary } from '../../src/lib/admin-summary';
import type { Guest, Invitation } from '../../src/lib/invitations.server';

const guest = (id: string, values: Partial<Guest> = {}): Guest => ({
  id, invitation_id: 'inv', name: id, response: 'pending', allergies: '', observations: '', bus_seat: null, bus_route: null, food_data_consent: false, responded_at: null, ...values,
});
const invitation = (guests: Guest[], revoked = false): Invitation => ({
  id: 'inv', addressee: 'Família', email: null, personal_note: null, personal_note_uk: null, group_id: null, locale: 'es', token_encrypted: '', sent_at: null, revoked_at: revoked ? new Date() : null, created_at: new Date(), guests,
});

describe('adminSummary', () => {
  it('counts people once for transport and excludes revoked invitations', () => {
    const result = adminSummary([
      invitation([
        guest('a', { response: 'yes', allergies: 'Nous', bus_seat: true, bus_route: 'both' }),
        guest('b', { response: 'yes', bus_seat: true, bus_route: 'outbound' }),
        guest('c', { response: 'no' }),
        guest('d'),
      ]),
      invitation([guest('e', { response: 'yes', bus_seat: true, bus_route: 'return' })], true),
    ]);
    expect(result).toMatchObject({ invited: 4, accepted: 2, declined: 1, pending: 1, allergies: 1, busOutbound: 1, busReturn: 0, busBoth: 1, busTotal: 2 });
  });
});
