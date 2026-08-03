import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Sparkles } from "lucide-react";
import {
  OnboardingWizard,
  hasSeenOnboarding,
  resetOnboarding,
} from "./OnboardingWizard";
import { QuickAskPopover } from "./QuickAskPopover";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  // Check onboarding state on mount
  useEffect(() => {
    setHasSeenTour(hasSeenOnboarding());
  }, []);

  // Listen for storage events to update state live (cross-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "famly-onboarding-done") {
        setHasSeenTour(hasSeenOnboarding());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Stop pulsing after first open
  const handleOpen = () => {
    setPulse(false);
    setOpen(true);
  };

  const handleReplayTour = () => {
    resetOnboarding();
    setHasSeenTour(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleTourComplete = () => {
    setPulse(false);
    setHasSeenTour(true);
  };

  // Auto-dismiss tooltip after 6s even if untapped
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const tourCompleted = hasSeenTour;

  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2">
        {/* Tooltip — changes text after tour is completed */}
        <AnimatePresence>
          {pulse && !open && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="relative bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
            >
              {tourCompleted ? "AI Chat" : "Take the tour"}
              <div className="absolute -bottom-1 right-4 w-2 h-2 bg-primary rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating button — swaps icon + aria-label after tour completion */}
        <motion.button
          onClick={handleOpen}
          className="group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={tourCompleted ? "AI Chat" : "Take the tour"}
        >
          {tourCompleted ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <HelpCircle className="w-5 h-5" />
          )}
          {/* Pulse ring */}
          {pulse && (
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
          )}
        </motion.button>
      </div>

      {/* Onboarding tour wizard — shown before tour is completed */}
      {!tourCompleted && (
        <OnboardingWizard
          open={open}
          onClose={handleClose}
          onComplete={handleTourComplete}
        />
      )}

      {/* AI Chat popover — shown after tour is completed */}
      {tourCompleted && (
        <QuickAskPopover
          open={open}
          onClose={handleClose}
          onReplayTour={handleReplayTour}
        />
      )}
    </>
  );
}
