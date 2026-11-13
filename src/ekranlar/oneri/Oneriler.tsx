import { TarihGirdisi } from "../../bilesenler/TarihSaat";
import { GeriBag } from "../../bilesenler/GeriBag";
import { ONERI_ETIKETLERI, esCiftleri, takibinOnerisi, oneriEtiketleri, oneriPlanGunu, type OneriEtiketi } from "../../oneriPlanlari";
import { GUN_GRUPLARI, ONERI_SEKMELERI, oneriGunGrubu, oneriSekmesi, type GunGrubu, type OneriSekmesi } from "../../oneriSekmeleri";
import { IslemMenusu } from "../../bilesenler/IslemMenusu";
import { MuhabireOneriPenceresi } from "./Yazisma";
import { Eye, Inbox, Lightbulb, Megaphone, Plus, Search, Send } from "lucide-react";
import { useState } from "react";
import { Bos, Icerik, Kart, NotKutu, Pencere, bildir } from "../../bilesenler/Parcalar";
import { OneriDurumRozeti, OneriPlanEtiketleri, OneriTablosu, useKaynakMetni } from "../../bilesenler/Tablolar";
import { tarihYaz, useDil, type Anahtar } from "../../dil";
import { oneriGonder } from "../../eylemler";
import { ONERI_ETIKET_ADI, TUR_ADI, ulkeAdi } from "../../etiketler";
import { bugun, gunEkle } from "../../tarih";
import { ICERIK_TURLERI, TAKIP_BICIMI, ULKELER, acikCagri, useVeri, type IcerikTuru, type Kisi, type Oneri, type Ulke } from "../../veri";
import { MasalardakiOneriler } from "./MasaSorusu";
import { oneriBirlestirebilir, muhabireOneriGonderebilir, oneriGorebilir, yapabilir } from "../../yetki";
import { useAdimDurumu, yerineGit } from "../../yol";
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
 * Planlama'nın öneri listesi (muhabirin kendi ekranı MuhabirOnerilerim). Dört
 * sekme (oneriSekmeleri.ts): karar bekleyen (varsayılan), sırası başkasında,
 * planda / gündemde, arşiv. `arsiv` yalnız açılış sekmesi (#/oneriler/arsiv).
 * Sayılar öbür süzgeçlerle süzülmüş listeden: çip "12" deyip liste 3
 * göstermesin. Karar listesi gün gruplarında, önce bugünün işi.
 */
export function OnerilerListe({ ben, arsiv = false }: { ben: Kisi; arsiv?: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const kaynakMetni = useKaynakMetni();
  // Seçimler geçmiş adımında: geri dönünce bırakıldığı gibi (yol.ts → useAdimDurumu).
  const on = arsiv ? "oneriArsiv" : "oneriler";
  const [sekme, setSekme] = useAdimDurumu<OneriSekmesi>(`${on}:sekme`, arsiv ? "arsiv" : "karar");
  const [tur, setTur] = useAdimDurumu<IcerikTuru | "">(`${on}:tur`, "");
  const [ulke, setUlke] = useAdimDurumu<Ulke | "">(`${on}:ulke`, "");
  const [aranan, setAranan] = useAdimDurumu(`${on}:ara`, "");
  // Plan etiketi: günlük ya da haftalık çalışan yalnız kendi planına düşen önerileri görsün.
  const [planEtiketi, setPlanEtiketi] = useAdimDurumu<OneriEtiketi | "yok" | "">(`${on}:plan`, "");
  const [gorunum, setGorunum] = useOneriGorunumu(ben);
  const [acikId, setAcikId] = useState<string | null>(null);
  const [muhabireOner, setMuhabireOner] = useState(false);
  const acik = acikId ? v.oneriler.find((o) => o.id === acikId) : undefined;
  const B = bugun();
  const kendi = v.oneriler.filter((o) => oneriGorebilir(ben, o) && !takibinOnerisi(v, o));
  const sekmesi = new Map(kendi.map((o) => [o.id, oneriSekmesi(v, o, B)]));
  const takipSayisi = kendi.filter((o) => sekmesi.get(o.id) === null).length;
  const q = aranan.trim().toLocaleLowerCase();
  const etiketler = new Map(kendi.map((o) => [o.id, oneriEtiketleri(v, o)]));
  const etiketli = (o: Oneri, e: OneriEtiketi | "yok" | "") => !e || (e === "yok" ? !etiketler.get(o.id)!.length : etiketler.get(o.id)!.includes(e));
  // Plan etiketi dışındaki süzgeçler; sekme ve çip sayıları da bunlardan.
  const suzulmus = kendi.filter(
    (o) => (!tur || o.tur === tur) && (!ulke || o.ulke === ulke) && (!q || `${o.haberBasligi} ${o.gelisme} ${kaynakMetni(o, v)}`.toLocaleLowerCase().includes(q)),
  );
  const sekmeSayisi = (s: OneriSekmesi) => suzulmus.filter((o) => sekmesi.get(o.id) === s && etiketli(o, planEtiketi)).length;
  const sekmede = suzulmus.filter((o) => sekmesi.get(o.id) === sekme);
  // Bekleyen yönetici talimatı Planlama'nın önünde en üstte; sonra gün, aynı günde yenisi önce.
  const talimat = (o: Oneri) => Number(!!o.talimatVeren && o.durum !== "planaEklendi");
  const liste = sekmede
    .filter((o) => etiketli(o, planEtiketi))
    .sort((a, b) =>
      sekme === "arsiv"
        ? b.zaman.localeCompare(a.zaman)
        : talimat(b) - talimat(a) || (oneriPlanGunu(a) ?? "~").localeCompare(oneriPlanGunu(b) ?? "~") || b.zaman.localeCompare(a.zaman),
    );
  const gruplar: [GunGrubu | null, Oneri[]][] =
    sekme === "arsiv" ? [[null, liste]] : GUN_GRUPLARI.map((g): [GunGrubu, Oneri[]] => [g, liste.filter((o) => oneriGunGrubu(o, B) === g)]).filter(([, l]) => l.length);
  const cagri = yapabilir(ben, "cagriHazirla");
  const oner = muhabireOneriGonderebilir(ben, v);
  const listeyiCiz = (l: Oneri[]) =>
    gorunum === "liste" ? (
      <OneriTablosu oneriler={l} d={v} />
    ) : (
      <div className="oneri-kartlari">
        {l.map((o) => (
          <OneriKarti key={o.id} oneri={o} d={v} ac={() => setAcikId(o.id)} />
        ))}
      </div>
    );

  return (
    <>
      <SayfaBasi
        ikon={<Lightbulb size={26} />}
        baslik={t("mOneriler")}
        sagUc={
          <>
            {(cagri || oner || takipSayisi > 0) && (
              <IslemMenusu etiket={t("digerIslemler")} dugmeSinifi="dugme dugme-ikincil dugme-ikon" menuSinifi="plan-menusu" katman>
                {cagri && (
                  <>
                    <a role="menuitem" className="acilir-satir" href="#/oneriler/yanitlar" data-oneri-menu="yanitlar">
                      <Inbox size={16} /> {t("gelenYanitlar")}
                    </a>
                    <a role="menuitem" className="acilir-satir" href="#/oneriler/cagri" data-oneri-menu="cagri">
                      <Megaphone size={16} /> {t("oneriCagrisi")}
                    </a>
                  </>
                )}
                {oner && (
                  <button type="button" role="menuitem" className="acilir-satir" onClick={() => setMuhabireOner(true)} data-muhabire-oner>
                    <Send size={16} className="yon" /> {t("muhabireHaberOner")}
                  </button>
                )}
                {takipSayisi > 0 && (
                  <a role="menuitem" className="acilir-satir" href="#/takipler" data-oneri-menu="takipler">
                    <Eye size={16} /> {t("mMuhabirTakipleri")} <em>{takipSayisi}</em>
                  </a>
                )}
              </IslemMenusu>
            )}
            {yapabilir(ben, "oneriGonder") && (
              <a className="dugme" href="#/oneriler/yeni" data-oneri-gir>
                <Plus size={16} /> {t("oneriGir")}
              </a>
            )}
          </>
        }
      />
      {muhabireOner && <MuhabireOneriPenceresi ben={ben} kapat={() => setMuhabireOner(false)} />}
      <EsCiftleri ben={ben} />
      <MasalardakiOneriler ben={ben} />
      <Kart>
        <div className="sekmeler ara-alt-2" role="tablist" data-oneri-sekmeleri>
          {ONERI_SEKMELERI.map((s) => {
            const n = sekmeSayisi(s);
            // Boş sekme yer kaplamasın; karar bekleyen ve seçili olan hep görünür.
            if (!n && s !== sekme && s !== "karar") return null;
            return (
              <button key={s} type="button" role="tab" aria-selected={s === sekme} className={s === sekme ? "acik" : ""} onClick={() => setSekme(s)} data-oneri-sekme={s}>
                {t(SEKME_ADI[s])} <em>{n}</em>
              </button>
            );
          })}
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
        <div className="cipler ara-alt-2" data-plan-suzgec>
          {(["", ...ONERI_ETIKETLERI, "yok"] as const).map((e) => {
            const n = sekmede.filter((o) => etiketli(o, e)).length;
            if (e && !n && planEtiketi !== e) return null;
            return (
              <button
                key={e || "hepsi"}
                type="button"
                className={`cip cip-dugme${planEtiketi === e ? " secili" : ""}${e && e !== "yok" ? ` renk-${e}` : ""}`}
                aria-pressed={planEtiketi === e}
                onClick={() => setPlanEtiketi(e)}
                data-plan-suzgec-etiketi={e || "hepsi"}
              >
                {t(e === "" ? "tumPlanlar" : e === "yok" ? "plansiz" : ONERI_ETIKET_ADI[e])} <em>{n}</em>
              </button>
            );
          })}
        </div>
        {liste.length === 0 ? (
          <Bos metin={t("oneriYok")} />
        ) : (
          gruplar.map(([g, l]) =>
            g ? (
              <section key={g} className="oneri-gun-grubu" data-oneri-gun={g}>
                <h3 className="oneri-gun-basi">
                  {t(GUN_GRUBU_ADI[g])} <em>{l.length}</em>
                </h3>
                {listeyiCiz(l)}
              </section>
            ) : (
              <div key="hepsi">{listeyiCiz(l)}</div>
            ),
          )
        )}
        {/* Karta basınca önerinin bütün ayrıntısı pencerede: ayrıca ayrıntı sayfasına gitmek gerekmiyor. */}
        {acik && <OneriAyrinti key={acik.id} ben={ben} oneri={acik} kapat={() => setAcikId(null)} />}
      </Kart>
    </>
  );
}

const SEKME_ADI: Record<OneriSekmesi, Anahtar> = { karar: "kararBekleyen", baskasinda: "oneriSirasiBaskasinda", planda: "oneriPlandaGundemde", arsiv: "oneriArsivi" };
const GUN_GRUBU_ADI: Record<GunGrubu, Anahtar> = { bugun: "bugun", yarin: "yarin", ileri: "ileriGunler", gunsuz: "zamanaBagliDegil" };

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
      // Gönderilen form geçmişte kalmasın: geri tuşu boş forma dönüyordu (mobil denetim).
      bildir(t("bTakipKaydedildi"));
      yerineGit("takipler");
    } else if (id) {
      bildir(t(muhabir ? "bOneriGonderildi" : "bOneriKaydedildi"));
      yerineGit(`oneriler/${id}`);
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
                  <TarihGirdisi
                   
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
                  <TarihGirdisi value={bitisTarih} min={hedefTarih || B} onChange={(e) => setBitisTarih(e.target.value)} data-oneri-bitis />
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
