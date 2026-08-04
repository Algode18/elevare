import supabaseClient from "@/utils/supabase";

// PostgREST's .or()/.ilike() syntax treats "," "(" ")" "%" "*" as
// structural characters — a stray one in a typed search term would
// otherwise corrupt the filter string (or silently no-op it). Strip them
// out of each term before it goes into any ilike/in pattern below.
function sanitizeTerm(term) {
  return term.replace(/[,()%*]/g, "").trim();
}

export async function getJobs(token, { location, company_id, searchQuery, job_type, work_mode }) {
  const supabase = await supabaseClient(token);

  // Builds a fresh query with the non-search filters applied. Needs to be
  // callable twice: supabase-js v2's filter methods (.eq/.or/etc.) mutate
  // the builder and return `this` rather than cloning, so the strict pass
  // and the fallback pass below each need their own builder — reusing one
  // would let the strict pass's .or() leak into the fallback pass.
  const baseQuery = () => {
    let q = supabase
      .from("jobs")
      .select("*, company: companies(name,logo_url,verification_status)")
      .eq("isOpen", true);

    if (location) q = q.eq("location", location);
    if (company_id) q = q.eq("company_id", company_id);
    if (job_type) q = q.eq("job_type", job_type);
    if (work_mode) q = q.eq("work_mode", work_mode);

    return q;
  };

  const terms = (searchQuery || "")
    .trim()
    .split(/\s+/)
    .map(sanitizeTerm)
    .filter(Boolean);
  const cleanPhrase = sanitizeTerm((searchQuery || "").trim());

  if (terms.length) {
    // Strict pass first: does the whole phrase, as typed, sit contiguously
    // in the title or description? This is what most multi-word queries
    // ("backend developer", "cloud architect") actually mean, and it's the
    // only pass that can't produce cross-field false positives (e.g. a
    // "Frontend Developer" job matching "backend developer" just because
    // "backend" happens to appear in its description and "developer"
    // happens to appear in its title).
    const { data: strictData, error: strictError } = await baseQuery()
      .or([`title.ilike.%${cleanPhrase}%`, `description.ilike.%${cleanPhrase}%`].join(","))
      .order("created_at", { ascending: false });

    if (strictError) {
      console.error("Error fetching Jobs:", strictError);
      return null;
    }

    if (strictData && strictData.length) {
      return strictData;
    }

    // Fallback pass: nothing matched the phrase exactly, so loosen up.
    // Company name lives in a joined table, so a plain ilike on the
    // "jobs" query can't reach it — resolve any term that matches a
    // company name to that company's id(s) first, per term, so
    // "microsoft backend" can match a Backend Developer role at
    // Microsoft even though neither word alone sits in one field.
    const { data: companyRows } = await supabase.from("companies").select("id, name");
    const companyIdsByTerm = terms.map((term) => {
      const t = term.toLowerCase();
      return (companyRows || [])
        .filter((c) => c.name?.toLowerCase().includes(t))
        .map((c) => c.id);
    });

    // AND across words (every word in the query must match *something*),
    // OR across fields for each individual word (title, description,
    // location, work mode, job type, or company name). Chaining .or()
    // multiple times ANDs the groups together in supabase-js. Looser than
    // the strict pass above, so it's only used when the strict pass finds
    // nothing — it exists for sparse queries like "microsoft backend"
    // where no single field ever contains the whole phrase.
    let fallbackQuery = baseQuery();
    terms.forEach((term, i) => {
      const orParts = [
        `title.ilike.%${term}%`,
        `description.ilike.%${term}%`,
        `location.ilike.%${term}%`,
        `work_mode.ilike.%${term}%`,
        `job_type.ilike.%${term}%`,
      ];
      const companyIds = companyIdsByTerm[i];
      if (companyIds.length) orParts.push(`company_id.in.(${companyIds.join(",")})`);
      fallbackQuery = fallbackQuery.or(orParts.join(","));
    });

    const { data, error } = await fallbackQuery.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching Jobs:", error);
      return null;
    }

    return data;
  }

  const { data, error } = await baseQuery().order("created_at", { ascending: false });

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
      "*, company:companies(id,name,logo_url,verification_status,industry,company_size,headquarters), applications: applications(*)"
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
    .select(
      "*, company: companies(name,logo_url,verification_status), applications: applications(*)"
    )
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