/**
 * CurrencyParallaxController — Gyroscope parallax for banknote-style elements
 * 
 * Listens to device orientation (gyroscope) and applies subtle transform shifts
 * to elements with the `[data-parallax]` attribute, creating a depth illusion
 * similar to the holographic foil on currency/banknotes.
 * 
 * Falls back to mouse movement on desktop (no DeviceOrientation support).
 */

interface ParallaxState {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

export class CurrencyParallaxController {
  private state: ParallaxState = { x: 0, y: 0 };
  private target: ParallaxState = { x: 0, y: 0 };
  private rafId: number | null = null;
  private active = false;
  private elements: Set<HTMLElement> = new Set();
  private maxShift = 8; // max pixels of shift

  constructor(maxShift = 8) {
    this.maxShift = maxShift;
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.collectElements();
    this.attachListeners();
    this.tick();
  }

  stop() {
    this.active = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.detachListeners();
  }

  refresh() {
    this.collectElements();
  }

  private collectElements() {
    const found = document.querySelectorAll<HTMLElement>('[data-parallax]');
    this.elements = new Set(found);
    // Also apply to security-ribbon-track and effect-emboss-blind elements
    document.querySelectorAll('.security-ribbon-track').forEach((el) => {
      this.elements.add(el as HTMLElement);
    });
  }

  private onOrientation = (e: DeviceOrientationEvent) => {
    const gamma = e.gamma ?? 0; // left-right tilt: -90 to 90
    const beta = e.beta ?? 0;   // front-back tilt: -180 to 180
    this.target.x = Math.max(-1, Math.min(1, gamma / 30));
    this.target.y = Math.max(-1, Math.min(1, (beta - 45) / 30));
  };

  private onMouseMove = (e: MouseEvent) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    this.target.x = (e.clientX - cx) / cx;
    this.target.y = (e.clientY - cy) / cy;
  };

  private attachListeners() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      // iOS 13+ requires permission
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', this.onOrientation);
          } else {
            window.addEventListener('mousemove', this.onMouseMove);
          }
        })
        .catch(() => {
          window.addEventListener('mousemove', this.onMouseMove);
        });
    } else if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.onOrientation);
      // Fallback to mouse if no events fire within 2s
      const timeout = setTimeout(() => {
        if (this.target.x === 0 && this.target.y === 0) {
          window.removeEventListener('deviceorientation', this.onOrientation);
          window.addEventListener('mousemove', this.onMouseMove);
        }
      }, 2000);
      this._fallbackTimeout = timeout;
    } else {
      window.addEventListener('mousemove', this.onMouseMove);
    }
  }

  private _fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

  private detachListeners() {
    window.removeEventListener('deviceorientation', this.onOrientation);
    window.removeEventListener('mousemove', this.onMouseMove);
    if (this._fallbackTimeout) {
      clearTimeout(this._fallbackTimeout);
      this._fallbackTimeout = null;
    }
  }

  private tick = () => {
    if (!this.active) return;
    // Smooth interpolation (lerp)
    const lerp = 0.08;
    this.state.x += (this.target.x - this.state.x) * lerp;
    this.state.y += (this.target.y - this.state.y) * lerp;

    this.elements.forEach((el) => {
      const depth = parseFloat(el.dataset.parallax || '1');
      const shiftX = this.state.x * this.maxShift * depth;
      const shiftY = this.state.y * this.maxShift * depth;
      // For security ribbon, shift background position instead of transform
      if (el.classList.contains('security-ribbon-track')) {
        el.style.backgroundPosition = `${shiftX * 2}px ${shiftY * 2}px`;
      } else {
        el.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
      }
    });

    this.rafId = requestAnimationFrame(this.tick);
  };
}

// Singleton instance
let instance: CurrencyParallaxController | null = null;

export function initCurrencyParallax(maxShift?: number): CurrencyParallaxController {
  if (!instance) {
    instance = new CurrencyParallaxController(maxShift);
  }
  return instance;
}
