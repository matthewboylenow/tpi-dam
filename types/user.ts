export interface User {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  role: "sales" | "admin";
  created_at: Date;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  role: "sales" | "admin";
  created_at: Date;
}

export type CreateUserInput = {
  email: string;
  name: string;
  password: string;
  role?: "sales" | "admin";
};
