import { gunAy, type Anahtar } from "./dil";
import { bugun, gunEkle } from "./tarih";
import { OZEL_SIRASI, eskiOzelPaket, type CanliYayin, type Durum, type Gorevlendirme, type Nafize, type OzelDurum, type OzelIz, type OzelPaketOnerisi, type OzelYayin, type Paket } from "./veri";

/**
 * Özel yayının okuma kuralları: aşamaların sırası, hangi kalem bitti,
 * hangisi bekliyor, hangisi gecikti. Saklanmıyor; ekran, yönetici paneli ve
 * ana sayfa aynı sayıyı kayıttan hesaplıyor. İptal edilen kalem ne yapılan
 * ne yapılacak.
 */

/*
 * Kontrol listesi: aşamalar sırayla işaretleniyor, durum son işaretlenen.
 * Yalnız sıradaki işaretlenir, yalnız sonuncu geri alınır: atlanan aşama
 * kimin yaptığını göstermezdi.
 */
export const isaretli = <T extends string>(sira: readonly T[], simdi: T, adim: T) => sira.indexOf(simdi) >= sira.indexOf(adim);
export const siradaki = <T extends string>(sira: readonly T[], simdi: T): T | undefined => sira[sira.indexOf(simdi) + 1];
/** İşaret kaldırılınca dönülen durum; yalnız son işaretlenen kaldırılabiliyor. */
export const oncesi = <T extends string>(sira: readonly T[], simdi: T, adim: T): T | undefined => (simdi === adim && sira.indexOf(adim) > 0 ? sira[sira.indexOf(adim) - 1] : undefined);
/** Aşamayı kim, ne zaman işaretledi: izdeki son "durum" kaydı. */
export const isaretIzi = (iz: OzelIz[] | undefined, adim: string) => [...(iz ?? [])].reverse().find((x) => x.olay === "durum" && x.durum === adim);
export const asamaNotlari = (iz: OzelIz[] | undefined, adim: string) => (iz ?? []).filter((x) => x.olay === "not" && x.asama === adim);

export type OzelKalemTuru = "nafize" | "paket" | "gorev" | "madde";
export const OZEL_KALEM_TURLERI: OzelKalemTuru[] = ["nafize", "paket", "gorev", "madde"];

export interface OzelKalemi {
  tur: OzelKalemTuru;
  id: string;
  /** İçerik (Arapça): nafizenin başlığı, paketin başlığı, talebin metni… */
  ad: string;
  sonTarih?: string;
  bitti: boolean;
  /** İşi yapan kişi (muhabir, hazırlayan, görevli). */
  kisiId?: string;
}

/** Nafizenin başlığı kurumun yazımıyla, her arayüz dilinde Arapça: "25 أكتوبر - تل أبيب - 10G". */
export const nafizeBasligi = (n: Pick<Nafize, "tarih" | "yer"> & { saat?: string; saatGmt?: string }) => {
  const s = n.saatGmt ?? n.saat;
  const saat = s ? `${s.endsWith(":00") ? String(Number(s.slice(0, 2))) : s}G` : "";
  return [gunAy(n.tarih, "ar"), n.yer, saat].filter(Boolean).join(" - ");
};

/*
 * Paketin aşamaları: önerildi (plan) → onaylandı → görevlendirildi
 * (muhabir ya da hazırlayan) → hazırlanıyor → hazır. Saklanmıyor; önerinin
 * durumundan ve paketin kendisinden.
 */
export const OZEL_PAKET_ASAMALARI = ["plan", "onayli", "gorevli", "hazirlaniyor", "hazir"] as const;
export type OzelPaketAsamasi = (typeof OZEL_PAKET_ASAMALARI)[number];
export const ozelPaketAsamasi = (p: Paket): OzelPaketAsamasi =>
  p.durum === "tamamlandi" ? "hazir" : p.durum === "taslak" ? "plan" : !(p.muhabirId ?? p.hazirlayanId) || p.ozelGorevBekliyor ? "onayli" : p.ozelBasladi ? "hazirlaniyor" : "gorevli";

