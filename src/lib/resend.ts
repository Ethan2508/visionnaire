import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const EMAIL_FROM = "Visionnaire Opticiens <contact@visionnairesopticiens.fr>";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://visionnaireopticiens.vercel.app";
