import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { syncDocumentFaviconWithBase } from "@/components/brand-logo";

syncDocumentFaviconWithBase();

createRoot(document.getElementById("root")!).render(<App />);
