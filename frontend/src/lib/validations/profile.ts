import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  bio: z.string().max(500, { message: "Bio cannot exceed 500 characters" }).optional(),
  college: z.string().max(150).optional(),
  gradYear: z.string().max(10).optional(),
  targetRole: z.string().max(100).optional(),
  avatar: z.string().url({ message: "Invalid URL format" }).or(z.literal("")).optional(),
  skills: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
