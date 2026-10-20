import { sehirUlkesi } from "./etiketler";
import { temizle } from "./temizlik";
import { TAKIP_BICIMI, type Durum, type Oneri } from "./veri";

/*
 * Eski kayıtların yeni öneri düzenine geçişi (tasarım belgesi, 10. bölüm;
 * saf). Kural: eski düzende öneri kalmaz. Sistemin açılış işi
 * (`eskiOnerileriCevir`) kalanı kendiliğinden çevirir; Ayarlar'daki kart
 * aynısını önizlemeyle elle de yapar. İkinci kez çalışsa bir şeyi iki kez değiştirmez: "sonra"
 * kalmaz, taşınan takip kaydı `gecti` işaretini taşır ve önerisinin kimliği
 * kayıttan türer. Eski alanlar silinmez, hareket geçmişi olduğu gibi kalır.
 * "Plana eklendi", arşiv, paket sonuçları kayıttan hesaplandığı için
 * taşınacak bir şeyleri yok.
 */
export interface GecisOnizlemesi {
  sonra: number;
  eposta: number;
  kopya: number;
  takip: number;
  planda: number;
  kapali: number;
  toplam: number;
}

const takipOneriKimligi = (takipId: string) => `o-${takipId}`;

/*
 * Deneme sürecinin e-postayla takibinden kalan alanlar. Yeni düzende
 * karşılığı yok: plana paketsiz giren haber zaten takip olarak plandadır,
 * paket "Yapıldı" ve onayla kapanır. Açık kalan işaret eski "Tamamlandı"
 * düğmesini, kapanmışı da onu yeniden açan yolu canlı tutuyordu.
 */
/*
 * Eski düzende "Takip" türündeki öneri muhabirin ayrı takip kaydının ikinci
 * yüzüydü; Planlama dokunmadıysa ("yeni") aynı iş iki kez görünüyordu. Takip
 * kaydı takip önerisine çevrilince bu kopya izleriyle siliniyor.
 */
const kopyaTakipOnerisi = (d: Durum, o: Oneri) => o.bicim === TAKIP_BICIMI && o.durum === "yeni" && !!o.takipId && d.takipler.some((x) => x.id === o.takipId);

const epostaTakibiVar = (o: Oneri) => o.takip !== undefined || !!o.yalnizTakip || !!o.takipBitis || !!o.takipBitiren;

export const gecisOnizlemesi = (d: Durum): GecisOnizlemesi => {
  const sonra = d.oneriler.filter((o) => o.durum === "sonra").length;
  const eposta = d.oneriler.filter(epostaTakibiVar).length;
  const kopya = d.oneriler.filter((o) => kopyaTakipOnerisi(d, o)).length;
  const bekleyen = d.takipler.filter((t) => !t.gecti);
  const planda = bekleyen.filter((t) => d.gelismeler.some((g) => g.takipId === t.id)).length;
  const kapali = bekleyen.filter((t) => t.kapandi).length;
  return { sonra, eposta, kopya, takip: bekleyen.length, planda, kapali, toplam: sonra + eposta + kopya + bekleyen.length };
};

export const gecisUygula = (d0: Durum, kisiId: string, zaman: string): Durum => {
  const kopyalar = d0.oneriler.filter((o) => kopyaTakipOnerisi(d0, o)).map((o) => o.id);
  const d = kopyalar.length ? temizle(d0, { turler: ["oneriler"], idler: kopyalar }).yeni : d0;
  // "Sonra değerlendirilecek" takibe katıldı; muhabirsiz öneride takip yok, değerlendirmeye döner.
  let oneriler: Oneri[] = d.oneriler.map((o) => {
    if (o.durum !== "sonra" && !epostaTakibiVar(o)) return o;
    const { takip: _t, yalnizTakip: _y, takipBitis: _b, takipBitiren: _k, ...x } = o;
    return o.durum === "sonra" ? { ...x, durum: x.muhabirId && !x.talimatVeren ? "takip" : "degerlendiriliyor" } : x;
  });
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
