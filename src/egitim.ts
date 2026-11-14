import { asamaListesi, durakBul } from "./akis";
import type { Anahtar } from "./dil";
import { gfxAcik, gfxBekliyor } from "./uretim";
import type { BirimId, Durum, Kisi, Paket } from "./veri";

/*
 * Eğitim senaryosu (kullanıcı: eğitimde ve sunumda aşamaları rol rol
 * göstermek; tek başına adım adım ya da birkaç rol yan yana). Senaryo
 * kaydı yazmaz, kayda bakar: sıradaki adım her an kaydın durumundan çıkar
 * (öneri gönderildi mi, paket kabul edildi mi, hangi durakta), adım yapılınca
 * kendiliğinden geçilir. Üretimden sonraki adımlar sabit değil, paketin
 * yolundan (aşama kutuları, akis.ts → asamaListesi): balonda hangi şablon
 * seçilirse senaryo onunla yürür. Saf.
 */

export interface EgitimBaglami {
  /** Senaryonun başladığı an; ondan önceki öneriler senaryonun değil. */
  baslangic: string;
  /** Öneriyi gönderecek muhabir. */
  muhabirId: string;
}

export type AdimDurumu = "gecti" | "simdi" | "";

export interface EgitimAdimi {
  id: string;
  /** Listedeki adı: sabit adımda dil anahtarı, üretimde aşama kutusunun adı. */
  ad: { anahtar: Anahtar } | { metin: string };
  durum: AdimDurumu;
}

/** Şimdiki adımın işi: kimin bölmesinde, hangi sayfa, hangi düğme, ne anlatılıyor. */
export interface EgitimIsi {
  kisiId: string;
  yol: string;
  /** Vurgulanacak öğeler (virgüllü seçici; pencere açılınca içindeki düğme de). */
  secici: string;
  metin: Anahtar;
}

export interface EgitimDurumu {
  adimlar: EgitimAdimi[];
  is?: EgitimIsi;
  bitti: boolean;
  oneriId?: string;
  paketId?: string;
}

/*
 * Masanın işini demoda kimin yapacağı: örnek kişilerden o birimin kişisi.
 * Önce bilinen kişi (Planlama yöneticisi, Newsdesk, dil denetmeni…), yoksa
 * birimin ilk etkin kişisi.
 */
const MASA_KISISI: Partial<Record<BirimId, string>> = {
  planlama: "pl1",
  newsdesk: "nd1",
  scriptEditor: "ou2",
  grafik: "gr1",
  ekonomi: "ek1",
  program: "pr2",
  spor: "sp1",
};

export const masaKisisi = (d: Pick<Durum, "kisiler">, birim: BirimId | string | undefined): string | undefined => {
  if (!birim) return undefined;
  const bilinen = MASA_KISISI[birim as BirimId];
  if (bilinen && d.kisiler.some((k) => k.id === bilinen && !k.pasif)) return bilinen;
  return d.kisiler.find((k: Kisi) => k.birim === birim && !k.pasif)?.id;
};

export const senaryoOnerisi = (d: Pick<Durum, "oneriler">, b: EgitimBaglami) =>
  d.oneriler.find((o) => o.muhabirId === b.muhabirId && o.zaman >= b.baslangic);

export const senaryoPaketi = (d: Pick<Durum, "paketler">, oneriId: string | undefined): Paket | undefined =>
  oneriId ? d.paketler.find((p) => p.oneriId === oneriId && p.durum !== "iptal") : undefined;

const SABIT: { id: string; anahtar: Anahtar }[] = [
  { id: "oneri", anahtar: "egAdOneri" },
  { id: "plan", anahtar: "egAdPlan" },
  { id: "kabul", anahtar: "egAdKabul" },
  { id: "uretim", anahtar: "egAdUretim" },
];

