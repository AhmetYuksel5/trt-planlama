import { ArrowLeft, Inbox, Megaphone } from "lucide-react";
import { useState } from "react";
import { Kart } from "../../bilesenler/Parcalar";
import { aralikYaz, useDil } from "../../dil";
import { cagriKaydet } from "../../eylemler";
import { HAFTALIK_TABLO, cagriKonusu, etiketUret, haftaAraligiAr, haftalikGovde, type GidenEposta } from "../../eposta";
import { haftaSonu } from "../../haftalik";
import { useVeri, type HaftalikPlan, type Kisi } from "../../veri";
import { SayfaBasi } from "../ana/Planlama";
import { AliciAlanlari, EpostaOnizleme, GonderDugmeleri, OncekiCagrilar, adresler, izinliHaric, sonKime } from "../oneri/Eposta";

/**
 * Haftalık öneri çağrısı: kurumun haftalık e-postası.
 *
 * Next Day çağrısıyla aynı yol: Kime planlama grubu, muhabirler BCC'de,
 * gönderim planlamacının kendi e-postasından. Fark gövdede: dönem
 * (Cumartesi–Cuma) kırmızı, yanıt için planlama adresi ve muhabirin her
 * olayı bir satıra yazacağı tablo. Konudaki HP- etiketi yanıtı o haftanın
 * önerisi yapıyor; Next Day planlarına karışmıyor.
 */
export default function HaftalikCagri({ ben, hafta }: { ben: Kisi; hafta: HaftalikPlan }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const bas = hafta.baslangic;
  const etiket = etiketUret(bas, "haftalik");
  const kayitli = v.cagrilar.find((c) => c.etiket === etiket);
  const [kime, setKime] = useState(kayitli?.kime ?? sonKime(v));
  const [bcc, setBcc] = useState<string[]>(() => kayitli?.bcc ?? izinliHaric(v));
  const [govde, setGovde] = useState(kayitli?.metin ?? haftalikGovde(bas, kime));
  const eposta: GidenEposta = {
    kime,
    bcc: adresler(v, bcc),
    konu: cagriKonusu(bas, "haftalik"),
    govde,
    vurgu: haftaAraligiAr(bas),
    tablo: HAFTALIK_TABLO,
  };
  /* Gövdedeki yanıt adresi Kime'yi izliyor; planlamacı gövdeyi elle değiştirdiyse dokunulmuyor. */
  const kimeDegistir = (yeni: string) => {
    if (govde === haftalikGovde(bas, kime)) setGovde(haftalikGovde(bas, yeni));
    setKime(yeni);
  };
  const kaydet = () => cagriKaydet(ben, { tur: "haftalik", tarih: bas, metin: govde, sonSaat: "", kime, bcc, etiket });

  return (
    <>
      <a className="geri-bag" href={`#/haftalik/${hafta.id}`}>
        <ArrowLeft size={14} className="yon" /> {t("haftalikPlanaDon")}
      </a>
      <SayfaBasi
        ikon={<Megaphone size={26} />}
        baslik={t("haftalikCagri")}
        alt={`${aralikYaz(bas, haftaSonu(bas), dil)} · ${t("haftalikCagriAlt")}`}
        sagUc={
          kayitli ? (
            <a className="dugme dugme-ikincil" href={`#/oneriler/yanitlar/${kayitli.id}`}>
              <Inbox size={16} /> {t("gelenYanitlar")}
            </a>
          ) : undefined
        }
      />
      <div className="iz iz-ana-yan">
        <Kart>
          <div className="form">
            <AliciAlanlari kime={kime} setKime={kimeDegistir} bcc={bcc} setBcc={setBcc} />
            <EpostaOnizleme eposta={eposta} govde={govde} setGovde={setGovde} />
            <GonderDugmeleri eposta={eposta} dosyaAdi={`haftalik-cagri-${bas}.eml`} once={kaydet} />
          </div>
        </Kart>
        <OncekiCagrilar tur="haftalik" />
      </div>
    </>
  );
}
