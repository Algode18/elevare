import supabaseClient, { supabaseUrl } from "@/utils/supabase";

// Fetch the current user's profile. Returns null if they haven't created
// one yet (not an error — just means "profile not started").
export async function getProfile(token, { user_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

// Create or update the profile in one call — Postgres upsert on user_id.
// profileData: { user_id, full_name, headline, location, experience_years,
//                education, skills (string[]), phone }
export async function upsertProfile(token, _, profileData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("profiles")
    .upsert([profileData], { onConflict: "user_id" })
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error saving profile:", error);
    throw new Error("Error saving profile");
  }

  return data;
}

// Upload/replace the resume file, tied 1:1 to the user (overwrites on
// re-upload instead of piling up files like the per-application flow did).
// Then stores the resulting public URL + filename on the profiles row.
export async function uploadProfileResume(token, { user_id }, file) {
  const supabase = await supabaseClient(token);

  const fileName = `profile-${user_id}`;

  const { error: storageError } = await supabase.storage
    .from("resumes")
    .upload(fileName, file, { upsert: true });

  if (storageError) {
    console.error("Error uploading resume:", storageError);
    throw new Error("Error uploading resume");
  }

  const resume_url = `${supabaseUrl}/storage/v1/object/public/resumes/${fileName}`;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      [{ user_id, resume_url, resume_filename: file.name }],
      { onConflict: "user_id" }
    )
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error saving resume url:", error);
    throw new Error("Error saving resume url");
  }

  return data;
}