import { ArrowLeft, ClipboardCopy, FileDown, Printer } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { bicimSatiri } from "../../bilesenler/Haftalik";
import { indir } from "../../bilesenler/indir";
import { NotKutu, bildir } from "../../bilesenler/Parcalar";
import { aralikYaz, ciktiGunu, metin, tarihYaz, useDil, type Anahtar } from "../../dil";
import { HAREKET_TURU_ADI, kisiAr, sehirAr } from "../../etiketler";
import { ciktida, haftaGunleri, haftaSonu } from "../../haftalik";
import { baslikBul, kisiBul, sahaGorevi, useVeri, type HaftalikKalem, type HaftalikPlan } from "../../veri";

/**
 * Haftalık planın çıktısı: kurumun Google Drive'daki Word belgesinin
 * (الأجندة الأسبوعية) yerini alan standart belge.
 *
 * Bölüm sırası o belgeden: تحركات المراسلين, أهم ملفات الأسبوع, الأجندة
 * اليومية (gün gün; dosya başlıkları altında "ad - YER / metin",
 * muhabirler "isim / şehir", biçim satırı, sarı not). Yalnız toplantıda
 * kabul edilen ve bilgi olarak giren kalemler basılıyor; bilgi kalemi
 * "(لا نتابع)" notuyla. Belge her arayüz dilinde Arapça ve sağdan sola.
 * Planlamacı çıktıyı alıp e-postayı kendisi gönderiyor: yazdır/PDF, metni
 * kopyala ya da Word'ün ve Google Docs'un açtığı .doc dosyası.
 */

/*
 * Word dosyası HTML tabanlı: Word ve Google Docs biçimiyle açıyor. Ekran
 * CSS'i dosyaya gitmediği için belgenin kendi biçimi burada; renkler
 * kurumun belgesindeki kırmızı, yeşil ve sarı vurgu.
 */
const WORD_BICIMI = `
body { font-family: Calibri, Arial, sans-serif; font-size: 13pt; direction: rtl; text-align: right; }
h1 { font-size: 16pt; text-align: center; color: #c00000; }
h2 { font-size: 14pt; margin: 14pt 0 4pt; }
h2.yesil { color: #4f7a28; } h2.kirmizi { color: #c00000; } h2.ortali { text-align: center; }
h3 { font-size: 13pt; text-decoration: underline; margin: 10pt 0 2pt; }
h4.gun { font-size: 13pt; color: #c00000; margin: 14pt 0 4pt; }
p { margin: 0 0 3pt; }
.alt-baslik { font-weight: bold; }
mark { background: #ffff00; }
`;

