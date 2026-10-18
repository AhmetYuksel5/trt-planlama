import { birimAdi } from "../../yapi";
import { ArrowRight, Bell, CheckCircle, History, CirclePlay, Clock, Lightbulb, MailCheck, Megaphone, Newspaper, Plane, Send } from "lucide-react";
import { adimAdi, adimTuru, geciktiMi, gorunenSahip, sonrakiAdim, type UretimAdimi } from "../../akis";
import { HareketAkisi } from "../../bilesenler/Hareket";
import { AsamaCubugu, Bos, Icerik, Kart, NotKutu, OncelikRozeti, PaketDurumRozeti, Rozet, Sayac, Tumu, oncelikliOnce } from "../../bilesenler/Parcalar";
import { OneriDurumRozeti } from "../../bilesenler/Tablolar";
import { aralikYaz, saatYaz, tarihYaz, useDil } from "../../dil";
import { GOREVLENDIRME_DURUM_ADI, HAREKET_TURU_ADI, sehirAdi } from "../../etiketler";
import { bugun, gunEkle, yerelGun } from "../../tarih";
import { acikCagri, planBul, useVeri, type Kisi, type Oneri } from "../../veri";
import { ozelGorevleri } from "../../ozel";
import { oneriArsivde } from "../../oneriPlanlari";
import { OzelGorevSatirlari } from "../../bilesenler/OzelGorevler";
import { paketTamamla, takipTamamla } from "../../eylemler";
import { KararNotlari } from "../haftalik/Kalem";
import { adimYapabilir, bildirimMi, gorevlendirmeGorebilir, oneriGorebilir, paketGorebilir, paketTamamlayabilir } from "../../yetki";
import { CalismaAlani, type Alan } from "./Calisma";
import { MuhabirKilavuzu } from "./MuhabirKilavuzu";
import { SayfaBasi } from "./Planlama";
import { TamamlamaGeriAlDugmesi, tamamlandiBildir } from "../../bilesenler/TamamlamaGeriAl";

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
  // Önerilerim menüde (sayısıyla) ve sayaçta; başlıkta yalnız muhabirin asıl işi: yeni öneri.
  return (
    <>
      <SayfaBasi
        sekme={false}
        ikon={<Newspaper size={26} />}
        baslik={t("merhaba", { ad: ad(ben).split(" ")[0] })}
        alt={`${t("biMuhabir")} · ${sehirAdi(ben.sehir)}`}
        sagUc={
          <a className="dugme" href="#/oneriler/yeni" data-yeni-oneri>
            <Send size={16} className="yon" /> {t("yeniOneriGonder")}
          </a>
        }
      />
      <MuhabirKilavuzu />
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
  /*
   * Plana giren haber, onaylı paketi doğmadan da muhabirin işi. Planlama'nın
   * muhabir adına strap'siz girdiği öneri plana yalnız gelişme olarak giriyor,
   * paketi hiç olmuyor; PKG'li olanın paketi plan onaylanana dek
   * "değerlendiriliyor"da. "Senin sıran" yalnız paketlerden kurulunca muhabire
   * "plana eklendi" bildirimi gidiyor, işlerinde hiçbir şey çıkmıyordu.
   * Planın günü geçince ya da paketi onaylanınca (o zaman paket satırı) düşüyor;
   * takipteki haber kendi kartında. Kısıtlı muhabir planı okuyamıyor: gün öneride.
   */
  const planGunu = (o: Oneri) => planBul(v, o.planId)?.tarih ?? o.planTarihi ?? yerelGun(o.zaman);
  const plandaki = oneriler.filter(
    (o) =>
      o.muhabirId === ben.id &&
      o.durum === "planaEklendi" &&
      !o.takip &&
      planGunu(o) >= B &&
      !paketler.some((p) => (p.id === o.paketId || p.oneriId === o.id) && p.durum !== "taslak" && p.durum !== "degerlendiriliyor"),
  );
  return {
    v,
    paketler,
    oneriler,
    // Newsdesk yokken onaylı paketi muhabir kapatıyor: o da sırası gelen iş.
    siram: paketler.filter((p) => adimYapabilir(ben, p) || (p.muhabirId === ben.id && paketTamamlayabilir(ben, p, v))),
    aktif: paketler.filter((p) => p.durum !== "tamamlandi" && p.durum !== "iptal"),
    plandaki,
    planGunu,
    // Günü geçmiş öneri İşlerim'de değil, "Geçmiş önerilerim"de.
    guncelOneriler: oneriler.filter((o) => !oneriArsivde(o, B)),
    gorevler: v.gorevlendirmeler.filter((g) => gorevlendirmeGorebilir(ben, g) && g.bitis >= B),
    ozelGorevler: ozelGorevleri(v, ben.id),
    cagri: acikCagri(v, "nextday", B),
    haftalikCagri: acikCagri(v, "haftalik", B),
    bildirimler: v.hareketler.filter((h) => bildirimMi(ben, h, v)).slice(0, 6),
  };
}

