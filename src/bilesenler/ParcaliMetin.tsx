import { CircleCheck, Plus, Send, Undo2 } from "lucide-react";
import { useState } from "react";
import { parcalarHazir } from "../akis";
import { metin as dilMetni, useDil, type Anahtar } from "../dil";
import { adimIlerle, parcaDuzelt, parcaGonder, parcaIade, parcaSonHal } from "../eylemler";
import type { Kisi, MetinParcasi, Paket } from "../veri";
import { parcaYapabilir } from "../yetki";
import { birimAdi } from "../yapi";
import { URETIM_PARCALARI, PARCA_ADI } from "../uretim";
import { Icerik, Kart, NotKutu, Rozet, bildir, icerikAlani } from "./Parcalar";

const ASAMA_ROZETI: Record<MetinParcasi["asama"], [Anahtar, string]> = {
  muhabir: ["pa_muhabir", "uyari"],
  newsdesk: ["pa_newsdesk", ""],
  dil: ["pa_dil", ""],
  tamam: ["pa_tamam", "iyi"],
};

/* Balonla yürüyen pakette editoryal kontrol ve dil denetimi seçilen masada: rozet aşamayı ve masayı söyler. */
const rozetAdi = (t: ReturnType<typeof useDil>["t"], paket: Paket, asama: MetinParcasi["asama"], ad: Anahtar) =>
  paket.uretim && (asama === "newsdesk" || asama === "dil")
    ? `${t(asama === "newsdesk" ? "urEditoryal" : "urDil")} · ${birimAdi(asama === "newsdesk" ? paket.uretim.yol.editoryal : paket.uretim.yol.dil)}`
    : t(ad);

/*
 * Parçalı metin durağı: parçaların hepsi herkese görünür (kayıtlı süreç);
 * düğme yalnız parçanın sırası gelen elde. Muhabir parça ekler ve iade
 * edileni yeniden gönderir; bütün parçalar Script Editor'den dönünce video
 * bağlantısını gönderir.
 */
export function ParcaliMetin({ ben, paket }: { ben: Kisi; paket: Paket }) {
  const { t } = useDil();
  const parcalar = paket.parcalar ?? [];
  const muhabir = parcaYapabilir(ben, paket, "muhabir");
  const [yeni, setYeni] = useState(false);
  const [video, setVideo] = useState(paket.video ?? "");
  const hazir = parcalarHazir(paket);
  return (
    <Kart baslik={t("parcalar")}>
      <div className="form" data-parcali-metin>
        {paket.videoIade && muhabir && <NotKutu>{paket.videoIade}</NotKutu>}
        {parcalar.map((x) => (
          <ParcaSatiri key={x.id} ben={ben} paket={paket} parca={x} />
        ))}
        {muhabir && (yeni ? <ParcaFormu ben={ben} paket={paket} kapat={() => setYeni(false)} /> : (
          <div className="dugmeler">
            <button className="dugme dugme-ikincil" onClick={() => setYeni(true)} data-parca-ekle>
              <Plus size={15} /> {t("parcaEkle")}
            </button>
          </div>
        ))}
        {muhabir && (
          <>
            <label>
              {t("videoBaglantisi")}
              <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://" dir="ltr" disabled={!hazir} data-parca-video />
            </label>
            {!hazir && <small className="sonuk-yazi">{t("videoParcaBekliyor")}</small>}
            <div className="form-alt">
              <button className="dugme" disabled={!hazir || !video.trim()} data-parca-video-gonder onClick={() => confirm(t("eminMisin")) && adimIlerle(ben, paket.id, { video }) && bildir(t("bAdimTamam"))}>
                {t("videoyuGonder")}
              </button>
            </div>
          </>
        )}
      </div>
    </Kart>
  );
}

