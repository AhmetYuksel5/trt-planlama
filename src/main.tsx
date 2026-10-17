import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { HataSiniri } from "./bilesenler/HataSiniri";
import "./tasarim.css";

const kok = document.getElementById("kok");
if (!kok) throw new Error("Kök eleman bulunamadı.");

createRoot(kok).render(
  <StrictMode>
    <HataSiniri>
      <App />
    </HataSiniri>
  </StrictMode>,
);
