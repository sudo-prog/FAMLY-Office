import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  OnboardingWizard,
} from "./OnboardingWizard";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Stop pulsing after first open
  const handleOpen = () => {
    setPulse(false);
    setOpen(true);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Tooltip */}
        <AnimatePresence>
          {pulse && !open && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="relative bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
            >
              Take the tour
              <div className="absolute -bottom-1 right-4 w-2 h-2 bg-primary rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating button */}
        <motion.button
          onClick={handleOpen}
          className="group relative w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Take the tour"
        >
          <HelpCircle className="w-5 h-5" />
          {/* Pulse ring */}
          {pulse && (
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
          )}
        </motion.button>
      </div>

      <OnboardingWizard
        open={open}
        onClose={() => setOpen(false)}
        onComplete={() => setPulse(false)}
      />
    </>
  );
}
