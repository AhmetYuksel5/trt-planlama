import { CalendarRange, ChevronLeft, ChevronRight, Clapperboard, FileText, Lightbulb, Pencil, Plus, Search, Trash2, Tv, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { GorevlendirDugmesi } from "../../bilesenler/PaketGorevi";
import { MasaYayinDugmeleri } from "../../bilesenler/PaketSonucu";
import { Bos, Icerik, Kart, Pencere, Rozet, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { SaatGirdisi } from "../../bilesenler/TarihSaat";
import { kisaGunAdi, saatYaz, tarihYaz, useDil, type Anahtar } from "../../dil";
import { gorevTalebiGeriCek, icerikProgramaAktar, masaSorusunuYanitla, programKaldir, programKaydet } from "../../eylemler";
import { BICIM_ADI, paketYeri } from "../../etiketler";
import { masaninSorulari, oneriGorevPaketi } from "../../masaSorusu";
import {
  ICERIK_ALANLARI,
  bolumIcerikleri,
  bugunkuProgramlar,
  etkinProgramlar,
  haftaninBolumleri,
  icerikDurumAlani,
  masaIcerikleri,
  masaTalepleri,
  sonAylik,
  sonNextDay,
  sonOzel,
  sonWeekly,
  talepBekliyor,
  type IcerikAlani,
  type ProgramBolumu,
} from "../../programMasasi";
import { bugun, gunEkle, haftaBasi } from "../../tarih";
import { kisiBul, oneriBul, useVeri, type Kisi, type Paket, type ProgramTanimi } from "../../veri";
import { gorevTalebiGeriCekebilir, icerikAktarabilir, masaYanitlar, programDuzenler } from "../../yetki";
import { useAdimDurumu } from "../../yol";
import { AylikBelgesi } from "../aylik/Aylik";
import { HaftalikBelgesi } from "../belge/HaftalikBelge";
import { NextDayBelgesi } from "../belge/NextDayBelge";
import { OzelBelgesi } from "../OzelCikti";

/*
 * Programlar'ın sayfası (kullanıcı: program programlamaya uygun, masaüstü ve
 * telefona uygun; kurallar programMasasi.ts). Dört kutucuk, seçilenin alanı
 * altında: Yayın planları (her planın son onaylanan çıktısı, salt okunur),
 * İçerikler (Planlamada, Üretimde, Yayına hazır, Arşiv), Öneriler (Planlama'dan,
 * bizim görev taleplerimiz, arşiv), Programlar (programlar, günleri, bölümlere
 * aktarılan içerik). Eski kartlar (program masası, haftalık program planı,
 * program önerileri, konuk organizasyonu) kalktı.
 */

const BOLUM_ADI: Record<ProgramBolumu, Anahtar> = { planlar: "pmPlanlar", icerikler: "pmIcerikler", oneriler: "pmOneriler", programlar: "pmProgramlar" };
const BOLUM_IKONU: Record<ProgramBolumu, ReactNode> = {
  planlar: <FileText size={20} />,
  icerikler: <Clapperboard size={20} />,
  oneriler: <Lightbulb size={20} />,
  programlar: <Tv size={20} />,
};
const ALAN_ADI: Record<IcerikAlani, Anahtar> = { planlamada: "pmAlanPlanlamada", uretimde: "pmAlanUretimde", hazir: "pmAlanHazir", arsiv: "pmAlanArsiv" };

export function ProgramMasasi({ ben, ilk = "icerikler" }: { ben: Kisi; ilk?: ProgramBolumu }) {
  const { t } = useDil();
  const v = useVeri();
  const [bolum, setBolum] = useAdimDurumu<ProgramBolumu>("programlar:bolum", ilk);
  const B = bugun();
  const icerikler = masaIcerikleri(v, "program");
  const aktif = icerikler.filter((p) => icerikDurumAlani(p) !== "arsiv").length;
  const sorular = masaninSorulari(v, "program").filter((s) => !s.cevap).length;
  const talepler = masaTalepleri(v, "program").filter(talepBekliyor).length;
  const planSayisi = [sonNextDay(v), sonWeekly(v), sonAylik(v), sonOzel(v)].filter(Boolean).length;
  const programlar = etkinProgramlar(v);
  const bugunku = bugunkuProgramlar(v, B);
  const kutular: { b: ProgramBolumu; alt: string; say: number }[] = [
    { b: "planlar", alt: t("pmPlanlarAlt"), say: planSayisi },
    { b: "icerikler", alt: t("pmIceriklerAlt", { n: aktif }), say: aktif },
    { b: "oneriler", alt: t("pmOnerilerAlt", { n: sorular + talepler }), say: sorular + talepler },
    { b: "programlar", alt: t("pmProgramlarAlt", { n: programlar.length, m: bugunku.length }), say: programlar.length },
  ];
  return (
    <div className="prg-masa" data-program-masasi>
      <div className="prg-kutular" role="tablist">
        {kutular.map((k) => (
          <button
            key={k.b}
            type="button"
            role="tab"
            aria-selected={bolum === k.b}
            className={`prg-kutu prg-k-${k.b}${bolum === k.b ? " secili" : ""}`}
            onClick={() => setBolum(k.b)}
            data-prg-kutu={k.b}
          >
            <span className="prg-kutu-ik">{BOLUM_IKONU[k.b]}</span>
            <b>{t(BOLUM_ADI[k.b])}</b>
            <small>{k.alt}</small>
            {k.say > 0 && <em className="prg-say">{k.say}</em>}
          </button>
        ))}
      </div>
      {bugunku.length > 0 && <BugunYayinda programlar={bugunku} />}
      {bolum === "planlar" && <YayinPlanlari />}
      {bolum === "icerikler" && <Icerikler ben={ben} />}
      {bolum === "oneriler" && <Oneriler ben={ben} />}
      {bolum === "programlar" && <Programlar ben={ben} />}
    </div>
  );
}

function BugunYayinda({ programlar }: { programlar: ProgramTanimi[] }) {
  const { t } = useDil();
  const v = useVeri();
  const B = bugun();
  return (
    <div className="prg-bugun" data-prg-bugun>
      <span className="prg-bugun-bas">{t("pmBugunYayinda")}</span>
      {programlar.map((p) => {
        const n = bolumIcerikleri(v, p.id, B).length;
        return (
          <span key={p.id} className="prg-bugun-oge">
            <Icerik>{p.ad}</Icerik>
            {p.saat && <b>{p.saat}</b>}
            <small className={n ? "" : "uyari-yazi"}>{n ? t("pmIcerikSayisi", { n }) : t("pmIcerikYok")}</small>
          </span>
        );
      })}
    </div>
  );
}

/* --- Yayın planları: son onaylanan çıktılar, salt okunur --- */

type PlanTuru = "nextday" | "haftalik" | "aylik" | "ozel";
function YayinPlanlari() {
  const { t, dil } = useDil();
  const v = useVeri();
  const planlar: { tur: PlanTuru; ad: Anahtar; alt?: string; href?: string; var: boolean }[] = [];
  const nd = sonNextDay(v);
  const hf = sonWeekly(v);
  const ay = sonAylik(v);
  const oz = sonOzel(v);
  planlar.push({ tur: "nextday", ad: "pmNextDay", alt: nd && tarihYaz(nd.tarih, dil, "tam"), href: nd && `#/nextday/${nd.id}`, var: !!nd });
  planlar.push({ tur: "haftalik", ad: "pmWeekly", alt: hf && `${tarihYaz(hf.baslangic, dil)} – ${tarihYaz(gunEkle(hf.baslangic, 6), dil)}`, href: hf && `#/haftalik/${hf.id}`, var: !!hf });
  planlar.push({ tur: "aylik", ad: "pmAylik", alt: ay && tarihYaz(ay.ay + "-01", dil, "ay"), href: ay && `#/aylik/${ay.id}`, var: !!ay });
  planlar.push({ tur: "ozel", ad: "pmOzel", alt: oz?.ad, href: oz && `#/ozel/${oz.id}`, var: !!oz });
  const [secim, setSecim] = useAdimDurumu<PlanTuru>("programlar:plan", "nextday");
  const s = planlar.find((p) => p.tur === secim) ?? planlar[0];
  return (
    <Kart baslik={t("pmPlanlar")} ikon={<FileText size={18} />}>
      <div className="prg-plan-sec" role="tablist">
        {planlar.map((p) => (
          <button key={p.tur} type="button" role="tab" aria-selected={p.tur === s.tur} className={`renk-${p.tur === "haftalik" ? "haftalik" : p.tur}${p.tur === s.tur ? " acik" : ""}`} onClick={() => setSecim(p.tur)} data-prg-plan={p.tur}>
            <b>{t(p.ad)}</b>
            <small>{p.var ? p.alt : t("pmPlanYok")}</small>
          </button>
        ))}
      </div>
      {!s.var ? (
        <Bos metin={t("pmPlanYok")} />
      ) : (
        <div className="prg-cikti cikti-sarici" data-prg-cikti={s.tur}>
          {s.tur === "nextday" && nd && <NextDayBelgesi plan={nd} />}
          {s.tur === "haftalik" && hf && <HaftalikBelgesi hafta={hf} />}
          {s.tur === "aylik" && ay && <AylikBelgesi plan={ay} d={v} />}
          {s.tur === "ozel" && oz && <OzelBelgesi o={oz} />}
        </div>
      )}
    </Kart>
  );
}

/* --- İçerikler --- */

function Icerikler({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [alan, setAlan] = useAdimDurumu<IcerikAlani>("programlar:alan", "uretimde");
  const [aranan, setAranan] = useAdimDurumu("programlar:ara", "");
  const [aktar, setAktar] = useState<Paket | null>(null);
  const q = aranan.trim().toLocaleLowerCase();
  const hepsi = masaIcerikleri(v, "program").filter((p) => !q || `${p.baslik} ${p.kod} ${ad(kisiBul(v, p.muhabirId))}`.toLocaleLowerCase().includes(q));
  const sayi = (a: IcerikAlani) => hepsi.filter((p) => icerikDurumAlani(p) === a).length;
  const liste = hepsi
    .filter((p) => icerikDurumAlani(p) === alan)
    .sort((a, b) => (alan === "arsiv" ? b.guncelleme.localeCompare(a.guncelleme) : (a.sonTarih ?? "~").localeCompare(b.sonTarih ?? "~")));
  return (
    <Kart
      baslik={t("pmIcerikler")}
      ikon={<Clapperboard size={18} />}
      sagUc={
        <span className="prg-arac">
          <label className="arama arama-kutu">
            <Search size={15} />
            <input type="search" value={aranan} onChange={(e) => setAranan(e.target.value)} placeholder={t("paketAra")} aria-label={t("paketAra")} />
          </label>
          <GorevlendirDugmesi ben={ben} />
        </span>
      }
    >
      <div className="prg-seg" role="tablist" data-prg-alanlar>
        {ICERIK_ALANLARI.map((a) => (
          <button key={a} type="button" role="tab" aria-selected={a === alan} className={a === alan ? "acik" : ""} onClick={() => setAlan(a)} data-prg-alan={a}>
            {t(ALAN_ADI[a])} <em>{sayi(a)}</em>
          </button>
        ))}
      </div>
      {liste.length === 0 ? (
        <Bos metin={t("kayitYok")} />
      ) : (
        <div className="prg-icerikler">
          {liste.map((p) => (
            <IcerikKarti key={p.id} ben={ben} p={p} aktar={() => setAktar(p)} />
          ))}
        </div>
      )}
      {aktar && <AktarPenceresi ben={ben} paket={aktar} kapat={() => setAktar(null)} />}
    </Kart>
  );
}

function IcerikDurumu({ p }: { p: Paket }) {
  const { t } = useDil();
  const a = icerikDurumAlani(p);
  if (a === "arsiv")
    return p.yayinlandi ? <Rozet ton="iyi">{t("mtYayinlandi")}</Rozet> : p.yayinlanmadi ? <Rozet ton="kotu">{t("mtYayinlanmadi")}</Rozet> : <Rozet>{t("pmIptal")}</Rozet>;
  if (p.isaret) return <Rozet ton={p.isaret.tur === "yapildi" ? "iyi" : "uyari"}>{t(p.isaret.tur === "yapildi" ? "mtTeslimEdildi" : "mtYapilmadiDedi")}</Rozet>;
  if (a === "hazir") return <Rozet ton="iyi">{t("pmAlanHazir")}</Rozet>;
  if (p.durum === "uretimde") return <Rozet ton="uyari">{t("pmMontajda")}</Rozet>;
  if (a === "uretimde") return <Rozet ton="uyari">{t("mtMuhabirde")}</Rozet>;
  return <Rozet>{t("pmAlanPlanlamada")}</Rozet>;
}

function IcerikKarti({ ben, p, aktar }: { ben: Kisi; p: Paket; aktar: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const prg = p.programBolumu && v.programlar?.find((x) => x.id === p.programBolumu!.programId);
  const arsiv = icerikDurumAlani(p) === "arsiv";
  return (
    <div className="prg-icerik" data-prg-icerik={p.id}>
      <div className="prg-icerik-ust">
        <Rozet ton="tur-program">{t(BICIM_ADI(p.bicim ?? "pkg"))}</Rozet>
        <Icerik>{paketYeri(p)}</Icerik>
        {p.sonTarih && <span className="soluk">· {tarihYaz(p.sonTarih, dil)}</span>}
        <span className="bosluk-esnek" />
        <IcerikDurumu p={p} />
      </div>
      <a href={`#/paketler/${p.id}`} className="prg-icerik-baslik">
        <Icerik blok>{p.baslik}</Icerik>
      </a>
      <div className="prg-icerik-alt">
        <span className="soluk">{p.muhabirId ? ad(kisiBul(v, p.muhabirId)) : t("atanmadi")}</span>
        <span className="bosluk-esnek" />
        {prg ? (
          <Rozet ton="iyi">
            <Tv size={12} /> <Icerik>{prg.ad}</Icerik> · {tarihYaz(p.programBolumu!.tarih, dil)}
          </Rozet>
        ) : (
          !arsiv &&
          icerikAktarabilir(ben, p) && (
            <button type="button" className="dugme dugme-yumusak dugme-kucuk" onClick={aktar} data-prg-aktar={p.id}>
              <Tv size={14} /> {t("pmProgramaAktar")}
            </button>
          )
        )}
        <MasaYayinDugmeleri ben={ben} paket={p} kucuk />
      </div>
    </div>
  );
}

/* Programa aktarma: program ve önümüzdeki dört haftanın bölüm günleri. */
function AktarPenceresi({ ben, paket, kapat, programId }: { ben: Kisi; paket?: Paket; kapat: () => void; programId?: string; tarih?: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const programlar = etkinProgramlar(v);
  const [prg, setPrg] = useState(programId ?? programlar[0]?.id ?? "");
  const p = programlar.find((x) => x.id === prg);
  const B = bugun();
  const gunler = p ? [0, 7, 14, 21].flatMap((n) => haftaninBolumleri(p, gunEkle(B, n))).filter((g) => g >= B) : [];
  const [tarih, setTarih] = useState(gunler[0] ?? "");
  const gecerliTarih = gunler.includes(tarih) ? tarih : gunler[0] ?? "";
  const aktar = () => paket && icerikProgramaAktar(ben, paket.id, prg, gecerliTarih) && (bildir(t("bKaydedildi")), kapat());
  return (
    <Pencere baslik={t("pmProgramaAktar")} kapat={kapat}>
      {!programlar.length ? (
        <Bos metin={t("pmProgramYok")} />
      ) : (
        <div className="form" data-prg-aktar-formu>
          {paket && (
            <p>
              <Icerik blok>{paket.baslik}</Icerik>
            </p>
          )}
          <label>
            {t("pmProgram")}
            <select value={prg} onChange={(e) => setPrg(e.target.value)} data-prg-aktar-program>
              {programlar.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.ad}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("pmBolum")}
            <select value={gecerliTarih} onChange={(e) => setTarih(e.target.value)} data-prg-aktar-tarih>
              {gunler.map((g) => (
                <option key={g} value={g}>
                  {tarihYaz(g, dil, "tam")}
                  {p?.saat ? ` · ${p.saat}` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="form-alt">
            <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
              {t("iptal")}
            </button>
            <button type="button" className="dugme" disabled={!gecerliTarih || !icerikAktarabilir(ben, paket!)} onClick={aktar} data-prg-aktar-onay>
              <Tv size={15} /> {t("pmAktar")}
            </button>
          </div>
        </div>
      )}
    </Pencere>
  );
}

/* --- Öneriler --- */

type OneriSekmesi = "planlamadan" | "bizim" | "arsiv";
function Oneriler({ ben }: { ben: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [sekme, setSekme] = useAdimDurumu<OneriSekmesi>("programlar:oneri", "planlamadan");
  const sorular = (v.masaSorulari ?? []).filter((s) => s.birim === "program");
  const acikSorular = masaninSorulari(v, "program").filter((s) => !s.cevap);
  const cevaplanan = sorular.filter((s) => s.cevap).sort((a, b) => b.cevap!.zaman.localeCompare(a.cevap!.zaman));
  const talepler = masaTalepleri(v, "program");
  const bekleyen = talepler.filter(talepBekliyor);
  const sonuclanan = talepler.filter((p) => !talepBekliyor(p)).sort((a, b) => b.guncelleme.localeCompare(a.guncelleme));
  const sekmeler: { s: OneriSekmesi; ad: Anahtar; n?: number }[] = [
    { s: "planlamadan", ad: "pmPlanlamadan", n: acikSorular.length },
    { s: "bizim", ad: "pmBizim", n: bekleyen.length },
    { s: "arsiv", ad: "pmAlanArsiv" },
  ];
  return (
    <Kart baslik={t("pmOneriler")} ikon={<Lightbulb size={18} />} sagUc={<GorevlendirDugmesi ben={ben} />}>
      <div className="prg-seg" role="tablist">
        {sekmeler.map((x) => (
          <button key={x.s} type="button" role="tab" aria-selected={x.s === sekme} className={x.s === sekme ? "acik" : ""} onClick={() => setSekme(x.s)} data-prg-oneri-sekme={x.s}>
            {t(x.ad)} {x.n !== undefined && <em>{x.n}</em>}
          </button>
        ))}
      </div>
      <div className="prg-oneriler">
        {sekme === "planlamadan" &&
          (acikSorular.length ? acikSorular.map((s) => <SoruKarti key={s.id} ben={ben} oneriId={s.oneriId} not={s.not} zaman={s.zaman} soran={s.soran} />) : <Bos metin={t("kayitYok")} />)}
        {sekme === "bizim" &&
          (bekleyen.length ? (
            bekleyen.map((p) => (
              <div key={p.id} className="prg-oneri" data-prg-talep={p.id}>
                <div className="prg-icerik-ust">
                  <Rozet ton="uyari">{t("pmKararda")}</Rozet>
                  {p.sonTarih && <span className="soluk">· {tarihYaz(p.sonTarih, dil)}</span>}
                </div>
                <a href={`#/paketler/${p.id}`}>
                  <Icerik blok>{p.baslik}</Icerik>
                </a>
                <div className="prg-icerik-alt">
                  <span className="soluk">{ad(kisiBul(v, p.muhabirId))}</span>
                  <span className="bosluk-esnek" />
                  {gorevTalebiGeriCekebilir(ben, p) && (
                    <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => confirm(t("eminMisin")) && gorevTalebiGeriCek(ben, p.id) && bildir(t("bKaydedildi"))}>
                      {t("geriCek")}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <Bos metin={t("kayitYok")} />
          ))}
        {sekme === "arsiv" &&
          (cevaplanan.length + sonuclanan.length === 0 ? (
            <Bos metin={t("kayitYok")} />
          ) : (
            <>
              {cevaplanan.map((s) => {
                const o = oneriBul(v, s.oneriId);
                if (!o) return null;
                const gorev = oneriGorevPaketi(v, o.id);
                return (
                  <div key={s.id} className="prg-oneri soluk-kart" data-prg-arsiv={o.id}>
                    <div className="prg-icerik-ust">
                      <Rozet ton={s.cevap!.kabul ? "iyi" : "kotu"}>{t(s.cevap!.kabul ? "msAldi" : "msAlmadi")}</Rozet>
                      {s.cevap!.kabul && <span className="soluk">· {t(gorev ? "pmIcerigeGecti" : "pmGorevBekleniyor")}</span>}
                    </div>
                    <a href={`#/oneriler/${o.id}`}>
                      <Icerik blok>{o.paketBasligi || o.haberBasligi}</Icerik>
                    </a>
                  </div>
                );
              })}
              {sonuclanan.map((p) => (
                <div key={p.id} className="prg-oneri soluk-kart">
                  <div className="prg-icerik-ust">
                    <Rozet ton={p.gorev ? "iyi" : "kotu"}>{t(p.gorev ? "pmTalepKabul" : "gvReddedildi")}</Rozet>
                  </div>
                  <a href={`#/paketler/${p.id}`}>
                    <Icerik blok>{p.baslik}</Icerik>
                  </a>
                </div>
              ))}
            </>
          ))}
      </div>
    </Kart>
  );
}

/* Planlama'nın sorusu: önerinin başlığı, muhabiri, Planlama'nın notu; "Uygundur / Uygun değildir" notla. */
function SoruKarti({ ben, oneriId, not, zaman, soran }: { ben: Kisi; oneriId: string; not?: string; zaman: string; soran: string }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [karar, setKarar] = useState<boolean | null>(null);
  const [yazi, setYazi] = useState("");
  const o = oneriBul(v, oneriId);
  if (!o) return null;
  const yanitlar = masaYanitlar(ben, o, v);
  const gonder = () => karar !== null && confirm(t("eminMisin")) && masaSorusunuYanitla(ben, o.id, karar, yazi) && (bildir(t("bKaydedildi")), setKarar(null));
  return (
    <div className="prg-oneri" data-prg-soru={o.id}>
      <div className="prg-icerik-ust">
        <Rozet ton="nextday">{t("pmPlanlamaSoruyor")}</Rozet>
        <span className="soluk">
          · {ad(kisiBul(v, soran))} · {tarihYaz(zaman, dil)} {saatYaz(zaman, dil)}
        </span>
      </div>
      <a href={`#/oneriler/${o.id}`}>
        <Icerik blok>{o.paketBasligi || o.haberBasligi}</Icerik>
      </a>
      {not && (
        <p className="soluk" dir="auto">
          {not}
        </p>
      )}
      {karar === null ? (
        <div className="prg-icerik-alt">
          <span className="soluk">{ad(kisiBul(v, o.muhabirId))}</span>
          <span className="bosluk-esnek" />
          {yanitlar && (
            <>
              <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setKarar(false)} data-prg-soru-almadi={o.id}>
                {t("msAlmayiz")}
              </button>
              <button type="button" className="dugme dugme-iyi dugme-kucuk" onClick={() => setKarar(true)} data-prg-soru-aldi={o.id}>
                {t("msAliriz")}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="form form-kutu">
          <label>
            {t("pmNot")}
            <textarea dir="auto" rows={2} value={yazi} onChange={(e) => setYazi(e.target.value)} autoFocus data-prg-soru-not />
          </label>
          <div className="form-alt">
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setKarar(null)}>
              {t("iptal")}
            </button>
            <button type="button" className={`dugme dugme-kucuk ${karar ? "dugme-iyi" : "dugme-kotu"}`} onClick={gonder} data-prg-soru-gonder>
              {t(karar ? "msAliriz" : "msAlmayiz")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Programlar --- */

function Programlar({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [hafta, setHafta] = useAdimDurumu("programlar:hafta", haftaBasi(bugun()));
  const [form, setForm] = useState<ProgramTanimi | "yeni" | null>(null);
  const [aktar, setAktar] = useState<{ programId: string; tarih: string } | null>(null);
  const programlar = etkinProgramlar(v).sort((a, b) => (a.saat ?? "~").localeCompare(b.saat ?? "~"));
  const duzenler = programDuzenler(ben);
  return (
    <Kart
      baslik={t("pmProgramlar")}
      ikon={<Tv size={18} />}
      sagUc={
        <span className="prg-arac">
          <span className="prg-hafta">
            <button type="button" className="dugme dugme-ikincil dugme-ikon" onClick={() => setHafta(gunEkle(hafta, -7))} aria-label={t("pmOncekiHafta")} title={t("pmOncekiHafta")}>
              <ChevronLeft size={16} className="yon" />
            </button>
            <span>
              <CalendarRange size={14} /> <HaftaAdi hafta={hafta} />
            </span>
            <button type="button" className="dugme dugme-ikincil dugme-ikon" onClick={() => setHafta(gunEkle(hafta, 7))} aria-label={t("pmSonrakiHafta")} title={t("pmSonrakiHafta")}>
              <ChevronRight size={16} className="yon" />
            </button>
          </span>
          {duzenler && (
            <button type="button" className="dugme" onClick={() => setForm("yeni")} data-prg-yeni>
              <Plus size={15} /> {t("pmYeniProgram")}
            </button>
          )}
        </span>
      }
    >
      {programlar.length === 0 ? (
        <Bos metin={t("pmProgramYok")} />
      ) : (
        <div className="prg-programlar">
          {programlar.map((p) => (
            <ProgramKarti key={p.id} ben={ben} p={p} hafta={hafta} duzenle={() => setForm(p)} aktar={(tarih) => setAktar({ programId: p.id, tarih })} />
          ))}
        </div>
      )}
      {form && <ProgramFormu ben={ben} p={form === "yeni" ? undefined : form} kapat={() => setForm(null)} />}
      {aktar && <BolumeAktar ben={ben} {...aktar} kapat={() => setAktar(null)} />}
    </Kart>
  );
}

function HaftaAdi({ hafta }: { hafta: string }) {
  const { dil } = useDil();
  const b = haftaBasi(hafta);
  return (
    <>
      {tarihYaz(b, dil)} – {tarihYaz(gunEkle(b, 6), dil)}
    </>
  );
}

function ProgramKarti({ ben, p, hafta, duzenle, aktar }: { ben: Kisi; p: ProgramTanimi; hafta: string; duzenle: () => void; aktar: (tarih: string) => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const bas = haftaBasi(hafta);
  const B = bugun();
  return (
    <div className="prg-program" data-prg-program={p.id}>
      <div className="prg-program-ad">
        <Icerik blok>{p.ad}</Icerik>
        <span className="bosluk-esnek" />
        {(p.saat || p.sure) && <Rozet>{[p.saat, p.sure && t("pmDk", { n: p.sure })].filter(Boolean).join(" · ")}</Rozet>}
        {programDuzenler(ben) && (
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={duzenle} aria-label={t("pmProgramDuzenle")} title={t("pmProgramDuzenle")} data-prg-duzenle={p.id}>
            <Pencil size={14} />
          </button>
        )}
      </div>
      <div className="prg-gunler" aria-label={t("pmYayinGunleri")}>
        {[0, 1, 2, 3, 4, 5, 6].map((g) => (
          <span key={g} className={p.gunler.includes(g) ? "var" : ""}>
            {kisaGunAdi(gunEkle(bas, g), dil)}
          </span>
        ))}
      </div>
      {haftaninBolumleri(p, hafta).map((g) => {
        const ic = bolumIcerikleri(v, p.id, g);
        return (
          <div key={g} className={`prg-bolum${g === B ? " bugun" : ""}`} data-prg-bolum={g}>
            <div className="prg-bolum-bas">
              <b>{tarihYaz(g, dil, "tam")}</b>
              <span className="bosluk-esnek" />
              <Rozet ton={ic.length ? "iyi" : ""}>{ic.length ? t("pmIcerikSayisi", { n: ic.length }) : t("pmBos")}</Rozet>
            </div>
            {ic.map((x) => (
              <div key={x.id} className="prg-bolum-oge">
                <a href={`#/paketler/${x.id}`}>
                  <Icerik>{x.baslik}</Icerik>
                </a>
                <span className="bosluk-esnek" />
                <IcerikDurumu p={x} />
                {icerikAktarabilir(ben, x) && (
                  <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => icerikProgramaAktar(ben, x.id, null) && bildir(t("bKaydedildi"))} aria-label={t("pmBolumdenCikar")} title={t("pmBolumdenCikar")}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            {programDuzenler(ben) && g >= B && (
              <button type="button" className="prg-yuva" onClick={() => aktar(g)} data-prg-yuva={`${p.id}:${g}`}>
                <Plus size={14} /> {t("pmIcerikAktar")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Bölüme içerik aktarma: aktarılmamış, arşivde olmayan içerikler. */
function BolumeAktar({ ben, programId, tarih, kapat }: { ben: Kisi; programId: string; tarih: string; kapat: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const p = v.programlar?.find((x) => x.id === programId);
  const adaylar = masaIcerikleri(v, "program").filter((x) => !x.programBolumu && icerikDurumAlani(x) !== "arsiv" && icerikAktarabilir(ben, x));
  return (
    <Pencere baslik={t("pmIcerikAktar")} alt={p ? `${p.ad} · ${tarihYaz(tarih, dil, "tam")}` : undefined} kapat={kapat}>
      {adaylar.length === 0 ? (
        <Bos metin={t("kayitYok")} />
      ) : (
        <ul className="liste" data-prg-adaylar>
          {adaylar.map((x) => (
            <li key={x.id}>
              <div className="ad">
                <Icerik blok>{x.baslik}</Icerik>
                <small>
                  {ad(kisiBul(v, x.muhabirId))} · {t(ALAN_ADI[icerikDurumAlani(x)])}
                </small>
              </div>
              <button type="button" className="dugme dugme-kucuk" onClick={() => icerikProgramaAktar(ben, x.id, programId, tarih) && (bildir(t("bKaydedildi")), kapat())} data-prg-aday={x.id}>
                {t("pmAktar")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Pencere>
  );
}

function ProgramFormu({ ben, p, kapat }: { ben: Kisi; p?: ProgramTanimi; kapat: () => void }) {
  const { t, dil } = useDil();
  const [f, setF] = useState({ ad: p?.ad ?? "", saat: p?.saat ?? "", sure: p?.sure ? String(p.sure) : "", gunler: p?.gunler ?? [] });
  const bas = haftaBasi(bugun());
  const gecerli = !!f.ad.trim() && f.gunler.length > 0;
  const kaydet = () => {
    if (!gecerli) return;
    if (programKaydet(ben, { id: p?.id, ad: f.ad, saat: f.saat || undefined, sure: Number(f.sure) || undefined, gunler: f.gunler })) {
      bildir(t("bKaydedildi"));
      kapat();
    }
  };
  return (
    <Pencere baslik={t(p ? "pmProgramDuzenle" : "pmYeniProgram")} kapat={kapat}>
      <div className="form" data-prg-formu>
        <label>
          {t("pmProgramAdi")}
          <input {...icerikAlani} value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} placeholder="نافذة على العالم" required data-prg-ad />
        </label>
        <div className="alanlar">
          <label>
            {t("pmYayinSaati")}
            <SaatGirdisi value={f.saat} onChange={(e) => setF({ ...f, saat: e.target.value })} data-prg-saat />
          </label>
          <label>
            {t("pmSure")}
            <input type="number" min={1} inputMode="numeric" value={f.sure} onChange={(e) => setF({ ...f, sure: e.target.value })} data-prg-sure />
          </label>
        </div>
        <fieldset className="prg-gun-secimi">
          <legend>{t("pmYayinGunleri")}</legend>
          {[0, 1, 2, 3, 4, 5, 6].map((g) => (
            <label key={g} className={f.gunler.includes(g) ? "secili" : ""}>
              <input
                type="checkbox"
                checked={f.gunler.includes(g)}
                onChange={(e) => setF({ ...f, gunler: e.target.checked ? [...f.gunler, g] : f.gunler.filter((x) => x !== g) })}
                data-prg-gun={g}
              />
              {kisaGunAdi(gunEkle(bas, g), dil)}
            </label>
          ))}
        </fieldset>
        <div className="form-alt">
          {p && programDuzenler(ben) && (
            <button
              type="button"
              className="dugme dugme-sade"
              onClick={() => confirm(t("pmKaldirOnay")) && programKaldir(ben, p.id) && (bildir(t("bKaydedildi")), kapat())}
              data-prg-kaldir
            >
              <Trash2 size={15} /> {t("pmKaldir")}
            </button>
          )}
          <span className="bosluk-esnek" />
          <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme" disabled={!gecerli} onClick={kaydet} data-prg-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Pencere>
  );
}

