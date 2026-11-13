import { Archive, ArchiveRestore, Ban, ChevronDown, ClipboardList, Clock, Copy, ExternalLink, Lightbulb, Pencil, Plus, Send, Share2, Trash2, Undo2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { GeriBag } from "../../bilesenler/GeriBag";
import { HareketGecmisi } from "../../bilesenler/Hareket";
import { IslemMenusu } from "../../bilesenler/IslemMenusu";
import { Bos, Icerik, Kart, KatlanirKartlar, NotKutu, PaketDurumRozeti, Pencere, Rozet, TalimatRozeti, TurRozeti, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { KaynakRozeti, OneriAvatari, OneriDurumRozeti, useOneriGunu } from "../../bilesenler/Tablolar";
import { YzHaberDegeri } from "../../bilesenler/YzOneri";
import { saatYaz, tarihYaz, useDil, type Anahtar } from "../../dil";
import { KANAL_ADI, ONERI_DURUM_ADI, sehirAdi, ulkeAdi } from "../../etiketler";
import {
  epostaOnerisiSil,
  epostaOnerisiSilinir,
  oneriArsiveGonder,
  oneriArsivdenCikar,
  oneriAsamayaDon,
  oneriBirlestir,
  oneriDurum,
  oneriDuzenle,
  oneriGeriCek,
  oneriKopyala,
  oneriPlandakineBagla,
  oneriSil,
  oneriYenidenGonder,
  oneriyePaketEklenebilir,
  takipSatiriEkle,
} from "../../eylemler";
import { MASA_HAREKETLERI } from "../../masaSorusu";
import { oneriBekleyenGorevPaketi, oneriPlanKaydi, acikGundemde, baglanabilirKayitlar, esAsili, esOneriler, oneriArsivde, oneriGeriHedefleri, oneriYeri, type OneriGeriHedefi } from "../../oneriPlanlari";
import { bugun, yerelGun } from "../../tarih";
import { temizle } from "../../temizlik";
import { KisiIletisim } from "../../bilesenler/KisiCipi";
import { OneriYolu } from "../../bilesenler/OneriYolu";
import { baslikBul, getir, kisiBul, paketBul, planBul, useVeri, type Durum, type Kisi, type Oneri } from "../../veri";
import { birimAdi } from "../../yapi";
import {
  arsivdenCikarabilir,
  geriAlabilir,
  kisitliKisi,
  masayaSorabilir,
  oneriBirlestirebilir,
  oneriDogrudanGorevlendirebilir,
  oneriDuzenleyebilir,
  oneriDuzeltmeyeGider,
  oneriGeriCekebilir,
  oneriSatiriEkleyebilir,
  oneriSilebilir,
  oneriYenidenGonderebilir,
  teklifKarariVerebilir,
  yapabilir,
} from "../../yetki";
import { git } from "../../yol";
import { KisaOneriFormu, EpostaKaynagi } from "./Eposta";
import { GeriBildirimBolumu } from "./GeriBildirim";
import { GorevlendirFormu, MasaBolumu, MasayaSorFormu } from "./MasaSorusu";
import { OneriIslemeMetinleri } from "./OneriFormu";
import {
  DuzeltmeFormu,
  OneriKarti,
  OneriMetaSatiri,
  OneriSatiri,
  PaketEkleDugmesi,
  PlandanCikarDugmesi,
  RetFormu,
  arkaPlan,
  baslikOf,
  type Gorunum,
  type PencereDurumu,
} from "./OneriKarti";
import PlanaEkle from "./PlanaEkle";
import { OneriYazismasi, TeklifNotu } from "./Yazisma";

/*
 * Önerinin tek ayrıntısı (kullanıcı: pencere karışık ve uzun; örneğini
 * gösterdi): başlık ve tek durum rozeti, bilgi satırı, katlanır bölümler
 * (Özet, Plan & Öneri, Materyal, Değerlendirme, Yazışma, Geçmiş), altta
 * kişi ve kararlar. Ayrıntı sayfası, öneriler sayfasının penceresi, Next
 * Day ve Weekly'nin penceresi aynı gövde: önce iki ayrı pencere vardı,
 * plan ekranındakinde birim görüşü, takip satırları, eş öneri yoktu.
 * Az kullanılan kararlar ⋯ menüsünde; seçilen kararın formu bölümlerin
 * üstünde açılıyor.
 */

type Mod = "ekle" | "ret" | "duzelt" | "duzenle" | "masa" | "geriAl" | "paket" | "gorev" | null;

/* Katlanır bölüm; açık başlaması ilk çizimde belli, sonra kişinin elinde. */
function Bolum({ ad, baslik, ek, acik, children }: { ad: string; baslik: ReactNode; ek?: ReactNode; acik: boolean; children: ReactNode }) {
  const [ilk] = useState(acik);
  return (
    <details className="kart katlanir oneri-bolum" open={ilk || undefined} data-oneri-bolum={ad}>
      <summary className="kart-bas">
        <h2>{baslik}</h2>
        {ek && <span className="ek">{ek}</span>}
        <ChevronDown size={18} className="katlanir-ok" aria-hidden="true" />
      </summary>
      <KatlanirKartlar.Provider value={false}>
        <div className="katlanir-govde">{children}</div>
      </KatlanirKartlar.Provider>
    </details>
  );
}

/* Alttaki kişi: muhabir ya da talimat veren adıyla, yoksa kaynağın kendisi. */
function OneriKisisi({ ben, oneri: o, d }: { ben: Kisi; oneri: Oneri; d: Durum }) {
  const { t, ad } = useDil();
  const k = kisiBul(d, o.muhabirId ?? o.talimatVeren);
  return (
    <span className="kisi-hucre oneri-kisi">
      <OneriAvatari oneri={o} d={d} />
      <span>
        {o.talimatVeren ? <TalimatRozeti veren={k} /> : k ? <b>{ad(k)}</b> : <KaynakRozeti oneri={o} />}
        {k && !o.talimatVeren && (
          <small className="sonuk">
            {k.birim === "muhabir" ? t("muhabir") : birimAdi(k.birim)}
            {k.sehir && ` · ${sehirAdi(k.sehir)}`}
          </small>
        )}
      </span>
      {/* Muhabire öneriden çıkmadan ulaşma; posta konusu önerinin başlığı. */}
      {k && !o.talimatVeren && <KisiIletisim ben={ben} kisi={k} konu={o.haberBasligi} />}
    </span>
  );
}

export function OneriAyrinti({
  ben,
  oneri: o,
  kapat,
  ekleMetni,
  ekleFormu,
  ilkMod = null,
  ertelenebilir = true,
}: {
  ben: Kisi;
  oneri: Oneri;
  /** Verilirse pencere; yoksa ayrıntı sayfası (bölümler açık). */
  kapat?: () => void;
  ekleMetni?: string;
  /** Plan ekranı kendi ekleme formunu veriyor (Next Day'de o plana, Weekly'de gündeme). */
  ekleFormu?: (o: Oneri, kapat: () => void) => ReactNode;
  ilkMod?: Mod;
  ertelenebilir?: boolean;
}) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const oneriGunu = useOneriGunu();
  const [mod, setMod] = useState<Mod>(ilkMod);
  const [yenile, setYenile] = useState(false);
  /*
   * Karar formu bölümlerin üstünde açılıyor; alttaki düğmeye basan kişi
   * pencereyi aşağı kaydırmışsa form görünmüyordu (kullanıcı: telefonda
   * "Gündeme ekle" hiçbir şey yapmamış gibi). Açılınca forma kayılır, ilk
   * alana odaklanılır.
   */
  const formRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = formRef.current;
    if (!mod || !f) return;
    f.scrollIntoView({ block: "start", behavior: "smooth" });
    // Telefonda odak klavyeyi açıp formu kapatırdı; yalnız fareli cihazda.
    if (matchMedia("(hover: hover)").matches) f.querySelector<HTMLElement>("input:not([type=hidden]):not([disabled]), select, textarea")?.focus({ preventScroll: true });
  }, [mod]);
  const sayfa = !kapat;
  /*
   * Karttaki hızlı düğmeyle açılan form bitince pencere de kapanıyor.
   * Pencerede seçilen karar formu (plana ekle, reddet, düzeltmeye gönder)
   * karar verildiyse pencereyi de kapatıyor: kullanıcı ayrıca kapatıyordu
   * (mobil denetim, akış önerisi). Vazgeçilen form yalnız kendini kapatır;
   * kararın izi önerinin durumu ve plandaki yeri.
   */
  const kararIzi = (x: Oneri | undefined, d: Durum) => (x ? `${x.durum}|${oneriYeri(d, x) ? 1 : 0}|${x.planId ?? ""}|${x.paketId ?? ""}` : "");
  const izRef = useRef("");
  const kararModu = mod === "ekle" || mod === "ret" || mod === "duzelt";
  useEffect(() => {
    if (kararModu) izRef.current = kararIzi(o, getir());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod]);
  const formKapat = () => {
    if (kapat && (ilkMod || (kararModu && kararIzi(getir().oneriler.find((x) => x.id === o.id), getir()) !== izRef.current))) return kapat();
    setMod(null);
  };

  const yer = oneriYeri(v, o);
  const plan = planBul(v, o.planId);
  const paket = paketBul(v, o.paketId);
  const dosya = baslikBul(v, o.baslikId);
  const giren = kisiBul(v, o.giren);
  const haftaPlani = yer?.hafta ?? (o.hafta ? v.haftalik.find((h) => h.baslangic === o.hafta) : undefined);
  const yanit = v.yanitlar.find((y) => y.id === o.yanitId);
  const hareketler = v.hareketler.filter((h) => h.oneriId === o.id && !(kisitliKisi(ben) && MASA_HAREKETLERI.includes(h.tip)));
  const mesajSayisi = v.mesajlar.filter((m) => m.oneriId === o.id).length;
  const arka = arkaPlan(o);
  const arsivde = oneriArsivde(o, bugun());
  const hedefler = geriAlabilir(ben) ? oneriGeriHedefleri(v, o) : [];

  // Kararlar: eski ayrıntı ve plan ekranının kuralları birleşik.
  const talimat = !!o.talimatVeren;
  const muhabirde = o.durum === "duzeltme";
  // Açık haftanın gündemindeki önerinin kararı toplantıda: ret, düzeltme ve takip önce "Gündemden çıkar" ister.
  const gundemde = acikGundemde(v, o);
  const degerlendirir = yapabilir(ben, "oneriDegerlendir") && !["planaEklendi", "teklif", "geriCekildi", "reddedildi"].includes(o.durum) && !yer;
  // Doğrudan görevlendirilmiş öneri ("plana eklendi" ama planda kaydı yok) yine plana eklenir; görev paketi onaylı PKG olarak girer.
  const gorevli = yapabilir(ben, "oneriDegerlendir") && !!oneriBekleyenGorevPaketi(v, o) && !oneriPlanKaydi(v, o);
  const ekler = (degerlendirir && !muhabirde && (!!ekleFormu || !!o.hedefTarih || (!!haftaPlani && !haftaPlani.kalemler.some((k) => k.oneriId === o.id)))) || (gorevli && (!!ekleFormu || !!o.hedefTarih));
  const reddeder = degerlendirir && !gundemde && !talimat;
  const duzeltir = degerlendirir && !gundemde && oneriDuzeltmeyeGider(ben, o);
  const takibeAlir = ertelenebilir && degerlendirir && !gundemde && !talimat && !muhabirde && !!o.muhabirId && o.durum !== "takip";
  const paketEklenir = oneriyePaketEklenebilir(ben, v, o);

  const onayla = (soru: Anahtar, f: () => boolean, bitti: Anahtar) => {
    if (confirm(t(soru)) && f()) bildir(t(bitti));
  };
  const sil = () => {
    // E-postadan doğmuş, karara girmemiş öneri izsiz siliniyor ("günaydın" yanıtı gibi); öbürü izleriyle.
    if (epostaOnerisiSilinir(ben, v, o)) {
      if (!confirm(t("epostaOnerisiSilOnay")) || !epostaOnerisiSil(ben, o.id)) return;
    } else {
      const n = temizle(v, { turler: ["oneriler"], idler: [o.id] }).toplam;
      if (!confirm(t("oneriSilOnay", { n })) || oneriSil(ben, o.id) === null) return;
    }
    bildir(t("oneriSilindi"));
    if (sayfa) git("oneriler");
    else kapat?.();
  };
  const kopyala = () => {
    if (!confirm(t("kopyaOnay"))) return;
    const id = oneriKopyala(ben, o.id);
    if (id) {
      bildir(t("bKopyaAcildi"));
      git(`oneriler/${id}`);
    }
  };

  const madde = (anahtar: string, ikon: ReactNode, metin: string, f: () => void, veri: string, kotu = false) => (
    <button key={anahtar} type="button" role="menuitem" className={`acilir-satir${kotu ? " kotu-yazi" : ""}`} onClick={f} {...{ [veri]: true }}>
      {ikon} {metin}
    </button>
  );
  const menu = [
    oneriDogrudanGorevlendirebilir(ben, o, v) && madde("gorev", <ClipboardList size={16} />, t("ogDogrudanGorevlendir"), () => setMod("gorev"), "data-oneri-dogrudan-gorev"),
    masayaSorabilir(ben, o, v) && madde("masa", <Share2 size={16} />, t("msMasayaIlet"), () => setMod("masa"), "data-masaya-sor-ac"),
    teklifKarariVerebilir(ben, o) && madde("tdeg", <Clock size={16} />, t("degerlendirmeyeAl"), () => oneriDurum(ben, o.id, "degerlendiriliyor"), "data-teklif-degerlendir"),
    teklifKarariVerebilir(ben, o) && madde("ttkp", <Lightbulb size={16} />, t("takibeAl"), () => oneriDurum(ben, o.id, "takip") && bildir(t("bTakibeAlindi")), "data-teklif-takip"),
    ertelenebilir && degerlendirir && o.durum === "yeni" && madde("deg", <Clock size={16} />, t("degerlendirmeyeAl"), () => oneriDurum(ben, o.id, "degerlendiriliyor"), "data-degerlendirmeye-al"),
    duzeltir && madde("duz", <Undo2 size={16} />, t("duzeltmeyeGonder"), () => setMod("duzelt"), "data-duzeltmeye-gonder"),
    takibeAlir && madde("tkp", <Lightbulb size={16} />, t("takipOlarakKalsin"), () => oneriDurum(ben, o.id, "takip") && bildir(t("bTakibeAlindi")), "data-takip-olarak-kalsin"),
    // Weekly'nin önerisi haftalık planın gündemine orada (gün ve dosya seçilerek) giriyor.
    !ekleFormu && degerlendirir && !muhabirde && haftaPlani && (
      <a key="hafta" role="menuitem" className="acilir-satir" href={`#/haftalik/${haftaPlani.id}`}>
        <ExternalLink size={16} /> {t("haftalikPlandaDegerlendir")}
      </a>
    ),
    yapabilir(ben, "oneriDegerlendir") && !!yer && madde("kopya", <Copy size={16} />, t("baskaPlanaEkle"), kopyala, "data-oneri-kopyala"),
    hedefler.length > 0 && madde("geri", <Undo2 size={16} />, t("geriAlAsama"), () => setMod("geriAl"), "data-oneri-geri-al"),
    oneriGeriCekebilir(ben, o) && madde("cek", <Undo2 size={16} />, t("geriCek"), () => onayla("geriCekOnay", () => oneriGeriCek(ben, o.id), "bGeriCekildi"), "data-oneri-geri-cek"),
    !arsivde && yapabilir(ben, "oneriDegerlendir") && madde("ars", <Archive size={16} />, t("arsiveGonder"), () => onayla("arsiveGonderOnay", () => oneriArsiveGonder(ben, o.id), "bArsiveGonderildi"), "data-oneri-arsive"),
    arsivde && arsivdenCikarabilir(ben) && madde("arc", <ArchiveRestore size={16} />, t("arsivdenCikar"), () => onayla("arsivdenCikarOnay", () => oneriArsivdenCikar(ben, o.id), "bArsivdenCikti"), "data-oneri-arsivden"),
    (epostaOnerisiSilinir(ben, v, o) || oneriSilebilir(ben)) &&
      madde("sil", <Trash2 size={16} />, t(epostaOnerisiSilinir(ben, v, o) ? "sil" : "oneriSil"), sil, epostaOnerisiSilinir(ben, v, o) ? "data-eposta-oneri-sil" : "data-oneri-sil", true),
  ].filter(Boolean);

  const alt = (
    <>
      <OneriKisisi ben={ben} oneri={o} d={v} />
      {menu.length > 0 && (
        <IslemMenusu etiket={t("digerIslemler")} dugmeSinifi="dugme dugme-ikincil dugme-ikon" menuSinifi="plan-menusu" katman>
          {menu}
        </IslemMenusu>
      )}
      <PlandanCikarDugmesi ben={ben} oneri={o} d={v} />
      {paketEklenir && mod !== "paket" && (
        <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setMod("paket")} data-oneriye-paket={o.id}>
          <Plus size={14} /> {t("paketOnerisiEkle")}
        </button>
      )}
      {/* Form açıkken kararın düğmesi formda; altta ikinci kez durmasın. */}
      {reddeder && !mod && (
        <button type="button" className="dugme dugme-ikincil kotu-yazi" onClick={() => setMod("ret")} data-oneri-reddet>
          <Ban size={15} /> {t("reddet")}
        </button>
      )}
      {ekler && !mod && (
        <button type="button" className="dugme" onClick={() => setMod("ekle")} data-oneri-plana-ekle>
          {ekleMetni ?? t(o.hedefTarih ? "planaEkle" : "gundemeEkle")}
        </button>
      )}
    </>
  );

  const form =
    mod === "ekle" ? (
      ekleFormu ? ekleFormu(o, formKapat) : <PlanaEkle ben={ben} oneri={o} kapat={formKapat} />
    ) : mod === "ret" ? (
      <RetFormu ben={ben} oneri={o} kapat={formKapat} />
    ) : mod === "duzelt" ? (
      <DuzeltmeFormu ben={ben} oneri={o} kapat={formKapat} />
    ) : mod === "gorev" ? (
      <div className="form-kutu" data-oneri-gorev-formu>
        <GorevlendirFormu ben={ben} oneri={o} kapat={formKapat} />
      </div>
    ) : mod === "masa" ? (
      <MasayaSorFormu ben={ben} oneri={o} kapat={formKapat} />
    ) : mod === "paket" ? (
      <PaketEkleDugmesi ben={ben} oneri={o} d={v} acikBasla kapat={formKapat} />
    ) : mod === "geriAl" ? (
      <GeriAlFormu ben={ben} oneri={o} hedefler={hedefler} kapat={formKapat} />
    ) : mod === "duzenle" ? (
      <div className="form-kutu" data-oneri-duzenle-formu>
        <KisaOneriFormu
          takip={!!o.muhabirId && !o.yon}
          muhabirId={o.muhabirId}
          ilk={{ haberBasligi: o.haberBasligi, gelisme: o.gelisme, paketBasligi: o.paketBasligi, islemeFikri: o.islemeFikri, gorselIsleme: o.gorselIsleme, tur: o.tur, bicim: o.bicim, sahaGerekli: o.sahaGerekli }}
          kaydet={(g) => {
            const ok = oneriDuzenle(ben, o.id, g);
            if (ok) bildir(t("bKaydedildi"));
            return ok;
          }}
          kapat={formKapat}
        />
      </div>
    ) : null;

  // Önerinin şimdiki notu Özet'in başında: düzeltme isteği ya da ret/erteleme gerekçesi.
  const simdikiNot = o.durum === "duzeltme" ? o.duzeltmeNotu : ["reddedildi", "sonra", "geriCekildi"].includes(o.durum) ? o.gerekce : undefined;
  const ilgili = esOneriler(v, o).length > 0 || (!kisitliKisi(ben) && baglanabilirKayitlar(v, o).length > 0);

  const govde = (
    <>
      <OneriYolu oneri={o} d={v} kapat={kapat} />
      <TeklifNotu ben={ben} oneri={o} />
      {oneriYenidenGonderebilir(ben, o) && (
        <div className="duzeltme-istegi" data-duzeltme-istegi>
          <NotKutu ton="uyari" ikon={<Undo2 size={16} />}>
            <b>{t("duzeltmeIstegi")}</b>
            <p dir="auto">{o.duzeltmeNotu}</p>
          </NotKutu>
          {yenile ? (
            <KisaOneriFormu
              takip={!!o.muhabirId && !o.yon}
              muhabirId={o.muhabirId}
              ilk={{ haberBasligi: o.haberBasligi, gelisme: o.gelisme, paketBasligi: o.paketBasligi, islemeFikri: o.islemeFikri, gorselIsleme: o.gorselIsleme, tur: o.tur, bicim: o.bicim, sahaGerekli: o.sahaGerekli }}
              kaydet={(g) => {
                const ok = confirm(t("eminMisin")) && oneriYenidenGonder(ben, o.id, g);
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
      {form && (
        <div className="oneri-form" data-oneri-mod={mod} ref={formRef}>
          {form}
        </div>
      )}
      <Bolum ad="ozet" baslik={t("obOzet")} acik>
        {simdikiNot && !oneriYenidenGonderebilir(ben, o) && (
          <NotKutu ton="uyari">
            <span dir="auto">{simdikiNot}</span>
          </NotKutu>
        )}
        {oneriDuzenleyebilir(ben, o) && mod !== "duzenle" && (
          <div className="dugmeler oneri-duzenle">
            <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setMod("duzenle")} data-oneri-duzenle>
              <Pencil size={14} /> {t("duzenle")}
            </button>
          </div>
        )}
        {arka && (
          <div>
            <div className="alan-etiket">{t("haberBasligi")}</div>
            <Icerik blok className="op-arka">
              {arka}
            </Icerik>
          </div>
        )}
        <div className="metin-kutu" data-oneri-gelismesi>
          <Icerik blok>{o.gelisme}</Icerik>
        </div>
        <TakipSatirlari ben={ben} oneri={o} />
      </Bolum>
      <Bolum ad="plan" baslik={t("obPlanOneri")} acik={sayfa || ilgili}>
        <div className="alanlar">
          <div className="alan">
            <small>{t("hedefPlan")}</small>
            {/* Plan etiketi başlığın altındaki bilgi satırında; burada tekrar etmesin. */}
            <b data-oneri-gunu>{oneriGunu(o)}</b>
          </div>
          {(plan || haftaPlani) && (
            <div className="alan">
              <small>{t("plan")}</small>
              {plan ? <a href={`#/nextday/${plan.id}`}>{tarihYaz(plan.tarih, dil, "kisa")}</a> : <a href={`#/haftalik/${haftaPlani!.id}`}>{t("haftalik")}</a>}
            </div>
          )}
          {dosya && (
            <div className="alan">
              <small>{t("dosya")}</small>
              <b>
                <Icerik>{dosya.ad}</Icerik>
              </b>
            </div>
          )}
          {paket && (
            <div className="alan">
              <small>{t("paketOnerisi")}</small>
              <span>
                <a href={`#/paketler/${paket.id}`}>{paket.kod}</a> <PaketDurumRozeti paket={paket} />
              </span>
            </div>
          )}
          <div className="alan">
            <small>{t("tur")}</small>
            <TurRozeti tur={o.tur} />
          </div>
          <div className="alan">
            <small>{t("saha")}</small>
            <b>{t(o.sahaGerekli ? "evet" : "hayir")}</b>
          </div>
          {o.kaynakTuru && (
            <div className="alan">
              <small>{t("kaynak")}</small>
              <KaynakRozeti oneri={o} />
            </div>
          )}
          {giren && (
            <div className="alan">
              <small>{t(o.yon ? "oneren" : "giren")}</small>
              <b>{ad(giren)}</b>
            </div>
          )}
          <div className="alan">
            <small>{t("kanal")}</small>
            <b>
              {t(KANAL_ADI[o.kanal])} · {tarihYaz(yerelGun(o.zaman), dil, "kisa")} {saatYaz(o.zaman, dil)}
            </b>
          </div>
        </div>
        <BagliOneriler oneri={o} />
        <EsOneriler ben={ben} oneri={o} />
        <PlandakineBagla ben={ben} oneri={o} />
      </Bolum>
      <Bolum ad="materyal" baslik={t("obMateryal")} acik={sayfa}>
        <OneriIslemeMetinleri o={o} />
        {o.ilkHali && (
          <details className="ara-ust-2 ilk-hal" data-oneri-ilk-hali>
            <summary>{t("oneriIlkHali")}</summary>
            <Icerik blok>{o.ilkHali.haberBasligi}</Icerik>
            <Icerik blok>{o.ilkHali.gelisme}</Icerik>
            {o.ilkHali.paketBasligi && <Icerik blok>{o.ilkHali.paketBasligi}</Icerik>}
          </details>
        )}
        {yanit && <EpostaKaynagi ben={ben} oneri={o} yanit={yanit} />}
      </Bolum>
      <Bolum ad="degerlendirme" baslik={t("degerlendirme")} acik={sayfa}>
        <YzHaberDegeri ben={ben} oneri={o} ulkeAdi={t(ulkeAdi(o.ulke))} />
        <MasaBolumu ben={ben} oneri={o} />
        {/* Önceki düzeltme isteği: düzeltilip gönderildiyse neye göre düzeltildiği burada kalıyor. */}
        {o.duzeltmeNotu && o.durum !== "duzeltme" && (
          <div className="ara-ust-2">
            <div className="alan-etiket">
              {t("duzeltmeIstegi")}
              {(o.duzeltmeSayisi ?? 0) > 1 && ` · ${t("duzeltmeSayisi", { n: o.duzeltmeSayisi! })}`}
            </div>
            <NotKutu ikon={<Undo2 size={16} />}>
              <span dir="auto">{o.duzeltmeNotu}</span>
            </NotKutu>
          </div>
        )}
        {o.gerekce && !simdikiNot && (
          <NotKutu>
            <span dir="auto">{o.gerekce}</span>
          </NotKutu>
        )}
        <GeriBildirimBolumu ben={ben} oneri={o} />
        {arsivde && <Rozet>{t("arsivde")}</Rozet>}
      </Bolum>
      {o.muhabirId && (
        <Bolum ad="yazisma" baslik={t("yazisma")} ek={String(mesajSayisi)} acik={sayfa}>
          <OneriYazismasi ben={ben} oneri={o} kart={false} />
        </Bolum>
      )}
      <Bolum ad="gecmis" baslik={t("hareketGecmisi")} ek={String(hareketler.length)} acik={false}>
        {hareketler.length ? <HareketGecmisi hareketler={hareketler} d={v} /> : <Bos kucuk metin={t("kayitYok")} />}
      </Bolum>
    </>
  );

  const baslik = (
    <>
      <Icerik>{baslikOf(o)}</Icerik> <OneriDurumRozeti oneri={o} planaGizle />
    </>
  );

  if (kapat)
    return (
      <Pencere baslik={baslik} alt={<OneriMetaSatiri oneri={o} d={v} bagli kapat={kapat} />} kapat={kapat} altBilgi={alt}>
        {govde}
      </Pencere>
    );
  return (
    <div className="oneri-sayfa">
      <GeriBag href="#/oneriler" metin={t(ben.birim === "muhabir" ? "mOnerilerim" : "mOneriler")} />
      <header className="sayfa-basi">
        <div>
          <h1>{baslik}</h1>
          <p>
            <OneriMetaSatiri oneri={o} d={v} bagli />
          </p>
        </div>
      </header>
      <div className="oneri-alt" data-oneri-alt>
        {alt}
      </div>
      <div className="oneri-govde">{govde}</div>
    </div>
  );
}

/* Önerinin bir önceki aşamaya dönmesi: dönülebilecek aşamalar sorulur. */
function GeriAlFormu({ ben, oneri: o, hedefler, kapat }: { ben: Kisi; oneri: Oneri; hedefler: OneriGeriHedefi[]; kapat: () => void }) {
  const { t } = useDil();
  const [h, setH] = useState(hedefler[0]);
  const yap = () => {
    if (!h || !confirm(t("geriAlOnay", { asama: t(ONERI_DURUM_ADI[h]) }))) return;
    const r = oneriAsamayaDon(ben, o.id, h);
    if (r === "tamam") {
      bildir(t("bGeriAlindi"));
      kapat();
    } else if (r === "paketIlerledi") bildir(t("bPaketIlerledi"));
  };
  return (
    <div className="form form-kutu" data-geri-al-formu>
      <fieldset className="secim-satiri">
        <legend>{t("geriAlHedef")}</legend>
        {hedefler.map((x) => (
          <label key={x} className="secim">
            <input type="radio" name={`geri-${o.id}`} checked={h === x} onChange={() => setH(x)} data-geri-hedef={x} />
            {t(ONERI_DURUM_ADI[x])}
          </label>
        ))}
      </fieldset>
      <div className="form-alt">
        <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
          {t("iptal")}
        </button>
        <button type="button" className="dugme dugme-kucuk" onClick={yap} data-geri-al-onay>
          {t("geriAlAsama")}
        </button>
      </div>
    </div>
  );
}

/**
 * Plan ekranının öneri listesi: kart ızgarası ya da satırlar, tek pencere.
 * Kartta yalnız hızlı "ekle" ve "reddet" (kullanıcı); öbür kararlar
 * pencerede. Ekranlar ekleme formunu veriyor (Next Day'de plana, haftalıkta
 * gündeme); değerlendirmeye alma ve takip yalnız Next Day'de.
 */
export function OneriListesi({
  ben,
  d,
  oneriler,
  gorunum,
  pencere,
  setPencere,
  ekleMetni,
  ekleFormu,
  ertelenebilir = false,
}: {
  ben: Kisi;
  d: Durum;
  oneriler: Oneri[];
  gorunum: Gorunum;
  pencere: PencereDurumu;
  setPencere: (p: PencereDurumu) => void;
  ekleMetni: string;
  ekleFormu?: (o: Oneri, kapat: () => void) => ReactNode;
  ertelenebilir?: boolean;
}) {
  const { t } = useDil();
  const kapat = () => setPencere(null);
  // Pencere listeden değil bütün öneriler içinden: plana eklenen öneri listeden düşse de pencere kapanana kadar dursun.
  const acik = pencere ? d.oneriler.find((o) => o.id === pencere.id) : undefined;

  const hizli = (o: Oneri) => {
    if (!yapabilir(ben, "oneriDegerlendir")) return undefined;
    // Muhabire önerilen haberde sıra muhabirde; gündeme alınmış öneri de karar almış sayılıyor.
    const kararAcik = !["reddedildi", "planaEklendi", "teklif", "geriCekildi"].includes(o.durum) && !oneriYeri(d, o);
    if (!kararAcik) return undefined;
    // Düzeltmedeki öneride sıra muhabirde; Planlama yalnız vazgeçip reddedebiliyor.
    const ekle = o.durum !== "duzeltme";
    const ret = !o.talimatVeren && !acikGundemde(d, o);
    if (!ekle && !ret) return undefined;
    return (
      <>
        {ret && (
          <button type="button" className="dugme dugme-sade dugme-ikon dugme-kucuk kotu-yazi" onClick={() => setPencere({ id: o.id, mod: "ret" })} title={t("reddet")} aria-label={t("reddet")} data-oneri-hizli-ret>
            <Ban size={15} />
          </button>
        )}
        {ekle && (
          <button type="button" className="dugme dugme-kucuk" onClick={() => setPencere({ id: o.id, mod: "ekle" })} data-oneri-ekle>
            {ekleMetni}
          </button>
        )}
      </>
    );
  };

  return (
    <>
      {oneriler.length === 0 ? (
        <Bos kucuk metin={t("oneriYok")} />
      ) : gorunum === "kart" ? (
        <div className="oneri-kartlari">
          {oneriler.map((o) => (
            <OneriKarti key={o.id} oneri={o} d={d} ac={() => setPencere({ id: o.id, mod: "goster" })} eylemler={hizli(o)} />
          ))}
        </div>
      ) : (
        oneriler.map((o) => <OneriSatiri key={o.id} oneri={o} d={d} ac={() => setPencere({ id: o.id, mod: "goster" })} eylemler={hizli(o)} />)
      )}
      {acik && (
        <OneriAyrinti
          key={acik.id}
          ben={ben}
          oneri={acik}
          kapat={kapat}
          ekleMetni={ekleMetni}
          ekleFormu={ekleFormu}
          ertelenebilir={ertelenebilir}
          ilkMod={pencere?.mod === "ekle" || pencere?.mod === "ret" || pencere?.mod === "duzelt" ? pencere.mod : null}
        />
      )}
    </>
  );
}

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
 * Eş öneri (aynı muhabirin aynı haberi iki kayıtta; oneriPlanlari.ts → esOneriler):
 * ayrıntıda listelenir, yetkili asıla (muhabirin gönderdiğine) katar. Onay sorulur:
 * kopya silinir, geri alınamaz.
 */
export function esBirlestirSor(ben: Kisi, asil: Oneri, kopya: Oneri, t: (k: Anahtar) => string): boolean {
  if (!confirm(t("esBirlestirOnay").replace("{kopya}", kopya.haberBasligi))) return false;
  if (!oneriBirlestir(ben, asil.id, kopya.id)) return false;
  bildir(t("esBirlestirildi"));
  return true;
}

function EsOneriler({ ben, oneri: o }: { ben: Kisi; oneri: Oneri }) {
  const { t } = useDil();
  const v = useVeri();
  const esler = esOneriler(v, o);
  if (!esler.length || ben.birim === "muhabir") return null;
  return (
    <div className="ara-ust-2" data-es-oneriler>
      <div className="alan-etiket">{t("esOneriler")}</div>
      <ul className="liste">
        {esler.map((x) => {
          const asil = esAsili(o, x);
          const kopya = asil === o ? x : o;
          return (
            <li key={x.id} data-es-oneri={x.id}>
              <small className="soluk">{t(x.giren ? "esElle" : "esAsil")}</small>{" "}
              <a href={`#/oneriler/${x.id}`}>
                <Icerik>{x.haberBasligi}</Icerik>
              </a>{" "}
              <OneriDurumRozeti oneri={x} />{" "}
              {oneriBirlestirebilir(ben, asil, kopya) && (
                <button
                  type="button"
                  className="dugme dugme-ikincil dugme-kucuk"
                  onClick={() => {
                    if (esBirlestirSor(ben, asil, kopya, t) && kopya === o) git(`oneriler/${asil.id}`);
                  }}
                  data-es-birlestir
                >
                  {t("esBirlestir")}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}


/*
 * Planda muhabirin adına doğrudan açılmış ama öneriye bağlanmamış paket ve gelişmeler
 * (oneriPlanlari.ts → baglanabilirKayitlar): öneri onlara bağlanınca "plana eklendi"
 * olur, muhabir aynı işi iki ayrı kayıt olarak görmez.
 */
function PlandakineBagla({ ben, oneri: o }: { ben: Kisi; oneri: Oneri }) {
  const { t, dil } = useDil();
  const v = useVeri();
  if (ben.birim === "muhabir" || !(oneriDuzenleyebilir(ben, o) || ben.hesapYoneticisi)) return null;
  const adaylar = baglanabilirKayitlar(v, o);
  if (!adaylar.length) return null;
  return (
    <div className="ara-ust-2" data-plandakine-bagla>
      <div className="alan-etiket">{t("pbBaslik")}</div>
      <ul className="liste">
        {adaylar.map((x) => (
          <li key={x.tur + x.id} data-bagla-aday={x.id}>
            <small className="soluk">
              {x.tur === "paket" ? "PKG" : t("gelismeMetni")} · {tarihYaz(x.plan.tarih, dil, "kisa")}
              {x.benzer && <> · {t("pbBenzer")}</>}
            </small>{" "}
            <Icerik>{x.metin}</Icerik>{" "}
            <button
              type="button"
              className="dugme dugme-ikincil dugme-kucuk"
              onClick={() => {
                if (!confirm(t("pbBaglaOnay"))) return;
                if (oneriPlandakineBagla(ben, o.id, { tur: x.tur, id: x.id })) bildir(t("pbBaglandi"));
              }}
              data-bagla
            >
              {t("pbBagla")}
            </button>
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
  const [formAcik, setFormAcik] = useState(false);
  const ekler = oneriSatiriEkleyebilir(ben, o);
  const satirlar = [...(o.satirlar ?? [])].reverse();
  if (!ekler && !satirlar.length && o.durum !== "takip") return null;
  const ekle = () => {
    if (!takipSatiriEkle(ben, o.id, metin)) return;
    setMetin("");
    bildir(t("tsEklendi"));
  };
  /*
   * Satırı olmayan öneride kart boş bir yazı kutusu ve "kayıt yok"tan ibaretti,
   * pencere aşağı doğru uzuyordu (kullanıcı): o zaman yalnız "Gelişme ekle"
   * düğmesi, basınca form.
   */
  if (ekler && !satirlar.length && !formAcik)
    return (
      <div className="ara-ust-2">
        <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setFormAcik(true)} data-takip-satiri-ac>
          <Lightbulb size={14} /> {t("tsEkle")}
        </button>
      </div>
    );
  return (
    <Kart baslik={t("tsGelismeler")} ikon={<Lightbulb size={18} />}>
      {ekler && (
        <div className="form ara-alt-2" data-takip-satiri-formu>
          <textarea {...icerikAlani} rows={2} value={metin} onChange={(e) => setMetin(e.target.value)} data-takip-satiri />
          <div className="form-alt">
            <button type="button" className="dugme dugme-kucuk" disabled={!metin.trim()} onClick={ekle} data-takip-satiri-ekle>
              {/* Açan düğmeyle aynı adı taşımasın (M-46): ardışık iki "Gelişme ekle" vardı. */}
              {t("ekle")}
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

