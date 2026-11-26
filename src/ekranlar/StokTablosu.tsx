import { Check, ClipboardCopy, Download, MoreHorizontal, Plus, Printer, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icerik, Pencere, Rozet, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { TarihGirdisi } from "../bilesenler/TarihSaat";
import { UretimeAlDugmesi } from "../bilesenler/UretimBalonu";
import { zenginKopyala } from "../bilesenler/indir";
import { useDil, type Anahtar } from "../dil";
import { haftalikOlustur, kalemKarar, tabloHucresiDuzenlenir, tabloHucresiKaydet, type TabloAlani } from "../eylemler";
import { haftaSonu, kalemKilitli } from "../haftalik";
import { oneriSekmesi } from "../oneriSekmeleri";
import { stokTeklifiMi } from "../stokSayfasi";
import {
  TABLO_SUTUNLARI,
  ciktiSatirlari,
  grupBasiMi,
  grupTonlari,
  hucreMetni,
  tabloBasligi,
  tabloSatirlari,
  tabloTarihi,
  type TabloDurumu,
  type TabloSatiri,
  type TabloSutunu,
} from "../stokTablosu";
import { bugun } from "../tarih";
import { useVeri, type HaftalikPlan, type Kisi } from "../veri";
import { XLSX_TURU, xlsxYaz } from "../xlsx";
import { kararVerebilir, uretimeAlabilir, yapabilir } from "../yetki";
import { useTelefon } from "./takvim/ortak";
import { GundemeEkle } from "./haftalik/Plan";
import { OneriAyrinti } from "./oneri/OneriGovde";

/*
 * Rapor önerileri tablosu (kullanıcı: stok haberlerin sistemi kurumun Excel
 * tablosu gibi; aynı biçimde çıktı; planlamacıya işi karmaşıklaştırmayan
 * düğmeler; haftalık öneriler tabloya doğrudan düşsün). Satırlar kayıttan
 * (stokTablosu.ts), hücre yerinde düzeltilir (çift tık ya da Enter), düğmeler
 * yalnız seçili satırda; telefonda muhabire göre gruplu kartlar.
 */

const DURUM_ADI: Record<TabloDurumu, Anahtar> = {
  yeni: "sttYeni",
  duzeltme: "sttDuzeltme",
  baskasinda: "sttBaskasinda",
  gundemde: "sttGundemde",
  kabul: "sttKabul",
  sartli: "sttSartli",
  bilgi: "sttBilgi",
  nextday: "sttNextday",
  planda: "sttPlanda",
  ret: "sttRet",
  alinacak: "sttAlinacak",
  uretimde: "sttUretimde",
  stokta: "sttStokta",
  yayinlandi: "sttYayinlandi",
};
const DURUM_TONU: Partial<Record<TabloDurumu, string>> = {
  yeni: "vurgu",
  duzeltme: "uyari",
  baskasinda: "uyari",
  gundemde: "uyari",
  kabul: "iyi",
  sartli: "plan",
  alinacak: "vurgu",
  uretimde: "vurgu",
  stokta: "iyi",
  yayinlandi: "iyi",
};

/* Yerinde düzeltilen sütunlar ve eylemdeki adları. */
const ALAN: Partial<Record<TabloSutunu, TabloAlani>> = { strap: "strap", isleme: "isleme", gorsel: "gorsel", teslim: "teslim", masraf: "masraf" };
/* Karakter cinsinden genişlikler (Excel); ekranda da oranlar bunlardan. */
const GENISLIK: Record<TabloSutunu, number> = { n: 5, muhabir: 18, ulke: 16, strap: 30, jiha: 14, isleme: 48, gorsel: 38, teslim: 13, masraf: 13 };

/* Ekranda sütunlar Excel'deki oranla; durum sütunu kalan yüzde 12. */
const TOPLAM = TABLO_SUTUNLARI.reduce((t, [c]) => t + GENISLIK[c], 0);
const sutunAdi = (c: TabloSutunu) => TABLO_SUTUNLARI.find(([x]) => x === c)![1];
const kacis = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const TON_RENGI = ["#eef3fb", "#f7f1e6", "#f1edf8", "#eef5ec"];

/*
 * Kopya ve baskı için kurumun tablosunun biçimi, satır içi stille (Google
 * Tablolar ve Excel yapıştırınca bandı, renkleri ve sütunları alıyor).
 */
const tabloHtml = (baslik: string, satirlar: TabloSatiri[]) => {
  const tonlar = grupTonlari(satirlar);
  const hucre = "border:1px solid #bfbfbf;padding:4px 6px;vertical-align:top;text-align:right;white-space:pre-wrap;font-family:Arial,sans-serif;font-size:11pt;";
  const bas = `<tr><td colspan="${TABLO_SUTUNLARI.length}" style="background:#e8742a;color:#ffffff;font-weight:bold;font-size:14pt;text-align:center;padding:6px;font-family:Arial,sans-serif;">${kacis(baslik)}</td></tr>`;
  const ust = `<tr>${TABLO_SUTUNLARI.map(([, ad]) => `<th style="${hucre}background:#fbe3d3;font-weight:bold;text-align:center;">${ad}</th>`).join("")}</tr>`;
  const govde = satirlar
    .map((s, i) => `<tr>${TABLO_SUTUNLARI.map(([c]) => `<td style="${hucre}background:${TON_RENGI[tonlar[i]]};${c === "n" || c === "teslim" ? "text-align:center;" : ""}">${kacis(hucreMetni(s, c, i + 1))}</td>`).join("")}</tr>`)
    .join("");
  return `<table dir="rtl" style="border-collapse:collapse;direction:rtl;">${TABLO_SUTUNLARI.map(([c]) => `<col style="width:${GENISLIK[c] * 7}px">`).join("")}<thead>${bas}${ust}</thead><tbody>${govde}</tbody></table>`;
};

const tabloMetni = (baslik: string, satirlar: TabloSatiri[]) => {
  const t = (x: string) => (/[\t\n"]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x);
  return [baslik, TABLO_SUTUNLARI.map(([, ad]) => ad).join("\t"), ...satirlar.map((s, i) => TABLO_SUTUNLARI.map(([c]) => t(hucreMetni(s, c, i + 1))).join("\t"))].join("\n");
};

/*
 * Dosya adı Latin harfli: Arapça adı bazı tarayıcılar almıyor, dosya uzantısız
 * "download" iniyordu. Bandın metni dosyanın içinde, ilk satırda.
 */
const dosyaAdi = (hafta: string, son: string) => `muqtarahat-taqarir_${hafta}_${son}.xlsx`;

export function StokTablosu({ ben, hafta, hepsi, plan }: { ben: Kisi; hafta: string; hepsi: boolean; plan?: HaftalikPlan }) {
  const { t } = useDil();
  const v = useVeri();
  const telefon = useTelefon();
  const B = bugun();
  const satirlar = tabloSatirlari(v, hafta, hepsi);
  const tonlar = grupTonlari(satirlar);
  const baslik = tabloBasligi(hafta, haftaSonu(hafta));
  const [secili, setSecili] = useState<string | null>(null);
  const [duzen, setDuzen] = useState<{ id: string; c: TabloSutunu } | null>(null);
  const [pencere, setPencere] = useState<{ tur: "gundem" | "ayrinti"; s: TabloSatiri } | null>(null);
  const [baski, setBaski] = useState(false);

  const cikti = () => ciktiSatirlari(satirlar);
  const kopyala = async () => {
    const c = cikti();
    bildir(t((await zenginKopyala(tabloHtml(baslik, c), tabloMetni(baslik, c))) ? "bKopyalandi" : "kopyalanamadi"));
  };
  const excel = () => {
    const c = cikti();
    const veri = xlsxYaz({
      ad: "مقترحات",
      sagdanSola: true,
      genislikler: TABLO_SUTUNLARI.map(([x]) => GENISLIK[x]),
      bant: baslik,
      basliklar: TABLO_SUTUNLARI.map(([, ad]) => ad),
      satirlar: c.map((s, i) => TABLO_SUTUNLARI.map(([x]) => hucreMetni(s, x, i + 1))),
      tonlar: grupTonlari(c),
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([veri as BlobPart], { type: XLSX_TURU }));
    a.download = dosyaAdi(hafta, haftaSonu(hafta));
    // Belgede olmayan bağlantıda bazı tarayıcılar dosya adını almıyor.
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  // Baskıda yalnız tablonun temiz kopyası (muhabir kılavuzunun PDF'i gibi).
  useEffect(() => {
    if (!baski) return;
    const kok = document.documentElement;
    const kap = document.createElement("div");
    kap.className = "tablo-baski";
    kap.innerHTML = tabloHtml(baslik, cikti());
    document.body.appendChild(kap);
    const eskiAd = document.title;
    document.title = baslik;
    kok.classList.add("tablo-baskisi");
    const bitir = () => setBaski(false);
    window.addEventListener("afterprint", bitir);
    const zaman = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(zaman);
      window.removeEventListener("afterprint", bitir);
      kok.classList.remove("tablo-baskisi");
      kap.remove();
      document.title = eskiAd;
    };
  }, [baski]);

  const gundemeEklenir = (s: TabloSatiri) =>
    !!s.oneri && !s.kalem && !s.paket && oneriSekmesi(v, s.oneri, B) === "karar" && yapabilir(ben, "haftalikDuzenle");
  const kararVerilir = (s: TabloSatiri) => !!plan && !!s.kalem && s.kalem.karar === "bekliyor" && kararVerebilir(ben, plan) && !kalemKilitli(plan, s.kalem);
  const karar = (s: TabloSatiri, k: "kabul" | "ret") => {
    if (!plan || !s.kalem || !confirm(t(k === "kabul" ? "sttKabulOnay" : "sttRetOnay"))) return;
    if (kalemKarar(ben, plan.id, s.kalem.id, k)) bildir(t("bKaydedildi"));
  };
  const gundemeAc = (s: TabloSatiri) => {
    if (!plan && !haftalikOlustur(ben, hafta)) return;
    setPencere({ tur: "gundem", s });
  };

  const dugmeler = (s: TabloSatiri) => (
    <span className="st-dugmeler">
      {gundemeEklenir(s) && (
        <button type="button" className="dugme dugme-kucuk" onClick={() => gundemeAc(s)} data-tablo-weekly={s.id}>
          <Plus size={14} /> {t("pmWeekly")}
        </button>
      )}
      {kararVerilir(s) && (
        <>
          <button type="button" className="dugme dugme-ikincil dugme-kucuk dugme-ikon" onClick={() => karar(s, "kabul")} title={t("sttKabul")} aria-label={t("sttKabul")} data-tablo-karar="kabul">
            <Check size={14} />
          </button>
          <button type="button" className="dugme dugme-ikincil dugme-kucuk dugme-ikon" onClick={() => karar(s, "ret")} title={t("sttRet")} aria-label={t("sttRet")} data-tablo-karar="ret">
            <X size={14} />
          </button>
        </>
      )}
      {s.paket && uretimeAlabilir(ben, s.paket) && <UretimeAlDugmesi ben={ben} paket={s.paket} />}
      {s.oneri && (
        <button type="button" className="dugme dugme-ikincil dugme-kucuk dugme-ikon" onClick={() => setPencere({ tur: "ayrinti", s })} title={t("ayrinti")} aria-label={t("ayrinti")} data-tablo-ayrinti={s.id}>
          <MoreHorizontal size={14} />
        </button>
      )}
    </span>
  );

  const duzenlenir = (s: TabloSatiri, c: TabloSutunu) => {
    const a = ALAN[c];
    return !!a && !s.dusuk && tabloHucresiDuzenlenir(ben, a, plan?.id, s.oneri?.id, s.kalem?.id);
  };
  const kaydetHucre = (s: TabloSatiri, c: TabloSutunu, deger: string) => {
    setDuzen(null);
    const a = ALAN[c]!;
    const eski = c === "teslim" ? (s.teslim ?? "") : c === "masraf" ? (s.oneri?.ekMasraf ?? "") : s[c as "strap" | "isleme" | "gorsel"];
    if (deger.trim() === eski.trim()) return;
    if (!tabloHucresiKaydet(ben, a, deger, plan?.id, s.oneri?.id, s.kalem?.id)) bildir(t("sttKaydedilemedi"));
  };

  const ust = (
    <div className="st-arac">
      <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kopyala} data-tablo-arac="kopya" title={t("sttKopyala")} aria-label={t("sttKopyala")}>
        <ClipboardCopy size={14} /> <span className="st-arac-ad">{t("sttKopyala")}</span>
      </button>
      <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={excel} data-tablo-arac="excel">
        <Download size={14} /> Excel
      </button>
      {!telefon && (
        <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setBaski(true)} data-tablo-arac="yazdir">
          <Printer size={14} /> {t("yazdir")}
        </button>
      )}
    </div>
  );

  return (
    <div className="stok-tablo" data-stok-tablo={hafta}>
      {ust}
      <div className="st-bant">{baslik}</div>
      {satirlar.length === 0 ? (
        <p className="soluk st-bos">{t("kayitYok")}</p>
      ) : telefon ? (
        <TabloKartlari satirlar={satirlar} tonlar={tonlar} secili={secili} setSecili={setSecili} dugmeler={dugmeler} />
      ) : (
        <div className="st-kaydirma">
          <table className="st-izgara">
            <colgroup>
              {TABLO_SUTUNLARI.map(([c]) => (
                <col key={c} style={{ inlineSize: `${(GENISLIK[c] / TOPLAM) * 88}%` }} />
              ))}
              <col className="st-durum-sutun" />
            </colgroup>
            <thead>
              <tr>
                {TABLO_SUTUNLARI.map(([c, ad]) => (
                  <th key={c}>
                    <Icerik>{ad}</Icerik>
                  </th>
                ))}
                <th>{t("durum")}</th>
              </tr>
            </thead>
            <tbody>
              {satirlar.map((s, i) => {
                const acik = secili === s.id;
                return (
                  <tr
                    key={s.id}
                    className={`st-ton-${tonlar[i]}${grupBasiMi(satirlar, i) ? " st-grup-bas" : ""}${acik ? " secili" : ""}${s.dusuk ? " dusuk" : ""}`}
                    onClick={() => setSecili(s.id)}
                    data-tablo-satir={s.id}
                    data-durum={s.durum}
                  >
                    {TABLO_SUTUNLARI.map(([c]) => {
                      const ed = duzenlenir(s, c);
                      if (duzen?.id === s.id && duzen.c === c)
                        return (
                          <td key={c} className="st-duzen">
                            <HucreDuzeni c={c} ilk={c === "teslim" ? (s.teslim ?? "") : c === "masraf" ? (s.oneri?.ekMasraf ?? s.masraf) : s[c as "strap"]} bitir={(x) => (x === null ? setDuzen(null) : kaydetHucre(s, c, x))} />
                          </td>
                        );
                      const deger = c === "n" ? String(i + 1) : c === "muhabir" && !grupBasiMi(satirlar, i) ? "" : hucreMetni(s, c, i + 1);
                      return (
                        <td
                          key={c}
                          className={`st-${c}${ed ? " duzenlenir" : ""}`}
                          tabIndex={ed ? 0 : undefined}
                          onDoubleClick={ed ? () => setDuzen({ id: s.id, c }) : undefined}
                          onKeyDown={ed ? (e) => e.key === "Enter" && (e.preventDefault(), setDuzen({ id: s.id, c })) : undefined}
                          data-tablo-hucre={c}
                        >
                          {c === "n" || c === "teslim" ? (
                            <bdi dir="ltr">{deger}</bdi>
                          ) : (
                            <Icerik blok>
                              <span className={acik ? undefined : "st-kes"}>{deger}</span>
                            </Icerik>
                          )}
                        </td>
                      );
                    })}
                    <td className="st-durum">
                      <Rozet ton={DURUM_TONU[s.durum]}>{t(DURUM_ADI[s.durum])}</Rozet>
                      {acik && dugmeler(s)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pencere?.tur === "gundem" && pencere.s.oneri && (
        <GundemePenceresi ben={ben} hafta={hafta} oneriId={pencere.s.oneri.id} kapat={() => setPencere(null)} />
      )}
      {pencere?.tur === "ayrinti" && pencere.s.oneri && <OneriAyrinti ben={ben} oneri={pencere.s.oneri} kapat={() => setPencere(null)} />}
    </div>
  );
}

/* Hafta "Gündeme ekle"yle açılmış olabilir: plan pencere açılırken kayıttan okunur. */
function GundemePenceresi({ ben, hafta, oneriId, kapat }: { ben: Kisi; hafta: string; oneriId: string; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const plan = v.haftalik.find((h) => h.baslangic === hafta);
  const o = v.oneriler.find((x) => x.id === oneriId);
  if (!plan || !o) return null;
  return (
    <Pencere baslik={t("gundemeEkle")} kapat={kapat}>
      <GundemeEkle ben={ben} hafta={plan} oneri={o} kapat={kapat} stok={stokTeklifiMi(o)} />
    </Pencere>
  );
}

function HucreDuzeni({ c, ilk, bitir }: { c: TabloSutunu; ilk: string; bitir: (x: string | null) => void }) {
  const [x, setX] = useState(ilk);
  const alan = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const a = alan.current;
    if (!a) return;
    a.focus();
    a.setSelectionRange(a.value.length, a.value.length);
  }, []);
  if (c === "teslim")
    return (
      <span className="st-tarih" onClick={(e) => e.stopPropagation()}>
        <TarihGirdisi value={x} min={bugun()} onChange={(e) => bitir(e.target.value)} data-tablo-duzen={c} />
        <button type="button" className="dugme dugme-ikincil dugme-kucuk dugme-ikon" onClick={() => bitir(null)} aria-label="Esc">
          <X size={14} />
        </button>
      </span>
    );
  // Enter kaydeder, Shift+Enter alt satır, Esc vazgeçer (Excel'in hücresi gibi).
  const tus = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      bitir(null);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      bitir(x);
    }
  };
  return (
    <textarea
      ref={alan}
      {...(c === "masraf" ? { dir: "auto" } : icerikAlani)}
      value={x}
      rows={c === "isleme" || c === "gorsel" ? 6 : 2}
      onChange={(e) => setX(e.target.value)}
      onKeyDown={tus}
      onBlur={() => bitir(x)}
      onClick={(e) => e.stopPropagation()}
      data-tablo-duzen={c}
    />
  );
}

/* Telefonda dokuz sütun sığmıyor: muhabire göre gruplu kartlar, açık kartta işleme ve görsel. */
function TabloKartlari({
  satirlar,
  tonlar,
  secili,
  setSecili,
  dugmeler,
}: {
  satirlar: TabloSatiri[];
  tonlar: number[];
  secili: string | null;
  setSecili: (id: string | null) => void;
  dugmeler: (s: TabloSatiri) => React.ReactNode;
}) {
  const { t } = useDil();
  return (
    <div className="st-kartlar">
      {satirlar.map((s, i) => {
        const acik = secili === s.id;
        return (
          <div key={s.id} className={`st-ton-${tonlar[i]}`}>
            {grupBasiMi(satirlar, i) && (
              <div className="st-grup-adi">
                <Icerik>{s.muhabir || "—"}</Icerik>
              </div>
            )}
            <article className={`st-kart${acik ? " acik" : ""}${s.dusuk ? " dusuk" : ""}`} data-tablo-satir={s.id} data-durum={s.durum}>
              <button type="button" className="st-kart-bas" onClick={() => setSecili(acik ? null : s.id)} aria-expanded={acik}>
                <small>{i + 1}</small>
                <Icerik blok>{s.strap || "—"}</Icerik>
              </button>
              <Icerik blok>
                <span className="soluk">{[s.ulke, s.jiha].filter(Boolean).join(" · ")}</span>
              </Icerik>
              <div className="st-kart-alt">
                <Rozet ton={DURUM_TONU[s.durum]}>{t(DURUM_ADI[s.durum])}</Rozet>
                <span>
                  {s.teslim && <bdi dir="ltr">{tabloTarihi(s.teslim)}</bdi>}
                  {s.masraf && (
                    <>
                      {" · "}
                      <bdi dir="auto">{s.masraf}</bdi>
                    </>
                  )}
                </span>
              </div>
              {acik && (
                <>
                  {s.isleme && (
                    <div className="st-kart-metin">
                      <Icerik blok>
                        <b>{sutunAdi("isleme")}</b>
                        {s.isleme}
                      </Icerik>
                    </div>
                  )}
                  {s.gorsel && (
                    <div className="st-kart-metin">
                      <Icerik blok>
                        <b>{sutunAdi("gorsel")}</b>
                        {s.gorsel}
                      </Icerik>
                    </div>
                  )}
                  {dugmeler(s)}
                </>
              )}
            </article>
          </div>
        );
      })}
    </div>
  );
}
