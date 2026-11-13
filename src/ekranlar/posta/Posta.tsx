import { postaAdresi } from "../../girisKodu";
import { kapiHatasi } from "../../yz";
import { muhabirAdresi } from "../../muhabirIletisim";
import { ArrowLeft, CheckCheck, ChevronDown, ChevronUp, File, Loader2, Lock, Mail, MailOpen, MessageSquare, Plus, RefreshCw, Search, Send, Trash2, X } from "lucide-react";
import { GOMULU, useAdimDurumu, useGeriKapatir } from "../../yol";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bos, Icerik, Kart, Pencere, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { saatYaz, useDil } from "../../dil";
import { postaGidenEkle, postaSil, postaEtiketsizleriGruba, postaHepsiOkundu, postaOkumaBaslat, postaOkundu, postaOkunmadi } from "../../eylemler";
import { gizliEkMi, gondereniBul, komutSatiri, postaAlintiMetni, postaKomutlari, postaKonuBasligi, postaKonuCekirdegi, postaMetniSadelestir, yeniMetin, type KomutTuru } from "../../eposta";
import { useVeri, type Kisi, type PostaMesaji } from "../../veri";
import { yerelGun } from "../../tarih";
import { GERCEK, firebaseYukle, useSunucuyaEsit } from "../../kip";
import { gorunenPostalar, okunmamisMi } from "../../postaOkuma";
import { postaEkiGetir, postalariCek, postaGonder, postaKimlikGetir } from "../../posta-kapi";
import { SayfaBasi } from "../ana/Planlama";
import { sozcuklerUyar } from "../../arama";

/**
 * Gelen posta sohbeti: kişinin grup kutusuna düşen postalar, eklerinden
 * arındırılmış ve alıntı/imza ayıklanmış biçimde, konuya göre sohbet
 * iplikçiklerinde (eylemler.ts → postaIsle). Öneri-yanıt akışından ayrı;
 * çağrıya bağlı değil. Gerçek kipte kutudan (EWS) besleniyor; içe aktarma
 * kartı kalktı. Basit mesaj mantığı: yanıt yazışmadaki herkese gider, yalnız
 * yeni CC eklenir; "+" yeni posta açar. Grup her zaman CC'de (kapı ekliyor).
 */

interface Sohbet {
  konuKimligi: string;
  /* Aynı konunun sunucuda ayrı yazışma kimliğiyle gelmiş iplikleri de (silme hepsini kaldırır). */
  kimlikler: string[];
  baslik: string;
  mesajlar: PostaMesaji[];
  son: PostaMesaji;
}

const enEski = (l: PostaMesaji[]) => l.reduce((e, m) => (m.zaman < e ? m.zaman : e), l[0].zaman);

/*
 * Mesajları ipliklere ayırıp en yeni sohbet üstte. İplik sunucunun yazışma
 * kimliği; ama Yahoo ya da başka istemciden gelen yanıt yeni kimlikle
 * geliyor, aynı postanın yanıtı ayrı sohbet açıyordu. Konu çekirdeği aynı
 * (yeterince uzun, "Re:" gibi kısa konular karışmasın) iplikler birleşir.
 */
const sohbetleriKur = (mesajlar: PostaMesaji[]): Sohbet[] => {
  const grup = new Map<string, PostaMesaji[]>();
  for (const m of mesajlar) {
    const l = grup.get(m.konuKimligi) ?? [];
    l.push(m);
    grup.set(m.konuKimligi, l);
  }
  const birlesik = new Map<string, { kimlikler: string[]; liste: PostaMesaji[] }>();
  const iplikler = [...grup.entries()].sort((a, b) => enEski(a[1]).localeCompare(enEski(b[1])));
  for (const [kimlik, liste] of iplikler) {
    const c = postaKonuCekirdegi(liste[0].konu);
    const anahtar = c.length >= 12 ? `c:${c}` : `k:${kimlik}`;
    const var_ = birlesik.get(anahtar);
    if (var_) {
      var_.kimlikler.push(kimlik);
      var_.liste.push(...liste);
    } else birlesik.set(anahtar, { kimlikler: [kimlik], liste: [...liste] });
  }
  return [...birlesik.values()]
    .map(({ kimlikler, liste }) => {
      const sirali = [...liste].sort((a, b) => a.zaman.localeCompare(b.zaman));
      const son = sirali[sirali.length - 1];
      return { konuKimligi: kimlikler[0], kimlikler, baslik: postaKonuBasligi(son.konu) || son.konu, mesajlar: sirali, son };
    })
    .sort((a, b) => b.son.zaman.localeCompare(a.son.zaman));
};

/*
 * Gönderenin görünen adı: kayıtlı kişiyse adı; değilse postadaki görünen ad
 * (adres kısmı atılır: "Ad <x@y>" → "Ad", yoksa "x@y" → "x"). E-posta hiç
 * görünmesin, yalnız isim.
 */
const gonderenAdi = (v: ReturnType<typeof useVeri>, m: PostaMesaji, ad: (k: Kisi) => string): string => {
  const kisi = gondereniBul(v, m.kimden);
  if (kisi) return ad(kisi);
  const ham = (m.kimdenAd || m.kimden).trim();
  const esli = ham.match(/^"?([^"<]+?)"?\s*<[^>]+>$/);
  if (esli) return esli[1].trim();
  return ham.includes("@") ? ham.split("@")[0] : ham;
};

