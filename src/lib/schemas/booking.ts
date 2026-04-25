import { z } from "zod";
import { uuidString } from "@/lib/schemas/uuid";

const phoneRegex = /^[+0-9()\s-]{6,20}$/;

export const customerInputSchema = z.object({
  fullName: z.string().trim().min(2, "Naam is te kort").max(120),
  email: z.string().trim().toLowerCase().email("Ongeldig e-mailadres").max(254),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Ongeldig telefoonnummer")
    .max(20),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const bookingInputSchema = z.object({
  serviceId: uuidString(),
  staffId: uuidString(),
  // ISO 8601 (UTC) timestamps emitted by the form
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  idempotencyKey: uuidString(),
  customer: customerInputSchema,
  // Honeypot — must be empty
  website: z.string().max(0).optional().or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingInputSchema>;
export type CustomerInput = z.infer<typeof customerInputSchema>;
