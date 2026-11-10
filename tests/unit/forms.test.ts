import { describe, expect, it } from 'vitest';
import { guestInput, invitationInput, guestNames, rsvpInput } from '../../src/lib/forms.server';
import { invitationPath } from '../../src/lib/i18n';

const data = (values: Record<string, string>) => {
  const result = new FormData();
  for (const [name, value] of Object.entries(values)) result.set(name, value);
  return result;
};

describe('invitation forms', () => {
  it('requires an addressee and at least one named person', () => {
    expect(() => invitationInput(data({ addressee: '' }))).toThrow(/Destinatario/);
    expect(() => guestNames(data({ guestNames: '' }))).toThrow(/entre 1 y 20/);
    expect(guestNames(data({ guestNames: 'María\nPablo' }))).toEqual(['María', 'Pablo']);
  });

  it('requires explicit consent for food details', () => {
    const guest = { id: 'person-1' };
    const fields = { 'response_person-1': 'yes', 'allergy_answer_person-1': 'yes', 'allergies_person-1': 'Alergia a frutos secos; evitar trazas' };
    expect(() => rsvpInput(data(fields), [guest])).toThrow(/autorización/);
    expect(rsvpInput(data({ ...fields, 'consent_person-1': 'yes' }), [guest])).toEqual([{
      id: 'person-1', response: 'yes', allergies: 'Alergia a frutos secos; evitar trazas', dietaryNotes: '', consent: true,
    }]);
    expect(() => guestInput(data({ name: 'María', response: 'yes', allergies: 'Frutos secos' }))).toThrow(/permiso/);
  });

  it('discards food details when a person declines', () => {
    expect(rsvpInput(data({ 'response_person-1': 'no', 'allergies_person-1': 'Texto anterior', 'consent_person-1': 'yes' }), [{ id: 'person-1' }])).toEqual([{
      id: 'person-1', response: 'no', allergies: '', dietaryNotes: '', consent: false,
    }]);
  });

  it('validates invitation language and translates guest validation', () => {
    expect(invitationInput(data({ addressee: 'Родина', locale: 'uk' })).locale).toBe('uk');
    expect(() => invitationInput(data({ addressee: 'Родина', locale: 'xx' }))).toThrow(/idioma/);
    expect(() => rsvpInput(data({}), [{ id: 'person-1' }], 'uk')).toThrow(/Вкажіть/);
    expect(invitationPath('secret', 'uk')).toBe('/uk/i/secret/');
  });
});
