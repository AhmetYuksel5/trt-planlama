import { ArrowLeft, Ban, CirclePlay, CircleCheck, Hourglass, MessageSquare, Star, Undo2, Workflow } from "lucide-react";
import { useState } from "react";
import { ADIM_KUTUSU, adimAdi, adimSahibi, geciktiMi, paketSahibi, sonrakiAdim, stokDurumu, type UretimAdimi } from "../akis";
import { HareketGecmisi } from "../bilesenler/Hareket";
import { AsamaBuyuk, Avatar, BicimRozeti, Bos, HaftalikRozeti, Icerik, Kart, Kilitli, NotKutu, OncelikRozeti, PaketDurumRozeti, Rozet, TurRozeti, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { YoneticiKarti } from "../bilesenler/Yonetici";
import { gecenSure, metin as dilMetni, saatYaz, tarihYaz, useDil } from "../dil";
import { adimIlerle, geriGonder, nitelikPuanla, notEkle, paketDurum, uretimeAl } from "../eylemler";
import { BIRIM_ADI, STOK_DURUM_ADI, sehirAdi } from "../etiketler";
import { girdidenIso, yerelGirdi, yerelGun } from "../tarih";
import { baslikBul, kisiBul, oneriBul, planBul, useVeri, type Kisi, type Paket } from "../veri";
import { adimYapabilir, ucretGorebilir, uretimeAlabilir, yapabilir } from "../yetki";
import { MuhabirSecici } from "./nextday/Formlar";

/**
 * Paket detayı: ortak kaydın kendisi (rapor bölüm 7).
 *
 * Bir haberin nerede beklediği, en son kimin işlem yaptığı, hangi
 * birimden hangisine devredildiği ve bütün geçmişi tek sayfada. Eylem
 * kartı yalnız o adımın sahibine görünüyor; diğerleri okuyor. Ücret alan
 * bazlı yetkiyle: kaydı görmek ücreti görmek demek değil.
 */
export default function PaketDetay({ ben, paket }: { ben: Kisi; paket: Paket }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const muhabir = kisiBul(v, paket.muhabirId);
  const plan = planBul(v, paket.planId);
  const pb = plan?.basliklar.find((b) => b.id === paket.planBaslikId);
  const stok = stokDurumu(paket);
  const yayinPlani = planBul(v, paket.yayinlandi?.planId);
  const oneri = oneriBul(v, paket.oneriId);
  const sahip = paketSahibi(paket);
  const sonraki = paket.durum === "uretimde" ? sonrakiAdim(paket) : null;
  const hareketler = v.hareketler.filter((h) => h.paketId === paket.id || (oneri && h.oneriId === oneri.id));

  return (
    <>
      <a className="geri-bag" href="#/paketler">
        <ArrowLeft size={14} className="yon" /> {t(ben.birim === "muhabir" ? "mPaketlerim" : "mPaketler")}
      </a>
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
        </div>
      </header>

      <Kart baslik={t("asamalar")}>
        <AsamaBuyuk paket={paket} />
        <div className="simdi-kimde">
          <div>
            <small>{t("simdiKimde")}</small>
            <b>
              {sahip ? t(BIRIM_ADI[sahip]) : stok ? t(STOK_DURUM_ADI[stok]) : t(paket.durum === "iptal" ? "pdIptal" : "pdTamamlandi")}
              {sahip === "muhabir" && muhabir && ` · ${ad(muhabir)}`}
            </b>
          </div>
          {paket.adim && (
            <div>
              <small>{t("buAdim")}</small>
              <b>
                {t(adimAdi(paket.adim as UretimAdimi, paket))} · {t("raporKutusu", { n: ADIM_KUTUSU[paket.adim as UretimAdimi] })}
              </b>
            </div>
          )}
          {sonraki && (
            <div>
              <small>{t("sirada")}</small>
              <b>{sonraki === "tamam" ? t(paket.stok ? "sdStokta" : "pdTamamlandi") : `${t(adimAdi(sonraki, paket))} · ${t(BIRIM_ADI[adimSahibi(sonraki, paket.tur)])}`}</b>
            </div>
          )}
          {paket.teslim && (
            <div>
              <small>{t("teslim")}</small>
              <b className={geciktiMi(paket) ? "kotu-yazi" : ""}>
                {tarihYaz(yerelGun(paket.teslim), dil, "kisa")} {saatYaz(paket.teslim, dil)}
              </b>
            </div>
          )}
        </div>
      </Kart>

      <div className="iz iz-ana-yan">
        <div className="iz">
          <EylemKarti ben={ben} paket={paket} />
          <YoneticiKarti ben={ben} paket={paket} />
          {paket.metin && (
            <Kart baslik={t("metin")}>
              <div className="metin-kutu">
                <Icerik blok>{paket.metin}</Icerik>
              </div>
            </Kart>
          )}
          <Notlar ben={ben} paket={paket} />
          <Kart baslik={t("hareketGecmisi")} ek={t("hareketGecmisiAciklama")}>
            {hareketler.length ? <HareketGecmisi hareketler={hareketler} d={v} /> : <Bos kucuk metin={t("kayitYok")} />}
          </Kart>
        </div>
        <div className="iz">
          <Kart baslik={t("bilgiler")}>
            <div className="alanlar">
              <div className="alan">
                <small>{t("muhabir")}</small>
                {muhabir ? (
                  <span className="kisi-hucre">
                    <Avatar kisi={muhabir} boy="kucuk" /> {ad(muhabir)}
                  </span>
                ) : (
                  <b>{t("atanmadi")}</b>
                )}
              </div>
              <div className="alan">
                <small>{t("sehirUlke")}</small>
                <b>{t(sehirAdi(paket.sehir))}</b>
              </div>
              <div className="alan">
                <small>{t("plan")}</small>
                {plan ? (
                  <a href={`#/nextday/${plan.id}`}>{tarihYaz(plan.tarih, dil, "kisa")}</a>
                ) : yayinPlani ? (
                  <a href={`#/nextday/${yayinPlani.id}`}>
                    {t("sdYayinlandi")} · {tarihYaz(yayinPlani.tarih, dil, "kisa")}
                  </a>
                ) : stok ? (
                  <b>{t(STOK_DURUM_ADI[stok])}</b>
                ) : (
                  <b>{paket.durum === "tamamlandi" && paket.yayin ? tarihYaz(yerelGun(paket.yayin), dil, "kisa") : t("haftalikKaynak")}</b>
                )}
              </div>
              <div className="alan">
                <small>{t("haberBasligi")}</small>
                <b>{pb ? <Icerik>{baslikBul(v, pb.baslikId)?.ad}</Icerik> : "—"}</b>
              </div>
              <div className="alan">
                <small>{t("yayinSaati")}</small>
                <b>{paket.yayin ? saatYaz(paket.yayin, dil) : "—"}</b>
              </div>
              <div className="alan">
                <small>{t("saha")}</small>
                <b>{t(paket.sahaGerekli ? "evet" : "hayir")}</b>
              </div>
              {paket.durum === "tamamlandi" && (paket.nitelik || yapabilir(ben, "nitelikPuanla")) && (
                <div className="alan alan-genis">
                  <small>{t("nitelikPuani")}</small>
                  <NitelikPuani ben={ben} paket={paket} />
                </div>
              )}
              <div className="alan">
                <small>{t("slug")}</small>
                <b dir="ltr">{paket.slug ?? "—"}</b>
              </div>
              <div className="alan">
                <small>{t("klipKodu")}</small>
                <b dir="ltr">{paket.klipKodu ?? "—"}</b>
              </div>
              <div className="alan">
                <small>{t("videoBaglantisi")}</small>
                {paket.video ? (
                  <a href={paket.video} target="_blank" rel="noreferrer" dir="ltr">
                    {t("ac")}
                  </a>
                ) : (
                  <b>—</b>
                )}
              </div>
              <div className="alan">
                <small>{t("oneri")}</small>
                {oneri ? (
                  <a href={`#/oneriler/${oneri.id}`}>
                    <Icerik>{oneri.haberBasligi}</Icerik>
                  </a>
                ) : (
                  <b>—</b>
                )}
              </div>
              <div className="alan">
                <small>{t("ucret")}</small>
                {!paket.ucret ? (
                  <b>—</b>
                ) : ucretGorebilir(ben, paket) ? (
                  <b>
                    {paket.ucret.tutar} {paket.ucret.para} · {t(`uc_${paket.ucret.durum}`)}
                  </b>
                ) : (
                  <Kilitli metin={t("maliAlanKilitli")} />
                )}
              </div>
            </div>
            {paket.aciklama && (
              <div className="ara-ust-2">
                <div className="alan-etiket">{t("kisaAciklama")}</div>
                <p className="sonuk-yazi">
                  <Icerik blok>{paket.aciklama}</Icerik>
                </p>
              </div>
            )}
          </Kart>
        </div>
      </div>
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
  const [gerekce, setGerekce] = useState<string | null>(null);

  const ilerle = (g: Parameters<typeof adimIlerle>[2]) => {
    if (adimIlerle(ben, paket.id, g)) bildir(t("bAdimTamam"));
  };

  if (paket.durum === "onaylandi" && uretimeAlabilir(ben, paket)) {
    return (
      <Kart baslik={t("seninIslemin")}>
        <p className="aciklama">{t(paket.stok ? "uretimeAlStokAciklama" : "uretimeAlAciklama")}</p>
        <div className="dugmeler">
          <button className="dugme" onClick={() => uretimeAl(ben, paket.id) && bildir(t("bUretimeAlindi"))}>
            <CirclePlay size={15} /> {t("uretimeAl")}
          </button>
        </div>
      </Kart>
    );
  }

  if (paket.durum !== "uretimde") {
    if (!yapabilir(ben, "paketDegerlendir") || ["tamamlandi", "iptal", "onaylandi"].includes(paket.durum)) return null;
    return (
      <Kart baslik={t("seninIslemin")}>
        <p className="aciklama">{t("paketDegerlendirAciklama")}</p>
        <div className="dugmeler">
          {paket.durum === "taslak" && (
            <button className="dugme dugme-ikincil" onClick={() => paketDurum(ben, paket.id, "degerlendiriliyor")}>
              <Hourglass size={15} /> {t("degerlendirmeyeAl")}
            </button>
          )}
          <button className="dugme dugme-iyi" onClick={() => paketDurum(ben, paket.id, "onaylandi")}>
            <CircleCheck size={15} /> {t("onayla")}
          </button>
          <button className="dugme dugme-kotu" onClick={() => confirm(t("iptalEdilsinMi")) && paketDurum(ben, paket.id, "iptal")}>
            <Ban size={15} /> {t("iptalEt")}
          </button>
        </div>
      </Kart>
    );
  }

  if (!adimYapabilir(ben, paket)) {
    const sahip = paketSahibi(paket);
    return (
      <NotKutu>
        {t("baskaBirimde", { birim: sahip ? t(BIRIM_ADI[sahip]) : "", adim: t(adimAdi(paket.adim as UretimAdimi, paket)) })}
      </NotKutu>
    );
  }

  const adim = paket.adim as UretimAdimi;
  const geriGonderebilir = adim === "kontrol" || adim === "dil";
  return (
    <Kart baslik={`${t("seninSiran")}: ${t(adimAdi(adim, paket))}`}>
      <div className="form">
        {adim === "gorevlendirme" && (
          <>
            <p className="aciklama">{t("eGorevlendirme")}</p>
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
            <p className="aciklama">{t("eGorevVer")}</p>
            <div className="satir">
              <label>
                {t("muhabir")}
                <MuhabirSecici deger={muhabirId} degistir={setMuhabirId} />
              </label>
              <label>
                {t("teslim")}
                <input type="datetime-local" value={teslim} onChange={(e) => setTeslim(e.target.value)} />
              </label>
            </div>
            <div className="form-alt">
              <button className="dugme" disabled={!muhabirId} onClick={() => ilerle({ muhabirId, teslim: girdidenIso(teslim) })}>
                {t("muhabireGorevVer")}
              </button>
            </div>
          </>
        )}
        {adim === "metin" && (
          <>
            <p className="aciklama">{t("eMetin")}</p>
            <textarea {...icerikAlani} value={metin} onChange={(e) => setMetin(e.target.value)} rows={8} placeholder={dilMetni("metinIpucu", "ar")} />
            <div className="form-alt">
              <button className="dugme" disabled={!metin.trim()} onClick={() => ilerle({ metin })}>
                {t("metniGonder")}
              </button>
            </div>
          </>
        )}
        {(adim === "kontrol" || adim === "dil") && (
          <>
            <p className="aciklama">{t(adim === "kontrol" ? "eKontrol" : "eDil")}</p>
            {paket.metin && (
              <div className="metin-kutu">
                <Icerik blok>{paket.metin}</Icerik>
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
            <p className="aciklama">{t("eVideo")}</p>
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
            <p className="aciklama">{t("eIletim")}</p>
            <div className="form-alt">
              <button className="dugme" onClick={() => ilerle({})}>
                {t("mediayaIlet")}
              </button>
            </div>
          </>
        )}
        {adim === "media" && (
          <>
            <p className="aciklama">{t("eMedia")}</p>
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
        {adim === "inews" && (
          <>
            <p className="aciklama">{t(paket.stok ? "eStokYukleme" : "eInews")}</p>
            <div className="form-alt">
              <button className="dugme dugme-iyi" onClick={() => ilerle({})}>
                <CircleCheck size={15} /> {t(paket.stok ? "stogaAl" : "inewsTamam")}
              </button>
            </div>
          </>
        )}
        {gerekce !== null && (
          <div className="form-kutu form">
            <label>
              {t("geriGondermeGerekcesi")}
              <textarea dir="auto" value={gerekce} onChange={(e) => setGerekce(e.target.value)} autoFocus />
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

/** Koordinasyon notları: e-posta yerine kayıt üzerinde yazışma. */
function Notlar({ ben, paket }: { ben: Kisi; paket: Paket }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [yeni, setYeni] = useState("");
  const gonder = () => {
    if (notEkle(ben, paket.id, yeni)) setYeni("");
  };
  return (
    <Kart baslik={t("koordinasyonNotlari")} ikon={<MessageSquare size={18} />}>
      {paket.notlar.length === 0 && <Bos kucuk metin={t("notYok")} />}
      <ul className="akis">
        {paket.notlar.map((n) => {
          const k = kisiBul(v, n.kisiId);
          return (
            <li key={n.id} className={n.yonetici ? "yonetici-notu" : ""}>
              <Avatar kisi={k} boy="kucuk" />
              <div className="metin">
                <b>{k ? ad(k) : "?"}</b> <span className="sonuk-yazi">· {k ? t(BIRIM_ADI[k.birim]) : ""}</span>
                {n.yonetici && <span className="rozet rozet-talimat">{t("yoneticiNotu")}</span>}
                <p dir="auto">{n.metin}</p>
              </div>
              <time dateTime={n.zaman}>{gecenSure(n.zaman, dil)}</time>
            </li>
          );
        })}
      </ul>
      <div className="form ara-ust-2">
        <textarea dir="auto" value={yeni} onChange={(e) => setYeni(e.target.value)} placeholder={t("notIpucu")} rows={2} />
        <div className="form-alt">
          <button className="dugme dugme-kucuk" onClick={gonder} disabled={!yeni.trim()}>
            {t("notEkle")}
          </button>
        </div>
      </div>
    </Kart>
  );
}

/** Tamamlanan pakete Newsdesk'in nitelik puanı: yıldızlar, yetkisi olana düğme. */
function NitelikPuani({ ben, paket }: { ben: Kisi; paket: Paket }) {
  const { t } = useDil();
  const verir = yapabilir(ben, "nitelikPuanla");
  return (
    <span className="yildizlar" role={verir ? "group" : undefined} aria-label={t("nitelikPuani")}>
      {[1, 2, 3, 4, 5].map((n) =>
        verir ? (
          <button
            key={n}
            className={`dugme dugme-sade dugme-ikon ${n <= (paket.nitelik ?? 0) ? "dolu" : ""}`}
            aria-label={t("puanVer", { n })}
            aria-pressed={n === paket.nitelik}
            onClick={() => nitelikPuanla(ben, paket.id, n) && bildir(t("bPuanKaydedildi"))}
          >
            <Star size={16} />
          </button>
        ) : (
          <Star key={n} size={16} className={n <= (paket.nitelik ?? 0) ? "dolu" : ""} />
        ),
      )}
    </span>
  );
}
