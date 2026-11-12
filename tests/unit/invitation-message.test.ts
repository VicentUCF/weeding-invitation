import { describe, expect, it } from 'vitest';
import { invitationMessage } from '../../src/lib/invitation-message';

describe('invitationMessage', () => {
  it('includes the guest name and personal link in the invitation language', () => {
    const link = 'https://example.test/i/personal-token/';
    expect(invitationMessage('Maria', link, 'es')).toContain(`Hola, Maria!`);
    expect(invitationMessage('Maria', link, 'es')).toContain(link);
    expect(invitationMessage('Олена', link, 'uk')).toContain('Привіт, Олена!');
    expect(invitationMessage('Олена', link, 'uk')).toContain(link);
  });
});
