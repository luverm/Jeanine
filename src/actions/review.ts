"use server";

import { z } from "zod";
import {
  createReview,
  setReviewVisible,
  deleteReview,
} from "@/lib/db/reviews";

const schema = z.object({
  author: z.string().trim().min(2).max(120),
  quote: z.string().trim().min(4).max(600),
});

export async function createReviewAction(
  formData: FormData,
): Promise<{ ok: boolean }> {
  const parsed = schema.safeParse({
    author: formData.get("author"),
    quote: formData.get("quote"),
  });
  if (!parsed.success) return { ok: false };
  try {
    await createReview(parsed.data);
  } catch (err) {
    console.error("[review] create failed:", err);
    return { ok: false };
  }
  return { ok: true };
}

export async function setReviewVisibleAction(
  id: string,
  visible: boolean,
): Promise<{ ok: boolean }> {
  try {
    await setReviewVisible(id, visible);
  } catch {
    return { ok: false };
  }
  return { ok: true };
}

export async function deleteReviewAction(
  id: string,
): Promise<{ ok: boolean }> {
  try {
    await deleteReview(id);
  } catch {
    return { ok: false };
  }
  return { ok: true };
}
