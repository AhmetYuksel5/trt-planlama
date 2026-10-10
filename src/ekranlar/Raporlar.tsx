import { ChartColumn, FileDown, Printer } from "lucide-react";
import { useState } from "react";
import { indir } from "../bilesenler/indir";
import { Bos, Ilerleme, Kart, KisiHucre, Sayac } from "../bilesenler/Parcalar";
import { tarihYaz, useDil, type Anahtar } from "../dil";
import { BICIM_ADI, BIRIM_ADI, KANAL_ADI, TUR_ADI } from "../etiketler";
import { DONEMLER, donemBasi, rapor, type Donem } from "../rapor";
import { bugun } from "../tarih";
import { ICERIK_TURLERI, useVeri, type Kisi } from "../veri";
import { kapsam } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";

/**
 * Raporlar: yöneticinin "raporlayabilmek" ihtiyacı.
 *
 * Sayılar rapor.ts'ten; ekran yalnız gösteriyor. Yönetici kendi
 * kapsamının kolunu görüyor (Input müdürü haber, feature, ekonomi;
 * Program müdürü program), sayfayı açabilen diğer birimler hepsini.
 * Grafik yerine tablo ve basit çubuk: promptun "gereksiz grafik yok"
 * kuralı. Dışa aktarma iki yoldan: yazdır/PDF ve Excel'in açtığı CSV.
 */

const DONEM_ADI: Record<Donem, Anahtar> = { 1: "bugun", 7: "rpYedi", 30: "rpOtuz" };

