import { z } from "zod";

export const clientFormSchema = z.object({
  name: z.string().min(2),
  brandSummary: z.string().optional()
});

export const scopeFormSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(2),
  scopeType: z.enum(["retainer", "project", "ad_hoc"])
});

export const briefFormSchema = z.object({
  clientId: z.string().min(1),
  scopeId: z.string().optional(),
  title: z.string().min(3),
  description: z.string().min(10),
  deadline: z.string().min(1)
});
