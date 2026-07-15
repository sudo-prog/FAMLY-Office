import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// Configure API base URL from environment or use relative path for same-origin
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
setBaseUrl(apiBaseUrl || null);

// Initialize React
createRoot(document.getElementById("root")!).render(<App />);
