const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!token) {
    console.warn("[TURNSTILE] No token provided");
    return false;
  }

  if (!TURNSTILE_SECRET_KEY) {
    console.error("[TURNSTILE] TURNSTILE_SECRET_KEY not configured");
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", TURNSTILE_SECRET_KEY);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data: TurnstileVerifyResponse = await response.json();

    if (!data.success) {
      console.warn("[TURNSTILE] Verification failed:", data["error-codes"]);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[TURNSTILE] Verification error:", error);
    return false;
  }
}
