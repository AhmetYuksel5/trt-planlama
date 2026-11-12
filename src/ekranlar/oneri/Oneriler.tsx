import { GeriBag } from "../../bilesenler/GeriBag";
import { ONERI_ETIKETLERI, esCiftleri, takibinOnerisi, oneriArsivde, oneriEtiketleri, type OneriEtiketi } from "../../oneriPlanlari";
import { MuhabireOneriPenceresi } from "./Yazisma";
import { Inbox, Lightbulb, Megaphone, Search, Send } from "lucide-react";
import { useState } from "react";
import { Bos, Icerik, Kart, NotKutu, Pencere, bildir } from "../../bilesenler/Parcalar";
import { OneriDurumRozeti, OneriPlanEtiketleri, OneriTablosu, useKaynakMetni } from "../../bilesenler/Tablolar";
import { tarihYaz, useDil } from "../../dil";
import { oneriGonder } from "../../eylemler";
import { ONERI_DURUM_ADI, ONERI_ETIKET_ADI, TUR_ADI, ulkeAdi } from "../../etiketler";
import { bugun, gunEkle } from "../../tarih";
import { ICERIK_TURLERI, ONERI_DURUMLARI, TAKIP_BICIMI, ULKELER, acikCagri, useVeri, type IcerikTuru, type Kisi, type Oneri, type OneriDurum, type Ulke } from "../../veri";
import { MasalardakiOneriler } from "./MasaSorusu";
import { oneriBirlestirebilir, muhabireOneriGonderebilir, oneriGorebilir, yapabilir } from "../../yetki";
import { git, useAdimDurumu } from "../../yol";
import { useSekmeAdi } from "../../sekmeAdi";
import { SayfaBasi } from "../ana/Planlama";
import { OneriAlanlari, oneriFormuBaslangic, oneriFormuGecerli, oneriFormuGirdisi } from "./OneriFormu";
import { GorunumSecici, OneriKarti, useOneriGorunumu } from "./OneriKarti";
import { OneriAyrinti, esBirlestirSor } from "./OneriGovde";

/**
 * Öneriler: havuz, ayrıntı ve yeni öneri. Çağrı ve gelen e-posta yanıtları Eposta.tsx'te.
 *
 * Promptun 4.2 maddesindeki alanlar ve durumlar. Önerinin muhabirin
 * yazdığı hali hiç değişmiyor; değerlendirme (durum, bağlandığı başlık,
 * plan, gerekçe) ayrı alanlarda tutuluyor. Muhabir yalnız kendi
 * önerilerini görüyor.
 */

/*
 * `arsiv`: günü geçmiş öneriler (oneriPlanlari.ts → oneriArsivde). Güncel
 * listeden kalkıyorlar, Planlama'nın listesinde eski öneri birikmesin;
 * muhabirde "Geçmiş önerilerim".
 */
