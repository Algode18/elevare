import supabaseClient, { supabaseUrl } from "@/utils/supabase";

export async function applyToJob(token, _, jobData) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const fileName = `resume-${random}-${jobData.candidate_id}`;

  const { error: storageError } = await supabase.storage
    .from("resumes")
    .upload(fileName, jobData.resume);

  if (storageError) {
    console.error("Error Uploading Resume:", storageError);
    return null;
  }

  const resume = `${supabaseUrl}/storage/v1/object/public/resumes/${fileName}`;

  const { data, error } = await supabase
    .from("applications")
    .insert([
      {
        ...jobData,
        resume,
        status_updated_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Application");
  }

  return data;
}

export async function updateApplicationStatus(token, { job_id, id }, status) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .update({ status, status_updated_at: new Date().toISOString() })
    .eq("job_id", job_id)
    .eq("id", id)
    .select();

  if (error || data.length === 0) {
    console.error("Error Updating Application Status:", error);
    return null;
  }

  return data;
}

export async function getApplications(token, { user_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .select("*, job:jobs(title, location, company:companies(name, logo_url))")
    .eq("candidate_id", user_id);

  if (error) {
    console.error("Error fetching Applications:", error);
    return null;
  }

  return data;
}

// "Easily Apply" — reuses the candidate's saved profile (skills, education)
// but resume now comes from the picked Resume Library entry, not a single
// fixed profile resume. Stores resume_id so later we know exactly which
// version was used (see applications.resume_id added in Step 1).
export async function applyWithProfile(token, _, { job_id, candidate_id, name, profile, resume }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("applications")
    .insert([
      {
        job_id,
        candidate_id,
        name,
        status: "applied",
        experience: profile.experience_years,
        skills: profile.skills?.join(", ") || "",
        education: profile.education,
        resume: resume?.file_url,
        resume_id: resume?.id,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting application");
  }

  return data;
}

// Withdraw — candidate-initiated delete of their own application. Scoped
// to candidate_id as well as id so a candidate can only ever remove their
// own row (RLS should also enforce this server-side).
export async function withdrawApplication(token, { candidate_id }, applicationId) {
  const supabase = await supabaseClient(token);
  // .select() after delete so we get back the rows that were actually
  // removed. Without this, Supabase/Postgres RLS can silently filter the
  // delete down to 0 affected rows with NO error — the request "succeeds"
  // but nothing happens, which is why the button can look broken with no
  // console output at all. Checking data.length turns that silent no-op
  // into a real, catchable error.
  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("candidate_id", candidate_id)
    .select();

  if (error) {
    console.error("Error Withdrawing Application:", error);
    throw new Error("Error withdrawing application");
  }

  if (!data || data.length === 0) {
    console.error(
      "Withdraw affected 0 rows — likely missing a Supabase RLS DELETE policy on `applications` for candidate_id = auth.uid(), or the id/candidate_id didn't match any row."
    );
    throw new Error("Could not withdraw application. Please try again.");
  }

  return true;
}