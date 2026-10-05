import { ArrowLeft, Ban, Clock, Inbox, Lightbulb, Megaphone, Search, Send } from "lucide-react";
import { useState } from "react";
import { HareketGecmisi } from "../../bilesenler/Hareket";
import { Avatar, BicimRozeti, Bos, Icerik, Kart, NotKutu, Rozet, TurRozeti, bildir } from "../../bilesenler/Parcalar";
import { KaynakRozeti, OneriAvatari, OneriDurumRozeti, OneriKaynagi, OneriTablosu, useKaynakMetni } from "../../bilesenler/Tablolar";
import { aralikYaz, saatYaz, tarihYaz, useDil } from "../../dil";
import { haftaSonu } from "../../haftalik";
import { oneriDurum, oneriGonder } from "../../eylemler";
import { BIRIM_ADI, KANAL_ADI, ONERI_DURUM_ADI, TUR_ADI, sehirAdi, ulkeAdi } from "../../etiketler";
import { bugun, gunEkle, yerelGun } from "../../tarih";
import { ICERIK_TURLERI, ONERI_DURUMLARI, ULKELER, acikCagri, baslikBul, kisiBul, paketBul, planBul, useVeri, type IcerikTuru, type Kisi, type Oneri, type OneriDurum, type Ulke } from "../../veri";
import { oneriGorebilir, yapabilir } from "../../yetki";
import { git } from "../../yol";
import { SayfaBasi } from "../ana/Planlama";
import { EpostaKaynagi } from "./Eposta";
import { OneriAlanlari, oneriFormuBaslangic, oneriFormuGecerli, oneriFormuGirdisi } from "./OneriFormu";
import { GorunumSecici, OneriKarti, OneriPenceresi, useOneriGorunumu } from "./OneriKarti";
import PlanaEkle from "./PlanaEkle";

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
  /* Görünüm plan ekranlarıyla ortak kişisel seçim; kartta karar yok, kararlar ayrıntı sayfasında. */
  const [gorunum, setGorunum] = useOneriGorunumu(ben);
  const [acikId, setAcikId] = useState<string | null>(null);
  const acik = acikId ? v.oneriler.find((o) => o.id === acikId) : undefined;
  const muhabir = ben.birim === "muhabir";
  const gorunen = v.oneriler.filter((o) => oneriGorebilir(ben, o));
  const q = aranan.trim().toLocaleLowerCase();
  const liste = gorunen
    .filter(
      (o) =>
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
        alt={t(muhabir ? "onerilerimAlt" : "onerilerAlt")}
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
            {yapabilir(ben, "oneriGonder") && (
              <a className="dugme" href="#/oneriler/yeni">
                <Send size={16} className="yon" /> {t(muhabir ? "yeniOneriGonder" : "oneriKaydet")}
              </a>
            )}
          </>
        }
      />
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
        {acik && <OneriPenceresi key={acik.id} oneri={acik} d={v} kapat={() => setAcikId(null)} />}
      </Kart>
    </>
  );
}

