import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Defer parallax init until after DOM is ready
function initParallax() {
  try {
    import("./utils/parallax").then(({ initCurrencyParallax }) => {
      const parallax = initCurrencyParallax(8);
      parallax.start();
    }).catch(() => {
      // Silently fail if parallax module fails to load
    });
  } catch {
    // Silently fail — parallax is optional decorative enhancement
  }
}

// Initialize React first, then parallax
createRoot(document.getElementById("root")!).render(<App />);

// Wait for DOM to be fully loaded before initializing parallax
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initParallax);
} else {
  initParallax();
}
