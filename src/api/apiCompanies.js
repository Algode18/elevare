import supabaseClient, { supabaseUrl } from "@/utils/supabase";

// ============================================================================
// Reads
// ============================================================================

export async function getCompanies(token) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("companies")
    .select("*, jobs(id, isOpen)");

  if (error) {
    console.error("Error fetching Companies:", error);
    return null;
  }

  // Fold the raw jobs relation into a single open-roles count so pages
  // don't each have to re-derive it.
  return data.map((c) => ({
    ...c,
    open_roles: c.jobs?.filter((j) => j.isOpen).length ?? 0,
  }));
}

export async function getCompanyById(token, { company_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", company_id)
    .single();

  if (error) {
    console.error("Error fetching Company:", error);
    return null;
  }

  return data;
}

// Fire-and-forget view counter for the public company-details page. Uses an
// RPC (increment_company_profile_views, defined in Supabase) instead of a
// read-then-write from the client so concurrent visitors can't clobber each
// other's increment. No token needed — candidates browsing anonymously can
// still trigger this since it only ever adds 1, never reads/writes anything
// else.
export async function incrementCompanyProfileView(company_id) {
  const supabase = await supabaseClient();
  const { error } = await supabase.rpc("increment_company_profile_views", {
    p_company_id: company_id,
  });

  if (error) {
    console.error("Error incrementing profile views:", error);
  }
}

// Companies this Clerk user actually owns — drives the "which workspace(s)
// can I manage" picker on the /employer/company list page.
export async function getMyCompanies(token, { owner_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", owner_id);

  if (error) {
    console.error("Error fetching owned Companies:", error);
    return null;
  }

  return data;
}

export async function addNewCompany(token, _, companyData) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const fileName = `logo-${random}-${companyData.name}`;

  const { error: storageError } = await supabase.storage
    .from("company-logo")
    .upload(fileName, companyData.logo);

  if (storageError) {
    console.error("Error Uploading Company Logo:", storageError);
    return null;
  }

  const logo_url = `${supabaseUrl}/storage/v1/object/public/company-logo/${fileName}`;

  const { data, error } = await supabase
    .from("companies")
    .insert([
      {
        name: companyData.name,
        logo_url: logo_url,
        // New workspace companies always get a real owner — matches the
        // refactor doc's recommended default (demo companies stay ownerless).
        owner_id: companyData.owner_id,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Companys");
  }

  return data;
}

// ============================================================================
// Overview / Branding / About / Social / Hiring Preferences
// One update fn for all of them — they're all plain columns on `companies`,
// so each tab just passes the subset of fields it owns.
// ============================================================================

export async function updateCompanyProfile(token, { company_id }, fields) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("companies")
    .update(fields)
    .eq("id", company_id)
    .select()
    .single();

  if (error) {
    console.error("Error updating Company profile:", error);
    return null;
  }

  return data;
}

// Deletes every company this user owns — used when an employer deletes
// their account entirely, not just a single company. Same ON DELETE CASCADE
// assumption as deleteCompany below: each delete here takes jobs,
// applications, offices, members, and followers with it.
export async function deleteOwnedCompanies(token, { owner_id }) {
  const supabase = await supabaseClient(token);
  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("owner_id", owner_id);

  if (error) {
    console.error("Error deleting owned Companies:", error);
    throw new Error("Error deleting owned companies");
  }

  return true;
}

// Drops this user's rows from company_members — covers teams they belong to
// but don't own, which deleteOwnedCompanies above wouldn't touch.
export async function removeUserFromAllCompanies(token, { user_id }) {
  const supabase = await supabaseClient(token);
  const { error } = await supabase
    .from("company_members")
    .delete()
    .eq("user_id", user_id);

  if (error) {
    console.error("Error removing user from Company Memberships:", error);
    throw new Error("Error removing company memberships");
  }

  return true;
}

// Permanently deletes a company. Relies on ON DELETE CASCADE foreign keys
// (jobs, applications, company_offices, company_members, company_followers
// all reference company_id/job_id) so this single delete is enough — no
// manual cleanup of dependent rows needed. Owner-only; enforced by the
// calling page (CompanyWorkspacePage) rather than here.
export async function deleteCompany(token, { company_id }) {
  const supabase = await supabaseClient(token);
  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", company_id);

  if (error) {
    console.error("Error deleting Company:", error);
    throw new Error("Error deleting company");
  }

  return true;
}

// Shared uploader for both logo and banner — `kind` picks the bucket/column.
export async function uploadCompanyAsset(token, _, { company_id, file, kind }) {
  const supabase = await supabaseClient(token);
  const bucket = kind === "banner" ? "company-banner" : "company-logo";
  const column = kind === "banner" ? "banner_url" : "logo_url";

  const random = Math.floor(Math.random() * 90000);
  const fileName = `${kind}-${company_id}-${random}`;

  const { error: storageError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true });

  if (storageError) {
    console.error(`Error uploading company ${kind}:`, storageError);
    return null;
  }

  const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;

  const { data, error } = await supabase
    .from("companies")
    .update({ [column]: url })
    .eq("id", company_id)
    .select()
    .single();

  if (error) {
    console.error(`Error saving company ${kind} url:`, error);
    return null;
  }

  return data;
}

// ============================================================================
// Offices
// ============================================================================

export async function getCompanyOffices(token, { company_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("company_offices")
    .select("*")
    .eq("company_id", company_id)
    .order("is_headquarter", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching Company Offices:", error);
    return null;
  }

  return data;
}

export async function addCompanyOffice(token, { company_id }, office) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("company_offices")
    .insert([{ ...office, company_id }])
    .select();

  if (error) {
    console.error("Error adding Company Office:", error);
    return null;
  }

  return data;
}

export async function updateCompanyOffice(token, { office_id }, updates) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("company_offices")
    .update(updates)
    .eq("id", office_id)
    .select();

  if (error) {
    console.error("Error updating Company Office:", error);
    return null;
  }

  return data;
}

