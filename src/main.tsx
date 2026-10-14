import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import TransitionRouter from "./components/TransitionRouter";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <TransitionRouter>
      <App />
    </TransitionRouter>
  </StrictMode>,
);
