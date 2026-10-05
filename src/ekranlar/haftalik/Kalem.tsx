import { Ban, Check, Eye, Pencil, Send, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Gorusler, KararRozeti, bicimSatiri } from "../../bilesenler/Haftalik";
import { Icerik, TurRozeti, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { useKaynakMetni } from "../../bilesenler/Tablolar";
import { gunAdi, metin, tarihYaz, useDil, type Anahtar } from "../../dil";
import { BICIM_ADI, TUR_ADI, sehirAdi } from "../../etiketler";
import { kalemKarar, kalemKaydet, kalemSil, onIncelemeyeGonder } from "../../eylemler";
import { gundemde, haftaGunleri, onIncelemeyeGidebilir } from "../../haftalik";
import { BICIMLER, ICERIK_TURLERI, baslikBul, kisiBul, oneriBul, paketBul, planBul, useVeri, type Bicim, type HaftalikKalem, type HaftalikPlan, type IcerikTuru, type Karar, type Kisi } from "../../veri";
import { haftalikDuzenler, kararVerebilir } from "../../yetki";
import { IkonDugme } from "../nextday/Bolumler";
import { FormAlt, MuhabirSecici } from "../nextday/Formlar";

/*
 * Haftalık gündemin kalemi: kurumun çıktısındaki satır ("ad - YER /
 * metin", muhabirler, biçim, not) ve toplantının kararı. Dosya merkezi
 * başlık havuzundan; yeni dosya havuza giriyor ve Next Day'de de aynı
 * başlık olarak kullanılıyor.
 */

const YENI_DOSYA = "__yeni";

/* `dosya` ve `sonra` belgeden: "altına ekle" denen kalemin dosyası seçili gelir, yeni kalem onun arkasına girer. */
/*
 * `ilk`: yeni kalemin başlangıç değerleri (takvimden aktarımda faaliyetten
 * dolu); `kaydedildi`: kalem kaydedilince kimliğiyle haber veriyor ki
 * çağıran (takvim) bağlantısını kursun.
 */
export function KalemFormu({
  ben,
  hafta,
  mevcut,
  tarih,
  dosya,
  sonra,
  ilk,
  kaydedildi,
  kapat,
}: {
  ben: Kisi;
  hafta: HaftalikPlan;
  mevcut?: HaftalikKalem;
  tarih?: string;
  dosya?: string;
  sonra?: string;
  ilk?: Partial<Pick<HaftalikKalem, "baslik" | "yer" | "metin" | "tur" | "muhabirler">>;
  kaydedildi?: (id: string) => void;
  kapat: () => void;
}) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [f, setF] = useState({
    tarih: mevcut ? (mevcut.tarih ?? "") : (tarih ?? ""),
    baslikId: mevcut?.baslikId ?? dosya ?? "",
    yeniBaslik: "",
    baslik: mevcut?.baslik ?? ilk?.baslik ?? "",
    yer: mevcut?.yer ?? ilk?.yer ?? "",
    metin: mevcut?.metin ?? ilk?.metin ?? "",
    tur: mevcut?.tur ?? ilk?.tur ?? ((tarih ? "haber" : "feature") as IcerikTuru),
    bicimler: mevcut?.bicimler ?? (["pkg"] as Bicim[]),
    muhabirler: mevcut?.muhabirler ?? ilk?.muhabirler ?? ([] as string[]),
    not: mevcut?.not ?? "",
  });
  const dosyalar = v.basliklar.filter((b) => b.aktif || b.id === f.baslikId);
  const kaydet = () => {
    const id = kalemKaydet(ben, hafta.id, {
      ...f,
      id: mevcut?.id,
      baslikId: f.baslikId === YENI_DOSYA ? undefined : f.baslikId,
      yeniBaslik: f.baslikId === YENI_DOSYA ? f.yeniBaslik : undefined,
    }, sonra);
    if (id) {
      bildir(t("bKaydedildi"));
      kaydedildi?.(id);
      kapat();
    }
  };
  const bicimDegistir = (b: Bicim) => setF({ ...f, bicimler: f.bicimler.includes(b) ? f.bicimler.filter((x) => x !== b) : [...f.bicimler, b] });

  return (
    <div className="form form-kutu ara-ust-2">
      <div className="satir">
        <label>
          {t("gun")}
          <select value={f.tarih} onChange={(e) => setF({ ...f, tarih: e.target.value })}>
            {haftaGunleri(hafta.baslangic).map((g) => (
              <option key={g} value={g}>
                {gunAdi(g, dil)} {tarihYaz(g, dil, "kisa")}
              </option>
            ))}
            <option value="">{t("zamanaBagliOlmayan")}</option>
          </select>
        </label>
        <label>
          {t("dosya")}
          <select value={f.baslikId} onChange={(e) => setF({ ...f, baslikId: e.target.value })}>
            <option value="">{t("dosyasiz")}</option>
            {dosyalar.map((b) => (
              <option key={b.id} value={b.id}>
                {b.ad}
              </option>
            ))}
            <option value={YENI_DOSYA}>+ {t("yeniDosya")}</option>
          </select>
        </label>
        <label>
          {t("tur")}
          <select value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as IcerikTuru })}>
            {ICERIK_TURLERI.map((x) => (
              <option key={x} value={x}>
                {t(TUR_ADI[x])}
              </option>
            ))}
          </select>
        </label>
      </div>
      {f.baslikId === YENI_DOSYA && (
        <label>
          {t("yeniDosya")}
          <input {...icerikAlani} value={f.yeniBaslik} onChange={(e) => setF({ ...f, yeniBaslik: e.target.value })} placeholder={metin("dosyaIpucu", "ar")} />
        </label>
      )}
      <div className="satir">
        <label>
          {t("olayAdi")} <span className="ipucu">{t("varsa")}</span>
          <input {...icerikAlani} value={f.baslik} onChange={(e) => setF({ ...f, baslik: e.target.value })} placeholder={metin("olayAdiIpucu", "ar")} />
        </label>
        <label>
          {t("yer")}
          <input {...icerikAlani} value={f.yer} onChange={(e) => setF({ ...f, yer: e.target.value })} placeholder={metin("yerIpucu", "ar")} />
        </label>
      </div>
      <label>
        {t("metin")}
        <textarea {...icerikAlani} rows={3} value={f.metin} onChange={(e) => setF({ ...f, metin: e.target.value })} placeholder={metin("kalemMetniIpucu", "ar")} />
      </label>
      <div>
        <div className="alan-etiket">{t("bicimSatiri")}</div>
        <fieldset className="secim-grubu ara-ust">
          {BICIMLER.map((b) => (
            <label key={b} className="secim-cip">
              <input type="checkbox" checked={f.bicimler.includes(b)} onChange={() => bicimDegistir(b)} />
              {t(BICIM_ADI(b))}
            </label>
          ))}
        </fieldset>
      </div>
      <div>
        <div className="alan-etiket">{t("muhabirler")}</div>
        {f.muhabirler.length > 0 && (
          <div className="cipler ara-ust">
            {f.muhabirler.map((id) => {
              const k = kisiBul(v, id);
              return (
                <span key={id} className="cip">
                  {ad(k)} · {k && t(sehirAdi(k.sehir))}
                  <button type="button" onClick={() => setF({ ...f, muhabirler: f.muhabirler.filter((x) => x !== id) })} aria-label={t("cikar")} title={t("cikar")}>
                    <X size={13} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <div className="ara-ust">
          <MuhabirSecici deger="" degistir={(id) => id && !f.muhabirler.includes(id) && setF({ ...f, muhabirler: [...f.muhabirler, id] })} bosEtiket={t("muhabirEkle")} />
        </div>
      </div>
      <label>
        {t("kalemNotu")} <span className="ipucu">{t("kalemNotuIpucu")}</span>
        <input dir="auto" value={f.not} onChange={(e) => setF({ ...f, not: e.target.value })} />
      </label>
      <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.metin.trim() || (f.baslikId === YENI_DOSYA && !f.yeniBaslik.trim())} />
    </div>
  );
}

const KARAR_DUGMELERI: { karar: Karar; ad: Anahtar; ikon: typeof Check; sinif: string }[] = [
  { karar: "kabul", ad: "krKabul", ikon: Check, sinif: "dugme-iyi" },
  { karar: "bilgi", ad: "krBilgi", ikon: Eye, sinif: "dugme-ikincil" },
  { karar: "ret", ad: "krRet", ikon: Ban, sinif: "dugme-kotu" },
];

export function KalemKarti({ ben, hafta, kalem, dosyaGoster = false }: { ben: Kisi; hafta: HaftalikPlan; kalem: HaftalikKalem; dosyaGoster?: boolean }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const kaynakMetni = useKaynakMetni();
  const [duzenle, setDuzenle] = useState(false);
  const duzenler = haftalikDuzenler(ben, hafta);
  const karar = kararVerebilir(ben, hafta) && gundemde(kalem);
  const plan = planBul(v, kalem.aktarim?.planId);
  const paket = paketBul(v, kalem.aktarim?.paketId);
  const dosya = baslikBul(v, kalem.baslikId);
  const oneri = oneriBul(v, kalem.oneriId);
  if (duzenle) return <KalemFormu ben={ben} hafta={hafta} mevcut={kalem} kapat={() => setDuzenle(false)} />;
  const onEk = [kalem.baslik, kalem.yer].filter(Boolean).join(" - ");
  return (
    <div className={`kayit kalem ${gundemde(kalem) ? "" : "dusmus"}`} data-karar={kalem.karar}>
      <div className="kayit-bas">
        <div>
          {dosyaGoster && dosya && (
            <small>
              <Icerik>{dosya.ad}</Icerik>
            </small>
          )}
          <Icerik blok className="kalem-satiri">
            {onEk && <b>{onEk} / </b>}
            {kalem.metin}
          </Icerik>
          {kalem.muhabirler.length > 0 && (
            <small>
              {kalem.muhabirler.map((id) => {
                const k = kisiBul(v, id);
                return (
                  <span key={id}>
                    {ad(k)} · {k && t(sehirAdi(k.sehir))}
                  </span>
                );
              })}
            </small>
          )}
          <small>
            <TurRozeti tur={kalem.tur} />
            {kalem.bicimler.length > 0 && <bdi dir="ltr">{bicimSatiri(kalem)}</bdi>}
            <KararRozeti kalem={kalem} />
            {oneri && (
              <a href={`#/oneriler/${oneri.id}`}>
                {t("oneri")} · {kaynakMetni(oneri, v)}
              </a>
            )}
          </small>
          {kalem.not && (
            <p className="kalem-notu" dir="auto">
              {kalem.not}
            </p>
          )}
          {(plan || paket) && (
            <small className="iyi-yazi">
              {plan && <a href={`#/nextday/${plan.id}`}>{t("aktarildi", { tarih: tarihYaz(plan.tarih, dil, "kisa") })}</a>}
              {paket && <a href={`#/paketler/${paket.id}`}>{paket.kod}</a>}
            </small>
          )}
        </div>
        {duzenler && (
          <div className="islemler">
            <IkonDugme ikon={<Pencil size={15} />} etiket={t("duzenle")} onClick={() => setDuzenle(true)} />
            <IkonDugme
              ikon={<Trash2 size={15} />}
              etiket={t("sil")}
              ton="kotu-yazi"
              onClick={() => confirm(t("silinsinMi")) && kalemSil(ben, hafta.id, kalem.id)}
            />
          </div>
        )}
      </div>
      <Gorusler kalem={kalem} d={v} />
      {(karar || (duzenler && onIncelemeyeGidebilir(kalem))) && (
        <div className="dugmeler ara-ust">
          {karar &&
            KARAR_DUGMELERI.map((k) => {
              const Ikon = k.ikon;
              const secili = kalem.karar === k.karar;
              return (
                <button
                  key={k.karar}
                  className={`dugme dugme-kucuk ${secili ? k.sinif : "dugme-sade"}`}
                  aria-pressed={secili}
                  onClick={() => kalemKarar(ben, hafta.id, kalem.id, secili ? "bekliyor" : k.karar)}
                >
                  <Ikon size={14} /> {t(k.ad)}
                </button>
              );
            })}
          {duzenler && onIncelemeyeGidebilir(kalem) && (
            <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => onIncelemeyeGonder(ben, hafta.id, [kalem.id]) && bildir(t("bOnIncelemeyeGitti", { n: 1 }))}>
              <Send size={14} className="yon" /> {t("onIncelemeyeGonder")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
