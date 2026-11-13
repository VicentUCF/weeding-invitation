import { describe, expect, it } from 'vitest';
import { invitationMessage, publicInvitationLink } from '../../src/lib/invitation-message';

describe('invitationMessage', () => {
  it('includes the guest name and personal link in the invitation language', () => {
    const link = 'https://example.test/i/personal-token/';
    expect(invitationMessage('Maria', link, 'es')).toContain(`Hola, Maria!`);
    expect(invitationMessage('Maria', link, 'es')).toMatch(/confirma si vindràs:\n\nhttps:\/\/example\.test\/i\/personal-token\/$/);
    expect(invitationMessage('Олена', link, 'uk')).toContain('Привіт, Олена!');
    expect(invitationMessage('Олена', link, 'uk')).toMatch(/підтвердь, чи прийдеш:\n\nhttps:\/\/example\.test\/i\/personal-token\/$/);
  });

  it('uses a public HTTPS origin and permits localhost only for development', () => {
    expect(publicInvitationLink('token', 'es', 'https://boda.example.org/')).toBe('https://boda.example.org/i/token/');
    expect(publicInvitationLink('token', 'uk', 'https://boda.example.org/')).toBe('https://boda.example.org/uk/i/token/');
    expect(publicInvitationLink('token', 'es', undefined)).toBeNull();
    expect(publicInvitationLink('token', 'es', 'http://localhost:4321')).toBeNull();
    expect(publicInvitationLink('token', 'es', 'http://localhost:4321', true)).toBe('http://localhost:4321/i/token/');
    expect(publicInvitationLink('token', 'uk', 'http://localhost:4321', true)).toBe('http://localhost:4321/uk/i/token/');
    expect(publicInvitationLink('token', 'es', 'https://your-domain.example')).toBeNull();
  });
});
