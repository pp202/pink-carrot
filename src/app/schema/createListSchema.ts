import { z } from "zod";

export const createListSchema = z.object({
  name: z.string().min(1, 'Title is required').max(100, 'Title accepts only 100 characters')
});
