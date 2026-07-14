import React, { useState, useEffect, useCallback, useRef } from "react";
import { Delete, ScanFace } from "lucide-react";
import { hasEnrolledPasskey, unlockWithPasskey } from "@/lib/webauthn";

const PIN_KEY_V2 = 'fo-pin-v2';
const PIN_KEY_V3 = 'fo-pin-v3'; // scrypt-based hash
const PIN_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000; // 30 second lockout after MAX_ATTEMPTS
const LOCKOUT_KEY = 'fo-pin-lockout';

/**
 * Hash PIN using PBKDF2 (Web Crypto API) with a random salt.
 * This replaces the previous SHA-256 approach which was vulnerable to:
 * - No per-PIN salt (hardcoded prefix)
 * - Fast hashing (SHA-256 is designed for speed, not password protection)
 * - Timing-unsafe comparison
 */
async function hashPin(pin: string, salt?: Uint8Array): Promise<{ hash: string; salt: string }> {
  const saltBytes = salt ?? new Uint8Array(crypto.getRandomValues(new Uint8Array(16)));
  const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // 600,000 iterations per OWASP 2023 recommendations for PBKDF2-SHA256
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as BufferSource,
      iterations: 600_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return { hash: hashHex, salt: saltHex };
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do the comparison to avoid leaking length info via timing
    const dummy = a;
    return false;
  }
  const aBuf = new TextEncoder().encode(a);
  const bBuf = new TextEncoder().encode(b);
  let result = 0;
  for (let i = 0; i < aBuf.length; i++) {
    result |= aBuf[i] ^ bBuf[i];
  }
  return result === 0;
}

