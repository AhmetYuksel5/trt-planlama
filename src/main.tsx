import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { HataSiniri } from "./bilesenler/HataSiniri";
import "./tasarim.css";
import "./tasarimSecimi";
import "./tema";
import "./egitimVurgu";
import { servisBetiginiKaydet } from "./bildirim";
import { surumIzle } from "./surum";

servisBetiginiKaydet();
surumIzle();

const kok = document.getElementById("kok");
if (!kok) throw new Error("Kök eleman bulunamadı.");

createRoot(kok).render(
  <StrictMode>
    <HataSiniri>
      <App />
    </HataSiniri>
  </StrictMode>,
);