export async function deleteCompanyOffice(token, { office_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("company_offices")
    .delete()
    .eq("id", office_id);

  if (error) {
    console.error("Error deleting Company Office:", error);
    return null;
  }

  return data;
}

// ============================================================================
// Team Members
// ============================================================================

export async function getCompanyMembers(token, { company_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("company_members")
    .select("*")
    .eq("company_id", company_id)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("Error fetching Company Members:", error);
    return null;
  }

  return data;
}

export async function addCompanyMember(token, { company_id }, { user_id, role }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("company_members")
    .insert([{ company_id, user_id, role }])
    .select();

  if (error) {
    // 23505 = unique_violation — this user is already a member.
    if (error.code === "23505") {
      console.warn("User is already a member of this company.");
      return { alreadyMember: true };
    }
    console.error("Error adding Company Member:", error);
    return null;
  }

  return data;
}

export async function updateCompanyMemberRole(token, { member_id }, { role }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("company_members")
    .update({ role })
    .eq("id", member_id)
    .select();

  if (error) {
    console.error("Error updating member role:", error);
    return null;
  }

  return data;
}

export async function removeCompanyMember(token, { member_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("company_members")
    .delete()
    .eq("id", member_id);

  if (error) {
    console.error("Error removing Company Member:", error);
    return null;
  }

  return data;
}

// ============================================================================
// Followers
// Public-facing "Follow Company" feature for candidates. Mirrors the
// alreadySaved/saveJob pattern in apiJobs.js: one toggle fn driven by an
// `alreadyFollowing` flag, rather than separate follow/unfollow functions.
// ============================================================================

export async function followCompany(token, { alreadyFollowing }, followData) {
  const supabase = await supabaseClient(token);

  if (alreadyFollowing) {
    const { data, error } = await supabase
      .from("company_followers")
      .delete()
      .eq("company_id", followData.company_id)
      .eq("candidate_id", followData.candidate_id);

    if (error) {
      console.error("Error unfollowing Company:", error);
      return null;
    }

    return data;
  } else {
    const { data, error } = await supabase
      .from("company_followers")
      .insert([followData])
      .select();

    if (error) {
      // 23505 = unique_violation — a company_followers row for this
      // candidate+company already exists (stale client state thought it
      // wasn't following yet). Treat as already-following instead of
      // throwing. Requires a unique constraint on (company_id, candidate_id).
      if (error.code === "23505") {
        console.warn("Already following company, ignoring duplicate insert.");
        return [followData];
      }
      console.error("Error following Company:", error);
      return null;
    }

    return data;
  }
}

// Whether the current candidate already follows this company — drives the
// initial Follow/Following state on the public company page. Returns false
// (rather than throwing) for signed-out guests, so callers can call this
// unconditionally once they have a company id.
export async function getCompanyFollowStatus(token, { company_id, candidate_id }) {
  if (!candidate_id) return false;

  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("company_followers")
    .select("id")
    .eq("company_id", company_id)
    .eq("candidate_id", candidate_id)
    .maybeSingle();

  if (error) {
    console.error("Error checking Company follow status:", error);
    return false;
  }

  return !!data;
}

// Followers list for the workspace. candidate_id is just the Clerk user id
// (no Postgrest FK relation into `profiles`), so this fetches the follow
// rows and the matching profiles separately and merges them in JS.
export async function getCompanyFollowers(token, { company_id }) {
  const supabase = await supabaseClient(token);

  const { data: followers, error } = await supabase
    .from("company_followers")
    .select("*")
    .eq("company_id", company_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Company Followers:", error);
    return null;
  }

  const candidateIds = [...new Set((followers || []).map((f) => f.candidate_id))];
  if (candidateIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, full_name, headline, location")
    .in("user_id", candidateIds);

  if (profilesError) {
    console.error("Error fetching follower profiles:", profilesError);
  }

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

  return followers.map((f) => ({
    ...f,
    profile: profileMap.get(f.candidate_id) || null,
  }));
}

// ============================================================================
// Analytics
// Pulls everything from tables that already exist (jobs, applications,
// company_followers, companies.profile_views) rather than a dedicated
// analytics table — cheap to keep in sync, no extra writes needed elsewhere.
// ============================================================================

export async function getCompanyAnalytics(token, { company_id }) {
  const supabase = await supabaseClient(token);

  const [companyRes, jobsRes, followersRes] = await Promise.all([
    supabase
      .from("companies")
      .select("profile_views")
      .eq("id", company_id)
      .single(),
    supabase
      .from("jobs")
      .select("id, title, isOpen, applications(id, status, status_updated_at, created_at)")
      .eq("company_id", company_id),
    supabase
      .from("company_followers")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id),
  ]);

  if (companyRes.error || jobsRes.error || followersRes.error) {
    console.error(
      "Error fetching Company Analytics:",
      companyRes.error || jobsRes.error || followersRes.error
    );
    return null;
  }

  const jobs = jobsRes.data || [];
  const allApplications = jobs.flatMap((j) => j.applications || []);
  const openJobs = jobs.filter((j) => j.isOpen).length;

  const hiredStatuses = ["hired", "accepted"];
  const rejectedStatuses = ["rejected"];
  const hired = allApplications.filter((a) => hiredStatuses.includes(a.status));
  const rejected = allApplications.filter((a) => rejectedStatuses.includes(a.status));

  const avgDays = (rows) => {
    const valid = rows.filter((a) => a.created_at && a.status_updated_at);
    if (!valid.length) return null;
    const totalMs = valid.reduce((sum, a) => {
      const start = new Date(a.created_at).getTime();
      const end = new Date(a.status_updated_at).getTime();
      return sum + Math.max(0, end - start);
    }, 0);
    return Math.round(totalMs / valid.length / (1000 * 60 * 60 * 24));
  };

  const decided = allApplications.filter((a) => a.status !== "applied");

  const mostApplied = jobs
    .map((j) => ({ id: j.id, title: j.title, count: j.applications?.length ?? 0 }))
    .sort((a, b) => b.count - a.count)[0] || null;

  return {
    profile_views: companyRes.data?.profile_views ?? 0,
    followers_count: followersRes.count ?? 0,
    open_jobs: openJobs,
    total_jobs: jobs.length,
    total_applications: allApplications.length,
    hiring_rate: allApplications.length
      ? Math.round((hired.length / allApplications.length) * 100)
      : 0,
    offer_rate: allApplications.length
      ? Math.round(((hired.length + rejected.length) / allApplications.length) * 100)
      : 0,
    acceptance_rate: hired.length + rejected.length
      ? Math.round((hired.length / (hired.length + rejected.length)) * 100)
      : 0,
    avg_hiring_time_days: avgDays(hired),
    avg_response_time_days: avgDays(decided),
    most_applied_job: mostApplied,
  };
}