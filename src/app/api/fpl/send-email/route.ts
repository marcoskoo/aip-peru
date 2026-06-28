import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Server-side Gmail SMTP configuration.
// Credentials are read from env vars first (Vercel), with a hardcoded fallback
// so the feature works out-of-the-box. The password is NEVER sent to the
// browser — only this server route can see it.
const GMAIL_USER = process.env.GMAIL_USER || "aroais.pe@gmail.com";
const GMAIL_APP_PASSWORD =
  process.env.GMAIL_APP_PASSWORD || "dhflrllfjxwnfhin";
const GMAIL_FROM_NAME = process.env.GMAIL_FROM_NAME || "AIP PERU - Plan de Vuelo";

// Reuse the transporter across warm invocations
let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
  return transporter;
}

interface SendEmailBody {
  to?: string;
  subject?: string;
  body?: string; // plain text body (will be converted to HTML with <br>)
  html?: string; // optional pre-formed HTML body
  pdfBase64?: string; // base64-encoded PDF data (no data: prefix)
  filename?: string; // attachment filename (default PlanVuelo.pdf)
  replyTo?: string;
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as SendEmailBody;

    // Basic validation
    if (!data.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.to)) {
      return NextResponse.json(
        { ok: false, error: "Destinatario (to) inválido o faltante." },
        { status: 400 }
      );
    }
    if (!data.subject) {
      return NextResponse.json(
        { ok: false, error: "Asunto (subject) faltante." },
        { status: 400 }
      );
    }

    // Build the HTML body: prefer explicit html, otherwise convert plain text
    const htmlBody =
      data.html ||
      (data.body || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

    const attachments: nodemailer.Attachment[] = [];
    if (data.pdfBase64) {
      // Strip optional data: prefix
      const b64 = data.pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      attachments.push({
        filename: data.filename || "PlanVuelo.pdf",
        content: Buffer.from(b64, "base64"),
        contentType: "application/pdf",
      });
    }

    const info = await getTransporter().sendMail({
      from: `"${GMAIL_FROM_NAME}" <${GMAIL_USER}>`,
      to: data.to,
      replyTo: data.replyTo || GMAIL_USER,
      subject: data.subject,
      html: htmlBody,
      attachments,
    });

    return NextResponse.json({
      ok: true,
      messageId: info.messageId,
      from: GMAIL_USER,
      to: data.to,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/fpl/send-email] Error:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Lightweight health/config check (never exposes the password)
  return NextResponse.json({
    ok: true,
    configured: Boolean(GMAIL_USER && GMAIL_APP_PASSWORD),
    from: GMAIL_USER,
    fromName: GMAIL_FROM_NAME,
    transport: "gmail-smtp (nodemailer, server-side)",
  });
}
