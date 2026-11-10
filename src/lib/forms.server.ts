import type { ResponseStatus } from './invitations.server';
import { parseLocale, t, type Locale } from './i18n';

const field = (data: FormData, name: string) => String(data.get(name) ?? '').trim();
const required = (value: string, max: number, label: string, locale: Locale = 'es') => {
  if (!value || value.length > max) throw new Error(locale === 'uk' ? `${label}: введіть від 1 до ${max} символів.` : `${label}: escriu entre 1 i ${max} caràcters.`);
  return value;
};
const optional = (value: string, max: number, label: string, locale: Locale = 'es') => {
  if (value.length > max) throw new Error(locale === 'uk' ? `${label}: не більше ${max} символів.` : `${label}: màxim ${max} caràcters.`);
  return value;
};
export const formField = field;
export const requiredField = required;

export function invitationInput(data: FormData) {
  const addressee = required(field(data, 'addressee'), 160, 'Destinatari');
  const email = optional(field(data, 'email'), 254, 'Correu');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Escriu una adreça de correu vàlida.');
  const personalNote = optional(field(data, 'personalNote'), 1000, 'Missatge personal');
  const personalNoteUk = optional(field(data, 'personalNoteUk'), 1000, 'Missatge personal en ucraïnés');
  const groupId = field(data, 'groupId');
  if (groupId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId)) throw new Error('El grup no és vàlid.');
  return { addressee, email: email || null, personalNote: personalNote || null, personalNoteUk: personalNoteUk || null, groupId: groupId || null, locale: parseLocale(field(data, 'locale') || 'es') };
}
export function guestNames(data: FormData) {
  const names = field(data, 'guestNames').split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
  if (!names.length || names.length > 20) throw new Error('Afig entre 1 i 20 persones, una per línia.');
  for (const name of names) required(name, 160, 'Nom');
  return names;
}
export function guestInput(data: FormData) {
  const name = required(field(data, 'name'), 160, 'Nom');
  const response = field(data, 'response') as ResponseStatus;
  if (!['pending', 'yes', 'no'].includes(response)) throw new Error('Selecciona un estat vàlid.');
  const allergies = optional(field(data, 'allergies'), 2000, 'Al·lèrgies');
  const dietaryNotes = optional(field(data, 'dietaryNotes'), 1000, 'Necessitats alimentàries');
  const consent = field(data, 'consent') === 'yes';
  if (response === 'yes' && (allergies || dietaryNotes) && !consent) throw new Error('Confirma que tens permís per a registrar la informació alimentària.');
  return { name, response, allergies, dietaryNotes, consent };
}
export function rsvpInput(data: FormData, guests: { id: string }[], locale: Locale = 'es') {
  const c = t(locale);
  return guests.map(({ id }) => {
    const response = field(data, `response_${id}`);
    if (response !== 'yes' && response !== 'no') throw new Error(c.selectResponse);
    const allergiesAnswer = field(data, `allergy_answer_${id}`);
    if (response === 'yes' && allergiesAnswer !== 'yes' && allergiesAnswer !== 'no') throw new Error(c.selectAllergy);
    const allergies = response === 'yes' && allergiesAnswer === 'yes' ? required(field(data, `allergies_${id}`), 2000, c.allergyRequired, locale) : '';
    const dietaryNotes = response === 'yes' ? optional(field(data, `dietary_${id}`), 1000, c.dietaryRequired, locale) : '';
    const consent = response === 'yes' && field(data, `consent_${id}`) === 'yes';
    if ((allergies || dietaryNotes) && !consent) throw new Error(c.consentRequired);
    return { id, response: response as 'yes' | 'no', allergies, dietaryNotes, consent };
  });
}
