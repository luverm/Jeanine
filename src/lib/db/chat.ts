import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type ChatMessage = {
  id: number;
  sender: "visitor" | "admin";
  body: string;
  image_path: string | null;
  created_at: string;
};

export type ChatThread = {
  id: string;
  public_token: string;
  visitor_name: string | null;
  keep: boolean;
  last_message_at: string;
  last_admin_read_at: string | null;
  created_at: string;
};

export type ThreadListItem = {
  id: string;
  visitor_name: string | null;
  keep: boolean;
  last_message_at: string;
  unread: boolean;
  preview: string;
};

export async function getOrCreateThread(
  token: string | null | undefined,
  visitorName?: string | null,
): Promise<{ id: string; token: string }> {
  const svc = createSupabaseServiceClient();

  if (token) {
    const { data } = await svc
      .from("chat_threads")
      .select("id, public_token")
      .eq("public_token", token)
      .maybeSingle();
    if (data) {
      const row = data as { id: string; public_token: string };
      return { id: row.id, token: row.public_token };
    }
  }

  const { data, error } = await svc
    .from("chat_threads")
    .insert({ visitor_name: visitorName?.trim() || null })
    .select("id, public_token")
    .single();
  if (error) throw error;
  const row = data as { id: string; public_token: string };
  return { id: row.id, token: row.public_token };
}

async function threadByToken(token: string): Promise<ChatThread | null> {
  const svc = createSupabaseServiceClient();
  const { data } = await svc
    .from("chat_threads")
    .select("*")
    .eq("public_token", token)
    .maybeSingle();
  return (data as ChatThread | null) ?? null;
}

export async function postMessage(args: {
  threadId: string;
  sender: "visitor" | "admin";
  body: string;
  imagePath?: string | null;
}): Promise<ChatMessage> {
  const svc = createSupabaseServiceClient();
  const { data, error } = await svc
    .from("chat_messages")
    .insert({
      thread_id: args.threadId,
      sender: args.sender,
      body: args.body,
      image_path: args.imagePath ?? null,
    })
    .select("id, sender, body, image_path, created_at")
    .single();
  if (error) throw error;

  const now = new Date().toISOString();
  const patch: Record<string, string> =
    args.sender === "admin"
      ? { last_message_at: now, last_admin_read_at: now }
      : { last_message_at: now };
  await svc.from("chat_threads").update(patch).eq("id", args.threadId);

  return data as ChatMessage;
}

export async function getVisitorView(
  token: string,
  sinceId: number,
): Promise<{ thread: ChatThread; messages: ChatMessage[] } | null> {
  const thread = await threadByToken(token);
  if (!thread) return null;
  const svc = createSupabaseServiceClient();
  const { data, error } = await svc
    .from("chat_messages")
    .select("id, sender, body, image_path, created_at")
    .eq("thread_id", thread.id)
    .gt("id", sinceId)
    .order("id", { ascending: true });
  if (error) throw error;
  return { thread, messages: (data ?? []) as ChatMessage[] };
}

export async function resolveThreadIdByToken(
  token: string,
): Promise<string | null> {
  const t = await threadByToken(token);
  return t?.id ?? null;
}

export async function listThreads(): Promise<ThreadListItem[]> {
  const svc = createSupabaseServiceClient();
  const { data, error } = await svc
    .from("chat_threads")
    .select("id, visitor_name, keep, last_message_at, last_admin_read_at")
    .order("last_message_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const threads = (data ?? []) as {
    id: string;
    visitor_name: string | null;
    keep: boolean;
    last_message_at: string;
    last_admin_read_at: string | null;
  }[];

  const out: ThreadListItem[] = [];
  for (const t of threads) {
    const { data: last } = await svc
      .from("chat_messages")
      .select("sender, body, image_path")
      .eq("thread_id", t.id)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastMsg = last as
      | { sender: string; body: string; image_path: string | null }
      | null;
    const unread =
      !t.last_admin_read_at ||
      new Date(t.last_message_at).getTime() >
        new Date(t.last_admin_read_at).getTime();
    out.push({
      id: t.id,
      visitor_name: t.visitor_name,
      keep: t.keep,
      last_message_at: t.last_message_at,
      unread,
      preview: lastMsg
        ? lastMsg.body || (lastMsg.image_path ? "📷 afbeelding" : "")
        : "",
    });
  }
  return out;
}

export async function getThreadMessages(
  threadId: string,
): Promise<{ thread: ChatThread; messages: ChatMessage[] } | null> {
  const svc = createSupabaseServiceClient();
  const { data: t } = await svc
    .from("chat_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();
  if (!t) return null;
  const { data, error } = await svc
    .from("chat_messages")
    .select("id, sender, body, image_path, created_at")
    .eq("thread_id", threadId)
    .order("id", { ascending: true });
  if (error) throw error;
  return {
    thread: t as ChatThread,
    messages: (data ?? []) as ChatMessage[],
  };
}

export async function markThreadRead(threadId: string): Promise<void> {
  const svc = createSupabaseServiceClient();
  await svc
    .from("chat_threads")
    .update({ last_admin_read_at: new Date().toISOString() })
    .eq("id", threadId);
}

export async function setThreadKeep(
  threadId: string,
  keep: boolean,
): Promise<void> {
  const svc = createSupabaseServiceClient();
  await svc.from("chat_threads").update({ keep }).eq("id", threadId);
}

/** Deletes a thread (messages cascade). Returns image paths to clean up. */
export async function deleteThread(threadId: string): Promise<string[]> {
  const svc = createSupabaseServiceClient();
  const { data: imgs } = await svc
    .from("chat_messages")
    .select("image_path")
    .eq("thread_id", threadId)
    .not("image_path", "is", null);
  const paths = ((imgs ?? []) as { image_path: string }[]).map(
    (r) => r.image_path,
  );
  const { error } = await svc
    .from("chat_threads")
    .delete()
    .eq("id", threadId);
  if (error) throw error;
  return paths;
}

/** Purge threads idle > `days`, unless kept. Returns image paths removed. */
export async function purgeOldThreads(days: number): Promise<{
  threads: number;
  imagePaths: string[];
}> {
  const svc = createSupabaseServiceClient();
  const cutoff = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: stale } = await svc
    .from("chat_threads")
    .select("id")
    .eq("keep", false)
    .lt("last_message_at", cutoff);
  const ids = ((stale ?? []) as { id: string }[]).map((r) => r.id);
  if (ids.length === 0) return { threads: 0, imagePaths: [] };

  const { data: imgs } = await svc
    .from("chat_messages")
    .select("image_path")
    .in("thread_id", ids)
    .not("image_path", "is", null);
  const imagePaths = ((imgs ?? []) as { image_path: string }[]).map(
    (r) => r.image_path,
  );

  const { error } = await svc.from("chat_threads").delete().in("id", ids);
  if (error) throw error;
  return { threads: ids.length, imagePaths };
}
