// Supabase Edge Function: send-contact-email
//
// Called from the client right after a row is inserted into
// `contact_messages`. Sends a notification email to the support inbox via
// Resend, with the submitter's address set as `reply_to` so support can hit
// "reply" directly. The row is already saved in Postgres regardless of
// whether this email send succeeds — this function is a best-effort
// notification, not the source of truth.
//
// Deploy:
//   supabase functions deploy send-contact-email
//
// Required secrets (set once):
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxx
//   supabase secrets set CONTACT_SUPPORT_EMAIL=support@yourdomain.com
//   supabase secrets set CONTACT_FROM_EMAIL="Elevare <notifications@yourdomain.com>"
//
// CONTACT_FROM_EMAIL must be an address on a domain you've verified with
// Resend (https://resend.com/domains) — you can't send "from" an
// unverified domain.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, type, subject, message } = await req.json();

    if (!email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPPORT_EMAIL = Deno.env.get("CONTACT_SUPPORT_EMAIL");
    const FROM_EMAIL = Deno.env.get("CONTACT_FROM_EMAIL");

    if (!RESEND_API_KEY || !SUPPORT_EMAIL || !FROM_EMAIL) {
      console.error("Missing RESEND_API_KEY / CONTACT_SUPPORT_EMAIL / CONTACT_FROM_EMAIL secret");
      return new Response(JSON.stringify({ error: "Email is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeLabel = { bug: "Bug report", query: "Question", suggestion: "Suggestion", other: "Other" }[type] || "Message";

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [SUPPORT_EMAIL],
        reply_to: email,
        subject: `[${typeLabel}] ${subject}`,
        text: `From: ${name} <${email}>\nType: ${typeLabel}\n\n${message}`,
        html: `
          <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
          <p><strong>Type:</strong> ${escapeHtml(typeLabel)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <hr />
          <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
        `,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend error:", errBody);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}