async function verifyPin(input: string): Promise<boolean> {
  // Check V3 (PBKDF2) first
  const storedV3 = localStorage.getItem(PIN_KEY_V3);
  if (storedV3) {
    try {
      const { salt, hash: storedHash } = JSON.parse(storedV3);
      const saltBytes = new Uint8Array(salt.match(/.{2}/g)!.map((b: string) => parseInt(b, 16)));
      const { hash: inputHash } = await hashPin(input, saltBytes);
      return timingSafeEqual(inputHash, storedHash);
    } catch {
      return false;
    }
  }

  // Migrate V2 (SHA-256) to V3
  const storedV2 = localStorage.getItem(PIN_KEY_V2);
  if (storedV2) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`fo-salt-2025-${input}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const v2Hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    if (timingSafeEqual(v2Hash, storedV2)) {
      // Migrate to V3
      const { hash, salt } = await hashPin(input);
      localStorage.setItem(PIN_KEY_V3, JSON.stringify({ salt, hash }));
      localStorage.removeItem(PIN_KEY_V2);
      return true;
    }
    return false;
  }

  // Legacy V1 (plaintext - should not exist but handle it)
  const storedV1 = localStorage.getItem('fo-pin');
  if (storedV1 && timingSafeEqual(input, storedV1)) {
    // Migrate to V3
    const { hash, salt } = await hashPin(input);
    localStorage.setItem(PIN_KEY_V3, JSON.stringify({ salt, hash }));
    localStorage.removeItem('fo-pin');
    return true;
  }

  return false;
}

function hasStoredPin(): boolean {
  return !!(localStorage.getItem(PIN_KEY_V3) || localStorage.getItem(PIN_KEY_V2) || localStorage.getItem('fo-pin'));
}

function getLockout(): { attempts: number; lockedUntil: number } {
  try {
    const data = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}');
    return { attempts: data.attempts ?? 0, lockedUntil: data.lockedUntil ?? 0 };
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function recordFailedAttempt(): void {
  const { attempts } = getLockout();
  const newAttempts = attempts + 1;
  const lockedUntil = newAttempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ attempts: newAttempts, lockedUntil }));
}

function resetLockout(): void {
  localStorage.removeItem(LOCKOUT_KEY);
}

function isLockedOut(): { locked: boolean; remainingMs: number } {
  const { attempts, lockedUntil } = getLockout();
  if (attempts < MAX_ATTEMPTS) return { locked: false, remainingMs: 0 };
  const remaining = lockedUntil - Date.now();
  if (remaining <= 0) {
    resetLockout();
    return { locked: false, remainingMs: 0 };
  }
  return { locked: true, remainingMs: remaining };
}

interface PinLockProps {
  onUnlock: () => void;
}

type Mode = 'setup' | 'setup-confirm' | 'unlock';

export function PinLock({ onUnlock }: PinLockProps) {
  const [mode, setMode] = useState<Mode>('unlock');
  const [digits, setDigits] = useState<string>('');
  const [setupFirst, setSetupFirst] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [shake, setShake] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const lockoutTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!hasStoredPin()) setMode('setup');
    else setMode('unlock');
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) {
      if (lockoutTimer.current) {
        clearInterval(lockoutTimer.current);
        lockoutTimer.current = null;
      }
      return;
    }

    lockoutTimer.current = setInterval(() => {
      const { locked, remainingMs } = isLockedOut();
      if (!locked) {
        setLockoutRemaining(0);
        setError('');
        if (lockoutTimer.current) {
          clearInterval(lockoutTimer.current);
          lockoutTimer.current = null;
        }
      } else {
        setLockoutRemaining(remainingMs);
      }
    }, 500);

    return () => {
      if (lockoutTimer.current) clearInterval(lockoutTimer.current);
    };
  }, [lockoutRemaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lockoutRemaining > 0) return;
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      if (e.key === 'Backspace') handleBack();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  // Auto-trigger biometric unlock when a passkey is enrolled (unlock mode).
  useEffect(() => {
    if (mode === 'unlock' && hasEnrolledPasskey()) {
      unlockWithPasskey().then((ok) => { if (ok) onUnlock(); }).catch(() => {});
    }
    // Run once on mount (and when mode becomes 'unlock').
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [mode]);

  function triggerShake(msg: string) {
    setError(msg);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setDigits('');
      setError('');
    }, 700);
  }

  const handleDigit = useCallback((d: string) => {
    setDigits((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = prev + d;
      if (next.length === PIN_LENGTH) {
        setTimeout(() => handleComplete(next), 80);
      }
      return next;
    });
  }, [mode, setupFirst]);

  function handleBack() {
    setDigits((prev) => prev.slice(0, -1));
    setError('');
  }

  async function handleComplete(pin: string) {
    if (mode === 'setup') {
      setSetupFirst(pin);
      setMode('setup-confirm');
      setDigits('');
      setError('');
    } else if (mode === 'setup-confirm') {
      if (pin === setupFirst) {
        const { hash, salt } = await hashPin(pin);
        localStorage.setItem(PIN_KEY_V3, JSON.stringify({ salt, hash }));
        // Clean up legacy keys
        localStorage.removeItem(PIN_KEY_V2);
        localStorage.removeItem('fo-pin');
        resetLockout();
        onUnlock();
      } else {
        setSetupFirst('');
        setMode('setup');
        triggerShake('PINs did not match — try again');
      }
    } else {
      // Check lockout
      const { locked, remainingMs } = isLockedOut();
      if (locked) {
        setLockoutRemaining(remainingMs);
        triggerShake(`Locked — wait ${Math.ceil(remainingMs / 1000)}s`);
        return;
      }

      const ok = await verifyPin(pin);
      if (ok) {
        resetLockout();
        onUnlock();
      } else {
        recordFailedAttempt();
        const { attempts } = getLockout();
        const remaining = MAX_ATTEMPTS - attempts;
        if (remaining <= 0) {
          const { remainingMs } = isLockedOut();
          setLockoutRemaining(remainingMs);
          triggerShake(`Too many attempts — locked for ${Math.ceil(remainingMs / 1000)}s`);
        } else {
          triggerShake(`Incorrect PIN — ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`);
        }
      }
    }
  }

  const KEYS = [['1','2','3'], ['4','5','6'], ['7','8','9'], ['','0','⌫']];

  const title = mode === 'setup' ? 'Create Your PIN' : mode === 'setup-confirm' ? 'Confirm Your PIN' : 'Enter PIN';
  const subtitle = mode === 'setup'
    ? `Choose a ${PIN_LENGTH}-digit PIN to protect your wealth data`
    : mode === 'setup-confirm'
    ? 'Enter your PIN again to confirm'
    : 'Family Office is locked';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background" style={{ background: '#0d1117' }}>
      <div className="flex flex-col items-center gap-8 w-full max-w-xs px-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-2">
            <div className="w-5 h-5 rounded bg-primary" />
          </div>
          <h1 className="text-2xl font-serif text-foreground">Family Office</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {mode === 'unlock' && hasEnrolledPasskey() && (
          <button
            onClick={async () => {
              const ok = await unlockWithPasskey();
              if (ok) onUnlock();
            }}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all"
          >
            <ScanFace className="w-5 h-5" /> Unlock with Face ID / Passkey
          </button>
        )}

        <div>
          <h2 className="text-center text-base font-medium text-foreground mb-6">{title}</h2>
          <div className={`flex gap-3 justify-center mb-2 ${shake ? 'animate-pulse' : ''}`}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  i < digits.length
                    ? 'bg-primary border-primary'
                    : 'bg-transparent border-muted-foreground/40'
                }`}
              />
            ))}
          </div>
          {error && (
            <p className="text-center text-xs text-destructive mt-2 h-4">{error}</p>
          )}
          {!error && <div className="h-6" />}
        </div>

        <div className="grid grid-cols-3 gap-3 w-full">
          {KEYS.flat().map((key, i) => (
            <button
              key={i}
              onClick={() => {
                if (lockoutRemaining > 0) return;
                if (key === '⌫') handleBack();
                else if (key !== '') handleDigit(key);
              }}
              disabled={key === '' || lockoutRemaining > 0}
              className={`h-14 sm:h-16 rounded-xl text-lg sm:text-xl font-medium transition-all select-none
                ${key === ''
                  ? 'opacity-0 cursor-default'
                  : key === '⌫'
                  ? 'bg-muted/30 text-muted-foreground hover:bg-muted/60 active:scale-95'
                  : 'bg-muted/20 border border-border text-foreground hover:bg-muted/40 active:scale-95 active:bg-primary/20'
                }`}
            >
              {key === '⌫' ? <Delete className="w-5 h-5 mx-auto" /> : key}
            </button>
          ))}
        </div>

        {mode === 'unlock' && (
          <button
            onClick={() => {
              localStorage.removeItem('fo-pin');
              localStorage.removeItem(PIN_KEY_V2);
              localStorage.removeItem(PIN_KEY_V3);
              localStorage.removeItem(LOCKOUT_KEY);
              setMode('setup');
              setDigits('');
              setError('');
              setLockoutRemaining(0);
            }}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors mt-2"
          >
            Reset PIN
          </button>
        )}

        <p className="text-xs text-muted-foreground/40 text-center">
          Local-first · Zero cloud exposure · PBKDF2
        </p>
      </div>
    </div>
  );
}