/*
 * Muhabirin özel yayın görevleri: Planlama "Görevlendirildi"yi işaretlemiş
 * dış paketler. Görev bildirimi "görevlendirdi" diyor; muhabir onu
 * Görevlendirmelerim'de arıyordu, orada yalnız saha görevlendirmeleri vardı.
 * Biten görev yalnız sayfada (geçmiş), İşlerim'deki kartta değil.
 */
export const ozelGorevleri = (d: Pick<Durum, "paketler">, kisiId: string, bitenler = false): Paket[] =>
  d.paketler
    .filter((p) => eskiOzelPaket(p) && p.muhabirId === kisiId && !p.ozelGorevBekliyor && (p.durum === "onaylandi" || (bitenler && p.durum === "tamamlandi")))
    .sort((a, b) => (a.sonTarih ?? "").localeCompare(b.sonTarih ?? ""));

/*
 * Özel yayının paket satırları: öneriler (onaylanınca paketiyle) ve
 * önerisiz paketler (öneri kaydından önce doğrudan açılmış olanlar).
 */
export interface OzelPaketSatiri {
  oneri?: OzelPaketOnerisi;
  paket?: Paket;
  id: string;
  baslik: string;
  kaynak: "inhouse" | "dis";
  muhabirId?: string;
  sonTarih?: string;
  asama: OzelPaketAsamasi;
  iz: OzelIz[];
}
export const ozelPaketSatirlari = (o: OzelYayin, d: Pick<Durum, "paketler">): OzelPaketSatiri[] => {
  const paketler = d.paketler.filter((p) => p.ozelId === o.id && p.durum !== "iptal");
  // Paketi yeni içeriğe çevrilmiş öneri (eylemler.ts → ozelEskiPaketleriCevir) içerikler listesinde.
  const oneriler = (o.paketOnerileri ?? []).filter((x) => !paketler.some((y) => y.id === x.paketId && !eskiOzelPaket(y))).map((x): OzelPaketSatiri => {
    const p = paketler.find((y) => y.id === x.paketId);
    return { oneri: x, paket: p, id: x.id, baslik: p?.baslik ?? x.baslik, kaynak: x.kaynak, muhabirId: p?.muhabirId ?? x.muhabirId, sonTarih: p?.sonTarih ?? x.sonTarih, asama: p ? ozelPaketAsamasi(p) : x.durum === "oneri" ? "plan" : "onayli", iz: x.iz };
  });
  const bagli = new Set((o.paketOnerileri ?? []).map((x) => x.paketId));
  // Yeni düzenin içerikleri (doğrudan görev) ayrı listede: `ozelIcerikleri`.
  const yalniz = paketler.filter((p) => !bagli.has(p.id) && eskiOzelPaket(p)).map((p): OzelPaketSatiri => ({ paket: p, id: p.id, baslik: p.baslik, kaynak: p.ozelKaynak ?? "dis", muhabirId: p.muhabirId, sonTarih: p.sonTarih, asama: ozelPaketAsamasi(p), iz: [] }));
  return [...oneriler, ...yalniz];
};

/* Yeni düzenin içerikleri: doğrudan görevle açılmış paketler, yayın gününe ve teslimine göre. */
export const ozelIcerikleri = (d: Pick<Durum, "paketler">, id: string): Paket[] =>
  d.paketler
    .filter((p) => p.ozelId === id && !eskiOzelPaket(p) && p.durum !== "iptal")
    .sort((a, b) => (a.yayinGunu ?? "").localeCompare(b.yayinGunu ?? "") || (a.sonTarih ?? "").localeCompare(b.sonTarih ?? ""));

