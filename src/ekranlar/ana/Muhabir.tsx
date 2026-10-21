import { AnildigimNotlar } from "../../bilesenler/Anma";
import { PaketSonucDugmeleri } from "../../bilesenler/PaketSonucu";
import { ArrowRight, CheckCircle, Lightbulb, Newspaper } from "lucide-react";
import { adimAdi, adimTuru, geciktiMi, type UretimAdimi } from "../../akis";
import {
  Bos,
  Icerik,
  Kart,
  OncelikRozeti,
  PaketDurumRozeti,
  Rozet,
  oncelikliOnce,
} from "../../bilesenler/Parcalar";
import { OneriDurumRozeti } from "../../bilesenler/Tablolar";
import { saatYaz, tarihYaz, useDil, type Anahtar } from "../../dil";
import { bugun, yerelGun } from "../../tarih";
import { planBul, useVeri, type Kisi, type Oneri } from "../../veri";
import { ozelGorevleri } from "../../ozel";
import {
  muhabirBolumu,
  oneriSonGunu,
  type MuhabirBolumu,
} from "../../oneriPlanlari";
import { OzelGorevSatirlari } from "../../bilesenler/OzelGorevler";
import { paketTamamla } from "../../eylemler";
import { KararNotlari } from "../haftalik/Kalem";
import {
  adimYapabilir,
  oneriGorebilir,
  paketGorebilir,
  paketTamamlayabilir,
} from "../../yetki";
import { tamamlandiBildir } from "../../bilesenler/TamamlamaGeriAl";

/**
 * Muhabirin ekranı (kurum kararı, en sade hali): Öneri gönder, Önerilerim,
 * Takiplerim, Haberlerim, Görevlendirmelerim, Ayarlar. Açılış sayfası
 * Önerilerim'in güncel bölümü. Sayaç, çağrı kartı, bildirim kartı ve
 * kılavuz ana sayfada yok: çağrı bildirim olarak geliyor, kılavuz Ayarlar'da.
 * Başka muhabirin kaydı burada da aramada da yok.
 */
export default function MuhabirAna({ ben }: { ben: Kisi }) {
  return <MuhabirOnerilerim ben={ben} />;
}

const BOLUM_ADI: Record<MuhabirBolumu, Anahtar> = {
  yakinda: "mbYakinda",
  ileride: "mbIleride",
  kabulEdilmeyen: "mbKabulEdilmeyen",
  tamamlanan: "mbTamamlanan",
};

/*
 * Önerilerim: güncel (yakında, ileride) ve arşiv (kabul edilmeyenler,
 * tamamlananlar). Güncelin başında muhabirin önündeki iş: Planlama'nın
 * teklifi ve düzeltme isteği, sonucu bildirilecek paket, özel yayın görevi.
 * Öneriden doğmamış paket (Weekly'nin doğrudan kalemi, PKG formu) da burada,
 * öneri gibi: muhabir için ikisinin süreci aynı.
 */
