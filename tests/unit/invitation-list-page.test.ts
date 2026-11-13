import { beforeEach, describe, expect, it, vi } from 'vitest';

const query = vi.hoisted(() => vi.fn());
vi.mock('../../src/lib/db.server', () => ({ db: () => ({ query }) }));

import { adminDataRevision, listInvitationsPage } from '../../src/lib/invitations.server';

describe('listInvitationsPage', () => {
  beforeEach(() => query.mockReset());

  it('filters in SQL, clamps the page, and fetches guests only for returned invitations', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const group = '22222222-2222-4222-8222-222222222222';
    query
      .mockResolvedValueOnce({ rows: [{ total: '122' }] })
      .mockResolvedValueOnce({ rows: [{ id, addressee: 'Maria', group_name: 'Amics' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'guest', invitation_id: id, name: 'Maria' }] });

    const page = await listInvitationsPage({ search: "Ma'ri", status: 'sent', response: 'yes', group }, '99');

    expect(page).toMatchObject({ page: 7, pageCount: 7, total: 122, offset: 120 });
    expect(page.items[0]).toMatchObject({ id, group_name: 'Amics', guests: [{ id: 'guest' }] });
    expect(query).toHaveBeenCalledTimes(3);
    expect(query.mock.calls[0][0]).toContain('select count(*)');
    expect(query.mock.calls[0][0]).toContain('exists (select 1 from wedding.guests');
    expect(query.mock.calls[1][0]).toContain('limit $4 offset $5');
    expect(query.mock.calls[1][1]).toEqual(["ma'ri", 'yes', group, 20, 120]);
    expect(query.mock.calls[2][1]).toEqual([[id]]);
  });

  it('rejects an invalid group ID before it reaches a UUID cast', async () => {
    query.mockResolvedValueOnce({ rows: [{ total: '0' }] }).mockResolvedValueOnce({ rows: [] });
    const page = await listInvitationsPage({ search: '', status: 'all', response: 'all', group: 'invalid' }, '2');
    expect(page.items).toEqual([]);
    expect(query.mock.calls[0][0]).toContain('where false');
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('limits revision checks to the requested section or invitation', async () => {
    query.mockResolvedValue({ rows: [{ revision: 'revision' }] });
    const id = '11111111-1111-4111-8111-111111111111';
    await adminDataRevision('groups');
    await adminDataRevision('settings');
    await adminDataRevision('detail', id);
    expect(query.mock.calls[0][0]).not.toContain('wedding.guests');
    expect(query.mock.calls[1][0]).toContain('wedding.settings');
    expect(query.mock.calls[1][0]).not.toContain('wedding.invitations');
    expect(query.mock.calls[2][0]).toContain('where invitation_id=$1');
    expect(query.mock.calls[2][1]).toEqual([id]);
    await expect(adminDataRevision('detail', 'invalid')).rejects.toThrow('Invalid invitation ID');
    expect(query).toHaveBeenCalledTimes(3);
  });
});
