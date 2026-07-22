import LegalPage from "@/components/legal-page";

const sections = [
  {
    title: "Overview",
    body: `This policy describes what Elevare collects, how it's used, and how you can
control it. It's written in plain language and describes what the product
actually does — not boilerplate copied from somewhere else.`,
  },
  {
    title: "Information we collect",
    body: `When you create an account, our authentication provider (Clerk) stores your
name, email address, and profile photo if you sign in with a social account.

If you sign up as a candidate, your profile — headline, skills, education,
experience, and any resume file you upload — is stored in our database and
file storage (Supabase). If you sign up as an employer, we store the company
profile you create (name, logo, description, offices) and the jobs you post.

When you apply to a job, your application — including your resume and
profile details at the time of applying — is stored and linked to that job.
When you save a job, we store that association so it shows up on your
dashboard.`,
  },
  {
    title: "How we use your information",
    body: `We use your information to operate the core product: showing you jobs that
match your search, letting employers review applications, tracking
application status through the hiring pipeline, and showing career insights
computed from live job data. We don't use your data for anything beyond
running the platform you're using.`,
  },
  {
    title: "How we share your information",
    body: `When you apply to a job, the employer who posted it can see your
application — your profile details and resume — so they can evaluate you as
a candidate. That's the only case where your information is shared with
another party through the product.

We do not sell your data, and we do not share it with advertisers. Elevare
doesn't run ads and has no third-party analytics or tracking scripts.`,
  },
  {
    title: "Data storage & security",
    body: `Your account credentials are managed by Clerk, our authentication provider.
Everything else — profiles, resumes, jobs, applications, and company data —
is stored in Supabase (PostgreSQL) with row-level security policies that
restrict who can read or write each record. Only you can see your own
application history; only a company's owner and team members can see that
company's applicants.`,
  },
  {
    title: "Cookies & sessions",
    body: `Elevare uses cookies only to keep you signed in between visits, managed by
Clerk. We don't use cookies for advertising or third-party tracking.`,
  },
  {
    title: "Your rights & account deletion",
    body: `You can request an account deletion at any time. Employers can find this
under Settings → Privacy — deleting your account permanently removes any
companies you own, their jobs, applications, offices, and team memberships,
along with your login itself. This can't be undone once confirmed.

If you have questions about your data outside of what's covered by that
flow, reach out — see Contact below.`,
  },
  {
    title: "Children's privacy",
    body: `Elevare isn't directed at children, and we don't knowingly collect
information from anyone under the age required by applicable law to hold an
account in their region.`,
  },
  {
    title: "Changes to this policy",
    body: `If this policy changes in a way that materially affects how your data is
handled, we'll update the date below and, where appropriate, let you know
directly.`,
  },
];

const PrivacyPage = () => (
  <LegalPage
    title="Privacy Policy"
    lastUpdated="July 2026"
    intro="What we collect, how it's used, and how you can control it — in plain language, describing what the product actually does."
    sections={sections}
  />
);

export default PrivacyPage;