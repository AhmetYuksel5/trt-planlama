import { useState } from "react";
import { Pencere, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { BIRIM_ADI, bolgeAdi, faaliyetDurumAdi, faaliyetTuruAdi, hatirlatmaAdi, oncelikAdi, potansiyelAdi, tekrarAdi, ulkeAdi } from "../../etiketler";
import { faaliyetKaydet } from "../../eylemler";
import { girdidenIso, yerelGirdi, zaman } from "../../tarih";
import {
  BIRIMLER,
  BOLGELER,
  FAALIYET_DURUMLARI,
  FAALIYET_TURLERI,
  HATIRLATMA_SURELERI,
  ONCELIKLER,
  POTANSIYELLER,
  TEKRAR_SIKLIKLARI,
  ULKELER,
  type Birim,
  type Bolge,
  type Faaliyet,
  type FaaliyetDurum,
  type FaaliyetTuru,
  type HatirlatmaSuresi,
  type Kisi,
  type Oncelik,
  type Potansiyel,
  type TekrarSikligi,
  type Ulke,
} from "../../veri";
import { MuhabirSecici } from "../nextday/Formlar";
import { arapcaIpucu } from "./ortak";

/**
 * Faaliyet formu. Az tıklama için önce temel alanlar (ad, tarih, tür,
 * öncelik, yer); gerisi "Diğer alanlar" altında. Güne basılarak
 * açıldıysa tarih dolu geliyor.
 */
export function FaaliyetFormu({ ben, mevcut, tarih, kapat, kaydedildi }: { ben: Kisi; mevcut?: Faaliyet; tarih?: string; kapat: () => void; kaydedildi?: (id: string) => void }) {
  const { t, dil } = useDil();
  const h = mevcut?.hatirlatma;
  const [f, setF] = useState({
    baslik: mevcut?.baslik ?? "",
    baslangic: mevcut?.baslangic ?? tarih ?? "",
    bitis: mevcut?.bitis ?? tarih ?? "",
    saat: mevcut?.saat ?? "",
    bitisSaati: mevcut?.bitisSaati ?? "",
    tur: (mevcut?.tur ?? "toplanti") as FaaliyetTuru,
    oncelik: (mevcut?.oncelik ?? "normal") as Oncelik,
    ulke: (mevcut?.ulke ?? "") as Ulke | "",
    sehir: mevcut?.sehir ?? "",
    bolge: (mevcut?.bolge ?? "") as Bolge | "",
    potansiyel: (mevcut?.potansiyel ?? "oneri") as Potansiyel,
    birim: (mevcut?.birim ?? "") as Birim | "",
    muhabirId: mevcut?.muhabirId ?? "",
    notlar: mevcut?.notlar ?? "",
    hatirlatma: (h ? ("zaman" in h ? "ozel" : h.once) : "") as HatirlatmaSuresi | "ozel" | "",
    hatirlatmaZamani: h && "zaman" in h ? yerelGirdi(h.zaman) : "",
    tekrar: (mevcut?.tekrar?.siklik ?? "") as TekrarSikligi | "",
    tekrarBitis: mevcut?.tekrar?.bitis ?? "",
    durum: (mevcut?.durum ?? "takipte") as FaaliyetDurum,
  });
  const [hata, setHata] = useState(false);
  const ayarla = <K extends keyof typeof f>(k: K, deger: (typeof f)[K]) => setF((x) => ({ ...x, [k]: deger }));
  /* Bölge seçilmemişse ülkeden geliyor; ülke değişince eski otomatik bölge kalmasın diye boş bırakılıyor. */
  const kaydet = () => {
    const ozel = f.hatirlatma === "ozel" ? girdidenIso(f.hatirlatmaZamani) : undefined;
    const id = faaliyetKaydet(ben, {
      id: mevcut?.id,
      baslik: f.baslik,
      baslangic: f.baslangic,
      bitis: f.bitis || f.baslangic,
      saat: f.saat,
      bitisSaati: f.bitisSaati,
      tur: f.tur,
      oncelik: f.oncelik,
      potansiyel: f.potansiyel,
      ulke: f.ulke || undefined,
      bolge: f.bolge || undefined,
      sehir: f.sehir,
      birim: f.birim || undefined,
      muhabirId: f.muhabirId,
      notlar: f.notlar,
      hatirlatma: f.hatirlatma === "ozel" ? (ozel ? { zaman: ozel } : undefined) : f.hatirlatma ? { once: f.hatirlatma } : undefined,
      tekrar: f.tekrar ? { siklik: f.tekrar, bitis: f.tekrarBitis || undefined } : undefined,
      durum: f.durum,
    });
    if (!id) {
      setHata(true);
      return;
    }
    bildir(t("faaliyetKaydedildi"));
    kaydedildi?.(id);
    kapat();
  };
  const devre = !f.baslik.trim() || !f.baslangic;
  return (
    <Pencere
      baslik={mevcut ? t("duzenle") : t("yeniFaaliyet")}
      kapat={kapat}
      altBilgi={
        <>
          <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme" onClick={kaydet} disabled={devre}>
            {t("kaydet")}
          </button>
        </>
      }
    >
      <div className="form tk-form">
        <label>
          {t("faaliyetAdi")}
          <input {...icerikAlani} value={f.baslik} onChange={(e) => ayarla("baslik", e.target.value)} placeholder={arapcaIpucu("faaliyetIpucu")} autoFocus />
        </label>
        <div className="satir">
          <label>
            {t("baslangic")}
            <input
              type="date"
              value={f.baslangic}
              onChange={(e) => {
                const b = e.target.value;
                setF((x) => ({ ...x, baslangic: b, bitis: !x.bitis || x.bitis < b ? b : x.bitis }));
              }}
            />
          </label>
          <label>
            {t("bitis")}
            <input type="date" value={f.bitis} min={f.baslangic} onChange={(e) => ayarla("bitis", e.target.value)} />
          </label>
          <label>
            {t("saat")} <span className="ipucu">{t("varsa")}</span>
            <input type="time" value={f.saat} onChange={(e) => ayarla("saat", e.target.value)} />
          </label>
        </div>
        <div className="satir">
          <label>
            {t("faaliyetTuru")}
            <select value={f.tur} onChange={(e) => ayarla("tur", e.target.value as FaaliyetTuru)}>
              {FAALIYET_TURLERI.map((x) => (
                <option key={x} value={x}>
                  {t(faaliyetTuruAdi(x))}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("ulke")}
            <select value={f.ulke} onChange={(e) => setF((x) => ({ ...x, ulke: e.target.value as Ulke | "", bolge: "" }))}>
              <option value="">{t("ulkesiz")}</option>
              {[...ULKELER]
                .sort((a, b) => t(ulkeAdi(a)).localeCompare(t(ulkeAdi(b)), dil))
                .map((u) => (
                  <option key={u} value={u}>
                    {t(ulkeAdi(u))}
                  </option>
                ))}
            </select>
          </label>
          <label>
            {t("sehir")}
            <input {...icerikAlani} value={f.sehir} onChange={(e) => ayarla("sehir", e.target.value)} placeholder={arapcaIpucu("sehirIpucu")} />
          </label>
        </div>
        <fieldset className="tk-oncelik-secici" aria-label={t("oncelik")}>
          <legend>{t("oncelik")}</legend>
          {ONCELIKLER.map((o) => (
            <label key={o} className={`on-${o}`}>
              <input type="radio" name="oncelik" value={o} checked={f.oncelik === o} onChange={() => ayarla("oncelik", o)} />
              {t(oncelikAdi(o))}
            </label>
          ))}
        </fieldset>
        <details className="tk-diger" open={!!mevcut}>
          <summary>{t("digerAlanlar")}</summary>
          <div className="form">
            <div className="satir">
              <label>
                {t("haberPotansiyeli")}
                <select value={f.potansiyel} onChange={(e) => ayarla("potansiyel", e.target.value as Potansiyel)}>
                  {POTANSIYELLER.map((p) => (
                    <option key={p} value={p}>
                      {t(potansiyelAdi(p))}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("durum")}
                <select value={f.durum} onChange={(e) => ayarla("durum", e.target.value as FaaliyetDurum)}>
                  {FAALIYET_DURUMLARI.map((d) => (
                    <option key={d} value={d}>
                      {t(faaliyetDurumAdi(d))}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("bolge")}
                <select value={f.bolge} onChange={(e) => ayarla("bolge", e.target.value as Bolge | "")}>
                  <option value="">{t("ulkeyeGore")}</option>
                  {BOLGELER.map((b) => (
                    <option key={b} value={b}>
                      {t(bolgeAdi(b))}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="satir">
              <label>
                {t("sorumluBirim")}
                <select value={f.birim} onChange={(e) => ayarla("birim", e.target.value as Birim | "")}>
                  <option value="">{t("yok")}</option>
                  {BIRIMLER.filter((b) => b !== "muhabir").map((b) => (
                    <option key={b} value={b}>
                      {t(BIRIM_ADI[b])}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("sorumluMuhabir")}
                <MuhabirSecici deger={f.muhabirId} degistir={(id) => ayarla("muhabirId", id)} bosEtiket={t("yok")} />
              </label>
              <label>
                {t("bitisSaati")}
                <input type="time" value={f.bitisSaati} onChange={(e) => ayarla("bitisSaati", e.target.value)} />
              </label>
            </div>
            <div className="satir">
              <label>
                {t("hatirlatma")}
                <select
                  value={f.hatirlatma}
                  onChange={(e) => {
                    const x = e.target.value as HatirlatmaSuresi | "ozel" | "";
                    /* Özel zaman boşsa başlangıcın bir gün öncesinden başlasın: ne yazılacağı belli olsun. */
                    setF((y) => ({ ...y, hatirlatma: x, hatirlatmaZamani: x === "ozel" && !y.hatirlatmaZamani && y.baslangic ? yerelGirdi(zaman(y.baslangic, "09:00")) : y.hatirlatmaZamani }));
                  }}
                >
                  <option value="">{t("yok")}</option>
                  {HATIRLATMA_SURELERI.map((x) => (
                    <option key={x} value={x}>
                      {t(hatirlatmaAdi(x))}
                    </option>
                  ))}
                  <option value="ozel">{t("ozelZaman")}</option>
                </select>
              </label>
              {f.hatirlatma === "ozel" && (
                <label>
                  {t("ozelZaman")}
                  <input type="datetime-local" value={f.hatirlatmaZamani} onChange={(e) => ayarla("hatirlatmaZamani", e.target.value)} />
                </label>
              )}
              <label>
                {t("tekrar")}
                <select value={f.tekrar} onChange={(e) => ayarla("tekrar", e.target.value as TekrarSikligi | "")}>
                  <option value="">{t("tekrarYok")}</option>
                  {TEKRAR_SIKLIKLARI.map((x) => (
                    <option key={x} value={x}>
                      {t(tekrarAdi(x))}
                    </option>
                  ))}
                </select>
              </label>
              {f.tekrar && (
                <label>
                  {t("tekrarBitis")} <span className="ipucu">{t("varsa")}</span>
                  <input type="date" value={f.tekrarBitis} min={f.baslangic} onChange={(e) => ayarla("tekrarBitis", e.target.value)} />
                </label>
              )}
            </div>
            <label>
              {t("notlar")}
              <textarea dir="auto" rows={3} value={f.notlar} onChange={(e) => ayarla("notlar", e.target.value)} />
            </label>
          </div>
        </details>
        {hata && <p className="kotu-yazi">{t("faaliyetHata")}</p>}
      </div>
    </Pencere>
  );
}
