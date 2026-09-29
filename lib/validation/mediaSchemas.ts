import { z } from "zod";
import { USAGE_CHANNELS } from "@/lib/usage";

export const createMediaSchema = z.object({
  blob_url: z.string().url("Invalid blob URL"),
  caption: z.string().max(500).optional(),
  client_name: z.string().max(100).optional(),
  mime_type: z.string().optional(),
  file_size: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  folder_id: z.string().uuid().nullable().optional(),
});

export type CreateMediaInput = z.infer<typeof createMediaSchema>;

export const mediaFilterSchema = z.object({
  scope: z.enum(["mine", "all"]).optional(),
  owner_user_id: z.string().uuid().optional(),
  client_name: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.number().positive().max(100).optional(),
  offset: z.number().nonnegative().optional(),
  review: z.enum(["new", "reviewed"]).optional(),
  used: z.enum(["any", "none", ...USAGE_CHANNELS]).optional(),
});

export type MediaFilterInput = z.infer<typeof mediaFilterSchema>;

export const marketingUpdateSchema = z
  .object({
    reviewed: z.boolean().optional(),
    used_on: z.array(z.enum(USAGE_CHANNELS)).max(USAGE_CHANNELS.length).optional(),
  })
  .refine((v) => v.reviewed !== undefined || v.used_on !== undefined, {
    message: "Provide reviewed and/or used_on",
  });

export type MarketingUpdateInput = z.infer<typeof marketingUpdateSchema>;
