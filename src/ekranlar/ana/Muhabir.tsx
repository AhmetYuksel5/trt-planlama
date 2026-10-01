import { ArrowRight, Bell, CheckCircle, CirclePlay, Clock, Lightbulb, Megaphone, Newspaper, Plane, Send } from "lucide-react";
import { ADIM_ADI, geciktiMi, paketSahibi, sonrakiAdim, type UretimAdimi } from "../../akis";
import { HareketAkisi } from "../../bilesenler/Hareket";
import { AsamaCubugu, Bos, Kart, NotKutu, PaketDurumRozeti, Rozet, Sayac, Tumu } from "../../bilesenler/Parcalar";
import { OneriDurumRozeti } from "../../bilesenler/Tablolar";
import { saatYaz, tarihYaz, useDil } from "../../dil";
import { BIRIM_ADI, GOREVLENDIRME_DURUM_ADI, HAREKET_TURU_ADI, sehirAdi } from "../../etiketler";
import { bugun, yerelGun } from "../../tarih";
import { useVeri, type Kisi } from "../../veri";
import { adimYapabilir, bildirimMi, gorevlendirmeGorebilir, oneriGorebilir, paketGorebilir } from "../../yetki";
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
  const { t, y, dil } = useDil();
  const v = useVeri();
  const B = bugun();
  const paketler = v.paketler.filter((p) => paketGorebilir(ben, p, v)).sort((a, b) => b.guncelleme.localeCompare(a.guncelleme));
  const oneriler = v.oneriler.filter((o) => oneriGorebilir(ben, o)).sort((a, b) => b.zaman.localeCompare(a.zaman));
  const siram = paketler.filter((p) => adimYapabilir(ben, p));
  const gorevler = v.gorevlendirmeler.filter((g) => gorevlendirmeGorebilir(ben, g) && g.bitis >= B);
  const cagri = v.cagrilar.filter((c) => c.tarih > B).sort((a, b) => b.zaman.localeCompare(a.zaman))[0];
  const bildirimler = v.hareketler.filter((h) => bildirimMi(ben, h, v)).slice(0, 6);
  const aktif = paketler.filter((p) => p.durum !== "tamamlandi" && p.durum !== "iptal");

  return (
    <>
      <SayfaBasi
        ikon={<Newspaper size={26} />}
        baslik={t("merhaba", { ad: y(ben.ad).split(" ")[0] })}
        alt={`${t("biMuhabir")} · ${t(sehirAdi(ben.sehir))}`}
        sagUc={
          <a className="dugme" href="#/oneriler/yeni">
            <Send size={16} className="yon" /> {t("yeniOneriGonder")}
          </a>
        }
      />

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

      <div className="sayaclar">
        <Sayac href="#/oneriler" ikon={<Lightbulb size={22} />} renk="renk-nextday" etiket={t("sOnerilerim")} deger={oneriler.filter((o) => o.durum === "yeni" || o.durum === "degerlendiriliyor").length} alt={t("sDegerlendirmede")} />
        <Sayac href="#/oneriler" ikon={<CheckCircle size={22} />} ton="iyi" etiket={t("sPlanaGiren")} deger={oneriler.filter((o) => o.durum === "planaEklendi").length} alt={t("sToplam")} />
        <Sayac href="#/paketler" ikon={<CirclePlay size={22} />} renk="renk-nextday" etiket={t("sDevamEden")} deger={aktif.length} alt={t("sPaket")} />
        <Sayac href="#/paketler" ikon={<Clock size={22} />} ton={siram.length ? "uyari" : ""} etiket={t("seninSiran")} deger={siram.length} alt={t("sBekleyenIs")} />
      </div>

      <div className="iz iz-ana-yan">
        <div className="iz">
          <Kart baslik={t("seninSiran")} ikon={<Clock size={18} />}>
            {siram.length === 0 ? (
              <Bos kucuk metin={t("siraBos")} />
            ) : (
              <ul className="liste">
                {siram.map((p) => (
                  <li key={p.id}>
                    <div className="ad">
                      <a href={`#/paketler/${p.id}`}>{y(p.baslik)}</a>
                      <small>
                        {t(ADIM_ADI[p.adim as UretimAdimi])}
                        {p.teslim && ` · ${t("teslim")} ${saatYaz(p.teslim, dil)}`}
                      </small>
                    </div>
                    {geciktiMi(p) && <Rozet ton="kotu">{t("gecikti")}</Rozet>}
                    <a className="dugme dugme-kucuk" href={`#/paketler/${p.id}`}>
                      {t(p.adim === "metin" ? "metniGonder" : "videoyuGonder")} <ArrowRight size={14} className="yon" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Kart>

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
                        <a href={`#/paketler/${p.id}`}>{y(p.baslik)}</a>
                        <small>
                          {sahip ? t("simdiKimdeKisa", { birim: t(BIRIM_ADI[sahip]) }) : t("pdTamamlandi")}
                          {sonraki && sonraki !== "tamam" && ` · ${t("siradaKisa", { adim: t(ADIM_ADI[sonraki]) })}`}
                        </small>
                      </div>
                      <AsamaCubugu paket={p} />
                      <PaketDurumRozeti paket={p} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Kart>

          <Kart baslik={t("onerilerim")} ikon={<Lightbulb size={18} />} sagUc={<Tumu href="#/oneriler" />}>
            {oneriler.length === 0 ? (
              <Bos metin={t("oneriYok")} />
            ) : (
              <ul className="liste">
                {oneriler.slice(0, 6).map((o) => (
                  <li key={o.id}>
                    <div className="ad">
                      <a href={`#/oneriler/${o.id}`}>{y(o.haberBasligi)}</a>
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
        </div>

        <div className="iz">
          <Kart baslik={t("gorevlendirmelerim")} ikon={<Plane size={18} />}>
            {gorevler.length === 0 ? (
              <Bos kucuk metin={t("gorevlendirmeYok")} />
            ) : (
              <ul className="liste">
                {gorevler.map((g) => (
                  <li key={g.id}>
                    <div className="ad">
                      <b>{y(g.yer)}</b>
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
          <Kart baslik={t("bildirimler")} ikon={<Bell size={18} />}>
            {bildirimler.length === 0 ? <Bos kucuk metin={t("bildirimYok")} /> : <HareketAkisi hareketler={bildirimler} d={v} />}
          </Kart>
        </div>
      </div>
    </>
  );
}
