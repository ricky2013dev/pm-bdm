import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { APP_CONFIG } from "./config/app";

// Set document title and meta tags from config
document.title = APP_CONFIG.fullTitle;

const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) {
  metaDescription.setAttribute('content', `Modern student management system for ${APP_CONFIG.name} to manage student records, courses, and enrollment.`);
}

const ogTitle = document.querySelector('meta[property="og:title"]');
if (ogTitle) {
  ogTitle.setAttribute('content', APP_CONFIG.name);
}

const ogDescription = document.querySelector('meta[property="og:description"]');
if (ogDescription) {
  ogDescription.setAttribute('content', `${APP_CONFIG.description} for ${APP_CONFIG.name}`);
}

createRoot(document.getElementById("root")!).render(<App />);
