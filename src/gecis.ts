import { sehirUlkesi } from "./etiketler";
import { TAKIP_BICIMI, type Durum, type Oneri } from "./veri";

/*
 * Eski kayıtların yeni öneri düzenine geçişi (tasarım belgesi, 10. bölüm;
 * saf). Kendiliğinden çalışmaz: tam yönetici önizlemeyi görür, onaylarsa
 * uygulanır. İkinci kez çalışsa bir şeyi iki kez değiştirmez: "sonra"
 * kalmaz, taşınan takip kaydı `gecti` işaretini taşır ve önerisinin kimliği
 * kayıttan türer. Eski alanlar silinmez, hareket geçmişi olduğu gibi kalır.
 * "Plana eklendi", arşiv, paket sonuçları kayıttan hesaplandığı için
 * taşınacak bir şeyleri yok.
 */
export interface GecisOnizlemesi {
  sonra: number;
  takip: number;
  planda: number;
  kapali: number;
  toplam: number;
}

const takipOneriKimligi = (takipId: string) => `o-${takipId}`;

export const gecisOnizlemesi = (d: Durum): GecisOnizlemesi => {
  const sonra = d.oneriler.filter((o) => o.durum === "sonra").length;
  const bekleyen = d.takipler.filter((t) => !t.gecti);
  const planda = bekleyen.filter((t) => d.gelismeler.some((g) => g.takipId === t.id)).length;
  const kapali = bekleyen.filter((t) => t.kapandi).length;
  return { sonra, takip: bekleyen.length, planda, kapali, toplam: sonra + bekleyen.length };
};

export const gecisUygula = (d: Durum, kisiId: string, zaman: string): Durum => {
  // "Sonra değerlendirilecek" takibe katıldı; muhabirsiz öneride takip yok, değerlendirmeye döner.
  let oneriler: Oneri[] = d.oneriler.map((o) => (o.durum === "sonra" ? { ...o, durum: o.muhabirId && !o.talimatVeren ? "takip" : "degerlendiriliyor" } : o));
  let gelismeler = d.gelismeler;
  const takipler = d.takipler.map((t) => {
    if (t.gecti) return t;
    const id = takipOneriKimligi(t.id);
    if (!oneriler.some((o) => o.id === id)) {
      const yeni: Oneri = {
        id,
        muhabirId: t.muhabirId,
        ulke: sehirUlkesi(t.sehir, d),
        haberBasligi: t.konu,
        gelisme: t.aciklama ?? t.konu,
        tur: "haber",
        bicim: TAKIP_BICIMI,
        takipTuru: t.tur,
        sahaGerekli: false,
        zaman: t.zaman,
        kanal: "sistem",
        ...(t.tarih && { hedefTarih: t.tarih }),
        durum: "takip",
        takipId: t.id,
        // Bitmiş takip arşive; planda gelişmesi olan, gelişmesinin bağıyla "plana eklendi"ye eşitlenir.
        ...(t.kapandi && { arsiv: { zaman, kisiId } }),
      };
      oneriler = [yeni, ...oneriler];
    }
    gelismeler = gelismeler.map((g) => (g.takipId === t.id && !g.oneriId ? { ...g, oneriId: id } : g));
    return { ...t, gecti: id };
  });
  return { ...d, oneriler, gelismeler, takipler };
};
