import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Shortens "₹1,20,000 - ₹2,00,000 / year" -> "₹1.2L - ₹2L / year" so salary
// reads at a glance on cards. Falls back to the original string for any
// currency/format it doesn't recognize (non-₹ values, single figures, etc).
export function shortenSalaryRange(raw) {
  if (!raw) return null;
  const toShort = (numStr) => {
    const n = Number(numStr.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return null;
    if (n >= 10000000) return `${trimZero(n / 10000000)}Cr`;
    if (n >= 100000) return `${trimZero(n / 100000)}L`;
    if (n >= 1000) return `${trimZero(n / 1000)}K`;
    return `${n}`;
  };
  const trimZero = (n) => (Number.isInteger(n) ? `${n}` : n.toFixed(1).replace(/\.0$/, ""));

  let result = raw;
  let matched = false;
  result = result.replace(/₹\s?([\d,]+)/g, (match, numStr) => {
    const short = toShort(numStr);
    if (!short) return match;
    matched = true;
    return `₹${short}`;
  });
  return matched ? result : raw;
}