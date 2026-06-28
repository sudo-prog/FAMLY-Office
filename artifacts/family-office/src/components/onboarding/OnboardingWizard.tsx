import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  FileKey,
  Sparkles,
  Palette,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "famly-onboarding-done";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to FAMLY-Office",
    description:
      "Your comprehensive family office management platform. Track assets, manage transactions, store documents securely, and gain AI-powered financial insights — all in one place.",
    icon: Home,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "dashboard",
    title: "Your Financial Command Center",
    description:
      "The dashboard gives you a bird's-eye view of your net worth, asset allocation, recent transactions, and performance charts. Customize widgets to see what matters most to you.",
    icon: LayoutDashboard,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "transactions",
    title: "Track Every Transaction",
    description:
      "Record income, expenses, transfers, and investments with ease. Categorize transactions, attach receipts, and filter by account, entity, or date range for complete financial clarity.",
    icon: ArrowLeftRight,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "assets",
    title: "Manage Your Portfolio",
    description:
      "Track stocks, bonds, real estate, crypto, and alternative investments. Monitor live prices, view historical performance, and see allocation breakdowns across all your holdings.",
    icon: Wallet,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    id: "vault",
    title: "Secure Document Storage",
    description:
      "Store sensitive financial documents in an encrypted vault. Tax returns, contracts, statements, and more — organized and protected with bank-level encryption.",
    icon: FileKey,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "ai",
    title: "AI-Powered Insights",
    description:
      "Ask questions about your finances in natural language. Get investment suggestions, tax optimization strategies, cash flow forecasts, and spending pattern analysis from our AI assistant.",
    icon: Sparkles,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    id: "customize",
    title: "Make It Yours",
    description:
      "Personalize your dashboard with drag-and-drop widgets, choose your theme, set up watchlists, configure notifications, and tailor reports to match your family office workflow.",
    icon: Palette,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
];

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 280 : -280,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 280 : -280,
    opacity: 0,
  }),
};

const transition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export function OnboardingWizard({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  const goNext = useCallback(() => {
    if (isLast) {
      localStorage.setItem(STORAGE_KEY, "true");
      onComplete?.();
      onClose();
      return;
    }
    setDirection(1);
    setCurrentStep((s) => s + 1);
  }, [isLast, onComplete, onClose]);

  const goBack = useCallback(() => {
    if (isFirst) return;
    setDirection(-1);
    setCurrentStep((s) => s - 1);
  }, [isFirst]);

  const skipAll = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    onComplete?.();
    onClose();
  }, [onComplete, onClose]);

  // Reset step when reopening
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setDirection(1);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft" && !isFirst) goBack();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, goNext, goBack, isFirst]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-xl mx-4 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Step content */}
          <div className="h-[420px] overflow-hidden relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step.id}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="absolute inset-0 flex flex-col items-center justify-center p-8"
              >
                {/* Icon */}
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", step.bgColor)}>
                  <step.icon className={cn("w-8 h-8", step.color)} />
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-center mb-3">
                  {step.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-md">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer: progress dots + actions */}
          <div className="border-t border-border px-6 py-4 flex items-center justify-between">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === currentStep
                      ? "w-6 h-2 bg-primary"
                      : "w-2 h-2 bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={skipAll}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip Tour
              </button>

              {!isFirst && (
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              )}

              <button
                onClick={goNext}
                className="flex items-center gap-1 px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {isLast ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function resetOnboarding(): void {
  localStorage.removeItem(STORAGE_KEY);
}
