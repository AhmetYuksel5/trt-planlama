import { ClipboardList } from "lucide-react";
import { useState, type ReactNode } from "react";
import { saatYaz, tarihYaz, useDil } from "../dil";
import { gorevBilgisi } from "../gorevBilgisi";
import { kisiBul, useVeri, type Paket } from "../veri";
import { Icerik, Pencere } from "./Parcalar";

/*
 * Paketin görevlendirmesi (kullanıcı: paket yapılırken ya da sonra, muhabire
 * görevlendirmede ne söylendiği, ne üzerine görevlendirildiği istenince
 * görülsün). Sayfanın başında düğme, içerik pencerede: aşamadan bağımsız,
 * muhabir de kendi paketinde görüyor. Bilgiler kayıttan (gorevBilgisi.ts).
 */
export function GorevlendirmeDugmesi({ paket }: { paket: Paket }) {
  const { t } = useDil();
  const [acik, setAcik] = useState(false);
  return (
    <>
      <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setAcik(true)} data-gorevlendirme-ac>
        <ClipboardList size={16} /> {t("gkBaslik")}
      </button>
      {acik && <GorevlendirmePenceresi paket={paket} kapat={() => setAcik(false)} />}
    </>
  );
}

function GorevlendirmePenceresi({ paket, kapat }: { paket: Paket; kapat: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const g = gorevBilgisi(v, paket);
  const an = (z: string) => `${tarihYaz(z, dil)} · ${saatYaz(z, dil)}`;
  const satir = (etiket: string, deger: ReactNode, veri?: string) => (
    <div className="gk-satir" data-gk={veri}>
      <dt>{etiket}</dt>
      <dd>{deger}</dd>
    </div>
  );
  const kaynak = [
    g.planTarihi && `Next Day · ${tarihYaz(g.planTarihi, dil)}`,
    g.haftalik && t("gkHaftalik"),
    g.ozelAd && t("gkOzel"),
    g.plansiz && t("gvGorevRozeti"),
  ].filter(Boolean);
  const metin = (s: string) => (
    <Icerik blok>
      <span className="gk-metin">{s}</span>
    </Icerik>
  );
  return (
    <Pencere baslik={t("gkBaslik")} kapat={kapat}>
      <dl className="gk-liste" data-gorevlendirme>
        {g.veren && satir(t("gkVeren"), <>{ad(kisiBul(v, g.veren))}{g.zaman && <span className="sonuk-yazi"> · {an(g.zaman)}</span>}</>, "veren")}
        {(kaynak.length > 0 || g.baslik || g.oneriId) &&
          satir(
            t("gkKaynak"),
            <>
              {kaynak.join(" · ")}
              {g.ozelAd && (
                <>
                  {" · "}
                  <Icerik>{g.ozelAd}</Icerik>
                </>
              )}
              {g.baslik && (
                <>
                  {kaynak.length > 0 && " · "}
                  <Icerik>{g.baslik}</Icerik>
                </>
              )}
              {g.oneriId && (
                <>
                  {" · "}
                  <a href={`#/oneriler/${g.oneriId}`}>{t("gkOneri")}</a>
                </>
              )}
            </>,
            "kaynak",
          )}
        {satir(t("ofStrap"), <Icerik>{g.strap}</Icerik>, "strap")}
        {satir(t("gkYer"), <Icerik>{g.yer}</Icerik>, "yer")}
        {g.aciklama && satir(t("aciklama"), metin(g.aciklama), "aciklama")}
        {g.teslim && satir(t("teslimGunu"), tarihYaz(g.teslim, dil), "teslim")}
        {g.yayinGunu && satir(t("gkYayinGunu"), tarihYaz(g.yayinGunu, dil), "yayin")}
        {g.isleme && satir(t("ofIsleme"), metin(g.isleme), "isleme")}
        {g.gorsel && satir(t("ofGorsel"), metin(g.gorsel), "gorsel")}
        {g.planNotu && satir(t("gkPlanNotu"), <span dir="auto" className="gk-metin">{g.planNotu}</span>, "plan-notu")}
        {g.kararNotu && satir(t("kararNotu"), <span dir="auto" className="gk-metin">{g.kararNotu}</span>, "karar-notu")}
        {g.ekTalep && satir(t("ekTalep"), <span dir="auto" className="gk-metin">{g.ekTalep}</span>, "ek-talep")}
        {g.kosul && satir(t("krSartli"), <span dir="auto" className="gk-metin">{g.kosul}</span>, "kosul")}
        {g.notlar.length > 0 &&
          satir(
            t("notlar"),
            <ul className="gk-notlar">
              {g.notlar.map((n) => (
                <li key={n.id}>
                  <span dir="auto" className="gk-metin">{n.metin}</span>
                  <small className="sonuk-yazi">
                    {" "}
                    · {ad(kisiBul(v, n.kisiId))} · {an(n.zaman)}
                  </small>
                </li>
              ))}
            </ul>,
            "notlar",
          )}
        {g.posta &&
          satir(
            t("gkPosta"),
            <>
              <span className="sonuk-yazi">
                {t("tkGitti")} · {ad(kisiBul(v, g.posta.kisiId))} · {an(g.posta.zaman)}
              </span>
              {g.posta.metin ? (
                <div className="gk-posta">
                  {g.posta.konu && <b dir="auto">{g.posta.konu}</b>}
                  <span dir="auto" className="gk-metin">{g.posta.metin}</span>
                </div>
              ) : (
                <small className="sonuk-yazi"> · {t("gkPostaMetniYok")}</small>
              )}
            </>,
            "posta",
          )}
      </dl>
    </Pencere>
  );
}
