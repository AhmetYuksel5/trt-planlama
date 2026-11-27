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
import { kanalHatirla } from "./kullanim";
import { iosSabitDuzelt } from "./iosSabit";

servisBetiginiKaydet();
surumIzle();
// Android uygulamasının izi yalnız ilk yüklemede (document.referrer); sekmeye yazılsın.
kanalHatirla();
iosSabitDuzelt();

const kok = document.getElementById("kok");
if (!kok) throw new Error("Kök eleman bulunamadı.");

createRoot(kok).render(
  <StrictMode>
    <HataSiniri>
      <App />
    </HataSiniri>
  </StrictMode>,
);
