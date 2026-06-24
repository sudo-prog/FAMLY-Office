import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initCurrencyParallax } from "./utils/parallax";

// Initialize gyroscope/mouse parallax for currency design system
const parallax = initCurrencyParallax(8);
parallax.start();

createRoot(document.getElementById("root")!).render(<App />);
