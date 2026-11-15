import { KisiCipi } from "../bilesenler/KisiCipi";
import { HarekeliMetin } from "../bilesenler/Hareke";
import { TarihSaatGirdisi } from "../bilesenler/TarihSaat";
import { birimAdi } from "../yapi";
import { GeriBag } from "../bilesenler/GeriBag";
import { AnmaGirdisi } from "../bilesenler/Anma";
import { Ban, ChevronDown, CircleCheck, Hourglass, Undo2, Workflow } from "lucide-react";
import { useState } from "react";
import { adimAdi, adimTuru, parcaliMi, geriHedefi, geciktiMi, paketSahibi } from "../akis";
import { HareketGecmisi } from "../bilesenler/Hareket";
import { ParcaliMetin } from "../bilesenler/ParcaliMetin";
import { BicimRozeti, Bos, HaftalikRozeti, Icerik, Kart, NotKutu, OncelikRozeti, PaketDurumRozeti, Rozet, TurRozeti, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { PaketSonucDugmeleri } from "../bilesenler/PaketSonucu";
import { YoneticiKarti } from "../bilesenler/Yonetici";
import { metin as dilMetni, tarihYaz, useDil } from "../dil";
import { adimIlerle, geriGonder, paketDurum, paketReddet, paketTamamla } from "../eylemler";
import { sartliBekleyen } from "../haftalik";

import { bugun, girdidenIso, yerelGirdi, yerelGun } from "../tarih";
import { kisiBul, oneriBul, planBul, useVeri, type Kisi, type Paket } from "../veri";
import { adimYapabilir, masaYayinKarariVerebilir, paketIsaretOnaylayabilir, paketIsaretleyebilir, paketTamamlayabilir, tamamlamaGeriAlabilir, uretimYoluBelirleyebilir, yapabilir } from "../yetki";
import { UretimBalonuDugmesi } from "../bilesenler/UretimBalonu";
import { gfxBekliyor } from "../uretim";
import { TamamlamaGeriAlDugmesi, tamamlandiBildir } from "../bilesenler/TamamlamaGeriAl";
import { MuhabirSecici } from "./nextday/Formlar";
import { GorevKunyesi } from "../bilesenler/PaketGorevi";
import { AsamaKutulari } from "../bilesenler/AsamaKutulari";
import { MasrafKarti, PaketMetniKarti } from "../bilesenler/PaketMetni";
import { BitmisPaketSeridi } from "../bilesenler/BitmisPaket";
import { bitmisMi } from "../bitmisPaket";

/**
 * Paket detayı: ortak kaydın kendisi (rapor bölüm 7).
 *
 * Bir haberin nerede beklediği, en son kimin işlem yaptığı, hangi
 * birimden hangisine devredildiği ve bütün geçmişi tek sayfada. Eylem
 * kartı yalnız o adımın sahibine görünüyor; diğerleri okuyor. Ücret alan
 * bazlı yetkiyle: kaydı görmek ücreti görmek demek değil.
 */
export default function PaketDetay({ ben, paket, kutu }: { ben: Kisi; paket: Paket; kutu?: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const oneri = oneriBul(v, paket.oneriId);
  const muhabir = kisiBul(v, paket.muhabirId);
  const hareketler = v.hareketler.filter((h) => h.paketId === paket.id || (oneri && h.oneriId === oneri.id));

  return (
    <>
      <GeriBag href="#/paketler" metin={t(ben.birim === "muhabir" ? "mPaketlerim" : "mPaketler")} />
      <header className="sayfa-basi">
        <span className="ikon-kutu">
          <Workflow size={26} />
        </span>
        <div>
          <h1>
            <Icerik>{paket.baslik}</Icerik>
          </h1>
          <p>
            {paket.kod} · <TurRozeti tur={paket.tur} /> {paket.bicim && <BicimRozeti bicim={paket.bicim} />} <PaketDurumRozeti paket={paket} />{" "}
            {geciktiMi(paket) && <Rozet ton="kotu">{t("gecikti")}</Rozet>} {paket.oncelikli && <OncelikRozeti />} {paket.haftalikKalemId && <HaftalikRozeti />}
          </p>
          {/* Muhabir yalnız adıyla; basınca iletişim kartı (ayrı bilgi kartı kalktı). */}
          {muhabir && (
            <p className="paket-muhabir">
              <KisiCipi ben={ben} kisi={muhabir} konu={paket.baslik} />
            </p>
          )}
          <GorevKunyesi p={paket} />
          <OzelBag paket={paket} />
        </div>
      </header>
      {/* Haftalıkta şartlı kabul: muhabire ön bilgi, Planlama'ya bekleyen karar. Kabul ya da retle konu kapanıyor. */}
      {sartliBekleyen(paket) && (
        <NotKutu>
          <span data-paket-kosul>
            <b>{t("krSartli")}:</b> <span dir="auto">{paket.kosul}</span>
            {paket.kosulSon && <span className={paket.kosulSon < bugun() ? "kotu-yazi" : "sonuk"}> · {t("kosulSonKisa", { gun: tarihYaz(paket.kosulSon, dil, "kisa") })}</span>}
          </span>
        </NotKutu>
      )}

      {/* Biten paket: aşama kutuları yerine yapım aşamalarının ince özeti; kalan işlem (geri alma, masa kararı) altında. */}
      {bitmisMi(paket) ? (
        <>
          <BitmisPaketSeridi ben={ben} paket={paket} sayfada />
          <EylemKarti ben={ben} paket={paket} />
        </>
      ) : (
        <AsamaKutulari ben={ben} paket={paket} kutu={kutu} eylem={<EylemKarti ben={ben} paket={paket} />} />
      )}

      {/*
        Kullanıcı: tamamlanan paketin sayfasında koordinasyon notları, muhabirin bilgileri, önerinin özeti
        gereksiz; metnin kendisi sırasıyla, künye, video ve ek masraf yeter. Geçmiş katlı.
      */}
      <YoneticiKarti ben={ben} paket={paket} />
      <PaketMetniKarti paket={paket} />
      <MasrafKarti ben={ben} paket={paket} />
      <details className="kart katlanir" data-paket-gecmis>
        <summary className="kart-bas">
          <h2>{t("hareketGecmisi")}</h2>
          <span className="ek">{hareketler.length}</span>
          <ChevronDown size={18} className="katlanir-ok" aria-hidden="true" />
        </summary>
        <div className="katlanir-govde">{hareketler.length ? <HareketGecmisi hareketler={hareketler} d={v} /> : <Bos kucuk metin={t("kayitYok")} />}</div>
      </details>
    </>
  );
}

/** Adımın sahibine görünen eylem; her adım yalnız kendi bilgisini istiyor. */
function EylemKarti({ ben, paket }: { ben: Kisi; paket: Paket }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [muhabirId, setMuhabirId] = useState(paket.muhabirId ?? "");
  const [teslim, setTeslim] = useState(yerelGirdi(paket.teslim));
  const [metin, setMetin] = useState(paket.metin ?? "");
  const [video, setVideo] = useState(paket.video ?? "");
  const [klip, setKlip] = useState(paket.klipKodu ?? `TRTA_${(plan(v, paket) ?? "").slice(2).replace(/-/g, "")}_${String(v.sayac % 1000).padStart(3, "0")}`);
  const [kod, setKod] = useState(paket.klipKodu ?? "");
  const [gerekce, setGerekce] = useState<string | null>(null);
  const [not, setNot] = useState("");

  const ilerle = (g: Parameters<typeof adimIlerle>[2]) => {
    if (adimIlerle(ben, paket.id, g)) bildir(t("bAdimTamam"));
  };

  // Yanlışlıkla kapatılan haber buradan yeniden açılıyor.
  if (tamamlamaGeriAlabilir(ben, v, paket)) {
    return (
      <Kart baslik={t("seninIslemin")}>
        <div className="dugmeler">
          <TamamlamaGeriAlDugmesi ben={ben} paket={paket} />
        </div>
      </Kart>
    );
  }

  // Newsdesk yokken onaylı paketin sonucu muhabirden (hesapsızsa Planlama onun adına): yapıldı ya da yapılmadı, yetkili onaylıyor.
  // Masanın takibindeki pakette yayın kararı masada (Yayınlandı / Yayınlanmadı).
  if (
    !paket.ozelId &&
    (masaYayinKarariVerebilir(ben, paket) ||
      (((paket.isaret && paket.durum === "onaylandi") || paketIsaretleyebilir(ben, paket, v)) && (paketTamamlayabilir(ben, paket, v) || paketIsaretOnaylayabilir(ben, paket))))
  ) {
    return (
      <Kart baslik={t("seninIslemin")}>
        <PaketSonucDugmeleri ben={ben} paket={paket} />
        {/* Onaylı paketin üretimi balonla da başlatılabilir (Newsdesk sistemde olsun olmasın; uretim.ts). */}
        {uretimYoluBelirleyebilir(ben, paket) && (
          <div className="dugmeler ara-ust-2">
            <UretimBalonuDugmesi ben={ben} paket={paket} />
          </div>
        )}
      </Kart>
    );
  }
  if (paketTamamlayabilir(ben, paket, v)) {
    return (
      <Kart baslik={t("seninIslemin")}>
        <div className="dugmeler">
          <button className="dugme dugme-iyi" onClick={() => paketTamamla(ben, paket.id) && tamamlandiBildir(ben, t("bPaketTamamlandi"), { paketId: paket.id })} data-paket-tamamla={paket.id}>
            {/* Muhabir kendi işini söylüyor; Planlama onun adına işaretliyor. */}
            <CircleCheck size={15} /> {t(ben.id === paket.muhabirId ? "haberTamamlandi" : "haberTeslimEdildi")}
          </button>
          <UretimBalonuDugmesi ben={ben} paket={paket} />
        </div>
      </Kart>
    );
  }

  if (paket.durum === "onaylandi" && uretimYoluBelirleyebilir(ben, paket)) {
    return (
      <Kart baslik={t("seninIslemin")}>
        <div className="dugmeler">
          <UretimBalonuDugmesi ben={ben} paket={paket} />
        </div>
      </Kart>
    );
  }

  if (paket.durum !== "uretimde") {
    // Özel yayın paketinin onayı planın onayıyla, özel yayın sayfasında (ozOnay).
    if (paket.ozelId || !yapabilir(ben, "paketDegerlendir") || ["tamamlandi", "iptal", "onaylandi"].includes(paket.durum)) return null;
    return (
      <Kart baslik={t("seninIslemin")}>
        <div className="dugmeler">
          {paket.durum === "taslak" && (
            <button className="dugme dugme-ikincil" onClick={() => paketDurum(ben, paket.id, "degerlendiriliyor")}>
              <Hourglass size={15} /> {t("degerlendirmeyeAl")}
            </button>
          )}
          <button className="dugme dugme-iyi" onClick={() => confirm(t("paketKabulOnay")) && paketDurum(ben, paket.id, "onaylandi")} data-paket-kabul>
            <CircleCheck size={15} /> {t("kabulEt")}
          </button>
          <button className="dugme dugme-kotu" onClick={() => confirm(t("paketRetOnay")) && paketReddet(ben, paket.id)} data-paket-reddet>
            <Ban size={15} /> {t("reddet")}
          </button>
        </div>
      </Kart>
    );
  }

  // Parçalı metinde iş parça başına el değiştiriyor; kartı herkes görür, düğme sırası gelende.
  if (adimTuru(paket) === "metin" && parcaliMi(paket)) return <ParcaliMetin ben={ben} paket={paket} />;

  if (!adimYapabilir(ben, paket)) {
    const sahip = paketSahibi(paket);
    return (
      <NotKutu>
        {t("baskaBirimde", { birim: sahip ? birimAdi(sahip) : "", adim: adimAdi(paket.adim, paket) })}
      </NotKutu>
    );
  }

  // Form durağın türünden; yöneticinin eklediği genel durak "Tamamla ve geç".
  const adim = adimTuru(paket) ?? "is";
  const geriGonderebilir = !!geriHedefi(paket);
  return (
    <Kart baslik={`${t("seninSiran")}: ${adimAdi(paket.adim, paket)}`}>
      <div className="form">
        {adim === "gorevlendirme" && (
          <>
            <label>
              {t("sahaMuhabiri")}
              <MuhabirSecici deger={muhabirId} degistir={setMuhabirId} />
            </label>
            <div className="form-alt">
              <button className="dugme" disabled={!muhabirId} onClick={() => ilerle({ muhabirId })}>
                {t("gorevlendir")}
              </button>
            </div>
          </>
        )}
        {adim === "newsdesk" && (
          <>
            <div className="satir">
              <label>
                {t("muhabir")}
                <MuhabirSecici deger={muhabirId} degistir={setMuhabirId} />
              </label>
              <label>
                {t("teslim")}
                <TarihSaatGirdisi value={teslim} onChange={(e) => setTeslim(e.target.value)} />
              </label>
            </div>
            <div className="form-alt">
              <button className="dugme" disabled={!muhabirId} onClick={() => ilerle({ muhabirId, teslim: girdidenIso(teslim) })} data-durak-gorev>
                {t("muhabireGorevVer")}
              </button>
            </div>
          </>
        )}
        {adim === "metin" && (
          <>
            <textarea {...icerikAlani} value={metin} onChange={(e) => setMetin(e.target.value)} rows={8} placeholder={dilMetni("metinIpucu", "ar")} />
            <div className="form-alt">
              <button className="dugme" disabled={!metin.trim()} onClick={() => ilerle({ metin })}>
                {t("metniGonder")}
              </button>
            </div>
          </>
        )}
        {adim === "is" && (
          <>
            <AnmaGirdisi cokSatir rows={3} deger={not} degistir={setNot} aria-label={t("not")} data-durak-notu />
            <div className="form-alt">
              {geriGonderebilir && gerekce === null && (
                <button className="dugme dugme-kotu" onClick={() => setGerekce("")} data-durak-geri>
                  <Undo2 size={15} /> {t("geriGonder")}
                </button>
              )}
              <button className="dugme dugme-iyi" onClick={() => ilerle({ not })} data-durak-tamamla>
                <CircleCheck size={15} /> {t("tamamlaVeGec")}
              </button>
            </div>
          </>
        )}
        {(adim === "kontrol" || adim === "dil") && (
          <>
            {paket.metin && (
              <div className="metin-kutu">
                <Icerik blok>
                  <HarekeliMetin metin={paket.metin} />
                </Icerik>
              </div>
            )}
            <div className="form-alt">
              {geriGonderebilir && gerekce === null && (
                <button className="dugme dugme-kotu" onClick={() => setGerekce("")}>
                  <Undo2 size={15} /> {t("duzeltmeyeGeriGonder")}
                </button>
              )}
              <button className="dugme dugme-iyi" onClick={() => ilerle({})}>
                <CircleCheck size={15} /> {t(adim === "kontrol" ? "kontrolEdildi" : "sonScriptGonder")}
              </button>
            </div>
          </>
        )}
        {adim === "video" && (
          <>
            <label>
              {t("videoBaglantisi")}
              <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://" dir="ltr" />
            </label>
            <div className="form-alt">
              <button className="dugme" disabled={!video.trim()} onClick={() => ilerle({ video })}>
                {t("videoyuGonder")}
              </button>
            </div>
          </>
        )}
        {adim === "iletim" && (
          <>
            <div className="form-alt">
              <button className="dugme" onClick={() => ilerle({})}>
                {t("mediayaIlet")}
              </button>
            </div>
          </>
        )}
        {adim === "media" && (
          <>
            <label>
              {t("klipKodu")}
              <input value={klip} onChange={(e) => setKlip(e.target.value.toUpperCase())} dir="ltr" />
            </label>
            <div className="form-alt">
              <button className="dugme" disabled={!klip.trim()} onClick={() => ilerle({ klipKodu: klip })}>
                {t("yuklendiKlipGonder")}
              </button>
            </div>
          </>
        )}
        {adim === "videoKontrol" && (
          <>
            {/* Bağlantı kutunun başında (AsamaKutulari); kontrol eden metni videoyla karşılaştırsın diye katlı. */}
            {paket.metin && (
              <details className="video-metin" data-video-metin>
                <summary>{t("metin")}</summary>
                <div className="metin-kutu">
                  <Icerik blok>
                    <HarekeliMetin metin={paket.metin} />
                  </Icerik>
                </div>
              </details>
            )}
            {geriHedefi(paket) && <small className="sonuk-yazi">{t("iadeDonecek", { adim: adimAdi(geriHedefi(paket)!, paket) })}</small>}
            <div className="form-alt">
              {gerekce === null && (
                <button className="dugme dugme-kotu" onClick={() => setGerekce("")} data-video-revizyon>
                  <Undo2 size={15} /> {t("revizyonaGonder")}
                </button>
              )}
              <button className="dugme dugme-iyi" onClick={() => ilerle({})} data-video-onayla>
                <CircleCheck size={15} /> {t("videoOnayla")}
              </button>
            </div>
          </>
        )}
        {adim === "inews" && (
          <>
            {/* Yeni yolda sisteme yükleme; kod şimdilik isteğe bağlı. */}
            {!paket.stok && (
              <label>
                {t("sistemKodu")}
                <input value={kod} onChange={(e) => setKod(e.target.value.toUpperCase())} dir="ltr" data-sistem-kodu />
              </label>
            )}
            <div className="form-alt">
              {/* Gfx'li pakette yükleme grafiği bekliyor (montajda ekleniyor). */}
              <button className="dugme dugme-iyi" disabled={gfxBekliyor(paket)} title={gfxBekliyor(paket) ? t("urGfxBekleniyor") : undefined} onClick={() => ilerle(paket.stok ? {} : { klipKodu: kod.trim() || undefined })} data-sistem-yukle>
                <CircleCheck size={15} /> {t(paket.stok ? "stogaAl" : "sistemeYuklendi")}
              </button>
            </div>
          </>
        )}
        {gerekce !== null && (
          <div className="form-kutu form">
            <label>
              {t(adim === "videoKontrol" ? "revizyonGerekcesi" : "geriGondermeGerekcesi")}
              <textarea dir="auto" value={gerekce} onChange={(e) => setGerekce(e.target.value)} autoFocus data-geri-gerekce />
            </label>
            <div className="form-alt">
              <button className="dugme dugme-ikincil" onClick={() => setGerekce(null)}>
                {t("iptal")}
              </button>
              <button
                className="dugme dugme-kotu"
                disabled={!gerekce.trim()}
                onClick={() => {
                  if (geriGonder(ben, paket.id, gerekce)) bildir(t("bGeriGonderildi"));
                  setGerekce(null);
                }}
              >
                {t("geriGonder")}
              </button>
            </div>
          </div>
        )}
        {paket.muhabirId && adim !== "metin" && adim !== "video" && <small className="sonuk-yazi">{t("muhabirBilgi", { ad: ad(kisiBul(v, paket.muhabirId)) })}</small>}
      </div>
    </Kart>
  );
}

/* Klip kodu önerisi plan gününden; planı olmayan paket için bugünden. */
const plan = (v: ReturnType<typeof useVeri>, p: Paket) => planBul(v, p.planId)?.tarih ?? yerelGun(new Date().toISOString());

/* Özel yayın paketinin yayını: muhabir yayının kaydını okuyamıyor (gerçek kipte kural), adı paketin kendisinde. */
function OzelBag({ paket }: { paket: Paket }) {
  const { t, dil } = useDil();
  const v = useVeri();
  if (!paket.ozelId) return null;
  const o = v.ozel.find((x) => x.id === paket.ozelId);
  return (
    <p className="sonuk-yazi" data-paket-ozel>
      {t("ozel")}:{" "}
      {o ? (
        <a href={`#/ozel/${o.id}`}>
          <Icerik>{o.ad}</Icerik>
        </a>
      ) : paket.ozelAd ? (
        <Icerik>{paket.ozelAd}</Icerik>
      ) : (
        t(paket.ozelKaynak === "inhouse" ? "oyInhouse" : "oyDis")
      )}
      {paket.sonTarih && <span className={paket.durum !== "tamamlandi" && paket.sonTarih < bugun() ? "kotu-yazi" : ""}> · {t("oySonTarih")} {tarihYaz(paket.sonTarih, dil, "kisa")}</span>}
    </p>
  );
}
