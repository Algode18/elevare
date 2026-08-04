// Section + completion logic for the Career Profile dashboard and the
// Quick Profile Check drawer. Pure functions, no DB calls — shared by
// /profile and the apply flow so both stay in sync.

export function getProfileSections(profile, resumesCount = 0) {
  return [
    { key: "personal", label: "Personal", complete: Boolean(profile?.full_name && profile?.location) },
    { key: "experience", label: "Experience", complete: profile?.experience_years != null },
    { key: "education", label: "Education", complete: Boolean(profile?.education) },
    { key: "skills", label: "Skills", complete: Boolean(profile?.skills?.length) },
    { key: "resume", label: "Resume", complete: resumesCount > 0 },
    {
      key: "preferences",
      label: "Preferences",
      complete: Boolean(profile?.phone && (profile?.portfolio_url || profile?.linkedin_url)),
    },
  ];
}

export function getProfileCompletion(profile, resumesCount = 0) {
  const sections = getProfileSections(profile, resumesCount);
  const done = sections.filter((s) => s.complete).length;
  return Math.round((done / sections.length) * 100);
}

// Fields the lightweight "Quick Profile Check" drawer should ask for during
// Apply — only what's missing, never the full form.
const APPLY_REQUIRED_FIELDS = [
  { key: "phone", label: "Phone Number" },
  { key: "portfolio_url", label: "Portfolio" },
  { key: "linkedin_url", label: "LinkedIn" },
  { key: "location", label: "Current Location" },
];

export function getMissingApplyFields(profile) {
  return APPLY_REQUIRED_FIELDS.filter((f) => !profile?.[f.key]);
}

export { APPLY_REQUIRED_FIELDS };