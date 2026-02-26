import { z } from "zod";

export const createListSchema = z.object({
  name: z.string().min(1, 'Title is required').max(100, 'Title accepts only 100 characters'),
  carrots: z
    .array(
      z.object({
        label: z
          .string()
          .min(1, 'Carrot item is required')
          .max(255, 'Carrot item accepts only 255 characters'),
      })
    )
    .default([]),
  pinned: z.boolean().optional().default(false),
});
