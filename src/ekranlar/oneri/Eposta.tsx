import { ArrowLeft, ClipboardCopy, Inbox, Link2, Mail, MailCheck, MailMinus, MailQuestion, MailX, Megaphone, Paperclip, Pencil, Scissors, Smartphone, Upload } from "lucide-react";
import { useState, type DragEvent } from "react";
import { Avatar, Bos, Icerik, Kart, Rozet, Sayac, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { aralikYaz, metin, saatYaz, tarihYaz, useDil, type Anahtar } from "../../dil";
import { cagriKaydet, epostaYanitiIsle, oneriDuzenle, yanitBagla, yanittanOneri, type YanitOneriGirdisi, type YanitSonucu } from "../../eylemler";
import { ORNEK_PLANLAMA_ADRESI, cagriGovdesi, cagriKonusu, emlUret, etiketUret, haftaAraligiAr, mailtoUret, type GelenEposta, type GidenEposta } from "../../eposta";
import { TUR_ADI } from "../../etiketler";
import { bugun, gunEkle, yerelGun } from "../../tarih";
import { ICERIK_TURLERI, cagriTuru, kisiBul, muhabirler, useVeri, type Bicim, type Cagri as CagriKaydi, type IcerikTuru, type Kisi, type Oneri, type Yanit } from "../../veri";
import { yapabilir } from "../../yetki";
import { git } from "../../yol";
import { SayfaBasi } from "../ana/Planlama";
import { BicimSecici, MuhabirSecici } from "../nextday/Formlar";
import { indir } from "../../bilesenler/indir";

/**
 * Öneri çağrısı ve gelen yanıtlar.
 *
 * Gönderim planlamacının kendi e-postasından: uygulama Outlook taslağını
 * ya da telefonun e-posta uygulamasını Kime/BCC/konu dolu açıyor. Yanıtlar
 * planlama kutusuna düşüyor; sunucu bağlanınca oradan kendiliğinden
 * gelecek (belgeler/eposta-entegrasyonu.md), o zamana kadar Outlook'tan
 * sürükle-bırak ya da metin yapıştırma aynı işlemeden geçiyor.
 */

/* Giden e-posta her zaman Arapça; arayüz dili ne olursa olsun. */
export const metinAr = (k: Anahtar, p?: Record<string, string>) => metin(k, "ar", p);

export const panoya = async (metin: string, t: (k: Anahtar) => string) => {
  try {
    await navigator.clipboard.writeText(metin);
    bildir(t("bKopyalandi"));
  } catch {
    bildir(t("kopyalanamadi"));
  }
};

/** Outlook'a ";" ile, telefona "," ile; ikisi de çoğu istemcide geçiyor, Outlook'un alışkanlığı ";". */
export const adresler = (v: ReturnType<typeof useVeri>, kimlikler: string[]) =>
  kimlikler.map((id) => kisiBul(v, id)?.eposta).filter((a): a is string => !!a);

/** Giden e-postayı açan düğmeler; açmak çağrıyı da kaydediyor ki yanıtlar eşleşsin. */
export function GonderDugmeleri({ eposta, dosyaAdi, once }: { eposta: GidenEposta; dosyaAdi: string; once?: () => void }) {
  const { t } = useDil();
  return (
    <div className="form-alt">
      <button className="dugme dugme-ikincil" onClick={() => panoya(eposta.bcc.join("; "), t)}>
        <ClipboardCopy size={16} /> {t("bccKopyala")}
      </button>
      <a className="dugme dugme-ikincil" href={mailtoUret(eposta)} onClick={() => once?.()}>
        <Smartphone size={16} /> {t("telefondaAc")}
      </a>
      <button
        className="dugme"
        title={t("outlookIpucu")}
        onClick={() => {
          once?.();
          indir(dosyaAdi, emlUret(eposta), "message/rfc822");
        }}
      >
        <Mail size={16} /> {t("outlooktaAc")}
      </button>
    </div>
  );
}

/** İzinde olmayan bütün muhabirler: çağrının varsayılan BCC listesi. */
export const izinliHaric = (v: ReturnType<typeof useVeri>) => muhabirler(v).filter((k) => k.durum !== "izinli").map((k) => k.id);

/** Son kullanılan Kime adresi; ilk çağrıda kurgusal örnek adres (gerçeği planlamacı yazıyor). */
export const sonKime = (v: ReturnType<typeof useVeri>) => [...v.cagrilar].sort((a, b) => b.zaman.localeCompare(a.zaman))[0]?.kime ?? ORNEK_PLANLAMA_ADRESI;

/** Kime ve BCC: BCC'deki muhabirler düzenlenebilir, izinliler varsayılan olarak dışarıda. */
export function AliciAlanlari({ kime, setKime, bcc, setBcc }: { kime: string; setKime: (k: string) => void; bcc: string[]; setBcc: (b: string[]) => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [aliciAcik, setAliciAcik] = useState(false);
  const liste = [...muhabirler(v)].sort((a, b) => ad(a).localeCompare(ad(b)));
  return (
    <>
      <label>
        {t("kime")}
        <input type="email" dir="ltr" value={kime} onChange={(e) => setKime(e.target.value)} />
      </label>
      <div>
        <div className="alan-etiket">
          {t("bccAlicilar")} · {t("aliciSayisi", { n: bcc.length })}
        </div>
        <div className="dugmeler ara-ust">
          <button className="dugme dugme-sade dugme-kucuk" onClick={() => setAliciAcik(!aliciAcik)}>
            {t("alicilariDuzenle")}
          </button>
          {aliciAcik && (
            <>
              <button className="dugme dugme-sade dugme-kucuk" onClick={() => setBcc(liste.map((k) => k.id))}>
                {t("tumunuSec")}
              </button>
              <button className="dugme dugme-sade dugme-kucuk" onClick={() => setBcc(izinliHaric(v))}>
                {t("izinliHaric")}
              </button>
            </>
          )}
        </div>
        {aliciAcik && (
          <fieldset className="secim-grubu ara-ust-2">
            {liste.map((k) => (
              <label key={k.id} className="secim-cip">
                <input type="checkbox" checked={bcc.includes(k.id)} onChange={() => setBcc(bcc.includes(k.id) ? bcc.filter((x) => x !== k.id) : [...bcc, k.id])} />
                {ad(k)}
                {k.durum === "izinli" && <Rozet>{t("kdIzinli")}</Rozet>}
              </label>
            ))}
          </fieldset>
        )}
      </div>
    </>
  );
}

/** Gönderilecek e-postanın önizlemesi; gövde düzenlenebilir, giden metin her zaman Arapça. */
export function EpostaOnizleme({ eposta, govde, setGovde }: { eposta: GidenEposta; govde: string; setGovde: (g: string) => void }) {
  const { t } = useDil();
  return (
    <div className="eposta-kutu">
      <header>
        <span>
          {t("kime")}: <bdi>{eposta.kime}</bdi>
        </span>
        <span>· BCC: {t("aliciSayisi", { n: eposta.bcc.length })}</span>
        <span>
          · {t("konu")}: <Icerik>{eposta.konu}</Icerik>
        </span>
      </header>
      <textarea className="girdi" {...icerikAlani} value={govde} onChange={(e) => setGovde(e.target.value)} />
      {eposta.tablo && (
        <div className="tablo-sar eposta-tablosu" dir="rtl" lang="ar">
          <table>
            <thead>
              <tr>
                {eposta.tablo.map((b) => (
                  <th key={b}>{b}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[0, 1].map((i) => (
                <tr key={i}>
                  {eposta.tablo!.map((b) => (
                    <td key={b} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Çağrı listesinde ve seçicide çağrının adı: Next Day'de günü, haftalıkta hafta aralığı. */
export const useCagriAdi = () => {
  const { t, dil } = useDil();
  return (c: CagriKaydi) =>
    cagriTuru(c) === "haftalik" ? `${t("haftalik")} · ${aralikYaz(c.tarih, gunEkle(c.tarih, 6), dil)}` : tarihYaz(c.tarih, dil, "tam");
};

export function Cagri({ ben, tarih }: { ben: Kisi; tarih?: string }) {
  const { t } = useDil();
  const v = useVeri();
  const B = bugun();
  const son = [...v.cagrilar].filter((c) => cagriTuru(c) === "nextday").sort((a, b) => b.zaman.localeCompare(a.zaman))[0];
  const [hedef, setHedef] = useState(tarih ?? gunEkle(B, 1));
  const [sonSaat, setSonSaat] = useState(son?.sonSaat ?? "15:00");
  const [kime, setKime] = useState(sonKime(v));
  const [bcc, setBcc] = useState<string[]>(() => izinliHaric(v));
  const [govde, setGovde] = useState(cagriGovdesi(hedef, sonSaat));
  const konu = cagriKonusu(hedef);
  const eposta: GidenEposta = { kime, bcc: adresler(v, bcc), konu, govde };
  const kaydet = () => cagriKaydet(ben, { tur: "nextday", tarih: hedef, metin: govde, sonSaat, kime, bcc, etiket: etiketUret(hedef) });

  return (
    <>
      <a className="geri-bag" href="#/oneriler">
        <ArrowLeft size={14} className="yon" /> {t("mOneriler")}
      </a>
      <SayfaBasi
        ikon={<Megaphone size={26} />}
        baslik={t("oneriCagrisi")}
       
        sagUc={
          <a className="dugme dugme-ikincil" href="#/oneriler/yanitlar">
            <Inbox size={16} /> {t("gelenYanitlar")}
          </a>
        }
      />
      <div className="iz iz-ana-yan">
        <Kart>
          <div className="form">
            <div className="satir">
              <label>
                {t("hedefPlan")}
                <input
                  type="date"
                  value={hedef}
                  min={B}
                  onChange={(e) => {
                    setHedef(e.target.value);
                    setGovde(cagriGovdesi(e.target.value, sonSaat));
                  }}
                />
              </label>
              <label>
                {t("sonSaatGmt")}
                <input
                  type="time"
                  value={sonSaat}
                  onChange={(e) => {
                    setSonSaat(e.target.value);
                    setGovde(cagriGovdesi(hedef, e.target.value));
                  }}
                />
              </label>
            </div>
            <AliciAlanlari kime={kime} setKime={setKime} bcc={bcc} setBcc={setBcc} />
            <EpostaOnizleme eposta={eposta} govde={govde} setGovde={setGovde} />
            <GonderDugmeleri eposta={eposta} dosyaAdi={`cagri-${hedef}.eml`} once={kaydet} />
          </div>
        </Kart>
        <OncekiCagrilar />
      </div>
    </>
  );
}

export function OncekiCagrilar({ tur }: { tur?: "nextday" | "haftalik" }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const cagriAdi = useCagriAdi();
  const liste = v.cagrilar.filter((c) => !tur || cagriTuru(c) === tur).sort((a, b) => b.zaman.localeCompare(a.zaman));
  return (
    <Kart baslik={t("oncekiCagrilar")}>
      {liste.length === 0 ? (
        <Bos kucuk metin={t("kayitYok")} />
      ) : (
        <ul className="liste">
          {liste.map((c) => (
            <li key={c.id}>
              <div className="ad">
                <a href={`#/oneriler/yanitlar/${c.id}`}>{cagriAdi(c)}</a>
                <small>
                  {ad(kisiBul(v, c.olusturan))} · {tarihYaz(yerelGun(c.zaman), dil, "kisa")} {saatYaz(c.zaman, dil)}
                  {c.sonSaat && ` · ${t("sonSaat")} ${c.sonSaat}`}
                </small>
              </div>
              <Rozet ton="vurgu">
                {yanitVerenler(v, c).length} / {c.bcc.length}
              </Rozet>
            </li>
          ))}
        </ul>
      )}
    </Kart>
  );
}

/* --- Gelen yanıtlar --- */

type AliciDurumu = "oneri" | "uygulama" | "oneriYok" | "yanitYok";

/** Çağrıya yanıt vermiş sayılan: e-postayla yanıtlamış ya da uygulamadan bu çağrıya öneri göndermiş. */
const aliciDurumu = (v: ReturnType<typeof useVeri>, c: CagriKaydi, kisiId: string): AliciDurumu => {
  const yanitlar = v.yanitlar.filter((y) => y.cagriId === c.id && y.kisiId === kisiId);
  const oneriler = v.oneriler.filter((o) => o.cagriId === c.id && o.muhabirId === kisiId);
  if (yanitlar.some((y) => y.durum === "oneri")) return "oneri";
  if (oneriler.length) return "uygulama";
  if (yanitlar.some((y) => y.durum === "oneriYok")) return "oneriYok";
  return "yanitYok";
};
const yanitVerenler = (v: ReturnType<typeof useVeri>, c: CagriKaydi) => c.bcc.filter((id) => aliciDurumu(v, c, id) !== "yanitYok");

const DURUM_GORUNUMU: Record<AliciDurumu, { ad: Anahtar; ton: string }> = {
  oneri: { ad: "yd_oneri", ton: "iyi" },
  uygulama: { ad: "ydUygulama", ton: "iyi" },
  oneriYok: { ad: "yd_oneriYok", ton: "" },
  yanitYok: { ad: "ydYanitYok", ton: "uyari" },
};

const htmldenMetin = (html: string) => new DOMParser().parseFromString(html, "text/html").body.innerText;

/*
 * Outlook'tan sürüklenen e-posta .msg (Outlook'un kendi biçimi), web
 * Outlook ve Gmail'den indirilen .eml. Okuyucular yalnız gerektiğinde
 * yükleniyor; ana sayfa ağırlaşmasın. Exchange içinden gelen e-postada
 * gönderen alanı iç adres olabiliyor; önce SMTP adresine bakılıyor.
 */
const dosyaOku = async (f: File): Promise<GelenEposta> => {
  if (/\.msg$/i.test(f.name)) {
    /* CommonJS paketin varsayılanı paketleyicide bir kat daha sarılı gelebiliyor; ikisini de karşıla. */
    type Okuyucu = typeof import("@kenjiuno/msgreader").default;
    const modul: { default: Okuyucu | { default: Okuyucu } } = await import("@kenjiuno/msgreader");
    const MsgReader = "default" in modul.default ? modul.default.default : modul.default;
    const d = new MsgReader(await f.arrayBuffer()).getFileData();
    const smtp = [d.senderSmtpAddress, d.sentRepresentingSmtpAddress, d.senderEmail].find((a) => a?.includes("@"));
    const zaman = d.messageDeliveryTime ?? d.clientSubmitTime;
    return {
      kimden: smtp ?? "",
      kimdenAd: d.senderName,
      konu: d.subject ?? "",
      metin: d.body ?? (d.bodyHtml ? htmldenMetin(d.bodyHtml) : ""),
      zaman: zaman ? new Date(zaman).toISOString() : undefined,
      mesajKimligi: d.messageId,
      ekler: (d.attachments ?? []).map((a) => a.fileName ?? a.name ?? "").filter(Boolean),
    };
  }
  const { default: PostalMime } = await import("postal-mime");
  const e = await PostalMime.parse(await f.arrayBuffer());
  return {
    kimden: e.from?.address ?? "",
    kimdenAd: e.from?.name,
    konu: e.subject ?? "",
    metin: e.text ?? (e.html ? htmldenMetin(e.html) : ""),
    zaman: e.date && !Number.isNaN(Date.parse(e.date)) ? new Date(e.date).toISOString() : undefined,
    mesajKimligi: e.messageId,
    ekler: e.attachments.map((a) => a.filename ?? "").filter(Boolean),
  };
};

function IceAktar({ ben, cagri }: { ben: Kisi; cagri?: CagriKaydi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [ustunde, setUstunde] = useState(false);
  const [yapistir, setYapistir] = useState({ kisiId: "", metin: "" });
  const sonuc = (s: YanitSonucu | null) => {
    if (!s) return;
    bildir(s.durum === "tekrar" ? t("bYanitTekrar") : t("bYanitIslendi", { sonuc: t(`yd_${s.durum}` as Anahtar) }));
  };
  const dosyalar = async (liste: FileList | null) => {
    for (const f of Array.from(liste ?? [])) {
      try {
        sonuc(epostaYanitiIsle(ben, await dosyaOku(f), "iceAktarma"));
      } catch (hata) {
        /* Okunamayan dosyanın nedeni geliştirici konsolunda kalsın; kullanıcıya kısa bildirim. */
        console.error(f.name, hata);
        bildir(t("bDosyaOkunamadi"));
      }
    }
  };
  const birak = (e: DragEvent) => {
    e.preventDefault();
    setUstunde(false);
    dosyalar(e.dataTransfer.files);
  };
  const kisi = kisiBul(v, yapistir.kisiId);
  return (
    <Kart baslik={t("iceAktar")} ikon={<Upload size={18} />}>
      <label
        className={`birakma-alani ara-ust-2 ${ustunde ? "ustunde" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setUstunde(true);
        }}
        onDragLeave={() => setUstunde(false)}
        onDrop={birak}
      >
        <Mail size={22} />
        <b>{t("surukleBirak")}</b>
        <span className="dugme dugme-ikincil dugme-kucuk">{t("dosyaSec")}</span>
        <input type="file" accept=".msg,.eml,message/rfc822" multiple hidden onChange={(e) => dosyalar(e.target.files).then(() => (e.target.value = ""))} />
      </label>
      <div className="form ara-ust-2">
        <div className="alan-etiket">{t("metinYapistir")}</div>
        <MuhabirSecici deger={yapistir.kisiId} degistir={(id) => setYapistir({ ...yapistir, kisiId: id })} />
        <textarea {...icerikAlani} value={yapistir.metin} onChange={(e) => setYapistir({ ...yapistir, metin: e.target.value })} />
        <div className="form-alt">
          <button
            className="dugme"
            disabled={!kisi || !yapistir.metin.trim()}
            onClick={() => {
              if (!kisi) return;
              const konu = cagri ? `RE: ${cagriKonusu(cagri.tarih, cagriTuru(cagri))}` : "";
              sonuc(epostaYanitiIsle(ben, { kimden: kisi.eposta, kimdenAd: ad(kisi), konu, metin: yapistir.metin }, "iceAktarma"));
              setYapistir({ kisiId: "", metin: "" });
            }}
          >
            {t("isle")}
          </button>
        </div>
      </div>
    </Kart>
  );
}

function Eslesmeyenler({ ben, cagri }: { ben: Kisi; cagri?: CagriKaydi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [secim, setSecim] = useState<Record<string, string>>({});
  const liste = v.yanitlar.filter((y) => y.durum === "eslesmedi");
  if (!liste.length) return null;
  return (
    <Kart baslik={t("eslesmeyenler")} ikon={<MailQuestion size={18} />} ek={String(liste.length)}>
      {liste.map((y) => (
        <div key={y.id} className="kayit ara-ust-2">
          <div className="kayit-bas">
            <div>
              <b dir="ltr" className="sol-hiza">
                {y.kimdenAd ? `${y.kimdenAd} <${y.kimden}>` : y.kimden}
              </b>
              <Icerik blok className="kayit-metin">
                {y.metin}
              </Icerik>
              <small>
                <span dir="auto">{y.konu}</span>
                <span>
                  · {tarihYaz(yerelGun(y.zaman), dil, "kisa")} {saatYaz(y.zaman, dil)}
                </span>
                {y.ekler.length > 0 && (
                  <span>
                    · <Paperclip size={12} /> {y.ekler.join(", ")}
                  </span>
                )}
              </small>
            </div>
          </div>
          {cagri && yapabilir(ben, "oneriDegerlendir") && (
            <div className="form ara-ust">
              <MuhabirSecici deger={secim[y.id] ?? ""} degistir={(id) => setSecim({ ...secim, [y.id]: id })} />
              <div className="form-alt">
                <button
                  className="dugme dugme-kucuk"
                  disabled={!secim[y.id]}
                  onClick={() => {
                    const s = yanitBagla(ben, y.id, secim[y.id], cagri.id);
                    if (s) bildir(t("bYanitIslendi", { sonuc: t(`yd_${s.durum}` as Anahtar) }));
                  }}
                >
                  <Link2 size={14} /> {t("muhabireBagla")}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </Kart>
  );
}

export function Yanitlar({ ben, cagriId }: { ben: Kisi; cagriId?: string }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const cagrilar = [...v.cagrilar].sort((a, b) => b.zaman.localeCompare(a.zaman));
  const cagri = cagrilar.find((c) => c.id === cagriId) ?? cagrilar[0];
  const satirlar = cagri
    ? cagri.bcc
        .map((id) => ({ kisi: kisiBul(v, id), durum: aliciDurumu(v, cagri, id) }))
        .filter((s): s is { kisi: Kisi; durum: AliciDurumu } => !!s.kisi)
        .sort((a, b) => Number(a.durum === "yanitYok") - Number(b.durum === "yanitYok") || ad(a.kisi).localeCompare(ad(b.kisi)))
    : [];
  const vermeyen = satirlar.filter((s) => s.durum === "yanitYok");
  const cagriAdi = useCagriAdi();
  const haftalik = !!cagri && cagriTuru(cagri) === "haftalik";
  const hatirlatma: GidenEposta | undefined = cagri && {
    kime: cagri.kime,
    bcc: vermeyen.map((s) => s.kisi.eposta),
    konu: `${metinAr("hatirlatmaOnEki")}: ${cagriKonusu(cagri.tarih, cagriTuru(cagri))}`,
    govde: haftalik
      ? metinAr("hatirlatmaHaftalik", { aralik: haftaAraligiAr(cagri.tarih), adres: cagri.kime })
      : metinAr("hatirlatmaGovdesi", { saat: cagri.sonSaat }),
  };
  return (
    <>
      <a className="geri-bag" href="#/oneriler">
        <ArrowLeft size={14} className="yon" /> {t("mOneriler")}
      </a>
      <SayfaBasi
        ikon={<Inbox size={26} />}
        baslik={t("gelenYanitlar")}
       
        sagUc={
          <>
            {cagrilar.length > 0 && (
              <select className="girdi girdi-kisa" value={cagri?.id} onChange={(e) => git(`oneriler/yanitlar/${e.target.value}`)} aria-label={t("oneriCagrisi")}>
                {cagrilar.map((c) => (
                  <option key={c.id} value={c.id}>
                    {cagriAdi(c)}
                  </option>
                ))}
              </select>
            )}
            {!haftalik && (
              <a className="dugme dugme-ikincil" href="#/oneriler/cagri">
                <Megaphone size={16} /> {t("oneriCagrisi")}
              </a>
            )}
          </>
        }
      />
      {!cagri ? (
        <Bos metin={t("kayitYok")} />
      ) : (
        <>
          <div className="sayaclar">
            <Sayac ikon={<Mail size={22} />} etiket={t("alicilar")} deger={satirlar.length} alt={cagri.sonSaat ? `${t("sonSaat")} ${cagri.sonSaat} GMT` : undefined} />
            <Sayac ikon={<MailCheck size={22} />} etiket={t("yanitVerenler")} deger={satirlar.length - vermeyen.length} ton="iyi" />
            <Sayac ikon={<MailMinus size={22} />} etiket={t("yd_oneriYok")} deger={satirlar.filter((s) => s.durum === "oneriYok").length} />
            <Sayac ikon={<MailX size={22} />} etiket={t("yanitVermeyenler")} deger={vermeyen.length} ton={vermeyen.length ? "uyari" : ""} />
          </div>
          <div className="iz iz-ana-yan">
            <Kart baslik={cagriAdi(cagri)} sagUc={<Rozet>{cagri.etiket}</Rozet>}>
              <div className="tablo-sar">
                <table className="tablo kartli">
                  <thead>
                    <tr>
                      <th>{t("muhabir")}</th>
                      <th>{t("durum")}</th>
                      <th className="icerik-sutun">{t("mOneriler")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {satirlar.map(({ kisi, durum }) => {
                      const oneriler = v.oneriler.filter((o) => o.cagriId === cagri.id && o.muhabirId === kisi.id);
                      const yanit = v.yanitlar.filter((y) => y.cagriId === cagri.id && y.kisiId === kisi.id).sort((a, b) => b.zaman.localeCompare(a.zaman))[0];
                      return (
                        <tr key={kisi.id}>
                          <td className="birincil">
                            <span className="kisi-hucre">
                              <Avatar kisi={kisi} boy="kucuk" /> {ad(kisi)}
                            </span>
                          </td>
                          <td data-etiket={t("durum")}>
                            <Rozet ton={DURUM_GORUNUMU[durum].ton}>{t(DURUM_GORUNUMU[durum].ad)}</Rozet>
                            {yanit && (
                              <small className="sonuk ince">
                                {tarihYaz(yerelGun(yanit.zaman), dil, "kisa")} {saatYaz(yanit.zaman, dil)}
                              </small>
                            )}
                          </td>
                          <td className="icerik-sutun" data-etiket={t("mOneriler")}>
                            {oneriler.length === 0 && yanit?.durum === "oneriYok" && <Icerik blok>{yanit.metin}</Icerik>}
                            {oneriler.map((o) => (
                              <a key={o.id} href={`#/oneriler/${o.id}`} className="kalin-bag">
                                <Icerik blok>{o.haberBasligi}</Icerik>
                              </a>
                            ))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {hatirlatma && vermeyen.length > 0 && (
                <div className="ara-ust-2">
                  <div className="alan-etiket">
                    {t("hatirlat")} · {t("aliciSayisi", { n: vermeyen.length })}
                  </div>
                  <GonderDugmeleri eposta={hatirlatma} dosyaAdi={`hatirlatma-${cagri.tarih}.eml`} />
                </div>
              )}
            </Kart>
            <div className="iz">
              <IceAktar ben={ben} cagri={cagri} />
              <Eslesmeyenler ben={ben} cagri={cagri} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* --- Öneri detayındaki kaynak e-posta: orijinali, düzenleme ve bölme --- */

/* Muhabirin düzeltip yeniden gönderdiği öneri de aynı alanlarla (OneriDetay). */
export function KisaOneriFormu({
  ilk,
  kaydet,
  kapat,
  kaydetMetni,
  gelismeGerekli = false,
}: {
  ilk: YanitOneriGirdisi;
  kaydet: (g: YanitOneriGirdisi) => boolean;
  kapat: () => void;
  kaydetMetni?: string;
  /** Yeniden gönderilen öneride gelişme boş kalamaz; yanıttan ayırırken seçili metin boş olabilir. */
  gelismeGerekli?: boolean;
}) {
  const { t } = useDil();
  const [f, setF] = useState<YanitOneriGirdisi & { bicim: Bicim }>({ ...ilk, bicim: ilk.bicim ?? "pkg" });
  return (
    <div className="form form-kutu ara-ust-2">
      <label>
        {t("haberBasligi")}
        <input {...icerikAlani} value={f.haberBasligi} onChange={(e) => setF({ ...f, haberBasligi: e.target.value })} />
      </label>
      <label>
        {t("gelismeAciklama")}
        <textarea {...icerikAlani} value={f.gelisme} onChange={(e) => setF({ ...f, gelisme: e.target.value })} />
      </label>
      <label>
        {t("onerilenPaketBasligi")} <span className="ipucu">{t("varsa")}</span>
        <input {...icerikAlani} value={f.paketBasligi ?? ""} onChange={(e) => setF({ ...f, paketBasligi: e.target.value })} />
      </label>
      <div className="satir">
        <label>
          {t("tur")}
          <select value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as IcerikTuru })}>
            {ICERIK_TURLERI.map((x) => (
              <option key={x} value={x}>
                {t(TUR_ADI[x])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("haberTuru")}
          <BicimSecici deger={f.bicim} degistir={(b) => setF({ ...f, bicim: b })} />
        </label>
      </div>
      <label className="secim">
        <input type="checkbox" checked={f.sahaGerekli} onChange={(e) => setF({ ...f, sahaGerekli: e.target.checked })} />
        {t("sahaGerekli")}
      </label>
      <div className="form-alt">
        <button className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
          {t("iptal")}
        </button>
        <button className="dugme dugme-kucuk" disabled={!f.haberBasligi.trim() || (gelismeGerekli && !f.gelisme.trim())} onClick={() => kaydet(f) && kapat()} data-kisa-kaydet>
          {kaydetMetni ?? t("kaydet")}
        </button>
      </div>
    </div>
  );
}

export function EpostaKaynagi({ ben, oneri, yanit }: { ben: Kisi; oneri: Oneri; yanit: Yanit }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [form, setForm] = useState<"" | "duzenle" | "ayir">("");
  const [secili, setSecili] = useState("");
  const kardesler = v.oneriler.filter((o) => o.yanitId === yanit.id && o.id !== oneri.id);
  const degerlendirir = yapabilir(ben, "oneriDegerlendir");
  const duzenlenir = degerlendirir && ["yeni", "degerlendiriliyor", "sonra"].includes(oneri.durum);
  return (
    <Kart baslik={t("orijinalEposta")} ikon={<Mail size={18} />} ek={t(yanit.kaynak === "posta" ? "kaynakPosta" : "kaynakIceAktarma")}>
      <p className="sonuk-yazi">
        <bdi dir="ltr">{yanit.kimdenAd ? `${yanit.kimdenAd} <${yanit.kimden}>` : yanit.kimden}</bdi> · {tarihYaz(yerelGun(yanit.zaman), dil, "kisa")} {saatYaz(yanit.zaman, dil)}
      </p>
      <p className="sonuk-yazi">
        <bdi dir="auto">{yanit.konu}</bdi>
      </p>
      <div className="metin-kutu ara-ust" onMouseUp={() => setSecili(window.getSelection()?.toString().trim() ?? "")}>
        <Icerik blok>{yanit.metin}</Icerik>
      </div>
      {yanit.ekler.length > 0 && (
        <p className="sonuk-yazi ara-ust">
          <Paperclip size={13} /> {t("ekler")}: <bdi>{yanit.ekler.join(", ")}</bdi>
        </p>
      )}
      {yanit.tamMetin !== yanit.metin && (
        <details className="ara-ust-2">
          <summary className="bos-kucuk">{t("tamMetin")}</summary>
          <pre className="tam-metin" dir="auto">
            {yanit.tamMetin}
          </pre>
        </details>
      )}
      {kardesler.length > 0 && (
        <div className="ara-ust-2">
          <div className="alan-etiket">{t("ayniYanittan", { n: kardesler.length + 1 })}</div>
          {kardesler.map((o) => (
            <a key={o.id} href={`#/oneriler/${o.id}`} className="kalin-bag">
              <Icerik blok>{o.haberBasligi}</Icerik>
            </a>
          ))}
        </div>
      )}
      {degerlendirir && !form && (
        <div className="dugmeler ara-ust-2">
          {duzenlenir && (
            <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setForm("duzenle")}>
              <Pencil size={14} /> {t("oneriyiDuzenle")}
            </button>
          )}
          <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setForm("ayir")} title={t("yanittanAyirNotu")}>
            <Scissors size={14} /> {t("yanittanAyir")}
          </button>
        </div>
      )}
      {form === "duzenle" && (
        <KisaOneriFormu
          ilk={{ haberBasligi: oneri.haberBasligi, gelisme: oneri.gelisme, paketBasligi: oneri.paketBasligi, tur: oneri.tur, bicim: oneri.bicim, sahaGerekli: oneri.sahaGerekli }}
          kaydet={(g) => {
            const ok = oneriDuzenle(ben, oneri.id, g);
            if (ok) bildir(t("bKaydedildi"));
            return ok;
          }}
          kapat={() => setForm("")}
        />
      )}
      {form === "ayir" && (
        <>
          <KisaOneriFormu
            ilk={{ haberBasligi: secili.split("\n")[0]?.slice(0, 140) ?? "", gelisme: secili, tur: "haber", sahaGerekli: false }}
            kaydet={(g) => {
              const id = yanittanOneri(ben, yanit.id, g);
              if (id) {
                bildir(t("bOneriAyrildi"));
                git(`oneriler/${id}`);
              }
              return !!id;
            }}
            kapat={() => setForm("")}
          />
        </>
      )}
    </Kart>
  );
}
