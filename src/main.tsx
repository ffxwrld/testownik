import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import 'katex/dist/katex.min.css';
import "./index.css";
import App from "./App";
import { MultiplayerProvider } from "./contexts/MultiplayerContext";
import "./i18n/config";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MultiplayerProvider>
      <App />
    </MultiplayerProvider>
  </StrictMode>
);
