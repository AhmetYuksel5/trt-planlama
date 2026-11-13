import { Calculator, ChevronLeft, ChevronRight, Download, FileSpreadsheet, ListChecks, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { csvMetni } from "../csv";
import { IsKunyesi } from "../bilesenler/Kunye";
import { useState, type ReactNode } from "react";
import { Bos, Icerik, Kart, KisiHucre, Pencere, Rozet, bildir } from "../bilesenler/Parcalar";
import { indir } from "../bilesenler/indir";
import { ayAdi, tarihYaz, useDil, type Anahtar } from "../dil";
import { BICIM_ADI, sehirAdi, sehirUlkesi, ulkeAdi } from "../etiketler";
import { muhasebeAnlasmaKaydet, muhasebeAnlasmaSil, muhasebeIceAktar, muhasebeKapanisKaydet, muhasebeTanimKaydet, muhasebeTanimSil } from "../eylemler";
import { xlsxOku } from "../iceAktar";
import { anlasmaBul, anlasmaTaslaklari, ayKaydir, aylikDokum, muhabirAylari, isaretsizCanlilar, muhasebeKisileri, tanimlar, type AnlasmaSatiri, type AylikDokum } from "../muhasebe";
import { sozcuklerUyar as aramaUyar } from "../arama";
import { bugun } from "../tarih";
import { ANLASMA_TURLERI, BICIMLER, useVeri, type AnlasmaTuru, type Kisi, type MuhasebeAnlasmasi, type MuhasebeIs, type MuhasebeTanimi } from "../veri";
import { git, penceredenGit, useAdimDurumu } from "../yol";
import { SayfaBasi } from "./ana/Planlama";

/*
 * Muhasebe (News Gathering'in alt birimi; kurallar muhasebe.ts): kendine özel
 * sayfa. Aylık döküm (muhabir başına iş sayısı, kota, ödeme; ayrıntı satırın
 * içinde saklı), muhabirlerin anlaşmaları (Excel gibi tablo, ilk kurulumda
 * Excel'den aktarma) ve muhasebenin kendi tanımları (fiyat türleri, ödeme
 * araçları, para birimleri). Kayıtlar gizli: firestore.rules → muhasebeci.
 */

const SEKMELER = ["dokum", "muhabir", "muhabirler", "tanimlar"] as const;
type Sekme = (typeof SEKMELER)[number];
const SEKME_ADI: Record<Sekme, Anahtar> = { dokum: "mhDokum", muhabir: "mhMuhabirDokumu", muhabirler: "mhMuhabirler", tanimlar: "mhTanimlar" };
const TUR_ADI: Record<AnlasmaTuru, Anahtar> = { sabit: "mhSabit", parca: "mhParca", aylik: "mhAylik" };
/* Muhasebenin saydığı iş türleri: paketin haber türleri ve canlı (BICIMLER'de var). */
const IS_TURLERI: readonly MuhasebeIs[] = BICIMLER;

const sayiYaz = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
const tutarYaz = (n: number | null | undefined, para?: string) => (n === null || n === undefined ? "–" : `${sayiYaz(n)}${para ? ` ${para}` : ""}`);
const sayiOku = (s: string): number | undefined => {
  const n = Number(s.replace(",", "."));
  return s.trim() && Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function Muhasebe({ ben, sekme, kisiId }: { ben: Kisi; sekme: string; kisiId?: string }) {
  const { t } = useDil();
  const s: Sekme = (SEKMELER as readonly string[]).includes(sekme) ? (sekme as Sekme) : "dokum";
  return (
    <>
      <SayfaBasi ikon={<Calculator size={26} />} baslik={t("mMuhasebe")} />
      <div className="sekmeler muhasebe-sekmeler" role="tablist" aria-label={t("mMuhasebe")}>
        {SEKMELER.map((x) => (
          <button key={x} type="button" role="tab" aria-selected={s === x} className={s === x ? "acik" : ""} onClick={() => git(`muhasebe/${x}`)} data-mh-sekme={x}>
            {t(SEKME_ADI[x])}
          </button>
        ))}
      </div>
      {s === "dokum" && <AylikDokumSayfasi ben={ben} />}
      {s === "muhabir" && <MuhabirSayfasi key={kisiId ?? ""} ben={ben} kisiId={kisiId} />}
      {s === "muhabirler" && <Anlasmalar ben={ben} />}
      {s === "tanimlar" && <Tanimlar ben={ben} />}
    </>
  );
}

/* --- Aylık döküm --- */

function AylikDokumSayfasi({ ben }: { ben: Kisi }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const [ay, setAy] = useAdimDurumu("muhasebe:ay", () => bugun().slice(0, 7));
  const [ara, setAra] = useAdimDurumu("muhasebe:ara", "");
  const satirlar = muhasebeKisileri(v)
    .map((k) => aylikDokum(v, k, ay))
    .filter((x) => x.anlasma || x.isler.length)
    .filter((x) => !ara.trim() || aramaUyar(ad(x.kisi), ara) || aramaUyar(typeof x.kisi.ad === "string" ? x.kisi.ad : x.kisi.ad.tr, ara))
    // Anlaşması olan önce: muhasebenin işi onlar; anlaşmasız iş yapan altta, işaretli.
    .sort((a, b) => Number(!a.anlasma) - Number(!b.anlasma) || ad(a.kisi).localeCompare(ad(b.kisi), "ar"));
  const isaretsiz = muhasebeKisileri(v).reduce((n, k) => n + isaretsizCanlilar(v, k.id, ay, bugun()).length, 0);
  const toplamlar = new Map<string, number>();
  for (const x of satirlar) if (x.odeme !== null) toplamlar.set(x.anlasma?.para ?? "", (toplamlar.get(x.anlasma?.para ?? "") ?? 0) + x.odeme);
  // Onay ve ödeme yalnız anlaşmalıda var: oran onların içinden.
  const anlasmali = satirlar.filter((x) => x.anlasma).length;
  const onayli = satirlar.filter((x) => x.kapanis?.onay).length;
  const odenen = satirlar.filter((x) => x.kapanis?.odendi).length;

  const excel = () => {
    const bas = [t("mhMuhabir"), t("mhUlke"), t("mhAnlasma"), "PKG", t("mhDigerIs"), t("mhCanli"), t("mhKota"), t("mhOdeme"), t("mhPara"), t("mhOdemeAraci"), t("mhOnay"), t("mhOdendi")];
    const satir = (x: AylikDokum) => [
      ad(x.kisi),
      t(ulkeAdi(sehirUlkesi(x.kisi.sehir))),
      x.anlasma ? t(TUR_ADI[x.anlasma.tur]) : "",
      String(x.turler.pkg ?? 0),
      String(x.paket - (x.turler.pkg ?? 0)),
      String(x.canli),
      [x.kotaPaket, x.kotaCanli].map((k) => (k === undefined ? "" : String(k))).join(" / "),
      x.odeme === null ? "" : String(x.odeme),
      x.anlasma?.para ?? "",
      x.anlasma?.odeme ?? "",
      x.kapanis?.onay ? "✓" : "",
      x.kapanis?.odendi ? "✓" : "",
    ];
    indir(`muhasebe-${ay}.csv`, csvMetni([bas, ...satirlar.map(satir)], dil), "text/csv;charset=utf-8");
  };

  return (
    <>
      <div className="muhasebe-ust">
        <div className="muhasebe-ay" data-mh-ay={ay}>
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setAy(ayKaydir(ay, -1))} aria-label={t("mhOncekiAy")} title={t("mhOncekiAy")}>
            <ChevronLeft size={18} className="yon" />
          </button>
          <strong>{ayAdi(`${ay}-01`, dil, "yil")}</strong>
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setAy(ayKaydir(ay, 1))} aria-label={t("mhSonrakiAy")} title={t("mhSonrakiAy")}>
            <ChevronRight size={18} className="yon" />
          </button>
        </div>
        <label className="muhasebe-ara">
          <Search size={16} className="sonuk" aria-hidden="true" />
          <input type="search" value={ara} onChange={(e) => setAra(e.target.value)} placeholder={t("mhAra")} aria-label={t("mhAra")} />
        </label>
        <button type="button" className="dugme dugme-ikincil" onClick={excel} disabled={!satirlar.length} data-mh-excel>
          <Download size={16} /> {t("mhExcelIndir")}
        </button>
      </div>
      <div className="muhasebe-ozet" data-mh-ozet>
        <span>
          {t("mhToplam")}: <b>{[...toplamlar].map(([p, n]) => tutarYaz(n, p)).join(" · ") || "–"}</b>
        </span>
        <span>
          {t("mhOnay")}: <b>{onayli}/{anlasmali}</b>
        </span>
        <span>
          {t("mhOdendi")}: <b>{odenen}/{anlasmali}</b>
        </span>
        {isaretsiz > 0 && (
          <span className="uyari-yazi" data-mh-isaretsiz={isaretsiz}>
            {t("mhIsaretsizCanli", { n: isaretsiz })}
          </span>
        )}
      </div>
      {satirlar.length === 0 ? (
        <Bos metin={t("mhDokumBos")} />
      ) : (
        <div className="muhasebe-liste" data-mh-liste>
          {satirlar.map((x) => (
            <DokumSatiri key={x.kisi.id} x={x} ay={ay} ben={ben} />
          ))}
        </div>
      )}
    </>
  );
}

