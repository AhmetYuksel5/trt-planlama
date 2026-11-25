import { AnildigimNotlar } from "../../bilesenler/Anma";
import { MesajRozeti } from "../../bilesenler/MesajRozeti";
import { BitmisPaketSeridi } from "../../bilesenler/BitmisPaket";
import { PaketSonucDugmeleri } from "../../bilesenler/PaketSonucu";
import { ArrowRight, Binoculars, CheckCircle, Lightbulb, ListTodo, MapPinned, Newspaper } from "lucide-react";
import type { ReactNode } from "react";
import { SADE_ASAMA_ADI, adimAdi, adimTuru, geciktiMi, paketYolu, sadeAkis, sadeSira, type UretimAdimi } from "../../akis";
import { AsamaCubugu } from "../../bilesenler/Parcalar";
import { birimAdi } from "../../yapi";
import { YAPILACAK_GRUPLARI, bugunkuYapilacakSayisi, muhabirYapilacaklari, type Yapilacak, type YapilacakGrubu } from "../../yapilacaklar";
import { paketGunu } from "../../bitmisPaket";
import { ayAdi, aralikYaz } from "../../dil";
import { gunEkle, haftaBasi } from "../../tarih";
import { useAdimDurumu } from "../../yol";
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
import { eskiOzelPaket, planBul, useVeri, type Kisi, type Oneri } from "../../veri";
import { ozelGorevleri } from "../../ozel";
import {
  muhabirBolumu,
  oneriArsivde,
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
    .filter((p) => !p.oneriId && !eskiOzelPaket(p) && p.muhabirId === ben.id && (p.durum === "tamamlandi" || p.durum === "iptal"))
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
      {/*
        * Tek liste yüzeyi, grup başlıklı (mobil denetim M-40): her grup ayrı karttı,
        * boş gruplar "öneri yok" kartı olarak çiziliyor, "Senin sıran" öbürlerinden
        * ayrışmıyordu. Boş grup çizilmez; sırası muhabirde olanın sayısı dolu.
        */}
      {(() => {
        const sira = arsiv ? 0 : bende.length + siram.length + plandaki.length + ozel.length;
        const gruplar = bolumler
          .map((b) => ({ b, l: liste(b), pk: arsiv ? onerisizPaketler.filter((p) => (b === "tamamlanan" ? p.durum === "tamamlandi" : p.durum === "iptal")) : [] }))
          .filter((g) => g.l.length + g.pk.length > 0);
        if (!sira && !gruplar.length)
          return (
            <Kart>
              <Bos kucuk metin={t("oneriYok")} />
            </Kart>
          );
        return (
          <Kart className="muhabir-gruplari">
            {sira > 0 && (
              <section data-senin-siran>
                <h2 className="grup-basligi">
                  {t("seninSiran")} <span className="sayi-rozet">{sira}</span>
                </h2>
                <ul className="liste">
                  {bende.map((o) => (
                    <OneriSatiri key={o.id} o={o} not={o.durum === "duzeltme" ? o.duzeltmeNotu : undefined} />
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
              </section>
            )}
            {gruplar.map(({ b, l, pk }) => (
              // Önerisiz paket (plana doğrudan girmiş) arşivde öneri gibi: kapanınca muhabirin hiçbir listesinde kalmıyordu.
              <section key={b} data-muhabir-bolumu={b}>
                <h2 className="grup-basligi">
                  {t(BOLUM_ADI[b])} <span className="grup-sayi">{l.length + pk.length}</span>
                </h2>
                <ul className="liste">
                  {l.map((o) => (
                    <OneriSatiri key={o.id} o={o} not={b === "kabulEdilmeyen" ? o.gerekce : undefined} />
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
              </section>
            ))}
          </Kart>
        );
      })()}
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
          {p.gorev && p.sonTarih && ` · ${t("gvGun")}: ${tarihYaz(p.sonTarih, dil, "kisa")}`}
        </small>
        <KararNotlari kalem={p} />
      </div>
      {p.oncelikli && <OncelikRozeti />}
      {geciktiMi(p) && <Rozet ton="kotu">{t("gecikti")}</Rozet>}
      {/* Onaylı paketin sonucu muhabirden: yapıldı ya da sebebiyle yapılmadı, yetkili onaylıyor. Özel yayın paketi kendi teslimiyle. */}
      {p.durum === "onaylandi" && !eskiOzelPaket(p) ? (
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
  // Kullanıcı: biten haberler aylık, haftalık sıralanabilsin; seçim geçmiş adımında (geri gelince kalsın).
  const [grup, setGrup] = useAdimDurumu<HaberGrubu>("haberlerim:grup", "ay");
  const liste = v.paketler
    .filter(
      (p) =>
        p.muhabirId === ben.id &&
        p.durum === "tamamlandi" &&
        paketGorebilir(ben, p, v),
    )
    .map((p) => ({ p, gun: paketGunu(v, p) }))
    .sort((a, b) => b.gun.localeCompare(a.gun) || b.p.guncelleme.localeCompare(a.p.guncelleme));
  const anahtar = (gun: string) => (grup === "ay" ? gun.slice(0, 7) : grup === "hafta" ? haftaBasi(gun) : "");
  const baslik = (k: string) => (grup === "ay" ? ayAdi(k + "-01", dil, "yil") : aralikYaz(k, gunEkle(k, 6), dil));
  const gruplar: { k: string; l: typeof liste }[] = [];
  for (const x of liste) {
    const k = anahtar(x.gun);
    const son = gruplar[gruplar.length - 1];
    if (son && son.k === k) son.l.push(x);
    else gruplar.push({ k, l: [x] });
  }
  return (
    <Kart
      baslik={t("haberlerim")}
      ikon={<Newspaper size={18} />}
      ek={String(liste.length)}
    >
      {liste.length === 0 ? (
        <Bos metin={t("paketimYok")} />
      ) : (
        <>
          <div className="prg-seg" role="group" aria-label={t("hbGrupla")} data-haber-grup>
            {HABER_GRUPLARI.map((g) => (
              <button key={g} type="button" className={grup === g ? "acik" : ""} aria-pressed={grup === g} onClick={() => setGrup(g)} data-haber-grup-sec={g}>
                {t(HABER_GRUP_ADI[g])}
              </button>
            ))}
          </div>
          <div className="haber-gruplari" data-haberlerim>
            {gruplar.map(({ k, l }) => (
              <section key={k || "hepsi"} data-haber-donem={k || "hepsi"}>
                {k && (
                  <h2 className="grup-basligi">
                    {baslik(k)} <span className="grup-sayi">{l.length}</span>
                  </h2>
                )}
                <div className="bp-liste">
                  {l.map(({ p }) => (
                    <div key={p.id} data-haber={p.id}>
                      <BitmisPaketSeridi ben={ben} paket={p} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </Kart>
  );
}

type HaberGrubu = "ay" | "hafta" | "hepsi";
const HABER_GRUPLARI: HaberGrubu[] = ["ay", "hafta", "hepsi"];
const HABER_GRUP_ADI: Record<HaberGrubu, Anahtar> = { ay: "hbAylik", hafta: "hbHaftalik", hepsi: "hbHepsi" };

/* Menüde "Öneri gönder": muhabirin asıl işi, menünün başında. */
export const ONERI_GONDER_IKONU = Lightbulb;

/* --- Muhabirin sayfası, masaların kalıbıyla (kullanıcı: "muhabir sayfasının tasarımı program birimi gibi") --- */

type MuhabirBolum = "yapilacaklar" | "oneriler" | "takipler" | "paketler" | "saha";
const MUHABIR_BOLUMLERI: MuhabirBolum[] = ["yapilacaklar", "oneriler", "takipler", "paketler", "saha"];
const MB_ADI: Record<MuhabirBolum, Anahtar> = { yapilacaklar: "mYapilacaklar", oneriler: "mOnerilerim", takipler: "mTakiplerim", paketler: "haberlerim", saha: "mGorevlerim" };
const MB_IKONU: Record<MuhabirBolum, ReactNode> = {
  yapilacaklar: <ListTodo size={20} />,
  oneriler: <Lightbulb size={20} />,
  takipler: <Binoculars size={20} />,
  paketler: <Newspaper size={20} />,
  saha: <MapPinned size={20} />,
};

/*
 * Kutucuklar bağlantı (masalardaki gibi): sayfa adresle açılıyor, menü ve alt
 * çubuk adresten vurgulanıyor. Bölüm sayfasında telefonda gizli (alt çubuğu
 * tekrarlıyor, `.bolumde`).
 */
export function MuhabirCerceve({ ben, bolum, ana, children }: { ben: Kisi; bolum?: MuhabirBolum; ana?: boolean; children: ReactNode }) {
  const { t } = useDil();
  const v = useVeri();
  const B = bugun();
  const isler = muhabirYapilacaklari(v, ben, B);
  const bugunku = isler.filter((y) => y.grup === "geciken" || y.grup === "bugun").length;
  const oneriler = v.oneriler.filter((o) => o.muhabirId === ben.id && o.durum !== "takip" && oneriGorebilir(ben, o) && !oneriArsivde(o, B));
  const bekleyen = oneriler.filter((o) => o.durum === "duzeltme" || o.durum === "teklif").length;
  const takip = v.oneriler.filter((o) => o.muhabirId === ben.id && o.durum === "takip").length;
  const haber = v.paketler.filter((p) => p.muhabirId === ben.id && p.durum === "tamamlandi" && paketGorebilir(ben, p, v)).length;
  const gorev = v.gorevlendirmeler.filter((g) => g.kisiId === ben.id && g.durum !== "bitti").length;
  const bilgi: Record<MuhabirBolum, { alt: string; say: number }> = {
    yapilacaklar: { alt: t("ykAlt", { n: isler.length, m: bugunku }), say: bugunkuYapilacakSayisi(v, ben, B) },
    oneriler: { alt: t("ykOneriAlt", { n: oneriler.length }), say: bekleyen },
    takipler: { alt: t("ykTakipAlt", { n: takip }), say: 0 },
    paketler: { alt: t("ykHaberAlt", { n: haber }), say: 0 },
    saha: { alt: t("ykGorevAlt", { n: gorev }), say: 0 },
  };
  return (
    <div className={`prg-masa masa-muhabir${ana ? "" : " bolumde"}`} data-muhabir-sayfasi={bolum ?? "ana"}>
      <div className="prg-kutular kutu-5" role="tablist">
        {MUHABIR_BOLUMLERI.map((b) => (
          <a key={b} href={`#/${b}`} role="tab" aria-selected={bolum === b} className={`prg-kutu prg-k-${b}${bolum === b ? " secili" : ""}`} data-mb-kutu={b}>
            <span className="prg-kutu-ik">{MB_IKONU[b]}</span>
            <b>{t(MB_ADI[b])}</b>
            <small>{bilgi[b].alt}</small>
            {bilgi[b].say > 0 && <em className="prg-say">{bilgi[b].say}</em>}
          </a>
        ))}
      </div>
      {children}
    </div>
  );
}

/* Ana sayfa: kutucuklar ve altında Yapılacaklar (masada İçerikler gibi açılış bölümü). */
export default function MuhabirAna({ ben }: { ben: Kisi }) {
  return (
    <MuhabirCerceve ben={ben} bolum="yapilacaklar" ana>
      <AnildigimNotlar ben={ben} />
      <MuhabirYapilacaklar ben={ben} />
    </MuhabirCerceve>
  );
}

const YK_GRUP_ADI: Record<YapilacakGrubu, Anahtar> = { geciken: "ykGeciken", bugun: "ykBugun", yarin: "ykYarin", yakinda: "ykYakinda", ileride: "ykIleride", teslimsiz: "skTeslimYok" };

/*
 * Yapılacaklar: paket görevine dönmüş işler gün gruplarıyla (geciken, bugün,
 * yarın, yakında, ileride); her işte yapım aşaması (paketin kendi yolu),
 * kimde olduğu ve sırası muhabirdeyse yapacağı adım.
 */
export function MuhabirYapilacaklar({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const isler = muhabirYapilacaklari(v, ben);
  if (!isler.length)
    return (
      <Kart>
        <Bos kucuk metin={t("ykYok")} />
      </Kart>
    );
  return (
    <Kart className="muhabir-gruplari" data-yapilacaklar>
      {YAPILACAK_GRUPLARI.map((g) => {
        const l = isler.filter((y) => y.grup === g);
        if (!l.length) return null;
        return (
          <section key={g} data-yk-grup={g}>
            <h2 className="grup-basligi">
              {t(YK_GRUP_ADI[g])} <span className={g === "geciken" || g === "bugun" ? "sayi-rozet" : "grup-sayi"}>{l.length}</span>
            </h2>
            <ul className="liste">
              {l.map((y) => (
                <YapilacakSatiri key={y.paket.id} ben={ben} y={y} />
              ))}
            </ul>
          </section>
        );
      })}
    </Kart>
  );
}

function YapilacakSatiri({ ben, y }: { ben: Kisi; y: Yapilacak }) {
  const { t, dil } = useDil();
  const p = y.paket;
  const yol = sadeAkis(p) ? null : paketYolu(p);
  const simdi = yol ? (yol.find((a) => a.durum === "simdi" || a.durum === "gecikti") ?? yol[yol.length - 1]) : null;
  const asama = p.isaret ? t("msOnayBekliyor") : simdi ? simdi.ad : t(SADE_ASAMA_ADI[sadeSira(p)]);
  const kimde = !y.sirasi && simdi?.masa && simdi.masa !== "muhabir" ? birimAdi(simdi.masa) : "";
  return (
    <li data-yapilacak={p.id} data-sirasi={y.sirasi ? "muhabir" : "baska"}>
      <div className="ad">
        <a href={p.oneriId ? `#/oneriler/${p.oneriId}` : `#/paketler/${p.id}`}>
          <Icerik blok>{p.baslik}</Icerik>
        </a>
        <small>
          {/* Teslim günü olmayan iş kendi grubunda ("Teslim günü belirlenmedi"); satırda gün yazılmaz. */}
          {[y.gun && tarihYaz(y.gun, dil, "kisa"), p.teslim && `${t("teslim")} ${saatYaz(p.teslim, dil)}`, p.ozelId && `${t("ozel")}${p.ozelAd ? `: ${p.ozelAd}` : ""}`, asama]
            .filter(Boolean)
            .join(" · ")}
          {kimde && ` · ${kimde}`}
        </small>
        <AsamaCubugu paket={p} />
        <KararNotlari kalem={p} />
      </div>
      {p.oncelikli && <OncelikRozeti />}
      {geciktiMi(p) && <Rozet ton="kotu">{t("gecikti")}</Rozet>}
      <MesajRozeti ben={ben} paket={p} />
      {y.sirasi ? <SiradakiAdim ben={ben} paketId={p.id} /> : <a className="dugme dugme-kucuk dugme-ikincil" href={`#/paketler/${p.id}`}>{t("ykIzle")}</a>}
    </li>
  );
}

/* Sıra muhabirdeyse yapacağı adım: Paket satırının (Senin sıran) düğmesiyle aynı. */
function SiradakiAdim({ ben, paketId }: { ben: Kisi; paketId: string }) {
  const { t } = useDil();
  const v = useVeri();
  const p = v.paketler.find((x) => x.id === paketId);
  if (!p) return null;
  if (p.durum === "onaylandi" && !eskiOzelPaket(p)) return <PaketSonucDugmeleri ben={ben} paket={p} kucuk />;
  if (p.durum === "onaylandi")
    return (
      <button
        type="button"
        className="dugme dugme-iyi dugme-kucuk"
        onClick={() => confirm(t("eminMisin")) && paketTamamla(ben, p.id) && tamamlandiBildir(ben, t("bPaketTamamlandi"), { paketId: p.id })}
        data-paket-tamamla={p.id}
      >
        <CheckCircle size={14} /> {t("haberTamamlandi")}
      </button>
    );
  return (
    <a className="dugme dugme-kucuk" href={`#/paketler/${p.id}`}>
      {t(adimTuru(p) === "metin" ? "metniGonder" : adimTuru(p) === "is" ? "tamamlaVeGec" : "videoyuGonder")} <ArrowRight size={14} className="yon" />
    </a>
  );
}
