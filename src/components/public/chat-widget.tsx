"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, ImagePlus, Send } from "lucide-react";
import {
  startChat,
  sendVisitorMessage,
  fetchChat,
  uploadVisitorChatImage,
  type ChatMessageDto,
} from "@/actions/chat";

const TOKEN_KEY = "hbj_chat_token";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);

  // Poll for new messages while open and a thread exists.
  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;

    const load = async () => {
      const r = await fetchChat({ token, sinceId: lastIdRef.current });
      if (cancelled || !r.ok || r.messages.length === 0) return;
      lastIdRef.current = r.messages[r.messages.length - 1].id;
      setMessages((prev) => [...prev, ...r.messages]);
    };

    void load();
    const id = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [open, token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function uploadImage(): Promise<string | null> {
    const file = fileRef.current?.files?.[0];
    if (!file) return null;
    const fd = new FormData();
    fd.set("file", file);
    const r = await uploadVisitorChatImage(fd);
    if (fileRef.current) fileRef.current.value = "";
    if (!r.ok || !r.path) {
      setError("Afbeelding uploaden mislukt.");
      return null;
    }
    return r.path;
  }

  async function send() {
    const body = text.trim();
    const hasImage = !!fileRef.current?.files?.length;
    if (!body && !hasImage) return;
    setBusy(true);
    setError(null);
    try {
      let activeToken = token;
      if (!activeToken) {
        const s = await startChat({ token: "", name: name.trim() });
        if (!s.ok) {
          setError("Kon de chat niet starten. Probeer het later opnieuw.");
          return;
        }
        activeToken = s.token;
        setToken(activeToken);
        try {
          window.localStorage.setItem(TOKEN_KEY, activeToken);
        } catch {
          /* private mode — chat still works this session */
        }
      }

      const imagePath = hasImage ? await uploadImage() : null;
      if (hasImage && !imagePath) return;

      const r = await sendVisitorMessage({
        token: activeToken,
        body,
        imagePath: imagePath ?? "",
        website: "",
      });
      if (!r.ok) {
        setError(
          r.code === "RATE_LIMITED"
            ? "Te veel berichten — wacht even."
            : "Versturen mislukt.",
        );
        return;
      }
      setText("");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Chat openen"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 print:hidden"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[32rem] max-h-[80vh] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl print:hidden">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Chat met Jeanine</p>
          <p className="text-xs text-muted-foreground">
            Reactie meestal binnen een dag
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Chat sluiten"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Stel gerust je vraag — over een afspraak, bruidsstyling of iets
            anders. Je kunt ook een foto meesturen.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              "flex " +
              (m.sender === "visitor" ? "justify-end" : "justify-start")
            }
          >
            <div
              className={
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                (m.sender === "visitor"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted")
              }
            >
              {m.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.imageUrl}
                  alt=""
                  className="mb-1 max-h-48 rounded-lg"
                />
              )}
              {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && (
        <p className="px-4 pb-1 text-xs text-red-600">{error}</p>
      )}

      {messages.length === 0 && !token && (
        <div className="px-4 pb-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Je naam (optioneel)"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            maxLength={80}
          />
        </div>
      )}

      <div className="flex items-end gap-2 border-t px-3 py-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={() => setError(null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Foto toevoegen"
          className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-muted"
        >
          <ImagePlus className="h-5 w-5" />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          placeholder="Typ een bericht…"
          className="max-h-24 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={busy}
          aria-label="Versturen"
          className="shrink-0 rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
