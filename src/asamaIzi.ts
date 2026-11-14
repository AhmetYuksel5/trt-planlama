import { uretimYolu } from "./akis";
import type { AsamaIzi, Durum, Paket } from "./veri";

/*
 * Aşama süresi ve iade sayısı (kullanıcı kararı; belgeler/asama-kutulari-
 * brifing.md, 3. parti). Paketin adımını değiştiren eylem onlarca; her birine
 * eklemek yerine kayıt yazılırken eski ve yeni paket karşılaştırılıyor
 * (veri.ts → kaydet): adımdan çıkışta süre eklenir, girişte an yazılır, geri
 * dönüşte ve parça iadesinde çıkılan aşamanın iadesi artar. Saf.
 */

/** Paketin şu an içinde bulunduğu üretim adımı; üretimde değilse yok. */
const aktif = (p: Paket | undefined): string | undefined => (p?.durum === "uretimde" && p.adim ? p.adim : undefined);

const sureEkle = (iz: AsamaIzi | undefined, zaman: string): AsamaIzi => {
  const x = iz ?? { sure: 0 };
  if (!x.giris) return x;
  const { giris, ...kalan } = x;
  return { ...kalan, sure: x.sure + Math.max(0, new Date(zaman).getTime() - new Date(giris).getTime()) };
};

const iadeArtir = (iz: AsamaIzi | undefined): AsamaIzi => ({ ...(iz ?? { sure: 0 }), iade: (iz?.iade ?? 0) + 1 });

export const paketIziIsle = (eski: Paket | undefined, yeni: Paket, zaman: string): Paket => {
  const a = aktif(eski);
  const b = aktif(yeni);
  let iz = yeni.asamaIzi;
  if (a !== b) {
    iz = { ...iz };
    if (a) iz[a] = sureEkle(iz[a], zaman);
    if (b) iz[b] = { ...(iz[b] ?? { sure: 0 }), giris: zaman };
    // Yolda geriye gidiş: çıkılan aşama işi geri gönderdi (revizyon, düzeltmeye iade).
    if (a && b) {
      const yol = uretimYolu(yeni);
      if (yol.indexOf(b) >= 0 && yol.indexOf(b) < yol.indexOf(a)) iz[a] = iadeArtir(iz[a]);
    }
  }
  // Parça iadesi: editör ya da dil denetmeni parçayı muhabire geri verdi; metin durağının iadesi.
  if (b && eski?.parcalar && yeni.parcalar && eski.parcalar !== yeni.parcalar) {
    const geri = yeni.parcalar.filter((x) => x.asama === "muhabir" && x.iade && eski.parcalar!.some((e) => e.id === x.id && e.asama !== "muhabir")).length;
    if (geri) {
      iz = { ...iz };
      for (let i = 0; i < geri; i++) iz[b] = iadeArtir(iz[b]);
    }
  }
  return iz === yeni.asamaIzi ? yeni : { ...yeni, asamaIzi: iz };
};

export const asamaIziIsle = (eski: Durum, yeni: Durum, zaman = new Date().toISOString()): Durum => {
  if (eski.paketler === yeni.paketler) return yeni;
  const onceki = new Map(eski.paketler.map((p) => [p.id, p]));
  let degisti = false;
  const paketler = yeni.paketler.map((p) => {
    const e = onceki.get(p.id);
    if (e === p) return p;
    const x = paketIziIsle(e, p, zaman);
    if (x !== p) degisti = true;
    return x;
  });
  return degisti ? { ...yeni, paketler } : yeni;
};