/* Nafizeler: özel yayının canlı yayınları (veri.ts → CanliYayin.ozelId), gün ve GMT saat sırasıyla. */
export const ozelNafizeleri = (d: Pick<Durum, "canliYayinlar">, ozelId: string): CanliYayin[] =>
  d.canliYayinlar.filter((c) => c.ozelId === ozelId).sort((a, b) => `${a.tarih} ${a.saatGmt || "99"}`.localeCompare(`${b.tarih} ${b.saatGmt || "99"}`));

/* Nafize hazır: yayınlandı ya da rezervasyonu ve yeri hazır. */
export const nafizeHazir = (c: CanliYayin) => c.sonuc?.durum === "yapildi" || (!!c.rezervasyon && !!c.yerHazir);

export const ozelPaketleri = (d: Pick<Durum, "paketler">, id: string): Paket[] => d.paketler.filter((p) => p.ozelId === id && p.durum !== "iptal");
export const ozelGorevlendirmeleri = (d: Pick<Durum, "gorevlendirmeler">, id: string): Gorevlendirme[] => d.gorevlendirmeler.filter((g) => g.ozelId === id);

/** Görevlendirmenin genel aşaması: News Gathering onaylayana dek planlama, sonra hazır. */
export const gorevHazir = (g: Gorevlendirme) => g.durum !== "talep";

export const ozelKalemleri = (o: OzelYayin, d: Pick<Durum, "paketler" | "gorevlendirmeler" | "canliYayinlar">): OzelKalemi[] => [
  ...ozelNafizeleri(d, o.id).map((n) => ({ tur: "nafize" as const, id: n.id, ad: nafizeBasligi(n), sonTarih: n.tarih, bitti: nafizeHazir(n), kisiId: n.muhabirId })),
  ...ozelIcerikleri(d, o.id).map((p) => ({ tur: "paket" as const, id: p.id, ad: p.baslik, sonTarih: p.sonTarih, bitti: p.durum === "tamamlandi", kisiId: p.muhabirId })),
  ...ozelPaketSatirlari(o, d).map((p) => ({ tur: "paket" as const, id: p.id, ad: p.baslik, sonTarih: p.sonTarih, bitti: p.asama === "hazir", kisiId: p.muhabirId ?? p.paket?.hazirlayanId })),
  // Dış görevlendirme News Gathering'in onayından geçince hazır: iş artık sahada.
  ...ozelGorevlendirmeleri(d, o.id).map((g) => ({ tur: "gorev" as const, id: g.id, ad: g.yer, sonTarih: g.baslangic, bitti: gorevHazir(g), kisiId: g.kisiId })),
  ...o.hazirlik.map((h) => ({ tur: "madde" as const, id: h.id, ad: h.metin, sonTarih: h.gun, bitti: h.tamam })),
];

export const gecikti = (k: { bitti: boolean; sonTarih?: string }, gun = bugun()) => !k.bitti && !!k.sonTarih && k.sonTarih < gun;

export interface OzelOzeti {
  toplam: number;
  biten: number;
  geciken: number;
  tur: Record<OzelKalemTuru, { toplam: number; biten: number }>;
}

export const ozelOzeti = (o: OzelYayin, d: Pick<Durum, "paketler" | "gorevlendirmeler" | "canliYayinlar">): OzelOzeti => {
  const kalemler = ozelKalemleri(o, d);
  const tur = Object.fromEntries(OZEL_KALEM_TURLERI.map((t) => [t, { toplam: 0, biten: 0 }])) as OzelOzeti["tur"];
  for (const k of kalemler) {
    tur[k.tur].toplam++;
    if (k.bitti) tur[k.tur].biten++;
  }
  return { toplam: kalemler.length, biten: kalemler.filter((k) => k.bitti).length, geciken: kalemler.filter((k) => gecikti(k)).length, tur };
};

/** Yapılacaklar: son tarihi yakın olan önde, tarihsiz en sonda. */
export const yapilacaklar = (o: OzelYayin, d: Pick<Durum, "paketler" | "gorevlendirmeler" | "canliYayinlar">): OzelKalemi[] =>
  ozelKalemleri(o, d)
    .filter((k) => !k.bitti)
    .sort((a, b) => (a.sonTarih ?? "9999").localeCompare(b.sonTarih ?? "9999"));

