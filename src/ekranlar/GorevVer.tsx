import { ClipboardList, Users, X } from "lucide-react";
import { useState } from "react";
import { Kart, Rozet, bildir } from "../bilesenler/Parcalar";
import { tarihYaz, useDil } from "../dil";
import { IS_DURUM_ADI } from "../etiketler";
import { isKaydet } from "../eylemler";
import { isListesi } from "../gorevler";
import { bugun } from "../tarih";
import { kimlik, useVeri, type BirimId, type Kisi } from "../veri";
import { birimAdi } from "../yapi";
import { isAlabilir, isVerilebilecekBirimler } from "../yetki";
import { FormAlt } from "./nextday/Formlar";

/*
 * Yöneticinin görev vermesi (panelde "Talimat ver" › Görev): iş bir ekibe
 * (birim), bir kişiye ya da birkaç kişiye. Ekibe verilen işi ekibin herkesi
 * görüyor, sonradan katılan da (gorevler.ts → isKisinin). Kayıt aynı iş
 * taksimi kaydı (Durum.isler); Planlama'da Görevler sayfasında, öbür
 * birimlerde ana sayfadaki "Bana verilen işler" kartında görünüyor.
 */
export function GorevVerFormu({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [birimler, setBirimler] = useState<BirimId[]>([]);
  const [kisiler, setKisiler] = useState<string[]>([]);
  const [sonTarih, setSonTarih] = useState("");
  const ekipler = isVerilebilecekBirimler(ben);
  const adaylar = v.kisiler.filter((k) => isAlabilir(ben, k) && !kisiler.includes(k.id));
  // Kişi seçimi birim birim; seçenekler ekip sırasıyla.
  const gruplar = [...new Set(adaylar.map((k) => k.birim as BirimId))];
  const gecerli = !!baslik.trim() && (birimler.length > 0 || kisiler.length > 0);
  const kaydet = () => {
    if (isKaydet(ben, { id: kimlik("is"), baslik, aciklama, etiketler: [], kisiler, birimler, sonTarih: sonTarih || undefined })) {
      bildir(t("bGorevVerildi"));
      kapat();
    }
  };
  return (
    <div className="form" data-gorev-ver>
      <label>
        {t("gvIsBasligi")}
        <input dir="auto" value={baslik} onChange={(e) => setBaslik(e.target.value)} data-gorev-ver-baslik />
      </label>
      <label>
        {t("gvAciklama")}
        <textarea dir="auto" rows={3} value={aciklama} onChange={(e) => setAciklama(e.target.value)} data-gorev-ver-aciklama />
      </label>
      {ekipler.length > 0 && (
        <div>
          <div className="alan-etiket">{t("gvEkip")}</div>
          <div className="cipler">
            {ekipler.map((b) => (
              <button
                key={b}
                type="button"
                className={`cip cip-dugme${birimler.includes(b) ? " secili" : ""}`}
                aria-pressed={birimler.includes(b)}
                onClick={() => setBirimler(birimler.includes(b) ? birimler.filter((x) => x !== b) : [...birimler, b])}
                data-gorev-ver-ekip={b}
              >
                <Users size={13} /> {birimAdi(b)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <div className="alan-etiket">{t("gvKisiler")}</div>
        {kisiler.length > 0 && (
          <div className="cipler ara-alt-2">
            {kisiler.map((id) => (
              <span key={id} className="cip">
                {ad(v.kisiler.find((k) => k.id === id))}
                <button type="button" onClick={() => setKisiler(kisiler.filter((x) => x !== id))} aria-label={t("cikar")} title={t("cikar")}>
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}
        <select value="" onChange={(e) => e.target.value && setKisiler([...kisiler, e.target.value])} aria-label={t("gvKisiEkle")} data-gorev-ver-kisi>
          <option value="">+ {t("gvKisiEkle")}</option>
          {gruplar.map((b) => (
            <optgroup key={b} label={birimAdi(b)}>
              {adaylar
                .filter((k) => k.birim === b)
                .map((k) => (
                  <option key={k.id} value={k.id}>
                    {ad(k)}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>
      <label>
        {t("gvSonTarih")}
        <input type="date" min={bugun()} value={sonTarih} onChange={(e) => setSonTarih(e.target.value)} data-gorev-ver-son />
      </label>
      <FormAlt kapat={kapat} kaydet={kaydet} devre={!gecerli} kaydetMetni={t("gvGorevVer")} />
    </div>
  );
}

/** Panelde yöneticinin verdiği görevler: kime, ne durumda. */
export function VerdigimGorevler({ ben }: { ben: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const liste = isListesi(v)
    .filter((x) => x.olusturan === ben.id)
    .sort((a, b) => Number(a.durum === "bitti") - Number(b.durum === "bitti") || b.zaman.localeCompare(a.zaman));
  if (!liste.length) return null;
  return (
    <Kart baslik={t("gvVerdigimGorevler")} ikon={<ClipboardList size={18} />}>
      <ul className="liste is-listesi" data-verdigim-gorevler>
        {liste.map((x) => (
          <li key={x.id} data-verdigim={x.id} className={x.durum === "bitti" ? "soluk" : ""}>
            <div className="ad">
              <b dir="auto">{x.baslik}</b>
              <div className="cipler ara-ust">
                {x.birimler?.map((b) => (
                  <span key={b} className="cip cip-kucuk cip-vurgu">
                    <Users size={12} /> {birimAdi(b)}
                  </span>
                ))}
                {x.kisiler.map((id) => (
                  <span key={id} className="cip cip-kucuk">
                    {ad(v.kisiler.find((k) => k.id === id))}
                  </span>
                ))}
                {x.sonTarih && <Rozet ton={x.durum !== "bitti" && x.sonTarih < bugun() ? "kotu" : undefined}>{tarihYaz(x.sonTarih, dil, "kisa")}</Rozet>}
              </div>
            </div>
            <Rozet ton={x.durum === "bitti" ? "iyi" : undefined}>{t(IS_DURUM_ADI[x.durum])}</Rozet>
          </li>
        ))}
      </ul>
    </Kart>
  );
}
