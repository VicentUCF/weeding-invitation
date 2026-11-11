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
    expect(() => invitationInput(data({ addressee: '' }))).toThrow(/Destinatari/);
    expect(() => guestNames(data({ guestNames: '' }))).toThrow(/entre 1 i 20/);
    expect(guestNames(data({ guestNames: 'María\nPablo' }))).toEqual(['María', 'Pablo']);
  });

  it('requires explicit consent for food details', () => {
    const guest = { id: 'person-1' };
    const fields = { 'response_person-1': 'yes', 'allergy_answer_person-1': 'yes', 'allergies_person-1': 'Alergia a frutos secos; evitar trazas', 'bus_person-1': 'yes', 'bus_route_person-1': 'both' };
    expect(() => rsvpInput(data(fields), [guest])).toThrow(/autoritzar/);
    expect(rsvpInput(data({ ...fields, 'consent_person-1': 'yes' }), [guest])).toEqual([{
      id: 'person-1', response: 'yes', allergies: 'Alergia a frutos secos; evitar trazas', dietaryNotes: '', busSeat: true, busRoute: 'both', consent: true,
    }]);
    expect(() => guestInput(data({ name: 'María', response: 'yes', allergies: 'Frutos secos' }))).toThrow(/permís/);
  });

  it('discards food details when a person declines', () => {
    expect(rsvpInput(data({ 'response_person-1': 'no', 'allergies_person-1': 'Texto anterior', 'bus_person-1': 'yes', 'consent_person-1': 'yes' }), [{ id: 'person-1' }])).toEqual([{
      id: 'person-1', response: 'no', allergies: '', dietaryNotes: '', busSeat: null, busRoute: null, consent: false,
    }]);
  });

  it('requires a bus route only when an attendee needs a seat', () => {
    const guest = { id: 'person-1' };
    expect(() => rsvpInput(data({ 'response_person-1': 'yes', 'allergy_answer_person-1': 'no' }), [guest])).toThrow(/autobús/);
    expect(rsvpInput(data({ 'response_person-1': 'yes', 'allergy_answer_person-1': 'no', 'bus_person-1': 'no' }), [guest])).toEqual([{
      id: 'person-1', response: 'yes', allergies: '', dietaryNotes: '', busSeat: false, busRoute: null, consent: false,
    }]);
    expect(() => rsvpInput(data({ 'response_person-1': 'yes', 'allergy_answer_person-1': 'no', 'bus_person-1': 'invalid' }), [guest])).toThrow(/autobús/);
    const yes = { 'response_person-1': 'yes', 'allergy_answer_person-1': 'no', 'bus_person-1': 'yes' };
    expect(() => rsvpInput(data(yes), [guest])).toThrow(/anada/);
    expect(() => rsvpInput(data({ ...yes, 'bus_route_person-1': 'invalid' }), [guest])).toThrow(/anada/);
    for (const route of ['outbound', 'return', 'both']) {
      expect(rsvpInput(data({ ...yes, 'bus_route_person-1': route }), [guest])[0].busRoute).toBe(route);
    }
    expect(rsvpInput(data({ ...yes, 'bus_person-1': 'no', 'bus_route_person-1': 'both' }), [guest])[0].busRoute).toBeNull();
  });

  it('requires a route when an admin confirms a bus seat', () => {
    expect(() => guestInput(data({ name: 'María', response: 'yes', bus: 'yes' }))).toThrow(/anada/);
    expect(guestInput(data({ name: 'María', response: 'yes', bus: 'yes', busRoute: 'return' })).busRoute).toBe('return');
    expect(guestInput(data({ name: 'María', response: 'no', bus: 'yes', busRoute: 'both' })).busRoute).toBeNull();
    expect(() => guestInput(data({ name: 'María', response: 'yes', bus: 'yes', busRoute: 'invalid' }))).toThrow(/trajecte/);
  });

  it('validates invitation language and translates guest validation', () => {
    expect(invitationInput(data({ addressee: 'Родина', locale: 'uk' })).locale).toBe('uk');
    expect(() => invitationInput(data({ addressee: 'Родина', locale: 'xx' }))).toThrow(/idioma/);
    expect(() => rsvpInput(data({}), [{ id: 'person-1' }], 'uk')).toThrow(/Вкажіть/);
    expect(invitationPath('secret', 'uk')).toBe('/uk/i/secret/');
  });
});