export default function Raporlar({ ben }: { ben: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [gun, setGun] = useState<Donem>(7);
  const kollar = kapsam(ben)?.kollar ?? [...ICERIK_TURLERI];
  const r = rapor(v, gun, kollar);
  const yuzde = (x: number | null) => (x === null ? "—" : `%${Math.round(x * 100)}`);
  const saat = (x: number | null) => (x === null ? "—" : t("saatKisa", { n: x.toFixed(1) }));
  const kabul = r.oneriler.planaEklenen + r.oneriler.reddedilen ? r.oneriler.planaEklenen / (r.oneriler.planaEklenen + r.oneriler.reddedilen) : null;
  const donemYazisi = `${t(DONEM_ADI[gun])} · ${tarihYaz(donemBasi(gun), dil, "kisa")} – ${tarihYaz(bugun(), dil, "kisa")}`;
  const kapsamYazisi = kollar.map((k) => t(TUR_ADI[k])).join(", ");
  const bicimToplam = Math.max(1, r.bicimler.reduce((t, [, n]) => t + n, 0));

  const ozet: [Anahtar, string | number][] = [
    ["verilenHaber", r.ozet.verilen],
    ["tamamlananHaber", r.ozet.tamamlanan],
    ["zamanindaTeslim", yuzde(r.ozet.zamaninda)],
    ["ilkSeferdeKabul", yuzde(r.ozet.ilkSeferde)],
    ["ortTeslimSuresi", saat(r.ozet.ortSaat)],
    ["rpIptal", r.ozet.iptal],
  ];
  const oneriSatirlari: [Anahtar, string | number][] = [
    ["rpGelen", r.oneriler.gelen],
    ["rpPlanaEklenen", r.oneriler.planaEklenen],
    ["rpReddedilen", r.oneriler.reddedilen],
    ["rpBekleyen", r.oneriler.bekleyen],
    ["oneriKabul", yuzde(kabul)],
    ["yoneticiTalimati", r.oneriler.talimat],
    ["elleGirilen", r.oneriler.elle],
  ];

  /*
   * CSV: UTF-8 BOM olmadan Excel Arapça ve Türkçe harfleri bozuyor. Ayırıcı
   * Türkçe arayüzde noktalı virgül, çünkü Türkçe bölge ayarlı Excel virgülü
   * ondalık sayıyor; diğer dillerde virgül.
   */
  const csvIndir = () => {
    const ayirac = dil === "tr" ? ";" : ",";
    const hucre = (x: string | number) => {
      const s = String(x);
      return /[";,\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const satirlar: (string | number)[][] = [
      [t("mRaporlar"), donemYazisi, kapsamYazisi],
      [],
      [t("rpUretim")],
      ...ozet.map(([k, x]) => [t(k), x]),
      [],
      [t("mOneriler")],
      ...oneriSatirlari.map(([k, x]) => [t(k), x]),
      ...r.oneriler.kanallar.map(([k, n]) => [`${t("kanal")}: ${t(KANAL_ADI[k])}`, n]),
      [],
      [t("rpBirimler"), t("sDevamEden"), t("sGeciken")],
      ...r.birimler.map((b) => [t(BIRIM_ADI[b.birim]), b.devamEden, b.geciken]),
      [],
      [t("turDagilimi")],
      ...r.bicimler.map(([b, n]) => [t(BICIM_ADI(b)), n]),
      [],
      [t("muhabir"), t("verilenHaber"), t("tamamlananHaber"), t("zamanindaTeslim"), t("ilkSeferdeKabul"), t("ortTeslimSuresi"), t("nitelikPuani")],
      ...r.muhabirler.map(({ kisi, p }) => [
        ad(kisi),
        p.verilen,
        p.tamamlanan,
        yuzde(p.zamaninda),
        yuzde(p.ilkSeferde),
        saat(p.ortSaat),
        p.puan === null ? "—" : p.puan.toFixed(1),
      ]),
    ];
    const csv = "﻿" + satirlar.map((s) => s.map(hucre).join(ayirac)).join("\r\n");
    indir(`rapor-${bugun()}-${gun}g.csv`, csv, "text/csv;charset=utf-8");
  };

  return (
    <>
      <SayfaBasi
        ikon={<ChartColumn size={26} />}
        baslik={t("mRaporlar")}
       
        sagUc={
          <>
            <button className="dugme dugme-ikincil" onClick={() => window.print()}>
              <Printer size={16} /> {t("rpYazdir")}
            </button>
            <button className="dugme dugme-ikincil" onClick={csvIndir}>
              <FileDown size={16} /> {t("rpCsv")}
            </button>
          </>
        }
      />
      {/* Yazdırırken sayfa başı gizli; raporun kendisi ne olduğunu söylesin. */}
      <div className="yalniz-yazdir">
        <h1>{t("mRaporlar")}</h1>
        <p>
          {donemYazisi} · {kapsamYazisi}
        </p>
      </div>

      <div className="rapor-ust yazdirma-gizle">
        <div className="sekmeler" role="tablist" aria-label={t("rpDonem")}>
          {DONEMLER.map((g) => (
            <button key={g} role="tab" aria-selected={gun === g} className={gun === g ? "acik" : ""} onClick={() => setGun(g)}>
              {t(DONEM_ADI[g])}
            </button>
          ))}
        </div>
        <span className="sonuk-yazi">
          {donemYazisi} · {t("rpKapsam", { kollar: kapsamYazisi })}
        </span>
      </div>

      <div className="sayaclar rapor-ozet">
        {ozet.map(([k, x]) => (
          <Sayac key={k} ikon={<ChartColumn size={20} />} etiket={t(k)} deger={x} />
        ))}
      </div>

      <div className="iz iz-2">
        <Kart baslik={t("mOneriler")}>
          <dl className="ozet-sayilar">
            {oneriSatirlari.map(([k, x]) => (
              <div key={k}>
                <dt>{t(k)}</dt>
                <dd>{x}</dd>
              </div>
            ))}
          </dl>
          {r.oneriler.kanallar.length > 0 && (
            <ul className="liste ara-ust-2">
              {r.oneriler.kanallar.map(([k, n]) => (
                <li key={k}>
                  <div className="ad">
                    <b>{t(KANAL_ADI[k])}</b>
                  </div>
                  <div className="ilerleme-kutu">
                    <Ilerleme oran={n / Math.max(1, r.oneriler.gelen)} />
                  </div>
                  <b>{n}</b>
                </li>
              ))}
            </ul>
          )}
        </Kart>
        <Kart baslik={t("rpBirimler")}>
          {r.birimler.length === 0 ? (
            <Bos kucuk metin={t("kayitYok")} />
          ) : (
            <div className="tablo-sar">
              <table className="tablo kartli">
                <thead>
                  <tr>
                    <th>{t("birim")}</th>
                    <th>{t("sDevamEden")}</th>
                    <th>{t("sGeciken")}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.birimler.map((b) => (
                    <tr key={b.birim}>
                      <td className="birincil">{t(BIRIM_ADI[b.birim])}</td>
                      <td data-etiket={t("sDevamEden")}>{b.devamEden}</td>
                      <td data-etiket={t("sGeciken")} className={b.geciken ? "kotu-yazi" : ""}>
                        {b.geciken}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Kart>
      </div>

      <Kart baslik={t("turDagilimi")}>
        {r.bicimler.length === 0 ? (
          <Bos kucuk metin={t("rpBos")} />
        ) : (
          <ul className="liste">
            {r.bicimler.map(([b, n]) => (
              <li key={b}>
                <div className="ad">
                  <b>{t(BICIM_ADI(b))}</b>
                </div>
                <div className="ilerleme-kutu">
                  <Ilerleme oran={n / bicimToplam} />
                </div>
                <b>{n}</b>
              </li>
            ))}
          </ul>
        )}
      </Kart>

      <Kart baslik={t("rpMuhabirler")}>
        {r.muhabirler.length === 0 ? (
          <Bos kucuk metin={t("rpBos")} />
        ) : (
          <div className="tablo-sar">
            <table className="tablo kartli">
              <thead>
                <tr>
                  <th>{t("muhabir")}</th>
                  <th>{t("verilenHaber")}</th>
                  <th>{t("tamamlananHaber")}</th>
                  <th>{t("zamanindaTeslim")}</th>
                  <th>{t("ilkSeferdeKabul")}</th>
                  <th>{t("ortTeslimSuresi")}</th>
                  <th>{t("nitelikPuani")}</th>
                </tr>
              </thead>
              <tbody>
                {r.muhabirler.map(({ kisi, p }) => (
                  <tr key={kisi.id}>
                    <td className="birincil">
                      <a href={`#/muhabirler/${kisi.id}`}>
                        <KisiHucre kisi={kisi} />
                      </a>
                    </td>
                    <td data-etiket={t("verilenHaber")}>{p.verilen}</td>
                    <td data-etiket={t("tamamlananHaber")}>{p.tamamlanan}</td>
                    <td data-etiket={t("zamanindaTeslim")}>{yuzde(p.zamaninda)}</td>
                    <td data-etiket={t("ilkSeferdeKabul")}>{yuzde(p.ilkSeferde)}</td>
                    <td data-etiket={t("ortTeslimSuresi")}>{saat(p.ortSaat)}</td>
                    <td data-etiket={t("nitelikPuani")}>{p.puan === null ? "—" : p.puan.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Kart>
    </>
  );
}
