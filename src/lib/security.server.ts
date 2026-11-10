import type { APIContext } from 'astro';

export function sameOrigin(context: APIContext) {
  const origin = context.request.headers.get('origin');
  const expected = context.url.origin;
  return origin === expected || (origin === 'null' && context.request.headers.get('sec-fetch-site') === 'same-origin');
}