/* Üretimdeki paketin sıradaki işi: durağın türünden, metin durağında parçaların hâlinden. */
const uretimIsi = (d: Durum, p: Paket, muhabirId: string): EgitimIsi | undefined => {
  const yol = `paketler/${p.id}`;
  const u = p.uretim;
  const masaninKisisi = (asama: keyof NonNullable<Paket["uretim"]>["yol"]) => masaKisisi(d, u?.yol[asama]);
  // Gfx açık ve yükleme onu bekliyorsa önce grafik.
  if (gfxAcik(p) && gfxBekliyor(p) && (p.adim === "inews" || p.adim === "media")) {
    const k = masaninKisisi("grafik");
    if (k) return { kisiId: k, yol: `${yol}/gfx`, secici: "[data-gfx-hazir]", metin: "egGfx" };
  }
  const tur = durakBul(p, p.adim)?.tur ?? p.adim;
  const muhabir = p.muhabirId ?? muhabirId;
  if (tur === "newsdesk" || tur === "gorevlendirme") {
    const k = masaninKisisi("gorev");
    return k ? { kisiId: k, yol, secici: "[data-durak-gorev]", metin: "egGorev" } : undefined;
  }
  if (tur === "metin") {
    const parcalar = p.parcalar ?? [];
    const editor = parcalar.find((x) => x.asama === "newsdesk");
    if (editor) {
      const k = masaninKisisi("editoryal");
      if (k) return { kisiId: k, yol, secici: "[data-parca-ilerlet], [data-parca-iade]", metin: "egEditorAdimi" };
    }
    const dil = parcalar.find((x) => x.asama === "dil");
    if (dil) {
      const k = masaninKisisi("dil");
      if (k) return { kisiId: k, yol, secici: "[data-dd-gonder]", metin: "egDil" };
    }
    if (parcalar.some((x) => x.asama === "muhabir")) return { kisiId: muhabir, yol, secici: "[data-parca-duzenle], [data-parca-gonder]", metin: "egIade" };
    if (!parcalar.length) return { kisiId: muhabir, yol, secici: "[data-parca-ekle], [data-parca-gonder]", metin: "egParca" };
    return { kisiId: muhabir, yol, secici: "[data-parca-video-gonder]", metin: "egVideo" };
  }
  if (tur === "video") return { kisiId: muhabir, yol, secici: "[data-parca-video-gonder]", metin: "egVideo" };
  if (tur === "videoKontrol") {
    const k = masaninKisisi("video");
    return k ? { kisiId: k, yol, secici: "[data-video-onayla], [data-video-revizyon]", metin: "egVideoKontrol" } : undefined;
  }
  if (tur === "inews" || tur === "media") {
    const k = masaninKisisi("yukleme");
    return k ? { kisiId: k, yol, secici: "[data-sistem-yukle]", metin: "egYukleme" } : undefined;
  }
  // Genel iş (yayın kararı ve yöneticinin eklediği duraklar).
  const k = masaninKisisi("yayin");
  return k ? { kisiId: k, yol, secici: "[data-durak-tamamla]", metin: "egYayin" } : undefined;
};

export const egitimDurumu = (d: Durum, b: EgitimBaglami): EgitimDurumu => {
  const o = senaryoOnerisi(d, b);
  const p = senaryoPaketi(d, o?.id);
  // Sabit adımların hangisi bitti: öneri var, paketi var, paket kabul edildi, üretim başladı.
  const kabul = !!p && !["taslak", "degerlendiriliyor"].includes(p.durum);
  const uretimde = !!p?.uretim;
  const bitenSabit = !o ? 0 : !p ? 1 : !kabul ? 2 : !uretimde ? 3 : 4;
  const bitti = p?.durum === "tamamlandi";

  const sabit: EgitimAdimi[] = SABIT.map((x, i) => ({ id: x.id, ad: { anahtar: x.anahtar }, durum: i < bitenSabit ? "gecti" : i === bitenSabit ? "simdi" : "" }));
  // Üretim başlayınca paketin kendi yolu; Planlama kutusu sabit adımlarda zaten var.
  const yol: EgitimAdimi[] = p?.uretim
    ? asamaListesi(p)
        .filter((a) => a.id !== "planlama")
        .map((a) => ({ id: a.id, ad: { metin: a.ad }, durum: bitti ? "gecti" : a.durum === "gecikti" ? "simdi" : a.durum }))
    : [{ id: "uretim-asamalari", ad: { anahtar: "egAdUretimAsamalari" }, durum: "" }];

  let is: EgitimIsi | undefined;
  if (!o) is = { kisiId: b.muhabirId, yol: "oneriler/yeni", secici: "[data-oneri-gonder]", metin: "egOneri" };
  else if (!p) is = { kisiId: "pl1", yol: `oneriler/${o.id}`, secici: "[data-oneri-plana-ekle], [data-pe-paket], [data-pe-ekle]", metin: "egPlan" };
  else if (!kabul) is = { kisiId: "pl1", yol: `paketler/${p.id}`, secici: "[data-paket-kabul]", metin: "egKabul" };
  else if (!uretimde) is = { kisiId: "pl1", yol: `paketler/${p.id}`, secici: "[data-uretim-ac], [data-uretim-sablon='u-gunluk'], [data-uretim-gonder]", metin: "egUretim" };
  else if (!bitti && p.durum === "uretimde") is = uretimIsi(d, p, b.muhabirId);
  return { adimlar: [...sabit, ...yol], is, bitti, oneriId: o?.id, paketId: p?.id };
};

/* Senaryonun rolleri (yan yana düzende bölmeler): yolun bilinen kişileri, sırasıyla, en çok dört. */
export const senaryoKisileri = (d: Durum, b: EgitimBaglami, p?: Paket): string[] => {
  const u = p?.uretim;
  const masalar = u ? [u.yol.gorev, u.yol.editoryal, u.yol.dil, u.yol.video, u.yol.yukleme, u.yol.yayin] : ["newsdesk", "scriptEditor"];
  const kisiler = [b.muhabirId, "pl1", ...masalar.map((m) => masaKisisi(d, m))].filter((x): x is string => !!x && d.kisiler.some((k) => k.id === x));
  return [...new Set(kisiler)].slice(0, 4);
};
