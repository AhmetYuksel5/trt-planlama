import { Link2, Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Icerik, bildir } from "../../bilesenler/Parcalar";
import { TarihGirdisi } from "../../bilesenler/TarihSaat";
import { MasrafListesi } from "../../bilesenler/PaketMetni";
import { tarihYaz, useDil, type Anahtar } from "../../dil";
import { masrafToplami, masrafYaz, paraBirimleri } from "../../paketMetni";
import { bugun, gunEkle } from "../../tarih";
import { BAGLANTI_SINIRI, MASRAF_TURLERI, baglantiAyikla, useVeri, type IcerikTuru, type Masraf, type MasrafTuru, type Oneri } from "../../veri";
import type { OneriMasrafGirdisi } from "../../eylemler";

/*
 * Öneri formunun ek parçaları (kullanıcı: tarih, bitiş ve teslim üç alan
 * kafa karıştırıyordu; masa listesindeki "Program" ile ayrı البرنامج alanı
 * havada kalıyordu; masraf yazıdan ibaret kalmasın; teklife bağlantı ve
 * görsel eklensin; iki iş akışı, iki editör ve bir tasarımcı ajanla, onaylı
 * öneri sayfası). Muhabirin formu, masanın önerisi ve düzenleme aynı parçaları
 * kullanıyor.
 */

/* --- Zaman: tek soru, tek tarih --- */

export type ZamanModu = "olay" | "zamansiz";

/*
 * Masaya göre varsayılan: güncel haber ve spor hep olaylı (soru sorulmaz),
 * ekonomi olaylı, feature zamana bağlı değil, programda muhabir seçer
 * (program hem süreye bağlı olaya hem feature'a iş isteyebiliyor).
 */
export const zamanVarsayilani = (tur: IcerikTuru, takip: boolean): { mod: ZamanModu | ""; soru: boolean } =>
  takip || tur === "haber" || tur === "spor" ? { mod: "olay", soru: false } : tur === "feature" ? { mod: "zamansiz", soru: true } : tur === "program" ? { mod: "", soru: true } : { mod: "olay", soru: true };

export interface ZamanDurumu {
  /** Kişinin seçimi; boşsa masanın varsayılanı. */
  secim: ZamanModu | "";
  hedefTarih: string;
  bitis: string;
  birkacGun: boolean;
  teslim: string;
  teslimOnce: boolean;
}

export const zamanBaslangic = (hedefTarih: string): ZamanDurumu => ({ secim: "", hedefTarih, bitis: "", birkacGun: false, teslim: gunEkle(bugun(), 7), teslimOnce: false });

/** Formun gerçek modu: soru yoksa masanınki, varsa kişinin seçimi ya da varsayılan. */
export const zamanModu = (z: ZamanDurumu, tur: IcerikTuru, takip: boolean): ZamanModu | "" => {
  const v = zamanVarsayilani(tur, takip);
  return v.soru ? z.secim || v.mod : v.mod;
};

/* Eyleme giden alanlar: olaylı öneri gününü (ve bitiş, teslim) taşır; zamana bağlı olmayan teslim gününün haftasında. */
export const zamanGirdisi = (z: ZamanDurumu, mod: ZamanModu | "", haftaBasi: (t: string) => string) =>
  mod === "zamansiz"
    ? { hedefTarih: undefined, bitisTarih: undefined, hafta: haftaBasi(z.teslim), teslimTahmini: z.teslim }
    : {
        hedefTarih: z.hedefTarih,
        bitisTarih: z.birkacGun && z.bitis > z.hedefTarih ? z.bitis : undefined,
        teslimTahmini: z.teslimOnce && z.teslim && z.teslim <= z.hedefTarih ? z.teslim : undefined,
      };

export const zamanGecerli = (z: ZamanDurumu, mod: ZamanModu | "") =>
  mod === "zamansiz" ? !!z.teslim : mod === "olay" ? !!z.hedefTarih && (!z.birkacGun || !z.bitis || z.bitis >= z.hedefTarih) : false;

