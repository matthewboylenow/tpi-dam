import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "sales"], {
    errorMap: () => ({ message: "Role must be either admin or sales" }),
  }),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
