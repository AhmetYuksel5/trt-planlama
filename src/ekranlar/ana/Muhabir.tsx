import { ArrowRight, Bell, CheckCircle, CirclePlay, Clock, Lightbulb, Megaphone, Newspaper, Plane, Send } from "lucide-react";
import { adimAdi, geciktiMi, paketSahibi, sonrakiAdim, type UretimAdimi } from "../../akis";
import { HareketAkisi } from "../../bilesenler/Hareket";
import { AsamaCubugu, Bos, Icerik, Kart, NotKutu, OncelikRozeti, PaketDurumRozeti, Rozet, Sayac, Tumu, oncelikliOnce } from "../../bilesenler/Parcalar";
import { OneriDurumRozeti } from "../../bilesenler/Tablolar";
import { aralikYaz, saatYaz, tarihYaz, useDil } from "../../dil";
import { BIRIM_ADI, GOREVLENDIRME_DURUM_ADI, HAREKET_TURU_ADI, sehirAdi } from "../../etiketler";
import { bugun, gunEkle, yerelGun } from "../../tarih";
import { acikCagri, useVeri, type Kisi } from "../../veri";
import { adimYapabilir, bildirimMi, gorevlendirmeGorebilir, oneriGorebilir, paketGorebilir } from "../../yetki";
import { CalismaAlani, type Alan } from "./Calisma";
import { SayfaBasi } from "./Planlama";

/**
 * Muhabirin masası.
 *
 * Muhabir sisteme yalnız kendi işleri için giriyor: açık öneri çağrısı,
 * gönderdiği önerilerin durumu, kendisine düşen paketlerin hangi aşamada
 * ve kimde beklediği, sırası gelen işler (metin, video) ve
 * görevlendirmeleri. Başka muhabirin kaydı burada da aramada da yok.
 */
