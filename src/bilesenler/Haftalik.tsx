import { Ban, ClipboardCheck, MessageSquare } from "lucide-react";
import { useState } from "react";
import { aralikYaz, gunAdi, saatYaz, tarihYaz, useDil } from "../dil";
import { BICIM_KODU, KARAR_ADI, KARAR_TONU } from "../etiketler";
import { onIncelemeGorusu, onIncelemeReddet } from "../eylemler";
import { haftaSonu, kabulMu, kalemAdi, onIncelemeBekleyenler, teslimGunuSorulur } from "../haftalik";
import { yerelGun } from "../tarih";
import { kolSahibi } from "../akis";
import { birimAdiDilde } from "../yapi";
import { MASA_KOLLARI, kisiBul, useVeri, type BirimId, type Durum, type HaftalikKalem, type Kisi } from "../veri";
import { yapabilir } from "../yetki";
import { Avatar, Bos, Icerik, Kart, Rozet, TurRozeti, bildir } from "./Parcalar";

/*
 * Haftalık planın birden çok ekranda görünen parçaları: kalemin kararı,
 * kısa kalem listesi (Program ve Ekonomi ana sayfaları) ve ön inceleme
 * kartı (yönetici paneli, Ekonomi ana sayfası).
 */

export function KararRozeti({ kalem }: { kalem: HaftalikKalem }) {
  const { t } = useDil();
  if (kalem.onInceleme?.durum === "reddedildi") return <Rozet ton="kotu">{t("onIncelemedeReddedildi")}</Rozet>;
  if (kalem.karar === "bekliyor" && kalem.onInceleme) return <Rozet ton="uyari">{t("onIncelemede")}</Rozet>;
  return <Rozet ton={KARAR_TONU[kalem.karar]}>{t(KARAR_ADI[kalem.karar])}</Rozet>;
}

/*
 * "Stok ve programlar" kaleminin teslim günü (kullanıcı: stok ve feature zamana
 * bağlı olmayabilir ama teslim süresi mutlaka belirlenir). Paketi doğduysa
 * paketin günü (Stok sayfasında değişmiş olabilir). Kabul edilip günü
 * verilmemişse uyarı: kesinleşince paket teslim günsüz doğardı.
 */
// `kucuk`: listede kendi satırında (gözden geçirme), kartın küçük meta satırının içinde değil.
export function KalemTeslimGunu({ kalem, kucuk = false }: { kalem: HaftalikKalem; kucuk?: boolean }) {
  const { t, dil } = useDil();
  const v = useVeri();
  if (!teslimGunuSorulur(kalem) || kalem.karar === "bilgi" || kalem.karar === "ret") return null;
  const gun = (kalem.aktarim?.paketId && v.paketler.find((p) => p.id === kalem.aktarim!.paketId)?.sonTarih) || kalem.teslimGunu;
  if (!gun && !kabulMu(kalem)) return null;
  const icerik = gun ? (
    <span className="sonuk-yazi" data-kalem-teslim={gun}>
      {t("teslimGunu")}: <bdi>{tarihYaz(gun, dil, "kisa")}</bdi>
    </span>
  ) : (
    <span data-kalem-teslim="">
      <Rozet ton="uyari">{t("skTeslimYok")}</Rozet>
    </span>
  );
  return kucuk ? <small>{icerik}</small> : icerik;
}

/** Kalemin günü; günü yoksa Weekly'nin "Stok ve programlar" bölümünde (eski adı "Zamana bağlı olmayan dosya"). */
export function KalemGunu({ kalem }: { kalem: HaftalikKalem }) {
  const { t, dil } = useDil();
  return <>{kalem.tarih ? `${gunAdi(kalem.tarih, dil)} ${tarihYaz(kalem.tarih, dil, "kisa")}` : t("stokVeProgramlar")}</>;
}

export const bicimSatiri = (k: HaftalikKalem) => kalanBicimler(k).map((b) => BICIM_KODU[b]).join(" + ");

