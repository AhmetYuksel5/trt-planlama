import { yerelGun } from "./tarih";
import type { Durum, Hareket } from "./veri";

/*
 * Kayıt temizliği: deneme sürecinde girilen işleri tam yönetici izleriyle
 * birlikte siliyor (Ayarlar › Kayıt temizliği). Saf kural; eylem
 * eylemler.ts → kayitlariTemizle.
 *
 * Seçilen türden tarih aralığına düşen kayıtlar gidiyor; onlardan doğan ya
 * da onlara bağlı kayıtlar da ("izler"): önerinin yazışması, gelişmesi,
 * paketi ve haftalık kalemi; planın gelişmeleri, canlı yayınları ve
 * paketleri; çağrının yanıtları; silinen kayda değen hareketler ve
 * bildirimler. Silinen kayda başka kayıttaki bağlantı (önerinin planı,
 * planın hazır paketi, takvimdeki bağlantı…) kopuyor. Kişiler, kurum
 * yapısı ve ayarlar temizliğe girmiyor.
 *
 * Değişmeyen kaydın nesnesi aynı kalıyor: gerçek kipte yazılacak belgeler
 * nesne kimliğiyle çıkıyor (depo/fark.ts).
 */

export const TEMIZLIK_TURLERI = ["oneriler", "planlar", "paketler", "haftalik", "aylikOzel", "cagrilar", "takipler", "faaliyetler", "gorevlendirmeler", "isler", "hareketler", "basliklar"] as const;
export type TemizlikTuru = (typeof TEMIZLIK_TURLERI)[number];

export interface TemizlikSecimi {
  turler: TemizlikTuru[];
  /** YYYY-MM-DD; boşsa en baştan. */
  bas?: string;
  /** YYYY-MM-DD; boşsa bugüne kadar her şey (ileri tarihli plan dahil). */
  bit?: string;
  /** Tek tek silme (öneri sayfasındaki "İzleriyle sil"): tarih yerine bu kayıtlar; izler aynı kuralla. */
  idler?: string[];
}

/** Silinen kayıt sayıları; izler kendi kalemlerinde. */
export type TemizlikSayilari = Record<string, number>;

const gun = (z?: string) => (z ? (z.length > 10 ? yerelGun(z) : z.slice(0, 10)) : "");

