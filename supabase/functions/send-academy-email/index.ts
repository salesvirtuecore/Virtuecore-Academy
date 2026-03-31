import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY")!;
const ADMIN_EMAILS    = ["sales@virtuecore.co.uk"];
const FROM            = "VirtueCore Academy <academy@virtuecore.co.uk>";
const SLACK_BOT_TOKEN = Deno.env.get("SLACK_BOT_TOKEN") ?? "";
const SLACK_CHANNEL   = "C0AQE787Y9X";

async function postToSlack(text: string): Promise<void> {
  if (!SLACK_BOT_TOKEN) return;
  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Authorization": `Bearer ${SLACK_BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel: SLACK_CHANNEL, text }),
    });
  } catch (_) { /* non-blocking */ }
}

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Shared email shell ──────────────────────────────────────────────────────
function shell(title: string, badge: string, badgeBg: string, badgeColor: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a 0%,#1e1e1e 100%);border:1px solid #2a2a2a;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#E8A020;border-radius:12px;font-size:22px;font-weight:900;color:#0f0f0f;margin-bottom:14px;">V</div>
            <h1 style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.3px;">VirtueCore <span style="color:#E8A020;">Academy</span></h1>
            <p style="margin:8px 0 0;display:inline-block;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;background:${badgeBg};color:${badgeColor};">${badge}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#161616;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:36px 40px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#111;border:1px solid #2a2a2a;border-top:none;border-radius:0 0 16px 16px;padding:22px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#444;">VirtueCore · Birmingham, UK</p>
            <p style="margin:0;font-size:11px;color:#333;">Automated notification — do not reply directly. Contact us at <a href="mailto:sales@virtuecore.co.uk" style="color:#E8A020;text-decoration:none;">sales@virtuecore.co.uk</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function row(label: string, value: string, last = false): string {
  return `<tr><td style="padding:16px 22px;${last ? "" : "border-bottom:1px solid #2a2a2a;"}">
    <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.9px;font-weight:700;">${label}</p>
    <p style="margin:5px 0 0;font-size:15px;color:#fff;font-weight:500;">${value}</p>
  </td></tr>`;
}

function card(rows: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#1d1d1d;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;margin-bottom:28px;">${rows}</table>`;
}

// ─── Email builders ──────────────────────────────────────────────────────────

function buildQuizResult(d: Record<string, string>): { subject: string; html: string } {
  const passed  = d.passed === "true";
  const score   = d.score ?? "0";
  const correct = d.correct ?? "0";
  const total   = d.total ?? "0";

  const statusColor = passed ? "#22c55e" : "#ef4444";
  const statusBg    = passed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)";
  const statusLabel = passed ? "✅ PASSED" : "❌ FAILED";
  const msg = passed
    ? `Well done, ${d.name}! You passed the <strong style="color:#E8A020;">${d.quiz}</strong> quiz. Keep up the great work — your next step is to complete the practical assessment to unlock your certificate.`
    : `You scored ${score}% on the <strong style="color:#E8A020;">${d.quiz}</strong> quiz — just below the 70% pass mark. Review the module content and give it another go. You've got this!`;

  const body = `
    <p style="margin:0 0 6px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.9px;font-weight:600;">Quiz Result</p>
    <h2 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#fff;">${d.quiz}</h2>
    ${card(
      row("Student", d.name) +
      row("Course", d.course) +
      row("Score", `<span style="font-size:20px;font-weight:900;color:${statusColor};">${score}%</span> &nbsp;<span style="color:#555;font-size:13px;">(${correct}/${total} correct)</span>`) +
      row("Result", `<span style="padding:5px 14px;border-radius:20px;font-size:13px;font-weight:800;background:${statusBg};color:${statusColor};">${statusLabel}</span>`, true)
    )}
    <p style="margin:0;font-size:14px;color:#aaa;line-height:1.7;">${msg}</p>`;

  return {
    subject: `${passed ? "✅ Passed" : "❌ Failed"}: ${d.quiz} Quiz — ${score}%`,
    html: shell(`Quiz Result — ${d.quiz}`, passed ? "Passed" : "Failed", passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", statusColor, body),
  };
}

function buildQuizFailWarning(d: Record<string, string>): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 6px;font-size:11px;color:#f97316;text-transform:uppercase;letter-spacing:.9px;font-weight:600;">⚠️ Practice Reminder</p>
    <h2 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#fff;">Struggling with this quiz?</h2>
    ${card(
      row("Student", d.name) +
      row("Quiz", d.quiz) +
      row("Score this attempt", `${d.score}%`) +
      row("Attempts so far", d.failCount, true)
    )}
    <p style="margin:0 0 16px;font-size:14px;color:#aaa;line-height:1.7;">Hi ${d.name}, you've attempted this quiz a few times without reaching the 70% pass mark. That's completely okay — it just means you need a bit more time with the material.</p>
    <p style="margin:0 0 16px;font-size:14px;color:#aaa;line-height:1.7;">We recommend re-watching the lesson videos, taking notes on the key concepts, and trying the quiz again when you feel ready. There's no limit on attempts.</p>
    <p style="margin:0;font-size:14px;color:#aaa;line-height:1.7;">If you're stuck on a specific topic, reach out to us at <a href="mailto:sales@virtuecore.co.uk" style="color:#E8A020;text-decoration:none;">sales@virtuecore.co.uk</a> and we'll point you in the right direction.</p>`;

  return {
    subject: `⚠️ Quiz Practice Reminder — ${d.quiz}`,
    html: shell(`Practice Reminder — ${d.quiz}`, "Practice Reminder", "rgba(249,115,22,0.15)", "#f97316", body),
  };
}

function buildPracticalSubmission(d: Record<string, string>): { subject: string; html: string } {
  const loomRow  = d.loom_url  ? row("Loom Video", `<a href="${d.loom_url}" style="color:#E8A020;text-decoration:none;">${d.loom_url}</a>`) : "";
  const fileRow  = d.file_url  ? row("Uploaded File", `<a href="${d.file_url}" style="color:#E8A020;text-decoration:none;">View file →</a>`) : "";

  const body = `
    <p style="margin:0 0 6px;font-size:11px;color:#6B9EFF;text-transform:uppercase;letter-spacing:.9px;font-weight:600;">New Practical Submission</p>
    <h2 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#fff;">${d.practical_title ?? d.module_title}</h2>
    ${card(
      row("Student", d.user_name) +
      row("Email", `<a href="mailto:${d.user_email}" style="color:#E8A020;text-decoration:none;">${d.user_email}</a>`) +
      row("Module", d.module_title) +
      row("Submission Type", d.submission_type ?? "—") +
      loomRow +
      fileRow +
      row("Submitted", d.submitted_at ?? new Date().toLocaleString("en-GB"), true)
    )}
    <p style="margin:0;font-size:14px;color:#aaa;line-height:1.7;">Please log into the <a href="https://academy.virtuecore.co.uk" style="color:#E8A020;text-decoration:none;">VirtueCore Academy admin panel</a>, go to the <strong style="color:#fff;">Admin tab</strong>, and review this submission.</p>`;

  return {
    subject: `📋 New Practical Submission — ${d.user_name} · ${d.module_title}`,
    html: shell(`New Practical Submission`, "Review Needed", "rgba(107,158,255,0.15)", "#6B9EFF", body),
  };
}

function buildPracticalReviewed(d: Record<string, string>): { subject: string; html: string } {
  const passed      = d.status === "passed";
  const statusColor = passed ? "#22c55e" : "#ef4444";
  const statusBg    = passed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)";
  const statusLabel = passed ? "✅ PASSED" : "❌ NEEDS REVISION";

  const msg = passed
    ? `Congratulations ${d.user_name}! Your practical submission for <strong style="color:#E8A020;">${d.module_title}</strong> has been reviewed and approved. ${Number(d.admin_score) >= 90 ? "You've earned a <strong style='color:#E8A020;'>Distinction</strong> — outstanding work! 🏆" : ""}${Number(d.admin_score) >= 80 ? " Your certificate is now ready to download from your Academy dashboard." : ""}`
    : `Hi ${d.user_name}, your practical submission for <strong style="color:#E8A020;">${d.module_title}</strong> has been reviewed. Please read the feedback below and resubmit when you're ready.`;

  const feedbackBlock = d.admin_feedback
    ? `<div style="margin-top:24px;background:#1d1d1d;border:1px solid #2a2a2a;border-left:3px solid ${statusColor};border-radius:0 10px 10px 0;padding:18px 22px;">
        <p style="margin:0 0 6px;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.9px;font-weight:700;">Reviewer Feedback</p>
        <p style="margin:0;font-size:14px;color:#ccc;line-height:1.7;">${d.admin_feedback}</p>
       </div>`
    : "";

  const body = `
    <p style="margin:0 0 6px;font-size:11px;color:${statusColor};text-transform:uppercase;letter-spacing:.9px;font-weight:600;">Practical Assessment Result</p>
    <h2 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#fff;">${d.module_title}</h2>
    ${card(
      row("Student", d.user_name) +
      row("Module", d.module_title) +
      row("Score", d.admin_score ? `<span style="font-size:20px;font-weight:900;color:${statusColor};">${d.admin_score}/100</span>` : "—") +
      row("Result", `<span style="padding:5px 14px;border-radius:20px;font-size:13px;font-weight:800;background:${statusBg};color:${statusColor};">${statusLabel}</span>`) +
      row("Reviewed", d.reviewed_at ?? new Date().toLocaleString("en-GB"), true)
    )}
    <p style="margin:0;font-size:14px;color:#aaa;line-height:1.7;">${msg}</p>
    ${feedbackBlock}`;

  return {
    subject: passed
      ? `✅ Practical Approved — ${d.module_title} (${d.admin_score}/100)`
      : `📝 Practical Feedback — ${d.module_title} — Please Revise`,
    html: shell(`Practical Result — ${d.module_title}`, passed ? "Approved" : "Needs Revision", passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", statusColor, body),
  };
}

function buildCertificateIssued(d: Record<string, string>): { subject: string; html: string } {
  const distinction = d.distinction === "true";

  const body = `
    <p style="margin:0 0 6px;font-size:11px;color:#E8A020;text-transform:uppercase;letter-spacing:.9px;font-weight:600;">🏆 Certificate Issued</p>
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff;">Congratulations, ${d.studentName}!</h2>
    <p style="margin:0 0 28px;font-size:15px;color:#aaa;line-height:1.6;">You have successfully completed the <strong style="color:#E8A020;">${d.moduleTitle}</strong> module and earned your VirtueCore Academy certificate${distinction ? " <strong style='color:#E8A020;'>with Distinction</strong>" : ""}.</p>
    ${card(
      row("Student", d.studentName) +
      row("Module Completed", d.moduleTitle) +
      row("Practical Score", `${d.score}/100${distinction ? " ✦ Distinction" : ""}`) +
      row("Date Issued", d.dateIssued, true)
    )}
    <div style="background:linear-gradient(135deg,rgba(232,160,32,0.08) 0%,rgba(232,160,32,0.03) 100%);border:1px solid rgba(232,160,32,0.25);border-radius:12px;padding:22px 26px;margin-bottom:28px;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:#E8A020;font-weight:700;text-transform:uppercase;letter-spacing:.8px;">Download Your Certificate</p>
      <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Log in to your Academy dashboard and visit <strong style="color:#fff;">My Certificates</strong> to download your official PDF certificate at any time.</p>
      <a href="https://academy.virtuecore.co.uk" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#E8A020;color:#0f0f0f;font-weight:800;font-size:14px;border-radius:8px;text-decoration:none;letter-spacing:.3px;">Open Academy →</a>
    </div>
    <p style="margin:0;font-size:13px;color:#555;line-height:1.65;text-align:center;">Share your achievement! Tag us <a href="https://www.instagram.com/virtuecore" style="color:#E8A020;text-decoration:none;">@virtuecore</a> on social media.</p>`;

  return {
    subject: `🏆 Your VirtueCore Certificate — ${d.moduleTitle}${distinction ? " (Distinction)" : ""}`,
    html: shell(`Certificate Issued — ${d.moduleTitle}`, distinction ? "✦ Distinction" : "Certified", "rgba(232,160,32,0.15)", "#E8A020", body),
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const d = await req.json() as Record<string, string>;
    const type = d.type ?? "quiz_result";

    let to: string[]     = [];
    let subject: string  = "";
    let html: string     = "";

    switch (type) {
      case "quiz_result": {
        const e = buildQuizResult(d);
        subject = e.subject; html = e.html;
        to = [d.email];
        const passed = d.passed === "true";
        const slackEmoji = passed ? "✅" : "❌";
        await postToSlack(`${slackEmoji} *Quiz ${passed ? "Passed" : "Failed"}* — ${d.name}\n📚 *Quiz:* ${d.quiz}\n🎓 *Course:* ${d.course}\n📊 *Score:* ${d.score}% (${d.correct}/${d.total} correct)`);
        break;
      }
      case "quiz_fail_warning": {
        const e = buildQuizFailWarning(d);
        subject = e.subject; html = e.html;
        to = [d.email];
        break;
      }
      case "practical_submission": {
        const e = buildPracticalSubmission(d);
        subject = e.subject; html = e.html;
        to = ADMIN_EMAILS;
        break;
      }
      case "practical_reviewed": {
        const e = buildPracticalReviewed(d);
        subject = e.subject; html = e.html;
        // Student gets the result; admins get a CC
        to = [d.user_email ?? d.email];
        break;
      }
      case "certificate_issued": {
        const e = buildCertificateIssued(d);
        subject = e.subject; html = e.html;
        to = [d.studentEmail ?? d.email];
        break;
      }
      default:
        return new Response(JSON.stringify({ ok: false, error: `Unknown type: ${type}` }), {
          status: 400, headers: { "Content-Type": "application/json", ...CORS },
        });
    }

    // Filter out empty/invalid addresses
    to = to.filter(Boolean);
    if (!to.length) {
      return new Response(JSON.stringify({ ok: false, error: "No recipient email" }), {
        status: 400, headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });

    const data = await res.json();

    return new Response(JSON.stringify({ ok: res.ok, data }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { "Content-Type": "application/json", ...CORS },
    });
  }
});