/*
 * Planın aşamaları kayıttan (kullanıcı: elle işaretlenen aşamalar hiçbir
 * şeye bağlı değildi, iş bitse de "Planlama"da kalıyordu). Yalnız onay elle
 * (Plan yetkileri › ozOnay); öbürleri kalemlerin kendi durumundan:
 * - planlama: genel plan yazılmış, en az bir nafize ya da içerik var
 * - onay: plan onaylandı
 * - uygulama: nafizelerin rezervasyonu ve yeri, dış görevlendirmelerin onayı,
 *   yapılacak maddeler
 * - teslim: içerikler teslim edildi
 * Bütün aşamalar tamamsa "Yayına hazır". Şimdiki aşama tamamlanmamış ilk
 * aşama; eksikleri her aşamanın altında.
 */
export const OZEL_ASAMALARI = ["planlama", "onay", "uygulama", "hazir"] as const;
export type OzelAsama = (typeof OZEL_ASAMALARI)[number];
export const OZEL_ASAMA_ADI: Record<OzelAsama | "tamam", Anahtar> = { planlama: "oyAsamaPlanlama", onay: "oyAsamaOnay", uygulama: "oyAsamaUygulama", hazir: "oyAsamaHazir", tamam: "oyAsamaTamam" };
export const ozelDurum = (o: OzelYayin): OzelDurum => o.durum ?? "hazirlik";
/** Plan onaylandı mı: eski kayıttaki "uygulandı", "hazır" da onaydan sonra. */
export const ozelOnayli = (o: OzelYayin) => isaretli(OZEL_SIRASI, ozelDurum(o), "onayli");

export interface OzelEksik {
  tur: OzelKalemTuru | "plan";
  id: string;
  /** Kalemin adı (içerik, Arapça); planın kendi eksiğinde yok. */
  ad?: string;
  neden: Anahtar;
  tarih?: string;
  kisiId?: string;
}
export interface OzelAsamaDurumu {
  asama: OzelAsama;
  tamam: boolean;
  eksikler: OzelEksik[];
}

type OzelKaynak = Pick<Durum, "paketler" | "gorevlendirmeler" | "canliYayinlar">;