/* Sohbet kartının avatar harfi ve rengi (konuya göre sabit). */
const ilkHarf = (s: string): string => [...s.trim()][0]?.toLocaleUpperCase("tr") ?? "?";
const sohbetTonu = (s: string): string => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 42% 52%)`;
};

/* Sohbet listesinde gönderenin adı (e-postasız). */
const GonderenEtiketi = ({ m }: { m: PostaMesaji }) => {
  const { ad } = useDil();
  const v = useVeri();
  const kisi = gondereniBul(v, m.kimden);
  return <b dir={kisi ? undefined : "ltr"}>@{gonderenAdi(v, m, ad)}</b>;
};

type Veri = ReturnType<typeof useVeri>;
const ADRES = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const kucuk = (a: string) => a.trim().toLowerCase();
const tekil = (l: string[]) => [...new Set(l.map(kucuk).filter(Boolean))];

/* Adresin görünen adı: kayıtlı kişiyse adı, değilse yerel kısmı (adres ekranda kalabalık etmesin; tamamı ipucunda). */
const adresAdi = (v: Veri, adres: string, ad: (k: Kisi) => string): string => {
  const kisi = gondereniBul(v, adres);
  return kisi ? ad(kisi) : adres.split("@")[0];
};

/* Adres önerileri: e-postası olan kayıtlı kişiler ve yazışmalarda geçen adresler; Arapça, Latin ad ya da adresle aranır. */
type AdresOnerisi = { adres: string; ad: string; ara: string; adlar: string[] };
const useAdresOnerileri = (): AdresOnerisi[] => {
  const v = useVeri();
  const { ad } = useDil();
  const adresler = new Set<string>();
  for (const k of v.kisiler) if (postaAdresi(k) && ADRES.test(postaAdresi(k))) adresler.add(postaAdresi(k));
  for (const m of v.postaMesajlari ?? []) for (const a of [m.kimden, ...(m.kime ?? []), ...(m.cc ?? [])]) if (a && ADRES.test(kucuk(a))) adresler.add(kucuk(a));
  return [...adresler].map((a) => {
    const kisi = gondereniBul(v, a);
    const adi = adresAdi(v, a, ad);
    // Latin yazımla da aransın (kişi adı ekranda Arapça; arama Latin de tanır).
    const latinler = !kisi ? [] : typeof kisi.ad === "string" ? [kisi.ad] : [kisi.ad.tr, kisi.ad.en];
    const adlar = [adi, ...latinler, a.split("@")[0]].filter((x): x is string => !!x).map((x) => x.trim().toLocaleLowerCase("tr"));
    return { adres: a, ad: adi, ara: [...adlar, a].join(" "), adlar };
  });
};

/*
 * Adres girdisi: çipler ve yazı alanı. Enter, virgül ya da noktalı virgül
 * adresi çipe çevirir; yazarken öneriler kutunun altında düğme (datalist
 * değil: Android'de klavye dili değişince klavyeyi kapatıyordu). "kilitli"
 * grup adresi (silinmez, kilitli), "sabit" yazışmadan gelenler (silinmez).
 */
function AdresGirdisi({
  etiket,
  adresler,
  degistir,
  kilitli = [],
  sabit = [],
  yerTutucu,
}: {
  etiket: string;
  adresler: string[];
  degistir: (l: string[]) => void;
  kilitli?: string[];
  sabit?: string[];
  yerTutucu?: string;
}) {
  const { t, ad } = useDil();
  const v = useVeri();
  const oneriler = useAdresOnerileri();
  const [yazi, setYazi] = useState("");
  const secili = new Set([...adresler, ...kilitli, ...sabit].map(kucuk));
  const ara = yazi.trim().toLocaleLowerCase("tr");
  const uygun = ara ? oneriler.filter((o) => !secili.has(o.adres) && o.ara.includes(ara)).slice(0, 6) : [];
  const ekle = (ham: string): boolean => {
    const a = kucuk(ham);
    if (!a) return true;
    if (!ADRES.test(a)) return false;
    if (!secili.has(a)) degistir([...adresler, a]);
    return true;
  };
  const isle = (sessiz = false) => {
    const parcalar = yazi.split(/[,;\s]+/).filter(Boolean);
    if (!parcalar.length) return;
    // Tek sözcük adres değilse ve tek öneri uyuyorsa onu al ("ali" → Ali'nin adresi).
    if (parcalar.length === 1 && !ADRES.test(kucuk(parcalar[0])) && uygun.length === 1) {
      ekle(uygun[0].adres);
      setYazi("");
      return;
    }
    const kalan = parcalar.filter((x) => !ekle(x));
    if (kalan.length && !sessiz) bildir(t("bPostaAdresGecersiz", { a: kalan.join(", ") }));
    setYazi(kalan.join(" "));
  };
  return (
    <div className="posta-adres-alani">
      <div className="posta-adresler" data-posta-adres={etiket}>
        {kilitli.map((a) => (
          <span key={a} className="posta-cip kilitli" title={`${a} · ${t("postaGrupSabit")}`}>
            <Lock size={12} aria-hidden="true" />
            <bdi>{adresAdi(v, a, ad)}</bdi>
          </span>
        ))}
        {sabit.map((a) => (
          <span key={a} className="posta-cip" title={a}>
            <bdi>{adresAdi(v, a, ad)}</bdi>
          </span>
        ))}
        {adresler.map((a) => (
          <span key={a} className="posta-cip" title={a} data-posta-cip={a}>
            <bdi>{adresAdi(v, a, ad)}</bdi>
            <button type="button" onClick={() => degistir(adresler.filter((x) => x !== a))} aria-label={t("sil")} title={t("sil")}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          dir="auto"
          value={yazi}
          placeholder={yerTutucu ?? t("postaAdresYaz")}
          onChange={(e) => setYazi(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "," || e.key === ";") {
              e.preventDefault();
              isle();
            } else if (e.key === "Backspace" && !yazi && adresler.length) degistir(adresler.slice(0, -1));
          }}
          // Ayrılınca yalnız geçerli adresi al; yarım yazıya uyarı verme.
          onBlur={() => isle(true)}
          data-posta-adres-yaz={etiket}
        />
      </div>
      {uygun.length > 0 && (
        <div className="posta-oneriler">
          {uygun.map((o) => (
            <button
              key={o.adres}
              type="button"
              className="dugme dugme-ikincil dugme-kucuk"
              // Odak yazı alanında kalsın; yoksa onBlur yarım yazıyı işlerdi.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                ekle(o.adres);
                setYazi("");
              }}
              title={o.adres}
              data-posta-oneri={o.adres}
            >
              <bdi>{o.ad}</bdi>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Balonun altındaki "→ kime · CC: …" satırı: kim kime yazdı her zaman görünsün. */
function AliciSatiri({ m }: { m: PostaMesaji }) {
  const { t, ad } = useDil();
  const v = useVeri();
  if (!m.kime?.length && !m.cc?.length) return null;
  const adlar = (l: string[]) => l.map((a) => adresAdi(v, a, ad)).join(", ");
  return (
    <div className="posta-alicilar" dir="auto" title={[...(m.kime ?? []), ...(m.cc ?? [])].join(", ")} data-posta-alici-satiri>
      → {adlar(m.kime ?? [])}
      {m.cc?.length ? ` · ${t("postaCc")}: ${adlar(m.cc)}` : ""}
    </div>
  );
}

/* Gönderene göre sabit, hafif ton (balonun zemini ve adı): kim yazdı bir bakışta ayrılsın. */
const gonderenTonu = (adres: string): string => {
  let h = 7;
  for (const c of adres.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  // Giden balonun kırmızımsı tonuna (330–40) düşmesin: gelenle giden karışmasın.
  return String(40 + (h % 280));
};

/* Dosyanın türü uzantıdan: ikonun rengi ve üstündeki etiket (PDF kırmızı, XLS yeşil…). */
const DOSYA_TURU: Record<string, string> = {
  pdf: "pdf", doc: "doc", docx: "doc", rtf: "doc", txt: "doc", xls: "xls", xlsx: "xls", csv: "xls", ppt: "ppt", pptx: "ppt",
  zip: "zip", rar: "zip", "7z": "zip", jpg: "gorsel", jpeg: "gorsel", png: "gorsel", heic: "gorsel", mp4: "video", mov: "video", mp3: "ses", wav: "ses", m4a: "ses",
};
/* İkondaki etiket kurumun alıştığı üç harf: .xlsx da XLS, .docx da DOC. */
const ETIKET: Record<string, string> = { pdf: "pdf", xls: "xls", doc: "doc", ppt: "ppt", zip: "zip" };
const uzanti = (ad: string) => (ad.includes(".") ? ad.split(".").pop()!.toLowerCase() : "");
const uzantisiz = (ad: string) => (ad.includes(".") ? ad.slice(0, ad.lastIndexOf(".")) : ad);

function DosyaIkonu({ ad, buyuk }: { ad: string; buyuk?: boolean }) {
  const u = uzanti(ad);
  return (
    <span className={`dosya-ikon${buyuk ? " buyuk" : ""}`} data-tur={DOSYA_TURU[u] ?? "diger"} aria-hidden="true">
      <File size={buyuk ? 44 : 26} strokeWidth={1.4} />
      {u && <b>{(ETIKET[DOSYA_TURU[u]] ?? u.slice(0, 4)).toUpperCase()}</b>}
    </span>
  );
}

/*
 * Ekin kendisi: kayıtta yalnız adı var, dosyayı kapı kişinin kendi kutusundan
 * getirir (posta-kapi.ts → postaEkiGetir) ve tarayıcı indirir. Demoda kutu yok.
 */
const useEkIndir = () => {
  const { t } = useDil();
  const [suren, setSuren] = useState("");
  const indir = async (m: PostaMesaji, ad: string) => {
    if (!GERCEK) return bildir(t("postaEkDemo"));
    if (!m.mesajKimligi) return bildir(t("postaEkYok"));
    const anahtar = `${m.id}:${ad}`;
    if (suren) return;
    setSuren(anahtar);
    const r = await postaEkiGetir(m.mesajKimligi, ad);
    setSuren("");
    if (!r.tamam) return bildir(r.hata === "ekYok" ? t("postaEkYok") : r.hata === "ekBuyuk" ? t("postaEkBuyuk") : kapiHatasi(r, t("postaEkHata")));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(r.veri);
    a.download = ad;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };
  return { indir, suruyor: (m: PostaMesaji, ad: string) => suren === `${m.id}:${ad}` };
};

/* Balondaki zaman: gün ve saat birlikte (gün ayracı yok). */
const balonZamani = (zaman: string, dil: Parameters<typeof saatYaz>[1]) => `${yerelGun(zaman).split("-").reverse().join(".")} ${saatYaz(zaman, dil)}`;

/*
 * Sohbet: gelen balon başta, giden sonda, aralarında girinti; her gönderenin
 * kendi hafif tonu, adı grup başına bir kez (ardışık aynı gönderende
 * tekrarlamaz). Ek balonun içinde türünün ikonuyla; altta kime gittiği.
 */
/*
 * Balonda gösterilen metin. Sohbet içi arama da bunu arar: ekranda
 * görünmeyen imza ya da alıntı eşleşip boş görünen balonu işaretlemesin.
 */
function balonIcerigi(v: ReturnType<typeof useVeri>, m: PostaMesaji, ad: ReturnType<typeof useDil>["ad"]) {
  const kisi = gondereniBul(v, m.kimden);
  const gad = gonderenAdi(v, m, ad);
  // Kayıttaki metin kapının o günkü kurallarıyla kesilmiş; yeni kalıplar (Yahoo'nun iletisi) eski postaya da uygulansın.
  // İmzadaki ad Latin yazımla da olabiliyor ("Basel Awni Al TANANY"): adın bütün yazımları ve postadaki görünen ad.
  const imzaAdi = [gad, ...(typeof kisi?.ad === "object" ? [kisi.ad.tr, kisi.ad.en] : [kisi?.ad]), m.kimdenAd].filter(Boolean).join(" ");
  const sade = m.giden ? m.metin : postaMetniSadelestir(yeniMetin(m.metin), imzaAdi);
  // Yeni metin yoksa (yalnız imza), düzeltilip dönen alıntı metnini göster.
  const alinti = !m.giden && !sade.trim() ? postaAlintiMetni(m.tamMetin, gad) : "";
  const govde = sade.trim() ? sade : alinti;
  const ekler = m.ekler.filter((e) => !gizliEkMi(e));
  return { kisi, gad, sade, govde, ekler };
}

function SohbetGovdesi({ sohbet, bulunan, simdi }: { sohbet: Sohbet; bulunan?: Set<string>; simdi?: string }) {
  const { ad, dil, t } = useDil();
  const v = useVeri();
  const ek = useEkIndir();
  return (
    <div className="posta-govde" data-posta-sohbet={sohbet.konuKimligi}>
      <ol className="posta-mesajlar">
        {sohbet.mesajlar.map((m, i) => {
          const onceki = sohbet.mesajlar[i - 1];
          const yeniGonderen = !onceki || onceki.kimden !== m.kimden || !!onceki.giden !== !!m.giden;
          const { kisi, gad, sade, govde, ekler } = balonIcerigi(v, m, ad);
          const bulundu = bulunan?.has(m.id) ? (m.id === simdi ? " bulundu simdi" : " bulundu") : "";
          return (
            <li key={m.id} className={`posta-balon${m.giden ? " giden" : ""}${yeniGonderen ? " ilk" : ""}${bulundu}`} style={m.giden ? undefined : { ["--ton" as string]: gonderenTonu(m.kimden) }} data-posta-mesaj={m.id}>
              {yeniGonderen && !m.giden && (
                <div className="posta-gonderen" dir={kisi ? undefined : "ltr"}>
                  {gad}
                </div>
              )}
              {govde.trim() ? (
                <Icerik blok className={`posta-metin${!sade.trim() ? " posta-alinti" : ""}`}>
                  {govde}
                </Icerik>
              ) : (
                !m.giden && ekler.length === 0 && <span className="posta-bos">{t("postaBosGovde")}</span>
              )}
              {ekler.map((e, j) => (
                <button type="button" className="posta-ek" key={j} onClick={() => ek.indir(m, e)} aria-busy={ek.suruyor(m, e)} title={t("postaEkIndir")} data-posta-ek={e}>
                  {ek.suruyor(m, e) ? <Loader2 size={22} className="donen" /> : <DosyaIkonu ad={e} />}
                  <bdi>{e}</bdi>
                </button>
              ))}
              <AliciSatiri m={m} />
              <span className="posta-zaman">{balonZamani(m.zaman, dil)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/*
 * Sohbet içi arama (kullanıcının isteği): eşleşen balonlar işaretlenir, sayaç
 * ve oklarla aralarında gezilir; en yeni eşleşmeden başlar. Enter sonraki
 * (daha eski), Shift+Enter önceki, Esc kapatır.
 */
function useSohbetAramasi(sohbet: Sohbet | undefined, onSorgu: string) {
  const { ad } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  const [sorgu, setSorgu] = useState("");
  const [sira, setSira] = useState(0);
  const anahtar = sohbet?.konuKimligi ?? "";
  // Başka sohbete geçince arama kapanır: eski sorgu yeni sohbette boş sonuç gösterirdi.
  // Genel aramadan açılan sohbette aynı sorgu açık gelir, eşleşen mesaja kayar.
  useEffect(() => {
    setAcik(!!onSorgu.trim());
    setSorgu(onSorgu.trim() ? onSorgu : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anahtar]);
  const sorguVar = acik && !!sorgu.trim();
  const eslesen = !sohbet || !sorguVar
    ? []
    : sohbet.mesajlar
        .filter((m) => {
          const b = balonIcerigi(v, m, ad);
          return sozcuklerUyar([b.govde, b.gad, ...b.ekler].join(" "), sorgu);
        })
        .map((m) => m.id)
        .reverse();
  const n = eslesen.length;
  const simdi = n ? eslesen[Math.min(sira, n - 1)] : undefined;
  useEffect(() => setSira(0), [sorgu]);
  useEffect(() => {
    if (!simdi) return;
    document.querySelector<HTMLElement>(`[data-posta-mesaj="${CSS.escape(simdi)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [simdi]);
  return {
    acik,
    ac: () => setAcik(true),
    kapat: () => {
      setAcik(false);
      setSorgu("");
    },
    sorgu,
    setSorgu,
    sorguVar,
    n,
    konum: n ? Math.min(sira, n - 1) + 1 : 0,
    // Liste en yeniden en eskiye: "sonraki" daha eski mesaj.
    sonraki: () => n && setSira((x) => (Math.min(x, n - 1) + 1) % n),
    onceki: () => n && setSira((x) => (Math.min(x, n - 1) - 1 + n) % n),
    bulunan: sorguVar ? new Set(eslesen) : undefined,
    simdi,
  };
}

