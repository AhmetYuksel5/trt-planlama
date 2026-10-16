import { Ban, Check, Eye, MessageSquarePlus, Pencil, Send, Trash2, X } from "lucide-react";
import { AnmaGirdisi } from "../../bilesenler/Anma";
import { useState } from "react";
import { Gorusler, KararRozeti, bicimSatiri, kalemPaketli } from "../../bilesenler/Haftalik";
import { Icerik, Rozet, TbcKutusu, TurRozeti, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { useKaynakMetni } from "../../bilesenler/Tablolar";
import { gunAdi, metin, tarihYaz, useDil, type Anahtar } from "../../dil";
import { BICIM_ADI, TBC, TUR_ADI, kisiAr, muhabirYeri, satir, sehirAdi, sehirAr } from "../../etiketler";
import { kalemKarar, kalemKararNotu, kalemKaydet, kalemSil, onIncelemeyeGonder } from "../../eylemler";
import { gundemde, haftaGunleri, onIncelemeyeGidebilir } from "../../haftalik";
import { BICIMLER, ICERIK_TURLERI, baslikBul, kisiBul, oneriBul, paketBul, planBul, useVeri, type Bicim, type HaftalikKalem, type HaftalikPlan, type IcerikTuru, type Karar, type Kisi } from "../../veri";
import { haftalikDuzenler, kararVerebilir } from "../../yetki";
import { IkonDugme } from "../nextday/Bolumler";
import { FormAlt, MuhabirSecici } from "../nextday/Formlar";
import { YzKisalt } from "../../bilesenler/YzKisalt";

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
    paketBasligi: mevcut?.paketBasligi ?? "",
    muhabirler: mevcut?.muhabirler ?? ilk?.muhabirler ?? ([] as string[]),
    muhabirTbc: !!mevcut?.muhabirTbc,
    kararNotu: mevcut?.kararNotu ?? "",
    ekTalep: mevcut?.ekTalep ?? "",
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
      <YzKisalt metin={f.metin} degistir={(m) => setF((x) => ({ ...x, metin: m }))} />
      {/* Strap yalnız paketi olan kalemde: çıktıda "PKG" altında "YER / strap / muhabir". */}
      {f.bicimler.some((b) => b !== "canli") && (
        <label>
          {t("onerilenPaketBasligi")} <span className="ipucu">{t("varsa")}</span>
          <input {...icerikAlani} value={f.paketBasligi} onChange={(e) => setF({ ...f, paketBasligi: e.target.value })} data-kalem-strap />
        </label>
      )}
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
          <MuhabirSecici deger="" degistir={(id) => id && !f.muhabirler.includes(id) && setF({ ...f, muhabirler: [...f.muhabirler, id], muhabirTbc: false })} bosEtiket={t("muhabirEkle")} />
          {!f.muhabirler.length && <TbcKutusu secili={f.muhabirTbc} degistir={(x) => setF({ ...f, muhabirTbc: x })} />}
        </div>
      </div>
      <label>
        {t("kalemNotu")}
        <AnmaGirdisi deger={f.not} degistir={(x) => setF({ ...f, not: x })} />
      </label>
      {/* Toplantının söyledikleri: hazırlıkta yok, toplantıda ya da önceden yazılmışsa var. */}
      {(hafta.durum === "toplantida" || f.kararNotu || f.ekTalep) && (
        <>
          <label>
            {t("kararNotu")}
            <AnmaGirdisi cokSatir rows={2} deger={f.kararNotu} degistir={(x) => setF({ ...f, kararNotu: x })} data-karar-notu />
          </label>
          <label>
            {t("ekTalep")}
            <AnmaGirdisi cokSatir rows={2} deger={f.ekTalep} degistir={(x) => setF({ ...f, ekTalep: x })} data-ek-talep />
          </label>
        </>
      )}
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
  const [notFormu, setNotFormu] = useState(false);
  const duzenler = haftalikDuzenler(ben, hafta);
  const karar = kararVerebilir(ben, hafta) && gundemde(kalem);
  const plan = planBul(v, kalem.aktarim?.planId);
  const paket = paketBul(v, kalem.aktarim?.paketId);
  const dosya = baslikBul(v, kalem.baslikId);
  const oneri = oneriBul(v, kalem.oneriId);
  if (duzenle) return <KalemFormu ben={ben} hafta={hafta} mevcut={kalem} kapat={() => setDuzenle(false)} />;
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
            {kalem.yer && <b>{kalem.yer} / </b>}
            {kalem.metin}
          </Icerik>
          {/* Paket önerisi Next Day'deki gibi: "YER / strap / muhabir". */}
          {kalemPaketli(kalem) && (
            <div data-kalem-pkg>
              <Icerik blok className="kalem-satiri">
                <b>PKG · </b>
                {satir(kalem.yer || sehirAr(kisiBul(v, kalem.muhabirler[0])?.sehir), kalem.paketBasligi, muhabirYeri(kalem.muhabirler.map((id) => kisiAr(kisiBul(v, id))), kalem.muhabirTbc))}
              </Icerik>
            </div>
          )}
          {!kalemPaketli(kalem) && !kalem.muhabirler.length && kalem.muhabirTbc && (
            <small>
              <Rozet ton="uyari" title={t("tbcAdi")}>
                {TBC}
              </Rozet>
            </small>
          )}
          {!kalemPaketli(kalem) && kalem.muhabirler.length > 0 && (
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
          {/* Konu (olayın adı) belgedeki gibi altta, Next Day'in paket satırı gibi. */}
          {kalem.baslik && (
            <Icerik blok className="kalem-satiri">
              {kalem.yer && <b>{kalem.yer} / </b>}
              {kalem.baslik}
            </Icerik>
          )}
          <small>
            <TurRozeti tur={kalem.tur} />
            {bicimSatiri(kalem) && <bdi dir="ltr">{bicimSatiri(kalem)}</bdi>}
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
          <KararNotlari kalem={kalem} />
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
          {karar && !notFormu && (
            <button className="dugme dugme-sade dugme-kucuk" onClick={() => setNotFormu(true)} data-karar-notu-ac>
              <MessageSquarePlus size={14} /> {t("kararNotuEkTalep")}
            </button>
          )}
        </div>
      )}
      {notFormu && <KararNotuFormu ben={ben} hafta={hafta} kalem={kalem} kapat={() => setNotFormu(false)} />}
    </div>
  );
}

