import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(100, "Folder name must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
