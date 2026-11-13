import { Copy, Mail, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { useDil } from "../dil";
import { TopluPostaPenceresi } from "../ekranlar/posta/Posta";
import { muhabirAdresi } from "../muhabirIletisim";
import type { Kisi } from "../veri";
import { Avatar, bildir, icerikAlani, Pencere } from "./Parcalar";
import { WhatsAppDugmesi, whatsappNumarasi } from "./WhatsApp";

/*
 * Toplu iletişim (yeni mimari, 3. aşama): muhabir listesinde seçilenlere tek
 * posta ya da sırayla WhatsApp. Planlamacı aynı duyuruyu (çağrı dışı:
 * hatırlatma, kural değişikliği) muhabirlere tek tek yazıyordu.
 * - Posta: adresler BCC'de, muhabirler birbirinin adresini görmez; kapı en
 *   çok 50 alıcı kabul ediyor (grup CC'de), fazlası seçilemez.
 * - WhatsApp: tarayıcı toplu gönderemez, gönderen yine kişi: metin bir kez
 *   yazılır, her muhabirin satırındaki düğme sohbeti metin yazılı açar.
 *   Basılanlar yalnız bu pencerede işaretlenir, kaydedilmez (gizlilik).
 */
export const TOPLU_SINIR = 49;

export function TopluCubuk({ ben, kisiler, temizle }: { ben: Kisi; kisiler: Kisi[]; temizle: () => void }) {
  const { t } = useDil();
  const [acik, setAcik] = useState<"" | "posta" | "whatsapp">("");
  const adresler = [...new Set(kisiler.map(muhabirAdresi).filter(Boolean))];
  const fazla = adresler.length > TOPLU_SINIR;
  if (!kisiler.length) return null;
  return (
    <div className="toplu-cubuk" data-toplu-cubuk>
      <b>{t("tiSecili", { n: kisiler.length })}</b>
      <button
        type="button"
        className="dugme dugme-kucuk"
        aria-disabled={!adresler.length || fazla || undefined}
        title={fazla ? t("tiSinir", { n: TOPLU_SINIR }) : !adresler.length ? t("kcAdresYok") : t("tiPosta", { n: adresler.length })}
        onClick={() => (fazla ? bildir(t("tiSinir", { n: TOPLU_SINIR })) : adresler.length && setAcik("posta"))}
        data-toplu-posta
      >
        <Mail size={15} /> {t("tiPosta", { n: adresler.length })}
      </button>
      <button type="button" className="dugme dugme-kucuk dugme-ikincil" onClick={() => setAcik("whatsapp")} data-toplu-whatsapp>
        <MessageCircle size={15} /> {t("whatsapp")}
      </button>
      <button type="button" className="dugme dugme-sade dugme-ikon" onClick={temizle} aria-label={t("tiTemizle")} title={t("tiTemizle")} data-toplu-temizle>
        <X size={15} />
      </button>
      {acik === "posta" && <TopluPostaPenceresi ben={ben} adresler={adresler} kapat={() => setAcik("")} />}
      {acik === "whatsapp" && <TopluWhatsApp kisiler={kisiler} kapat={() => setAcik("")} />}
    </div>
  );
}

function TopluWhatsApp({ kisiler, kapat }: { kisiler: Kisi[]; kapat: () => void }) {
  const { t, ad } = useDil();
  const [metin, setMetin] = useState("");
  const [basilan, setBasilan] = useState<Set<string>>(new Set());
  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(metin.trim());
      bildir(t("tiKopyalandi"));
    } catch {
      bildir(t("tiKopyalanamadi"));
    }
  };
  return (
    <Pencere baslik={t("tiWhatsappBaslik", { n: kisiler.length })} kapat={kapat}>
      <div className="form" data-toplu-wa>
        <textarea className="girdi" rows={4} value={metin} onChange={(e) => setMetin(e.target.value)} {...icerikAlani} placeholder="مرحبًا، …" aria-label={t("tiMetin")} data-toplu-wa-metin />
        <div>
          <button type="button" className="dugme dugme-sade dugme-kucuk" disabled={!metin.trim()} onClick={kopyala}>
            <Copy size={14} /> {t("tiKopyala")}
          </button>
        </div>
        <ul className="toplu-wa-liste">
          {kisiler.map((k) => {
            const var_ = !!whatsappNumarasi(k.telefon);
            return (
              <li key={k.id} className={basilan.has(k.id) ? "basildi" : ""} data-toplu-wa-kisi={k.id} onClickCapture={(e) => (e.target as HTMLElement).closest("[data-whatsapp]") && setBasilan((s) => new Set(s).add(k.id))}>
                <Avatar kisi={k} boy="kucuk" />
                <bdi>{ad(k)}</bdi>
                {var_ ? <WhatsAppDugmesi telefon={k.telefon} metin={metin} /> : <span className="sonuk">{t("kcTelefonYok")}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </Pencere>
  );
}