/* Toplantının karar notu ve ek talebi; kartta, kalemin altında. */
export function KararNotlari({ kalem }: { kalem: Pick<HaftalikKalem, "kararNotu" | "ekTalep"> }) {
  const { t } = useDil();
  if (!kalem.kararNotu && !kalem.ekTalep) return null;
  return (
    <div className="karar-notlari" data-karar-notlari>
      {kalem.kararNotu && (
        <p>
          <b>{t("kararNotu")}:</b> <span dir="auto">{kalem.kararNotu}</span>
        </p>
      )}
      {kalem.ekTalep && (
        <p>
          <b>{t("ekTalep")}:</b> <span dir="auto">{kalem.ekTalep}</span>
        </p>
      )}
    </div>
  );
}

/* Toplantıda karar verilirken hızlı not: kalemin bütün formunu açmadan. */
function KararNotuFormu({ ben, hafta, kalem, kapat }: { ben: Kisi; hafta: HaftalikPlan; kalem: HaftalikKalem; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({ kararNotu: kalem.kararNotu ?? "", ekTalep: kalem.ekTalep ?? "" });
  return (
    <div className="form form-kutu ara-ust" data-karar-notu-formu>
      <label>
        {t("kararNotu")}
        <AnmaGirdisi cokSatir rows={2} deger={f.kararNotu} degistir={(x) => setF({ ...f, kararNotu: x })} data-karar-notu />
      </label>
      <label>
        {t("ekTalep")}
        <AnmaGirdisi cokSatir rows={2} deger={f.ekTalep} degistir={(x) => setF({ ...f, ekTalep: x })} data-ek-talep />
      </label>
      <FormAlt kapat={kapat} kaydet={() => kalemKararNotu(ben, hafta.id, kalem.id, f) && (bildir(t("bKaydedildi")), kapat())} />
    </div>
  );
}
