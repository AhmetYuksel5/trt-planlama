import { useRef } from "react";
import { Bos } from "../bilesenler/Parcalar";
import { aralikYaz, ciktiTarihi, gunAy, metin, useDil, type Anahtar } from "../dil";
import { kisiAr, muhabirYeri, paketYeri, satir, sehirAr } from "../etiketler";
import { nafizeBasligi, ozelGorevlendirmeleri, ozelPaketSatirlari } from "../ozel";
import { kisiBul, useVeri } from "../veri";
import { CiktiAraclari } from "./belge/Parcalar";

/**
 * Özel yayın planının çıktısı: Next Day ve Weekly'nin kağıdıyla aynı biçim
 * (`.cikti`, Word'de aynı kurallar), her arayüz dilinde Arapça. İptal
 * edilen kalem basılmaz; onay bekleyen paket önerisi basılır, plan onaya
 * bu kağıtla götürülüyor.
 */
export default function OzelCikti({ id }: { id: string }) {
  const { t } = useDil();
  const v = useVeri();
  const belge = useRef<HTMLElement>(null);
  const o = v.ozel.find((x) => x.id === id);
  if (!o) return <Bos metin={t("oyYok")} />;
  const c = (k: Anahtar) => metin(k, "ar");
  const tarih = o.bitis ? aralikYaz(o.tarih, o.bitis, "ar") : ciktiTarihi(o.tarih, "ar");
  const nafizeler = (o.nafizeler ?? []).filter((n) => n.durum !== "iptal").sort((a, b) => `${a.tarih} ${a.saat ?? ""}`.localeCompare(`${b.tarih} ${b.saat ?? ""}`));
  const paketler = ozelPaketSatirlari(o, v);
  const talepler = (o.talepler ?? []).filter((x) => x.durum !== "iptal");
  const gorevler = ozelGorevlendirmeleri(v, o.id);
  const sonTarih = (iso?: string) => (iso ? ` · ${c("oySonTarih")}: ${gunAy(iso, "ar")}` : "");
  return (
    <>
      <CiktiAraclari geri={{ href: `#/ozel/${o.id}`, metin: t("planaDon") }} belge={belge} word={{ ad: `ozel-yayin-${o.tarih}.doc`, baslik: `${c("oyCiktiBaslik")}: ${o.ad}` }} />
      <div className="cikti-sarici">
        <article className="cikti" ref={belge} dir="rtl" lang="ar" data-ozel-belge>
          <h1>
            {c("oyCiktiBaslik")}: {o.ad}
          </h1>
          <h2 className="ortali">{tarih}</h2>
          {o.aciklama && (
            <section>
              <h2 className="yesil">{c("oyAciklama")}</h2>
              <p className="cikti-aciklama">{o.aciklama}</p>
            </section>
          )}
          {nafizeler.length > 0 && (
            <section>
              <h2 className="yesil">{c("oyNafizeler")}</h2>
              {nafizeler.map((n) => {
                const konuklar = n.konuklar.filter((k) => k.durum !== "iptal");
                return (
                  <div key={n.id}>
                    <h3>{nafizeBasligi(n)}</h3>
                    <p>{n.konu}</p>
                    <p>
                      <b>{c("muhabir")}: </b>
                      {muhabirYeri([kisiAr(kisiBul(v, n.muhabirId))], n.muhabirTbc)}
                    </p>
                    {konuklar.length > 0 && (
                      <p>
                        <b>{c("oyKonuklar")}: </b>
                        {konuklar.map((k) => (k.unvan ? `${k.ad} (${k.unvan})` : k.ad)).join(" | ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </section>
          )}
          {paketler.length > 0 && (
            <section>
              <h2 className="yesil">{c("oyPaketler")}</h2>
              {paketler.map((s) => {
                const yapan = kisiBul(v, s.muhabirId ?? s.paket?.hazirlayanId);
                const yer = s.paket ? paketYeri(s.paket) : sehirAr(yapan?.sehir);
                return (
                  <p key={s.id}>
                    {satir(yer, s.baslik, yapan ? kisiAr(yapan) : s.kaynak === "inhouse" ? c("oyInhouse") : undefined)}
                    {sonTarih(s.sonTarih)}
                  </p>
                );
              })}
            </section>
          )}
          {talepler.length > 0 && (
            <section>
              <h2 className="yesil">{c("oyTalepler")}</h2>
              {talepler.map((x) => (
                <p key={x.id}>
                  {x.metin}
                  {sonTarih(x.sonTarih)}
                </p>
              ))}
            </section>
          )}
          {gorevler.length > 0 && (
            <section>
              <h2 className="yesil">{c("oyGorevler")}</h2>
              {gorevler.map((g) => (
                <p key={g.id}>{satir(g.yer, kisiAr(kisiBul(v, g.kisiId)), aralikYaz(g.baslangic, g.bitis, "ar"))}</p>
              ))}
            </section>
          )}
          {o.hazirlik.length > 0 && (
            <section>
              <h2 className="yesil">{c("oyHazirlik")}</h2>
              {o.hazirlik.map((h) => (
                <p key={h.id}>
                  {h.tamam ? "✓ " : "☐ "}
                  {h.metin}
                </p>
              ))}
            </section>
          )}
        </article>
      </div>
    </>
  );
}
