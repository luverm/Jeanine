import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

/**
 * Reads SMTP config from the environment. Returns null when it is not
 * (fully) configured so callers can skip sending instead of crashing —
 * a missing mail setup must never block a booking or lead.
 */
function getMailConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM ?? user;
  if (!host || !user || !pass || !from) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  return { host, port, secure: port === 465, user, pass, from };
}

let _transporter: Transporter | null = null;

function getTransporter(cfg: MailConfig): Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
  }
  return _transporter;
}

export type SendArgs = {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail(args: SendArgs): Promise<{ id: string | null }> {
  const cfg = getMailConfig();
  if (!cfg) {
    const recipients = Array.isArray(args.to) ? args.to.join(", ") : args.to;
    console.warn(
      `[email] SMTP not configured — skipped "${args.subject}" to ${recipients}`,
    );
    return { id: null };
  }
  const info = await getTransporter(cfg).sendMail({
    from: cfg.from,
    to: args.to,
    subject: args.subject,
    text: args.text,
    replyTo: args.replyTo,
  });
  return { id: info.messageId ?? null };
}
