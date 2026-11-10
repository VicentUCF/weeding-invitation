import type { ResponseStatus } from './invitations.server';
import { parseLocale, t, type Locale } from './i18n';

const field = (data: FormData, name: string) => String(data.get(name) ?? '').trim();
const required = (value: string, max: number, label: string) => {
  if (!value || value.length > max) throw new Error(`${label}: introduce entre 1 y ${max} caracteres.`);
  return value;
};
const optional = (value: string, max: number, label: string) => {
  if (value.length > max) throw new Error(`${label}: máximo ${max} caracteres.`);
  return value;
};
export const formField = field;
export const requiredField = required;

export function invitationInput(data: FormData) {
  const addressee = required(field(data, 'addressee'), 160, 'Destinatario');
  const email = optional(field(data, 'email'), 254, 'Correo');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Introduce un correo válido.');
  const personalNote = optional(field(data, 'personalNote'), 1000, 'Mensaje personal');
  const personalNoteUk = optional(field(data, 'personalNoteUk'), 1000, 'Mensaje personal en ucraniano');
  const groupId = field(data, 'groupId');
  if (groupId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId)) throw new Error('Grupo no válido.');
  return { addressee, email: email || null, personalNote: personalNote || null, personalNoteUk: personalNoteUk || null, groupId: groupId || null, locale: parseLocale(field(data, 'locale') || 'es') };
}
export function guestNames(data: FormData) {
  const names = field(data, 'guestNames').split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
  if (!names.length || names.length > 20) throw new Error('Añade entre 1 y 20 personas, una por línea.');
  for (const name of names) required(name, 160, 'Nombre');
  return names;
}
export function guestInput(data: FormData) {
  const name = required(field(data, 'name'), 160, 'Nombre');
  const response = field(data, 'response') as ResponseStatus;
  if (!['pending', 'yes', 'no'].includes(response)) throw new Error('Selecciona un estado válido.');
  const allergies = optional(field(data, 'allergies'), 2000, 'Alergias');
  const dietaryNotes = optional(field(data, 'dietaryNotes'), 1000, 'Necesidades alimentarias');
  const consent = field(data, 'consent') === 'yes';
  if (response === 'yes' && (allergies || dietaryNotes) && !consent) throw new Error('Confirma que tienes permiso para registrar la información alimentaria.');
  return { name, response, allergies, dietaryNotes, consent };
}
export function rsvpInput(data: FormData, guests: { id: string }[], locale: Locale = 'es') {
  const c = t(locale);
  return guests.map(({ id }) => {
    const response = field(data, `response_${id}`);
    if (response !== 'yes' && response !== 'no') throw new Error(c.selectResponse);
    const allergiesAnswer = field(data, `allergy_answer_${id}`);
    if (response === 'yes' && allergiesAnswer !== 'yes' && allergiesAnswer !== 'no') throw new Error(c.selectAllergy);
    const allergies = response === 'yes' && allergiesAnswer === 'yes' ? required(field(data, `allergies_${id}`), 2000, c.allergyRequired) : '';
    const dietaryNotes = response === 'yes' ? optional(field(data, `dietary_${id}`), 1000, c.dietaryRequired) : '';
    const consent = response === 'yes' && field(data, `consent_${id}`) === 'yes';
    if ((allergies || dietaryNotes) && !consent) throw new Error(c.consentRequired);
    return { id, response: response as 'yes' | 'no', allergies, dietaryNotes, consent };
  });
}
