import { CircleCheck, Mail, MailCheck } from "lucide-react";
import { useState } from "react";
import { Pencere, Rozet, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { saatYaz, tarihYaz, useDil } from "../../dil";
import { geriBildirimKaydet, takipTamamla } from "../../eylemler";
import { geriBildirimAyari, geriBildirimEpostasi, kararSablonu, sablonDoldur, sablonlar } from "../../geriBildirim";
import { yerelGun } from "../../tarih";
import { kisiBul, useVeri, type Kisi, type Oneri } from "../../veri";
import { geriBildirimGonderebilir, takipTamamlayabilir } from "../../yetki";
import { GonderDugmeleri } from "./Eposta";

/*
 * Önerinin değerlendirmesindeki geri bildirim: Planlama kararı verdikten
 * sonra muhabire şablondan e-posta (Outlook taslağı ya da telefonda posta
 * uygulaması). Deneme sürecinde "takip edilsin" denen haber muhabirin
 * işlerinde takipte; muhabir ya da Planlama bitince "tamamlandı" diyor.
 */
export function GeriBildirimBolumu({ ben, oneri: o }: { ben: Kisi; oneri: Oneri }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const [ac, setAc] = useState(false);
  const gonderir = geriBildirimGonderebilir(ben, o);
  if (!gonderir && !o.geriBildirim && !o.takip && !o.geriDonus) return null;
  const zaman = (z: string) => `${tarihYaz(yerelGun(z), dil, "kisa")} ${saatYaz(z, dil)}`;
  return (
    <div className="geri-bildirim ara-ust-2" data-geri-bildirim>
      <div className="dugmeler">
        {o.geriBildirim ? (
          <Rozet ton="iyi">
            <MailCheck size={13} /> {t("gbGonderildi", { zaman: zaman(o.geriBildirim.zaman) })}
          </Rozet>
        ) : (
          o.geriDonus && <Rozet ton="iyi">{t("geriDonusYapildi")}</Rozet>
        )}
        {o.takip === "acik" && (
          <span data-takip-durumu="acik">
            <Rozet ton="vurgu">{t("gbTakipte")}</Rozet>
          </span>
        )}
        {o.takip === "tamamlandi" && (
          <span data-takip-durumu="tamamlandi">
            <Rozet ton="iyi">
              <CircleCheck size={13} /> {t("gbTamamlandi")}
              {o.takipBitis && ` · ${zaman(o.takipBitis)}`}
              {o.takipBitiren && ` · ${ad(kisiBul(v, o.takipBitiren))}`}
            </Rozet>
          </span>
        )}
        <span className="bosluk-esnek" />
        {gonderir && (
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setAc(true)} data-geri-bildirim-ac>
            <Mail size={14} /> {t(o.geriBildirim ? "gbYenidenGonder" : "gbGonder")}
          </button>
        )}
        {takipTamamlayabilir(ben, o) && (
          <button type="button" className="dugme dugme-iyi dugme-kucuk" onClick={() => takipTamamla(ben, o.id) && bildir(t("gbTamamlandiBildir"))} data-takip-tamamla>
            <CircleCheck size={14} /> {t("gbTamamlandiIsaretle")}
          </button>
        )}
      </div>
      {ac && <GeriBildirimPenceresi ben={ben} oneri={o} kapat={() => setAc(false)} />}
    </div>
  );
}

function GeriBildirimPenceresi({ ben, oneri: o, kapat }: { ben: Kisi; oneri: Oneri; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const liste = sablonlar(v);
  const ayar = geriBildirimAyari(v);
  const ilk = kararSablonu(v, o);
  const [sablonId, setSablonId] = useState(ilk?.id ?? "");
  const sablon = liste.find((s) => s.id === sablonId) ?? ilk;
  const [not, setNot] = useState("");
  // Takip karardan bağımsız seçenek: onaylananda işaretli gelir, öbüründe istenirse.
  const [takip, setTakip] = useState(o.durum === "planaEklendi" && o.takip !== "tamamlandi");
  const [duzen, setDuzen] = useState<{ konu: string; govde: string; cc: string; bcc: string } | null>(null);
  if (!sablon) return null;
  // Şablon seçildikçe metin şablondan; kişi elle değiştirirse o kalıyor (not alanı yine altta ekleniyor).
  const konu = duzen?.konu ?? sablonDoldur(sablon.konu, v, o);
  const govde = duzen?.govde ?? sablonDoldur(sablon.govde, v, o, not);
  const cc = duzen?.cc ?? sablon.cc;
  const bcc = duzen?.bcc ?? sablon.bcc;
  const eposta = { ...geriBildirimEpostasi({ ...sablon, cc, bcc }, v, o, not), konu, govde };
  const muhabir = kisiBul(v, o.muhabirId);
  const degistir = (k: "konu" | "govde" | "cc" | "bcc", x: string) => setDuzen({ konu, govde, cc, bcc, [k]: x });
  const kaydet = () => {
    if (geriBildirimKaydet(ben, o.id, { sablonId: sablon.id, takip })) {
      bildir(t("gbKaydedildi"));
      kapat();
    }
  };
  return (
    <Pencere baslik={t("gbGonder")} alt={muhabir?.eposta || t("gbEpostaYok")} kapat={kapat}>
      <div className="form" data-geri-bildirim-formu>
        <label>
          {t("gbSablon")}
          <select
            value={sablon.id}
            onChange={(e) => {
              setSablonId(e.target.value);
              setDuzen(null);
            }}
            data-gb-sablon
          >
            {liste.map((s) => (
              <option key={s.id} value={s.id}>
                {s.ad}
              </option>
            ))}
          </select>
        </label>
        <div className="satir">
          <label>
            {t("gbCc")}
            <input dir="ltr" value={cc} onChange={(e) => degistir("cc", e.target.value)} data-gb-cc />
          </label>
          <label>
            {t("gbBcc")}
            <input dir="ltr" value={bcc} onChange={(e) => degistir("bcc", e.target.value)} data-gb-bcc />
          </label>
        </div>
        <label>
          {t("gbKonu")}
          <input {...icerikAlani} value={konu} onChange={(e) => degistir("konu", e.target.value)} data-gb-konu />
        </label>
        <label>
          {t("gbMetin")}
          <textarea {...icerikAlani} rows={8} value={govde} onChange={(e) => degistir("govde", e.target.value)} data-gb-metin />
        </label>
        {!duzen && (
          <label>
            {t("gbNot")}
            <textarea dir="auto" rows={2} value={not} onChange={(e) => setNot(e.target.value)} data-gb-not />
          </label>
        )}
        {ayar.epostaIleTakip && o.takip !== "tamamlandi" && (
          <label className="secim">
            <input type="checkbox" checked={takip} onChange={(e) => setTakip(e.target.checked)} data-gb-takip />
            {t("gbTakipSorusu")}
          </label>
        )}
        <GonderDugmeleri eposta={eposta} dosyaAdi={`geri-bildirim-${o.id}.eml`} once={kaydet} />
      </div>
    </Pencere>
  );
}
