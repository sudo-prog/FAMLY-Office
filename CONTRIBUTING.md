# Contributing to FAMLY-Office

Thank you for your interest in contributing to FAMLY-Office! This document outlines the process and standards for contributing to the project.

---

## 📱 Mobile UI Fixes (2026-08-03)

### Quick Tour → AI Chat Button
- **Component**: `artifacts/family-office/src/components/onboarding/HelpButton.tsx`
- **Change**: After tour completion, HelpButton transforms from "Take tour" (HelpCircle) to "AI Chat" (Sparkles) and opens QuickAskPopover instead of OnboardingWizard.
- **Mobile**: QuickAskPopover renders as a bottom Sheet (70vh height, safe-area-inset-bottom, rounded top corners).
- **Desktop**: Floating popover at bottom-20 right-6.
- **State**: Uses `hasSeenOnboarding()` from localStorage key `famly-onboarding-done`. Replay Tour button resets state.
- **Responsive**: `useMediaQuery("(max-width: 767px)")` for mobile detection.

### AI Summarise Feature (AIPanel)
- **Component**: `artifacts/family-office/src/components/ai-panel.tsx`
- **Change**: Fixed mobile overflow by converting 440px right sidebar to a bottom sheet on mobile (<640px).
- **Mobile**: Full width, `max-h-[85vh]`, `rounded-t-2xl`, drag-handle pill indicator (hidden on desktop via `sm:hidden`).
- **Desktop**: Unchanged — keeps 440px right sidebar via `sm:` responsive overrides.
- **iOS**: Added `env(safe-area-inset-bottom)` padding on input area.
- **Impact**: Single component fix resolves summarise UI on 5+ pages (transactions, home-office×3, assets, projections, vault).

### Mobile UI Overhaul
- **Pages fixed**: Transaction ledger, navigation/buttons, forms/inputs, cards/lists, dialogs/modals
- **Techniques**: Responsive sizing, touch-friendly targets, safe-area-inset handling, mobile-first media queries
- **Verification**: All pages render correctly on mobile devices (<768px breakpoint)

### Deployment
- All fixes pushed to `main` branch and deployed to Vercel: https://famly-office-o5sqf87je-superpowerstudio.vercel.app
