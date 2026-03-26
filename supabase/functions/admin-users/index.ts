import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPA_URL    = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY  = Deno.env.get("RESEND_API_KEY")!;
const FROM        = "VirtueCore Academy <academy@virtuecore.co.uk>";
const ACADEMY_URL = "https://academy.virtuecore.co.uk";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Verify the caller is a logged-in admin
async function isAdmin(authHeader: string): Promise<boolean> {
  if (!authHeader) return false;
  const res = await fetch(`${SUPA_URL}/rest/v1/profiles?is_admin=eq.true&select=id`, {
    headers: { "apikey": SERVICE_KEY, "Authorization": authHeader },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Array.isArray(data) && data.length > 0;
}

// Send branded welcome email via Resend
async function sendWelcomeEmail(name: string, email: string, password: string) {
  if (!RESEND_KEY) return;
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome to VirtueCore Academy</title></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a 0%,#1e1e1e 100%);border:1px solid #2a2a2a;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#E8A020;border-radius:12px;font-size:22px;font-weight:900;color:#0f0f0f;margin-bottom:14px;">V</div>
            <h1 style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.3px;">VirtueCore <span style="color:#E8A020;">Academy</span></h1>
            <p style="margin:8px 0 0;display:inline-block;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;background:rgba(232,160,32,0.15);color:#E8A020;">Welcome Aboard</p>
          </td>
        </tr>
        <tr>
          <td style="background:#161616;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:36px 40px;">
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">Hi ${name}, you're in! 🎉</h2>
            <p style="margin:0 0 28px;font-size:15px;color:#aaa;line-height:1.65;">Your VirtueCore Academy account has been created. Use the credentials below to sign in and start your training.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1d1d1d;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;margin-bottom:28px;">
              <tr><td style="padding:16px 22px;border-bottom:1px solid #2a2a2a;">
                <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.9px;font-weight:700;">Academy URL</p>
                <p style="margin:5px 0 0;"><a href="${ACADEMY_URL}" style="color:#E8A020;text-decoration:none;font-size:15px;font-weight:500;">${ACADEMY_URL}</a></p>
              </td></tr>
              <tr><td style="padding:16px 22px;border-bottom:1px solid #2a2a2a;">
                <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.9px;font-weight:700;">Email</p>
                <p style="margin:5px 0 0;font-size:15px;color:#fff;font-weight:500;">${email}</p>
              </td></tr>
              <tr><td style="padding:16px 22px;">
                <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.9px;font-weight:700;">Temporary Password</p>
                <p style="margin:5px 0 0;font-size:17px;color:#E8A020;font-weight:700;letter-spacing:1px;font-family:monospace;">${password}</p>
              </td></tr>
            </table>
            <div style="background:linear-gradient(135deg,rgba(232,160,32,0.08) 0%,rgba(232,160,32,0.03) 100%);border:1px solid rgba(232,160,32,0.2);border-radius:12px;padding:18px 22px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#888;line-height:1.65;">⚠️ <strong style="color:#E8A020;">Please change your password</strong> after your first login — go to your profile settings inside the Academy.</p>
            </div>
            <div style="text-align:center;">
              <a href="${ACADEMY_URL}" style="display:inline-block;padding:14px 32px;background:#E8A020;color:#0f0f0f;font-weight:800;font-size:15px;border-radius:10px;text-decoration:none;letter-spacing:.3px;">Start Learning →</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#111;border:1px solid #2a2a2a;border-top:none;border-radius:0 0 16px 16px;padding:22px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#444;">VirtueCore · Birmingham, UK</p>
            <p style="margin:0;font-size:11px;color:#333;">Questions? <a href="mailto:sales@virtuecore.co.uk" style="color:#E8A020;text-decoration:none;">sales@virtuecore.co.uk</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: "🎉 You're in — VirtueCore Academy access details",
      html,
    }),
  });
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!await isAdmin(authHeader)) {
    return new Response(JSON.stringify({ error: "Unauthorized — admin only" }), {
      status: 401, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  // ── GET: list all users ────────────────────────────────────────────────────
  if (req.method === "GET") {
    const res = await fetch(`${SUPA_URL}/auth/v1/admin/users?per_page=200`, {
      headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` },
    });
    const data = await res.json();

    // Flatten to simple array: merge auth.users email with profiles data
    const users = (data.users ?? []).map((u: Record<string, unknown>) => ({
      id:         u.id,
      email:      u.email,
      full_name:  (u.user_metadata as Record<string, string>)?.full_name ?? "",
      is_admin:   false, // will be overridden by profiles join below
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }));

    // Get is_admin flags from profiles
    const profileRes = await fetch(
      `${SUPA_URL}/rest/v1/profiles?select=id,full_name,is_admin`,
      { headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` } }
    );
    const profiles: Array<{ id: string; full_name: string; is_admin: boolean }> =
      profileRes.ok ? await profileRes.json() : [];
    const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

    const merged = users.map((u: { id: string; full_name: string; is_admin: boolean }) => ({
      ...u,
      full_name: profileMap[u.id]?.full_name || u.full_name,
      is_admin:  profileMap[u.id]?.is_admin ?? false,
    }));

    return new Response(JSON.stringify({ users: merged }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  // ── POST: create user ──────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: "name, email, and password are required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    const createRes = await fetch(`${SUPA_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      }),
    });

    const userData = await createRes.json();
    if (!createRes.ok || userData.error) {
      return new Response(
        JSON.stringify({ error: userData.msg ?? userData.error ?? "Failed to create user" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS } }
      );
    }

    // Fire welcome email — non-blocking
    sendWelcomeEmail(name, email, password).catch(() => {});

    return new Response(JSON.stringify({ ok: true, user: userData }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  return new Response("Method not allowed", { status: 405, headers: CORS });
});
