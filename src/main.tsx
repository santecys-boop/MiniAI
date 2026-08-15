import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeSecurityGuard } from "./lib/securityGuard";

initializeSecurityGuard();

createRoot(document.getElementById("root")!).render(<App />);
