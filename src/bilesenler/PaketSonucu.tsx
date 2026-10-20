import { CheckCircle, CircleSlash, Undo2, UserRoundCog } from "lucide-react";
import { useState } from "react";
import { useDil } from "../dil";
import { paketBaskaMuhabireVer, paketIsaretKarar, paketIsaretle } from "../eylemler";
import { MuhabirSecici } from "../ekranlar/nextday/Formlar";
import { git } from "../yol";
import { kisiBul, useVeri, type Kisi, type Paket } from "../veri";
import { baskaMuhabireVerebilir, paketIsaretOnaylayabilir, paketIsaretleyebilir } from "../yetki";
import { Icerik, Kart, Rozet, bildir } from "./Parcalar";

/*
 * Paketin sonucu: muhabir "Yapıldı" ya da sebebiyle "Yapılmadı" der, yetkili
 * onaylar ya da geri çevirir. Kritik geçiş, onay soruluyor. Muhabirin
 * işlerinde ve paket sayfasında aynı bileşen.
 */
export function PaketSonucDugmeleri({ ben, paket: p, kucuk = false }: { ben: Kisi; paket: Paket; kucuk?: boolean }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [sebep, setSebep] = useState<string | null>(null);
  const k = kucuk ? " dugme-kucuk" : "";
  if (p.isaret) {
    const i = p.isaret;
    return (
      <div className="dugmeler" data-paket-isaret={p.id}>
        <Rozet ton="uyari">
          {t("isaretOnayBekliyor")} · {t(i.tur === "yapildi" ? "yapildi" : "yapilmadi")}
        </Rozet>
        {i.sebep && (
          <span dir="auto" className="soluk">
            {ad(kisiBul(v, i.kisiId))}: {i.sebep}
          </span>
        )}
        {paketIsaretOnaylayabilir(ben) && (
          <>
            <button type="button" className={`dugme dugme-iyi${k}`} onClick={() => confirm(t("isaretOnayOnay")) && paketIsaretKarar(ben, p.id, true) && bildir(t("bKaydedildi"))} data-isaret-onayla>
              <CheckCircle size={14} /> {t("isaretOnayla")}
            </button>
            <button type="button" className={`dugme dugme-ikincil${k}`} onClick={() => confirm(t("isaretRetOnay")) && paketIsaretKarar(ben, p.id, false) && bildir(t("bKaydedildi"))} data-isaret-geri>
              <Undo2 size={14} /> {t("isaretGeriCevir")}
            </button>
          </>
        )}
      </div>
    );
  }
  if (!paketIsaretleyebilir(ben, p, v)) return null;
  if (sebep !== null)
    return (
      <div className="form form-kutu" data-yapilmadi-formu={p.id}>
        <label>
          {t("yapilmadiSebep")}
          <textarea dir="auto" rows={2} value={sebep} onChange={(e) => setSebep(e.target.value)} autoFocus data-yapilmadi-sebep />
        </label>
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setSebep(null)}>
            {t("iptal")}
          </button>
          <button
            type="button"
            className="dugme dugme-kotu dugme-kucuk"
            disabled={!sebep.trim()}
            onClick={() => confirm(t("yapilmadiOnayi")) && paketIsaretle(ben, p.id, "yapilmadi", sebep) && (setSebep(null), bildir(t("bIsaretGonderildi")))}
            data-yapilmadi-gonder
          >
            {t("yapilmadi")}
          </button>
        </div>
      </div>
    );
  return (
    <div className="dugmeler">
      <button type="button" className={`dugme dugme-iyi${k}`} onClick={() => confirm(t("yapildiOnayi")) && paketIsaretle(ben, p.id, "yapildi") && bildir(t("bIsaretGonderildi"))} data-paket-yapildi={p.id}>
        <CheckCircle size={14} /> {t("yapildi")}
      </button>
      <button type="button" className={`dugme dugme-ikincil${k}`} onClick={() => setSebep("")} data-paket-yapilmadi={p.id}>
        <CircleSlash size={14} /> {t("yapilmadi")}
      </button>
    </div>
  );
}

/*
 * Onay kuyruğu: muhabirlerin onay bekleyen "yapıldı / yapılmadı"
 * işaretleri, onaylayabilen kişinin ana sayfasının başında (düzenden
 * bağımsız, kaçırılmasın). Her satırda onay ve geri çevirme.
 */
export function OnayKuyrugu({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  if (!paketIsaretOnaylayabilir(ben)) return null;
  const liste = v.paketler.filter((p) => p.isaret).sort((a, b) => a.isaret!.zaman.localeCompare(b.isaret!.zaman));
  if (!liste.length) return null;
  return (
    <Kart baslik={t("psOnayBekleyen")} ikon={<CheckCircle size={18} />} ek={String(liste.length)}>
      <ul className="liste" data-onay-kuyrugu>
        {liste.map((p) => (
          <li key={p.id} data-kuyruk={p.id}>
            <div className="ad">
              <a href={`#/paketler/${p.id}`}>
                <Icerik blok>{p.baslik}</Icerik>
              </a>
              <small>
                {p.kod} · {ad(kisiBul(v, p.isaret!.kisiId))}
              </small>
            </div>
            <PaketSonucDugmeleri ben={ben} paket={p} kucuk />
          </li>
        ))}
      </ul>
    </Kart>
  );
}

/*
 * Onaylı paketi başka muhabire verme: muhabir seçilir, onay sorulur; paket
 * yeni muhabire teklif olarak gider, sayfa o teklife geçer.
 */
export function BaskaMuhabireVer({ ben, paket: p }: { ben: Kisi; paket: Paket }) {
  const { t } = useDil();
  const [ac, setAc] = useState(false);
  const [muhabirId, setMuhabirId] = useState("");
  if (!baskaMuhabireVerebilir(ben, p)) return null;
  const ver = () => {
    if (!confirm(t("baskaMuhabireOnay"))) return;
    const id = paketBaskaMuhabireVer(ben, p.id, muhabirId);
    if (id) {
      bildir(t("bBaskaMuhabire"));
      git(`oneriler/${id}`);
    }
  };
  return ac ? (
    <div className="form form-kutu ara-ust-2" data-baska-muhabire-formu>
      <label>
        {t("muhabir")}
        <MuhabirSecici deger={muhabirId} degistir={setMuhabirId} bosEtiket="—" ic={false} />
      </label>
      <div className="form-alt">
        <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setAc(false)}>
          {t("iptal")}
        </button>
        <button type="button" className="dugme dugme-kucuk" disabled={!muhabirId || muhabirId === p.muhabirId} onClick={ver} data-baska-muhabire-gonder>
          {t("baskaMuhabireVer")}
        </button>
      </div>
    </div>
  ) : (
    <div className="dugmeler ara-ust-2">
      <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setAc(true)} data-baska-muhabire>
        <UserRoundCog size={14} /> {t("baskaMuhabireVer")}
      </button>
    </div>
  );
}
