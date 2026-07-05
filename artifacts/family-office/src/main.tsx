import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// Configure API base URL from environment or use relative path for same-origin
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
setBaseUrl(apiBaseUrl || null);

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
