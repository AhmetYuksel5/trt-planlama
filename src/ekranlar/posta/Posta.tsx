import { ArrowLeft, File, Loader2, Lock, Mail, MessageSquare, Plus, RefreshCw, Send, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Bos, Icerik, Kart, Pencere, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { saatYaz, useDil } from "../../dil";
import { postaGidenEkle, postaSil, postaEtiketsizleriGruba } from "../../eylemler";
import { gizliEkMi, gondereniBul, komutSatiri, postaAlintiMetni, postaKomutlari, postaKonuBasligi, postaKonuCekirdegi, postaMetniSadelestir, type KomutTuru } from "../../eposta";
import { useVeri, type Kisi, type PostaMesaji } from "../../veri";
import { yerelGun } from "../../tarih";
import { GERCEK } from "../../kip";
import { postaEkiGetir, postalariCek, postaGonder, postaKimlikGetir } from "../../posta-kapi";
import { SayfaBasi } from "../ana/Planlama";

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
  baslik: string;
  mesajlar: PostaMesaji[];
  son: PostaMesaji;
}

/* Mesajları konu çekirdeğine göre ipliklere ayırıp en yeni sohbet üstte. */
const sohbetleriKur = (mesajlar: PostaMesaji[]): Sohbet[] => {
  const grup = new Map<string, PostaMesaji[]>();
  for (const m of mesajlar) {
    const l = grup.get(m.konuKimligi) ?? [];
    l.push(m);
    grup.set(m.konuKimligi, l);
  }
  return [...grup.entries()]
    .map(([konuKimligi, liste]) => {
      const sirali = [...liste].sort((a, b) => a.zaman.localeCompare(b.zaman));
      const son = sirali[sirali.length - 1];
      return { konuKimligi, baslik: postaKonuBasligi(son.konu) || son.konu, mesajlar: sirali, son };
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
  for (const k of v.kisiler) if (k.eposta && ADRES.test(kucuk(k.eposta))) adresler.add(kucuk(k.eposta));
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
    if (!r.tamam) return bildir(r.hata === "ekYok" ? t("postaEkYok") : r.hata === "ekBuyuk" ? t("postaEkBuyuk") : `${t("postaEkHata")}${r.ayrinti ? ` (${r.ayrinti})` : ""}`);
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
function SohbetGovdesi({ sohbet }: { sohbet: Sohbet }) {
  const { ad, dil, t } = useDil();
  const v = useVeri();
  const ek = useEkIndir();
  return (
    <div className="posta-govde" data-posta-sohbet={sohbet.konuKimligi}>
      <ol className="posta-mesajlar">
        {sohbet.mesajlar.map((m, i) => {
          const kisi = gondereniBul(v, m.kimden);
          const onceki = sohbet.mesajlar[i - 1];
          const yeniGonderen = !onceki || onceki.kimden !== m.kimden || !!onceki.giden !== !!m.giden;
          const gad = gonderenAdi(v, m, ad);
          const sade = m.giden ? m.metin : postaMetniSadelestir(m.metin, gad);
          // Yeni metin yoksa (yalnız imza), düzeltilip dönen alıntı metnini göster.
          const alinti = !m.giden && !sade.trim() ? postaAlintiMetni(m.tamMetin, gad) : "";
          const govde = sade.trim() ? sade : alinti;
          const ekler = m.ekler.filter((e) => !gizliEkMi(e));
          return (
            <li key={m.id} className={`posta-balon${m.giden ? " giden" : ""}${yeniGonderen ? " ilk" : ""}`} style={m.giden ? undefined : { ["--ton" as string]: gonderenTonu(m.kimden) }} data-posta-mesaj={m.id}>
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
  const benim = new Set([ben.eposta, ben.kisiselEposta].filter((a): a is string => !!a).map(kucuk));
  const disla = (a: string) => benim.has(a) || (!!grup && a === kucuk(grup));
  const temel = [...sohbet.mesajlar].reverse().find((m) => !m.giden) ?? sohbet.son;
  let kime = tekil(temel.giden ? temel.kime ?? [] : [temel.kimden, ...(temel.kime ?? [])]).filter((a) => !disla(a));
  let cc = tekil(temel.cc ?? []).filter((a) => !disla(a) && !kime.includes(a));
  if (!kime.length) [kime, cc] = [cc, []];
  return { kime, cc };
};

const gonderimHatasi = (r: { hata: string; ayrinti?: string }, t: ReturnType<typeof useDil>["t"]) =>
  r.hata === "eksikKimlik" ? t("bPostaCekKimlikYok") : r.hata === "kapali" ? t("bPostaCekKapali") : `${t("bPostaGonderHata")}${r.ayrinti ? ` (${r.ayrinti})` : ""}`;

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
  const [metin, setMetin] = useState("");
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
function YeniPosta({ ben, grup, kapat, acildi }: { ben: Kisi; grup: string; kapat: () => void; acildi: (konuKimligi: string) => void }) {
  const { t } = useDil();
  const [kime, setKime] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [bccAcik, setBccAcik] = useState(false);
  const [konu, setKonu] = useState("");
  const [metin, setMetin] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const hazir = kime.length > 0 && !!konu.trim() && !!metin.trim() && !gonderiliyor;
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

export function Posta({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  // Kişi yalnız kendi grubunun sohbetini görür (gerçek kipte): biri kendi
  // hesabıyla çekince başka birimin postası ona karışmasın. Demoda süzme yok.
  const [grup, setGrup] = useState("");
  const sohbetler = sohbetleriKur((v.postaMesajlari ?? []).filter((m) => !GERCEK || (!!grup && m.grup === grup)));
  const [secili, setSecili] = useState("");
  const [yeni, setYeni] = useState(false);
  const secik = sohbetler.find((s) => s.konuKimligi === secili);
  const sil = (konuKimligi: string) => {
    if (!confirm(t("postaSilOnay"))) return;
    if (postaSil(ben, konuKimligi) && secili === konuKimligi) setSecili("");
  };
  const [cekiliyor, setCekiliyor] = useState(false);
  const cek = async (g = grup) => {
    setCekiliyor(true);
    const r = await postalariCek(ben, 25, g);
    setCekiliyor(false);
    if ("hata" in r) {
      // Nedeni ayırt et: kimlik/sunucu/kapalı için ne yapılacağı bellidir,
      // bağlantı hatasında kapının verdiği ayrıntıyı göster.
      const ozel = r.hata === "eksikKimlik" ? "bPostaCekKimlikYok" : r.hata === "kapali" ? "bPostaCekKapali" : r.hata === "eksikSunucu" ? "bPostaCekSunucuYok" : "";
      if (ozel) bildir(t(ozel as Parameters<typeof t>[0]));
      else bildir(`${t("bPostaCekHata")}${r.ayrinti ? ` (${r.ayrinti})` : ""}`);
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
    void postaKimlikGetir().then((r) => {
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
            ek={String(sohbetler.length)}
            sagUc={
              <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setYeni(true)} title={t("postaYeni")} aria-label={t("postaYeni")} data-posta-yeni-ac>
                <Plus size={18} />
              </button>
            }
          >
            {sohbetler.length === 0 ? (
              <Bos kucuk metin={t("postaMesajYok")} />
            ) : (
              <ol className="posta-sohbetler" data-posta-liste>
                {sohbetler.map((s) => (
                  <li key={s.konuKimligi}>
                    <button type="button" className={`posta-sohbet${s.konuKimligi === secili ? " secili" : ""}`} onClick={() => setSecili(s.konuKimligi)} data-posta-sohbet-bag={s.konuKimligi}>
                      <span className="posta-sohbet-avatar" style={{ ["--ton" as string]: sohbetTonu(s.konuKimligi) }} aria-hidden="true">
                        {ilkHarf(s.baslik)}
                      </span>
                      <span className="posta-sohbet-govde">
                        <span className="posta-sohbet-bas">
                          <Icerik>{s.baslik}</Icerik>
                          <small className="sonuk ince">{saatYaz(s.son.zaman, dil)}</small>
                        </span>
                        <small className="sonuk posta-sohbet-alt">
                          <GonderenEtiketi m={s.son} /> · {t("postaMesajSayisi", { n: s.mesajlar.length })}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </Kart>
        </div>
        <div className="posta-sohbet-sutun">
          {secik ? (
            <>
              <button className="geri-bag yalniz-telefon" onClick={() => setSecili("")}>
                <ArrowLeft size={14} className="yon" /> {t("postaSohbetler")}
              </button>
              <Kart
                baslik={<Icerik>{secik.baslik}</Icerik>}
                ikon={<MessageSquare size={18} />}
                sagUc={
                  <button className="dugme dugme-sade dugme-kucuk" onClick={() => sil(secik.konuKimligi)} title={t("postaSohbetSil")} data-posta-sil>
                    <Trash2 size={14} /> {t("sil")}
                  </button>
                }
              >
                <div className="posta-sohbet-ic">
                  <SohbetGovdesi sohbet={secik} />
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