function DokumSatiri({ x, ay, ben }: { x: AylikDokum; ay: string; ben: Kisi }) {
  const { t } = useDil();
  const a = x.anlasma;
  const digerTurler = Object.entries(x.turler).filter(([k]) => k !== "pkg" && k !== "canli") as [MuhasebeIs, number][];
  const kota = (yapilan: number, k?: number) => (k === undefined ? String(yapilan) : `${yapilan}/${k}`);
  return (
    <details className={`muhasebe-satir${x.kotaAlti ? " kota-alti" : ""}`} data-mh-kisi={x.kisi.id}>
      <summary>
        <KisiHucre kisi={x.kisi} alt={a ? t(TUR_ADI[a.tur]) : <span className="uyari-yazi">{t("mhAnlasmaYok")}</span>} />
        <span className="muhasebe-sayilar">
          <span title="PKG">
            <small>PKG</small> <b data-mh-pkg>{x.turler.pkg ?? 0}</b>
          </span>
          {digerTurler.map(([k, n]) => (
            <span key={k}>
              <small>{t(BICIM_ADI(k))}</small> <b>{n}</b>
            </span>
          ))}
          <span>
            <small>{t("mhCanli")}</small> <b data-mh-canli>{x.canli}</b>
          </span>
          {(x.kotaPaket !== undefined || x.kotaCanli !== undefined) && (
            <span className={x.kotaAlti ? "uyari-yazi" : ""} data-mh-kota>
              <small>{t("mhKota")}</small> <b>{[kota(x.paket, x.kotaPaket), kota(x.canli, x.kotaCanli)].join(" · ")}</b>
            </span>
          )}
        </span>
        <span className="muhasebe-odeme">
          <b data-mh-odeme>{tutarYaz(x.odeme, a?.para)}</b>
          {x.ekOdeme > 0 && <small>{t("mhEkOdeme", { n: tutarYaz(x.ekOdeme, a?.para) })}</small>}
          {x.fiyatsiz > 0 && <small className="uyari-yazi">{t("mhFiyatsiz", { n: x.fiyatsiz })}</small>}
        </span>
        <span className="muhasebe-durum">
          {x.kapanis?.odendi ? <Rozet ton="iyi">{t("mhOdendi")}</Rozet> : x.kapanis?.onay ? <Rozet ton="vurgu">{t("mhOnaylandi")}</Rozet> : null}
        </span>
      </summary>
      <DokumAyrintisi x={x} ay={ay} ben={ben} />
      <div className="muhasebe-git">
        <MuhabireGit kisiId={x.kisi.id} yazili />
      </div>
    </details>
  );
}

