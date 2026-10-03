import { ArrowDown, ArrowUp, Check, LayoutGrid, Plus, RotateCcw, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Kart } from "../../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../../dil";
import { BIRIM_ADI } from "../../etiketler";
import { anaSayfaKaydet } from "../../eylemler";
import { useVeri, type Birim, type Kisi } from "../../veri";
import { kapsam, sayfaGorebilir } from "../../yetki";
import { IkonDugme } from "../nextday/Bolumler";
import { PANEL_ALANLARI } from "../YoneticiPaneli";
import { BIRIM_ALANLARI } from "./Birimler";
import { MUHABIR_ALANLARI } from "./Muhabir";
import { PLANLAMA_ALANLARI } from "./Planlama";

/*
 * Ana sayfa bir çalışma alanları dizisi. Her birimin varsayılanı kendi
 * işine göre; kişi kendi sayfasında alan kaldırıyor, sırasını değiştiriyor
 * ve yetkisi olan başka birimlerin alanlarını ekliyor. Seçim kişiye ait
 * (Durum.anaSayfa), birimin varsayılanı değişmiyor.
 */

/** Düzenin sahibi: birimin ana sayfası ya da yöneticinin paneli. */
export type DuzenAdi = Birim | "panel";

export interface Alan {
  id: string;
  ad: Anahtar;
  /** Aynı başlıklı iki alanı ayırmak için (ör. bu hafta / gelecek hafta). */
  ek?: Anahtar;
  /** Satırın tamamını kaplıyor: sayaçlar, kısayollar, geniş tablolar. */
  genis?: boolean;
  /** Katalogda hangi başlık altında. */
  grup: DuzenAdi;
  /*
   * Kim ekleyebilir: alanın gösterdiği kaydın sayfasını görebilen. "muhabir"
   * yalnız muhabirin kendi işi, "panel" kapsamı olan yönetici.
   */
  sayfa: string;
  Bilesen: (p: { ben: Kisi }) => ReactNode;
}

/* Bugünkü birim sayfalarının düzeni; sıra da öyle. */
export const VARSAYILAN: Record<DuzenAdi, string[]> = {
  planlama: ["plKisayol", "plSayac", "plHafta", "plTakvim", "plToplanti", "plSonOneri", "plPlanlar", "plHareket", "plMuhabirler", "plKoordinasyon", "plDosyalar"],
  muhabir: ["muCagri", "muSayac", "muSiram", "muGorev", "muHaberler", "muBildirim", "muOneriler"],
  newsdesk: ["ndSayac", "ndPlan", "ndKontrol", "ndUretim", "ndGeciken", "ndUcret"],
  newsgathering: ["ngSayac", "ngBekleyen", "ngSahaGerekecek", "ngSahada", "ngTakvim"],
  ekonomi: ["ekSayac", "ekOnInceleme", "ekGelecek", "ekBuHafta", "ekPaketler"],
  program: ["prHafta", "prUretim", "prOneri", "prKonuk"],
  output: ["ouSayac", "ouKontrol", "ouDil", "ouSon"],
  media: ["meKuyruk", "meYaklasan", "meSon"],
  yonetim: ["ypSayac", "ypOnInceleme", "ypBirimler", "ypPlanlar", "ypDikkat", "ypTalimat", "ypTakvim", "ypHafta"],
  panel: ["ypSayac", "ypOnInceleme", "ypBirimler", "ypPlanlar", "ypDikkat", "ypTalimat", "ypTakvim", "ypHafta"],
};

/* Katalog çizim sırasında kuruluyor: alan dosyaları bu dosyayı da içe aktarıyor, açılışta okunursa döngüde henüz tanımsız olurlar. */
const katalog = (): Alan[] => [...PLANLAMA_ALANLARI, ...MUHABIR_ALANLARI, ...BIRIM_ALANLARI, ...PANEL_ALANLARI];

export const alanUygun = (ben: Kisi, a: Alan) =>
  a.sayfa === "muhabir" ? ben.birim === "muhabir" : a.sayfa === "panel" ? !!kapsam(ben) : ben.birim !== "muhabir" && sayfaGorebilir(ben, a.sayfa);

