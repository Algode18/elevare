import supabaseClient from "@/utils/supabase";


export async function getJobs(token, { location, company_id, searchQuery, job_type, work_mode }) {
  const supabase = await supabaseClient(token);

  let query = supabase
    .from("jobs")
    .select("*, company: companies(name,logo_url,verification_status)");
  
  query = query.eq("isOpen", true);

  if (location) {
    query = query.eq("location", location);
  }

  if (company_id) {
    query = query.eq("company_id", company_id);
  }

  if (job_type) {
    query = query.eq("job_type", job_type);
  }

  if (work_mode) {
    query = query.eq("work_mode", work_mode);
  }

  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Jobs:", error);
    return null;
  }

  return data;
}

export async function saveJob(token, { alreadySaved }, saveData) {
  const supabase = await supabaseClient(token);

  if (alreadySaved) {
    const { data, error: deleteError } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", saveData.job_id)
      .eq("user_id", saveData.user_id);

    if (deleteError) {
      console.error("Error Deleting Saved Job:", deleteError);
      return null;
    }

    return data;

   } else{
    const { data, error: insertError } = await supabase
        .from("saved_jobs")
        .insert([saveData])
        .select();

        if (insertError) {
          // 23505 = unique_violation — a saved_jobs row for this user+job
          // already exists (stale client state thought it wasn't saved).
          // Treat as already-saved instead of throwing.
          if (insertError.code === "23505") {
            console.warn("Job already saved, ignoring duplicate insert.");
            return [saveData];
          }
        console.error("Error saving job:", insertError);
        return null;
       }

    return data;

    }  
}

export async function getSingleJob(token, { job_id }) {  
  const supabase = await supabaseClient(token);

    const { data, error } = await supabase
     .from("jobs")
     .select(
      "*, company:companies(name,logo_url), applications: applications(*)"
    )
    .eq("id", job_id)
    .single();

    if (error) {
    console.error("Error Fetching Job", error);
    return null;
    }

  return data;
}


export async function UpdateHiringStatus(token, { job_id } , isOpen) {  
  const supabase = await supabaseClient(token);

    const { data, error } = await supabase
     .from("jobs")
     .update({isOpen})
    .eq("id", job_id)
    .select();

    if (error) {
    console.error("Error Updating Job", error);
    return null;
    }

  return data;
}

export async function addNewJob(token, _, jobData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .insert([jobData])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error Creating Job");
  }

  return data;
}

export async function updateJob(token, { job_id }, jobData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .update(jobData)
    .eq("id", job_id)
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error Updating Job");
  }

  return data;
}

// Lean version of getSavedJobs — returns just the job_id list for the
// current authenticated user. Used to merge "saved" state onto job lists
// that were fetched via the public getJobs() query (which stays public,
// with no join into saved_jobs — see usePublicFetch/useSavedJobIds).
export async function getSavedJobIds(token) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("job_id");

  if (error) {
    console.error("Error fetching saved job ids:", error);
    return [];
  }

  return data.map((row) => row.job_id);
}

export async function getSavedJobs(token) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*, job: jobs(*, company: companies(name,logo_url))");

  if (error) {
    console.error("Error fetching Saved Jobs:", error);
    return null;
  }

  return data;
}

export async function getMyJobs(token, { recruiter_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .select("*, company: companies(name,logo_url), applications: applications(*)")
    .eq("recruiter_id", recruiter_id);

  if (error) {
    console.error("Error fetching Jobs:", error);
    return null;
  }

  return data;
}

export async function deleteJob(token, { job_id }) {
  const supabase = await supabaseClient(token);

  const { data, error: deleteError } = await supabase
    .from("jobs")
    .delete()
    .eq("id", job_id)
    .select();

  if (deleteError) {
    console.error("Error deleting job:", deleteError);
    return data;
  }

  return data;
}