import { Combine, Lightbulb, Package, Radio, Sparkles, UserPlus, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Icerik, LiveKutusu, Pencere, TbcKutusu, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { YzSonGelismeler, kaynakAdlari } from "../../bilesenler/YzTakip";
import { OneriKaynagi } from "../../bilesenler/Tablolar";
import { metin, tarihYaz, useDil, type Anahtar } from "../../dil";
import { TBC, kisiAr, muhabirUnvani, sehirAr } from "../../etiketler";
import { haftaDosyaKat, haftaDosyaMuhabiri, haftaDosyasi, haftaDosyasiDegistir, haftaDosyasiKilitli, kalemKaydet } from "../../eylemler";
import { oneriHaftada, oneriYeri } from "../../oneriPlanlari";
import { oneriSekmesi } from "../../oneriSekmeleri";
import { baslikBul, kisiBul, useVeri, type Durum, type HaftalikPlan, type Kisi, type Oneri } from "../../veri";
import { haftalikDuzenler, yapabilir } from "../../yetki";
import { IkonDugme } from "../nextday/Bolumler";
import { MuhabirSecici } from "../nextday/Formlar";
import { DosyaCanliNafize } from "./CanliNafize";
import { GundemeEkle } from "./Plan";

/*
 * Weekly'de günün dosyası Next Day'in başlığı gibi (kullanıcı: haftalıktaki gün gündemi
 * Next Day'in başlık altı özellikleriyle birebir aynı olsun, Weekly'nin tasarımı kalsın):
 * başlığın muhabirleri (yer, muhabire not), TBC ve LIVE; dosyaya gelen öneriler, öneri ve
 * takiplerden alma, başka dosyaya katma, son gelişmeler (yapay zeka), canlı ve nafize,
 * hızlı ekleme satırı. Next Day'e geçerken dosyanın bilgisi başlığa taşınır (eylemler.ts →
 * haftaliktanAktar).
 */

const c = (k: Anahtar) => metin(k, "ar");

/* Satır: belgede kurumun kağıdının p'si, plan ekranında içerik satırı (bileşenin içinde tanımlanmaz). */
function Satir({ belge, children, className, ...p }: { belge?: boolean; children: ReactNode; className?: string; [k: string]: unknown }) {
  return belge ? (
    <p className={className} {...p}>
      {children}
    </p>
  ) : (
    <span dir="rtl" lang="ar" className="icerik blok kalem-satiri" {...p}>
      {children}
    </span>
  );
}

/* Dosyanın muhabirleri, TBC ve LIVE; Next Day başlığının satırları gibi. `belge`: kurumun kağıdı (p satırları). */
export function DosyaBilgisi({ hafta, tarih, baslikId, belge }: { hafta: HaftalikPlan; tarih: string; baslikId: string; belge?: boolean }) {
  const v = useVeri();
  const { t } = useDil();
  const x = haftaDosyasi(hafta, tarih, baslikId);
  if (!x.muhabirler.length && !x.muhabirTbc && !x.live) return null;
  return (
    <div className={belge ? "dosya-bilgisi" : "kayit dosya-bilgisi"} data-dosya-bilgisi={baslikId}>
      {x.muhabirler.length > 0 && (
        <>
          <Satir belge={belge} className="alt-baslik" data-dosya-muhabir-unvani>
            <b>{muhabirUnvani(x.muhabirler.map((m) => kisiBul(v, m.kisiId)))}</b>
          </Satir>
          {x.muhabirler.map((m) => (
            <Satir belge={belge} key={m.kisiId} data-dosya-muhabir={m.kisiId}>
              <b>{m.yer || sehirAr(kisiBul(v, m.kisiId)?.sehir)} / </b>
              {kisiAr(kisiBul(v, m.kisiId))}
              {/* Muhabire not çıktıya girmez (Next Day'deki gibi); ekranda sönük. */}
              {!belge && m.not && (
                <small className="sonuk" title={t("muhabireNot")}>
                  {" "}
                  ({m.not})
                </small>
              )}
            </Satir>
          ))}
        </>
      )}
      {!x.muhabirler.length && x.muhabirTbc && (
        <>
          <Satir belge={belge} className="alt-baslik">{c("ciktiMuhabir")}</Satir>
          <Satir belge={belge} data-tbc-satir>{TBC}</Satir>
        </>
      )}
      {x.live && (
        <Satir belge={belge}>
          <b data-live-satir>LIVE</b>
        </Satir>
      )}
    </div>
  );
}

type Acik = "muhabir" | "oneri" | "gelen" | "kat" | "son" | "canli" | "nafize";

/* Dosyanın açabileceği pencereler; araç düğmeleri ve hızlı ekleme satırının "/" menüsü aynı yeri açar. */
export function useDosyaPenceresi(ben: Kisi | undefined, hafta: HaftalikPlan, tarih: string, baslikId: string): [(a: Acik) => void, ReactNode] {
  const [acik, setAcik] = useState<Acik | null>(null);
  const kapat = () => setAcik(null);
  if (!ben || !acik) return [setAcik, null];
  const el =
    acik === "muhabir" ? (
      <DosyaMuhabirPenceresi ben={ben} hafta={hafta} tarih={tarih} baslikId={baslikId} kapat={kapat} />
    ) : acik === "oneri" || acik === "gelen" ? (
      <DosyaOneriPenceresi ben={ben} hafta={hafta} tarih={tarih} baslikId={baslikId} yalnizDosya={acik === "gelen"} kapat={kapat} />
    ) : acik === "kat" ? (
      <DosyaKatPenceresi ben={ben} hafta={hafta} tarih={tarih} baslikId={baslikId} kapat={kapat} />
    ) : acik === "son" ? (
      <DosyaSonGelismeler ben={ben} hafta={hafta} tarih={tarih} baslikId={baslikId} kapat={kapat} />
    ) : (
      <DosyaCanliNafize h={hafta} tarih={tarih} baslikId={baslikId} tur={acik} kapat={kapat} />
    );
  return [setAcik, el];
}

/* Dosyanın öneri adayları: bu haftaya düşen, karar bekleyen ve gündeme girmemiş öneriler ile takipler; önce bu dosyaya ya da bu güne gelenler. */
const dosyaAdaylari = (d: Durum, h: HaftalikPlan, tarih: string, baslikId: string) => {
  const aday = (o: Oneri) =>
    !oneriYeri(d, o) && (oneriSekmesi(d, o) === "karar" || o.durum === "takip") && (oneriHaftada(o, h) || (o.durum === "takip" && !o.arsiv));
  const liste = d.oneriler.filter(aday);
  const dosyanin = liste.filter((o) => !!baslikId && o.baslikId === baslikId);
  const gunun = liste.filter((o) => !dosyanin.includes(o) && !!tarih && (o.hedefTarih === tarih || (!!o.bitisTarih && o.hedefTarih! <= tarih && tarih <= o.bitisTarih)));
  return { dosyanin, gunun, digerleri: liste.filter((o) => !dosyanin.includes(o) && !gunun.includes(o)) };
};

/* Dosyanın araç düğmeleri (plan ekranında dosya başlığının yanında, belgede şeritte). */
export function DosyaAraclari({ ben, hafta, tarih, baslikId, ac, pkg }: { ben: Kisi; hafta: HaftalikPlan; tarih: string; baslikId: string; ac: (a: Acik) => void; pkg?: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  if (!haftalikDuzenler(ben, hafta)) return null;
  const { dosyanin, gunun, digerleri } = dosyaAdaylari(v, hafta, tarih, baslikId);
  const kilitli = haftaDosyasiKilitli(hafta, tarih, baslikId);
  const degerlendirir = yapabilir(ben, "oneriDegerlendir");
  return (
    <span className="dosya-araclari" data-dosya-araclari={baslikId}>
      {pkg && (
        <span data-dosya-pkg-ust>
          <IkonDugme ikon={<Package size={15} />} etiket={t("dosyayaPkgEkle")} onClick={pkg} />
        </span>
      )}
      {degerlendirir && dosyanin.length > 0 && (
        <span data-dosya-gelen>
          <IkonDugme ikon={<Lightbulb size={15} />} etiket={`${t("buBasligaGelenOneriler")} · ${dosyanin.length}`} onClick={() => ac("gelen")} />
        </span>
      )}
      {degerlendirir && dosyanin.length + gunun.length + digerleri.length > 0 && (
        <span data-dosya-oneriden-al>
          <IkonDugme ikon={<Users size={15} />} etiket={`${t("onerilerdenAl")} · ${dosyanin.length + gunun.length + digerleri.length}`} onClick={() => ac("oneri")} />
        </span>
      )}
      {!kilitli && (
        <span data-dosya-muhabir-ac>
          <IkonDugme ikon={<UserPlus size={15} />} etiket={t("muhabirAta")} onClick={() => ac("muhabir")} />
        </span>
      )}
      {tarih && (
        <span data-dosya-canli-ekle>
          <IkonDugme ikon={<Radio size={15} />} etiket={t("canliEkle")} onClick={() => ac("canli")} />
        </span>
      )}
      {tarih && (
        <span data-dosya-nafize-ekle>
          <IkonDugme ikon={<Radio size={15} className="yon" />} etiket={t("nafizeEkle")} onClick={() => ac("nafize")} />
        </span>
      )}
      <span data-dosya-son-gelismeler>
        <IkonDugme ikon={<Sparkles size={15} />} etiket={t("yzTakipMetni")} onClick={() => ac("son")} />
      </span>
      <span data-dosya-kat>
        <IkonDugme ikon={<Combine size={15} />} etiket={t("baslikaKat")} onClick={() => ac("kat")} />
      </span>
    </span>
  );
}

/* Dosyanın muhabirleri: yer ve muhabire not (Next Day'de plan onaylanınca muhabire gider), TBC, LIVE. */
function DosyaMuhabirPenceresi({ ben, hafta, tarih, baslikId, kapat }: { ben: Kisi; hafta: HaftalikPlan; tarih: string; baslikId: string; kapat: () => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const x = haftaDosyasi(hafta, tarih, baslikId);
  const degis = (f: Parameters<typeof haftaDosyasiDegistir>[4]) => haftaDosyasiDegistir(ben, hafta.id, tarih, baslikId, f);
  return (
    <Pencere baslik={t("muhabirAta")} alt={<Icerik>{baslikBul(v, baslikId)?.ad}</Icerik>} kapat={kapat}>
      <div className="form" data-dosya-muhabir-formu>
        {x.muhabirler.map((m) => (
          <div key={m.kisiId} className="satir" data-dosya-muhabir-satiri={m.kisiId}>
            <span>{ad(kisiBul(v, m.kisiId))}</span>
            <input
              {...icerikAlani}
              defaultValue={m.yer ?? ""}
              placeholder={sehirAr(kisiBul(v, m.kisiId)?.sehir)}
              aria-label={t("yer")}
              data-dosya-muhabir-yer
              onBlur={(e) => e.target.value.trim() !== (m.yer ?? "") && haftaDosyaMuhabiri(ben, hafta.id, tarih, baslikId, m.kisiId, { yer: e.target.value, not: m.not })}
            />
            <input
              dir="auto"
              defaultValue={m.not ?? ""}
              placeholder={t("muhabireNot")}
              aria-label={t("muhabireNot")}
              data-dosya-muhabir-not
              onBlur={(e) => e.target.value.trim() !== (m.not ?? "") && haftaDosyaMuhabiri(ben, hafta.id, tarih, baslikId, m.kisiId, { yer: m.yer, not: e.target.value })}
            />
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => haftaDosyaMuhabiri(ben, hafta.id, tarih, baslikId, m.kisiId, null)} title={t("cikar")} aria-label={t("cikar")}>
              ×
            </button>
          </div>
        ))}
        <div className="satir">
          <MuhabirSecici deger="" degistir={(id) => id && haftaDosyaMuhabiri(ben, hafta.id, tarih, baslikId, id, {})} bosEtiket={t("muhabirAta")} />
          {!x.muhabirler.length && <TbcKutusu secili={!!x.muhabirTbc} degistir={(b) => degis((y) => ({ ...y, muhabirTbc: b ? true : undefined }))} />}
          <LiveKutusu secili={!!x.live} degistir={(b) => degis((y) => ({ ...y, live: b ? true : undefined }))} />
        </div>
      </div>
    </Pencere>
  );
}

/* Öneri ve takiplerden al: seçilen öneri bu gün ve dosyayla gündeme eklenir (Weekly'nin "Gündeme ekle" formu). */
function DosyaOneriPenceresi({ ben, hafta, tarih, baslikId, yalnizDosya, kapat }: { ben: Kisi; hafta: HaftalikPlan; tarih: string; baslikId: string; yalnizDosya: boolean; kapat: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [secili, setSecili] = useState<Oneri | null>(null);
  const { dosyanin, gunun, digerleri } = dosyaAdaylari(v, hafta, tarih, baslikId);
  if (secili)
    return (
      <Pencere baslik={t("gundemeEkle")} kapat={() => setSecili(null)}>
        <GundemeEkle ben={ben} hafta={hafta} oneri={secili} yer={{ tarih, baslikId }} kapat={kapat} />
      </Pencere>
    );
  const kart = (o: Oneri) => (
    <li key={o.id} className="oneriden-al-satir" data-oneriden-al={o.id}>
      <div className="ad">
        <small>
          {o.muhabirId ? ad(kisiBul(v, o.muhabirId)) : <OneriKaynagi oneri={o} d={v} />}
          {o.hedefTarih && ` · ${tarihYaz(o.hedefTarih, dil, "kisa")}`}
        </small>
        <b>
          <Icerik blok>{o.haberBasligi}</Icerik>
        </b>
        {o.gelisme && <Icerik blok>{o.gelisme}</Icerik>}
        {o.paketBasligi && (
          <small>
            PKG · <Icerik>{o.paketBasligi}</Icerik>
          </small>
        )}
      </div>
      <button type="button" className="dugme dugme-kucuk" onClick={() => setSecili(o)} data-oneriden-ekle={o.id}>
        {t("gundemeEkle")}
      </button>
    </li>
  );
  const grup = (baslik: Anahtar, l: Oneri[]) =>
    l.length > 0 && (
      <>
        <h3 className="pencere-ara-baslik">{t(baslik)}</h3>
        <ul className="liste oneriden-al">{l.map(kart)}</ul>
      </>
    );
  return (
    <Pencere baslik={t(yalnizDosya ? "buBasligaGelenOneriler" : "onerilerdenAl")} alt={<Icerik>{baslikBul(v, baslikId)?.ad}</Icerik>} kapat={kapat}>
      {grup("buBasligaGelenOneriler", dosyanin)}
      {!yalnizDosya && grup("buPlanaGelenOneriler", gunun)}
      {!yalnizDosya && grup("digerGunlerinOnerileri", digerleri)}
    </Pencere>
  );
}

/* Dosyayı aynı günün başka dosyasına katar (Next Day'in "Başka başlığa kat"ı). */
function DosyaKatPenceresi({ ben, hafta, tarih, baslikId, kapat }: { ben: Kisi; hafta: HaftalikPlan; tarih: string; baslikId: string; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const adi = (id: string) => baslikBul(v, id)?.ad ?? "";
  const hedefler = [
    ...new Set(
      [...hafta.kalemler, ...(hafta.canlilar ?? []), ...(hafta.nafizeler ?? [])]
        .filter((x) => (x.tarih ?? "") === tarih && x.baslikId && x.baslikId !== baslikId)
        .map((x) => x.baslikId as string),
    ),
  ];
  return (
    <Pencere baslik={t("baslikaKat")} alt={<Icerik>{adi(baslikId)}</Icerik>} kapat={kapat}>
      <div className="dugmeler dikey" data-kat-hedefleri>
        {hedefler.map((id) => (
          <button
            key={id}
            type="button"
            className="dugme dugme-ikincil"
            data-kat-hedef={id}
            onClick={() => {
              kapat();
              if (!confirm(t("baslikKatilsinMi", { katilan: adi(baslikId), hedef: adi(id) }))) return;
              if (haftaDosyaKat(ben, hafta.id, tarih, baslikId, id)) bildir(t("baslikKatildi"));
            }}
          >
            <Icerik>{adi(id)}</Icerik>
          </button>
        ))}
      </div>
    </Pencere>
  );
}

/* Son gelişmeler (yapay zeka) dosyaya kalem olarak; kaynak alıntılanan siteler (medya). */
function DosyaSonGelismeler({ ben, hafta, tarih, baslikId, kapat }: { ben: Kisi; hafta: HaftalikPlan; tarih: string; baslikId: string; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const b = baslikBul(v, baslikId);
  if (!b) return null;
  return (
    <Pencere baslik={t("yzTakipMetni")} alt={<Icerik>{b.ad}</Icerik>} kapat={kapat}>
      <YzSonGelismeler
        baslik={b.ad}
        baslikId={b.id}
        ekleMetni={t("yzGelismeOlarakEkle")}
        ekle={(s) => {
          const id = kalemKaydet(ben, hafta.id, { tarih, baslikId, metin: s.metin, tur: "haber", bicimler: [], muhabirler: [], kaynakTuru: "medya", kaynakAdi: kaynakAdlari(s) });
          if (id) {
            bildir(t("bKaydedildi"));
            kapat();
          }
        }}
      />
    </Pencere>
  );
}

/*
 * Dosyanın hızlı ekleme satırı (Next Day belgesindeki gibi): yazıp Enter kalem ("YER / metin"
 * ise yer ayrılır); "/" menüsü kalem, PKG, muhabir ve canlı pencerelerini açar.
 */
export function HizliKalem({ ben, hafta, tarih, baslikId, sonra, kalemAc, ac }: { ben: Kisi; hafta: HaftalikPlan; tarih: string; baslikId: string; sonra?: string; kalemAc: (pkg: boolean) => void; ac: (a: Acik) => void }) {
  const { t } = useDil();
  const [yazi, setYazi] = useState("");
  const [secili, setSecili] = useState(0);
  if (!haftalikDuzenler(ben, hafta)) return null;
  const menu = yazi.startsWith("/");
  const secenekler: [Anahtar, () => void][] = [
    ["kalemEkle", () => kalemAc(false)],
    ["pkgEkle", () => kalemAc(true)],
    ["muhabirAta", () => ac("muhabir")],
    ...(tarih ? ([["canliEkle", () => ac("canli")], ["nafizeEkle", () => ac("nafize")]] as [Anahtar, () => void][]) : []),
  ];
  const ara = yazi.slice(1).trim().toLocaleLowerCase();
  const uyan = secenekler.filter(([k]) => !ara || t(k).toLocaleLowerCase().includes(ara));
  const sec = (f: () => void) => {
    setYazi("");
    f();
  };
  const ekle = () => {
    const ham = yazi.trim();
    if (!ham) return;
    const i = ham.indexOf(" / ");
    const yer = i > 0 && i < 30 ? ham.slice(0, i).trim() : undefined;
    const govde = yer ? ham.slice(i + 3).trim() : ham;
    if (!govde) return;
    if (kalemKaydet(ben, hafta.id, { tarih, baslikId: baslikId || undefined, yer, metin: govde, tur: "haber", bicimler: [], muhabirler: [] }, sonra)) setYazi("");
  };
  return (
    <div className="hizli-ekle">
      <input
        {...icerikAlani}
        value={yazi}
        placeholder={t("hizliEkleYer")}
        aria-label={t("hizliEkleYer")}
        onChange={(e) => {
          setYazi(e.target.value);
          setSecili(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setYazi("");
          if (menu && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setSecili((x) => (x + (e.key === "ArrowDown" ? 1 : uyan.length - 1)) % Math.max(uyan.length, 1));
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (menu) uyan[secili] && sec(uyan[secili][1]);
            else ekle();
          }
        }}
        data-hf-hizli-ekle={`${tarih}|${baslikId}`}
      />
      {menu && uyan.length > 0 && (
        <div className="hizli-menu" role="listbox">
          {uyan.map(([k, f], i) => (
            <button key={k} type="button" role="option" aria-selected={i === secili} className={i === secili ? "secili" : ""} onMouseDown={(e) => e.preventDefault()} onClick={() => sec(f)} data-hizli-secenek={k}>
              {t(k)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