export default function HaftalikCikti({ hafta }: { hafta: HaftalikPlan }) {
  const { t } = useDil();
  const v = useVeri();
  const belge = useRef<HTMLElement>(null);
  const c = (k: Anahtar, p?: Record<string, string | number>) => metin(k, "ar", p);
  const bas = hafta.baslangic;
  const bit = haftaSonu(bas);
  const baslik = `${c("haftalikCiktiBaslik")} ${aralikYaz(bas, bit, "ar")}`;
  const kisiAdi = (id?: string) => kisiAr(kisiBul(v, id));

  const hareketler = v.gorevlendirmeler
    .filter((g) => sahaGorevi(g) && g.baslangic <= bit && g.bitis >= bas && g.durum !== "talep")
    .sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  /* Aynı yere aynı süreyle giden ekip tek satırda, kurumun belgesindeki gibi: "YER / ad - ad - ad في مهمة حتى …". */
  const hareketSatirlari = [...hareketler.reduce((m, g) => m.set(`${g.yer}|${g.tur}|${g.bitis}`, [...(m.get(`${g.yer}|${g.tur}|${g.bitis}`) ?? []), g]), new Map<string, typeof hareketler>()).values()];
  const kalemler = hafta.kalemler.filter(ciktida);
  const gunler = haftaGunleri(bas).filter((g) => kalemler.some((k) => k.tarih === g));
  const stok = kalemler.filter((k) => !k.tarih);

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(belge.current?.innerText ?? "");
      bildir(t("bKopyalandi"));
    } catch {
      bildir(t("kopyalanamadi"));
    }
  };
  const word = () => {
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${baslik}</title><style>${WORD_BICIMI}</style></head><body dir="rtl" lang="ar">${belge.current?.innerHTML ?? ""}</body></html>`;
    indir(`haftalik-plan-${bas}.doc`, "﻿" + html, "application/msword");
  };

  const Satir = ({ yer, children }: { yer?: string; children: ReactNode }) => (
    <p>
      {yer && <b>{yer} / </b>}
      {children}
    </p>
  );

  /* Bir kalem: "ad - YER / metin", muhabirler, biçim, not; bilgi kaleminde "(لا نتابع)". */
  const Kalem = ({ k }: { k: HaftalikKalem }) => {
    const onEk = [k.baslik, k.yer].filter(Boolean).join(" - ");
    const notlar = [k.karar === "bilgi" ? c("laNutabi") : "", k.not ?? ""].filter(Boolean);
    return (
      <div className="cikti-kalem">
        <Satir yer={onEk || undefined}>{k.metin}</Satir>
        {k.muhabirler.length > 0 && (
          <>
            <p className="alt-baslik">{c(k.muhabirler.length > 1 ? "ciktiMuhabirler" : "ciktiMuhabir")}</p>
            {k.muhabirler.map((id) => (
              <p key={id}>
                {kisiAdi(id)} / {sehirAr(kisiBul(v, id)?.sehir)}
              </p>
            ))}
          </>
        )}
        {k.bicimler.length > 0 && (
          <p>
            <b>
              <bdi>{bicimSatiri(k)}</bdi>
            </b>
          </p>
        )}
        {notlar.length > 0 && (
          <p>
            <mark>{notlar.join(" ")}</mark>
          </p>
        )}
      </div>
    );
  };

  const Dosyalar = ({ liste }: { liste: HaftalikKalem[] }) => {
    const gruplar = new Map<string, HaftalikKalem[]>();
    for (const k of liste) gruplar.set(k.baslikId ?? "", [...(gruplar.get(k.baslikId ?? "") ?? []), k]);
    return (
      <>
        {[...gruplar.entries()].map(([baslikId, ks]) => (
          <div key={baslikId || "-"} className="cikti-baslik">
            {baslikId && <h3>{baslikBul(v, baslikId)?.ad}</h3>}
            {ks.map((k) => (
              <Kalem key={k.id} k={k} />
            ))}
          </div>
        ))}
      </>
    );
  };

  return (
    <>
      <div className="dugmeler yazdirma-gizle">
        <a className="geri-bag" href={`#/haftalik/${hafta.id}`}>
          <ArrowLeft size={14} className="yon" /> {t("haftalikPlanaDon")}
        </a>
        <span className="bosluk-esnek" />
        <button className="dugme dugme-ikincil" onClick={kopyala}>
          <ClipboardCopy size={16} /> {t("metniKopyala")}
        </button>
        <button className="dugme dugme-ikincil" onClick={word}>
          <FileDown size={16} /> {t("wordIndir")}
        </button>
        <button className="dugme" onClick={() => window.print()}>
          <Printer size={16} /> {t("rpYazdir")}
        </button>
      </div>
      <div className="yazdirma-gizle">
        <NotKutu>{t(hafta.durum === "kesinlesti" ? "haftalikCiktiNotu" : "haftalikCiktiTaslakNotu")}</NotKutu>
      </div>

      <div className="cikti-sarici">
        <article className="cikti" ref={belge} dir="rtl" lang="ar">
          <h1>{baslik}</h1>

          {hareketSatirlari.length > 0 && (
            <section>
              <h2 className="yesil">{c("ciktiHareketler")}</h2>
              {hareketSatirlari.map((grup) => {
                const g = grup[0];
                return (
                  <Satir key={g.id} yer={g.yer}>
                    {grup.map((x) => kisiAdi(x.kisiId)).join(" - ")} · {c(HAREKET_TURU_ADI[g.tur])} {c("ciktiKadar", { tarih: tarihYaz(g.bitis, "ar", "kisa") })}
                    {g.aciklama ? ` · ${g.aciklama}` : ""}
                  </Satir>
                );
              })}
            </section>
          )}

          {hafta.anaKonular.length > 0 && (
            <section>
              <h2 className="kirmizi ortali">{c("haftaninAnaDosyalari")}</h2>
              {hafta.anaKonular.map((a) => (
                <div key={a.id} className="cikti-baslik">
                  <h3>{a.baslik}</h3>
                  {a.metin && <p>{a.metin}</p>}
                </div>
              ))}
            </section>
          )}

          {gunler.length > 0 && (
            <section>
              <h2 className="kirmizi ortali">{c("gunlukGundem")}</h2>
              {gunler.map((g) => (
                <div key={g} className="cikti-gun">
                  <h4 className="gun">{ciktiGunu(g, "ar")}</h4>
                  <Dosyalar liste={kalemler.filter((k) => k.tarih === g)} />
                </div>
              ))}
            </section>
          )}

          {stok.length > 0 && (
            <section>
              <h2 className="yesil">{c("zamanaBagliOlmayan")}</h2>
              <Dosyalar liste={stok} />
            </section>
          )}
        </article>
      </div>
    </>
  );
}