export function OneriDetay({ ben, oneri }: { ben: Kisi; oneri: Oneri }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [ekle, setEkle] = useState(false);
  const [ret, setRet] = useState<string | null>(null);
  const muhabir = kisiBul(v, oneri.muhabirId);
  const veren = kisiBul(v, oneri.talimatVeren);
  const giren = kisiBul(v, oneri.giren);
  const plan = planBul(v, oneri.planId);
  const paket = paketBul(v, oneri.paketId);
  const baslik = baslikBul(v, oneri.baslikId);
  const haftaPlani = oneri.hafta ? v.haftalik.find((h) => h.baslangic === oneri.hafta) : undefined;
  const degerlendirir = yapabilir(ben, "oneriDegerlendir") && oneri.durum !== "planaEklendi";
  const hareketler = v.hareketler.filter((h) => h.oneriId === oneri.id);
  /* E-postayla geldiyse kaynağı; muhabir de kendi yanıtını görüyor. */
  const yanit = v.yanitlar.find((y) => y.id === oneri.yanitId);

  return (
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
      </header>
      <div className="iz iz-ana-yan">
        <div className="iz">
          <Kart baslik={t(yanit ? "oneri" : giren ? "oneriGirildigiHal" : "oneriOrijinal")} ek={t(yanit ? "oneriEpostadanNot" : "oneriOrijinalNot")}>
            <div className="alanlar">
              <div className="alan">
                <small>{t(veren ? "yoneticiTalimati" : muhabir ? "muhabir" : "kaynak")}</small>
                {veren || muhabir ? <b>{ad(veren ?? muhabir)}</b> : <KaynakRozeti oneri={oneri} />}
              </div>
              {giren && (
                <div className="alan">
                  <small>{t("giren")}</small>
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
                <b>
                  {oneri.hafta
                    ? `${t("haftalik")} · ${aralikYaz(oneri.hafta, haftaSonu(oneri.hafta), dil)}`
                    : oneri.hedefTarih && tarihYaz(oneri.hedefTarih, dil, "tam")}
                </b>
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
          </Kart>
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
            {oneri.geriDonus && (
              <div className="ara-ust-2">
                <Rozet ton="iyi">{t("geriDonusYapildi")}</Rozet>
              </div>
            )}
            {degerlendirir && (
              <div className="ara-ust-2">
                {ekle ? (
                  <PlanaEkle ben={ben} oneri={oneri} kapat={() => setEkle(false)} />
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
                    {oneri.durum !== "reddedildi" && haftaPlani && (
                      <a className="dugme dugme-iyi" href={`#/haftalik/${haftaPlani.id}`}>
                        {t("haftalikPlandaDegerlendir")}
                      </a>
                    )}
                    {oneri.durum !== "reddedildi" && !oneri.hafta && (
                      <button className="dugme dugme-iyi" onClick={() => setEkle(true)}>
                        {t("planaEkle")}
                      </button>
                    )}
                    {oneri.durum === "yeni" && (
                      <button className="dugme dugme-ikincil" onClick={() => oneriDurum(ben, oneri.id, "degerlendiriliyor")}>
                        <Clock size={15} /> {t("degerlendirmeyeAl")}
                      </button>
                    )}
                    {!veren && oneri.durum !== "sonra" && oneri.durum !== "reddedildi" && (
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
                {veren && !ekle && (
                  <p className="bos-kucuk ara-ust">{t("talimatReddedilmez")}</p>
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
                    {t(BIRIM_ADI[muhabir.birim])} · {t(sehirAdi(muhabir.sehir))}
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
  const haftalar = muhabir
    ? haftalikCagri
      ? [haftalikCagri.tarih]
      : []
    : v.haftalik.filter((h) => h.durum !== "kesinlesti" && h.baslangic > B).map((h) => h.baslangic).sort();
  const [hafta, setHafta] = useState(haftalik ? (haftalikCagri?.tarih ?? haftalar[0] ?? "") : "");
  const [hedefTarih, setHedefTarih] = useState(cagri?.tarih ?? gunEkle(B, 1));
  const [f, setF] = useState(() => oneriFormuBaslangic(ben, "eposta"));
  const gecerli = oneriFormuGecerli(f);
  const gonder = () => {
    if (!gecerli) return;
    const id = oneriGonder(ben, { ...oneriFormuGirdisi(f), hedefTarih: hafta ? undefined : hedefTarih, hafta: hafta || undefined });
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
      <SayfaBasi ikon={<Send size={26} className="yon" />} baslik={t(muhabir ? "yeniOneriGonder" : "oneriKaydet")} alt={t(muhabir ? "yeniOneriAlt" : "oneriKaydetAlt")} />
      {cagri && (
        <NotKutu ton="vurgu" ikon={<Megaphone size={18} />}>
          {t("acikCagri", { tarih: tarihYaz(cagri.tarih, dil, "uzun") })} · {t("acikCagriAciklama", { saat: cagri.sonSaat })}
        </NotKutu>
      )}
      <Kart>
        <div className="form">
          {haftalar.length > 0 && (
            <div className="sekmeler" role="tablist" aria-label={t("hedefPlan")}>
              <button type="button" role="tab" aria-selected={!hafta} className={!hafta ? "acik" : ""} onClick={() => setHafta("")}>
                {t("nextday")}
              </button>
              <button type="button" role="tab" aria-selected={!!hafta} className={hafta ? "acik" : ""} onClick={() => setHafta(hafta || haftalar[0])}>
                {t("haftalik")}
              </button>
            </div>
          )}
          <OneriAlanlari
            ben={ben}
            f={f}
            setF={setF}
            hedef={
              hafta ? (
                <label>
                  {t("hedefPlan")}
                  <select value={hafta} onChange={(e) => setHafta(e.target.value)}>
                    {haftalar.map((h) => (
                      <option key={h} value={h}>
                        {aralikYaz(h, haftaSonu(h), dil)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  {t("hedefPlan")}
                  <input type="date" value={hedefTarih} min={B} onChange={(e) => setHedefTarih(e.target.value)} />
                </label>
              )
            }
          />
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
