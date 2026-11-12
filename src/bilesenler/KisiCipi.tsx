import { FolderOpen, Mail, MessageCircle } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useDil } from "../dil";
import { KISI_DURUM_ADI, sehirAdi } from "../etiketler";
import { kisiBugunDurumu, kisiOzeti, muhabirAdresi } from "../muhabirIletisim";
import { useVeri, type Kisi } from "../veri";
import { birimAdi, disMuhabirMi, gorevAdi } from "../yapi";
import { kisitliKisi, sayfaGorebilir } from "../yetki";
import { IsPostasiPenceresi } from "../ekranlar/posta/Posta";
import { IslemMenusu } from "./IslemMenusu";
import { Avatar } from "./Parcalar";
import { WhatsAppDugmesi } from "./WhatsApp";

/*
 * Kişi çipi (yeni mimari; belgeler/planlama-yeni-mimari.md): muhabirin adı
 * geçtiği çalışma ekranlarında aynı bileşen. Ada basınca küçük kart: şehir,
 * ünvan, bugünkü durum (izin ve saha kaydından), açık işleri, WhatsApp,
 * posta (konu bağlamdan), kişinin sayfası. Önce muhabire ulaşmak için
 * profiline gitmek gerekiyordu; iletişim düğmesi yalnız Programlar'ın
 * içerik kartındaydı. Kart yalnız basınca açılır (tablo üstünde gezerken
 * patlamasın). Kısıtlı kişi (muhabirin kendisi) yalnız adı görür; çıktıda,
 * posta balonunda ve bildirimde de yalnız ad yazılır, çip kullanılmaz.
 */

const kisiSayfasi = (k: Kisi) => (disMuhabirMi(k) ? "muhabirler" : "personel");

/** İletişim düğmeleri; kartın içinde ve satır sonunda aynı sıra: WhatsApp, posta, kişinin sayfası. */
export function KisiIletisim({ ben, kisi, konu, onPosta, dosya = true }: { ben: Kisi; kisi: Kisi; konu: string; onPosta?: () => void; dosya?: boolean }) {
  const { t } = useDil();
  const [posta, setPosta] = useState(false);
  if (kisitliKisi(ben)) return null;
  const adres = muhabirAdresi(kisi);
  const sayfa = kisiSayfasi(kisi);
  return (
    <span className="kisi-iletisim" data-kisi-iletisim={kisi.id}>
      {kisi.telefon ? (
        <WhatsAppDugmesi telefon={kisi.telefon} />
      ) : (
        <span className="ikon-dugme pasif" aria-disabled="true" title={t("kcTelefonYok")} aria-label={t("kcTelefonYok")}>
          <MessageCircle size={17} />
        </span>
      )}
      <button
        type="button"
        className="ikon-dugme"
        aria-disabled={!adres || undefined}
        title={adres ? t("postaYeni") : t("kcAdresYok")}
        aria-label={adres ? t("postaYeni") : t("kcAdresYok")}
        onClick={() => adres && (onPosta ? onPosta() : setPosta(true))}
        data-is-postasi
      >
        <Mail size={17} />
      </button>
      {dosya && sayfaGorebilir(ben, sayfa) && (
        <a className="ikon-dugme" href={`#/${sayfa}/${kisi.id}`} title={t("kcDosya")} aria-label={t("kcDosya")} data-kisi-dosya>
          <FolderOpen size={17} />
        </a>
      )}
      {posta && <IsPostasiPenceresi ben={ben} kisi={kisi} konu={konu} kapat={() => setPosta(false)} />}
    </span>
  );
}

export function KisiCipi({ ben, kisi, konu = "", ek }: { ben: Kisi; kisi?: Kisi; konu?: string; ek?: ReactNode }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [posta, setPosta] = useState(false);
  if (!kisi) return null;
  const adi = ad(kisi);
  // Muhabir başka muhabiri ve iletişim kartını görmüyor: yalnız ad.
  if (kisitliKisi(ben))
    return (
      <span className="kisi-cipi duz">
        <Avatar kisi={kisi} boy="kucuk" /> <bdi>{adi}</bdi>
      </span>
    );
  const durum = kisiBugunDurumu(v, kisi);
  const oz = kisiOzeti(v, kisi.id);
  const latin = typeof kisi.ad === "string" ? "" : kisi.ad.tr;
  return (
    <span className="kisi-cipi-kap" data-kisi-cipi={kisi.id}>
      <IslemMenusu
        etiket={adi}
        dugmeSinifi={`kisi-cipi${durum === "izinli" ? " izinli" : ""}`}
        menuSinifi="kisi-karti"
        katman
        ikon={
          <>
            <Avatar kisi={kisi} boy="kucuk" />
            <bdi>{adi}</bdi>
            {ek}
          </>
        }
      >
        <div className="kisi-karti-bas">
          <Avatar kisi={kisi} />
          <div>
            <b>
              <bdi>{adi}</bdi>
            </b>
            {latin && <small dir="ltr">{latin}</small>}
            <small>
              {[kisi.sehir && sehirAdi(kisi.sehir), disMuhabirMi(kisi) ? gorevAdi(kisi.gorev) : birimAdi(kisi.birim)].filter(Boolean).join(" · ")}
            </small>
          </div>
        </div>
        <div className="kisi-karti-satir">
          <span className={`durum-hap kd-${durum}`} data-kisi-durum={durum}>
            {t(KISI_DURUM_ADI[durum])}
          </span>
          <span className="sonuk">{t("kcAcikIsler", { o: oz.oneri, t: oz.takip, p: oz.paket })}</span>
        </div>
        <div className="kisi-karti-eylem" onClick={(e) => e.stopPropagation()}>
          <KisiIletisim ben={ben} kisi={kisi} konu={konu} onPosta={() => setPosta(true)} />
        </div>
      </IslemMenusu>
      {posta && <IsPostasiPenceresi ben={ben} kisi={kisi} konu={konu} kapat={() => setPosta(false)} />}
    </span>
  );
}
