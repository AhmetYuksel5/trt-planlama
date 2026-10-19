import { gunEkle } from "./tarih";
import type { Baslik, Durum, NextDayPlan } from "./veri";

/*
 * Next Day'de başlık seçenekleri bütün havuz değil: planın kendi başlıkları
 * ve bir önceki günün planlarındakiler. Kurum dünün belgesinden çalışıyor;
 * bütün havuz gelince eski günlerin başlıkları seçimde birikiyordu. Havuz
 * yine tek: yeni yazılan ad havuzda varsa o başlık kullanılıyor
 * (eylemler.ts → dosyaAc). Önceki günde pasife alınmış başlık çıkmıyor.
 */
export const ndBaslikSecenekleri = (d: Pick<Durum, "planlar" | "basliklar">, plan: NextDayPlan) => {
  const bul = (id: string) => d.basliklar.find((b) => b.id === id);
  const plandakiler = plan.basliklar.map((b) => b.baslikId);
  const dun = gunEkle(plan.tarih, -1);
  const oncekiler = [...new Set(d.planlar.filter((p) => p.tarih === dun).flatMap((p) => p.basliklar.map((b) => b.baslikId)))].filter((id) => !plandakiler.includes(id));
  return {
    plandaki: plandakiler.map(bul).filter((b): b is Baslik => !!b),
    onceki: oncekiler.map(bul).filter((b): b is Baslik => !!b?.aktif),
  };
};

/* Adı aynı (boşluklar dışında) başlık: seçimde varsayılan, yeni başlıkta çoğalmasın. */
export const adiylaBaslik = (d: Pick<Durum, "basliklar">, ad?: string) => {
  const temiz = ad?.trim();
  return temiz ? d.basliklar.find((b) => b.ad.trim() === temiz) : undefined;
};
