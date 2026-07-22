import LegalPage from "@/components/legal-page";

const sections = [
  {
    title: "Acceptance of terms",
    body: `By creating an account or using Elevare, you agree to these terms. If you
don't agree, please don't use the platform.`,
  },
  {
    title: "Accounts",
    body: `You need an account to apply to jobs, save listings, post jobs, or manage a
company profile. You're responsible for the accuracy of the information you
provide and for anything that happens under your account. Sign-up and login
are handled by Clerk, our authentication provider.

When you first sign up, you choose whether you're joining as a candidate or
an employer. This determines what parts of the product you can access.`,
  },
  {
    title: "Candidate content",
    body: `Anything you add to your profile — resume, skills, education, experience —
is yours. By applying to a job, you're choosing to share that application
(including your resume) with the employer who posted it. Elevare doesn't
review or vouch for the accuracy of what you submit, and it's your
responsibility to keep it truthful.`,
  },
  {
    title: "Employer content",
    body: `If you post as an employer, you're responsible for the accuracy of your
company profile and job listings, and for how you use applicant data you
receive through the platform. Job postings should describe real, genuine
openings. We reserve the right to remove listings or company profiles that
are misleading, fraudulent, or otherwise violate these terms.

Some companies on Elevare display a "verified" badge after a manual
verification process. Verification doesn't guarantee every claim a company
makes in its profile or postings — it reflects that we've reviewed the
company's basic legitimacy.`,
  },
  {
    title: "Acceptable use",
    body: `Don't use Elevare to post false job listings, misrepresent your identity or
qualifications, scrape or bulk-extract data from the platform, or interfere
with other users' ability to use the product. Accounts that do this may be
suspended or removed.`,
  },
  {
    title: "No guarantee of outcomes",
    body: `Elevare helps candidates find and apply to jobs, and helps employers manage
applicants — it doesn't guarantee that any candidate will be hired or that
any employer will find a suitable candidate. Hiring decisions are made
entirely by the employer.`,
  },
  {
    title: "Termination",
    body: `You can delete your account at any time — employers can do this under
Settings → Privacy, which permanently removes owned companies, their jobs,
applications, and team data along with the account itself. We may also
suspend or terminate accounts that violate these terms.`,
  },
  {
    title: "Disclaimer & limitation of liability",
    body: `Elevare is provided "as is," without warranties of any kind. We do our best
to keep the platform reliable and accurate, but we're not liable for hiring
outcomes, the accuracy of user-submitted content, or losses arising from use
of the platform, to the extent permitted by applicable law.`,
  },
  {
    title: "Changes to these terms",
    body: `We may update these terms as the product changes. If a change materially
affects your rights, we'll update the date below and, where appropriate,
let you know directly.`,
  },
  {
    title: "Governing law",
    body: `[Add your governing jurisdiction here before launch — this depends on
where your business is legally registered and isn't something we can fill
in for you.]`,
  },
];

const TermsPage = () => (
  <LegalPage
    title="Terms of Service"
    lastUpdated="July 2026"
    intro="The ground rules for using Elevare, whether you're hiring or being hired."
    sections={sections}
  />
);

export default TermsPage;