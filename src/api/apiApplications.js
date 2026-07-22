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
    .update({ status })
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

// "Easily Apply" — reuses the candidate's saved profile (resume, skills,
// education, experience) instead of asking them to re-upload/re-fill a
// form on every single application. Mirrors Indeed's Easy Apply pattern.
export async function applyWithProfile(token, _, { job_id, candidate_id, name, profile }) {
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
        resume: profile.resume_url,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting application");
  }

  return data;
}