import { birimAdi } from "../../yapi";
import { ONERI_ETIKETLERI, oneriEtiketleri, type OneriEtiketi } from "../../oneriPlanlari";
import { MuhabireOneriPenceresi, OneriYazismasi, TeklifYaniti } from "./Yazisma";
import { ArrowLeft, Ban, Clock, Inbox, Lightbulb, Megaphone, Pencil, Search, Send, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { HareketGecmisi } from "../../bilesenler/Hareket";
import { Avatar, BicimRozeti, Bos, Icerik, Kart, NotKutu, Pencere, TurRozeti, bildir } from "../../bilesenler/Parcalar";
import { KaynakRozeti, OneriAvatari, OneriDurumRozeti, OneriKaynagi, OneriPlanEtiketleri, OneriTablosu, useKaynakMetni, useOneriGunu } from "../../bilesenler/Tablolar";
import { saatYaz, tarihYaz, useDil } from "../../dil";
import { oneriDurum, oneriDuzenle, oneriGonder, oneriSil, oneriYenidenGonder } from "../../eylemler";
import { KANAL_ADI, ONERI_DURUM_ADI, ONERI_ETIKET_ADI, TUR_ADI, sehirAdi, ulkeAdi } from "../../etiketler";
import { bugun, gunEkle, yerelGun } from "../../tarih";
import { ICERIK_TURLERI, ONERI_DURUMLARI, ULKELER, acikCagri, baslikBul, kisiBul, paketBul, planBul, useVeri, type IcerikTuru, type Kisi, type Oneri, type OneriDurum, type Ulke } from "../../veri";
import { temizle } from "../../temizlik";
import { kayitTemizleyebilir, muhabireOneriGonderebilir, oneriDuzenleyebilir, oneriDuzeltmeyeGider, oneriGorebilir, oneriYenidenGonderebilir, yapabilir } from "../../yetki";
import { git } from "../../yol";
import { useSekmeAdi } from "../../sekmeAdi";
import { SayfaBasi } from "../ana/Planlama";
import { EpostaKaynagi, KisaOneriFormu } from "./Eposta";
import { OneriAlanlari, oneriFormuBaslangic, oneriFormuGecerli, oneriFormuGirdisi } from "./OneriFormu";
import { DuzeltmeFormu, GorunumSecici, OneriKarti, useOneriGorunumu } from "./OneriKarti";
import PlanaEkle from "./PlanaEkle";
import { GeriBildirimBolumu } from "./GeriBildirim";

/**
 * Öneriler: havuz, ayrıntı ve yeni öneri. Çağrı ve gelen e-posta yanıtları Eposta.tsx'te.
 *
 * Promptun 4.2 maddesindeki alanlar ve durumlar. Önerinin muhabirin
 * yazdığı hali hiç değişmiyor; değerlendirme (durum, bağlandığı başlık,
 * plan, gerekçe) ayrı alanlarda tutuluyor. Muhabir yalnız kendi
 * önerilerini görüyor.
 */

export function OnerilerListe({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const kaynakMetni = useKaynakMetni();
  const [durum, setDurum] = useState<OneriDurum | "hepsi">("hepsi");
  const [tur, setTur] = useState<IcerikTuru | "">("");
  const [ulke, setUlke] = useState<Ulke | "">("");
  const [aranan, setAranan] = useState("");
  // Plan etiketi: günlük ya da haftalık çalışan yalnız kendi planına düşen önerileri görsün.
  const [planEtiketi, setPlanEtiketi] = useState<OneriEtiketi | "yok" | "">("");
  /* Görünüm plan ekranlarıyla ortak kişisel seçim; kartta karar yok, kararlar ayrıntı sayfasında. */
  const [gorunum, setGorunum] = useOneriGorunumu(ben);
  const [acikId, setAcikId] = useState<string | null>(null);
  const [muhabireOner, setMuhabireOner] = useState(false);
  const acik = acikId ? v.oneriler.find((o) => o.id === acikId) : undefined;
  const muhabir = ben.birim === "muhabir";
  const gorunen = v.oneriler.filter((o) => oneriGorebilir(ben, o));
  const q = aranan.trim().toLocaleLowerCase();
  const etiketler = new Map(gorunen.map((o) => [o.id, oneriEtiketleri(v, o)]));
  const etiketli = (o: Oneri, e: OneriEtiketi | "yok" | "") => !e || (e === "yok" ? !etiketler.get(o.id)!.length : etiketler.get(o.id)!.includes(e));
  const liste = gorunen
    .filter(
      (o) =>
        etiketli(o, planEtiketi) &&
        (durum === "hepsi" || o.durum === durum) &&
        (!tur || o.tur === tur) &&
        (!ulke || o.ulke === ulke) &&
        (!q || `${o.haberBasligi} ${o.gelisme} ${kaynakMetni(o, v)}`.toLocaleLowerCase().includes(q)),
    )
    .sort((a, b) => b.zaman.localeCompare(a.zaman))
    // Bekleyen yönetici talimatı Planlama'nın önünde en üstte.
    .sort((a, b) => Number(!!b.talimatVeren && b.durum !== "planaEklendi") - Number(!!a.talimatVeren && a.durum !== "planaEklendi"));

  return (
    <>
      <SayfaBasi
        ikon={<Lightbulb size={26} />}
        baslik={t(muhabir ? "mOnerilerim" : "mOneriler")}
       
        sagUc={
          <>
            {yapabilir(ben, "cagriHazirla") && (
              <>
                <a className="dugme dugme-ikincil" href="#/oneriler/yanitlar">
                  <Inbox size={16} /> {t("gelenYanitlar")}
                </a>
                <a className="dugme dugme-ikincil" href="#/oneriler/cagri">
                  <Megaphone size={16} /> {t("oneriCagrisi")}
                </a>
              </>
            )}
            {muhabireOneriGonderebilir(ben, v) && (
              <button type="button" className="dugme dugme-ikincil" onClick={() => setMuhabireOner(true)} data-muhabire-oner>
                <Send size={16} className="yon" /> {t("muhabireHaberOner")}
              </button>
            )}
            {yapabilir(ben, "oneriGonder") && (
              <a className="dugme" href="#/oneriler/yeni">
                <Send size={16} className="yon" /> {t(muhabir ? "yeniOneriGonder" : "oneriKaydet")}
              </a>
            )}
          </>
        }
      />
      {muhabireOner && <MuhabireOneriPenceresi ben={ben} kapat={() => setMuhabireOner(false)} />}
      <Kart>
        <div className="suzgec">
          <label className="arama arama-kutu">
            <Search size={16} />
            <input type="search" dir="auto" value={aranan} onChange={(e) => setAranan(e.target.value)} placeholder={t("oneriAra")} aria-label={t("oneriAra")} />
          </label>
          <select className="girdi" value={tur} onChange={(e) => setTur(e.target.value as IcerikTuru | "")} aria-label={t("tur")}>
            <option value="">{t("tumTurler")}</option>
            {ICERIK_TURLERI.map((x) => (
              <option key={x} value={x}>
                {t(TUR_ADI[x])}
              </option>
            ))}
          </select>
          <select className="girdi" value={ulke} onChange={(e) => setUlke(e.target.value as Ulke | "")} aria-label={t("ulke")}>
            <option value="">{t("tumUlkeler")}</option>
            {ULKELER.map((x) => (
              <option key={x} value={x}>
                {t(ulkeAdi(x))}
              </option>
            ))}
          </select>
          <span className="bosluk-esnek" />
          <GorunumSecici deger={gorunum} degistir={setGorunum} />
        </div>
        {!muhabir && (
          <div className="cipler ara-alt-2" data-plan-suzgec>
            {(["", ...ONERI_ETIKETLERI, "yok"] as const).map((e) => (
              <button
                key={e || "hepsi"}
                type="button"
                className={`cip cip-dugme${planEtiketi === e ? " secili" : ""}${e && e !== "yok" ? ` renk-${e}` : ""}`}
                aria-pressed={planEtiketi === e}
                onClick={() => setPlanEtiketi(e)}
                data-plan-suzgec-etiketi={e || "hepsi"}
              >
                {t(e === "" ? "tumPlanlar" : e === "yok" ? "plansiz" : ONERI_ETIKET_ADI[e])} <em>{gorunen.filter((o) => etiketli(o, e)).length}</em>
              </button>
            ))}
          </div>
        )}
        <div className="sekmeler suzgec">
          <button className={durum === "hepsi" ? "acik" : ""} onClick={() => setDurum("hepsi")}>
            {t("hepsi")} <em>{gorunen.length}</em>
          </button>
          {ONERI_DURUMLARI.map((d) => (
            <button key={d} className={durum === d ? "acik" : ""} onClick={() => setDurum(d)}>
              {t(ONERI_DURUM_ADI[d])} <em>{gorunen.filter((o) => o.durum === d).length}</em>
            </button>
          ))}
        </div>
        {gorunum === "liste" ? (
          <OneriTablosu oneriler={liste} d={v} />
        ) : liste.length === 0 ? (
          <Bos metin={t("oneriYok")} />
        ) : (
          <div className="oneri-kartlari">
            {liste.map((o) => (
              <OneriKarti key={o.id} oneri={o} d={v} ac={() => setAcikId(o.id)} />
            ))}
          </div>
        )}
        {/* Karta basınca önerinin bütün ayrıntısı pencerede: ayrıca ayrıntı sayfasına gitmek gerekmiyor. */}
        {acik && (
          <Pencere key={acik.id} genis baslik={<Icerik>{acik.haberBasligi}</Icerik>} kapat={() => setAcikId(null)}>
            <OneriDetay ben={ben} oneri={acik} pencerede />
          </Pencere>
        )}
      </Kart>
    </>
  );
}

/**
 * Önerinin bütün ayrıntısı: kararlar, yazışma, geçmiş. Ayrıntı sayfası
 * (`#/oneriler/:id`) ve öneriler sayfasında karta basınca açılan pencere
 * (`pencerede`) aynı içeriği gösteriyor; pencerede geri bağlantısı ve
 * sayfa başlığı yok, başlık pencerenin kendisinde.
 */
/**
 * Tam yöneticinin tek öneriyi izleriyle silmesi (deneme kayıtları). Onayda
 * kaç kaydın gideceği toplu temizlikle aynı kuraldan. Sayfada silinince
 * listeye dönülüyor; pencere öneri kayıttan kalkınca kendiliğinden kapanıyor.
 */
function OneriSilDugmesi({ ben, oneri, sayfada = false }: { ben: Kisi; oneri: Oneri; sayfada?: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  if (!kayitTemizleyebilir(ben)) return null;
  const sil = () => {
    const n = temizle(v, { turler: ["oneriler"], idler: [oneri.id] }).toplam;
    if (!confirm(t("oneriSilOnay", { n }))) return;
    if (oneriSil(ben, oneri.id) !== null) {
      bildir(t("oneriSilindi"));
      if (sayfada) git("oneriler");
    }
  };
  return (
    <button type="button" className="dugme dugme-sade dugme-kucuk kotu-yazi oneri-sil" onClick={sil} data-oneri-sil>
      <Trash2 size={14} /> {t("oneriSil")}
    </button>
  );
}

export function OneriDetay({ ben, oneri, pencerede = false }: { ben: Kisi; oneri: Oneri; pencerede?: boolean }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const oneriGunu = useOneriGunu();
  const [ekle, setEkle] = useState(false);
  const [ret, setRet] = useState<string | null>(null);
  const [duzelt, setDuzelt] = useState(false);
  const [yenile, setYenile] = useState(false);
  const [duzenle, setDuzenle] = useState(false);
  const muhabir = kisiBul(v, oneri.muhabirId);
  const veren = kisiBul(v, oneri.talimatVeren);
  const giren = kisiBul(v, oneri.giren);
  const plan = planBul(v, oneri.planId);
  const paket = paketBul(v, oneri.paketId);
  const baslik = baslikBul(v, oneri.baslikId);
  const haftaPlani = oneri.hafta ? v.haftalik.find((h) => h.baslangic === oneri.hafta) : undefined;
  const degerlendirir = yapabilir(ben, "oneriDegerlendir") && oneri.durum !== "planaEklendi" && oneri.durum !== "teklif";
  const hareketler = v.hareketler.filter((h) => h.oneriId === oneri.id);
  /* E-postayla geldiyse kaynağı; muhabir de kendi yanıtını görüyor. */
  const yanit = v.yanitlar.find((y) => y.id === oneri.yanitId);
  // Düzeltmedeki öneride sıra muhabirde; Planlama yalnız vazgeçip reddedebiliyor.
  const muhabirde = oneri.durum === "duzeltme";

  const ust = pencerede ? (
    <p className="ara-alt-2">
      <OneriDurumRozeti oneri={oneri} /> <OneriKaynagi oneri={oneri} d={v} /> · {t(ulkeAdi(oneri.ulke))} · {tarihYaz(yerelGun(oneri.zaman), dil, "uzun")} {saatYaz(oneri.zaman, dil)}
      <OneriSilDugmesi ben={ben} oneri={oneri} />
    </p>
  ) : (
    <>
      <a className="geri-bag" href="#/oneriler">
        <ArrowLeft size={14} className="yon" /> {t(ben.birim === "muhabir" ? "mOnerilerim" : "mOneriler")}
      </a>
      <header className="sayfa-basi">
        <OneriAvatari oneri={oneri} d={v} boy="buyuk" />
        <div>
          <h1>
            <Icerik>{oneri.haberBasligi}</Icerik>
          </h1>
          <p>
            <OneriDurumRozeti oneri={oneri} /> <OneriKaynagi oneri={oneri} d={v} /> · {t(ulkeAdi(oneri.ulke))} ·{" "}
            {tarihYaz(yerelGun(oneri.zaman), dil, "uzun")} {saatYaz(oneri.zaman, dil)}
          </p>
        </div>
        <OneriSilDugmesi ben={ben} oneri={oneri} sayfada />
      </header>
    </>
  );

  return (
    <>
      {ust}
      <TeklifYaniti ben={ben} oneri={oneri} />
      {oneriYenidenGonderebilir(ben, oneri) && (
        <div className="duzeltme-istegi" data-duzeltme-istegi>
          <NotKutu ton="uyari" ikon={<Undo2 size={16} />}>
            <b>{t("duzeltmeIstegi")}</b>
            <p dir="auto">{oneri.duzeltmeNotu}</p>
          </NotKutu>
          {yenile ? (
            <KisaOneriFormu
              takip={!!oneri.muhabirId && !oneri.yon}
              ilk={{ haberBasligi: oneri.haberBasligi, gelisme: oneri.gelisme, paketBasligi: oneri.paketBasligi, tur: oneri.tur, bicim: oneri.bicim, sahaGerekli: oneri.sahaGerekli }}
              kaydet={(g) => {
                const ok = oneriYenidenGonder(ben, oneri.id, g);
                if (ok) bildir(t("bYenidenGonderildi"));
                return ok;
              }}
              kapat={() => setYenile(false)}
              kaydetMetni={t("yenidenGonder")}
              gelismeGerekli
              strapGerekli
            />
          ) : (
            <button className="dugme" onClick={() => setYenile(true)} data-duzelt-ac>
              <Send size={15} className="yon" /> {t("duzeltVeYenidenGonder")}
            </button>
          )}
        </div>
      )}
      <div className="iz iz-ana-yan">
        <div className="iz">
          <Kart
            baslik={t(yanit ? "oneri" : giren ? "oneriGirildigiHal" : "oneriOrijinal")}
            sagUc={
              oneriDuzenleyebilir(ben, oneri) &&
              !duzenle && (
                <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setDuzenle(true)} data-oneri-duzenle>
                  <Pencil size={14} /> {t("duzenle")}
                </button>
              )
            }
          >
            {duzenle && (
              <div className="ara-alt-2" data-oneri-duzenle-formu>
                <KisaOneriFormu
                  takip={!!oneri.muhabirId && !oneri.yon}
                  ilk={{ haberBasligi: oneri.haberBasligi, gelisme: oneri.gelisme, paketBasligi: oneri.paketBasligi, tur: oneri.tur, bicim: oneri.bicim, sahaGerekli: oneri.sahaGerekli }}
                  kaydet={(g) => {
                    const ok = oneriDuzenle(ben, oneri.id, g);
                    if (ok) bildir(t("bKaydedildi"));
                    return ok;
                  }}
                  kapat={() => setDuzenle(false)}
                />
              </div>
            )}
            <div className="alanlar">
              <div className="alan">
                <small>{t(veren ? "yoneticiTalimati" : muhabir ? "muhabir" : "kaynak")}</small>
                {veren || muhabir ? <b>{ad(veren ?? muhabir)}</b> : <KaynakRozeti oneri={oneri} />}
              </div>
              {giren && (
                <div className="alan">
                  <small>{t(oneri.yon ? "oneren" : "giren")}</small>
                  <b>{ad(giren)}</b>
                </div>
              )}
              <div className="alan">
                <small>{t("ulke")}</small>
                <b>{t(ulkeAdi(oneri.ulke))}</b>
              </div>
              <div className="alan">
                <small>{t("kanal")}</small>
                <b>{t(KANAL_ADI[oneri.kanal])}</b>
              </div>
              <div className="alan">
                <small>{t("hedefPlan")}</small>
                <b data-oneri-gunu>{oneriGunu(oneri)}</b>
                <OneriPlanEtiketleri oneri={oneri} d={v} />
              </div>
              <div className="alan">
                <small>{t("tur")}</small>
                <TurRozeti tur={oneri.tur} />
              </div>
              {oneri.bicim && (
                <div className="alan">
                  <small>{t("haberTuru")}</small>
                  <BicimRozeti bicim={oneri.bicim} />
                </div>
              )}
              <div className="alan">
                <small>{t("saha")}</small>
                <b>{t(oneri.sahaGerekli ? "evet" : "hayir")}</b>
              </div>
            </div>
            <div className="ara-ust-2">
              <div className="alan-etiket">{t("gelismeAciklama")}</div>
              <div className="metin-kutu">
                <Icerik blok>{oneri.gelisme}</Icerik>
              </div>
            </div>
            {oneri.paketBasligi && (
              <div className="ara-ust-2">
                <div className="alan-etiket">{t("onerilenPaketBasligi")}</div>
                <div className="metin-kutu">
                  <Icerik blok>{oneri.paketBasligi}</Icerik>
                </div>
              </div>
            )}
            {oneri.ilkHali && (
              <details className="ara-ust-2 ilk-hal" data-oneri-ilk-hali>
                <summary>{t("oneriIlkHali")}</summary>
                <Icerik blok>{oneri.ilkHali.haberBasligi}</Icerik>
                <Icerik blok>{oneri.ilkHali.gelisme}</Icerik>
                {oneri.ilkHali.paketBasligi && <Icerik blok>{oneri.ilkHali.paketBasligi}</Icerik>}
              </details>
            )}
          </Kart>
          <OneriYazismasi ben={ben} oneri={oneri} />
          {yanit && <EpostaKaynagi ben={ben} oneri={oneri} yanit={yanit} />}
          <Kart baslik={t("hareketGecmisi")}>
            {hareketler.length ? <HareketGecmisi hareketler={hareketler} d={v} /> : <Bos kucuk metin={t("kayitYok")} />}
          </Kart>
        </div>
        <div className="iz">
          <Kart baslik={t("degerlendirme")}>
            <div className="alanlar">
              <div className="alan">
                <small>{t("durum")}</small>
                <OneriDurumRozeti oneri={oneri} />
              </div>
              <div className="alan">
                <small>{t("haberBasligi")}</small>
                <b>{baslik ? <Icerik>{baslik.ad}</Icerik> : "—"}</b>
              </div>
              <div className="alan">
                <small>{t("plan")}</small>
                {plan ? (
                  <a href={`#/nextday/${plan.id}`}>{tarihYaz(plan.tarih, dil, "kisa")}</a>
                ) : haftaPlani ? (
                  <a href={`#/haftalik/${haftaPlani.id}`}>{t("haftalik")}</a>
                ) : (
                  <b>—</b>
                )}
              </div>
              <div className="alan">
                <small>{t("paketOnerisi")}</small>
                {paket ? <a href={`#/paketler/${paket.id}`}>{paket.kod}</a> : <b>—</b>}
              </div>
            </div>
            {oneri.gerekce && (
              <div className="ara-ust-2">
                <NotKutu ton="uyari">
                  <span dir="auto">{oneri.gerekce}</span>
                </NotKutu>
              </div>
            )}
            {/* Muhabire kendi kutusunda (sayfa başında) gösteriliyor; düzeltilip gönderildiyse burada neye göre düzeltildiği kalıyor. */}
            {oneri.duzeltmeNotu && !oneriYenidenGonderebilir(ben, oneri) && (
              <div className="ara-ust-2">
                <div className="alan-etiket">
                  {t("duzeltmeIstegi")}
                  {(oneri.duzeltmeSayisi ?? 0) > 1 && ` · ${t("duzeltmeSayisi", { n: oneri.duzeltmeSayisi! })}`}
                </div>
                <NotKutu ton={muhabirde ? "uyari" : ""} ikon={<Undo2 size={16} />}>
                  <span dir="auto">{oneri.duzeltmeNotu}</span>
                </NotKutu>
              </div>
            )}
            <GeriBildirimBolumu ben={ben} oneri={oneri} />
            {degerlendirir && (
              <div className="ara-ust-2">
                {ekle ? (
                  <PlanaEkle ben={ben} oneri={oneri} kapat={() => setEkle(false)} />
                ) : duzelt ? (
                  <DuzeltmeFormu ben={ben} oneri={oneri} kapat={() => setDuzelt(false)} />
                ) : ret !== null ? (
                  <div className="form form-kutu">
                    <label>
                      {t("retGerekcesi")}
                      <input dir="auto" value={ret} onChange={(e) => setRet(e.target.value)} autoFocus />
                    </label>
                    <div className="form-alt">
                      <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setRet(null)}>
                        {t("iptal")}
                      </button>
                      <button
                        className="dugme dugme-kotu dugme-kucuk"
                        onClick={() => {
                          oneriDurum(ben, oneri.id, "reddedildi", ret);
                          setRet(null);
                        }}
                      >
                        {t("reddet")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dugmeler">
                    {/* Haftalık öneri Next Day'e değil haftalık planın gündemine alınıyor. */}
                    {oneri.durum !== "reddedildi" && !muhabirde && haftaPlani && (
                      <a className="dugme dugme-iyi" href={`#/haftalik/${haftaPlani.id}`}>
                        {t("haftalikPlandaDegerlendir")}
                      </a>
                    )}
                    {/* Haftalık öneri haftanın gündemine (gün ve dosya seçilerek), Next Day önerisi çalışılan plana. */}
                    {oneri.durum !== "reddedildi" && !muhabirde && (oneri.hedefTarih || (!!haftaPlani && !haftaPlani.kalemler.some((k) => k.oneriId === oneri.id))) && (
                      <button className="dugme dugme-iyi" onClick={() => setEkle(true)} data-oneri-plana-ekle>
                        {t(oneri.hedefTarih ? "planaEkle" : "gundemeEkle")}
                      </button>
                    )}
                    {oneri.durum === "yeni" && (
                      <button className="dugme dugme-ikincil" onClick={() => oneriDurum(ben, oneri.id, "degerlendiriliyor")}>
                        <Clock size={15} /> {t("degerlendirmeyeAl")}
                      </button>
                    )}
                    {oneriDuzeltmeyeGider(ben, oneri) && (
                      <button className="dugme dugme-ikincil" onClick={() => setDuzelt(true)} data-duzeltmeye-gonder>
                        <Undo2 size={15} /> {t("duzeltmeyeGonder")}
                      </button>
                    )}
                    {!veren && !muhabirde && oneri.durum !== "sonra" && oneri.durum !== "reddedildi" && (
                      <button className="dugme dugme-ikincil" onClick={() => oneriDurum(ben, oneri.id, "sonra")}>
                        {t("odSonra")}
                      </button>
                    )}
                    {!veren && oneri.durum !== "reddedildi" && (
                      <button className="dugme dugme-kotu" onClick={() => setRet("")}>
                        <Ban size={15} /> {t("reddet")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Kart>
          {muhabir && (
            <Kart baslik={t("muhabir")}>
              <div className="kayit-bas">
                <Avatar kisi={muhabir} durum />
                <div>
                  <b>{ad(muhabir)}</b>
                  <small>
                    {birimAdi(muhabir.birim)} · {t(sehirAdi(muhabir.sehir))}
                  </small>
                </div>
              </div>
            </Kart>
          )}
        </div>
      </div>
    </>
  );
}

export function YeniOneri({ ben, haftalik = false }: { ben: Kisi; haftalik?: boolean }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const muhabir = ben.birim === "muhabir";
  const B = bugun();
  const cagri = acikCagri(v, "nextday", B);
  /*
   * Haftalık hedef: muhabire açık haftalık çağrının haftası; Planlama
   * telefonla gelen öneriyi kesinleşmemiş her gelecek haftaya girebiliyor.
   */
  const haftalikCagri = acikCagri(v, "haftalik", B);
  /*
   * Next Day / haftalık ayrımı yok: muhabir günü ve çok günlü etkinlikte
   * bitişi yazıyor; öneri Planlama'nın çalıştığı hangi planın günlerine
   * düşüyorsa o planın etiketini alıyor (oneriPlanlari.ts). Haftalık
   * çağrıdan gelinince gün haftanın ilk günüyle başlıyor.
   */
  const [hedefTarih, setHedefTarih] = useState(haftalik && haftalikCagri ? (haftalikCagri.tarih > B ? haftalikCagri.tarih : B) : (cagri?.tarih ?? gunEkle(B, 1)));
  const [bitisTarih, setBitisTarih] = useState("");
  const [f, setF] = useState(() => oneriFormuBaslangic(ben, "eposta"));
  const gecerli = oneriFormuGecerli(f, muhabir) && !!hedefTarih && (!bitisTarih || bitisTarih >= hedefTarih);
  // Formda seçilen günlere göre düşeceği planlar: muhabir göndermeden görsün.
  const onizleme = { id: "", hedefTarih, ...(bitisTarih > hedefTarih && { bitisTarih }) } as Oneri;
  // Sayfanın başlığı yok, doğrudan form; adı sekmede.
  useSekmeAdi(t(muhabir ? "yeniOneriGonder" : "oneriKaydet"));
  const gonder = () => {
    if (!gecerli) return;
    const id = oneriGonder(ben, { ...oneriFormuGirdisi(f), hedefTarih, bitisTarih: bitisTarih > hedefTarih ? bitisTarih : undefined });
    if (id) {
      bildir(t(muhabir ? "bOneriGonderildi" : "bOneriKaydedildi"));
      git(`oneriler/${id}`);
    }
  };
  return (
    <>
      <a className="geri-bag" href="#/oneriler">
        <ArrowLeft size={14} className="yon" /> {t(muhabir ? "mOnerilerim" : "mOneriler")}
      </a>
      {cagri && (
        <NotKutu ton="vurgu" ikon={<Megaphone size={18} />}>
          {t("acikCagri", { tarih: tarihYaz(cagri.tarih, dil, "uzun") })} · {t("acikCagriAciklama", { saat: cagri.sonSaat })}
        </NotKutu>
      )}
      <Kart>
        <div className="form">
          <OneriAlanlari
            ben={ben}
            f={f}
            setF={setF}
            hedef={
              <>
                <label>
                  {t("tarih")}
                  <input
                    type="date"
                    value={hedefTarih}
                    min={B}
                    onChange={(e) => {
                      setHedefTarih(e.target.value);
                      if (bitisTarih && e.target.value > bitisTarih) setBitisTarih("");
                    }}
                    data-oneri-tarih
                  />
                </label>
                <label>
                  {t("oneriBitis")} <span className="ipucu">{t("varsa")}</span>
                  <input type="date" value={bitisTarih} min={hedefTarih || B} onChange={(e) => setBitisTarih(e.target.value)} data-oneri-bitis />
                </label>
              </>
            }
          />
          <div className="cipler" data-oneri-plan-onizleme>
            <OneriPlanEtiketleri oneri={onizleme} d={v} />
          </div>
          <div className="form-alt">
            <a className="dugme dugme-ikincil" href="#/oneriler">
              {t("iptal")}
            </a>
            <button className="dugme" onClick={gonder} disabled={!gecerli}>
              <Send size={16} className="yon" /> {t(muhabir ? "gonder" : "kaydet")}
            </button>
          </div>
        </div>
      </Kart>
    </>
  );
}
