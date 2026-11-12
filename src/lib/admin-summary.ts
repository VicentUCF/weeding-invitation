import type { Invitation } from './invitations.server';

export function adminSummary(invitations: Invitation[]) {
  const active = invitations.filter((invitation) => !invitation.revoked_at);
  const guests = active.flatMap((invitation) => invitation.guests);
  const attending = guests.filter((guest) => guest.response === 'yes');
  const allergies = attending.filter((guest) => guest.allergies.trim());
  const transport = attending.filter((guest) => guest.bus_seat === true);
  return {
    invitations: active.length,
    invited: guests.length,
    accepted: attending.length,
    declined: guests.filter((guest) => guest.response === 'no').length,
    pending: guests.filter((guest) => guest.response === 'pending').length,
    allergies: allergies.length,
    busOutbound: transport.filter((guest) => guest.bus_route === 'outbound').length,
    busReturn: transport.filter((guest) => guest.bus_route === 'return').length,
    busBoth: transport.filter((guest) => guest.bus_route === 'both').length,
    busTotal: transport.length,
  };
}
