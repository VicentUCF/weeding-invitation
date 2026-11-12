import type { Locale } from './i18n';

export function invitationMessage(name: string, link: string, locale: Locale) {
  if (locale === 'uk') return `Привіт, ${name}!\n\nБудемо дуже раді розділити з тобою день нашого весілля. Ось твоє особисте запрошення, де можна підтвердити участь:\n${link}`;
  return `Hola, ${name}!\n\nEns faria molta il·lusió compartir amb tu el dia de la nostra boda. Ací tens la teua invitació personal, on pots confirmar si vindràs:\n${link}`;
}
