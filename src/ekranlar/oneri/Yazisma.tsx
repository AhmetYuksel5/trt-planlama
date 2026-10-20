import { Lightbulb, MessageSquare, Send } from "lucide-react";
import { AnmaGirdisi } from "../../bilesenler/Anma";
import { useState } from "react";
import { Avatar, Bos, Icerik, Kart, NotKutu, Pencere, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { OneriDurumRozeti } from "../../bilesenler/Tablolar";
import { metin, saatYaz, tarihYaz, useDil } from "../../dil";
import { muhabireOneriGonder, oneriMesajiGonder, ulkesi } from "../../eylemler";
import { ICERIK_TURLERI, kisiBul, useVeri, type Bicim, type IcerikTuru, type Kisi, type Oneri, type Takip } from "../../veri";
import { TUR_ADI } from "../../etiketler";
import { bugun, gunEkle, yerelGun } from "../../tarih";
import { oneriYazisabilir } from "../../yetki";
import { BicimSecici, MuhabirSecici } from "../nextday/Formlar";

/**
 * Önerinin yazışması: muhabir ile Planlama arasında, önerinin kendi
 * sayfasında. Her önerinin yazışması ayrı; konu karışmıyor, e-posta
 * zincirinde kaybolmuyor. Mesaj ayrı kayıt (veri.ts → Mesaj).
 */
export function OneriYazismasi({ ben, oneri, kart = true }: { ben: Kisi; oneri: Oneri; kart?: boolean }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [yazi, setYazi] = useState("");
  const mesajlar = v.mesajlar.filter((m) => m.oneriId === oneri.id).sort((a, b) => a.zaman.localeCompare(b.zaman));
  const yazabilir = oneriYazisabilir(ben, oneri);
  if (!oneri.muhabirId) return null;
  const gonder = () => {
    if (oneriMesajiGonder(ben, oneri.id, yazi)) setYazi("");
  };
  const govde = (
    <div className="yazisma" data-yazisma={oneri.id}>
      {mesajlar.length === 0 ? (
        <Bos kucuk metin={t("mesajYok")} />
      ) : (
        <ol className="mesajlar">
          {mesajlar.map((m) => {
            const k = kisiBul(v, m.kisiId);
            return (
              <li key={m.id} className={m.kisiId === ben.id ? "benim" : ""} data-mesaj>
                <Avatar kisi={k} boy="kucuk" />
                <div>
                  <small>
                    <b>{ad(k)}</b> · {tarihYaz(yerelGun(m.zaman), dil, "kisa")} {saatYaz(m.zaman, dil)}
                  </small>
                  <p dir="auto">{m.metin}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {yazabilir && (
        <div className="mesaj-yaz">
          <AnmaGirdisi
            cokSatir
            rows={2}
            deger={yazi}
            aria-label={t("mesaj")}
            degistir={setYazi}
            onKeyDown={(e) => {
              // Ctrl/⌘+Enter gönderir; düz Enter satır açar (Arapça uzun yazışma).
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) gonder();
            }}
            data-mesaj-yazi
          />
          <button type="button" className="dugme" disabled={!yazi.trim()} onClick={gonder} data-mesaj-gonder>
            <Send size={15} className="yon" /> {t("gonder")}
          </button>
        </div>
      )}
    </div>
  );
  return kart ? (
    <Kart baslik={t("yazisma")} ikon={<MessageSquare size={18} />} ek={String(mesajlar.length)}>
      {govde}
    </Kart>
  ) : (
    govde
  );
}

/*
 * Muhabire gelen teklif: muhabir reddedemez, kararı planlamacı yazışmadan
 * sonra veriyor. Muhabire yalnız kimin önerdiği görünüyor.
 */
export function TeklifNotu({ ben, oneri }: { ben: Kisi; oneri: Oneri }) {
  const { t, ad } = useDil();
  const v = useVeri();
  if (oneri.durum !== "teklif" || oneri.muhabirId !== ben.id) return null;
  return (
    <div className="duzeltme-istegi" data-teklif>
      <NotKutu ton="uyari" ikon={<Lightbulb size={16} />}>
        <b>{t("teklifGeldi", { kisi: ad(kisiBul(v, oneri.giren)) })}</b>
      </NotKutu>
    </div>
  );
}

/**
 * Muhabire haber önerme formu: muhabir sabitse (profil sayfası) seçici
 * yok. Hedef gün varsayılan yarın, Next Day'in günü.
 */
export function MuhabireOneriPenceresi({ ben, muhabirId, takip, kapat }: { ben: Kisi; muhabirId?: string; takip?: Takip; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  // Takipten işe dönüştürülüyorsa muhabir, konu ve gün takipten; Planlama yalnız haber türünü ve paketi belirliyor.
  const sabit = takip?.muhabirId ?? muhabirId;
  const [f, setF] = useState({
    muhabirId: sabit ?? "",
    haberBasligi: takip?.konu ?? "",
    gelisme: takip?.aciklama ?? takip?.konu ?? "",
    paketBasligi: "",
    tur: "haber" as IcerikTuru,
    bicim: "pkg" as Bicim,
    sahaGerekli: true,
    hedefTarih: takip?.tarih && takip.tarih > bugun() ? takip.tarih : gunEkle(bugun(), 1),
  });
  const muhabir = kisiBul(v, f.muhabirId);
  const hazir = !!muhabir && !!f.haberBasligi.trim() && !!f.gelisme.trim();
  const gonder = () => {
    if (!muhabir) return;
    const id = muhabireOneriGonder(ben, { ...f, ulke: ulkesi(muhabir.sehir), takipId: takip?.id });
    if (id) {
      bildir(t("muhabireOnerildi"));
      kapat();
    }
  };
  return (
    <Pencere
      baslik={t("muhabireHaberOner")}
      kapat={kapat}
      altBilgi={
        <button className="dugme" disabled={!hazir} onClick={gonder} data-muhabire-gonder>
          <Send size={15} className="yon" /> {t("gonder")}
        </button>
      }
    >
      <div className="form">
        <div className="satir">
          {!sabit && (
            <label>
              {t("muhabir")}
              <MuhabirSecici deger={f.muhabirId} degistir={(id) => setF({ ...f, muhabirId: id })} ic={false} />
            </label>
          )}
          <label>
            {t("hedefPlan")}
            <input type="date" value={f.hedefTarih} min={bugun()} onChange={(e) => setF({ ...f, hedefTarih: e.target.value })} />
          </label>
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
        <label>
          {t("haberBasligi")}
          <input {...icerikAlani} value={f.haberBasligi} onChange={(e) => setF({ ...f, haberBasligi: e.target.value })} placeholder={metin("haberBasligiIpucu", "ar")} data-muhabire-baslik />
        </label>
        <label>
          {t("gelismeAciklama")}
          <textarea {...icerikAlani} value={f.gelisme} onChange={(e) => setF({ ...f, gelisme: e.target.value })} placeholder={metin("gelismeIpucu", "ar")} data-muhabire-gelisme />
        </label>
        <label>
          {t("onerilenPaketBasligi")} <span className="ipucu">{t("varsa")}</span>
          <input {...icerikAlani} value={f.paketBasligi} onChange={(e) => setF({ ...f, paketBasligi: e.target.value })} />
        </label>
        <label className="secim">
          <input type="checkbox" checked={f.sahaGerekli} onChange={(e) => setF({ ...f, sahaGerekli: e.target.checked })} />
          {t("sahaGerekli")}
        </label>
      </div>
    </Pencere>
  );
}

/**
 * Profil sayfasında muhabire önerilen haberler: öneriler sayfasını
 * görmeyen birim de (yöneticinin izin verdiği) kendi önerisini ve
 * yazışmasını buradan izliyor.
 */
export function MuhabireOnerilenler({ ben, kisi }: { ben: Kisi; kisi: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState<string | null>(null);
  const liste = v.oneriler.filter((o) => o.yon === "muhabire" && o.muhabirId === kisi.id).sort((a, b) => b.zaman.localeCompare(a.zaman));
  if (!liste.length) return null;
  const secili = liste.find((o) => o.id === acik);
  return (
    <Kart baslik={t("onerilenHaberler")} ek={String(liste.length)}>
      <ul className="liste" data-onerilenler>
        {liste.map((o) => (
          <li key={o.id}>
            <div className="ad">
              <button type="button" className="bag-dugme" onClick={() => setAcik(o.id)} data-onerilen={o.id}>
                <Icerik>{o.haberBasligi}</Icerik>
              </button>
              <small className="sonuk">
                {tarihYaz(yerelGun(o.zaman), dil, "kisa")} · {v.mesajlar.filter((m) => m.oneriId === o.id).length} <MessageSquare size={12} />
              </small>
            </div>
            <OneriDurumRozeti oneri={o} />
          </li>
        ))}
      </ul>
      {secili && (
        <Pencere baslik={<Icerik>{secili.haberBasligi}</Icerik>} alt={<OneriDurumRozeti oneri={secili} />} kapat={() => setAcik(null)}>
          <div className="metin-kutu">
            <Icerik blok>{secili.gelisme}</Icerik>
          </div>
          {secili.gerekce && (
            <NotKutu ton="uyari">
              <span dir="auto">{secili.gerekce}</span>
            </NotKutu>
          )}
          <div className="ara-ust-2">
            <div className="alan-etiket">{t("yazisma")}</div>
            <OneriYazismasi ben={ben} oneri={secili} kart={false} />
          </div>
        </Pencere>
      )}
    </Kart>
  );
}
