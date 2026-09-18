import "./utils/domPolyfill";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import 'katex/dist/katex.min.css';
import "./index.css";
import App from "./App";
import { MultiplayerProvider } from "./contexts/MultiplayerContext";
import { IconContext } from "@phosphor-icons/react";
import "./i18n/config";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IconContext.Provider
      value={{
        weight: "duotone",
        size: 20,
        mirrored: false,
      }}
    >
      <MultiplayerProvider>
        <App />
      </MultiplayerProvider>
    </IconContext.Provider>
  </StrictMode>
);