export const temizle = (d: Durum, s: TemizlikSecimi): { yeni: Durum; sayilar: TemizlikSayilari; toplam: number } => {
  const tur = new Set(s.turler);
  const aralikta = (z?: string) => {
    const g = gun(z);
    if (!g) return !s.bas && !s.bit;
    return (!s.bas || g >= s.bas) && (!s.bit || g <= s.bit);
  };
  const idler = s.idler && new Set(s.idler);
  const sec = <T extends { id: string }>(l: T[], t: TemizlikTuru, z: (x: T) => string | undefined) =>
    new Set(tur.has(t) ? l.filter((x) => (idler ? idler.has(x.id) : aralikta(z(x)))).map((x) => x.id) : []);

  // 1. Seçilen kayıtlar
  const oneriler = sec(d.oneriler, "oneriler", (o) => o.zaman);
  const planlar = sec(d.planlar, "planlar", (p) => p.tarih);
  const paketler = sec(d.paketler, "paketler", (p) => p.olusturma);
  const haftalik = sec(d.haftalik, "haftalik", (h) => h.baslangic);
  const aylik = sec(d.aylik, "aylikOzel", (a) => `${a.ay}-01`);
  const ozel = sec(d.ozel, "aylikOzel", (o) => o.tarih);
  const cagrilar = sec(d.cagrilar, "cagrilar", (c) => c.zaman);
  const yanitlar = sec(d.yanitlar, "cagrilar", (y) => y.zaman);
  const takipler = sec(d.takipler, "takipler", (x) => x.zaman);
  const faaliyetler = sec(d.faaliyetler, "faaliyetler", (f) => f.olusturma);
  const gorevler = sec(d.gorevlendirmeler, "gorevlendirmeler", (g) => g.baslangic);
  const isler = sec(d.isler ?? [], "isler", (x) => x.zaman);

  // 2. İzler: doğan ve bağlı kayıtlar
  for (const y of d.yanitlar) if (y.cagriId && cagrilar.has(y.cagriId)) yanitlar.add(y.id);
  for (const p of d.paketler) if ((p.oneriId && oneriler.has(p.oneriId)) || (p.planId && planlar.has(p.planId))) paketler.add(p.id);
  const gelismeler = new Set(d.gelismeler.filter((g) => planlar.has(g.planId) || (g.oneriId && oneriler.has(g.oneriId))).map((g) => g.id));
  const canlilar = new Set(d.canliYayinlar.filter((c) => planlar.has(c.planId)).map((c) => c.id));
  const mesajlar = new Set(d.mesajlar.filter((m) => oneriler.has(m.oneriId)).map((m) => m.id));
  const kalemler = new Set(d.haftalik.flatMap((h) => h.kalemler.filter((k) => haftalik.has(h.id) || (k.oneriId && oneriler.has(k.oneriId))).map((k) => k.id)));

  const silinen = new Set([...oneriler, ...planlar, ...paketler, ...haftalik, ...aylik, ...ozel, ...cagrilar, ...yanitlar, ...takipler, ...faaliyetler, ...gorevler, ...gelismeler, ...canlilar, ...mesajlar, ...kalemler]);
  // Hareket silinen kayda değiyorsa (doğrudan ya da verisindeki kimlikle) iz sayılıyor.
  const deger = (h: Hareket) =>
    [h.oneriId, h.paketId, h.planId, h.haftaId, ...Object.values(h.veri ?? {})].some((x) => x && silinen.has(x)) || (tur.has("hareketler") && (idler ? idler.has(h.id) : aralikta(h.zaman)));
  const hareketler = new Set(d.hareketler.filter(deger).map((h) => h.id));

  // 3. Kalan kayıtlarda kopan bağlantılar; değişmeyen nesne aynı kalıyor
  const yok = (id?: string) => !!id && silinen.has(id);
  const kalanOneriler = d.oneriler
    .filter((o) => !oneriler.has(o.id))
    .map((o) => {
      if (!yok(o.planId) && !yok(o.paketId) && !yok(o.cagriId) && !yok(o.takipId) && !yok(o.yanitId)) return o;
      const { planId, paketId, cagriId, takipId, yanitId, ...geri } = o;
      return { ...geri, ...(!yok(planId) && planId && { planId }), ...(!yok(paketId) && paketId && { paketId }), ...(!yok(cagriId) && cagriId && { cagriId }), ...(!yok(takipId) && takipId && { takipId }), ...(!yok(yanitId) && yanitId && { yanitId }) };
    });
  const kalanPlanlar = d.planlar
    .filter((p) => !planlar.has(p.id))
    .map((p) =>
      p.hazirPaketler.some(yok) || p.gorevlendirmeler.some(yok) || (p.oncekiHareketler ?? []).some((h) => hareketler.has(h))
        ? {
            ...p,
            hazirPaketler: p.hazirPaketler.filter((x) => !yok(x)),
            gorevlendirmeler: p.gorevlendirmeler.filter((x) => !yok(x)),
            ...(p.oncekiHareketler && { oncekiHareketler: p.oncekiHareketler.filter((h) => !hareketler.has(h)) }),
          }
        : p,
    );
  const kalanHaftalik = d.haftalik
    .filter((h) => !haftalik.has(h.id))
    .map((h) =>
      h.kalemler.some((k) => kalemler.has(k.id) || yok(k.aktarim?.paketId) || yok(k.aktarim?.planId))
        ? {
            ...h,
            kalemler: h.kalemler
              .filter((k) => !kalemler.has(k.id))
              .map((k) => {
                if (!yok(k.aktarim?.paketId) && !yok(k.aktarim?.planId)) return k;
                const { aktarim, ...geri } = k;
                const kalan = { ...(aktarim?.planId && !yok(aktarim.planId) && { planId: aktarim.planId }), ...(aktarim?.paketId && !yok(aktarim.paketId) && { paketId: aktarim.paketId }) };
                return Object.keys(kalan).length ? { ...geri, aktarim: kalan } : geri;
              }),
          }
        : h,
    );
  const kalanFaaliyetler = d.faaliyetler
    .filter((f) => !faaliyetler.has(f.id))
    .map((f) => (f.baglantilar.some((b) => yok(b.planId) || yok(b.kayitId)) ? { ...f, baglantilar: f.baglantilar.filter((b) => !yok(b.planId) && !yok(b.kayitId)) } : f));
  const kalanGelismeler = d.gelismeler
    .filter((g) => !gelismeler.has(g.id))
    .map((g) => {
      if (!yok(g.oneriId) && !yok(g.haftalikKalemId)) return g;
      const { oneriId, haftalikKalemId, ...geri } = g;
      return { ...geri, ...(oneriId && !yok(oneriId) && { oneriId }), ...(haftalikKalemId && !yok(haftalikKalemId) && { haftalikKalemId }) };
    });
  const kalanPaketler = d.paketler
    .filter((p) => !paketler.has(p.id))
    .map((p) => {
      if (!yok(p.oneriId) && !yok(p.haftalikKalemId)) return p;
      const { oneriId, haftalikKalemId, ...geri } = p;
      return { ...geri, ...(oneriId && !yok(oneriId) && { oneriId }), ...(haftalikKalemId && !yok(haftalikKalemId) && { haftalikKalemId }) };
    });

  let yeni: Durum = {
    ...d,
    oneriler: kalanOneriler,
    planlar: kalanPlanlar,
    paketler: kalanPaketler,
    haftalik: kalanHaftalik,
    aylik: d.aylik.filter((a) => !aylik.has(a.id)),
    ozel: d.ozel.filter((o) => !ozel.has(o.id)),
    cagrilar: d.cagrilar.filter((c) => !cagrilar.has(c.id)),
    yanitlar: d.yanitlar.filter((y) => !yanitlar.has(y.id)),
    takipler: d.takipler.filter((x) => !takipler.has(x.id)),
    faaliyetler: kalanFaaliyetler,
    gorevlendirmeler: d.gorevlendirmeler.filter((g) => !gorevler.has(g.id)),
    ...(isler.size ? { isler: (d.isler ?? []).filter((x) => !isler.has(x.id)) } : {}),
    gelismeler: kalanGelismeler,
    canliYayinlar: d.canliYayinlar.filter((c) => !canlilar.has(c.id)),
    mesajlar: d.mesajlar.filter((m) => !mesajlar.has(m.id)),
    hareketler: d.hareketler.filter((h) => !hareketler.has(h.id)),
  };

  // 4. Hiçbir kayıtta geçmeyen başlıklar (tarihsiz; temizlikten sonra boşta kalanlar da)
  let basliklar = 0;
  if (tur.has("basliklar")) {
    const kullanilan = new Set<string>([
      ...yeni.planlar.flatMap((p) => p.basliklar.map((b) => b.baslikId)),
      ...yeni.oneriler.map((o) => o.baslikId ?? ""),
      ...yeni.haftalik.flatMap((h) => h.kalemler.map((k) => k.baslikId ?? "")),
      // Kısayola sabitlenmiş başlık kişinin seçimi; kalıyor.
      ...Object.values(yeni.kisayollar ?? {}).flatMap((l) => l.filter((y) => y.startsWith("basliklar/")).map((y) => y.slice("basliklar/".length))),
    ]);
    const kalan = yeni.basliklar.filter((b) => kullanilan.has(b.id));
    basliklar = yeni.basliklar.length - kalan.length;
    yeni = { ...yeni, basliklar: kalan };
  }

  const sayilar: TemizlikSayilari = {
    oneriler: oneriler.size,
    planlar: planlar.size,
    paketler: paketler.size,
    haftalik: haftalik.size,
    aylikOzel: aylik.size + ozel.size,
    cagrilar: cagrilar.size + yanitlar.size,
    takipler: takipler.size,
    faaliyetler: faaliyetler.size,
    gorevlendirmeler: gorevler.size,
    isler: isler.size,
    hareketler: hareketler.size,
    basliklar,
    gelismeler: gelismeler.size + canlilar.size + kalemler.size,
    mesajlar: mesajlar.size,
  };
  const toplam = Object.values(sayilar).reduce((a, b) => a + b, 0);
  return { yeni, sayilar, toplam };
};