export const duzenAnahtari = (kisiId: string, duzen: DuzenAdi) => `${kisiId}:${duzen}`;

/**
 * Kişinin düzeni; kendi seçimi yoksa birimin varsayılanı. Kişisel değilse
 * (müdürün birime inip baktığı görünüm) her zaman varsayılan.
 */
export function CalismaAlani({ ben, duzen, kisisel = true }: { ben: Kisi; duzen: DuzenAdi; kisisel?: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const [duzenle, setDuzenle] = useState(false);
  const uygunlar = katalog().filter((a) => alanUygun(ben, a));
  const bul = (id: string) => uygunlar.find((a) => a.id === id);
  const kayitli = kisisel ? v.anaSayfa?.[duzenAnahtari(ben.id, duzen)] : undefined;
  const secili = (kayitli ?? VARSAYILAN[duzen]).filter((id) => !!bul(id));
  const kaydet = (ids: string[] | null) => anaSayfaKaydet(ben, duzen, ids);
  const tasi = (i: number, yon: -1 | 1) => {
    const yeni = [...secili];
    [yeni[i], yeni[i + yon]] = [yeni[i + yon], yeni[i]];
    kaydet(yeni);
  };
  const eklenebilir = uygunlar.filter((a) => !secili.includes(a.id));
  const gruplar = [...new Set(eklenebilir.map((a) => a.grup))];
  const adi = (a: Alan) => (a.ek ? `${t(a.ad)} · ${t(a.ek)}` : t(a.ad));
  const grupAdi = (g: DuzenAdi) => t(g === "panel" ? "mPanel" : BIRIM_ADI[g]);

  return (
    <>
      {kisisel && (
        <div className="alan-arac">
          {duzenle ? (
            <>
              <span className="bos-kucuk">{t("alanDuzenNotu")}</span>
              <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => kaydet(null)} disabled={!kayitli}>
                <RotateCcw size={14} /> {t("varsayilanaDon")}
              </button>
              <button className="dugme dugme-kucuk" onClick={() => setDuzenle(false)}>
                <Check size={14} /> {t("bitti")}
              </button>
            </>
          ) : (
            <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setDuzenle(true)}>
              <LayoutGrid size={14} /> {t("sayfayiDuzenle")}
            </button>
          )}
        </div>
      )}
      <div className={`alan-izgarasi ${duzenle ? "duzenleniyor" : ""}`}>
        {secili.map((id, i) => {
          const a = bul(id)!;
          return (
            <section key={id} className={`alan ${a.genis ? "genis" : ""}`} data-alan={id}>
              {duzenle && (
                <div className="alan-cubugu">
                  <b>{adi(a)}</b>
                  <span className="bosluk-esnek" />
                  {i > 0 && <IkonDugme ikon={<ArrowUp size={15} />} etiket={t("yukariTasi")} onClick={() => tasi(i, -1)} />}
                  {i < secili.length - 1 && <IkonDugme ikon={<ArrowDown size={15} />} etiket={t("asagiTasi")} onClick={() => tasi(i, 1)} />}
                  <IkonDugme ikon={<X size={15} />} etiket={t("alaniKaldir")} ton="kotu-yazi" onClick={() => kaydet(secili.filter((x) => x !== id))} />
                </div>
              )}
              <a.Bilesen ben={ben} />
            </section>
          );
        })}
      </div>
      {duzenle && (
        <Kart baslik={t("alanEkle")} ikon={<Plus size={18} />} className="ara-ust-2">
          {eklenebilir.length === 0 ? (
            <p className="bos-kucuk">{t("eklenecekAlanYok")}</p>
          ) : (
            gruplar.map((g) => (
              <div key={g} className="ara-ust-2">
                <div className="alan-etiket">{grupAdi(g)}</div>
                <div className="cipler ara-ust">
                  {eklenebilir
                    .filter((a) => a.grup === g)
                    .map((a) => (
                      <button key={a.id} className="dugme dugme-ikincil dugme-kucuk" onClick={() => kaydet([...secili, a.id])}>
                        <Plus size={13} /> {adi(a)}
                      </button>
                    ))}
                </div>
              </div>
            ))
          )}
        </Kart>
      )}
    </>
  );
}