function SohbetAramaCubugu({ a }: { a: ReturnType<typeof useSohbetAramasi> }) {
  const { t } = useDil();
  return (
    <div className="posta-ara" role="search" data-posta-ara>
      <Search size={16} className="sonuk" aria-hidden="true" />
      <input
        type="text"
        dir="auto"
        autoFocus
        value={a.sorgu}
        onChange={(e) => a.setSorgu(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) a.onceki();
            else a.sonraki();
          } else if (e.key === "Escape") {
            e.preventDefault();
            a.kapat();
          }
        }}
        placeholder={t("postaSohbetAra")}
        aria-label={t("postaSohbetAra")}
        data-posta-ara-girdi
      />
      {a.sorguVar && (
        <small className={`posta-ara-sayi${a.n ? "" : " yok"}`} aria-live="polite" data-posta-ara-sayi>
          {a.n ? `${a.konum}/${a.n}` : t("postaAramaYok")}
        </small>
      )}
      <button type="button" className="dugme dugme-sade dugme-ikon" onClick={a.onceki} disabled={!a.n} title={t("postaAramaYeni")} aria-label={t("postaAramaYeni")} data-posta-ara-onceki>
        <ChevronUp size={16} />
      </button>
      <button type="button" className="dugme dugme-sade dugme-ikon" onClick={a.sonraki} disabled={!a.n} title={t("postaAramaEski")} aria-label={t("postaAramaEski")} data-posta-ara-sonraki>
        <ChevronDown size={16} />
      </button>
      <button type="button" className="dugme dugme-sade dugme-ikon" onClick={a.kapat} title={t("kapat")} aria-label={t("kapat")} data-posta-ara-kapat>
        <X size={16} />
      </button>
    </div>
  );
}

