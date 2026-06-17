import React, { useState, useEffect, useCallback } from "react";
import { Delete } from "lucide-react";

const PIN_KEY = 'fo-pin';
const PIN_KEY_V2 = 'fo-pin-v2';
const PIN_LENGTH = 6;

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`fo-salt-2025-${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPin(input: string): Promise<boolean> {
  const storedV2 = localStorage.getItem(PIN_KEY_V2);
  if (storedV2) {
    const hash = await hashPin(input);
    return hash === storedV2;
  }
  const storedV1 = localStorage.getItem(PIN_KEY);
  if (storedV1 && input === storedV1) {
    const hash = await hashPin(input);
    localStorage.setItem(PIN_KEY_V2, hash);
    localStorage.removeItem(PIN_KEY);
    return true;
  }
  return false;
}

function hasStoredPin(): boolean {
  return !!(localStorage.getItem(PIN_KEY_V2) || localStorage.getItem(PIN_KEY));
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

  useEffect(() => {
    if (!hasStoredPin()) setMode('setup');
    else setMode('unlock');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      if (e.key === 'Backspace') handleBack();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

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
        const hash = await hashPin(pin);
        localStorage.setItem(PIN_KEY_V2, hash);
        localStorage.removeItem(PIN_KEY);
        onUnlock();
      } else {
        setSetupFirst('');
        setMode('setup');
        triggerShake('PINs did not match — try again');
      }
    } else {
      const ok = await verifyPin(pin);
      if (ok) {
        onUnlock();
      } else {
        triggerShake('Incorrect PIN');
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
                if (key === '⌫') handleBack();
                else if (key !== '') handleDigit(key);
              }}
              disabled={key === ''}
              className={`h-16 rounded-xl text-xl font-medium transition-all select-none
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
              localStorage.removeItem(PIN_KEY);
              localStorage.removeItem(PIN_KEY_V2);
              setMode('setup');
              setDigits('');
              setError('');
            }}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors mt-2"
          >
            Reset PIN
          </button>
        )}

        <p className="text-xs text-muted-foreground/40 text-center">
          Local-first · Zero cloud exposure · AES-256
        </p>
      </div>
    </div>
  );
}
