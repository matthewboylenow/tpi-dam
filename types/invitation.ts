export interface Invitation {
  id: string;
  email: string;
  token: string;
  role: "admin" | "sales";
  invited_by: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export interface InvitationWithInviter extends Invitation {
  inviter_name: string | null;
  inviter_email: string;
}

export type CreateInvitationInput = {
  email: string;
  role: "admin" | "sales";
  expires_at: Date;
};