export function OneriZamani({ z, setZ, tur, takip, min = bugun() }: { z: ZamanDurumu; setZ: (z: ZamanDurumu) => void; tur: IcerikTuru; takip: boolean; min?: string }) {
  const { t } = useDil();
  const v = zamanVarsayilani(tur, takip);
  const mod = zamanModu(z, tur, takip);
  // Feature ve programa yapılan olaylı işte teslim olaydan önce olabilir; güncel haberde teslim olayın kendisi.
  const teslimSorulur = tur !== "haber" && tur !== "spor" && !takip;
  return (
    <div className="oneri-zaman" data-oneri-zaman={mod || "secilmedi"}>
      {v.soru && (
        <div className="hap-secim" role="radiogroup" aria-label={t("ozZaman")}>
          {(["olay", "zamansiz"] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mod === m} className={mod === m ? "secili" : ""} onClick={() => setZ({ ...z, secim: m })} data-zaman-sec={m}>
              {t(m === "olay" ? "ozOlayVar" : "zamanaBagliDegil")}
            </button>
          ))}
        </div>
      )}
      {mod === "olay" && (
        <div className="satir">
          <label>
            {t("ozOlayGunu")}
            <TarihGirdisi
              value={z.hedefTarih}
              min={min}
              onChange={(e) => setZ({ ...z, hedefTarih: e.target.value, ...(z.bitis && e.target.value > z.bitis && { bitis: "" }) })}
              data-oneri-tarih
            />
          </label>
          {z.birkacGun && (
            <label>
              {t("ozSonGun")}
              <TarihGirdisi value={z.bitis} min={z.hedefTarih || min} onChange={(e) => setZ({ ...z, bitis: e.target.value })} data-oneri-bitis />
            </label>
          )}
          {z.teslimOnce && (
            <label>
              {t("ozTeslimGunu")}
              <TarihGirdisi value={z.teslim > z.hedefTarih ? "" : z.teslim} min={min} max={z.hedefTarih} onChange={(e) => setZ({ ...z, teslim: e.target.value })} data-oneri-teslim />
            </label>
          )}
        </div>
      )}
      {mod === "olay" && (
        <div className="oneri-zaman-ek">
          <button type="button" className="baglanti-dugme" aria-pressed={z.birkacGun} onClick={() => setZ({ ...z, birkacGun: !z.birkacGun, bitis: z.birkacGun ? "" : z.bitis })} data-oneri-birkac-gun>
            {z.birkacGun ? <X size={14} /> : <Plus size={14} />} {t("ozBirkacGun")}
          </button>
          {teslimSorulur && (
            <button
              type="button"
              className="baglanti-dugme"
              aria-pressed={z.teslimOnce}
              onClick={() => setZ({ ...z, teslimOnce: !z.teslimOnce, ...(!z.teslimOnce && z.teslim > z.hedefTarih && { teslim: z.hedefTarih }) })}
              data-oneri-teslim-once
            >
              {z.teslimOnce ? <X size={14} /> : <Plus size={14} />} {t("ozTeslimOnce")}
            </button>
          )}
        </div>
      )}
      {mod === "zamansiz" && (
        <label>
          {t("ozTeslimGunu")}
          <TarihGirdisi value={z.teslim} min={min} onChange={(e) => setZ({ ...z, teslim: e.target.value })} data-oneri-teslim />
        </label>
      )}
    </div>
  );
}

/* --- Program adayları: birden çok seçilir --- */

