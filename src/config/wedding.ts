// Event facts and schedule in Valencian and Ukrainian. UI copy lives in src/lib/i18n.ts.
export const wedding = {
  couple: ['Jose', 'Anas'],
  date: '2027-10-30',
  ceremony: { name: 'La cerimònia', nameUk: 'Церемонія', time: '12:00', venue: 'L’Alqueria de Galim', address: 'L’Olleria', mapUrl: 'https://maps.google.com/?q=L%27Alqueria+de+Galim+L%27Olleria' },
  reception: null as null | { name: string; nameUk: string; time: string; venue: string; address: string; mapUrl: string },
  schedule: [
    { time: '12:00', title: 'Ens diem que sí', titleUk: 'Ми одружуємося', description: 'La cerimònia comença a L’Alqueria de Galim.', descriptionUk: 'Будемо раді розділити з вами цю особливу мить.' },
  ],
  contactEmail: null as string | null,
} as const;