function Cagrilar({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const { cagri, haftalikCagri } = useMuhabirIsleri(ben);
  if (!cagri && !haftalikCagri) return null;
  // İki çağrı alt alta iki kutuydu; tek kartta iki satır.
  return (
    <NotKutu ton="vurgu" ikon={<Megaphone size={18} />}>
      <div className="cagri-satirlari" data-cagrilar>
        {cagri && (
          <div>
            <b>{t("acikCagri", { tarih: tarihYaz(cagri.tarih, dil, "uzun") })}</b> · {t("acikCagriAciklama", { saat: cagri.sonSaat })}{" "}
            <a href="#/oneriler/yeni">
              <b>{t("oneriGonder")} →</b>
            </a>
          </div>
        )}
        {haftalikCagri && (
          <div>
            <b>{t("acikHaftalikCagri", { aralik: aralikYaz(haftalikCagri.tarih, gunEkle(haftalikCagri.tarih, 6), dil) })}</b>{" "}
            <a href="#/oneriler/yeni/haftalik">
              <b>{t("oneriGonder")} →</b>
            </a>
          </div>
        )}
      </div>
    </NotKutu>
  );
}

function Sayaclar({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { oneriler, guncelOneriler, aktif, siram, plandaki } = useMuhabirIsleri(ben);
  return (
    <div className="sayaclar ince">
        <Sayac href="#/oneriler" ikon={<Lightbulb size={22} />} renk="renk-nextday" etiket={t("sOnerilerim")} deger={guncelOneriler.filter((o) => o.durum === "yeni" || o.durum === "degerlendiriliyor").length} alt={t("sDegerlendirmede")} />
        <Sayac href="#/oneriler" ikon={<CheckCircle size={22} />} ton="iyi" etiket={t("sPlanaGiren")} deger={oneriler.filter((o) => o.durum === "planaEklendi").length} alt={t("sToplam")} />
        <Sayac href="#/paketler" ikon={<CirclePlay size={22} />} renk="renk-nextday" etiket={t("sDevamEden")} deger={aktif.length} alt={t("sPaket")} />
        <Sayac href="#/paketler" ikon={<Clock size={22} />} ton={siram.length + plandaki.length ? "uyari" : ""} etiket={t("seninSiran")} deger={siram.length + plandaki.length} alt={t("sBekleyenIs")} />
      </div>
  );
}

function Siram({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const { siram, plandaki, paketler, planGunu } = useMuhabirIsleri(ben);
  return (
    <Kart baslik={t("seninSiran")} ikon={<Clock size={18} />}>
            {siram.length + plandaki.length === 0 ? (
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
                        {p.durum === "onaylandi" ? t("muOnayliBekleniyor") : adimAdi(p.adim as UretimAdimi, p)}
                        {p.teslim && ` · ${t("teslim")} ${saatYaz(p.teslim, dil)}`}
                        {p.ozelId && ` · ${t("ozel")}${p.ozelAd ? `: ${p.ozelAd}` : ""}${p.sonTarih ? ` · ${t("oySonTarih")}: ${tarihYaz(p.sonTarih, dil, "kisa")}` : ""}`}
                      </small>
                      <KararNotlari kalem={p} />
                    </div>
                    {p.oncelikli && <OncelikRozeti />}
                    {geciktiMi(p) && <Rozet ton="kotu">{t("gecikti")}</Rozet>}
                    {p.durum === "onaylandi" ? (
                      <button type="button" className="dugme dugme-iyi dugme-kucuk" onClick={() => paketTamamla(ben, p.id) && tamamlandiBildir(ben, t("bPaketTamamlandi"), { paketId: p.id })} data-paket-tamamla={p.id}>
                        <CheckCircle size={14} /> {t("haberTamamlandi")}
                      </button>
                    ) : (
                      <a className="dugme dugme-kucuk" href={`#/paketler/${p.id}`}>
                        {t(adimTuru(p) === "metin" ? "metniGonder" : adimTuru(p) === "is" ? "tamamlaVeGec" : "videoyuGonder")} <ArrowRight size={14} className="yon" />
                      </a>
                    )}
                  </li>
                ))}
                {plandaki.map((o) => (
                  <li key={o.id} data-plandaki={o.id}>
                    <div className="ad">
                      <a href={`#/oneriler/${o.id}`}>
                        <Icerik blok>{o.paketBasligi || o.haberBasligi}</Icerik>
                      </a>
                      <small>
                        {t("muPlanda", { tarih: tarihYaz(planGunu(o), dil, "kisa") })}
                        {paketler.some((p) => p.id === o.paketId || p.oneriId === o.id) && ` · ${t("muPkgOnayBekliyor")}`}
                      </small>
                    </div>
                    <a className="dugme dugme-kucuk dugme-ikincil" href={`#/oneriler/${o.id}`}>
                      {t("ayrinti")} <ArrowRight size={14} className="yon" />
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
                  const sahip = gorunenSahip(p);
                  const sonraki = p.durum === "uretimde" ? sonrakiAdim(p) : null;
                  return (
                    <li key={p.id}>
                      <div className="ad">
                        <a href={`#/paketler/${p.id}`}>
                          <Icerik blok>{p.baslik}</Icerik>
                        </a>
                        <small>
                          {sahip ? t("simdiKimdeKisa", { birim: birimAdi(sahip) }) : t("pdTamamlandi")}
                          {sonraki && sonraki !== "tamam" && ` · ${t("siradaKisa", { adim: adimAdi(sonraki, p) })}`}
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
  const { guncelOneriler: hepsi } = useMuhabirIsleri(ben);
  // Düzeltme istenen öneri muhabirin önündeki iş: listenin başında.
  // Sırası muhabirde olanlar (düzeltme, Planlama'nın önerdiği) başta.
  const bende = (o: Oneri) => o.durum === "duzeltme" || o.durum === "teklif";
  const oneriler = [...hepsi.filter(bende), ...hepsi.filter((o) => !bende(o))];
  return (
    <Kart
      baslik={t("onerilerim")}
      ikon={<Lightbulb size={18} />}
      sagUc={
        <>
          <a className="dugme dugme-sade dugme-kucuk" href="#/oneriler/arsiv" title={t("gecmisOnerilerim")} aria-label={t("gecmisOnerilerim")} data-gecmis-onerilerim>
            <History size={14} /> <span className="telefonda-gizli">{t("gecmisOnerilerim")}</span>
          </a>
          <Tumu href="#/oneriler" />
        </>
      }
    >
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
                        {o.durum === "duzeltme" ? ` · ${o.duzeltmeNotu ?? ""}` : o.gerekce && ` · ${o.gerekce}`}
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

/*
 * Deneme süreci: geri bildirimle takibe alınan haberler. Uygulaması
 * e-postayla yürüyor; muhabir bitince "tamamlandı" diyor (Planlama da
 * diyebiliyor). Açıklar önde, bitenler arkada.
 */
function TakiptekiHaberlerim({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const { oneriler, paketler } = useMuhabirIsleri(ben);
  // Paketi olan haber "Senin sıran"da ve Haberlerim'de; burada ikinci kez "tamamlandı" düğmesiyle durmasın.
  const liste = oneriler.filter((o) => o.muhabirId === ben.id && o.takip && !paketler.some((p) => p.oneriId === o.id)).sort((a, b) => (a.takip === b.takip ? 0 : a.takip === "acik" ? -1 : 1));
  return (
    <Kart baslik={t("takiptekiHaberlerim")} ikon={<MailCheck size={18} />}>
      {liste.length === 0 ? (
        <Bos kucuk metin={t("takiptekiHaberYok")} />
      ) : (
        <ul className="liste" data-takipteki-haberler>
          {liste.map((o) => (
            <li key={o.id} data-takipteki={o.id}>
              <div className="ad">
                <a href={`#/oneriler/${o.id}`}>
                  <Icerik blok>{o.paketBasligi || o.haberBasligi}</Icerik>
                </a>
                <small>
                  <Icerik>{o.haberBasligi}</Icerik>
                  {o.takipBitis && ` · ${tarihYaz(yerelGun(o.takipBitis), dil, "kisa")}`}
                </small>
                {o.yalnizTakip && o.takip === "acik" && (
                  <small className="sonuk" data-yalniz-takip>
                    {t("yalnizTakipPaketYok")}
                  </small>
                )}
              </div>
              {o.takip === "acik" ? (
                <button type="button" className="dugme dugme-iyi dugme-kucuk" onClick={() => takipTamamla(ben, o.id) && tamamlandiBildir(ben, t("gbTamamlandiBildir"), { oneriId: o.id })} data-takip-tamamla>
                  <CheckCircle size={14} /> {t("gbTamamlandiIsaretle")}
                </button>
              ) : (
                <>
                  <Rozet ton="iyi">{t("gbTamamlandi")}</Rozet>
                  <TamamlamaGeriAlDugmesi ben={ben} oneri={o} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Kart>
  );
}

function Gorevlerim({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const { gorevler, ozelGorevler } = useMuhabirIsleri(ben);
  return (
    <Kart baslik={t("gorevlendirmelerim")} ikon={<Plane size={18} />} sagUc={<Tumu href="#/saha" />}>
            {gorevler.length + ozelGorevler.length === 0 ? (
              <Bos kucuk metin={t("gorevlendirmeYok")} />
            ) : (
              <ul className="liste" data-gorevlerim>
                <OzelGorevSatirlari paketler={ozelGorevler} />
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

/* Muhabirin sayfası tek sütun: işi az, kartlar yan yana sıkışınca okunmuyordu; hepsi geniş. */
export const MUHABIR_ALANLARI: Alan[] = [
  { id: "muCagri", ad: "alAcikCagrilar", genis: true, grup: "muhabir", sayfa: "muhabir", Bilesen: Cagrilar },
  { id: "muSayac", ad: "alOzetSayilar", genis: true, grup: "muhabir", sayfa: "muhabir", Bilesen: Sayaclar },
  { id: "muSiram", ad: "seninSiran", genis: true, grup: "muhabir", sayfa: "muhabir", Bilesen: Siram },
  { id: "muTakip", ad: "takiptekiHaberlerim", genis: true, grup: "muhabir", sayfa: "muhabir", Bilesen: TakiptekiHaberlerim },
  { id: "muGorev", ad: "gorevlendirmelerim", genis: true, grup: "muhabir", sayfa: "muhabir", Bilesen: Gorevlerim },
  { id: "muHaberler", ad: "haberlerim", genis: true, grup: "muhabir", sayfa: "muhabir", Bilesen: Haberlerim },
  { id: "muBildirim", ad: "bildirimler", genis: true, grup: "muhabir", sayfa: "muhabir", Bilesen: Bildirimlerim },
  { id: "muOneriler", ad: "onerilerim", genis: true, grup: "muhabir", sayfa: "muhabir", Bilesen: Onerilerim },
];
