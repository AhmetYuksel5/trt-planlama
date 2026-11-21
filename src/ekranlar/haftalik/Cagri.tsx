import { ArrowLeft, BellRing, Inbox, Megaphone } from "lucide-react";
import { useState } from "react";
import { Icerik, Kart, Pencere, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { aralikYaz, saatYaz, tarihYaz, useDil } from "../../dil";
import { cagriHatirlatildi, cagriKaydet } from "../../eylemler";
import { GERCEK } from "../../kip";
import { postaGonder } from "../../posta-kapi";
import { kapiHatasi } from "../../yz";
import { HAFTALIK_TABLO, HATIRLATMA_BASLIGI, cagriKonusu, cagriMesajKimligi, etiketUret, hatirlatmaKonusu, hatirlatmaMetni, haftaAraligiAr, haftalikGovde, type GidenEposta } from "../../eposta";
import { haftaSonu } from "../../haftalik";
import { getir, kisiBul, useVeri, type Cagri, type HaftalikPlan, type Kisi } from "../../veri";
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

/* Kapı en çok 50 alıcı kabul ediyor (Kime ve grup CC'de); BCC bu boyda parçalara bölünüyor, her parça ayrı posta. */
const PARCA = 45;

/**
 * Çağrının altına hatırlatma (kullanıcı: haftalık çağrıdan sonra haftanın
 * belli vakitlerinde aynı postanın altına iri, kalın, kırmızı "تذكير").
 * Kişinin kendi posta hesabından, çağrının Kime'si ve BCC'deki muhabirlerle;
 * konu çağrınınki "RE:" ile, yanıtları öneriye düşmeye devam eder. Çağrı
 * Posta'daysa yanıt bağıyla (Message-ID) gider, muhabirin posta programında
 * çağrının altında görünür.
 */
export function HatirlatmaPenceresi({ ben, cagri, kapat }: { ben: Kisi; cagri: Cagri; kapat: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [not, setNot] = useState("");
  const [mesgul, setMesgul] = useState(false);
  const bcc = adresler(v, cagri.bcc);
  const yanitlanan = cagriMesajKimligi(v.postaMesajlari ?? [], cagri.etiket);
  const konu = hatirlatmaKonusu(cagri);

  const gonder = async () => {
    if (!bcc.length || !confirm(t("htOnay", { n: String(bcc.length) }))) return;
    setMesgul(true);
    let tamam = 0;
    const hatalar: string[] = [];
    if (GERCEK) {
      // Sırayla: her parça ayrı EWS bağlantısı; aynı anda açılınca kapı sınırına takılıyordu (PKG geri bildirimi gibi).
      for (let i = 0; i < bcc.length; i += PARCA) {
        const parca = bcc.slice(i, i + PARCA);
        const r = await postaGonder({ kime: [cagri.kime], bcc: parca, konu, metin: hatirlatmaMetni(cagri, not), baslik: HATIRLATMA_BASLIGI, ...(yanitlanan && { yanitlanan }) });
        if (r.tamam) tamam += parca.length;
        else hatalar.push(kapiHatasi(r));
      }
    } else tamam = bcc.length;
    setMesgul(false);
    if (tamam) cagriHatirlatildi(ben, cagri.id, tamam);
    if (hatalar.length) return bildir(`${tamam ? `${t("htGonderildi", { n: String(tamam) })} · ` : ""}${t("htGonderilemedi")} (${hatalar.join("; ")})`);
    bildir(GERCEK ? t("htGonderildi", { n: String(tamam) }) : t("htDemo"));
    kapat();
  };

  const onceki = [...(getir().cagrilar.find((c) => c.id === cagri.id)?.hatirlatmalar ?? [])].reverse();
  return (
    <Pencere
      baslik={t("htHatirlatma")}
      alt={konu}
      kapat={kapat}
      altBilgi={
        <button type="button" className="dugme" onClick={gonder} disabled={mesgul || !bcc.length} data-hatirlatma-gonder>
          <BellRing size={16} /> {t("htGonder")}
        </button>
      }
    >
      <div className="form" data-hatirlatma>
        <p className="sonuk">{bcc.length ? t("htAlici", { n: String(bcc.length) }) : t("htAliciYok")}</p>
        {GERCEK && !yanitlanan && <p className="sonuk" data-hatirlatma-bagsiz>{t("htBagsiz")}</p>}
        <label>
          {t("htNot")}
          <textarea {...icerikAlani} rows={3} value={not} onChange={(e) => setNot(e.target.value)} data-hatirlatma-not />
        </label>
        <div className="hatirlatma-onizleme" data-hatirlatma-onizleme>
          <Icerik blok className="hatirlatma-baslik">{HATIRLATMA_BASLIGI}</Icerik>
          {not.trim() && <Icerik blok className="posta-metin">{not.trim()}</Icerik>}
          <Icerik blok className="posta-metin hatirlatma-cagri">{`${cagriKonusu(cagri.tarih, cagri.tur ?? "nextday")}\n\n${cagri.metin.trim()}`}</Icerik>
        </div>
        {onceki.length > 0 && (
          <div data-hatirlatma-onceki>
            <b>{t("htOnceki")}</b>
            <ul className="liste">
              {onceki.map((h) => {
                const k = kisiBul(v, h.kisiId);
                return (
                  <li key={h.zaman}>
                    {tarihYaz(h.zaman.slice(0, 10), dil)} {saatYaz(h.zaman, dil)} · {k ? ad(k) : ""} · {t("htAlici", { n: String(h.alici) })}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Pencere>
  );
}
