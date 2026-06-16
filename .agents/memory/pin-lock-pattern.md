---
name: PIN Lock Pattern
description: How the PIN authentication works in Family Office.
---

# PIN Lock Pattern

## Implementation
- `src/components/pin-lock.tsx` wraps the entire app in `App.tsx`
- PIN is stored as plain string in `localStorage['fo-pin']` (intentionally simple — local privacy, not bank security)
- 6-digit numeric keypad
- First visit: "Create Your PIN" → confirm → unlock
- Subsequent: "Enter PIN" → validate against stored → unlock
- "Reset PIN" link on lock screen clears and restarts setup

## Important behavior
- The screenshot tool / automated browser always opens a fresh session, so it always shows the PIN lock screen. This is CORRECT — the lock is working as designed.
- The unlocked state is in React component state only (`useState`), not persisted — so every page load requires PIN entry.

**Why:** User wants privacy lock before sharing/deploying. Not replacing server auth.

**How to apply:** When testing, you must interact with the PIN keypad before any page content is visible. Automated screenshots will always show the lock screen.
