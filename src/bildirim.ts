import { useEffect, useState } from "react";
import { GERCEK } from "./kip";
import { GOMULU } from "./yol";
import { izlemede } from "./izleme";
import { kapiIstek } from "./yz";
import type { Dil } from "./dil";

/*
 * Telefona ve bilgisayara bildirim (Web Push; kapıda worker/src/bildirim.ts).
 * Kullanıcı: bazı olaylarda bildirim gitsin, ilk deneme yeni haber önerisi; herkese
 * gitsin ama varsayılan kapalı, tam yönetici açar. Her kişi kendi cihazında
 * "Bu cihazda bildirim al"ı ayrıca açar: tarayıcı izni cihaza bağlı.
 *
 * Servis betiği (public/sw.js) yalnız bildirimi gösterir, istek yakalamaz.
 */

export const desteklenir = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/* Servis betiği açılışta kaydedilir: hem bildirim hem "uygulamayı yükle" için. Bölmede (iframe) değil. */
export const servisBetiginiKaydet = () => {
  if (GOMULU || !("serviceWorker" in navigator) || !window.isSecureContext) return;
  navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
};

const kayit = () => navigator.serviceWorker.ready;

const b64uBayt = (s: string) => {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  const ham = atob(t + "=".repeat((4 - (t.length % 4)) % 4));
  return Uint8Array.from(ham, (c) => c.charCodeAt(0));
};
const baytB64u = (b: ArrayBuffer | null) => (b ? btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : "");

export interface BildirimDurumu {
  /** Genel anahtar (tam yönetici açar). */
  acik: boolean;
  /** Bu cihaz abone mi. */
  cihaz: boolean;
  izin: NotificationPermission | "yok";
}

export const durumGetir = async (): Promise<BildirimDurumu | { hata: string }> => {
  if (!desteklenir()) return { acik: false, cihaz: false, izin: "yok" };
  const r = await kapiIstek<{ acik: boolean; anahtar: string }>("/bildirim");
  if (!r.tamam) return { hata: r.hata };
  const k = await kayit();
  const abone = await k.pushManager.getSubscription();
  return { acik: r.veri.acik, cihaz: !!abone, izin: Notification.permission };
};

export const genelAnahtar = (acik: boolean) => kapiIstek<{ acik: boolean }>("/bildirim/ayar", "PUT", { acik });

/*
 * Cihazı abone eder. Kapının anahtarı değişmişse (eski abonelik başka anahtarla)
 * eski abonelik bırakılıp yenisi açılır.
 */
export const cihaziAc = async (dil: Dil): Promise<true | string> => {
  if (!desteklenir()) return "destek";
  const izin = await Notification.requestPermission();
  if (izin !== "granted") return "izin";
  const r = await kapiIstek<{ anahtar: string }>("/bildirim");
  if (!r.tamam) return r.hata;
  const k = await kayit();
  const anahtar = b64uBayt(r.veri.anahtar);
  let abone = await k.pushManager.getSubscription();
  const eskiAnahtar = abone?.options.applicationServerKey;
  if (abone && eskiAnahtar && baytB64u(eskiAnahtar) !== r.veri.anahtar) {
    await abone.unsubscribe().catch(() => {});
    abone = null;
  }
  abone ??= await k.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: anahtar });
  const y = await kapiIstek("/bildirim/abone", "POST", { endpoint: abone.endpoint, p256dh: baytB64u(abone.getKey("p256dh")), auth: baytB64u(abone.getKey("auth")), dil });
  return y.tamam ? true : y.hata;
};

export const cihaziKapat = async (): Promise<void> => {
  if (!desteklenir()) return;
  const abone = await (await kayit()).pushManager.getSubscription();
  if (!abone) return;
  await kapiIstek("/bildirim/birak", "POST", { endpoint: abone.endpoint });
  await abone.unsubscribe().catch(() => {});
};

export const denemeGonder = () => kapiIstek<{ giden: number; hata: number }>("/bildirim/dene", "POST", {});

/*
 * Yeni öneri gönderilince kapıya haber: kapı genel anahtar açıksa öbür abonelere
 * iletir (gönderen ve kısıtlı kişiler hariç). Demoda ve izlemede gitmez; sonucu
 * beklenmez, gönderimi yavaşlatmasın.
 */
export const oneriBildir = (o: { id: string; baslik: string; kaynak: string }) => {
  if (!GERCEK || izlemede()) return;
  void kapiIstek("/bildirim/oneri", "POST", { oneriId: o.id, baslik: o.baslik, kaynak: o.kaynak }).catch(() => {});
};

export const useBildirimDurumu = (yenile: number) => {
  const [d, setD] = useState<BildirimDurumu | { hata: string } | null>(null);
  useEffect(() => {
    let iptal = false;
    durumGetir().then((x) => !iptal && setD(x), () => !iptal && setD({ hata: "kapi" }));
    return () => {
      iptal = true;
    };
  }, [yenile]);
  return d;
};
