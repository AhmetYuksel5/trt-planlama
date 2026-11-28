import { useEffect } from "react";
import { izlemede } from "../izleme";
import { GERCEK, firebaseYukle } from "../kip";
import { postaKimlikGetir, postalariCek } from "../posta-kapi";
import type { Kisi } from "../veri";
import { postaGorebilir } from "../yetki";

/*
 * Gerçek kipte postalar yalnız Posta'yı açan tarayıcıda yükleniyordu, kutu da
 * yalnız Posta açılınca çekiliyordu: Posta'ya girmeyen planlamacı staffing
 * şeridini hiç görmüyordu. Next Day'i düzenleyen ve Planlama'nın ana sayfası
 * açılınca posta yüklenir, kimliği (parolası) olan kişide kutu sessizce çekilir;
 * çekiş tarayıcıda 15 dakikada bir (her açılışta kapıya gitmesin). Ana sayfada
 * Posta sayısı Outlook'un okunmamışlarıyla eşitlensin diye de (çekiş onları getiriyor).
 */
const CEKIS_ANAHTARI = "trt-planlama-nd-posta-cek";
const CEKIS_ARASI = 15 * 60 * 1000;

export function useSessizPosta(ben: Kisi, etkin: boolean) {
  useEffect(() => {
    if (!GERCEK || !etkin || izlemede() || !postaGorebilir(ben)) return;
    let son = 0;
    try {
      son = Number(localStorage.getItem(CEKIS_ANAHTARI)) || 0;
    } catch {
      /* saklama yok: yine de bir kez dene */
    }
    const cek = Date.now() - son > CEKIS_ARASI;
    void (async () => {
      // Liste sunucudan gelmeden çekilirse aynı posta ikinci kez eklenirdi (Posta sayfasıyla aynı sıra).
      await (await firebaseYukle()).postaDinle();
      if (!cek) return;
      const r = await postaKimlikGetir();
      if (!r.tamam || !r.veri.parolaVar) return;
      try {
        localStorage.setItem(CEKIS_ANAHTARI, String(Date.now()));
      } catch {
        /* yok say */
      }
      await postalariCek(ben, 25, (r.veri.grupAdresi || "").trim().toLowerCase());
    })().catch(() => null);
    // Kişi ve yetki değişmedikçe bir kez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ben.id, etkin]);
}
