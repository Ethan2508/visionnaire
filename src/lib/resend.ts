import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = "Visionnaire Opticiens <contact@visionnairesopticiens.fr>";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://visionnaireopticiens.vercel.app";
