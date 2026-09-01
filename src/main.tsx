import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import 'katex/dist/katex.min.css';
import "./index.css";
import App from "./App";
import { MultiplayerProvider } from "./contexts/MultiplayerContext";
import { Toaster } from 'sonner';
import "./i18n/config";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster theme="system" richColors position="top-center" />
    <MultiplayerProvider>
      <App />
    </MultiplayerProvider>
  </StrictMode>
);
