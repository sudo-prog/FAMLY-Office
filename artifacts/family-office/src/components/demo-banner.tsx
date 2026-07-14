import React from "react";
import { Info } from "lucide-react";

/** True when the app is running in public-demo mode (temporary, non-persistent data). */
export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === "true";
}

/** Suffix appended to delete-confirmation prompts while in demo mode. */
export const DEMO_DELETE_NOTE = "\n\nNote: changes are not permanently saved in this demo.";

/**
 * Wraps a native confirm() message, appending an honest demo note when demo
 * mode is active. Keeps existing confirm() call-sites minimal.
 */
export function demoConfirm(message: string): boolean {
  return window.confirm(isDemoMode() ? message + DEMO_DELETE_NOTE : message);
}

/**
 * Sticky top banner shown only in public-demo mode, making it explicit that
 * data is temporary and non-persistent.
 */
export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="sticky top-0 z-[110] w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs md:text-sm px-4 py-2 flex items-center justify-center gap-2 text-center">
      <Info className="w-3.5 h-3.5 flex-shrink-0" />
      <span>
        This is a public demo with temporary, non-persistent data. For a durable, private instance, run locally with your own Postgres.
      </span>
    </div>
  );
}