export default function MuhabirAna({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  return (
    <>
      <SayfaBasi
        ikon={<Newspaper size={26} />}
        baslik={t("merhaba", { ad: ad(ben).split(" ")[0] })}
        alt={`${t("biMuhabir")} · ${t(sehirAdi(ben.sehir))}`}
        sagUc={
          <a className="dugme" href="#/oneriler/yeni">
            <Send size={16} className="yon" /> {t("yeniOneriGonder")}
          </a>
        }
      />
      <CalismaAlani ben={ben} duzen="muhabir" />
    </>
  );
}

/* Muhabirin alanları yalnız kendi işi: başka muhabirin kaydı burada da yok. */
function useMuhabirIsleri(ben: Kisi) {
  const v = useVeri();
  const B = bugun();
  const paketler = v.paketler.filter((p) => paketGorebilir(ben, p, v)).sort((a, b) => b.guncelleme.localeCompare(a.guncelleme));
  const oneriler = v.oneriler.filter((o) => oneriGorebilir(ben, o)).sort((a, b) => b.zaman.localeCompare(a.zaman));
  return {
    v,
    paketler,
    oneriler,
    siram: paketler.filter((p) => adimYapabilir(ben, p)),
    aktif: paketler.filter((p) => p.durum !== "tamamlandi" && p.durum !== "iptal"),
    gorevler: v.gorevlendirmeler.filter((g) => gorevlendirmeGorebilir(ben, g) && g.bitis >= B),
    cagri: acikCagri(v, "nextday", B),
    haftalikCagri: acikCagri(v, "haftalik", B),
    bildirimler: v.hareketler.filter((h) => bildirimMi(ben, h, v)).slice(0, 6),
  };
}

function Cagrilar({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const { cagri, haftalikCagri } = useMuhabirIsleri(ben);
  if (!cagri && !haftalikCagri) return null;
  return (
    <div className="iz">
      {cagri && (
        <NotKutu ton="vurgu" ikon={<Megaphone size={18} />}>
          <b>{t("acikCagri", { tarih: tarihYaz(cagri.tarih, dil, "uzun") })}</b>
          <br />
          {t("acikCagriAciklama", { saat: cagri.sonSaat })}{" "}
          <a href="#/oneriler/yeni">
            <b>{t("oneriGonder")} →</b>
          </a>
        </NotKutu>
      )}
      {haftalikCagri && (
        <NotKutu ton="vurgu" ikon={<Megaphone size={18} />}>
          <b>{t("acikHaftalikCagri", { aralik: aralikYaz(haftalikCagri.tarih, gunEkle(haftalikCagri.tarih, 6), dil) })}</b>
          <br />
          {t("acikHaftalikCagriAciklama")}{" "}
          <a href="#/oneriler/yeni/haftalik">
            <b>{t("oneriGonder")} →</b>
          </a>
        </NotKutu>
      )}
    </div>
  );
}

function Sayaclar({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { oneriler, aktif, siram } = useMuhabirIsleri(ben);
  return (
    <div className="sayaclar">
        <Sayac href="#/oneriler" ikon={<Lightbulb size={22} />} renk="renk-nextday" etiket={t("sOnerilerim")} deger={oneriler.filter((o) => o.durum === "yeni" || o.durum === "degerlendiriliyor").length} alt={t("sDegerlendirmede")} />
        <Sayac href="#/oneriler" ikon={<CheckCircle size={22} />} ton="iyi" etiket={t("sPlanaGiren")} deger={oneriler.filter((o) => o.durum === "planaEklendi").length} alt={t("sToplam")} />
        <Sayac href="#/paketler" ikon={<CirclePlay size={22} />} renk="renk-nextday" etiket={t("sDevamEden")} deger={aktif.length} alt={t("sPaket")} />
        <Sayac href="#/paketler" ikon={<Clock size={22} />} ton={siram.length ? "uyari" : ""} etiket={t("seninSiran")} deger={siram.length} alt={t("sBekleyenIs")} />
      </div>
  );
}

function Siram({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const { siram } = useMuhabirIsleri(ben);
  return (
    <Kart baslik={t("seninSiran")} ikon={<Clock size={18} />}>
            {siram.length === 0 ? (
              <Bos kucuk metin={t("siraBos")} />
            ) : (
              <ul className="liste">
                {[...siram].sort(oncelikliOnce).map((p) => (
                  <li key={p.id}>
                    <div className="ad">
                      <a href={`#/paketler/${p.id}`}>
                        <Icerik blok>{p.baslik}</Icerik>
                      </a>
                      <small>
                        {t(adimAdi(p.adim as UretimAdimi, p))}
                        {p.teslim && ` · ${t("teslim")} ${saatYaz(p.teslim, dil)}`}
                      </small>
                    </div>
                    {p.oncelikli && <OncelikRozeti />}
                    {geciktiMi(p) && <Rozet ton="kotu">{t("gecikti")}</Rozet>}
                    <a className="dugme dugme-kucuk" href={`#/paketler/${p.id}`}>
                      {t(p.adim === "metin" ? "metniGonder" : "videoyuGonder")} <ArrowRight size={14} className="yon" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Kart>
  );
}

function Haberlerim({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { paketler } = useMuhabirIsleri(ben);
  return (
    <Kart baslik={t("haberlerim")} ikon={<Newspaper size={18} />} sagUc={<Tumu href="#/paketler" />}>
            {paketler.length === 0 ? (
              <Bos metin={t("paketimYok")} />
            ) : (
              <ul className="liste">
                {paketler.slice(0, 8).map((p) => {
                  const sahip = paketSahibi(p);
                  const sonraki = p.durum === "uretimde" ? sonrakiAdim(p) : null;
                  return (
                    <li key={p.id}>
                      <div className="ad">
                        <a href={`#/paketler/${p.id}`}>
                          <Icerik blok>{p.baslik}</Icerik>
                        </a>
                        <small>
                          {sahip ? t("simdiKimdeKisa", { birim: t(BIRIM_ADI[sahip]) }) : t("pdTamamlandi")}
                          {sonraki && sonraki !== "tamam" && ` · ${t("siradaKisa", { adim: t(adimAdi(sonraki, p)) })}`}
                        </small>
                      </div>
                      {p.oncelikli && <OncelikRozeti />}
                      <AsamaCubugu paket={p} />
                      <PaketDurumRozeti paket={p} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Kart>
  );
}

function Onerilerim({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const { oneriler } = useMuhabirIsleri(ben);
  return (
    <Kart baslik={t("onerilerim")} ikon={<Lightbulb size={18} />} sagUc={<Tumu href="#/oneriler" />}>
            {oneriler.length === 0 ? (
              <Bos metin={t("oneriYok")} />
            ) : (
              <ul className="liste">
                {oneriler.slice(0, 6).map((o) => (
                  <li key={o.id}>
                    <div className="ad">
                      <a href={`#/oneriler/${o.id}`}>
                        <Icerik blok>{o.haberBasligi}</Icerik>
                      </a>
                      <small>
                        {tarihYaz(yerelGun(o.zaman), dil, "kisa")} {saatYaz(o.zaman, dil)}
                        {o.gerekce && ` · ${o.gerekce}`}
                      </small>
                    </div>
                    <OneriDurumRozeti oneri={o} />
                  </li>
                ))}
              </ul>
            )}
          </Kart>
  );
}

function Gorevlerim({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const { gorevler } = useMuhabirIsleri(ben);
  return (
    <Kart baslik={t("gorevlendirmelerim")} ikon={<Plane size={18} />}>
            {gorevler.length === 0 ? (
              <Bos kucuk metin={t("gorevlendirmeYok")} />
            ) : (
              <ul className="liste">
                {gorevler.map((g) => (
                  <li key={g.id}>
                    <div className="ad">
                      <b>
                        <Icerik blok>{g.yer}</Icerik>
                      </b>
                      <small>
                        {t(HAREKET_TURU_ADI[g.tur])} · {tarihYaz(g.baslangic, dil, "kisa")} – {tarihYaz(g.bitis, dil, "kisa")}
                      </small>
                    </div>
                    <Rozet ton={g.durum === "talep" ? "uyari" : "vurgu"}>{t(GOREVLENDIRME_DURUM_ADI[g.durum])}</Rozet>
                  </li>
                ))}
              </ul>
            )}
          </Kart>
  );
}

function Bildirimlerim({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { bildirimler, v } = useMuhabirIsleri(ben);
  return (
    <Kart baslik={t("bildirimler")} ikon={<Bell size={18} />}>
            {bildirimler.length === 0 ? <Bos kucuk metin={t("bildirimYok")} /> : <HareketAkisi hareketler={bildirimler} d={v} />}
          </Kart>
  );
}

export const MUHABIR_ALANLARI: Alan[] = [
  { id: "muCagri", ad: "alAcikCagrilar", genis: true, grup: "muhabir", sayfa: "muhabir", Bilesen: Cagrilar },
  { id: "muSayac", ad: "alOzetSayilar", genis: true, grup: "muhabir", sayfa: "muhabir", Bilesen: Sayaclar },
  { id: "muSiram", ad: "seninSiran", grup: "muhabir", sayfa: "muhabir", Bilesen: Siram },
  { id: "muGorev", ad: "gorevlendirmelerim", grup: "muhabir", sayfa: "muhabir", Bilesen: Gorevlerim },
  { id: "muHaberler", ad: "haberlerim", genis: true, grup: "muhabir", sayfa: "muhabir", Bilesen: Haberlerim },
  { id: "muBildirim", ad: "bildirimler", grup: "muhabir", sayfa: "muhabir", Bilesen: Bildirimlerim },
  { id: "muOneriler", ad: "onerilerim", grup: "muhabir", sayfa: "muhabir", Bilesen: Onerilerim },
];
