import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_EMAILS  = ["thevirtuecoregroup@gmail.com", "samueloyedeji45@gmail.com", "cxleb7@gmail.com"];

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const { name, email, isAdmin, loginDate, loginTime } = await req.json();

    const roleBadgeBg    = isAdmin ? "#3d2800"  : "#0d1f3c";
    const roleBadgeColor = isAdmin ? "#E8A020"  : "#6B9EFF";
    const roleLabel      = isAdmin ? "Admin"    : "VA / Team Member";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Academy Login Notification</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a 0%,#1e1e1e 100%);border:1px solid #2a2a2a;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#E8A020;border-radius:12px;font-size:22px;font-weight:900;color:#0f0f0f;margin-bottom:14px;">V</div>
            <h1 style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.3px;">VirtueCore <span style="color:#E8A020;">Academy</span></h1>
            <p style="margin:6px 0 0;font-size:11px;color:#555;letter-spacing:1.2px;text-transform:uppercase;">Login Notification</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#161616;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:36px 40px;">

            <p style="margin:0 0 6px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.9px;font-weight:600;">Team Member Login Detected</p>
            <h2 style="margin:0 0 28px;font-size:24px;font-weight:800;color:#fff;line-height:1.3;">${name} just signed in</h2>

            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1d1d1d;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;margin-bottom:28px;">
              <tr>
                <td style="padding:18px 24px;border-bottom:1px solid #2a2a2a;">
                  <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.9px;font-weight:700;">Name</p>
                  <p style="margin:5px 0 0;font-size:15px;color:#fff;font-weight:600;">${name}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 24px;border-bottom:1px solid #2a2a2a;">
                  <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.9px;font-weight:700;">Email</p>
                  <p style="margin:5px 0 0;font-size:15px;color:#E8A020;font-weight:500;">${email}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 24px;border-bottom:1px solid #2a2a2a;">
                  <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.9px;font-weight:700;">Role</p>
                  <p style="margin:5px 0 0;">
                    <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:${roleBadgeBg};color:${roleBadgeColor};">${roleLabel}</span>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 24px;border-bottom:1px solid #2a2a2a;">
                  <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.9px;font-weight:700;">Date</p>
                  <p style="margin:5px 0 0;font-size:15px;color:#fff;font-weight:500;">${loginDate}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 24px;">
                  <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.9px;font-weight:700;">Time</p>
                  <p style="margin:5px 0 0;font-size:15px;color:#fff;font-weight:500;">${loginTime}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#555;line-height:1.65;">This is an automated security notification from VirtueCore Academy. If this login was unexpected, contact your administrator immediately at <a href="mailto:sales@virtuecore.co.uk" style="color:#E8A020;text-decoration:none;">sales@virtuecore.co.uk</a>.</p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#111;border:1px solid #2a2a2a;border-top:none;border-radius:0 0 16px 16px;padding:22px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#444;">VirtueCore · Birmingham, UK</p>
            <p style="margin:0;font-size:11px;color:#333;">Automated system notification — do not reply to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "VirtueCore Academy <academy@virtuecore.co.uk>",
        to: NOTIFY_EMAILS,
        subject: `🔐 Academy Login — ${name} (${roleLabel})`,
        html,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify({ ok: true, data }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
