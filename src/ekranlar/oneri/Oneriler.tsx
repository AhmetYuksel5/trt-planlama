import { birimAdi } from "../../yapi";
import { ONERI_ETIKETLERI, oneriArsivde, oneriEtiketleri, oneriGeriHedefleri, oneriYeri, type OneriEtiketi, type OneriGeriHedefi } from "../../oneriPlanlari";
import { MuhabireOneriPenceresi, OneriYazismasi, TeklifNotu } from "./Yazisma";
import { Archive, ArchiveRestore, ArrowLeft, Ban, Clock, Copy, Inbox, Lightbulb, Megaphone, Pencil, Search, Send, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { HareketGecmisi } from "../../bilesenler/Hareket";
import { Avatar, BicimRozeti, Bos, Icerik, Kart, NotKutu, Pencere, Rozet, TurRozeti, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { KaynakRozeti, OneriAvatari, OneriDurumRozeti, OneriKaynagi, OneriPlanEtiketleri, OneriTablosu, useKaynakMetni, useOneriGunu } from "../../bilesenler/Tablolar";
import { saatYaz, tarihYaz, useDil, type Anahtar } from "../../dil";
import { oneriArsiveGonder, oneriArsivdenCikar, oneriAsamayaDon, oneriDurum, oneriKopyala, takipSatiriEkle, oneriDuzenle, oneriGeriCek, oneriGonder, oneriSil, oneriYenidenGonder } from "../../eylemler";
import { KANAL_ADI, ONERI_DURUM_ADI, ONERI_ETIKET_ADI, TUR_ADI, sehirAdi, ulkeAdi } from "../../etiketler";
import { bugun, gunEkle, yerelGun } from "../../tarih";
import { ICERIK_TURLERI, ONERI_DURUMLARI, TAKIP_BICIMI, ULKELER, acikCagri, baslikBul, kisiBul, paketBul, planBul, useVeri, type IcerikTuru, type Kisi, type Oneri, type OneriDurum, type Ulke } from "../../veri";
import { temizle } from "../../temizlik";
import { arsivdenCikarabilir, geriAlabilir, oneriSilebilir, takipSatiriEkleyebilir, muhabireOneriGonderebilir, oneriGeriCekebilir, teklifKarariVerebilir, oneriDuzenleyebilir, oneriDuzeltmeyeGider, oneriGorebilir, oneriYenidenGonderebilir, yapabilir } from "../../yetki";
import { git } from "../../yol";
import { useSekmeAdi } from "../../sekmeAdi";
import { SayfaBasi } from "../ana/Planlama";
import { EpostaKaynagi, KisaOneriFormu } from "./Eposta";
import { OneriAlanlari, oneriFormuBaslangic, oneriFormuGecerli, oneriFormuGirdisi } from "./OneriFormu";
import { DuzeltmeFormu, GorunumSecici, OneriKarti, PlandanCikarDugmesi, useOneriGorunumu } from "./OneriKarti";
import PlanaEkle from "./PlanaEkle";
import { GeriBildirimBolumu } from "./GeriBildirim";
import { YzHaberDegeri } from "../../bilesenler/YzOneri";

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
  const B = bugun();
  const kendi = v.oneriler.filter((o) => oneriGorebilir(ben, o));
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
  if (!oneriSilebilir(ben)) return null;
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

/*
 * Önerinin aşama dışı geçişleri: teklifte planlamacının kararı, geri çekme,
 * elle arşiv ve arşivden çıkarma. Kritik olanlarda onay soruluyor.
 */
function OneriKapiDugmeleri({ ben, oneri: o }: { ben: Kisi; oneri: Oneri }) {
  const { t } = useDil();
  const v = useVeri();
  const [geriAl, setGeriAl] = useState<OneriGeriHedefi | null>(null);
  const arsivde = oneriArsivde(o, bugun());
  const degerlendirir = yapabilir(ben, "oneriDegerlendir");
  const hedefler = geriAlabilir(ben) ? oneriGeriHedefleri(v, o) : [];
  const geriAlYap = (h: OneriGeriHedefi) => {
    if (!confirm(t("geriAlOnay", { asama: t(ONERI_DURUM_ADI[h]) }))) return;
    const r = oneriAsamayaDon(ben, o.id, h);
    if (r === "tamam") {
      bildir(t("bGeriAlindi"));
      setGeriAl(null);
    } else if (r === "paketIlerledi") bildir(t("bPaketIlerledi"));
  };
  const kopyala = () => {
    if (!confirm(t("kopyaOnay"))) return;
    const id = oneriKopyala(ben, o.id);
    if (id) {
      bildir(t("bKopyaAcildi"));
      git(`oneriler/${id}`);
    }
  };
  const onayla = (soru: Anahtar, f: () => boolean, bitti: Anahtar) => {
    if (confirm(t(soru)) && f()) bildir(t(bitti));
  };
  const dugmeler = [
    teklifKarariVerebilir(ben, o) && (
      <button key="tkp" type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => oneriDurum(ben, o.id, "takip") && bildir(t("bTakibeAlindi"))} data-teklif-takip>
        <Lightbulb size={14} /> {t("takibeAl")}
      </button>
    ),
    teklifKarariVerebilir(ben, o) && (
      <button key="deg" type="button" className="dugme dugme-iyi dugme-kucuk" onClick={() => oneriDurum(ben, o.id, "degerlendiriliyor")} data-teklif-degerlendir>
        <Clock size={14} /> {t("degerlendirmeyeAl")}
      </button>
    ),
    oneriGeriCekebilir(ben, o) && (
      <button key="cek" type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => onayla("geriCekOnay", () => oneriGeriCek(ben, o.id), "bGeriCekildi")} data-oneri-geri-cek>
        <Undo2 size={14} /> {t("geriCek")}
      </button>
    ),
    !arsivde && yapabilir(ben, "oneriDegerlendir") && (
      <button key="ars" type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => onayla("arsiveGonderOnay", () => oneriArsiveGonder(ben, o.id), "bArsiveGonderildi")} data-oneri-arsive>
        <Archive size={14} /> {t("arsiveGonder")}
      </button>
    ),
    hedefler.length > 0 && (
      <button key="geri" type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setGeriAl(geriAl ? null : hedefler[0])} aria-expanded={!!geriAl} data-oneri-geri-al>
        <Undo2 size={14} /> {t("geriAlAsama")}
      </button>
    ),
    degerlendirir && !!oneriYeri(v, o) && (
      <button key="kopya" type="button" className="dugme dugme-sade dugme-kucuk" onClick={kopyala} data-oneri-kopyala>
        <Copy size={14} /> {t("baskaPlanaEkle")}
      </button>
    ),
    arsivde && arsivdenCikarabilir(ben) && (
      <button key="cik" type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => onayla("arsivdenCikarOnay", () => oneriArsivdenCikar(ben, o.id), "bArsivdenCikti")} data-oneri-arsivden>
        <ArchiveRestore size={14} /> {t("arsivdenCikar")}
      </button>
    ),
  ].filter(Boolean);
  if (!dugmeler.length && !arsivde) return null;
  return (
    <>
      <div className="dugmeler ara-ust-2" data-oneri-kapi>
        {arsivde && <Rozet>{t("arsivde")}</Rozet>}
        {dugmeler}
      </div>
      {geriAl && (
        <div className="form form-kutu ara-ust-2" data-geri-al-formu>
          <fieldset className="secim-satiri">
            <legend>{t("geriAlHedef")}</legend>
            {hedefler.map((h) => (
              <label key={h} className="secim">
                <input type="radio" name={`geri-${o.id}`} checked={geriAl === h} onChange={() => setGeriAl(h)} data-geri-hedef={h} />
                {t(ONERI_DURUM_ADI[h])}
              </label>
            ))}
          </fieldset>
          <div className="form-alt">
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setGeriAl(null)}>
              {t("iptal")}
            </button>
            <button type="button" className="dugme dugme-kucuk" onClick={() => geriAlYap(geriAl)} data-geri-al-onay>
              {t("geriAlAsama")}
            </button>
          </div>
        </div>
      )}
      <BagliOneriler oneri={o} />
    </>
  );
}