function ParcaSatiri({ ben, paket, parca }: { ben: Kisi; paket: Paket; parca: MetinParcasi }) {
  const { t } = useDil();
  const [metin, setMetin] = useState(parca.metin);
  const [iade, setIade] = useState<string | null>(null);
  const [duzen, setDuzen] = useState(false);
  const [ad, rozet] = ASAMA_ROZETI[parca.asama];
  const elde = parca.asama !== "tamam" && parcaYapabilir(ben, paket, parca.asama);
  if (duzen) return <ParcaFormu ben={ben} paket={paket} parca={parca} kapat={() => setDuzen(false)} />;
  return (
    <div className="form-kutu form" data-parca={parca.ad} data-parca-asama={parca.asama}>
      <div className="kayit-bas">
        <b>
          <Icerik>{parca.ad}</Icerik>
        </b>
        <Rozet ton={rozet || undefined}>{rozetAdi(t, paket, parca.asama, ad)}</Rozet>
      </div>
      {parca.iade && parca.asama === "muhabir" && <NotKutu>{parca.iade}</NotKutu>}
      {elde && parca.asama !== "muhabir" ? (
        <textarea {...icerikAlani} rows={6} value={metin} onChange={(e) => setMetin(e.target.value)} aria-label={parca.ad} data-parca-alan />
      ) : (
        <div className="metin-kutu">
          <Icerik blok>{parca.metin}</Icerik>
        </div>
      )}
      {elde && parca.asama === "muhabir" && (
        <div className="form-alt">
          <button className="dugme" onClick={() => setDuzen(true)} data-parca-duzenle>
            {t("duzenle")}
          </button>
        </div>
      )}
      {elde && parca.asama === "newsdesk" && iade === null && (
        <div className="form-alt">
          <button className="dugme dugme-kotu" onClick={() => setIade("")} data-parca-iade>
            <Undo2 size={15} /> {t("parcaIadeEt")}
          </button>
          <button className="dugme dugme-iyi" disabled={!metin.trim()} onClick={() => parcaDuzelt(ben, paket.id, parca.id, metin) && bildir(t("bAdimTamam"))} data-parca-ilerlet>
            <CircleCheck size={15} /> {t("parcaDuzeltGonder")}
          </button>
        </div>
      )}
      {elde && parca.asama === "dil" && (
        <div className="form-alt">
          <button className="dugme dugme-iyi" disabled={!metin.trim()} onClick={() => confirm(t("ddGonderOnay")) && parcaSonHal(ben, paket.id, parca.id, metin) && bildir(t("ddGonderildi"))} data-parca-ilerlet>
            <Send size={15} className="yon" /> {t("ddGonder")}
          </button>
        </div>
      )}
      {iade !== null && (
        <>
          <label>
            {t("parcaIadeGerekcesi")}
            <textarea dir="auto" value={iade} onChange={(e) => setIade(e.target.value)} autoFocus data-parca-iade-gerekce />
          </label>
          <div className="form-alt">
            <button className="dugme dugme-ikincil" onClick={() => setIade(null)}>
              {t("iptal")}
            </button>
            <button className="dugme dugme-kotu" disabled={!iade.trim()} onClick={() => parcaIade(ben, paket.id, parca.id, iade) && (setIade(null), bildir(t("bGeriGonderildi")))} data-parca-iade-gonder>
              {t("parcaIadeEt")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* Muhabirin yeni ya da iade edilen parçası: ad (intro, text, PTC… şimdilik serbest) ve metin. */
function ParcaFormu({ ben, paket, parca, kapat }: { ben: Kisi; paket: Paket; parca?: MetinParcasi; kapat: () => void }) {
  const { t } = useDil();
  const [ad, setAd] = useState(parca?.ad ?? "");
  const [metin, setMetin] = useState(parca?.metin ?? "");
  const gonder = () => {
    if (!confirm(t("parcaGonderOnay"))) return;
    if (parcaGonder(ben, paket.id, { id: parca?.id, ad, metin })) {
      bildir(t("bAdimTamam"));
      kapat();
    }
  };
  return (
    <div className="form-kutu form" data-parca-formu>
      {parca?.iade && <NotKutu>{parca.iade}</NotKutu>}
      <label>
        {t("parcaAdi")}
        <input value={ad} onChange={(e) => setAd(e.target.value)} dir="auto" placeholder="INTRO" data-parca-adi />
      </label>
      {/* Balonda seçilen parçalar (metin, stand, gfx) tek dokunuşla ad olur; ad yine serbest. */}
      {paket.uretim && !parca && (
        <div className="dugmeler" data-parca-onerileri>
          {URETIM_PARCALARI.filter((x) => x === "metin" || paket.uretim!.parca[x]).map((x) => (
            <button key={x} type="button" className="dugme dugme-ikincil dugme-kucuk" aria-pressed={ad === t(PARCA_ADI[x])} onClick={() => setAd(t(PARCA_ADI[x]))}>
              {t(PARCA_ADI[x])}
            </button>
          ))}
        </div>
      )}
      <textarea {...icerikAlani} rows={6} value={metin} onChange={(e) => setMetin(e.target.value)} placeholder={dilMetni("metinIpucu", "ar")} aria-label={t("parcaAdi")} data-parca-metni />
      <div className="form-alt">
        <button className="dugme dugme-ikincil" onClick={kapat}>
          {t("iptal")}
        </button>
        <button className="dugme" disabled={!ad.trim() || !metin.trim()} onClick={gonder} data-parca-gonder>
          <Send size={15} className="yon" /> {t("parcaGonder")}
        </button>
      </div>
    </div>
  );
}
