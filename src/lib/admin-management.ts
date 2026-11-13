import type { ResponseStatus } from './invitations.server';

export interface InvitationListFilters {
  search: string;
  status: 'all' | 'sent' | 'unsent' | 'revoked';
  response: 'all' | ResponseStatus;
  group: string;
}

export function invitationFilters(url: URL): InvitationListFilters {
  const status = url.searchParams.get('status');
  const response = url.searchParams.get('response');
  return {
    search: url.searchParams.get('q')?.trim() ?? '',
    status: status === 'sent' || status === 'unsent' || status === 'revoked' ? status : 'all',
    response: response === 'yes' || response === 'no' || response === 'pending' ? response : 'all',
    group: url.searchParams.get('group') ?? 'all',
  };
}

export function managementPageHref(filters: InvitationListFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.response !== 'all') params.set('response', filters.response);
  if (filters.group !== 'all') params.set('group', filters.group);
  params.set('page', String(page));
  return `/admin/gestion?${params}`;
}

export function responseFilterNote(response: InvitationListFilters['response']) {
  return response === 'yes' ? 'amb almenys una persona que assistirà'
    : response === 'no' ? 'amb almenys una persona que no assistirà'
    : response === 'pending' ? 'amb almenys una persona pendent de resposta' : '';
}