/*
 * Ayın işleri ve kapanışı: döküm satırının içinde ve muhabir sayfasında aynı
 * gövde, onay ve kota iki yerde ayrı davranmasın.
 */
function DokumAyrintisi({ x, ay, ben, tur }: { x: AylikDokum; ay: string; ben: Kisi; tur?: MuhasebeIs | "" }) {
  const { t, dil } = useDil();
  const a = x.anlasma;
  const isler = tur ? x.isler.filter((i) => i.tur === tur) : x.isler;
  return (
    <div className="muhasebe-ayrinti">
      {isler.length === 0 ? (
        <p className="sonuk">{t("mhIsYok")}</p>
      ) : (
        <ol className="muhasebe-isler" data-mh-isler>
          {isler.map((i) => (
            <li key={i.id}>
              {/* Künye satırın içinde: muhasebeci paket sayfasını açamıyor. */}
              <details className="muhasebe-is" data-mh-is={i.id}>
                <summary>
                  <small>{tarihYaz(i.tarih, dil)}</small>
                  <Rozet>{t(BICIM_ADI(i.tur))}</Rozet>
                  <Icerik>{i.baslik}</Icerik>
                </summary>
                <IsKunyesi kaynak={i.kaynak} id={i.id} />
              </details>
            </li>
          ))}
        </ol>
      )}
      <div className="muhasebe-kapanis">
        {a && a.tur !== "parca" && <AyKotasi x={x} ay={ay} ben={ben} />}
        <div className="dugmeler">
          <button type="button" className={`dugme ${x.kapanis?.onay ? "dugme-ikincil" : "dugme-birincil"}`} onClick={() => muhasebeKapanisKaydet(ben, ay, x.kisi.id, { onay: !x.kapanis?.onay })} disabled={!a} data-mh-onay>
            {t(x.kapanis?.onay ? "mhOnayKaldir" : "mhOnayla")}
          </button>
          <button type="button" className="dugme dugme-ikincil" onClick={() => muhasebeKapanisKaydet(ben, ay, x.kisi.id, { odendi: !x.kapanis?.odendi })} disabled={!x.kapanis?.onay} data-mh-odendi>
            {t(x.kapanis?.odendi ? "mhOdendiKaldir" : "mhOdendiIsaretle")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Kota aylık belirleniyor (kullanıcı): anlaşmadaki kota varsayılan, bu ay için değiştirilir. */
function AyKotasi({ x, ay, ben }: { x: AylikDokum; ay: string; ben: Kisi }) {
  const { t } = useDil();
  const kaydet = (k: "kotaPaket" | "kotaCanli", s: string) => {
    const n = sayiOku(s);
    const eski = x.kapanis?.[k];
    if (n === eski || (n === undefined && eski === undefined)) return;
    muhasebeKapanisKaydet(ben, ay, x.kisi.id, { [k]: n === undefined ? null : n });
  };
  return (
    <div className="muhasebe-ay-kota" data-mh-ay-kota>
      <small>{t("mhBuAyKota")}</small>
      <label>
        PKG
        <input type="number" min={0} inputMode="numeric" defaultValue={x.kapanis?.kotaPaket ?? ""} placeholder={x.anlasma?.kotaPaket === undefined ? "–" : String(x.anlasma.kotaPaket)} onBlur={(e) => kaydet("kotaPaket", e.target.value)} />
      </label>
      <label>
        {t("mhCanli")}
        <input type="number" min={0} inputMode="numeric" defaultValue={x.kapanis?.kotaCanli ?? ""} placeholder={x.anlasma?.kotaCanli === undefined ? "–" : String(x.anlasma.kotaCanli)} onBlur={(e) => kaydet("kotaCanli", e.target.value)} />
      </label>
    </div>
  );
}

/* --- Muhabir dökümü: tek muhabirin ay ay işleri --- */

function MuhabireGit({ kisiId, yazili }: { kisiId: string; yazili?: boolean }) {
  const { t } = useDil();
  return (
    <button type="button" className={`dugme dugme-sade ${yazili ? "dugme-kucuk" : "dugme-ikon"}`} onClick={() => git(`muhasebe/muhabir/${encodeURIComponent(kisiId)}`)} aria-label={t("mhMuhabirinIsleri")} title={t("mhMuhabirinIsleri")} data-mh-muhabire={kisiId}>
      <ListChecks size={16} /> {yazili && t("mhMuhabirinIsleri")}
    </button>
  );
}

/*
 * Kullanıcı: muhabiri tek tek seçip işlerini görmek istedi; aylık döküm bütün
 * muhabirleri tek ayda gösteriyordu. Burada seçilen muhabirin anlaşması, ay ay
 * özeti (ilk işinden bu aya) ve seçilen ayın işleri tür süzgeciyle.
 */
function MuhabirSayfasi({ ben, kisiId }: { ben: Kisi; kisiId?: string }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const kisiler = [...muhasebeKisileri(v)].sort((a, b) => ad(a).localeCompare(ad(b), "ar"));
  const kisi = kisiId ? v.kisiler.find((k) => k.id === kisiId) : undefined;
  const buAy = bugun().slice(0, 7);
  const [secili, setSecili] = useAdimDurumu("muhasebeMuhabir:ay", buAy);
  const [tur, setTur] = useAdimDurumu<MuhasebeIs | "">("muhasebeMuhabir:tur", "");
  const [duzen, setDuzen] = useState(false);
  const secim = (
    <label className="muhasebe-kisi-secimi">
      <span className="sonuk">{t("mhMuhabir")}</span>
      <select value={kisi?.id ?? ""} onChange={(e) => git(e.target.value ? `muhasebe/muhabir/${encodeURIComponent(e.target.value)}` : "muhasebe/muhabir")} data-mh-muhabir-sec>
        <option value="">{t("mhMuhabirSec")}</option>
        {kisi && !kisiler.includes(kisi) && <option value={kisi.id}>{ad(kisi)}</option>}
        {kisiler.map((k) => (
          <option key={k.id} value={k.id}>
            {ad(k)}
          </option>
        ))}
      </select>
    </label>
  );
  if (!kisi)
    return (
      <>
        <div className="muhasebe-ust">{secim}</div>
        <Bos metin={t("mhMuhabirSec")} />
      </>
    );
  const a = anlasmaBul(v, kisi.id);
  const aylar = muhabirAylari(v, kisi.id, buAy);
  const ay = aylar.includes(secili) ? secili : aylar[0];
  const dokumler = aylar.map((x) => aylikDokum(v, kisi, x));
  const x = dokumler[aylar.indexOf(ay)];
  const toplam = dokumler.reduce((n, d) => n + d.isler.length, 0);
  const turler = [...new Set(x.isler.map((i) => i.tur))];
  return (
    <>
      <div className="muhasebe-ust">{secim}</div>
      <Kart>
        <div className="muhasebe-kunye" data-mh-kunye={kisi.id}>
          <KisiHucre kisi={kisi} alt={sehirAdi(kisi.sehir)} />
          <span>
            <small className="sonuk">{t("mhAnlasma")}</small>
            <b>{a ? t(TUR_ADI[a.tur]) : <span className="uyari-yazi">{t("mhAnlasmaYok")}</span>}</b>
          </span>
          {a && a.tur !== "parca" && (
            <span>
              <small className="sonuk">{t("mhTutar")}</small>
              <b>{tutarYaz(a.tutar, a.para)}</b>
            </span>
          )}
          {a && a.tur !== "parca" && (
            <span>
              <small className="sonuk">{t("mhKota")}</small>
              <b>{`${a.kotaPaket ?? "–"} PKG · ${a.kotaCanli ?? "–"} ${t("mhCanli")}`}</b>
            </span>
          )}
          {a?.odeme && (
            <span>
              <small className="sonuk">{t("mhOdemeAraci")}</small>
              <b>{a.odeme}</b>
            </span>
          )}
          <span>
            <small className="sonuk">{t("mhToplamIs")}</small>
            <b data-mh-toplam-is>{toplam}</b>
          </span>
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setDuzen(true)} aria-label={t("duzenle")} title={t("duzenle")} data-mh-kunye-duzenle>
            <Pencil size={16} />
          </button>
        </div>
      </Kart>
      <Kart>
        <table className="tablo kartli muhasebe-aylar" data-mh-aylar>
          <thead>
            <tr>
              <th>{t("mhAy")}</th>
              <th>PKG</th>
              <th>{t("mhDigerIs")}</th>
              <th>{t("mhCanli")}</th>
              <th>{t("mhKota")}</th>
              <th>{t("mhOdeme")}</th>
              <th aria-label={t("mhOnay")} />
            </tr>
          </thead>
          <tbody>
            {dokumler.map((d, i) => {
              const pkg = d.turler.pkg ?? 0;
              return (
                <tr key={aylar[i]} className={`${aylar[i] === ay ? "secili" : ""}${d.kotaAlti ? " kota-alti" : ""}`} onClick={() => setSecili(aylar[i])} aria-selected={aylar[i] === ay} data-mh-ay-satir={aylar[i]}>
                  <td className="birincil">
                    <button type="button" className="dugme-metin" onClick={() => setSecili(aylar[i])}>
                      {ayAdi(`${aylar[i]}-01`, dil, "yil")}
                    </button>
                  </td>
                  <td data-etiket="PKG">{pkg}</td>
                  <td data-etiket={t("mhDigerIs")}>{d.paket - pkg}</td>
                  <td data-etiket={t("mhCanli")}>{d.canli}</td>
                  <td data-etiket={t("mhKota")} className={d.kotaAlti ? "uyari-yazi" : ""}>
                    {d.kotaPaket === undefined && d.kotaCanli === undefined ? "–" : `${d.paket}/${d.kotaPaket ?? "–"} · ${d.canli}/${d.kotaCanli ?? "–"}`}
                  </td>
                  <td data-etiket={t("mhOdeme")}>{tutarYaz(d.odeme, d.anlasma?.para)}</td>
                  <td data-etiket={t("mhOnay")}>
                    {d.kapanis?.odendi ? <Rozet ton="iyi">{t("mhOdendi")}</Rozet> : d.kapanis?.onay ? <Rozet ton="vurgu">{t("mhOnaylandi")}</Rozet> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Kart>
      <Kart baslik={ayAdi(`${ay}-01`, dil, "yil")}>
        {turler.length > 1 && (
          <div className="cipler muhasebe-turler" role="group" aria-label={t("mhIsTuru")} data-mh-tur-suzgec>
            <button type="button" className={`cip cip-dugme${tur === "" ? " secili" : ""}`} aria-pressed={tur === ""} onClick={() => setTur("")}>
              {t("mhHepsi")} · {x.isler.length}
            </button>
            {turler.map((k) => (
              <button key={k} type="button" className={`cip cip-dugme${tur === k ? " secili" : ""}`} aria-pressed={tur === k} onClick={() => setTur(k)} data-mh-tur={k}>
                {t(BICIM_ADI(k))} · {x.isler.filter((i) => i.tur === k).length}
              </button>
            ))}
          </div>
        )}
        <DokumAyrintisi x={x} ay={ay} ben={ben} tur={turler.includes(tur as MuhasebeIs) ? tur : ""} />
      </Kart>
      {duzen && <AnlasmaFormu ben={ben} kisi={kisi} kapat={() => setDuzen(false)} />}
    </>
  );
}

/* --- Muhabirler ve anlaşmalar (Excel gibi tablo) --- */

function Anlasmalar({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [ara, setAra] = useAdimDurumu("muhasebeAnlasma:ara", "");
  const [duzen, setDuzen] = useState<Kisi | null>(null);
  const [aktar, setAktar] = useState(false);
  const kisiler = muhasebeKisileri(v)
    .filter((k) => !ara.trim() || aramaUyar(ad(k), ara) || aramaUyar(typeof k.ad === "string" ? k.ad : k.ad.tr, ara))
    .sort((a, b) => ad(a).localeCompare(ad(b), "ar"));
  return (
    <>
      <div className="muhasebe-ust">
        <label className="muhasebe-ara">
          <Search size={16} className="sonuk" aria-hidden="true" />
          <input type="search" value={ara} onChange={(e) => setAra(e.target.value)} placeholder={t("mhAra")} aria-label={t("mhAra")} />
        </label>
        <button type="button" className="dugme dugme-ikincil" onClick={() => setAktar(true)} data-mh-aktar-ac>
          <FileSpreadsheet size={16} /> {t("mhExceldenAktar")}
        </button>
      </div>
      <Kart>
        {kisiler.length === 0 ? (
          <Bos kucuk metin={t("kayitYok")} />
        ) : (
          <table className="tablo kartli" data-mh-anlasmalar>
            <thead>
              <tr>
                <th>{t("mhMuhabir")}</th>
                <th>{t("mhUlke")}</th>
                <th>{t("mhAnlasma")}</th>
                <th>{t("mhTutar")}</th>
                <th>{t("mhKota")}</th>
                <th>{t("mhOdemeAraci")}</th>
                <th aria-label={t("duzenle")} />
              </tr>
            </thead>
            <tbody>
              {kisiler.map((k) => {
                const a = anlasmaBul(v, k.id);
                return (
                  <tr key={k.id} data-mh-anlasma={k.id}>
                    <td className="birincil" data-etiket={t("mhMuhabir")}>
                      <KisiHucre kisi={k} alt={sehirAdi(k.sehir)} />
                    </td>
                    <td data-etiket={t("mhUlke")}>{t(ulkeAdi(sehirUlkesi(k.sehir)))}</td>
                    <td data-etiket={t("mhAnlasma")}>{a ? t(TUR_ADI[a.tur]) : <span className="sonuk">{t("mhAnlasmaYok")}</span>}</td>
                    <td data-etiket={t("mhTutar")}>{a?.tur === "parca" ? t("mhFiyatli") : tutarYaz(a?.tutar, a?.para)}</td>
                    <td data-etiket={t("mhKota")}>{a && a.tur !== "parca" ? `${a.kotaPaket ?? "–"} PKG · ${a.kotaCanli ?? "–"} ${t("mhCanli")}` : "–"}</td>
                    <td data-etiket={t("mhOdemeAraci")}>{a?.odeme ?? "–"}</td>
                    <td className="muhasebe-araclar">
                      <MuhabireGit kisiId={k.id} />
                      <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setDuzen(k)} aria-label={t("duzenle")} title={t("duzenle")} data-mh-duzenle={k.id}>
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Kart>
      {duzen && <AnlasmaFormu ben={ben} kisi={duzen} kapat={() => setDuzen(null)} />}
      {aktar && <ExceldenAktar ben={ben} kapat={() => setAktar(false)} />}
    </>
  );
}

function SecimVeYeni({ tur, deger, degistir, etiket, ben, veri }: { tur: "para" | "odeme"; deger: string; degistir: (s: string) => void; etiket: string; ben: Kisi; veri: string }) {
  const { t } = useDil();
  const v = useVeri();
  const l = tanimlar(v, tur);
  const [yeni, setYeni] = useState("");
  const [yeniAcik, setYeniAcik] = useState(false);
  return (
    <label>
      {etiket}
      {yeniAcik ? (
        <span className="satir-alani">
          <input value={yeni} onChange={(e) => setYeni(e.target.value)} autoFocus />
          <button
            type="button"
            className="dugme dugme-ikincil"
            onClick={() => {
              if (muhasebeTanimKaydet(ben, { tur, ad: yeni })) {
                degistir(yeni.trim());
                setYeniAcik(false);
                setYeni("");
              }
            }}
          >
            {t("ekle")}
          </button>
        </span>
      ) : (
        <select
          value={deger}
          onChange={(e) => (e.target.value === "__yeni" ? setYeniAcik(true) : degistir(e.target.value))}
          data-mh-secim={veri}
        >
          <option value="">–</option>
          {/* Tanımı sonradan silinmiş değer kayıtta kalır, seçili görünsün. */}
          {deger && !l.some((x) => x.ad === deger) && <option value={deger}>{deger}</option>}
          {l.map((x) => (
            <option key={x.id} value={x.ad}>
              {x.ad}
            </option>
          ))}
          <option value="__yeni">{t("mhYeniTanim")}</option>
        </select>
      )}
    </label>
  );
}

function AnlasmaFormu({ ben, kisi, kapat }: { ben: Kisi; kisi: Kisi; kapat: () => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const eski = anlasmaBul(v, kisi.id);
  const fiyatTurleri = tanimlar(v, "fiyat");
  const [tur, setTur] = useState<AnlasmaTuru>(eski?.tur ?? "parca");
  const [tutar, setTutar] = useState(eski?.tutar === undefined ? "" : String(eski.tutar));
  const [para, setPara] = useState(eski?.para ?? "");
  const [odeme, setOdeme] = useState(eski?.odeme ?? "");
  const [kotaPaket, setKotaPaket] = useState(eski?.kotaPaket === undefined ? "" : String(eski.kotaPaket));
  const [kotaCanli, setKotaCanli] = useState(eski?.kotaCanli === undefined ? "" : String(eski.kotaCanli));
  const [fiyatlar, setFiyatlar] = useState<Record<string, string>>(Object.fromEntries(Object.entries(eski?.fiyatlar ?? {}).map(([k, n]) => [k, String(n)])));
  const [not, setNot] = useState(eski?.not ?? "");
  const kaydet = () => {
    const f = Object.fromEntries(Object.entries(fiyatlar).flatMap(([k, s]) => (sayiOku(s) === undefined ? [] : [[k, sayiOku(s)!]])));
    const a: MuhasebeAnlasmasi = {
      id: kisi.id,
      tur,
      ...(tur !== "parca" && sayiOku(tutar) !== undefined && { tutar: sayiOku(tutar) }),
      ...(para && { para }),
      ...(odeme && { odeme }),
      ...(tur !== "parca" && sayiOku(kotaPaket) !== undefined && { kotaPaket: sayiOku(kotaPaket) }),
      ...(tur !== "parca" && sayiOku(kotaCanli) !== undefined && { kotaCanli: sayiOku(kotaCanli) }),
      ...(Object.keys(f).length && { fiyatlar: f }),
      ...(not.trim() && { not: not.trim() }),
    };
    if (muhasebeAnlasmaKaydet(ben, a)) {
      bildir(t("bKaydedildi"));
      kapat();
    }
  };
  return (
    <Pencere
      baslik={ad(kisi)}
      alt={t(ulkeAdi(sehirUlkesi(kisi.sehir)))}
      kapat={kapat}
      altBilgi={
        <>
          {eski && (
            <button
              type="button"
              className="dugme dugme-sade dugme-kotu"
              onClick={() => {
                if (confirm(t("mhAnlasmaSilOnay")) && muhasebeAnlasmaSil(ben, kisi.id)) kapat();
              }}
            >
              <Trash2 size={16} /> {t("mhAnlasmaSil")}
            </button>
          )}
          <button type="button" className="dugme dugme-birincil" onClick={kaydet} data-mh-kaydet>
            {t("kaydet")}
          </button>
        </>
      }
    >
      <div className="muhasebe-form" data-mh-form>
        <label>
          {t("mhAnlasma")}
          <select value={tur} onChange={(e) => setTur(e.target.value as AnlasmaTuru)} data-mh-tur>
            {ANLASMA_TURLERI.map((x) => (
              <option key={x} value={x}>
                {t(TUR_ADI[x])}
              </option>
            ))}
          </select>
        </label>
        {tur !== "parca" && (
          <label>
            {t("mhAylikTutar")}
            <input type="number" min={0} inputMode="decimal" value={tutar} onChange={(e) => setTutar(e.target.value)} data-mh-tutar />
          </label>
        )}
        <SecimVeYeni tur="para" deger={para} degistir={setPara} etiket={t("mhPara")} ben={ben} veri="para" />
        <SecimVeYeni tur="odeme" deger={odeme} degistir={setOdeme} etiket={t("mhOdemeAraci")} ben={ben} veri="odeme" />
        {tur !== "parca" && (
          <div className="ikili-alan">
            <label>
              {t(tur === "sabit" ? "mhMinKotaPaket" : "mhKotaPaket")}
              <input type="number" min={0} inputMode="numeric" value={kotaPaket} onChange={(e) => setKotaPaket(e.target.value)} data-mh-kota-paket />
            </label>
            <label>
              {t(tur === "sabit" ? "mhMinKotaCanli" : "mhKotaCanli")}
              <input type="number" min={0} inputMode="numeric" value={kotaCanli} onChange={(e) => setKotaCanli(e.target.value)} data-mh-kota-canli />
            </label>
          </div>
        )}
        {/* Sabit maaşta iş başına ücret yok; parça başında her iş, aylıkta kotayı aşan iş için. */}
        {tur !== "sabit" && (
          <fieldset className="muhasebe-fiyatlar">
            <legend>{t(tur === "parca" ? "mhIsBasiFiyat" : "mhKotaAsimFiyat")}</legend>
            {fiyatTurleri.length === 0 ? (
              <p className="sonuk">
                {t("mhFiyatTuruYok")}{" "}
                <a href="#/muhasebe/tanimlar" onClick={(e) => penceredenGit(e, kapat, "#/muhasebe/tanimlar")}>
                  {t("mhTanimlar")}
                </a>
              </p>
            ) : (
              fiyatTurleri.map((f) => (
                <label key={f.id}>
                  {f.ad}
                  <input type="number" min={0} inputMode="decimal" value={fiyatlar[f.id] ?? ""} onChange={(e) => setFiyatlar((x) => ({ ...x, [f.id]: e.target.value }))} data-mh-fiyat={f.id} />
                </label>
              ))
            )}
          </fieldset>
        )}
        <label>
          {t("not")}
          <textarea dir="auto" rows={2} value={not} onChange={(e) => setNot(e.target.value)} />
        </label>
      </div>
    </Pencere>
  );
}

/* İlk kurulum: muhasebenin elindeki liste Excel'den; kişi e-postayla ya da adla eşlenir, gerçek bilgi yalnız kayda girer. */
function ExceldenAktar({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [satirlar, setSatirlar] = useState<AnlasmaSatiri[] | null>(null);
  const kisi = (id?: string) => v.kisiler.find((k) => k.id === id);
  const uygun = (satirlar ?? []).filter((s) => s.kisiId && s.tur);
  return (
    <Pencere
      baslik={t("mhExceldenAktar")}
      kapat={kapat}
      genis
      altBilgi={
        satirlar && (
          <button
            type="button"
            className="dugme dugme-birincil"
            disabled={!uygun.length}
            onClick={() => {
              const n = muhasebeIceAktar(ben, uygun);
              bildir(t("mhAktarildi", { n }));
              kapat();
            }}
            data-mh-aktar
          >
            {t("mhAktar", { n: uygun.length })}
          </button>
        )
      }
    >
      <input
        type="file"
        accept=".xlsx"
        data-mh-dosya
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            setSatirlar(anlasmaTaslaklari(await xlsxOku(await f.arrayBuffer()), v.kisiler.filter((k) => !k.pasif)));
          } catch {
            bildir(t("mhDosyaOkunamadi"));
          }
        }}
      />
      {satirlar && satirlar.length === 0 && <p className="uyari-yazi">{t("mhSutunYok")}</p>}
      {satirlar && satirlar.length > 0 && (
        <table className="tablo kartli" data-mh-onizleme>
          <thead>
            <tr>
              <th>{t("mhMuhabir")}</th>
              <th>{t("mhAnlasma")}</th>
              <th>{t("mhTutar")}</th>
              <th>{t("mhOdemeAraci")}</th>
              <th>{t("durum")}</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map((s) => {
              const k = kisi(s.kisiId);
              const durum: ReactNode = !k ? <span className="uyari-yazi">{t("mhBulunamadi")}</span> : !s.tur ? <span className="uyari-yazi">{t("mhTurOkunamadi")}</span> : <span>✓</span>;
              return (
                <tr key={s.satir} data-mh-onizleme-satir={s.kisiId ? "eslesti" : "yok"}>
                  <td className="birincil" data-etiket={t("mhMuhabir")}>
                    {k ? ad(k) : s.ad || s.eposta}
                  </td>
                  <td data-etiket={t("mhAnlasma")}>{s.tur ? t(TUR_ADI[s.tur]) : "–"}</td>
                  <td data-etiket={t("mhTutar")}>{tutarYaz(s.tutar, s.para)}</td>
                  <td data-etiket={t("mhOdemeAraci")}>{s.odeme ?? "–"}</td>
                  <td data-etiket={t("durum")}>{durum}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Pencere>
  );
}

/* --- Tanımlar: fiyat türleri, ödeme araçları, para birimleri (muhasebe girer) --- */

function Tanimlar({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  return (
    <div className="muhasebe-tanimlar">
      <TanimListesi ben={ben} tur="fiyat" baslik={t("mhFiyatTurleri")} />
      <TanimListesi ben={ben} tur="odeme" baslik={t("mhOdemeAraclari")} />
      <TanimListesi ben={ben} tur="para" baslik={t("mhParaBirimleri")} />
    </div>
  );
}

function TanimListesi({ ben, tur, baslik }: { ben: Kisi; tur: MuhasebeTanimi["tur"]; baslik: string }) {
  const { t } = useDil();
  const v = useVeri();
  const l = tanimlar(v, tur);
  const [yeni, setYeni] = useState("");
  const [duzen, setDuzen] = useState<MuhasebeTanimi | null>(null);
  const ekle = () => {
    if (tur === "fiyat") setDuzen({ id: "", tur, ad: yeni, isler: [] });
    else if (muhasebeTanimKaydet(ben, { tur, ad: yeni })) setYeni("");
  };
  return (
    <Kart baslik={baslik} ek={String(l.length)}>
      <ul className="muhasebe-tanim-listesi" data-mh-tanimlar={tur}>
        {l.map((x) => (
          <li key={x.id}>
            <span>
              <b>{x.ad}</b>
              {tur === "fiyat" && <small className="sonuk">{(x.isler ?? []).map((i) => t(BICIM_ADI(i))).join(" · ") || "–"}</small>}
            </span>
            <span className="dugmeler">
              <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setDuzen(x)} aria-label={t("duzenle")} title={t("duzenle")}>
                <Pencil size={16} />
              </button>
              <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => confirm(t("mhTanimSilOnay")) && muhasebeTanimSil(ben, x.id)} aria-label={t("sil")} title={t("sil")}>
                <Trash2 size={16} />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <div className="satir-alani">
        <input value={yeni} onChange={(e) => setYeni(e.target.value)} onKeyDown={(e) => e.key === "Enter" && yeni.trim() && ekle()} placeholder={baslik} aria-label={baslik} data-mh-yeni-tanim={tur} />
        <button type="button" className="dugme dugme-ikincil" onClick={ekle} disabled={!yeni.trim()} data-mh-tanim-ekle={tur}>
          <Plus size={16} /> {t("ekle")}
        </button>
      </div>
      {duzen && <TanimFormu ben={ben} tanim={duzen} kapat={() => (setDuzen(null), setYeni(""))} />}
    </Kart>
  );
}

function TanimFormu({ ben, tanim, kapat }: { ben: Kisi; tanim: MuhasebeTanimi; kapat: () => void }) {
  const { t } = useDil();
  const [ad, setAd] = useState(tanim.ad);
  const [isler, setIsler] = useState<MuhasebeIs[]>(tanim.isler ?? []);
  const kaydet = () => {
    if (muhasebeTanimKaydet(ben, { ...(tanim.id ? { id: tanim.id } : {}), tur: tanim.tur, ad, ...(tanim.tur === "fiyat" ? { isler } : {}) })) kapat();
    else bildir(t("mhTanimVar"));
  };
  return (
    <Pencere
      baslik={tanim.ad || t("ekle")}
      kapat={kapat}
      altBilgi={
        <button type="button" className="dugme dugme-birincil" onClick={kaydet} disabled={!ad.trim()} data-mh-tanim-kaydet>
          {t("kaydet")}
        </button>
      }
    >
      <div className="muhasebe-form">
        <label>
          {t("ad")}
          <input value={ad} onChange={(e) => setAd(e.target.value)} />
        </label>
        {tanim.tur === "fiyat" && (
          <fieldset className="muhasebe-isturleri">
            <legend>{t("mhKapsadigiIsler")}</legend>
            {IS_TURLERI.map((i) => (
              <label key={i} className="kutu-satiri">
                <input type="checkbox" checked={isler.includes(i)} onChange={(e) => setIsler((x) => (e.target.checked ? [...x, i] : x.filter((y) => y !== i)))} data-mh-is={i} />
                {t(BICIM_ADI(i))}
              </label>
            ))}
          </fieldset>
        )}
      </div>
    </Pencere>
  );
}