/*
 * Paket önerisi olan kalem çıktıda Next Day'deki gibi "PKG" altında
 * "YER / strap / muhabir" satırıyla yazılıyor; o paketin biçimi biçim
 * satırında tekrar yazılmıyor, öbürleri (LIVE…) kalıyor.
 */
// Paketsiz takipte paket istenmiyor: strap ve PKG satırı yazılmaz, haber gelişme olarak kalır.
export const kalemPaketli = (k: HaftalikKalem) => !!k.paketBasligi && k.karar !== "bilgi" && k.bicimler.some((b) => b !== "canli");
/* Kurumun terimi: kabul edilmemiş (bekleyen, şartlı, bilgi) paket "PKG PROPOSAL", Next Day'deki gibi (kullanıcı). */
export const kalemPkgEtiketi = (k: HaftalikKalem) => (k.karar === "kabul" ? "PKG" : "PKG PROPOSAL");

/*
 * Kalemin masası (kullanıcı: Ekonomi'ye önerilen öneri gündeme girince plan
 * metninde o birimin adı görünsün; başka masa için de): kalemin kolu masa
 * koluysa kolun sahibi, önerisi bir masaya sorulup "Uygundur" dendiyse o masa.
 */
export const kalemMasalari = (k: HaftalikKalem, d: Pick<Durum, "masaSorulari">): BirimId[] => {
  const m = new Set<BirimId>();
  if (MASA_KOLLARI.includes(k.tur)) m.add(kolSahibi(k.tur));
  if (k.oneriId) for (const s of d.masaSorulari ?? []) if (s.oneriId === k.oneriId && s.cevap?.kabul) m.add(s.birim);
  return [...m];
};
/* Plan metninde her arayüz dilinde Arapça (çıktının dili). */
export const kalemMasaEtiketi = (k: HaftalikKalem, d: Pick<Durum, "masaSorulari">) => kalemMasalari(k, d).map((b) => birimAdiDilde(b, "ar")).join(" · ");

const kalanBicimler = (k: HaftalikKalem) => {
  if (!kalemPaketli(k)) return k.bicimler;
  const i = k.bicimler.findIndex((b) => b !== "canli");
  return k.bicimler.filter((_, j) => j !== i);
};

export function KalemListesi({ kalemler }: { kalemler: HaftalikKalem[] }) {
  const { t } = useDil();
  if (!kalemler.length) return <Bos kucuk metin={t("kayitYok")} />;
  return (
    <ul className="liste">
      {kalemler.map((k) => (
        <li key={k.id}>
          <div className="ad">
            <b>
              <Icerik blok>{kalemAdi(k)}</Icerik>
            </b>
            <small>
              <KalemGunu kalem={k} />
            </small>
          </div>
          <TurRozeti tur={k.tur} />
          <KararRozeti kalem={k} />
        </li>
      ))}
    </ul>
  );
}

/** Ön incelemede yazılan görüşler: kim, ne zaman; metin yazıldığı dilde. */
export function Gorusler({ kalem, d }: { kalem: HaftalikKalem; d: Durum }) {
  const { ad, dil, t } = useDil();
  const oi = kalem.onInceleme;
  if (!oi) return null;
  return (
    <>
      {oi.gorusler.map((g, i) => (
        <div key={i} className="gorus">
          <Avatar kisi={kisiBul(d, g.kisiId)} boy="kucuk" />
          <div>
            <small>
              <b>{ad(kisiBul(d, g.kisiId))}</b> · {tarihYaz(yerelGun(g.zaman), dil, "kisa")} {saatYaz(g.zaman, dil)}
            </small>
            <p dir="auto">{g.metin}</p>
          </div>
        </div>
      ))}
      {oi.durum === "reddedildi" && (
        <div className="gorus gorus-ret">
          <Avatar kisi={kisiBul(d, oi.reddeden)} boy="kucuk" />
          <div>
            <small>
              <b>{ad(kisiBul(d, oi.reddeden))}</b> · {t("onIncelemedeReddetti")}
            </small>
            <p dir="auto">{oi.gerekce}</p>
          </div>
        </div>
      )}
    </>
  );
}

