import { Mail, MessageSquare, Paperclip, Trash2, Upload } from "lucide-react";
import { useState, type DragEvent } from "react";
import { Avatar, Bos, Icerik, Kart, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { saatYaz, tarihYaz, useDil } from "../../dil";
import { postaIsle, postaSil, type PostaSonucu } from "../../eylemler";
import { gondereniBul, postaKonuBasligi, type GelenEposta } from "../../eposta";
import { useVeri, type Kisi, type PostaMesaji } from "../../veri";
import { yerelGun } from "../../tarih";
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

/* Postanın göndereni kayıtlı kişiyse adı, değilse e-postadaki ad/adres. */
const GonderenEtiketi = ({ m }: { m: PostaMesaji }) => {
  const { ad } = useDil();
  const v = useVeri();
  const kisi = gondereniBul(v, m.kimden);
  return <b dir={kisi ? undefined : "ltr"}>{kisi ? ad(kisi) : m.kimdenAd || m.kimden}</b>;
};

function SohbetGovdesi({ sohbet }: { sohbet: Sohbet }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  return (
    <div className="yazisma" data-posta-sohbet={sohbet.konuKimligi}>
      <ol className="mesajlar">
        {sohbet.mesajlar.map((m) => {
          const kisi = gondereniBul(v, m.kimden);
          return (
            <li key={m.id} data-posta-mesaj>
              <Avatar kisi={kisi} boy="kucuk" />
              <div>
                <small>
                  <b dir={kisi ? undefined : "ltr"}>{kisi ? ad(kisi) : m.kimdenAd || m.kimden}</b> · {tarihYaz(yerelGun(m.zaman), dil, "kisa")} {saatYaz(m.zaman, dil)}
                </small>
                <Icerik blok>{m.metin}</Icerik>
                {m.ekler.length > 0 && (
                  <small className="sonuk ince">
                    <Paperclip size={12} /> {m.ekler.join(", ")}
                  </small>
                )}
                {m.tamMetin !== m.metin && (
                  <details>
                    <summary className="bos-kucuk">{t("tamMetin")}</summary>
                    <pre className="tam-metin" dir="auto">
                      {m.tamMetin}
                    </pre>
                  </details>
                )}
              </div>
            </li>
          );
        })}
      </ol>
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
    const gelen: GelenEposta = { kimden: yapistir.kimden.trim(), kimdenAd: yapistir.kimden.trim(), konu: yapistir.konu, metin: yapistir.metin };
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
  return (
    <>
      <SayfaBasi ikon={<Mail size={26} />} baslik={t("postaBasligi")} />
      <div className="posta-duzen">
        <div className="iz">
          <Kart baslik={t("postaSohbetler")} ek={String(sohbetler.length)}>
            {sohbetler.length === 0 ? (
              <Bos kucuk metin={t("postaMesajYok")} />
            ) : (
              <ol className="posta-sohbetler" data-posta-liste>
                {sohbetler.map((s) => (
                  <li key={s.konuKimligi}>
                    <button type="button" className={s.konuKimligi === secili ? "secili" : ""} onClick={() => setSecili(s.konuKimligi)} data-posta-sohbet-bag={s.konuKimligi}>
                      <span className="posta-sohbet-bas">
                        <Icerik>{s.baslik}</Icerik>
                        <small className="sonuk ince">{saatYaz(s.son.zaman, dil)}</small>
                      </span>
                      <small className="sonuk">
                        <GonderenEtiketi m={s.son} /> · {t("postaMesajSayisi", { n: s.mesajlar.length })}
                      </small>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </Kart>
          <IceAktar ben={ben} onEklendi={onEklendi} />
        </div>
        {secik ? (
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
          </Kart>
        ) : (
          <Bos metin={t("postaSohbetSec")} ikon={<Mail size={28} />} />
        )}
      </div>
    </>
  );
}
