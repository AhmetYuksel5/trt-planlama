import { ClipboardPaste, Copy, Tv } from "lucide-react";
import { useState } from "react";
import { Kart, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { zenginKopyala } from "../bilesenler/indir";
import { tarihYaz, useDil, yaz } from "../dil";
import { kisiAr, paketYeri, satir, sehirAr } from "../etiketler";
import { useVeri, type Kisi } from "../veri";

/*
 * GEÇİCİ deneme (kullanıcı: önce kopyala-yapıştırla iNEWS'e aktarma olabiliyor
 * mu görelim; olursa bilgi işten FTP istenecek, sonra bu kart silinecek).
 * Seçilen Next Day planının paketleri ve canlı yayınları iNEWS'e yapıştırılacak
 * biçimde hazırlanır; farklı pano biçimleri denensin diye üç toplu kopya var.
 * Ters yönde iNEWS'ten kopyalanan panonun bütün biçimleri ham haliyle görünür:
 * yayın akışını okumak (yayınlandı bilgisi) ancak bu içerik anlaşılırsa olur.
 * Kayda hiçbir şey yazılmaz.
 */

interface Satir {
  id: string;
  slug: string;
  metin: string;
}

const latinBasHarfler = (k?: Kisi): string => {
  const ad = k ? yaz(k.ad, "tr") : "";
  const sade = ad.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").toUpperCase();
  return sade.split(/\s+/).filter(Boolean).map((s) => s[0]).join("").replace(/[^A-Z]/g, "").slice(0, 3) || "XXX";
};

const kopyala = async (metin: string, t: ReturnType<typeof useDil>["t"]) => {
  try {
    await navigator.clipboard.writeText(metin);
  } catch {
    const a = document.createElement("textarea");
    a.value = metin;
    document.body.appendChild(a);
    a.select();
    document.execCommand("copy");
    a.remove();
  }
  bildir(t("bKopyalandi"));
};

const kacis = (m: string) => m.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/*
 * iNEWS kuyruğa yapıştırılan düz metinden hikâye açmıyor; kendi kopyası özel
 * pano biçiminde ve tarayıcı onu yazamıyor. Denenen iki yol: HTML tablo (bazı
 * programlar her satırı ayrı kayıt yapıyor) ve iNEWS'in hikâye dili NSML
 * (düz metin olarak; tanırsa hikâye açabilir).
 */
const htmlTablo = (l: Satir[]) =>
  `<table>${l.map((s) => `<tr><td>${kacis(s.slug)}</td><td dir="rtl">${kacis(s.metin).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`;
const nsml = (l: Satir[]) =>
  l
    .map(
      (s) =>
        `<nsml version="-//AVID//DTD NSML 1.0//EN">\r\n<fields>\r\n<f id=title>${kacis(s.slug)}</f>\r\n</fields>\r\n<body>\r\n${s.metin
          .split("\n")
          .map((x) => `<p>${kacis(x)}</p>`)
          .join("\r\n")}\r\n</body>\r\n</nsml>`,
    )
    .join("\r\n");

export function InewsDenemesi() {
  const { t, dil } = useDil();
  const v = useVeri();
  const planlar = [...v.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 14);
  const [planId, setPlanId] = useState(planlar[0]?.id ?? "");
  const [onEk, setOnEk] = useState("PFTEST");
  const [elle, setElle] = useState<Record<string, string>>({});
  const [pano, setPano] = useState<{ tur: string; veri: string }[]>([]);
  const plan = planlar.find((p) => p.id === planId);
  const kisi = (id?: string) => v.kisiler.find((k) => k.id === id);
  const gun = plan ? plan.tarih.slice(8, 10) : "00";
  const on = onEk.trim().toUpperCase().replace(/\s+/g, "") || "PFTEST";

  const satirlar: Satir[] = !plan
    ? []
    : [
        ...v.paketler
          .filter((p) => p.planId === plan.id && p.durum !== "iptal" && !p.ozelId)
          .map((p, i) => ({
            id: p.id,
            slug: `${on}${i + 1}-PKG-${latinBasHarfler(kisi(p.muhabirId))}-0000-${gun}`,
            metin: [satir(paketYeri(p), p.baslik, kisiAr(kisi(p.muhabirId))), p.aciklama, p.klipKodu || p.kod].filter(Boolean).join("\n"),
          })),
        ...v.canliYayinlar
          .filter((c) => c.planId === plan.id)
          .map((c, i) => ({
            id: c.id,
            slug: `${on}${i + 1}-LIVE-${latinBasHarfler(kisi(c.muhabirId))}-${(c.saatGmt || "0000").replace(":", "")}-${gun}`,
            metin: satir(c.yer || sehirAr(kisi(c.muhabirId)?.sehir), c.saatGmt || "TBC", c.konu, c.aciklama, kisiAr(kisi(c.muhabirId))),
          })),
      ].map((s) => ({ ...s, slug: elle[s.id] ?? s.slug }));

  const tekSatir = (m: string) => m.replace(/\s*\n\s*/g, " / ");
  const sekmeli = () => satirlar.map((s) => `${s.slug}\t${tekSatir(s.metin)}`).join("\r\n");
  const tabloKopyala = async () => {
    await zenginKopyala(htmlTablo(satirlar), sekmeli());
    bildir(t("bKopyalandi"));
  };
  const bicimler: [string, () => string][] = [
    [t("inewsBicimSlug"), () => satirlar.map((s) => s.slug).join("\r\n")],
    [t("inewsBicimSekme"), sekmeli],
    [t("inewsBicimBlok"), () => satirlar.map((s) => `${s.slug}\r\n${s.metin.replace(/\n/g, "\r\n")}`).join("\r\n\r\n")],
    [t("inewsBicimNsml"), () => nsml(satirlar)],
  ];

  return (
    <Kart baslik={t("inewsDenemesi")} ikon={<Tv size={18} />}>
      <div className="alanlar">
        <label>
          {t("inewsPlan")}
          <select value={planId} onChange={(e) => setPlanId(e.target.value)} data-inews-plan>
            {planlar.map((p) => (
              <option key={p.id} value={p.id}>
                {tarihYaz(p.tarih, dil)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("inewsOnEk")}
          <input value={onEk} onChange={(e) => setOnEk(e.target.value)} dir="ltr" data-inews-onek />
        </label>
      </div>
      {satirlar.length === 0 ? (
        <p className="sonuk">{t("inewsKayitYok")}</p>
      ) : (
        <>
          <ol className="inews-liste" data-inews-liste>
            {satirlar.map((s) => (
              <li key={s.id} className="inews-satir">
                <div className="inews-slug">
                  <input value={s.slug} onChange={(e) => setElle((x) => ({ ...x, [s.id]: e.target.value }))} dir="ltr" aria-label="slug" data-inews-slug />
                  <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => kopyala(s.slug, t)} title={t("inewsSlugKopyala")} aria-label={t("inewsSlugKopyala")}>
                    <Copy size={16} />
                  </button>
                </div>
                <div className="inews-metin">
                  <pre {...icerikAlani}>{s.metin}</pre>
                  <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => kopyala(s.metin, t)} title={t("inewsMetinKopyala")} aria-label={t("inewsMetinKopyala")} data-inews-metin-kopyala>
                    <Copy size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <div className="dugmeler">
            {bicimler.map(([ad, f], i) => (
              <button key={i} type="button" className="dugme dugme-ikincil" onClick={() => kopyala(f(), t)} data-inews-bicim={i}>
                <Copy size={16} /> {ad}
              </button>
            ))}
            <button type="button" className="dugme dugme-ikincil" onClick={tabloKopyala} data-inews-tablo>
              <Copy size={16} /> {t("inewsBicimTablo")}
            </button>
          </div>
        </>
      )}
      <h4>{t("inewsYapistir")}</h4>
      <div
        className="inews-yapistir"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={t("inewsYapistir")}
        onPaste={(e) => {
          e.preventDefault();
          const d = e.clipboardData;
          setPano([...d.types].map((tur) => ({ tur, veri: d.getData(tur) })));
        }}
        data-inews-yapistir
      >
        <ClipboardPaste size={18} className="sonuk" aria-hidden="true" />
      </div>
      {pano.map((p, i) => (
        <details key={i} open={i === 0} className="inews-pano" data-inews-pano={p.tur}>
          <summary>
            <code>{p.tur}</code> · {p.veri.length}
          </summary>
          <pre dir="auto">{p.veri.slice(0, 20000)}</pre>
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => kopyala(p.veri, t)}>
            <Copy size={14} /> {t("baglantiyiKopyala")}
          </button>
        </details>
      ))}
    </Kart>
  );
}
