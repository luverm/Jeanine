import "server-only";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const { RESEND_API_KEY } = getServerEnv();
    _resend = new Resend(RESEND_API_KEY);
  }
  return _resend;
}

export type SendArgs = {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  attachments?: Array<{
    filename: string;
    content: string; // base64 or utf-8 string
  }>;
  replyTo?: string;
};

export async function sendEmail(args: SendArgs): Promise<{ id: string | null }> {
  const { RESEND_FROM_EMAIL } = getServerEnv();
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: args.to,
    subject: args.subject,
    react: args.react,
    attachments: args.attachments,
    replyTo: args.replyTo,
  });
  if (error) throw error;
  return { id: data?.id ?? null };
}