/*
 * Sohbetin dosyaları yanda dikey (kullanıcı: üstte yatay şerit değil): en
 * yenisi üstte; basınca dosya iner, geldiği mesaj da görünür olur.
 */
function SohbetDosyalari({ sohbet }: { sohbet: Sohbet }) {
  const { t } = useDil();
  const ek = useEkIndir();
  const dosyalar = sohbet.mesajlar.flatMap((m) => m.ekler.filter((e) => !gizliEkMi(e)).map((ad) => ({ ad, m }))).reverse();
  if (!dosyalar.length) return null;
  const git = (id: string) => {
    const el = document.querySelector<HTMLElement>(`[data-posta-mesaj="${CSS.escape(id)}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.remove("vurgulu");
    void el.offsetWidth;
    el.classList.add("vurgulu");
  };
  return (
    <aside className="posta-dosyalar" aria-label={t("postaDosyalar")} data-posta-dosyalar>
      <ol>
        {dosyalar.map(({ ad, m }, i) => (
          <li key={`${m.id}-${i}`}>
            <button
              type="button"
              className="posta-dosya"
              title={`${ad} · ${t("postaEkIndir")}`}
              aria-busy={ek.suruyor(m, ad)}
              onClick={() => {
                git(m.id);
                void ek.indir(m, ad);
              }}
              data-posta-dosya
            >
              {ek.suruyor(m, ad) ? <Loader2 size={44} className="donen" /> : <DosyaIkonu ad={ad} buyuk />}
              <bdi>{uzantisiz(ad)}</bdi>
              <small>{yerelGun(m.zaman).split("-").reverse().join(".")}</small>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}

/*
 * "Tümünü yanıtla": yazışmadaki son gelen postanın göndereni ve Kime'si
 * Kime'ye, CC'si CC'ye; kişinin kendi adresi ve grup çıkarılır (grup kilitli
 * CC'de ayrıca). Gelen yoksa (yalnız buradan açılmış yeni posta) gidenin
 * alıcıları. Kimse kalmazsa kapı grubu Kime yapar.
 */
const yanitAlicilari = (sohbet: Sohbet, ben: Kisi, grup: string): { kime: string[]; cc: string[] } => {
  const benim = new Set([ben.eposta, ben.kurumEposta, ben.kisiselEposta].filter((a): a is string => !!a).map(kucuk));
  const disla = (a: string) => benim.has(a) || (!!grup && a === kucuk(grup));
  const temel = [...sohbet.mesajlar].reverse().find((m) => !m.giden) ?? sohbet.son;
  let kime = tekil(temel.giden ? temel.kime ?? [] : [temel.kimden, ...(temel.kime ?? [])]).filter((a) => !disla(a));
  let cc = tekil(temel.cc ?? []).filter((a) => !disla(a) && !kime.includes(a));
  if (!kime.length) [kime, cc] = [cc, []];
  return { kime, cc };
};

const gonderimHatasi = (r: { hata: string; ayrinti?: string }, t: ReturnType<typeof useDil>["t"]) =>
  r.hata === "eksikKimlik" ? t("bPostaCekKimlikYok") : r.hata === "kapali" ? t("bPostaCekKapali") : kapiHatasi(r, t("bPostaGonderHata"));

/*
 * Alıcı satırındaki adı adrese çevirir: adres ise kendisi; değilse tam ad
 * (Arapça, Latin ya da adresin yerel kısmı), yoksa adın geçtiği tek kişi.
 * Birden çok uyan varsa yazışmadakiler öncelikli; yine birden çoksa
 * bulunamadı sayılır (yanlış kişiye gitmesin).
 */
const adresCoz = (oge: string, oneriler: AdresOnerisi[], yazismada: Set<string>): string | null => {
  const a = kucuk(oge);
  if (ADRES.test(a)) return a;
  const ara = oge.trim().toLocaleLowerCase("tr");
  const tek = (l: AdresOnerisi[]) => (l.length === 1 ? l[0].adres : l.filter((o) => yazismada.has(o.adres)).length === 1 ? l.find((o) => yazismada.has(o.adres))!.adres : null);
  return tek(oneriler.filter((o) => o.adlar.includes(ara))) ?? tek(oneriler.filter((o) => o.ara.includes(ara)));
};

/* İmlecin bulunduğu alıcı satırındaki yarım öğe: öneri buna göre, seçilen buraya yazılır. */
const yarimOge = (metin: string, imlec: number): { bas: number; yazi: string; tur: KomutTuru } | null => {
  const satirBas = metin.lastIndexOf("\n", imlec - 1) + 1;
  const satir = metin.slice(satirBas, imlec);
  const komut = komutSatiri(satir + (satir.endsWith(" ") ? "" : " "));
  if (!komut || komut.bas > satir.length) return null;
  const ayrac = Math.max(satir.lastIndexOf(","), satir.lastIndexOf("،"), satir.lastIndexOf(";"), komut.bas - 1);
  const ham = satir.slice(ayrac + 1);
  const bosluk = ham.length - ham.trimStart().length;
  const yazi = ham.trim().replace(/^@+/, "");
  return { bas: satirBas + ayrac + 1 + bosluk + (ham.trimStart().startsWith("@") ? ham.trimStart().match(/^@+/)![0].length : 0), yazi, tur: komut.tur };
};

/*
 * Yanıt kutusu: sohbetin altında. Alıcılar metne yazılır (kullanıcı): "@Ali,
 * Veli" Kime, "cc: …" CC, "bcc: …" BCC; bu satırlar postaya girmez
 * (eposta.ts → postaKomutlari). @ yoksa yazışmadaki herkese (tümünü yanıtla).
 * Gönderilmeden kime gideceği üstte çip olarak görünür; bulunamayan ad
 * kırmızı, gönderim durur. Grup her zaman CC'de (kapı ekliyor). BCC kayda
 * yazılmaz: kayıt grupta ortak, CC'deki grup BCC'yi görürdü.
 */
function Yazma({ ben, sohbet, grup }: { ben: Kisi; sohbet: Sohbet; grup: string }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const oneriler = useAdresOnerileri();
  const alan = useRef<HTMLTextAreaElement>(null);
  /*
   * Yazılan yanıt sohbete bağlı taslak (sekmede): geri tuşu ya da başka
   * sohbete geçiş yazılanı uyarısız siliyordu (mobil denetim). Gönderince silinir.
   */
  const taslakAnahtari = `trt-planlama-posta-taslak:${sohbet.konuKimligi}`;
  const [metin, setMetin] = useState(() => {
    try {
      return sessionStorage.getItem(taslakAnahtari) ?? "";
    } catch {
      return "";
    }
  });
  useEffect(() => {
    try {
      if (metin) sessionStorage.setItem(taslakAnahtari, metin);
      else sessionStorage.removeItem(taslakAnahtari);
    } catch {
      /* saklanamazsa yalnız ekranda */
    }
  }, [metin, taslakAnahtari]);
  const [imlec, setImlec] = useState(0);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const varsayilan = yanitAlicilari(sohbet, ben, grup);
  const yazismada = new Set(sohbet.mesajlar.flatMap((m) => [m.kimden, ...(m.kime ?? []), ...(m.cc ?? [])]).map(kucuk));
  const komut = postaKomutlari(metin);
  const coz = (l: string[]) => l.map((o) => ({ oge: o, adres: adresCoz(o, oneriler, yazismada) }));
  const kimeC = coz(komut.kime), ccC = coz(komut.cc), bccC = coz(komut.bcc);
  const bulunamayan = [...kimeC, ...ccC, ...bccC].filter((x) => !x.adres).map((x) => x.oge);
  const adresler = (l: { adres: string | null }[]) => tekil(l.map((x) => x.adres).filter((x): x is string => !!x));
  // @ yazıldıysa Kime o; yazışmanın CC'si kalır, cc satırı eklenir.
  const kime = komut.kime.length ? adresler(kimeC) : varsayilan.kime;
  const cc = tekil([...varsayilan.cc, ...adresler(ccC)]).filter((a) => !kime.includes(a));
  const bcc = adresler(bccC).filter((a) => !kime.includes(a) && !cc.includes(a));
  const hazir = !!komut.govde && !bulunamayan.length && !gonderiliyor;
  const konu = /^re:/i.test(sohbet.son.konu) ? sohbet.son.konu : `RE: ${sohbet.baslik}`;

  // Alıcı satırında yazarken öneri: önce yazışmadakiler.
  const yarim = yarimOge(metin, imlec);
  const uygun = yarim && yarim.yazi
    ? oneriler
        .filter((o) => o.ara.includes(yarim.yazi.toLocaleLowerCase("tr")))
        .sort((a, b) => Number(yazismada.has(b.adres)) - Number(yazismada.has(a.adres)))
        .slice(0, 6)
    : [];
  const sec = (o: AdresOnerisi) => {
    if (!yarim) return;
    // Ad tek kişiye çözülüyorsa ad yazılır (okunur), değilse adres.
    const etiket = adresCoz(o.ad, oneriler, yazismada) === o.adres ? o.ad : o.adres;
    const yeni = metin.slice(0, yarim.bas) + etiket + metin.slice(imlec);
    const konum = yarim.bas + etiket.length;
    setMetin(yeni);
    setImlec(konum);
    requestAnimationFrame(() => {
      alan.current?.focus();
      alan.current?.setSelectionRange(konum, konum);
    });
  };

  const gonder = async () => {
    if (!hazir) {
      if (bulunamayan.length) bildir(t("postaAliciBulunamadi", { a: bulunamayan.join(", ") }));
      return;
    }
    const govde = komut.govde;
    setGonderiliyor(true);
    let alicilar = { kime, cc: tekil([...cc, ...(grup ? [grup] : [])]).filter((a) => !kime.includes(a)) };
    if (GERCEK) {
      const r = await postaGonder({ kime, cc, bcc, konu, metin: govde });
      setGonderiliyor(false);
      if (!r.tamam) return bildir(gonderimHatasi(r, t));
      alicilar = { kime: r.veri.kime, cc: r.veri.cc };
    } else setGonderiliyor(false);
    postaGidenEkle(ben, sohbet.konuKimligi, konu, govde, sohbet.son.grup || grup, alicilar);
    setMetin("");
    setImlec(0);
    bildir(t("bPostaGonderildi"));
  };

  const cipler = (l: string[]) =>
    l.map((a) => (
      <span key={a} className="posta-cip" title={a} data-posta-cip={a}>
        <bdi>{adresAdi(v, a, ad)}</bdi>
      </span>
    ));
  const imleciAl = () => setImlec(alan.current?.selectionStart ?? 0);
  return (
    <div className="posta-yaz-alani">
      <div className="posta-alici-satiri" data-posta-alicilar>
        <span className="sonuk">{t("postaKime")}:</span>
        {cipler(kime.length ? kime : grup ? [grup] : [])}
        <span className="sonuk">{t("postaCc")}:</span>
        {grup && kime.length > 0 && (
          <span className="posta-cip kilitli" title={`${grup} · ${t("postaGrupSabit")}`}>
            <Lock size={12} aria-hidden="true" />
            <bdi>{adresAdi(v, grup, ad)}</bdi>
          </span>
        )}
        {cipler(cc)}
        {bcc.length > 0 && (
          <>
            <span className="sonuk">{t("postaBcc")}:</span>
            {cipler(bcc)}
          </>
        )}
        {bulunamayan.map((o) => (
          <span key={o} className="posta-cip hatali" title={t("postaAliciBulunamadi", { a: o })} data-posta-bulunamadi>
            <bdi>{o}</bdi>
          </span>
        ))}
      </div>
      {uygun.length > 0 && (
        <div className="posta-oneriler" data-posta-oneriler>
          {uygun.map((o) => (
            <button
              key={o.adres}
              type="button"
              className="dugme dugme-ikincil dugme-kucuk"
              // Odak yazı alanında kalsın; imleç yeri bozulmasın.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => sec(o)}
              title={o.adres}
              data-posta-oneri={o.adres}
            >
              <bdi>{o.ad}</bdi>
            </button>
          ))}
        </div>
      )}
      <div className="posta-yaz">
        <textarea
          ref={alan}
          {...icerikAlani}
          rows={2}
          value={metin}
          placeholder={t("postaYaz")}
          onChange={(e) => {
            setMetin(e.target.value);
            setImlec(e.target.selectionStart ?? 0);
          }}
          onSelect={imleciAl}
          onKeyUp={imleciAl}
          onClick={imleciAl}
          onKeyDown={(e) => {
            // Ctrl/⌘+Enter gönderir; düz Enter satır açar.
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void gonder();
          }}
          data-posta-yaz
        />
        <button type="button" className="dugme" aria-disabled={!hazir} disabled={gonderiliyor || !komut.govde} onClick={gonder} data-posta-gonder aria-label={t("gonder")} title={bulunamayan.length ? t("postaAliciBulunamadi", { a: bulunamayan.join(", ") }) : t("gonder")}>
          <Send size={16} className="yon" />
        </button>
      </div>
    </div>
  );
}

/*
 * Yeni posta: Kime, CC (grup kilitli; kapı da ekliyor), istenirse BCC, konu
 * ve metin. Gönderilince sohbet konudan açılır; posta grup CC'sinden kutuya
 * geri gelince sunucudaki yazışma kimliği öğrenilip iplik ona taşınır
 * (eylemler.ts → postaIsle), sonraki yanıtlar aynı sohbete düşer.
 */
function YeniPosta({ ben, grup, kapat, acildi, ilk }: { ben: Kisi; grup: string; kapat: () => void; acildi: (konuKimligi: string) => void; ilk?: { kime: string[]; konu: string; bcc?: string[] } }) {
  const { t } = useDil();
  const [kime, setKime] = useState<string[]>(ilk?.kime ?? []);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>(ilk?.bcc ?? []);
  const [bccAcik, setBccAcik] = useState(!!ilk?.bcc?.length);
  const [konu, setKonu] = useState(ilk?.konu ?? "");
  const [metin, setMetin] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  // Toplu postada alıcılar BCC'de (muhabirler birbirinin adresini görmesin), Kime boş: kapı grubu Kime'ye yazar.
  const hazir = (kime.length > 0 || bcc.length > 0) && !!konu.trim() && !!metin.trim() && !gonderiliyor;
  const gonder = async () => {
    if (!hazir) return;
    setGonderiliyor(true);
    let alicilar = { kime, cc: tekil([...cc, ...(grup ? [grup] : [])]).filter((a) => !kime.includes(a)) };
    if (GERCEK) {
      const r = await postaGonder({ kime, cc, bcc, konu: konu.trim(), metin: metin.trim() });
      setGonderiliyor(false);
      if (!r.tamam) return bildir(gonderimHatasi(r, t));
      alicilar = { kime: r.veri.kime, cc: r.veri.cc };
    } else setGonderiliyor(false);
    const konuKimligi = postaKonuCekirdegi(konu) || `pk-${Date.now().toString(36)}`;
    postaGidenEkle(ben, konuKimligi, konu.trim(), metin.trim(), grup, alicilar);
    bildir(t("bPostaGonderildi"));
    acildi(konuKimligi);
    kapat();
  };
  return (
    <Pencere
      baslik={t("postaYeni")}
      kapat={kapat}
      altBilgi={
        <button type="button" className="dugme" disabled={!hazir} onClick={gonder} data-posta-yeni-gonder>
          <Send size={16} className="yon" /> {t("gonder")}
        </button>
      }
    >
      <div className="form" data-posta-yeni>
        <div>
          <div className="alan-etiket">{t("postaKime")}</div>
          <AdresGirdisi etiket="kime" adresler={kime} degistir={setKime} />
        </div>
        <div>
          <div className="alan-etiket">{t("postaCc")}</div>
          <AdresGirdisi etiket="cc" kilitli={grup ? [grup] : []} adresler={cc} degistir={setCc} />
        </div>
        {bccAcik ? (
          <div>
            <div className="alan-etiket">{t("postaBcc")}</div>
            <AdresGirdisi etiket="bcc" adresler={bcc} degistir={setBcc} />
          </div>
        ) : (
          <button type="button" className="dugme dugme-sade dugme-kucuk posta-bcc-ac" onClick={() => setBccAcik(true)} data-posta-bcc-ac>
            {t("postaBccEkle")}
          </button>
        )}
        <label>
          {t("postaKonusu")}
          <input {...icerikAlani} value={konu} onChange={(e) => setKonu(e.target.value)} data-posta-yeni-konu />
        </label>
        <label>
          {t("postaMetin")}
          <textarea {...icerikAlani} rows={6} value={metin} onChange={(e) => setMetin(e.target.value)} data-posta-yeni-metin />
        </label>
      </div>
    </Pencere>
  );
}

/*
 * İşin muhabirine posta (kullanıcı: masa bütün muhabirlere ulaşmasın, çalıştığı
 * muhabire iş bazında, paketin yapımında pratikçe ulaşsın): Kime muhabirin
 * adresi, konu paketin başlığı; yazışma kişinin grubunda sohbet olarak kalır.
 */
export function IsPostasi({ ben, kisi, konu }: { ben: Kisi; kisi: Kisi; konu: string }) {
  const { t } = useDil();
  const [acik, setAcik] = useState(false);
  if (!muhabirAdresi(kisi)) return null;
  return (
    <>
      <button type="button" className="ikon-dugme" onClick={() => setAcik(true)} title={t("postaYeni")} aria-label={t("postaYeni")} data-is-postasi>
        <Mail size={17} />
      </button>
      {acik && <IsPostasiPenceresi ben={ben} kisi={kisi} konu={konu} kapat={() => setAcik(false)} />}
    </>
  );
}

/* Pencerenin kendisi: düğmesi açılır kartın içinde kalan yerler (kişi çipi) pencereyi kartın dışında tutsun, kart kapanınca gitmesin. */
/** Seçilen muhabirlere tek posta, adresleri BCC'de (toplu iletişim). */
export function TopluPostaPenceresi({ ben, adresler, kapat }: { ben: Kisi; adresler: string[]; kapat: () => void }) {
  const [grup, setGrup] = useState("");
  useEffect(() => {
    if (GERCEK) void postaKimlikGetir().then((r) => r.tamam && setGrup((r.veri.grupAdresi || "").trim().toLowerCase()));
  }, []);
  return <YeniPosta ben={ben} grup={grup} kapat={kapat} acildi={() => undefined} ilk={{ kime: [], konu: "", bcc: adresler }} />;
}

export function IsPostasiPenceresi({ ben, kisi, konu, kapat }: { ben: Kisi; kisi: Kisi; konu: string; kapat: () => void }) {
  const [grup, setGrup] = useState("");
  useEffect(() => {
    if (GERCEK) void postaKimlikGetir().then((r) => r.tamam && setGrup((r.veri.grupAdresi || "").trim().toLowerCase()));
  }, []);
  return <YeniPosta ben={ben} grup={grup} kapat={kapat} acildi={() => undefined} ilk={{ kime: [muhabirAdresi(kisi)], konu }} />;
}

/*
 * Bütün postalarda arama (kullanıcı: sohbet içi değil, bütün postalarda):
 * konu, balonda görünen metin, gönderen ve ek adları. Sohbet içi aramayla aynı
 * metin (balonIcerigi); her mesajın metni bir kez kurulur, her tuşta değil.
 */
function useGenelArama(sohbetler: Sohbet[]) {
  const { ad } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  const [sorgu, setSorgu] = useState("");
  const dizin = useMemo(() => {
    const x = new Map<string, { metin: string; govde: string; gad: string }>();
    for (const s of sohbetler)
      for (const m of s.mesajlar) {
        const b = balonIcerigi(v, m, ad);
        x.set(m.id, { metin: [b.govde, b.gad, ...b.ekler].join(" "), govde: b.govde || b.ekler.join(" · "), gad: b.gad });
      }
    return x;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.postaMesajlari, ad]);
  const sorguVar = acik && !!sorgu.trim();
  // Sohbet → eşleşen mesajlar (en yenisi önce); yalnız konusu uyan sohbet de çıkar.
  const sonuc = new Map<string, PostaMesaji[]>();
  if (sorguVar)
    for (const s of sohbetler) {
      const l = s.mesajlar.filter((m) => sozcuklerUyar(dizin.get(m.id)?.metin ?? "", sorgu)).reverse();
      if (l.length || sozcuklerUyar(s.baslik, sorgu)) sonuc.set(s.konuKimligi, l);
    }
  return {
    acik,
    ac: () => setAcik(true),
    kapat: () => {
      setAcik(false);
      setSorgu("");
    },
    sorgu,
    setSorgu,
    sorguVar,
    sonuc,
    ozet: (m: PostaMesaji) => dizin.get(m.id),
  };
}

export function Posta({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const esit = useSunucuyaEsit();
  // Kişi yalnız kendi grubunun sohbetini görür (gerçek kipte): biri kendi
  // hesabıyla çekince başka birimin postası ona karışmasın. Demoda süzme yok.
  const [grup, setGrup] = useState("");
  const sohbetler = sohbetleriKur(gorunenPostalar(v, grup));
  const [secili, setSecili] = useAdimDurumu("posta:sohbet", "");
  /* Telefonda açık sohbet tek ekran: geri tuşu sohbeti kapatıp listeye döner (Posta'dan çıkarıyordu). */
  const telefon = !GOMULU && typeof matchMedia !== "undefined" && matchMedia("(max-width: 760px)").matches;
  useGeriKapatir(!!secili && telefon, () => setSecili(""));
  const [yeni, setYeni] = useState(false);
  const [yalnizOkunmamis, setYalnizOkunmamis] = useState(false);
  const secik = sohbetler.find((s) => s.konuKimligi === secili);
  const genel = useGenelArama(sohbetler);
  const arama = useSohbetAramasi(secik, genel.sorguVar ? genel.sorgu : "");
  const okuma = v.postaOkunan?.[ben.id];
  const okunmamis = (s: Sohbet) => s.mesajlar.filter((m) => okunmamisMi(okuma, m)).length;
  const toplamOkunmamis = sohbetler.reduce((n, s) => n + okunmamis(s), 0);
  const gorunen = sohbetler.filter((s) => (!genel.sorguVar || genel.sonuc.has(s.konuKimligi)) && (!yalnizOkunmamis || s.konuKimligi === secili || okunmamis(s) > 0));
  // Okundu bilgisi: ilk açılışta taban kurulur; grup kapıdan gelince (gerçek kipte) yazılır, menü sayısı onu süzer.
  useEffect(() => {
    if (!GERCEK || grup) postaOkumaBaslat(ben, grup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grup, esit]);
  // Açık sohbet okunmuş sayılır; açıkken yeni posta gelirse o da.
  const sonZaman = secik?.son.zaman ?? "";
  useEffect(() => {
    if (secik && okuma) postaOkundu(ben, secik.kimlikler, sonZaman);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secili, sonZaman, esit, !!okuma]);
  const sonGelen = secik ? [...secik.mesajlar].reverse().find((m) => !m.giden) : undefined;
  const okunmadiYap = () => {
    if (!secik || !sonGelen) return;
    postaOkunmadi(ben, secik.kimlikler, sonGelen.zaman);
    setSecili("");
  };
  const sil = (konuKimligi: string) => {
    const kimlikler = sohbetler.find((x) => x.konuKimligi === konuKimligi)?.kimlikler ?? [konuKimligi];
    if (!confirm(t("postaSilOnay"))) return;
    if (postaSil(ben, kimlikler) && secili === konuKimligi) setSecili("");
  };
  const [cekiliyor, setCekiliyor] = useState(false);
  const cek = async (g = grup) => {
    setCekiliyor(true);
    if (GERCEK) await (await firebaseYukle()).postaDinle();
    const r = await postalariCek(ben, 25, g);
    setCekiliyor(false);
    if ("hata" in r) {
      // Nedeni ayırt et: kimlik/sunucu/kapalı için ne yapılacağı bellidir,
      // bağlantı hatasında kapının verdiği ayrıntıyı göster.
      const ozel = r.hata === "eksikKimlik" ? "bPostaCekKimlikYok" : r.hata === "kapali" ? "bPostaCekKapali" : r.hata === "eksikSunucu" ? "bPostaCekSunucuYok" : "";
      if (ozel) bildir(t(ozel as Parameters<typeof t>[0]));
      else bildir(kapiHatasi(r, t("bPostaCekHata")));
    } else {
      const sonuc = r.oneri ? t("bPostaCekildiOneri", { n: String(r.eklenen), o: String(r.oneri) }) : r.eklenen ? t("bPostaCekildi", { n: String(r.eklenen) }) : t("bPostaCekYok");
      bildir(r.uyari ? `${sonuc} · ${t("bPostaCekKismi")} (${r.uyari})` : sonuc);
    }
  };
  // Kimlik kişiye özel (Ayarlar'dan girilir): parola varsa açılışta kutuyu
  // sessizce yokla; yoksa hiçbir şey yapma (zorlama ve hatırlatma yok).
  const ilk = useRef(false);
  useEffect(() => {
    if (!GERCEK || ilk.current) return;
    ilk.current = true;
    // Posta yalnız onu kullanan sekmede dinleniyor (depo/firebase.ts → postaDinle): liste gelmeden çekilirse aynı posta ikinci kez eklenirdi.
    void Promise.all([postaKimlikGetir(), firebaseYukle().then((f) => f.postaDinle())]).then(([r]) => {
      if (!r.tamam) return; // kapıya ulaşılamadı: sessiz, "Postaları çek" nedeni gösterir
      const g = (r.veri.grupAdresi || "").trim().toLowerCase();
      setGrup(g);
      // Eski ortak havuzu (kişiye özel kimlikten önce admin hesabından
      // çekilenler) bir kez admin kendi grubuna mal eder; başkalarına görünmesin.
      if (g && ben.hesapYoneticisi) postaEtiketsizleriGruba(ben, g);
      if (r.veri.parolaVar) void cek(g);
      // kimlik yoksa sessiz: kullanıcı Ayarlar'dan girer
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <SayfaBasi
        ikon={<Mail size={26} />}
        baslik={t("postaBasligi")}
        sagUc={
          GERCEK ? (
            <button className="dugme dugme-ikincil" onClick={() => cek()} disabled={cekiliyor} data-posta-cek>
              <RefreshCw size={16} /> {t(cekiliyor ? "postaCekiliyor" : "postaCek")}
            </button>
          ) : undefined
        }
      />
      <div className={`posta-duzen${secik ? " secili" : ""}`}>
        <div className="iz posta-liste-sutun">
          <Kart
            baslik={t("postaSohbetler")}
            ek={genel.sorguVar ? `${gorunen.length}/${sohbetler.length}` : String(sohbetler.length)}
            sagUc={
              <>
                <button type="button" className={`dugme dugme-sade dugme-ikon${genel.acik ? " secili" : ""}`} onClick={genel.acik ? genel.kapat : genel.ac} aria-pressed={genel.acik} title={t("postaTumunuAra")} aria-label={t("postaTumunuAra")} data-posta-genel-ac>
                  <Search size={16} />
                </button>
                <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setYeni(true)} title={t("postaYeni")} aria-label={t("postaYeni")} data-posta-yeni-ac>
                  <Plus size={18} />
                </button>
              </>
            }
          >
            {genel.acik && (
              <div className="posta-ara" role="search" data-posta-genel>
                <Search size={16} className="sonuk" aria-hidden="true" />
                <input
                  type="text"
                  dir="auto"
                  autoFocus
                  value={genel.sorgu}
                  onChange={(e) => genel.setSorgu(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      genel.kapat();
                    } else if (e.key === "Enter" && gorunen[0]) {
                      e.preventDefault();
                      setSecili(gorunen[0].konuKimligi);
                    }
                  }}
                  placeholder={t("postaTumunuAra")}
                  aria-label={t("postaTumunuAra")}
                  data-posta-genel-girdi
                />
                {genel.sorguVar && gorunen.length === 0 && (
                  <small className="posta-ara-sayi yok" aria-live="polite">
                    {t("postaAramaYok")}
                  </small>
                )}
                <button type="button" className="dugme dugme-sade dugme-ikon" onClick={genel.kapat} title={t("kapat")} aria-label={t("kapat")} data-posta-genel-kapat>
                  <X size={16} />
                </button>
              </div>
            )}
            {(toplamOkunmamis > 0 || yalnizOkunmamis) && (
              <div className="posta-liste-arac">
                <button type="button" className={`cip cip-dugme${yalnizOkunmamis ? " secili" : ""}`} onClick={() => setYalnizOkunmamis((x) => !x)} aria-pressed={yalnizOkunmamis} data-posta-okunmamis-suz>
                  <span className="posta-okunmamis-nokta" aria-hidden="true" /> {t("postaOkunmamis", { n: toplamOkunmamis })}
                </button>
                {toplamOkunmamis > 0 && (
                  <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => postaHepsiOkundu(ben)} title={t("postaHepsiOkundu")} aria-label={t("postaHepsiOkundu")} data-posta-hepsi-okundu>
                    <CheckCheck size={16} />
                  </button>
                )}
              </div>
            )}
            {sohbetler.length === 0 ? (
              <Bos kucuk metin={t("postaMesajYok")} />
            ) : (
              <ol className="posta-sohbetler" data-posta-liste>
                {gorunen.map((s) => {
                  const n = okunmamis(s);
                  const bulunan = genel.sorguVar ? genel.sonuc.get(s.konuKimligi) : undefined;
                  const ornek = bulunan?.[0] ? genel.ozet(bulunan[0]) : undefined;
                  return (
                    <li key={s.konuKimligi}>
                      <button
                        type="button"
                        className={`posta-sohbet${s.konuKimligi === secili ? " secili" : ""}${n ? " okunmamis" : ""}`}
                        onClick={() => setSecili(s.konuKimligi)}
                        data-posta-sohbet-bag={s.konuKimligi}
                        data-okunmamis={n || undefined}
                      >
                        <span className="posta-sohbet-avatar" style={{ ["--ton" as string]: sohbetTonu(s.konuKimligi) }} aria-hidden="true">
                          {ilkHarf(s.baslik)}
                        </span>
                        <span className="posta-sohbet-govde">
                          <span className="posta-sohbet-bas">
                            <Icerik>{s.baslik}</Icerik>
                            <small className="sonuk ince">{saatYaz(s.son.zaman, dil)}</small>
                          </span>
                          {ornek ? (
                            <small className="sonuk posta-sohbet-alt" data-posta-genel-ornek>
                              {ornek.gad}: <bdi>{ornek.govde.replace(/\s+/g, " ").slice(0, 140)}</bdi>
                            </small>
                          ) : (
                            <small className="sonuk posta-sohbet-alt">
                              <GonderenEtiketi m={s.son} /> · {t("postaMesajSayisi", { n: s.mesajlar.length })}
                            </small>
                          )}
                        </span>
                        {bulunan && bulunan.length > 0 ? (
                          <span className="posta-eslesme" title={t("postaEslesme", { n: bulunan.length })}>
                            {bulunan.length}
                          </span>
                        ) : n > 0 ? (
                          <span className="posta-okunmamis-say" title={t("postaOkunmamisIpucu", { n })} aria-label={t("postaOkunmamisIpucu", { n })} data-posta-okunmamis-say>
                            {n}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </Kart>
        </div>
        <div className="posta-sohbet-sutun">
          {secik ? (
            <>
              {/* Geri tuşuyla aynı yol: adım geri alınınca sohbet kapanır, önceki adımın seçimi de temizlenir. */}
              <button className="geri-bag yalniz-telefon" onClick={() => (telefon ? history.back() : setSecili(""))}>
                <ArrowLeft size={14} className="yon" /> {t("postaSohbetler")}
              </button>
              <Kart
                baslik={<Icerik>{secik.baslik}</Icerik>}
                ikon={<MessageSquare size={18} />}
                sagUc={
                  <>
                    <button type="button" className={`dugme dugme-sade dugme-ikon${arama.acik ? " secili" : ""}`} onClick={arama.acik ? arama.kapat : arama.ac} aria-pressed={arama.acik} title={t("postaSohbetAra")} aria-label={t("postaSohbetAra")} data-posta-ara-ac>
                      <Search size={16} />
                    </button>
                    {sonGelen && (
                      <button type="button" className="dugme dugme-sade dugme-ikon" onClick={okunmadiYap} title={t("postaOkunmadiYap")} aria-label={t("postaOkunmadiYap")} data-posta-okunmadi>
                        <MailOpen size={16} />
                      </button>
                    )}
                    <button className="dugme dugme-sade dugme-kucuk" onClick={() => sil(secik.konuKimligi)} title={t("postaSohbetSil")} data-posta-sil>
                      <Trash2 size={14} /> {t("sil")}
                    </button>
                  </>
                }
              >
                {arama.acik && <SohbetAramaCubugu a={arama} />}
                <div className="posta-sohbet-ic">
                  <SohbetGovdesi sohbet={secik} bulunan={arama.bulunan} simdi={arama.simdi} />
                  <SohbetDosyalari sohbet={secik} />
                </div>
                <Yazma key={secik.konuKimligi} ben={ben} sohbet={secik} grup={grup} />
              </Kart>
            </>
          ) : (
            <Bos metin={t("postaSohbetSec")} ikon={<Mail size={28} />} />
          )}
        </div>
      </div>
      {yeni && <YeniPosta ben={ben} grup={grup} kapat={() => setYeni(false)} acildi={setSecili} />}
    </>
  );
}