export function MuhabirOnerilerim({
  ben,
  arsiv = false,
}: {
  ben: Kisi;
  arsiv?: boolean;
}) {
  const { t, dil } = useDil();
  const v = useVeri();
  const B = bugun();
  const oneriler = v.oneriler.filter(
    (o) =>
      o.muhabirId === ben.id && oneriGorebilir(ben, o) && o.durum !== "takip",
  );
  const paketler = v.paketler.filter((p) => paketGorebilir(ben, p, v));
  const bolumu = new Map(oneriler.map((o) => [o.id, muhabirBolumu(v, o, B)]));
  const bende = oneriler.filter(
    (o) => o.durum === "teklif" || o.durum === "duzeltme",
  );
  // Newsdesk yokken onaylı paketin sonucu muhabirden: o da sırası gelen iş.
  const siram = paketler
    .filter(
      (p) =>
        adimYapabilir(ben, p) ||
        (p.muhabirId === ben.id && paketTamamlayabilir(ben, p, v)),
    )
    .sort(oncelikliOnce);
  const siradaki = new Set(
    siram.flatMap((p) => (p.oneriId ? [p.oneriId] : [])),
  );
  const ozel = ozelGorevleri(v, ben.id);
  /*
   * Plana giren haber, onaylı paketi doğmadan da muhabirin işi: strap'siz
   * öneri plana yalnız gelişme olarak giriyor, PKG'linin paketi plan onayına
   * dek değerlendirmede. Yalnız paketlerden kurulunca muhabire "plana eklendi"
   * bildirimi gidiyor, sırasında hiçbir şey çıkmıyordu. Kısıtlı muhabir planı
   * okuyamıyor: gün öneride.
   */
  const planGunu = (o: Oneri) => planBul(v, o.planId)?.tarih ?? o.planTarihi ?? yerelGun(o.zaman);
  const plandaki = oneriler.filter(
    (o) => o.durum === "planaEklendi" && planGunu(o) >= B && !paketler.some((p) => (p.id === o.paketId || p.oneriId === o.id) && p.durum !== "taslak" && p.durum !== "degerlendiriliyor"),
  );
  const liste = (b: MuhabirBolumu) =>
    oneriler
      .filter(
        (o) =>
          bolumu.get(o.id) === b && !bende.includes(o) && !siradaki.has(o.id),
      )
      .sort((x, y) =>
        arsiv
          ? oneriSonGunu(y).localeCompare(oneriSonGunu(x))
          : oneriSonGunu(x).localeCompare(oneriSonGunu(y)),
      );
  const onerisizPaketler = paketler
    .filter((p) => !p.oneriId && !p.ozelId && p.muhabirId === ben.id && (p.durum === "tamamlandi" || p.durum === "iptal"))
    .sort((a, b) => b.guncelleme.localeCompare(a.guncelleme));
  const bolumler: MuhabirBolumu[] = arsiv
    ? ["kabulEdilmeyen", "tamamlanan"]
    : ["yakinda", "ileride"];
  return (
    <>
      <nav className="sekmeler" data-muhabir-sekmeleri>
        <a
          href="#/oneriler"
          className={arsiv ? "" : "acik"}
          aria-current={arsiv ? undefined : "page"}
          data-oneri-guncel
        >
          {t("mbGuncel")}
        </a>
        <a
          href="#/oneriler/arsiv"
          className={arsiv ? "acik" : ""}
          aria-current={arsiv ? "page" : undefined}
          data-oneri-arsiv
        >
          {t("mbArsiv")}
        </a>
      </nav>
      {!arsiv && <AnildigimNotlar ben={ben} />}
      {!arsiv && bende.length + siram.length + plandaki.length + ozel.length > 0 && (
        <div data-senin-siran>
          <Kart baslik={t("seninSiran")}>
            <ul className="liste">
              {bende.map((o) => (
                <OneriSatiri
                  key={o.id}
                  o={o}
                  not={o.durum === "duzeltme" ? o.duzeltmeNotu : undefined}
                />
              ))}
              {siram.map((p) => (
                <PaketSatiri key={p.id} ben={ben} paketId={p.id} />
              ))}
              {plandaki.map((o) => (
                <li key={o.id} data-plandaki={o.id}>
                  <div className="ad">
                    <a href={`#/oneriler/${o.id}`}>
                      <Icerik blok>{o.paketBasligi || o.haberBasligi}</Icerik>
                    </a>
                    <small>
                      {t("muPlanda", { tarih: tarihYaz(planGunu(o), dil, "kisa") })}
                      {paketler.some((p) => p.id === o.paketId || p.oneriId === o.id) && ` · ${t("muPkgOnayBekliyor")}`}
                    </small>
                  </div>
                </li>
              ))}
              <OzelGorevSatirlari paketler={ozel} />
            </ul>
          </Kart>
        </div>
      )}
      {bolumler.map((b) => {
        const l = liste(b);
        // Önerisiz paket (plana doğrudan girmiş) arşivde öneri gibi: kapanınca muhabirin hiçbir listesinde kalmıyordu.
        const pk = arsiv ? onerisizPaketler.filter((p) => (b === "tamamlanan" ? p.durum === "tamamlandi" : p.durum === "iptal")) : [];
        return (
          <div key={b} data-muhabir-bolumu={b}>
            <Kart baslik={t(BOLUM_ADI[b])} ek={String(l.length + pk.length)}>
              {l.length + pk.length === 0 ? (
                <Bos kucuk metin={t("oneriYok")} />
              ) : (
                <ul className="liste">
                  {l.map((o) => (
                    <OneriSatiri
                      key={o.id}
                      o={o}
                      not={b === "kabulEdilmeyen" ? o.gerekce : undefined}
                    />
                  ))}
                  {pk.map((p) => (
                    <li key={p.id} data-onerisiz-paket={p.id}>
                      <div className="ad">
                        <a href={`#/paketler/${p.id}`}>
                          <Icerik blok>{p.baslik}</Icerik>
                        </a>
                        <small>
                          {tarihYaz(p.guncelleme.slice(0, 10), dil, "kisa")}
                          {p.yapilmadi && <> · <span dir="auto">{p.yapilmadi.sebep}</span></>}
                        </small>
                      </div>
                      <PaketDurumRozeti paket={p} />
                    </li>
                  ))}
                </ul>
              )}
            </Kart>
          </div>
        );
      })}
    </>
  );
}

