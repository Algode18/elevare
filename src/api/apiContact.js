import supabaseClient from "@/utils/supabase";

// Public contact / support form submission. Works for signed-out guests too
// (no auth token needed — RLS allows anon insert on contact_messages).
//
// 1. Saves the message to Postgres first — this is the source of truth, so
//    the submission counts as "received" the moment this succeeds.
// 2. Then fires the `send-contact-email` edge function to notify the
//    support inbox. If step 2 fails (e.g. Resend isn't configured yet),
//    we still resolve successfully — the message is safely stored and can
//    be read from the Supabase dashboard.
export async function submitContactMessage(_token, _options, formData) {
  const supabase = await supabaseClient();

  const { error } = await supabase.from("contact_messages").insert([
    {
      name: formData.name,
      email: formData.email,
      type: formData.type,
      subject: formData.subject,
      message: formData.message,
    },
  ]);
  // Note: no .select() here on purpose — the anon role has no SELECT policy
  // on contact_messages (by design, so nobody can read others' messages via
  // the public API key). Asking Postgres to read the row back after insert
  // would hit RLS and fail even though the insert itself succeeded. We
  // already have everything we need in formData, so we just return that.

  if (error) {
    console.error("Error submitting contact message:", error);
    throw new Error("Couldn't send your message — please try again.");
  }

  try {
    await supabase.functions.invoke("send-contact-email", {
      body: formData,
    });
  } catch (emailError) {
    // Non-fatal: the message is already saved. Just log it.
    console.error("Contact email notification failed:", emailError);
  }

  return formData;
}