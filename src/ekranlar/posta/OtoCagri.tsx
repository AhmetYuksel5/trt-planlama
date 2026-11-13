import { CalendarClock, Check, Loader2, X } from "lucide-react";
import { kapiHatasi } from "../../yz";
import { useEffect, useState } from "react";
import { Icerik, Kart, bildir } from "../../bilesenler/Parcalar";
import { saatYaz, tarihYaz, useDil, type Anahtar } from "../../dil";
import { OTO_SON_SAAT, otoCagriGetir, otoCagriYaz, otoPaketiBirak, type OtoGorunum } from "../../otoCagri";
import { bugun } from "../../tarih";
import { kisiBul, useVeri } from "../../veri";

/*
 * Otomatik öneri çağrısının anahtarı (Ayarlar; src/otoCagri.ts). Açan kişi
 * gönderen olur: posta onun kurumsal hesabından gider. Başkası gönderense
 * adı yazılı, "Benim hesabımdan" ile açıkça devralınır.
 */

const HATALAR: Record<string, Anahtar> = {
  liste: "otoHataListe",
  eksikKimlik: "otoHataKimlik",
  grup: "otoHataKimlik",
  postaKapali: "otoHataPosta",
  bcc: "otoHataBcc",
};

export const otoHataMetni = (t: (a: Anahtar) => string, hata?: string) => (hata && HATALAR[hata] ? t(HATALAR[hata]) : (hata ?? ""));

export function OtoCagriKart() {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const [d, setD] = useState<OtoGorunum | null>(null);
  const [hata, setHata] = useState("");
  const [mesgul, setMesgul] = useState(false);

  useEffect(() => {
    void otoCagriGetir().then((r) => (r.tamam ? setD(r.veri) : setHata(kapiHatasi(r))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!d)
    return (
      <Kart baslik={t("otoCagriBaslik")} ikon={<CalendarClock size={18} />}>
        {hata ? <p className="sonuk-yazi">{hata}</p> : <Loader2 size={18} className="donen" />}
      </Kart>
    );

  const sonuc = (r: Awaited<ReturnType<typeof otoCagriYaz>> | { tamam: false; hata: string } | null) => {
    if (!r) return;
    if (!r.tamam) return bildir(r.hata === "kimlik" ? t("otoHataKimlik") : kapiHatasi({ hata: r.hata }, `${t("postaKapiYok")} [${r.hata}]`));
    setD(r.veri);
    bildir(t("bKaydedildi"));
  };
  const is = async (f: () => Promise<Parameters<typeof sonuc>[0]>) => {
    setMesgul(true);
    sonuc(await f());
    setMesgul(false);
  };
  // Açarken liste de bırakılır: açılan gün çağrısız kalmasın.
  const ac = (acik: boolean, devral = false) => is(() => (acik ? otoPaketiBirak({ acik, ...(devral ? { devral } : {}) }) : otoCagriYaz({ acik })));
  const atlaDegis = (etiket: string) => is(() => otoCagriYaz({ atla: d.atla.includes(etiket) ? d.atla.filter((e) => e !== etiket) : [...d.atla, etiket] }));

  const gonderen = kisiBul(v, d.gonderen);
  const B = bugun();
  // Bugünkü çağrı saatinden sonra sıradaki yarınınki.
  const saat = new Date().getHours();
  const gelecek = d.kalemler.filter((k) => k.gonderim > B || (k.gonderim === B && saat < (k.tur === "haftalik" ? 10 : 9)));
  const siradakiler = (["nextday", "haftalik"] as const).map((tur) => gelecek.find((k) => k.tur === tur)).filter((k) => !!k);
  const gecmis = d.gecmis.slice(0, 5);

  return (
    <Kart baslik={t("otoCagriBaslik")} ikon={<CalendarClock size={18} />}>
      <div className="form" data-oto-cagri>
        {!d.benim && gonderen && (
          <p className="sonuk-yazi">
            {t("otoGonderen", { ad: ad(gonderen) })}
          </p>
        )}
        {d.benim ? (
          <label className="secim">
            <input type="checkbox" checked={d.acik} disabled={mesgul} onChange={(e) => ac(e.target.checked)} data-oto-cagri-acik />
            {t("otoCagriAc")}
          </label>
        ) : (
          <div className="dugmeler">
            <button className="dugme dugme-ikincil dugme-kucuk" disabled={mesgul} onClick={() => ac(true, true)} data-oto-cagri-devral>
              {t("otoDevral")}
            </button>
          </div>
        )}
        <p className="sonuk-yazi">
          {t("otoZamanNd", { saat: OTO_SON_SAAT })}
          <br />
          {t("otoZamanHp")}
          {d.acik && d.guncelleme && (
            <>
              <br />
              {t("otoListe", { n: String(d.bccSayi), zaman: `${tarihYaz(d.guncelleme.slice(0, 10), dil)} ${saatYaz(d.guncelleme, dil)}` })}
            </>
          )}
        </p>
        {d.acik &&
          siradakiler.map((k) => {
            const atlandi = d.atla.includes(k.etiket);
            return (
              <div key={k.etiket} className="oto-siradaki" data-oto-siradaki={k.etiket}>
                <div>
                  <div className="alan-etiket">
                    {t(k.tur === "haftalik" ? "haftalik" : "nextday")} · {tarihYaz(k.gonderim, dil)} {k.tur === "haftalik" ? "10:00" : "09:00"}
                    {atlandi && ` · ${t("otoAtlandi")}`}
                  </div>
                  <Icerik blok>{k.konu}</Icerik>
                </div>
                {d.benim && (
                  <button className="dugme dugme-sade dugme-kucuk" disabled={mesgul} onClick={() => atlaDegis(k.etiket)} data-oto-atla>
                    {t(atlandi ? "otoGonderilsin" : "otoAtla")}
                  </button>
                )}
              </div>
            );
          })}
        {gecmis.length > 0 && (
          <div>
            <div className="alan-etiket">{t("otoGecmis")}</div>
            {gecmis.map((g) => (
              <div key={g.zaman} className="sonuk-yazi" data-oto-gecmis>
                {g.tamam ? <Check size={14} /> : <X size={14} />} {tarihYaz(g.zaman.slice(0, 10), dil)} {saatYaz(g.zaman, dil)} · {g.tamam ? <Icerik>{g.konu}</Icerik> : otoHataMetni(t, g.hata)}
              </div>
            ))}
          </div>
        )}
      </div>
    </Kart>
  );
}
