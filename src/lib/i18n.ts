export const locales = ['es', 'uk'] as const;
export type Locale = typeof locales[number];
// The stored `es` value and existing invitation URLs stay stable for issued links.
export const localeName: Record<Locale, string> = { es: 'Valencià', uk: 'Українська' };
export const htmlLang: Record<Locale, string> = { es: 'ca-ES-valencia', uk: 'uk' };
export function parseLocale(value: string): Locale {
  if (value === 'es' || value === 'uk') return value;
  throw new Error('Selecciona un idioma vàlid.');
}
export const invitationPath = (token: string, locale: Locale) => `${locale === 'es' ? '' : '/uk'}/i/${token}/`;

const copy = {
  es: {
    title: 'La boda de', description: 'Jose i Anas es casen el 30 d’octubre de 2027 a L’Alqueria de Galim, a l’Olleria. Consulta els detalls de la celebració i confirma l’assistència amb la teua invitació.', skip: 'Ves al contingut',
    openLabel: 'Obri la invitació', special: 'Una carta per a tu', open: 'Obri la invitació de', hint: 'Toca la pantalla per a obrir-la', skipAnimation: 'Entra sense animació', soundOn: 'Desactiva el so', soundOff: 'Activa el so', musicPlay: 'Reproduïx la música', musicPause: 'Pausa la música',
    weddingInvitation: 'Invitació de boda', for: 'Per a', weMarry: 'Ens casem', discover: 'Descobrix la invitació',
    whereWhen: 'On i quan', placeTitle: 'El nostre punt de trobada', location: 'Localitat', directions: 'Com arribar-hi', program: 'El dia de la boda', moments: 'Moments per a compartir', beginning: 'La cerimònia',
    journeyEyebrow: 'De camí', journeyTitle: 'Camí de la celebració', journeyIntro: 'De Xeraco a l’Olleria, entre oliveres i xiprers.', journeyStart: 'Xeraco', journeyEnd: 'L’Olleria', journeyDirection: 'Cap a l’Olleria', journeyArrivalKicker: 'La millor parada', journeyWaiting: 't’esperen', journeyCaption: 'Ací comença la celebració.', journeyArtAlt: 'Recorregut il·lustrat de Xeraco a l’Olleria per la CV-60, amb un autobús i paisatges d’aquarel·la.',
    confirm: 'Confirma l’assistència', joinUs: 'Ens acompanyes?', rsvpIntro: 'Indica si vindrà cadascuna de les persones d’esta invitació. Pots canviar les respostes des d’este mateix enllaç mentre el termini estiga obert.', previewRsvpIntro: 'Així podràs confirmar l’assistència quan rebes el teu enllaç personal. Prova les opcions per a veure les preguntes.', previewGuest: 'Persona convidada', previewRsvpNote: 'Esta és una vista prèvia. Per a guardar la resposta, obri l’enllaç personal de la teua invitació.',
    deadline: 'Confirma-ho fins al', saved: 'Hem guardat les teues respostes. Pots canviar-les des d’este enllaç mentre el termini estiga obert.', closed: 'El termini per a confirmar l’assistència ha acabat. Si necessites fer algun canvi, parla directament amb nosaltres.',
    attendance: 'Assistència de', attendanceQuestion: 'Vindràs?', pending: 'Pendent de resposta', yes: 'Sí, vindré', no: 'No podré vindre', menuKicker: 'A taula', menuTitle: 'Detalls per al menú', allergyQuestion: 'Tens alguna al·lèrgia o intolerància alimentària?', shortNo: 'No', shortYes: 'Sí',
    allergyLabel: 'Explica les al·lèrgies o intoleràncies, els ingredients afectats i si cal evitar les traces', allergyPlaceholder: 'Per exemple: al·lèrgia als fruits secs; evitar traces', busKicker: 'Com arribar-hi', busTitle: 'Transport', busQuestion: 'Necessitaràs plaça a l’autobús?', busYes: 'Sí, vull plaça', busNo: 'No, gràcies', busRouteQuestion: 'Quin trajecte necessites?', busOutbound: 'Només anada', busReturn: 'Només tornada', busBoth: 'Anada i tornada',
    consent: 'Autoritze Jose i Anas a utilitzar esta informació per a preparar el menú i a compartir-la amb el servei de càtering si és necessari.', saveRsvp: 'Guarda les respostes', privacy: 'Utilitzarem la informació alimentària per a preparar el menú i la resposta sobre l’autobús per a reservar les places necessàries.',
    footer: 'Ens fa molta il·lusió compartir este dia amb tu.', farewell: 'T’esperem!', intro: 'El 30 d’octubre de 2027 ens casem a l’Olleria. Ens farà molta il·lusió viure este dia amb tu.', ceremony: 'La cerimònia', ceremonyDescription: 'Ens agradarà compartir amb tu el moment en què ens direm que sí.',
    illustration: 'Aquarel·la de Jose i Anas amb el seu gos', aerial: 'Aquarel·la de L’Alqueria de Galim entre xiprers i oliveres', facade: 'Aquarel·la de la façana de L’Alqueria de Galim',
    rsvpInvalid: 'Revisa les respostes i torna-ho a provar.', rsvpSaveError: 'No hem pogut guardar les respostes. Torna-ho a provar.',
    notFound: 'No hem trobat la invitació', unavailable: 'La invitació no està disponible ara mateix. Torna-ho a provar més tard.', invalidOrigin: 'No s’ha pogut validar la sol·licitud', deadlineClosed: 'El termini de confirmació ha acabat.',
    selectResponse: 'Indica si vindrà cadascuna de les persones convidades.', selectAllergy: 'Indica si cada assistent té alguna al·lèrgia o intolerància.', selectBus: 'Indica si necessites plaça a l’autobús.', selectBusRoute: 'Indica si necessites autobús d’anada, de tornada o per als dos trajectes.', allergyRequired: 'Al·lèrgies i intoleràncies', consentRequired: 'Cal autoritzar l’ús de la informació alimentària per a guardar-la.',
  },
  uk: {
    title: 'Весілля', description: 'Jose та Anas одружуються 30 жовтня 2027 року в L’Alqueria de Galim, L’Olleria. Дізнайтеся подробиці та підтвердьте присутність за особистим запрошенням.', skip: 'Перейти до вмісту',
    openLabel: 'Відкрити запрошення', special: 'Лист для вас', open: 'Відкрити запрошення на весілля', hint: 'Торкніться екрана, щоб відкрити лист', skipAnimation: 'Увійти без анімації', soundOn: 'Вимкнути звук', soundOff: 'Увімкнути звук', musicPlay: 'Увімкнути музику', musicPause: 'Призупинити музику',
    weddingInvitation: 'Запрошення на весілля', for: 'Для', weMarry: 'Ми одружуємося', discover: 'Переглянути запрошення',
    whereWhen: 'Де і коли', placeTitle: 'Місце нашої зустрічі', location: 'Адреса', directions: 'Переглянути маршрут', program: 'Наш день', moments: 'Кожна мить разом', beginning: 'Так починається наш день',
    journeyEyebrow: 'Дорогою', journeyTitle: 'Дорога до нашої зустрічі', journeyIntro: 'Від Xeraco до L’Olleria, поміж оливами й кипарисами.', journeyStart: 'Xeraco', journeyEnd: 'L’Olleria', journeyDirection: 'У напрямку L’Olleria', journeyArrivalKicker: 'Найкраща зупинка', journeyWaiting: 'чекають на вас', journeyCaption: 'Тут починається наше святкування.', journeyArtAlt: 'Ілюстрований маршрут від Xeraco дорогою CV-60 до L’Olleria з автобусом та акварелями запрошення.',
    confirm: 'Підтвердьте присутність', joinUs: 'Ви будете з нами?', rsvpIntro: 'Підтвердьте присутність кожної людини в цьому запрошенні. Ви зможете змінити відповідь за цим посиланням, поки термін не минув.', previewRsvpIntro: 'Так ви зможете підтвердити присутність, отримавши особисте посилання. Спробуйте вибрати відповідь, щоб побачити запитання.', previewGuest: 'Запрошена особа', previewRsvpNote: 'Це попередній перегляд. Щоб зберегти відповідь, відкрийте особисте посилання зі свого запрошення.',
    deadline: 'Відповісти до', saved: 'Ми зберегли вашу відповідь. Ви можете змінити її за цим посиланням, поки термін не минув.', closed: 'Термін підтвердження минув. Якщо потрібно щось змінити, зв’яжіться з молодятами.',
    attendance: 'Присутність:', attendanceQuestion: 'Ви прийдете?', pending: 'Без відповіді', yes: 'Так, буду', no: 'Не зможу бути', menuKicker: 'За столом', menuTitle: 'Побажання до меню', allergyQuestion: 'Чи маєте харчову алергію або непереносимість?', shortNo: 'Ні', shortYes: 'Так',
    allergyLabel: 'Опишіть усі алергії або непереносимості, інгредієнти та ризик перехресного забруднення', allergyPlaceholder: 'Наприклад: алергія на горіхи; уникати слідів', busKicker: 'Як дістатися', busTitle: 'Транспорт', busQuestion: 'Вам потрібне місце в автобусі?', busYes: 'Так, потрібне місце', busNo: 'Ні, дякую', busRouteQuestion: 'Який маршрут вам потрібен?', busOutbound: 'Лише туди', busReturn: 'Лише назад', busBoth: 'Туди й назад',
    consent: 'Я дозволяю молодятам використовувати ці дані про харчування для організації меню та, за потреби, передавати їх службі кейтерингу.', saveRsvp: 'Зберегти відповідь', privacy: 'Інформацію про харчування використаємо для меню, а відповідь про автобус — для бронювання місць.',
    footer: 'Ми дуже раді розділити цей день із вами.', farewell: 'Чекаємо на вас!', intro: '30 жовтня 2027 року ми одружуємося в L’Olleria. Будемо раді розділити цей день із вами.', ceremony: 'Церемонія', ceremonyDescription: 'Будемо раді розділити з вами цю особливу мить.',
    illustration: 'Акварельний малюнок Хосе й Анас із собакою', aerial: 'Акварельний вигляд L’Alqueria de Galim серед кипарисів і олив', facade: 'Акварельний малюнок фасаду L’Alqueria de Galim',
    rsvpInvalid: 'Перевірте відповіді та спробуйте ще раз.', rsvpSaveError: 'Не вдалося зберегти відповідь. Спробуйте ще раз.',
    notFound: 'Запрошення не знайдено', unavailable: 'Запрошення тимчасово недоступне. Спробуйте пізніше.', invalidOrigin: 'Недійсне джерело запиту', deadlineClosed: 'Термін підтвердження минув.',
    selectResponse: 'Вкажіть, чи прийде кожен гість.', selectAllergy: 'Вкажіть, чи має кожен гість алергію.', selectBus: 'Вкажіть, чи потрібне вам місце в автобусі.', selectBusRoute: 'Вкажіть, чи потрібен автобус туди, назад або в обидва боки.', allergyRequired: 'Алергії', consentRequired: 'Для збереження інформації про харчування потрібен дозвіл.',
  },
} as const;
export const t = (locale: Locale) => copy[locale];
