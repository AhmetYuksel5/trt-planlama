import { useEffect } from "react";

/*
 * Öneriden plandaki başlığa geçiş (yeni mimari, 2. aşama): plan sayfası açılır,
 * başlığa kayılır, başlık bir an vurgulanır. Önce plan sayfasının başında
 * kalınıyor, önerinin hangi başlığa girdiği aranıyordu. Hedef sekmeye bağlı
 * (sessionStorage): hash yönlendirmesi sorgu taşımıyor. Plan zaten açıksa
 * (pencere plan ekranının üstünde) olayla haber verilir.
 */
const ANAHTAR = "trt-planlama-hedef-baslik";
const OLAY = "pf-hedef-baslik";

export function baslikaGit(planId: string, baslikId?: string) {
  try {
    if (baslikId) sessionStorage.setItem(ANAHTAR, JSON.stringify({ planId, baslikId }));
  } catch {
    /* saklanamıyorsa yalnız plan açılır */
  }
  const yol = `#/nextday/${planId}`;
  if (location.hash === yol) window.dispatchEvent(new Event(OLAY));
  else location.hash = yol;
}

const kay = (planId: string) => {
  let hedef: { planId: string; baslikId: string } | null = null;
  try {
    hedef = JSON.parse(sessionStorage.getItem(ANAHTAR) ?? "null");
  } catch {
    return;
  }
  if (!hedef || hedef.planId !== planId) return;
  const id = hedef.baslikId;
  // Plan geç çizilebilir: birkaç kare dene.
  let deneme = 0;
  const bul = () => {
    const el = document.querySelector<HTMLElement>(`main [data-plan-baslik="${CSS.escape(id)}"], main [data-nd-baslik="${CSS.escape(id)}"]`);
    if (!el) return ++deneme < 20 && requestAnimationFrame(bul);
    try {
      sessionStorage.removeItem(ANAHTAR);
    } catch {
      /* yok sayılır */
    }
    // Başlık kapalı bölümün (1–6) içinde olabilir: kendisi ve üstündekiler açılır.
    for (let x: HTMLElement | null = el; x; x = x.parentElement) if (x instanceof HTMLDetailsElement) x.open = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("hedef-vurgu");
    setTimeout(() => el.classList.remove("hedef-vurgu"), 2500);
  };
  bul();
};

/** Plan ekranı: hedef başlık bekliyorsa ona kay. */
export function useHedefBaslik(planId: string) {
  useEffect(() => {
    kay(planId);
    const dinle = () => kay(planId);
    window.addEventListener(OLAY, dinle);
    return () => window.removeEventListener(OLAY, dinle);
  }, [planId]);
}