export function ProgramAdaylari({ secili, degistir }: { secili: string[]; degistir: (l: string[]) => void }) {
  const { t } = useDil();
  const v = useVeri();
  // Kapanan program seçilmez; eski kayıtta seçili olan yine görünür (kendiliğinden güncel: programcı ekleyince burada).
  const programlar = (v.programlar ?? []).filter((p) => !p.pasif || secili.includes(p.id));
  if (!programlar.length) return null;
  return (
    <div className="program-adaylari" data-program-adaylari>
      <div className="alan-etiket">
        {t("paProgramlar")} <span className="ipucu">{t("paBirdenCok")}</span>
      </div>
      <div className="cip-secim" role="group" aria-label={t("paProgramlar")}>
        {programlar.map((p) => {
          const acik = secili.includes(p.id);
          return (
            <button key={p.id} type="button" aria-pressed={acik} className={acik ? "secili" : ""} onClick={() => degistir(acik ? secili.filter((x) => x !== p.id) : [...secili, p.id])} data-program-aday={p.id}>
              <Icerik>{p.ad}</Icerik>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --- Masraf kalemleri: paketin masrafıyla aynı yapı --- */

export function MasrafKalemleri({ l, degistir }: { l: OneriMasrafGirdisi[]; degistir: (l: OneriMasrafGirdisi[]) => void }) {
  const { t } = useDil();
  const v = useVeri();
  const paralar = paraBirimleri(v);
  const yaz = (i: number, p: Partial<OneriMasrafGirdisi>) => degistir(l.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="masraf-kalemleri" data-oneri-masraflar>
      <div className="alan-etiket">{t("msMasraf")}</div>
      {l.map((m, i) => (
        <div className="masraf-kalemi" key={i} data-oneri-masraf={i}>
          <div className="cip-secim" role="radiogroup" aria-label={t("msMasraf")}>
            {MASRAF_TURLERI.map((x) => (
              <button key={x} type="button" role="radio" aria-checked={m.tur === x} className={m.tur === x ? "secili" : ""} onClick={() => yaz(i, { tur: x as MasrafTuru })} data-oneri-masraf-tur={x}>
                {t(`ms_${x}` as Anahtar)}
              </button>
            ))}
          </div>
          <div className="masraf-satiri">
            <input
              inputMode="decimal"
              dir="ltr"
              aria-label={t("mhTutar")}
              placeholder={t("mhTutar")}
              value={Number.isNaN(m.tutar) || !m.tutar ? "" : String(m.tutar)}
              onChange={(e) => yaz(i, { tutar: Number(e.target.value.replace(",", ".")) })}
              data-oneri-masraf-tutar
            />
            <select aria-label={t("mhPara")} value={m.para} onChange={(e) => yaz(i, { para: e.target.value })} data-oneri-masraf-para>
              {paralar.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => degistir(l.filter((_, j) => j !== i))} title={t("ekMasrafKaldir")} aria-label={t("ekMasrafKaldir")}>
              <X size={16} />
            </button>
          </div>
          {(m.tur === "diger" || m.aciklama) && (
            <input dir="auto" placeholder={t("aciklama")} aria-label={t("aciklama")} value={m.aciklama ?? ""} onChange={(e) => yaz(i, { aciklama: e.target.value })} data-oneri-masraf-aciklama />
          )}
        </div>
      ))}
      {l.length < 10 && (
        <button type="button" className="baglanti-dugme" onClick={() => degistir([...l, { tur: "cekim", tutar: 0, para: l.at(-1)?.para ?? paralar[0] }])} data-oneri-masraf-ekle>
          <Plus size={14} /> {t("ekMasrafKalemi")}
        </button>
      )}
    </div>
  );
}

/* --- Bağlantılar: yapıştırılan metindeki birden çok adres ayrılır, site adıyla çip --- */

export const siteAdi = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

export function BaglantiAlani({ l, degistir }: { l: string[]; degistir: (l: string[]) => void }) {
  const { t } = useDil();
  const [yazi, setYazi] = useState("");
  const ekle = (metin = yazi) => {
    const yeni = baglantiAyikla(metin).filter((u) => !l.includes(u));
    if (!yeni.length) {
      if (metin.trim()) bildir(t("ekBaglantiHatali"));
      return;
    }
    const son = [...l, ...yeni];
    if (son.length > BAGLANTI_SINIRI) bildir(t("ekBaglantiSinir", { n: BAGLANTI_SINIRI }));
    degistir(son.slice(0, BAGLANTI_SINIRI));
    setYazi("");
  };
  return (
    <div className="baglanti-alani" data-oneri-baglantilar>
      <div className="alan-etiket">{t("ekBaglantilar")}</div>
      {l.length > 0 && (
        <div className="cipler">
          {l.map((u) => (
            <span key={u} className="cip baglanti-cipi" title={u} data-oneri-baglanti={u}>
              <Link2 size={13} /> <bdi dir="ltr">{siteAdi(u)}</bdi>
              <button type="button" onClick={() => degistir(l.filter((x) => x !== u))} title={t("ekBaglantiKaldir")} aria-label={t("ekBaglantiKaldir")}>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      {l.length < BAGLANTI_SINIRI && (
        <div className="baglanti-yaz">
          <input
            dir="ltr"
            inputMode="url"
            placeholder="https://"
            aria-label={t("ekBaglantilar")}
            value={yazi}
            onChange={(e) => setYazi(e.target.value)}
            onPaste={(e) => {
              // Yapıştırılan metinde adres varsa hemen çipe: birden çok adres de ayrılıyor.
              const p = e.clipboardData.getData("text");
              if (baglantiAyikla(p).length) {
                e.preventDefault();
                ekle(p);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                ekle();
              }
            }}
            data-oneri-baglanti-yaz
          />
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => ekle()} data-oneri-baglanti-ekle>
            {t("ekle")}
          </button>
        </div>
      )}
    </div>
  );
}

/* --- Katlı "Ek bilgiler": başlığında içinin özeti, doluysa açık gelir --- */

export function EkBilgiler({ ozet, dolu, children }: { ozet: string[]; dolu: boolean; children: ReactNode }) {
  const { t } = useDil();
  return (
    <details className="ek-bilgiler" open={dolu || undefined} data-oneri-ek-bilgiler>
      <summary>
        <span>{t("ekBilgiler")}</span>
        {ozet.length > 0 && <small className="sonuk-yazi">{ozet.join(" · ")}</small>}
      </summary>
      <div className="ek-bilgiler-govde">{children}</div>
    </details>
  );
}

/* Ek bilgilerin özet satırı: masraf toplamı, bağlantı ve görsel sayısı. */
export const ekOzeti = (t: (k: Anahtar, p?: Record<string, string | number>) => string, g: { masraflar?: OneriMasrafGirdisi[]; baglantilar?: string[]; gorseller?: unknown[] }) => {
  const m = (g.masraflar ?? []).filter((x) => x.tutar > 0) as Masraf[];
  return [
    ...(m.length ? [masrafYaz(masrafToplami(m))] : []),
    ...(g.baglantilar?.length ? [`${t("ekBaglantilar")} ${g.baglantilar.length}`] : []),
    ...(g.gorseller?.length ? [`${t("grGorseller")} ${g.gorseller.length}`] : []),
  ];
};

/* --- Öneri penceresinde salt okunur: program adayları, kalemli masraf, bağlantılar --- */

export function OneriEkleriGoster({ o }: { o: Pick<Oneri, "programAdaylari" | "programId" | "masraflar" | "baglantilar"> }) {
  const { t } = useDil();
  const v = useVeri();
  const adaylar = !o.programId ? (o.programAdaylari ?? []).map((id) => v.programlar?.find((p) => p.id === id)).filter((p) => !!p) : [];
  if (!adaylar.length && !o.masraflar?.length && !o.baglantilar?.length) return null;
  return (
    <div className="oneri-ekleri ara-ust-2" data-oneri-ekleri>
      {adaylar.length > 0 && (
        <div data-oneri-program-adaylari>
          <div className="alan-etiket">{t("paAdaylar")}</div>
          <Icerik>{adaylar.map((p) => p!.ad).join(" / ")}</Icerik>
        </div>
      )}
      {o.masraflar?.length ? (
        <div data-oneri-masraf-gosterim>
          <div className="alan-etiket">
            {t("msMasraf")} · <b dir="ltr">{masrafYaz(masrafToplami(o.masraflar))}</b>
          </div>
          <MasrafListesi masraflar={o.masraflar} />
        </div>
      ) : null}
      {o.baglantilar?.length ? (
        <div className="cipler" data-oneri-baglanti-gosterim>
          {o.baglantilar.map((u) => (
            <a key={u} className="cip baglanti-cipi" href={u} target="_blank" rel="noopener noreferrer" title={u}>
              <Link2 size={13} /> <bdi dir="ltr">{siteAdi(u)}</bdi>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* Plana ekle ve görevlendirme formunda: önerinin masrafı da onaylansın mı (varsayılan evet). */
export function MasrafOnayKutusu({ o, onay, setOnay }: { o: Pick<Oneri, "masraflar">; onay: boolean; setOnay: (x: boolean) => void }) {
  const { t } = useDil();
  if (!o.masraflar?.length) return null;
  return (
    <label className="secim" data-masraf-onay-kutusu>
      <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} />
      {t("ekMasrafOnay", { toplam: masrafYaz(masrafToplami(o.masraflar)) })}
    </label>
  );
}

/* Kısa tarih satırı ("teslim 5 Ara"): formun "nereye düşer" önizlemesinde. */
export const teslimEki = (tarih: string, dil: Parameters<typeof tarihYaz>[1], t: (k: Anahtar, p?: Record<string, string>) => string) => t("ozTeslimEki", { tarih: tarihYaz(tarih, dil, "kisa") });
