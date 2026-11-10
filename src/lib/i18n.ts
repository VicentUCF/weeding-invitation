export const locales = ['es', 'uk'] as const;
export type Locale = typeof locales[number];
export const localeName: Record<Locale, string> = { es: 'Español', uk: 'Українська' };
export function parseLocale(value: string): Locale {
  if (value === 'es' || value === 'uk') return value;
  throw new Error('Selecciona un idioma válido.');
}
export const invitationPath = (token: string, locale: Locale) => `${locale === 'es' ? '' : '/uk'}/i/${token}/`;

const copy = {
  es: {
    title: 'La boda de', description: 'Una invitación para celebrar juntos un día inolvidable.', skip: 'Ir al contenido',
    openLabel: 'Abrir invitación', special: 'Una invitación muy especial', open: 'Abrir la invitación de', hint: 'Pulsa el sello para abrir la carta', skipAnimation: 'Entrar sin animación',
    weddingInvitation: 'Invitación de boda', preview: 'Vista previa', for: 'Para', weMarry: 'Nos casamos', discover: 'Descubre nuestro día',
    bigDay: 'El gran día', whereWhen: 'Dónde y cuándo', location: 'Ubicación', directions: 'Cómo llegar', program: 'El programa', moments: 'Cada instante, juntos', beginning: 'El comienzo de todo',
    confirm: 'Confirma tu asistencia', joinUs: '¿Nos acompañas?', rsvpIntro: 'Responde por cada persona de esta invitación. Puedes volver a este enlace para actualizar la respuesta mientras el plazo esté abierto.',
    deadline: 'Plazo: hasta el', saved: 'Respuesta guardada. Gracias por confirmarnos tus datos.', closed: 'El plazo de confirmación está cerrado. Si necesitas cambiar algo, contacta directamente con los novios.',
    attendance: 'Asistencia de', yes: 'Sí, asistiré', no: 'No podré asistir', allergyQuestion: 'Si asistes, ¿tienes alguna alergia o intolerancia alimentaria?', shortNo: 'No', shortYes: 'Sí',
    allergyLabel: 'Describe todas las alergias o intolerancias, ingredientes y posible contaminación cruzada', allergyPlaceholder: 'Ej.: alergia a frutos secos; evitar trazas', dietaryLabel: 'Otras necesidades alimentarias (opcional)', dietaryPlaceholder: 'Ej.: menú vegetariano',
    consent: 'Autorizo a que los novios utilicen estos datos alimentarios para organizar el menú y los compartan con el servicio de catering cuando sea necesario.', saveRsvp: 'Guardar confirmación', privacy: 'La información alimentaria se recoge solo para preparar la celebración. Evita incluir datos que no sean necesarios.',
    previewRecipient: 'Esta invitación está reservada para las siguientes personas. La confirmación de asistencia se activará más adelante.', previewGeneric: 'La confirmación de asistencia se activará más adelante en los enlaces personalizados.', invited: 'Personas invitadas', demo: 'Demostración del formulario', onList: 'En la lista', example: 'Ejemplo', exampleGuest: 'Nombre del invitado', previewNote: 'Vista previa de la confirmación. El formulario estará disponible cuando se configure la base de datos.',
    footer: 'Hecho con cariño para celebrar juntos.', intro: 'Nos haría muchísima ilusión compartir este día contigo.', detailsIntro: 'Un lugar especial para celebrar nuestra historia.', ceremony: 'La ceremonia', ceremonyDescription: 'Compartiremos este momento tan especial contigo.',
    illustration: 'Ilustración en acuarela de Jose y Anas con su perro', aerial: 'Acuarela de L’Alqueria de Galim entre cipreses y olivos', facade: 'Otra acuarela de la fachada de L’Alqueria de Galim',
    rsvpInvalid: 'Revisa las respuestas e inténtalo de nuevo.', rsvpSaveError: 'No pudimos guardar la respuesta. Inténtalo de nuevo.',
    notFound: 'Invitación no encontrada', unavailable: 'La invitación no está disponible temporalmente. Inténtalo más tarde.', invalidOrigin: 'Origen no válido', deadlineClosed: 'El plazo de confirmación está cerrado.',
    selectResponse: 'Indica si asistirá cada persona.', selectAllergy: 'Indica si cada asistente tiene alergias.', allergyRequired: 'Alergias', dietaryRequired: 'Otras necesidades alimentarias', consentRequired: 'Necesitamos autorización para guardar la información alimentaria.',
  },
  uk: {
    title: 'Весілля', description: 'Запрошення розділити з нами незабутній день.', skip: 'Перейти до вмісту',
    openLabel: 'Відкрити запрошення', special: 'Особливе запрошення', open: 'Відкрити запрошення на весілля', hint: 'Натисніть на печатку, щоб відкрити лист', skipAnimation: 'Увійти без анімації',
    weddingInvitation: 'Запрошення на весілля', preview: 'Попередній перегляд', for: 'Для', weMarry: 'Ми одружуємося', discover: 'Дізнайтеся про наш день',
    bigDay: 'Великий день', whereWhen: 'Де і коли', location: 'Адреса', directions: 'Як дістатися', program: 'Програма', moments: 'Кожна мить разом', beginning: 'Початок нашої історії',
    confirm: 'Підтвердьте присутність', joinUs: 'Ви будете з нами?', rsvpIntro: 'Дайте відповідь за кожного гостя в цьому запрошенні. Ви можете змінити відповідь за цим посиланням, поки термін не минув.',
    deadline: 'Відповісти до', saved: 'Відповідь збережено. Дякуємо!', closed: 'Термін підтвердження минув. Якщо потрібно щось змінити, зв’яжіться з молодятами.',
    attendance: 'Присутність:', yes: 'Так, буду', no: 'Не зможу бути', allergyQuestion: 'Якщо ви прийдете, чи маєте харчову алергію або непереносимість?', shortNo: 'Ні', shortYes: 'Так',
    allergyLabel: 'Опишіть усі алергії або непереносимості, інгредієнти та ризик перехресного забруднення', allergyPlaceholder: 'Наприклад: алергія на горіхи; уникати слідів', dietaryLabel: 'Інші харчові потреби (необов’язково)', dietaryPlaceholder: 'Наприклад: вегетаріанське меню',
    consent: 'Я дозволяю молодятам використовувати ці дані про харчування для організації меню та, за потреби, передавати їх службі кейтерингу.', saveRsvp: 'Зберегти відповідь', privacy: 'Інформація про харчування потрібна лише для підготовки святкування. Не вказуйте зайвих даних.',
    previewRecipient: 'Це запрошення призначене для зазначених нижче гостей. Підтвердження присутності стане доступним пізніше.', previewGeneric: 'Підтвердження присутності стане доступним пізніше в персональних запрошеннях.', invited: 'Запрошені гості', demo: 'Приклад форми', onList: 'У списку', example: 'Приклад', exampleGuest: 'Ім’я гостя', previewNote: 'Попередній перегляд підтвердження. Форма стане доступною після налаштування бази даних.',
    footer: 'З любов’ю, щоб святкувати разом.', intro: 'Ми будемо дуже раді розділити цей день із вами.', detailsIntro: 'Особливе місце для святкування нашої історії.', ceremony: 'Церемонія', ceremonyDescription: 'Будемо раді розділити з вами цю особливу мить.',
    illustration: 'Акварельний малюнок Хосе й Анас із собакою', aerial: 'Акварельний вигляд L’Alqueria de Galim серед кипарисів і олив', facade: 'Акварельний малюнок фасаду L’Alqueria de Galim',
    rsvpInvalid: 'Перевірте відповіді та спробуйте ще раз.', rsvpSaveError: 'Не вдалося зберегти відповідь. Спробуйте ще раз.',
    notFound: 'Запрошення не знайдено', unavailable: 'Запрошення тимчасово недоступне. Спробуйте пізніше.', invalidOrigin: 'Недійсне джерело запиту', deadlineClosed: 'Термін підтвердження минув.',
    selectResponse: 'Вкажіть, чи прийде кожен гість.', selectAllergy: 'Вкажіть, чи має кожен гість алергію.', allergyRequired: 'Алергії', dietaryRequired: 'Інші харчові потреби', consentRequired: 'Для збереження інформації про харчування потрібен дозвіл.',
  },
} as const;
export const t = (locale: Locale) => copy[locale];