function IncelemeSatiri({ ben, haftaId, kalem }: { ben: Kisi; haftaId: string; kalem: HaftalikKalem }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [form, setForm] = useState<"" | "gorus" | "ret">("");
  const [metin, setMetin] = useState("");
  const muhabir = kisiBul(v, kalem.muhabirler[0]);
  const yazdim = kalem.onInceleme?.gorusler.some((g) => g.kisiId === ben.id);
  const gonder = () => {
    const ok = form === "gorus" ? onIncelemeGorusu(ben, haftaId, kalem.id, metin) : onIncelemeReddet(ben, haftaId, kalem.id, metin);
    if (ok) {
      bildir(t(form === "gorus" ? "bGorusYazildi" : "bOnIncelemeRet"));
      setForm("");
      setMetin("");
    }
  };
  return (
    <div className="kayit">
      <div className="kayit-bas">
        <Avatar kisi={muhabir} boy="kucuk" />
        <div>
          <b>
            <Icerik blok>{kalemAdi(kalem)}</Icerik>
          </b>
          {kalem.baslik && (
            <Icerik blok className="kayit-metin">
              {kalem.metin}
            </Icerik>
          )}
          <small>
            <TurRozeti tur={kalem.tur} />
            {muhabir && <span>{ad(muhabir)}</span>}
            {kalem.bicimler.length > 0 && <bdi>· {bicimSatiri(kalem)}</bdi>}
            {yazdim && <Rozet ton="iyi">{t("gorusYazildi")}</Rozet>}
          </small>
        </div>
      </div>
      <Gorusler kalem={kalem} d={v} />
      {form ? (
        <div className="form form-kutu ara-ust">
          <label>
            {t(form === "gorus" ? "gorusun" : "retGerekcesi")}
            <textarea dir="auto" rows={2} value={metin} onChange={(e) => setMetin(e.target.value)} autoFocus />
          </label>
          <div className="form-alt">
            <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setForm("")}>
              {t("iptal")}
            </button>
            <button className={`dugme dugme-kucuk ${form === "ret" ? "dugme-kotu" : ""}`} onClick={gonder} disabled={!metin.trim()}>
              {t(form === "gorus" ? "gorusGonder" : "reddet")}
            </button>
          </div>
        </div>
      ) : (
        <div className="dugmeler ara-ust">
          <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setForm("gorus")}>
            <MessageSquare size={14} /> {t("gorusYaz")}
          </button>
          <button className="dugme dugme-kotu dugme-kucuk" onClick={() => setForm("ret")}>
            <Ban size={14} /> {t("reddet")}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Ön inceleme bekleyen öneriler: toplantıdan önce kolun yöneticisinin
 * önünde. Görüş toplantıya not olarak gidiyor, ret öneriyi gündemden
 * düşürüyor; kabul kararı toplantıda.
 */
export function OnIncelemeKarti({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  if (!yapabilir(ben, "onInceleme")) return null;
  const liste = onIncelemeBekleyenler(v, ben);
  return (
    <Kart baslik={t("onIncelemeBekleyen")} ikon={<ClipboardCheck size={18} />} ek={liste.length ? String(liste.length) : undefined} className="on-inceleme-karti">
      {liste.length === 0 ? (
        <Bos kucuk metin={t("onIncelemeYok")} />
      ) : (
        liste.map(({ hafta, kalem }) => (
          <div key={kalem.id} className="ara-ust-2">
            <div className="alan-etiket">
              <a href={`#/haftalik/${hafta.id}`}>
                {t("haftalik")} · {aralikYaz(hafta.baslangic, haftaSonu(hafta.baslangic), dil)}
              </a>
            </div>
            <IncelemeSatiri ben={ben} haftaId={hafta.id} kalem={kalem} />
          </div>
        ))
      )}
    </Kart>
  );
}