export const ozelAsamaDurumlari = (o: OzelYayin, d: OzelKaynak): OzelAsamaDurumu[] => {
  const nafizeler = ozelNafizeleri(d, o.id);
  const icerikler = ozelIcerikleri(d, o.id);
  const eskiler = ozelPaketSatirlari(o, d);
  const planlama: OzelEksik[] = [];
  if (!o.aciklama?.trim()) planlama.push({ tur: "plan", id: "aciklama", neden: "oyEkAciklama" });
  if (!nafizeler.length && !icerikler.length && !eskiler.length) planlama.push({ tur: "plan", id: "icerik", neden: "oyEkIcerik" });
  const onay: OzelEksik[] = ozelOnayli(o) ? [] : [{ tur: "plan", id: "onay", neden: "oyOnayBekliyor" }];
  const uygulama: OzelEksik[] = [
    ...nafizeler.filter((n) => !nafizeHazir(n) && !n.sonuc).map((n): OzelEksik => ({ tur: "nafize", id: n.id, ad: nafizeBasligi(n), neden: n.rezervasyon ? "oyEkYer" : "oyEkRezervasyon", tarih: n.tarih, kisiId: n.muhabirId })),
    ...ozelGorevlendirmeleri(d, o.id).filter((g) => !gorevHazir(g)).map((g): OzelEksik => ({ tur: "gorev", id: g.id, ad: g.yer, neden: "oyEkGorevOnay", tarih: g.baslangic, kisiId: g.kisiId })),
    ...eskiler.filter((x) => x.asama === "plan" || x.asama === "onayli").map((x): OzelEksik => ({ tur: "paket", id: x.id, ad: x.baslik, neden: "oyEkGorevVer", tarih: x.sonTarih, kisiId: x.muhabirId })),
    ...o.hazirlik.filter((h) => !h.tamam).map((h): OzelEksik => ({ tur: "madde", id: h.id, ad: h.metin, neden: "oyEkMadde", tarih: h.gun })),
  ];
  const teslim: OzelEksik[] = [
    ...icerikler.filter((p) => p.durum !== "tamamlandi").map((p): OzelEksik => ({ tur: "paket", id: p.id, ad: p.baslik, neden: "oyEkTeslim", tarih: p.sonTarih, kisiId: p.muhabirId })),
    ...eskiler.filter((x) => x.asama === "gorevli" || x.asama === "hazirlaniyor").map((x): OzelEksik => ({ tur: "paket", id: x.id, ad: x.baslik, neden: "oyEkTeslim", tarih: x.sonTarih, kisiId: x.muhabirId ?? x.paket?.hazirlayanId })),
  ];
  const sirala = (l: OzelEksik[]) => l.sort((a, b) => (a.tarih ?? "9999").localeCompare(b.tarih ?? "9999"));
  return [
    { asama: "planlama", tamam: !planlama.length, eksikler: planlama },
    { asama: "onay", tamam: !onay.length, eksikler: onay },
    { asama: "uygulama", tamam: !uygulama.length, eksikler: sirala(uygulama) },
    { asama: "hazir", tamam: !teslim.length, eksikler: sirala(teslim) },
  ];
};

export const ozelAsamasi = (o: OzelYayin, d: OzelKaynak): OzelAsama | "tamam" => ozelAsamaDurumlari(o, d).find((a) => !a.tamam)?.asama ?? "tamam";

/*
 * Günlük program: yayının her günü için nafizeler (saat sırasıyla), o gün
 * yayınlanacak içerikler, o gün sahada olan görevlendirmeler ve o güne
 * yazılmış yapılacak maddeler. Saklanmıyor, kayıtlardan güne göre okunuyor.
 */
export const ozelGunu = (o: OzelYayin, d: OzelKaynak, gun: string) => ({
  nafizeler: ozelNafizeleri(d, o.id).filter((n) => n.tarih === gun),
  icerikler: [...ozelIcerikleri(d, o.id).filter((p) => p.yayinGunu === gun), ...ozelPaketSatirlari(o, d).filter((x) => x.sonTarih === gun).map((x) => x.paket).filter((p): p is Paket => !!p)],
  gorevler: ozelGorevlendirmeleri(d, o.id).filter((g) => g.baslangic <= gun && (g.bitis ?? g.baslangic) >= gun),
  maddeler: o.hazirlik.filter((h) => h.gun === gun),
});

/* Yayının günleri: künyedeki aralık; aralığın dışına düşen nafize, içerik ya da madde de kendi günüyle girer, kaybolmasın. */
export const yayinGunleri = (o: OzelYayin, d: OzelKaynak): string[] => {
  const gunler = new Set<string>();
  const son = o.bitis && o.bitis > o.tarih ? o.bitis : o.tarih;
  for (let g = o.tarih, i = 0; g <= son && i < 62; g = gunEkle(g, 1), i++) gunler.add(g);
  for (const n of ozelNafizeleri(d, o.id)) if (n.tarih) gunler.add(n.tarih);
  for (const p of ozelIcerikleri(d, o.id)) if (p.yayinGunu) gunler.add(p.yayinGunu);
  for (const h of o.hazirlik) if (h.gun) gunler.add(h.gun);
  return [...gunler].sort();
};

/** Yayın bitti mi: son günü geçmiş özel yayın listede arşive iniyor. */
export const ozelGecti = (o: OzelYayin, gun = bugun()) => (o.bitis ?? o.tarih) < gun;
