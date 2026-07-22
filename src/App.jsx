import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import { shadesOfPurple } from '@clerk/themes';
import './App.css';
import AppLayout from './layouts/app-layout';
import MarketingLayout from './layouts/marketing-layout';
import LandingPage from './pages/landing';
import Onboarding from './pages/onboarding';

// Public (guest-accessible)
import JobsPage from './pages/jobs';
import JobDetailsPage from './pages/job-details';
import CompaniesPage from './pages/companies';
import CompanyDetailsPage from './pages/company-details';
import AboutPage from './pages/about';
import ContactPage from './pages/contact';
import PrivacyPage from './pages/privacy';
import TermsPage from './pages/terms';

// Candidate (protected)
import DashboardPage from './pages/dashboard';
import DiscoverJobsPage from './pages/discover-jobs';
import ProfilePage from './pages/profile';
import ResumePage from './pages/resume';
import ApplicationsPage from './pages/applications';
import SavedJobsPage from './pages/saved';
import SettingsPage from './pages/settings';

// Employer (protected)
import EmployerDashboardPage from './pages/employer/dashboard';
import EmployerPostJobPage from './pages/employer/post-job';
import EmployerJobsPage from './pages/employer/jobs';
import EmployerApplicationsPage from './pages/employer/applications';
import EmployerJobApplicantsPage from './pages/employer/job-applicants';
import EmployerCompanyPage from './pages/employer/company';
import CompanyWorkspacePage from './pages/employer/company-workspace';

import { ThemeProvider } from './components/theme-provider';
import ProtectedRoute from './components/protected-route';

const router = createBrowserRouter([
  {
    // Public / guest-accessible — full-bleed marketing shell (header+footer)
    element: <MarketingLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/jobs", element: <JobsPage /> },
      { path: "/jobs/:id", element: <JobDetailsPage /> },
      { path: "/companies", element: <CompaniesPage /> },
      { path: "/companies/:id", element: <CompanyDetailsPage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/privacy", element: <PrivacyPage /> },
      { path: "/terms", element: <TermsPage /> },
      {
        path: "/onboarding",
        element: (
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    // Authenticated app — container layout with the app header
    element: <AppLayout />,
    children: [
      // Candidate
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/dashboard/jobs",
        element: (
          <ProtectedRoute>
            <DiscoverJobsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/resume",
        element: (
          <ProtectedRoute>
            <ResumePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/applications",
        element: (
          <ProtectedRoute>
            <ApplicationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/saved",
        element: (
          <ProtectedRoute>
            <SavedJobsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      // Employer — role="recruiter" ensures a signed-in candidate who lands
      // here directly (e.g. the "Post a Job" / "Employer Dashboard" footer
      // links) gets bounced back to their own dashboard instead of seeing a
      // broken, empty employer view.
      {
        path: "/employer/dashboard",
        element: (
          <ProtectedRoute role="recruiter">
            <EmployerDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/employer/post-job",
        element: (
          <ProtectedRoute role="recruiter">
            <EmployerPostJobPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/employer/jobs",
        element: (
          <ProtectedRoute role="recruiter">
            <EmployerJobsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/employer/jobs/:jobId/applicants",
        element: (
          <ProtectedRoute role="recruiter">
            <EmployerJobApplicantsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/employer/applications",
        element: (
          <ProtectedRoute role="recruiter">
            <EmployerApplicationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/employer/company",
        element: (
          <ProtectedRoute role="recruiter">
            <EmployerCompanyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/employer/company/:companyId/workspace",
        element: (
          <ProtectedRoute role="recruiter">
            <CompanyWorkspacePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {/*
        routerPush / routerReplace hand Clerk's internal navigation (UserButton.Link
        items, afterSignOutUrl, sign-in/up redirects, etc.) off to the SPA router
        instead of doing a full page load via window.location. Without these,
        every Clerk-driven link — e.g. "My Applications" / "Saved Jobs" in the
        candidate menu — hard-reloads the page instead of routing client-side.
      */}
      <ClerkProvider
        appearance={{ baseTheme: shadesOfPurple }}
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        routerPush={(to) => router.navigate(to)}
        routerReplace={(to) => router.navigate(to, { replace: true })}
      >
        <RouterProvider router={router} />
      </ClerkProvider>
    </ThemeProvider>
  );
}

export default App;