function OneriSatiri({ o, not }: { o: Oneri; not?: string }) {
  const { dil } = useDil();
  return (
    <li data-oneri={o.id}>
      <div className="ad">
        <a href={`#/oneriler/${o.id}`}>
          <Icerik blok>{o.paketBasligi || o.haberBasligi}</Icerik>
        </a>
        <small>
          {tarihYaz(oneriSonGunu(o), dil, "kisa")}
          {not && (
            <>
              {" "}
              · <span dir="auto">{not}</span>
            </>
          )}
        </small>
      </div>
      <OneriDurumRozeti oneri={o} />
    </li>
  );
}

function PaketSatiri({ ben, paketId }: { ben: Kisi; paketId: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const p = v.paketler.find((x) => x.id === paketId);
  if (!p) return null;
  return (
    <li data-paket={p.id}>
      <div className="ad">
        <a href={p.oneriId ? `#/oneriler/${p.oneriId}` : `#/paketler/${p.id}`}>
          <Icerik blok>{p.baslik}</Icerik>
        </a>
        <small>
          {p.durum === "onaylandi"
            ? t("muOnayliBekleniyor")
            : adimAdi(p.adim as UretimAdimi, p)}
          {p.teslim && ` · ${t("teslim")} ${saatYaz(p.teslim, dil)}`}
          {p.ozelId &&
            ` · ${t("ozel")}${p.ozelAd ? `: ${p.ozelAd}` : ""}${p.sonTarih ? ` · ${t("oySonTarih")}: ${tarihYaz(p.sonTarih, dil, "kisa")}` : ""}`}
        </small>
        <KararNotlari kalem={p} />
      </div>
      {p.oncelikli && <OncelikRozeti />}
      {geciktiMi(p) && <Rozet ton="kotu">{t("gecikti")}</Rozet>}
      {/* Onaylı paketin sonucu muhabirden: yapıldı ya da sebebiyle yapılmadı, yetkili onaylıyor. Özel yayın paketi kendi teslimiyle. */}
      {p.durum === "onaylandi" && !p.ozelId ? (
        <PaketSonucDugmeleri ben={ben} paket={p} kucuk />
      ) : p.durum === "onaylandi" ? (
        <button
          type="button"
          className="dugme dugme-iyi dugme-kucuk"
          onClick={() =>
            confirm(t("eminMisin")) &&
            paketTamamla(ben, p.id) &&
            tamamlandiBildir(ben, t("bPaketTamamlandi"), { paketId: p.id })
          }
          data-paket-tamamla={p.id}
        >
          <CheckCircle size={14} /> {t("haberTamamlandi")}
        </button>
      ) : (
        <a className="dugme dugme-kucuk" href={`#/paketler/${p.id}`}>
          {t(
            adimTuru(p) === "metin"
              ? "metniGonder"
              : adimTuru(p) === "is"
                ? "tamamlaVeGec"
                : "videoyuGonder",
          )}{" "}
          <ArrowRight size={14} className="yon" />
        </a>
      )}
    </li>
  );
}

/*
 * Haberlerim: yapımı tamamlanan haberlerin yalnız başlıkları. Tıklanınca
 * önerinin sayfası (öneriden doğmadıysa paketinki). Plana paketsiz giren
 * haber tamamlanmış sayılır ama paketi olmadığı için burada yok.
 */
export function MuhabirHaberlerim({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const liste = v.paketler
    .filter(
      (p) =>
        p.muhabirId === ben.id &&
        p.durum === "tamamlandi" &&
        paketGorebilir(ben, p, v),
    )
    .sort((a, b) => b.guncelleme.localeCompare(a.guncelleme));
  return (
    <Kart
      baslik={t("haberlerim")}
      ikon={<Newspaper size={18} />}
      ek={String(liste.length)}
    >
      {liste.length === 0 ? (
        <Bos metin={t("paketimYok")} />
      ) : (
        <ul className="liste" data-haberlerim>
          {liste.map((p) => (
            <li key={p.id} data-haber={p.id}>
              <div className="ad">
                <a
                  href={
                    p.oneriId ? `#/oneriler/${p.oneriId}` : `#/paketler/${p.id}`
                  }
                >
                  <Icerik blok>{p.baslik}</Icerik>
                </a>
                <small>
                  {tarihYaz(p.guncelleme.slice(0, 10), dil, "kisa")}
                </small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Kart>
  );
}

/* Menüde "Öneri gönder": muhabirin asıl işi, menünün başında. */
export const ONERI_GONDER_IKONU = Lightbulb;
