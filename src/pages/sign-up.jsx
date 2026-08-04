import { SignUp } from "@clerk/react";
import AuthLayout from "@/components/auth-layout";

// The auth card is intentionally locked to a light appearance in both site
// themes — Clerk's own free/dev "Development mode" + "Secured by" footer
// strip is plan-gated and can't be fully restyled, so keeping the whole
// card on one fixed light palette guarantees every piece of Clerk-owned
// text (footer, badges, etc.) stays legible instead of chasing contrast
// across two themes. Literal hex values (not CSS var()) because Clerk's
// color engine derives hover/tint/shade variants from these in JS, and its
// own docs flag var() support as limited "for maximum browser compatibility".
const CLERK_LIGHT_PALETTE = {
  colorPrimary: "#6F56F8",
  colorTextOnPrimaryBackground: "#FFFFFF",
  colorBackground: "#FFFFFF",
  colorText: "#0F172A",
  colorTextSecondary: "#64748B",
  colorInputBackground: "#FBFCFE",
  colorInputText: "#0F172A",
  colorNeutral: "#0F172A",
  colorDanger: "#EF4444",
  colorSuccess: "#10B981",
  colorWarning: "#F59E0B",
  colorShimmer: "#FAFBFD",
  colorRing: "#7C5CFC",
};

// Static/literal Tailwind classes (bg-white, text-slate-*, border-slate-*)
// instead of the app's semantic tokens (bg-card, text-foreground, ...) on
// purpose — those tokens flip with the .dark class, which is exactly what
// we're opting the card out of.
const appearance = {
  variables: { ...CLERK_LIGHT_PALETTE, borderRadius: "1rem" },
  elements: {
    rootBox: "w-full",
    // cardBox is the actual floating card Clerk paints — it needs its own
    // border/shadow/padding to read as a distinct card against the page
    // background, the way Clerk's own default styling does. `card` is the
    // element nested inside it, kept flat/unstyled so it doesn't double up.
    cardBox:
      "w-full !bg-white border border-slate-200 shadow-xl shadow-slate-900/10 rounded-3xl p-6 sm:p-8",
    card: "w-full !bg-white shadow-none border-none p-0",
    header: "hidden",
    socialButtonsBlockButton:
      "!bg-white border border-slate-200 hover:border-[#6F56F8]/40 hover:!bg-slate-50 transition-all duration-200 !text-slate-900 rounded-2xl h-12",
    socialButtonsBlockButtonText: "!text-slate-900 font-medium",
    dividerLine: "!bg-slate-200",
    dividerText: "!text-slate-500",
    formFieldLabel: "!text-slate-500 font-medium",
    formFieldInput:
      "!bg-white border-slate-200 !text-slate-900 rounded-2xl h-12 focus:border-[#6F56F8] focus:ring-[#6F56F8]/20 transition-colors duration-200",
    formButtonPrimary:
      "bg-gradient-to-r from-[#6F56F8] to-[#4F8EF7] hover:opacity-90 hover:shadow-[0_8px_24px_rgba(111,86,248,0.3)] hover:-translate-y-0.5 transition-all duration-200 !text-white rounded-2xl h-12 normal-case font-medium",
    footerActionText: "!text-slate-500",
    footerActionLink: "!text-[#6F56F8] hover:!text-[#6F56F8]/80 font-medium",
    identityPreviewText: "!text-slate-900",
    identityPreviewEditButton: "!text-[#6F56F8]",
    // "Secured by Clerk" / dev-mode badge is plan-gated — Clerk forces it
    // visible on free/dev instances so a dev key can't accidentally ship
    // hidden. Keeping this strip on the same fixed light bg as the rest of
    // the card is what keeps it legible instead of a jarring mismatched block.
    footer: "!bg-white",
  },
};

const SignUpPage = () => {
  return (
    <AuthLayout mode="sign-up">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/onboarding"
        appearance={appearance}
      />
    </AuthLayout>
  );
};

export default SignUpPage;