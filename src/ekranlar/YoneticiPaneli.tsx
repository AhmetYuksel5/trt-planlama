import { AlertTriangle, ArrowLeft, CheckCircle, CirclePlay, ClipboardList, Eye, Flag, Gauge, PenLine } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ADIM_ADI, geciktiMi, paketSahibi, type UretimAdimi } from "../akis";
import { Bos, Icerik, Kart, NotKutu, Sayac, TaslakEtiketi, Tumu, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { OncelikDugmesi } from "../bilesenler/Yonetici";
import { metin, saatYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { BIRIM_ADI, GOREV_ADI, KISI_DURUM_ADI, PLAN_DURUM_ADI, ulkeAdi } from "../etiketler";
import { talimatVer } from "../eylemler";
import { rapor } from "../rapor";
import { bugun, gunEkle, yerelGun } from "../tarih";
import { ULKELER, kisiBul, muhabirler, paketBul, useVeri, type Birim, type Durum, type Kisi, type Oneri, type Paket, type Ulke } from "../veri";
import { kapsam, paketKapsamda, talimatVerebilir, type Kapsam } from "../yetki";
import { MediaAna, NewsGatheringAna, NewsdeskAna, OutputAna, ProgramAna } from "./ana/Birimler";
import PlanlamaAna, { BugununTakvimi, SayfaBasi } from "./ana/Planlama";
import { Yetkisiz } from "./Ayarlar";
import { FormAlt } from "./nextday/Formlar";

/**
 * Yönetici paneli.
 *
 * Yönetici iş akışının ayrıntısını değil, genel işleyişi görüyor: günün
 * birkaç sayısı, birimlerin durumu, yolunda gitmeyenler ve verdiği
 * talimatlar. Ayrıntı istediğinde birimin kendi çalışma ekranına iniyor
 * (#/panel/<birim>); müdahalesi öncelik, yönetici notu ve haber talimatı.
 * Müdürde kapsam birden fazla birim (Input: Planlama, Newsdesk, News
 * Gathering, muhabirler); birim yöneticisinde yalnız kendi birimi.
 *
 * Birim ışığı yeni bir iş kuralı uydurmuyor, gerekçesini açık yazıyor:
 * kırmızı geciken iş, sarı birimin önünde bekleyen karar (onay, devir,
 * talimat, saha talebi), yeşil ikisi de yok.
 */

const aktifMi = (p: Paket) => p.durum !== "tamamlandi" && p.durum !== "iptal";

/* --- Birim kartlarının sayıları: yalnız ortak kayıttan --- */

interface BirimDurumu {
  birim: Birim;
  geciken: number;
  bekleyen: number;
  sayilar: [Anahtar, number | string][];
}

const birimDurumu = (d: Durum, b: Birim, paketler: Paket[], t: (k: Anahtar) => string): BirimDurumu => {
  const B = bugun();
  const yarinPlan = d.planlar.find((p) => p.tarih === gunEkle(B, 1));
  const masada = paketler.filter((p) => aktifMi(p) && paketSahibi(p) === b);
  const geciken = masada.filter((p) => geciktiMi(p)).length;
  const bugunBiten = paketler.filter((p) => p.durum === "tamamlandi" && yerelGun(p.guncelleme) === B).length;
  switch (b) {
    case "planlama":
      return {
        birim: b,
        geciken,
        bekleyen:
          d.planlar.filter((p) => p.durum === "toplantida").length +
          d.oneriler.filter((o) => o.talimatVeren && (o.durum === "yeni" || o.durum === "degerlendiriliyor")).length,
        sayilar: [
          ["sYarinPlan", yarinPlan ? t(PLAN_DURUM_ADI[yarinPlan.durum]) : "—"],
          ["bkBekleyenOneri", d.oneriler.filter((o) => o.durum === "yeni" || o.durum === "degerlendiriliyor").length],
          ["bkDegerlendirmede", paketler.filter((p) => p.durum === "degerlendiriliyor").length],
        ],
      };
    case "newsdesk":
      return {
        birim: b,
        geciken,
        bekleyen: d.planlar.filter((p) => p.durum === "onayli").length,
        sayilar: [
          ["sUretimde", masada.length],
          ["sGeciken", geciken],
          ["sBugunTamamlanan", bugunBiten],
        ],
      };
    case "newsgathering": {
      const talep = d.gorevlendirmeler.filter((g) => g.durum === "talep").length;
      return {
        birim: b,
        geciken,
        bekleyen: talep,
        sayilar: [
          ["bkSahaTalebi", talep + masada.length],
          ["kdSahada", muhabirler(d).filter((k) => k.durum === "sahada").length],
          ["bkSahaGerekecek", paketler.filter((p) => p.sahaGerekli && ["taslak", "degerlendiriliyor", "onaylandi"].includes(p.durum)).length],
        ],
      };
    }
    case "muhabir": {
      const m = muhabirler(d);
      return {
        birim: b,
        geciken,
        bekleyen: 0,
        sayilar: (["sahada", "yolda", "izinli", "gorevde"] as const).map((x) => [KISI_DURUM_ADI[x], m.filter((k) => k.durum === x).length]),
      };
    }
    default:
      return {
        birim: b,
        geciken,
        bekleyen: 0,
        sayilar: [
          ["bkSirada", masada.length],
          ["sGeciken", geciken],
          ["sBugunTamamlanan", bugunBiten],
        ],
      };
  }
};

function BirimKarti({ durum, ayrinti }: { durum: BirimDurumu; ayrinti: string }) {
  const { t } = useDil();
  const isik = durum.geciken ? "kotu" : durum.bekleyen ? "uyari" : "iyi";
  const gerekce = durum.geciken
    ? t("isikGeciken", { n: durum.geciken })
    : durum.bekleyen
      ? t("isikBekleyen", { n: durum.bekleyen })
      : t("isikYolunda");
  return (
    <section className="kart birim-karti">
      <header>
        <h3>{t(BIRIM_ADI[durum.birim])}</h3>
        <span className={`isik isik-${isik}`}>
          <i aria-hidden="true" />
          {gerekce}
        </span>
      </header>
      <dl>
        {durum.sayilar.map(([k, n]) => (
          <div key={k}>
            <dt>{t(k)}</dt>
            <dd>{n}</dd>
          </div>
        ))}
      </dl>
      <Tumu href={ayrinti} metin={t("ayrinti")} />
    </section>
  );
}

/* --- Dikkat gerektirenler: yalnız yolunda gitmeyenler --- */

interface DikkatSatiri {
  anahtar: string;
  ton: "kotu" | "uyari" | "vurgu";
  baslik: string;
  icerik: boolean;
  alt: string;
  href: string;
  paket?: Paket;
}

const sureYaz = (dk: number, t: (k: Anahtar, p?: Record<string, string | number>) => string) =>
  dk >= 60 ? t("saatKisa", { n: Math.round(dk / 60) }) : t("dakikaKisa", { n: dk });

function DikkatListesi({ ben, d, paketler, ks }: { ben: Kisi; d: Durum; paketler: Paket[]; ks: Kapsam }) {
  const { t, dil, ad } = useDil();
  const an = Date.now();
  const kimde = (p: Paket) => {
    const b = paketSahibi(p);
    return b ? t(BIRIM_ADI[b]) : "";
  };
  const satirlar: DikkatSatiri[] = [];
  for (const p of paketler.filter((x) => geciktiMi(x))) {
    const dk = Math.round((an - new Date(p.teslim!).getTime()) / 60_000);
    satirlar.push({ anahtar: `g-${p.id}`, ton: "kotu", baslik: p.baslik, icerik: true, alt: t("dkGecikti", { sure: sureYaz(dk, t), birim: kimde(p) }), href: `#/paketler/${p.id}`, paket: p });
  }
  for (const p of paketler.filter((x) => x.oncelikli && aktifMi(x) && !geciktiMi(x))) {
    const asama = p.durum === "uretimde" && p.adim ? t(ADIM_ADI[p.adim as UretimAdimi]) : kimde(p);
    const teslim = p.teslim ? ` · ${t("teslim")} ${saatYaz(p.teslim, dil)}` : "";
    satirlar.push({ anahtar: `o-${p.id}`, ton: "vurgu", baslik: p.baslik, icerik: true, alt: `${t("oncelikli")} · ${asama}${teslim}`, href: `#/paketler/${p.id}`, paket: p });
  }
  if (ks.birimler.includes("planlama") || ks.birimler.includes("newsdesk")) {
    for (const pl of d.planlar.filter((x) => x.durum === "toplantida" || x.durum === "onayli")) {
      const anahtar = pl.durum === "toplantida" ? "dkPlanOnay" : "dkPlanDevir";
      if (pl.durum === "onayli" && !ks.birimler.includes("newsdesk")) continue;
      satirlar.push({ anahtar: `p-${pl.id}`, ton: "uyari", baslik: t(anahtar, { tarih: tarihYaz(pl.tarih, dil, "kisa") }), icerik: false, alt: t(PLAN_DURUM_ADI[pl.durum]), href: `#/nextday/${pl.id}` });
    }
  }
  if (ks.birimler.includes("newsgathering")) {
    for (const g of d.gorevlendirmeler.filter((x) => x.durum === "talep")) {
      satirlar.push({ anahtar: `s-${g.id}`, ton: "uyari", baslik: g.yer, icerik: true, alt: `${t("dkSahaTalebi")} · ${ad(kisiBul(d, g.kisiId))}`, href: "#/talepler" });
    }
  }
  if (ks.birimler.includes("planlama")) {
    for (const o of d.oneriler.filter((x) => x.talimatVeren && (x.durum === "yeni" || x.durum === "degerlendiriliyor"))) {
      satirlar.push({ anahtar: `t-${o.id}`, ton: "uyari", baslik: o.haberBasligi, icerik: true, alt: t("dkTalimat"), href: `#/oneriler/${o.id}` });
    }
  }
  return (
    <Kart baslik={t("dikkatGerektirenler")} ikon={<AlertTriangle size={18} />} className="dikkat-karti">
      {satirlar.length === 0 ? (
        <Bos kucuk metin={t("dikkatYok")} />
      ) : (
        <ul className="liste dikkat">
          {satirlar.map((s) => (
            <li key={s.anahtar} className={`ton-${s.ton}`}>
              <i className="dikkat-isaret" aria-hidden="true" />
              <div className="ad">
                <a href={s.href}>{s.icerik ? <Icerik blok>{s.baslik}</Icerik> : s.baslik}</a>
                <small>{s.alt}</small>
              </div>
              {s.paket && <OncelikDugmesi ben={ben} paket={s.paket} kucuk />}
            </li>
          ))}
        </ul>
      )}
    </Kart>
  );
}

/* --- Verdiğim talimatlar: durum zinciri öneriden ve paketten türetiliyor --- */

const TALIMAT_ADIMLARI: Anahtar[] = ["tdPlanlamada", "tdPlanda", "tdUretimde", "tdTamamlandi"];

const talimatDurumu = (o: Oneri, d: Durum): { adim: number; iptal: boolean; ek: string; paket?: Paket } => {
  if (o.durum !== "planaEklendi") return { adim: 0, iptal: false, ek: "" };
  const p = paketBul(d, o.paketId);
  if (!p) return { adim: 1, iptal: false, ek: "" };
  if (p.durum === "iptal") return { adim: 1, iptal: true, ek: "", paket: p };
  if (p.durum === "tamamlandi") return { adim: 3, iptal: false, ek: "", paket: p };
  if (p.durum === "uretimde") return { adim: 2, iptal: false, ek: p.adim ?? "", paket: p };
  return { adim: 1, iptal: false, ek: "", paket: p };
};

function Talimatlarim({ ben, d }: { ben: Kisi; d: Durum }) {
  const { t, dil } = useDil();
  const liste = d.oneriler.filter((o) => o.talimatVeren === ben.id).sort((a, b) => b.zaman.localeCompare(a.zaman));
  return (
    <Kart baslik={t("talimatlarim")} ikon={<ClipboardList size={18} />}>
      {liste.length === 0 ? (
        <Bos kucuk metin={t("talimatYok")} />
      ) : (
        <ul className="liste talimatlar">
          {liste.map((o) => {
            const s = talimatDurumu(o, d);
            const plan = d.planlar.find((p) => p.id === o.planId);
            return (
              <li key={o.id}>
                <div className="ad">
                  <a href={s.paket ? `#/paketler/${s.paket.id}` : `#/oneriler/${o.id}`}>
                    <Icerik blok>{o.haberBasligi}</Icerik>
                  </a>
                  <small>
                    {t("hedefGun")}: {tarihYaz(o.hedefTarih, dil, "kisa")}
                    {plan && ` · ${t("nextday")} ${tarihYaz(plan.tarih, dil, "kisa")}`}
                    {s.ek && ` · ${t(ADIM_ADI[s.ek as UretimAdimi])}`}
                  </small>
                  <ol className={`talimat-zinciri ${s.iptal ? "iptal" : ""}`} aria-label={t("talimatlarim")}>
                    {TALIMAT_ADIMLARI.map((a, i) => (
                      <li key={a} className={i < s.adim ? "gecti" : i === s.adim ? "simdi" : ""} aria-current={i === s.adim ? "step" : undefined}>
                        {s.iptal && i === s.adim ? t("tdIptal") : t(a)}
                      </li>
                    ))}
                  </ol>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Kart>
  );
}

/* --- Haber talimatı: basit form, Planlama'ya öncelikli düşüyor --- */

function TalimatFormu({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t, dil } = useDil();
  const B = bugun();
  const [f, setF] = useState({ haberBasligi: "", aciklama: "", ulke: "turkiye" as Ulke, hedefTarih: gunEkle(B, 1) });
  const kaydet = () => {
    if (talimatVer(ben, f)) {
      bildir(t("bTalimat"));
      kapat();
    }
  };
  return (
    <div className="form form-kutu talimat-formu">
      <p className="ipucu">{t("talimatAciklama")}</p>
      <label>
        {t("haberBasligi")}
        <input {...icerikAlani} value={f.haberBasligi} onChange={(e) => setF({ ...f, haberBasligi: e.target.value })} placeholder={metin("talimatBaslikIpucu", "ar")} />
      </label>
      <label>
        {t("talimatMetni")}
        <textarea {...icerikAlani} value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} placeholder={metin("talimatMetinIpucu", "ar")} />
      </label>
      <div className="satir">
        <label>
          {t("ulke")}
          <select value={f.ulke} onChange={(e) => setF({ ...f, ulke: e.target.value as Ulke })}>
            {ULKELER.map((x) => (
              <option key={x} value={x}>
                {t(ulkeAdi(x))}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("hedefGun")}
          <input type="date" min={B} value={f.hedefTarih} onChange={(e) => setF({ ...f, hedefTarih: e.target.value || gunEkle(B, 1) })} />
        </label>
      </div>
      <div className="sekmeler">
        {[B, gunEkle(B, 1)].map((g, i) => (
          <button key={g} type="button" className={f.hedefTarih === g ? "acik" : ""} onClick={() => setF({ ...f, hedefTarih: g })}>
            {t(i ? "yarin" : "bugun")} <em>{tarihYaz(g, dil, "kisa")}</em>
          </button>
        ))}
      </div>
      <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.haberBasligi.trim()} kaydetMetni={t("talimatGonder")} />
    </div>
  );
}

/* --- Ayrıntıya inme: birimin kendi çalışma ekranı, yönetici bandıyla --- */

function BirimGorunumu({ ben, birim }: { ben: Kisi; birim: Birim }) {
  const { t } = useDil();
  const ekran: Partial<Record<Birim, ReactNode>> = {
    planlama: <PlanlamaAna ben={ben} />,
    newsdesk: <NewsdeskAna ben={ben} />,
    newsgathering: <NewsGatheringAna />,
    program: <ProgramAna />,
    output: <OutputAna />,
    media: <MediaAna />,
  };
  return (
    <>
      <div className="gozlem-bandi" role="note">
        <Eye size={16} />
        <span>{t("gozlemBandi", { birim: t(BIRIM_ADI[birim]) })}</span>
        <a className="dugme dugme-ikincil dugme-kucuk" href="#/panel">
          <ArrowLeft size={14} className="yon" /> {t("panelaDon")}
        </a>
      </div>
      {ekran[birim]}
    </>
  );
}

/* --- Panel --- */

export default function YoneticiPaneli({ ben, birim }: { ben: Kisi; birim?: string }) {
  const { t } = useDil();
  const v = useVeri();
  const [talimat, setTalimat] = useState(false);
  const ks = kapsam(ben);
  if (!ks) return <Yetkisiz />;

  if (birim) {
    // Müdür kapsamındaki birime iniyor; muhabirler için liste sayfası, birim yöneticisi için kendi ana sayfası.
    if (!ks.mudur || !ks.birimler.includes(birim as Birim) || birim === "muhabir") return <Yetkisiz />;
    return <BirimGorunumu ben={ben} birim={birim as Birim} />;
  }

  const B = bugun();
  const kolda = v.paketler.filter((p) => ks.kollar.includes(p.tur));
  // Müdür kolun bütün işini, birim yöneticisi yalnız kendi masasındakini izliyor.
  const izlenen = ks.mudur ? kolda : v.paketler.filter((p) => paketKapsamda(ben, p));
  const yarinPlan = v.planlar.find((p) => p.tarih === gunEkle(B, 1));
  const talimatVerir = talimatVerebilir(ben);
  const acikTalimat = v.oneriler.filter((o) => o.talimatVeren === ben.id && talimatDurumu(o, v).adim < 3 && !talimatDurumu(o, v).iptal).length;
  const hafta = rapor(v, 7, ks.kollar);
  const yuzde = (x: number | null) => (x === null ? "—" : `%${Math.round(x * 100)}`);
  const kapsamAdi = ks.birimler.map((b) => t(BIRIM_ADI[b])).join(", ");
  const programYalniz = ks.kollar.length === 1 && ks.kollar[0] === "program";

  return (
    <>
      <SayfaBasi
        ikon={<Gauge size={26} />}
        baslik={t("mPanel")}
        alt={`${t(GOREV_ADI[ben.gorev])} · ${t("ypKapsam", { birimler: kapsamAdi })}`}
        sagUc={
          talimatVerir && !talimat ? (
            <button className="dugme" onClick={() => setTalimat(true)}>
              <PenLine size={16} /> {t("talimatVer")}
            </button>
          ) : undefined
        }
      />
      {talimat && <TalimatFormu ben={ben} kapat={() => setTalimat(false)} />}
      {programYalniz && (
        <NotKutu>
          <TaslakEtiketi /> {t("ypProgramTaslak")}
        </NotKutu>
      )}

      <div className="sayaclar">
        {!programYalniz && yarinPlan && (
          <Sayac
            href={`#/nextday/${yarinPlan.id}`}
            ikon={<ClipboardList size={22} />}
            renk="renk-nextday"
            etiket={t("sYarinPlan")}
            deger={t(PLAN_DURUM_ADI[yarinPlan.durum])}
            alt={t("planOzeti", { baslik: yarinPlan.basliklar.length, paket: v.paketler.filter((p) => p.planId === yarinPlan.id && p.durum !== "iptal").length })}
          />
        )}
        <Sayac href="#/uretim" ikon={<CirclePlay size={22} />} renk="renk-nextday" etiket={t("sUretimde")} deger={izlenen.filter((p) => p.durum === "uretimde").length} />
        <Sayac
          href="#/paketler"
          ikon={<CheckCircle size={22} />}
          ton="iyi"
          etiket={t("sBugunTamamlanan")}
          deger={kolda.filter((p) => p.durum === "tamamlandi" && yerelGun(p.guncelleme) === B).length}
        />
        <Sayac ikon={<AlertTriangle size={22} />} ton="kotu" etiket={t("sGeciken")} deger={izlenen.filter((p) => geciktiMi(p)).length} />
        <Sayac ikon={<Flag size={22} />} ton="uyari" etiket={t("sOncelikli")} deger={izlenen.filter((p) => p.oncelikli && aktifMi(p)).length} />
        {talimatVerir && <Sayac ikon={<PenLine size={22} />} renk="renk-saha" etiket={t("sTalimatlarim")} deger={acikTalimat} />}
      </div>

      <section className="birim-kartlari" aria-label={t("birimler")}>
        {ks.birimler.map((b) => (
          <BirimKarti
            key={b}
            durum={birimDurumu(v, b, kolda, t)}
            ayrinti={!ks.mudur ? "#/" : b === "muhabir" ? "#/muhabirler" : `#/panel/${b}`}
          />
        ))}
      </section>

      <div className="iz iz-2">
        <DikkatListesi ben={ben} d={v} paketler={izlenen} ks={ks} />
        {talimatVerir ? <Talimatlarim ben={ben} d={v} /> : <BugununTakvimi d={v} />}
      </div>

      <div className="iz iz-2">
        {talimatVerir && <BugununTakvimi d={v} />}
        <Kart baslik={t("haftaOzeti")} ikon={<CheckCircle size={18} />} sagUc={<Tumu href="#/raporlar" metin={t("mRaporlar")} />}>
          <dl className="ozet-sayilar">
            <div>
              <dt>{t("tamamlananHaber")}</dt>
              <dd>{hafta.ozet.tamamlanan}</dd>
            </div>
            <div>
              <dt>{t("zamanindaTeslim")}</dt>
              <dd>{yuzde(hafta.ozet.zamaninda)}</dd>
            </div>
            <div>
              <dt>{t("ilkSeferdeKabul")}</dt>
              <dd>{yuzde(hafta.ozet.ilkSeferde)}</dd>
            </div>
            <div>
              <dt>{t("oneriKabul")}</dt>
              <dd>{yuzde(hafta.ozet.oneriKabul)}</dd>
            </div>
          </dl>
        </Kart>
      </div>
    </>
  );
}
