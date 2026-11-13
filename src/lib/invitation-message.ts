import { invitationPath, type Locale } from './i18n';

export function publicSiteOrigin(siteUrl: string | undefined, allowLocal = false) {
  if (!siteUrl) return null;
  try {
    const site = new URL(siteUrl);
    if (site.pathname !== '/' || site.search || site.hash || site.username || site.password) return null;
    const local = site.hostname === 'localhost' || site.hostname.endsWith('.localhost') || site.hostname === '127.0.0.1' || site.hostname === '[::1]';
    if (local) {
      if (!allowLocal || !['http:', 'https:'].includes(site.protocol)) return null;
    } else if (site.protocol !== 'https:' || site.hostname.endsWith('.example')) return null;
    return site.origin;
  } catch {
    return null;
  }
}

export function publicInvitationLink(token: string, locale: Locale, siteUrl: string | undefined, allowLocal = false) {
  const origin = publicSiteOrigin(siteUrl, allowLocal);
  return origin ? `${origin}${invitationPath(token, locale)}` : null;
}

export function invitationMessage(name: string, link: string, locale: Locale) {
  if (locale === 'uk') return `Привіт, ${name}!\n\nМи одружуємося і будемо дуже раді розділити цей день із тобою.\n\nВідкрий своє запрошення та підтвердь, чи прийдеш:\n\n${link}`;
  return `Hola, ${name}!\n\nEns casem i ens faria molta il·lusió compartir este dia amb tu.\n\nObri la teua invitació i confirma si vindràs:\n\n${link}`;
}
