// Presentation-only shape. Real recipients live in PostgreSQL and are created in /admin.
export interface InvitationRecipient {
  token: string;
  addressee: string;
  guests: readonly string[];
  personalNote?: string;
}