/* İkinci plana kopyalanan öneri ile asıl öneri birbirine bağlı görünür. */
function BagliOneriler({ oneri: o }: { oneri: Oneri }) {
  const { t } = useDil();
  const v = useVeri();
  const asil = o.kopyaKaynagi ? v.oneriler.find((x) => x.id === o.kopyaKaynagi) : undefined;
  const kopyalar = v.oneriler.filter((x) => x.kopyaKaynagi === o.id);
  if (!asil && !kopyalar.length) return null;
  return (
    <div className="ara-ust-2" data-bagli-oneriler>
      <div className="alan-etiket">{t("bagliOneriler")}</div>
      <ul className="liste">
        {[...(asil ? [[asil, "kopyaAsil"] as const] : []), ...kopyalar.map((x) => [x, "kopyaKopya"] as const)].map(([x, ad]) => (
          <li key={x.id}>
            <small className="soluk">{t(ad)}</small> <a href={`#/oneriler/${x.id}`}>
              <Icerik>{x.haberBasligi}</Icerik>
            </a>{" "}
            <OneriDurumRozeti oneri={x} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/*
 * Takibin gelişme satırları: muhabir metni değiştirmez, altına tarihli satır
 * ekler; önceki satırlar kalır. En yenisi üstte, Planlama neyin yeni
 * olduğunu ilk bakışta görsün.
 */
function TakipSatirlari({ ben, oneri: o }: { ben: Kisi; oneri: Oneri }) {
  const { t, dil } = useDil();
  const [metin, setMetin] = useState("");
  const ekler = takipSatiriEkleyebilir(ben, o);
  const satirlar = [...(o.satirlar ?? [])].reverse();
  if (!ekler && !satirlar.length && o.durum !== "takip") return null;
  const ekle = () => {
    if (!takipSatiriEkle(ben, o.id, metin)) return;
    setMetin("");
    bildir(t("tsEklendi"));
  };
  return (
    <Kart baslik={t("tsGelismeler")} ikon={<Lightbulb size={18} />}>
      {ekler && (
        <div className="form ara-alt-2" data-takip-satiri-formu>
          <textarea {...icerikAlani} rows={2} value={metin} onChange={(e) => setMetin(e.target.value)} data-takip-satiri />
          <div className="form-alt">
            <button type="button" className="dugme dugme-kucuk" disabled={!metin.trim()} onClick={ekle} data-takip-satiri-ekle>
              {t("tsEkle")}
            </button>
          </div>
        </div>
      )}
      {satirlar.length ? (
        <ul className="liste takip-satirlari" data-takip-satirlari>
          {satirlar.map((x) => (
            <li key={x.zaman}>
              <small className="soluk">
                {tarihYaz(yerelGun(x.zaman), dil, "kisa")} {saatYaz(x.zaman, dil)}
              </small>
              <Icerik blok>{x.metin}</Icerik>
            </li>
          ))}
        </ul>
      ) : (
        <Bos kucuk metin={t("kayitYok")} />
      )}
    </Kart>
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
  // Girdiği yer (Next Day planı ya da haftalık gündem): karar verilmişse düğmelerin yerinde "Plandan çıkar".
  const yer = oneriYeri(v, oneri);
  const haftaPlani = yer?.hafta ?? (oneri.hafta ? v.haftalik.find((h) => h.baslangic === oneri.hafta) : undefined);
  const degerlendirir = yapabilir(ben, "oneriDegerlendir") && oneri.durum !== "planaEklendi" && oneri.durum !== "teklif" && oneri.durum !== "geriCekildi" && !yer;
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
      <TeklifNotu ben={ben} oneri={oneri} />
      {oneriYenidenGonderebilir(ben, oneri) && (
        <div className="duzeltme-istegi" data-duzeltme-istegi>
          <NotKutu ton="uyari" ikon={<Undo2 size={16} />}>
            <b>{t("duzeltmeIstegi")}</b>
            <p dir="auto">{oneri.duzeltmeNotu}</p>
          </NotKutu>
          {yenile ? (
            <KisaOneriFormu
              takip={!!oneri.muhabirId && !oneri.yon}
              muhabirId={oneri.muhabirId}
              ilk={{ haberBasligi: oneri.haberBasligi, gelisme: oneri.gelisme, paketBasligi: oneri.paketBasligi, tur: oneri.tur, bicim: oneri.bicim, sahaGerekli: oneri.sahaGerekli }}
              kaydet={(g) => {
                const ok = confirm(t("eminMisin")) && oneriYenidenGonder(ben, oneri.id, g);
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
              muhabirId={oneri.muhabirId}
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
          <TakipSatirlari ben={ben} oneri={oneri} />
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
            <div className="ara-ust-2">
              <YzHaberDegeri ben={ben} oneri={oneri} ulkeAdi={t(ulkeAdi(oneri.ulke))} />
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
            <OneriKapiDugmeleri ben={ben} oneri={oneri} />
            {yer && (
              <div className="ara-ust-2">
                <PlandanCikarDugmesi ben={ben} oneri={oneri} d={v} />
              </div>
            )}
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
                          if (!confirm(t("retOnay"))) return;
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
                    {/* "Sonra değerlendirilecek" takibe katıldı. */}
                    {!veren && !muhabirde && !!oneri.muhabirId && oneri.durum !== "takip" && oneri.durum !== "reddedildi" && (
                      <button className="dugme dugme-ikincil" onClick={() => oneriDurum(ben, oneri.id, "takip") && bildir(t("bTakibeAlindi"))} data-takip-olarak-kalsin>
                        <Lightbulb size={15} /> {t("takipOlarakKalsin")}
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
                    {birimAdi(muhabir.birim)} · {sehirAdi(muhabir.sehir)}
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
