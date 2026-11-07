import { ArrowLeft, FileText, Mail, MessageSquare, RefreshCw, Send, Trash2, Upload } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type DragEvent } from "react";
import { Bos, Icerik, Kart, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { saatYaz, tarihYaz, useDil } from "../../dil";
import { postaGidenEkle, postaIsle, postaSil, type PostaSonucu } from "../../eylemler";
import { gizliEkMi, gondereniBul, postaKonuBasligi, postaMetniSadelestir, type GelenEposta } from "../../eposta";
import { useVeri, type Kisi, type PostaMesaji } from "../../veri";
import { yerelGun } from "../../tarih";
import { GERCEK } from "../../kip";
import { postalariCek, postaGonder } from "../../posta-kapi";
import { SayfaBasi } from "../ana/Planlama";
import { dosyaOku } from "../oneri/Eposta";

/**
 * Gelen posta sohbeti: planlama kutusuna düşen postalar, eklerinden
 * arındırılmış ve alıntı/imza ayıklanmış biçimde, konuya göre sohbet
 * iplikçiklerinde (eposta.ts → postaIsle). Öneri-yanıt akışından ayrı;
 * çağrıya bağlı değil. Bugün Outlook'tan sürükle-bırakla besleniyor,
 * sunucu fazında posta kutusunu izleyen hizmet (EWS/Graph) aynı kaydı
 * yazacak (belgeler/eposta-entegrasyonu.md).
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

/*
 * Sohbet WhatsApp gibi: gereksiz üst veri yok, yalnız mesaj balonu ve ekli
 * dosyalar. Gönderen adı grup başına bir kez (ardışık aynı gönderende
 * tekrarlamaz), köşede saat, günler arasında ayraç.
 */
function SohbetGovdesi({ sohbet }: { sohbet: Sohbet }) {
  const { ad, dil, t } = useDil();
  const v = useVeri();
  return (
    <div className="posta-govde" data-posta-sohbet={sohbet.konuKimligi}>
      <ol className="posta-mesajlar">
        {sohbet.mesajlar.map((m, i) => {
          const kisi = gondereniBul(v, m.kimden);
          const onceki = sohbet.mesajlar[i - 1];
          const yeniGun = !onceki || yerelGun(onceki.zaman) !== yerelGun(m.zaman);
          const yeniGonderen = yeniGun || !onceki || onceki.kimden !== m.kimden;
          const govde = m.giden ? m.metin : postaMetniSadelestir(m.metin, gonderenAdi(v, m, ad));
          const ekler = m.ekler.filter((e) => !gizliEkMi(e));
          return (
            <Fragment key={m.id}>
              {yeniGun && (
                <li className="posta-gun">
                  <span>{tarihYaz(yerelGun(m.zaman), dil, "tam")}</span>
                </li>
              )}
              <li className={`posta-balon${m.giden ? " giden" : ""}`} data-posta-mesaj>
                {yeniGonderen && !m.giden && (
                  <div className="posta-gonderen" dir={kisi ? undefined : "ltr"}>
                    @{gonderenAdi(v, m, ad)}
                  </div>
                )}
                {govde.trim() ? (
                  <Icerik blok className="posta-metin">
                    {govde}
                  </Icerik>
                ) : (
                  !m.giden && ekler.length === 0 && <span className="posta-bos">{t("postaBosGovde")}</span>
                )}
                {ekler.map((e, j) => (
                  <span className="posta-ek" key={j}>
                    <span className="posta-ek-ikon">
                      <FileText size={18} />
                    </span>
                    <bdi>{e}</bdi>
                  </span>
                ))}
                <span className="posta-zaman">{saatYaz(m.zaman, dil)}</span>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}

/*
 * WhatsApp gibi yanıt kutusu: sohbetin altında. Alıcı, sohbetteki son gelen
 * postanın göndereni (konuştuğumuz kişi); konu "RE: <başlık>". Gerçek kipte
 * kapı EWS ile gönderiyor, sonra giden balon ekleniyor; demoda yalnız ekrana.
 */
function Yazma({ ben, sohbet }: { ben: Kisi; sohbet: Sohbet }) {
  const { t } = useDil();
  const [metin, setMetin] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const sonGelen = [...sohbet.mesajlar].reverse().find((m) => !m.giden) ?? sohbet.son;
  const kime = sonGelen.kimden;
  const konu = /^re:/i.test(sohbet.son.konu) ? sohbet.son.konu : `RE: ${sohbet.baslik}`;
  const gonder = async () => {
    const m = metin.trim();
    if (!m) return;
    setGonderiliyor(true);
    if (GERCEK) {
      const r = await postaGonder({ kime, konu, metin: m });
      setGonderiliyor(false);
      if (!r.tamam) return bildir(`${t("bPostaGonderHata")}${r.ayrinti ? ` (${r.ayrinti})` : ""}`);
    } else setGonderiliyor(false);
    postaGidenEkle(ben, sohbet.konuKimligi, konu, m);
    setMetin("");
    bildir(t("bPostaGonderildi"));
  };
  return (
    <div className="posta-yaz">
      <textarea
        {...icerikAlani}
        rows={1}
        value={metin}
        placeholder={t("postaYaz")}
        onChange={(e) => setMetin(e.target.value)}
        onKeyDown={(e) => {
          // Ctrl/⌘+Enter gönderir; düz Enter satır açar.
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void gonder();
        }}
        data-posta-yaz
      />
      <button type="button" className="dugme" disabled={!metin.trim() || gonderiliyor} onClick={gonder} data-posta-gonder>
        <Send size={16} className="yon" />
      </button>
    </div>
  );
}

/* Köprü: Outlook'tan .msg sürükle-bırak, indirilmiş .eml ya da yapıştırılan metin; hepsi aynı işlemeden geçiyor. */
function IceAktar({ ben, onEklendi }: { ben: Kisi; onEklendi: (s: PostaSonucu) => void }) {
  const { t } = useDil();
  const [ustunde, setUstunde] = useState(false);
  const [yapistir, setYapistir] = useState({ kimden: "", konu: "", metin: "" });
  const dosyalar = async (liste: FileList | null) => {
    for (const f of Array.from(liste ?? [])) {
      try {
        const s = postaIsle(ben, await dosyaOku(f), "iceAktarma");
        if (s) onEklendi(s);
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
  const yapistirIsle = () => {
    // "Ad <adres>" biçimini ada ve adrese ayır; yoksa yazılanı adres say.
    const ham = yapistir.kimden.trim();
    const esli = ham.match(/^"?([^"<]*?)"?\s*<([^>]+)>$/);
    const kimden = esli ? esli[2].trim() : ham;
    const kimdenAd = esli ? esli[1].trim() || undefined : undefined;
    const gelen: GelenEposta = { kimden, kimdenAd, konu: yapistir.konu, metin: yapistir.metin };
    const s = postaIsle(ben, gelen, "iceAktarma");
    if (s) {
      onEklendi(s);
      setYapistir({ kimden: "", konu: "", metin: "" });
    }
  };
  return (
    <Kart baslik={t("iceAktar")} ikon={<Upload size={18} />}>
      <label
        className={`birakma-alani ${ustunde ? "ustunde" : ""}`}
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
        <input type="email" dir="ltr" placeholder={t("gonderenAdresi")} value={yapistir.kimden} onChange={(e) => setYapistir({ ...yapistir, kimden: e.target.value })} data-posta-kimden />
        <input {...icerikAlani} placeholder={t("postaKonusu")} value={yapistir.konu} onChange={(e) => setYapistir({ ...yapistir, konu: e.target.value })} data-posta-konu />
        <textarea {...icerikAlani} value={yapistir.metin} onChange={(e) => setYapistir({ ...yapistir, metin: e.target.value })} data-posta-metin />
        <div className="form-alt">
          <button className="dugme" disabled={!yapistir.kimden.trim() || !yapistir.metin.trim()} onClick={yapistirIsle} data-posta-isle>
            {t("isle")}
          </button>
        </div>
      </div>
    </Kart>
  );
}

export function Posta({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const sohbetler = sohbetleriKur(v.postaMesajlari ?? []);
  const [secili, setSecili] = useState("");
  const secik = sohbetler.find((s) => s.konuKimligi === secili);
  const onEklendi = (s: PostaSonucu) => {
    bildir(t(s.durum === "tekrar" ? "bPostaTekrar" : "bPostaEklendi"));
    if (s.durum === "eklendi" && s.konuKimligi) setSecili(s.konuKimligi);
  };
  const sil = (konuKimligi: string) => {
    if (!confirm(t("postaSilOnay"))) return;
    if (postaSil(ben, konuKimligi) && secili === konuKimligi) setSecili("");
  };
  const [cekiliyor, setCekiliyor] = useState(false);
  const cek = async () => {
    setCekiliyor(true);
    const r = await postalariCek(ben);
    setCekiliyor(false);
    if ("hata" in r) bildir(`${t("bPostaCekHata")}${r.ayrinti ? ` (${r.ayrinti})` : ""}`);
    else bildir(r.eklenen ? t("bPostaCekildi", { n: String(r.eklenen) }) : t("bPostaCekYok"));
  };
  // Gerçek kipte sayfa açılınca bir kez kutuyu yokla; parola kapıda, tarayıcıya gelmiyor.
  const ilk = useRef(false);
  useEffect(() => {
    if (GERCEK && !ilk.current) {
      ilk.current = true;
      void cek();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <SayfaBasi
        ikon={<Mail size={26} />}
        baslik={t("postaBasligi")}
        sagUc={
          GERCEK ? (
            <button className="dugme dugme-ikincil" onClick={cek} disabled={cekiliyor} data-posta-cek>
              <RefreshCw size={16} /> {t(cekiliyor ? "postaCekiliyor" : "postaCek")}
            </button>
          ) : undefined
        }
      />
      <div className={`posta-duzen${secik ? " secili" : ""}`}>
        <div className="iz posta-liste-sutun">
          <Kart baslik={t("postaSohbetler")} ek={String(sohbetler.length)}>
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
          <IceAktar ben={ben} onEklendi={onEklendi} />
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
                  <button className="dugme dugme-sade dugme-kucuk" onClick={() => sil(secik.konuKimligi)} title={t("postaSohbetSil")}>
                    <Trash2 size={14} /> {t("sil")}
                  </button>
                }
              >
                <SohbetGovdesi sohbet={secik} />
                <Yazma ben={ben} sohbet={secik} />
              </Kart>
            </>
          ) : (
            <Bos metin={t("postaSohbetSec")} ikon={<Mail size={28} />} />
          )}
        </div>
      </div>
    </>
  );
}