export function OnerilerListe({ ben, arsiv = false }: { ben: Kisi; arsiv?: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const kaynakMetni = useKaynakMetni();
  // Seçimler geçmiş adımında: geri dönünce bırakıldığı gibi (yol.ts → useAdimDurumu).
  const on = arsiv ? "oneriArsiv" : "oneriler";
  const [durum, setDurum] = useAdimDurumu<OneriDurum | "hepsi">(`${on}:durum`, "hepsi");
  const [tur, setTur] = useAdimDurumu<IcerikTuru | "">(`${on}:tur`, "");
  const [ulke, setUlke] = useAdimDurumu<Ulke | "">(`${on}:ulke`, "");
  const [aranan, setAranan] = useAdimDurumu(`${on}:ara`, "");
  // Plan etiketi: günlük ya da haftalık çalışan yalnız kendi planına düşen önerileri görsün.
  const [planEtiketi, setPlanEtiketi] = useAdimDurumu<OneriEtiketi | "yok" | "">(`${on}:plan`, "");
  /* Görünüm plan ekranlarıyla ortak kişisel seçim; kartta karar yok, kararlar ayrıntı sayfasında. */
  const [gorunum, setGorunum] = useOneriGorunumu(ben);
  const [acikId, setAcikId] = useState<string | null>(null);
  const [muhabireOner, setMuhabireOner] = useState(false);
  const acik = acikId ? v.oneriler.find((o) => o.id === acikId) : undefined;
  const muhabir = ben.birim === "muhabir";
  const B = bugun();
  const kendi = v.oneriler.filter((o) => oneriGorebilir(ben, o) && !takibinOnerisi(v, o));
  const arsivdekiler = kendi.filter((o) => oneriArsivde(o, B));
  const gorunen = arsiv ? arsivdekiler : kendi.filter((o) => !oneriArsivde(o, B));
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
        baslik={t(arsiv ? (muhabir ? "gecmisOnerilerim" : "oneriArsivi") : muhabir ? "mOnerilerim" : "mOneriler")}
       
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
      {!arsiv && !muhabir && <EsCiftleri ben={ben} />}
      {!arsiv && !muhabir && <MasalardakiOneriler ben={ben} />}
      <Kart>
        <div className="sekmeler ara-alt-2" role="tablist" data-oneri-arsiv-sekmesi>
          <a href="#/oneriler" role="tab" aria-selected={!arsiv} className={arsiv ? "" : "acik"} data-oneri-guncel>
            {t("guncelOneriler")} <em>{kendi.length - arsivdekiler.length}</em>
          </a>
          <a href="#/oneriler/arsiv" role="tab" aria-selected={arsiv} className={arsiv ? "acik" : ""} data-oneri-arsiv>
            {t(muhabir ? "gecmisOnerilerim" : "oneriArsivi")} <em>{arsivdekiler.length}</em>
          </a>
        </div>
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
        {acik && <OneriAyrinti key={acik.id} ben={ben} oneri={acik} kapat={() => setAcikId(null)} />}
      </Kart>
    </>
  );
}

/* Öneriler sayfasında eş çiftlerinin toplu görünümü: elle girilip takılmış eski çiftler buradan bulunur. */
function EsCiftleri({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  const ciftler = esCiftleri(v).filter(([a, k]) => oneriBirlestirebilir(ben, a, k));
  if (!ciftler.length) return null;
  return (
    <>
      <p className="uyari-satiri ara-alt-2">
        <button type="button" className="dugme-metin" onClick={() => setAcik(true)} data-es-ciftleri>
          {t("esCiftSayisi").replace("{n}", String(ciftler.length))}
        </button>
      </p>
      {acik && (
        <Pencere genis baslik={t("esCiftSayisi").replace("{n}", String(ciftler.length))} kapat={() => setAcik(false)}>
          <ul className="liste" data-es-cift-listesi>
            {ciftler.map(([a, k]) => (
              <li key={`${a.id}|${k.id}`} data-es-cift>
                <div>
                  <small className="soluk">{t("esAsil")}</small> <a href={`#/oneriler/${a.id}`}><Icerik>{a.haberBasligi}</Icerik></a> <OneriDurumRozeti oneri={a} />
                </div>
                <div>
                  <small className="soluk">{t(k.giren ? "esElle" : "esAsil")}</small> <a href={`#/oneriler/${k.id}`}><Icerik>{k.haberBasligi}</Icerik></a> <OneriDurumRozeti oneri={k} />
                </div>
                <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => esBirlestirSor(ben, a, k, t)} data-es-cift-birlestir>
                  {t("esBirlestir")}
                </button>
              </li>
            ))}
          </ul>
        </Pencere>
      )}
    </>
  );
}

/** Ayrıntı sayfası (`#/oneriler/:id`): pencereyle aynı gövde, bölümler açık. */
export function OneriDetay({ ben, oneri }: { ben: Kisi; oneri: Oneri }) {
  return <OneriAyrinti ben={ben} oneri={oneri} />;
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
    if (!gecerli || !confirm(t("eminMisin"))) return;
    const id = oneriGonder(ben, { ...oneriFormuGirdisi(f), hedefTarih, bitisTarih: bitisTarih > hedefTarih ? bitisTarih : undefined });
    if (id && f.bicim === TAKIP_BICIMI) {
      // Takip Takip aşamasında öneri; muhabir onu Takiplerim'de izliyor.
      bildir(t("bTakipKaydedildi"));
      git("takipler");
    } else if (id) {
      bildir(t(muhabir ? "bOneriGonderildi" : "bOneriKaydedildi"));
      git(`oneriler/${id}`);
    }
  };
  return (
    <>
      <GeriBag href="#/oneriler" metin={t(muhabir ? "mOnerilerim" : "mOneriler")} />
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
