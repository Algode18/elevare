import supabaseClient, { supabaseUrl } from "@/utils/supabase";

// List all resumes for a user, most recently updated first.
export async function getResumes(token, { user_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user_id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching resumes:", error);
    return [];
  }

  return data;
}

// Upload a new resume file + create its row. If this is the user's first
// resume, make it default automatically.
export async function uploadResume(token, { user_id }, { file, title, role }) {
  const supabase = await supabaseClient(token);

  const { count } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user_id);

  const isFirst = !count || count === 0;

  const fileName = `resume-${user_id}-${Date.now()}`;

  const { error: storageError } = await supabase.storage
    .from("resumes")
    .upload(fileName, file);

  if (storageError) {
    console.error("Error uploading resume:", storageError);
    throw new Error("Error uploading resume");
  }

  const file_url = `${supabaseUrl}/storage/v1/object/public/resumes/${fileName}`;

  const { data, error } = await supabase
    .from("resumes")
    .insert([
      {
        user_id,
        title: title || file.name,
        role: role || null,
        file_url,
        file_name: file.name,
        is_default: isFirst,
      },
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error saving resume row:", error);
    throw new Error("Error saving resume");
  }

  return data;
}

// Rename a resume (title/role only).
export async function renameResume(token, { user_id }, { id, title, role }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("resumes")
    .update({ title, role, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user_id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error renaming resume:", error);
    throw new Error("Error renaming resume");
  }

  return data;
}

// Set one resume as default — unset all others first (partial unique index
// only allows one is_default=true per user).
export async function setDefaultResume(token, { user_id }, { id }) {
  const supabase = await supabaseClient(token);

  const { error: clearError } = await supabase
    .from("resumes")
    .update({ is_default: false })
    .eq("user_id", user_id);

  if (clearError) {
    console.error("Error clearing default resume:", clearError);
    throw new Error("Error setting default resume");
  }

  const { data, error } = await supabase
    .from("resumes")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user_id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error setting default resume:", error);
    throw new Error("Error setting default resume");
  }

  return data;
}

// Delete a resume. If it was the default and other resumes exist, promote
// the most recently updated remaining one to default.
export async function deleteResume(token, { user_id }, { id }) {
  const supabase = await supabaseClient(token);

  const { data: target } = await supabase
    .from("resumes")
    .select("is_default")
    .eq("id", id)
    .eq("user_id", user_id)
    .maybeSingle();

  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", id)
    .eq("user_id", user_id);

  if (error) {
    console.error("Error deleting resume:", error);
    throw new Error("Error deleting resume");
  }

  if (target?.is_default) {
    const { data: remaining } = await supabase
      .from("resumes")
      .select("id")
      .eq("user_id", user_id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (remaining?.length) {
      await supabase
        .from("resumes")
        .update({ is_default: true })
        .eq("id", remaining[0].id);
    }
  }

  return true;
}

// Applications per resume + interview counts, computed from real data
// (no ats_score — that's a later feature). Also returns a flat list of
// recent application events for the activity timeline.
export async function getResumeUsageStats(token, { user_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("applications")
    .select("resume_id, status, created_at, job:jobs(title, company:companies(name))")
    .eq("candidate_id", user_id)
    .not("resume_id", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching resume usage stats:", error);
    return { byResumeId: {}, recentActivity: [] };
  }

  const byResumeId = {};
  for (const app of data) {
    const key = app.resume_id;
    if (!byResumeId[key]) {
      byResumeId[key] = { applications: 0, interviews: 0, lastUsedAt: null };
    }
    byResumeId[key].applications += 1;
    if (app.status === "interviewing") byResumeId[key].interviews += 1;
    if (!byResumeId[key].lastUsedAt) byResumeId[key].lastUsedAt = app.created_at;
  }

  const recentActivity = data.slice(0, 8).map((app) => ({
    resume_id: app.resume_id,
    status: app.status,
    created_at: app.created_at,
    job_title: app.job?.title,
    company_name: app.job?.company?.name,
  }));

  return { byResumeId, recentActivity };
}

// Replace PDF — same resume row, same analytics/history, only the file
// changes (mirrors the original spec's "Replace keeps Analytics/History").
export async function replaceResumeFile(token, { user_id }, { id, file }) {
  const supabase = await supabaseClient(token);

  const fileName = `resume-${user_id}-${Date.now()}`;

  const { error: storageError } = await supabase.storage
    .from("resumes")
    .upload(fileName, file);

  if (storageError) {
    console.error("Error uploading replacement file:", storageError);
    throw new Error("Error replacing resume");
  }

  const file_url = `${supabaseUrl}/storage/v1/object/public/resumes/${fileName}`;

  const { data, error } = await supabase
    .from("resumes")
    .update({ file_url, file_name: file.name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user_id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error saving replaced resume:", error);
    throw new Error("Error replacing resume");
  }

  return data;
}

// Duplicate — same file, new row, never default (avoids two defaults).
export async function duplicateResume(token, { user_id }, { resume }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("resumes")
    .insert([
      {
        user_id,
        title: `${resume.title} (copy)`,
        role: resume.role,
        file_url: resume.file_url,
        file_name: resume.file_name,
        is_default: false,
      },
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error duplicating resume:", error);
    throw new Error("Error duplicating resume");
  }

  return data;
}