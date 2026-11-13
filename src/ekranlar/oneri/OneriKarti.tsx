import { CircleCheck, LayoutGrid, List, MapPinned, Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Icerik, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { OneriYolu } from "../../bilesenler/OneriYolu";
import { baslikaGit } from "../../bilesenler/baslikaGit";
import { oneriYolu } from "../../oneriYolu";
import { OneriAvatari, OneriDurumRozeti, OneriKaynagi, OneriPlanEtiketleri } from "../../bilesenler/Tablolar";
import { gecenSure, tarihYaz, useDil } from "../../dil";
import { BICIM_ADI, TUR_ADI, ulkeAdi } from "../../etiketler";
import { oneriDuzeltmeIste, oneriDurum, oneriGorunumuKaydet, oneriPlandanCikar, oneriyePaketEkle, oneriyePaketEklenebilir } from "../../eylemler";
import { oneriAraligi, oneriYeri } from "../../oneriPlanlari";
import { useVeri, type Durum, type Kisi, type Oneri, type OneriGorunumu } from "../../veri";
import { haftalikDuzenler, planIcerikDuzenler, yapabilir } from "../../yetki";
import { FormAlt } from "../nextday/Formlar";
import { useBen } from "../../oturum";
import { MasaRozeti } from "./MasaSorusu";

/*
 * Plan hazırlanırken gelen öneri: müstakil kart, basınca pencerede bütün
 * öneri (OneriGovde.tsx). Kararlar pencerede; kartta yalnız hızlı "ekle" ve
 * "reddet", ızgara form açılınca dağılmıyor.
 */

/** Kartın başlığı önerilen paket; muhabir paket önermediyse haberin kendisi. */
export const baslikOf = (o: Oneri) => o.paketBasligi || o.haberBasligi;
/** Arka plan haberi yalnız başlıktan farklıysa ayrı satır. */
export const arkaPlan = (o: Oneri) => (o.paketBasligi && o.paketBasligi !== o.haberBasligi ? o.haberBasligi : undefined);

export type Gorunum = OneriGorunumu;
export type PencereDurumu = { id: string; mod: "goster" | "ekle" | "ret" | "duzelt" } | null;

/* Görünüm kişinin tercihi (ana sayfa düzeni gibi kayıtta); seçmediyse kart. */
export function useOneriGorunumu(ben: Kisi): [Gorunum, (g: Gorunum) => void] {
  const v = useVeri();
  return [v.oneriGorunumu?.[ben.id] ?? "kart", (g) => oneriGorunumuKaydet(ben, g)];
}

export function GorunumSecici({ deger, degistir }: { deger: Gorunum; degistir: (g: Gorunum) => void }) {
  const { t } = useDil();
  const secenek = (g: Gorunum, ikon: ReactNode, ad: string) => (
    <button type="button" className={`dugme dugme-sade dugme-kucuk ${deger === g ? "secili" : ""}`} aria-pressed={deger === g} onClick={() => degistir(g)}>
      {ikon} {ad}
    </button>
  );
  return (
    <div className="gorunum-secici" role="group" aria-label={t("gorunum")}>
      {secenek("kart", <LayoutGrid size={15} />, t("kartGorunumu"))}
      {secenek("liste", <List size={15} />, t("listeGorunumu"))}
    </div>
  );
}

/** Sürüklenen önerinin veri türü: yeni Next Day görünümünde başlığa bırakılır. */
export const ONERI_TURU = "application/x-plannersflow-oneri";

/*
 * Kart yalnız taramak için (kullanıcı: kart karışık, yer kaplıyor; tıklayınca
 * ayrıntı): üç satır. Başlık ve tek durum rozeti; bilgi satırı (gün, plan,
 * ülke, haber türü, saha, birim görüşü); kaynak, geçen süre ve hızlı karar.
 * Kol rengi yalnız şeritte, adı ipucunda. Gelişme, gerekçe, yapay zeka
 * rozeti ve silme pencerede.
 */
export function OneriKarti({ oneri: o, d, ac, eylemler }: { oneri: Oneri; d: Durum; ac: () => void; eylemler?: ReactNode }) {
  const { t, dil } = useDil();
  return (
    <article
      className={`oneri-karti tur-${o.tur} ${o.talimatVeren ? "talimat" : ""} ${o.durum === "reddedildi" || o.durum === "geriCekildi" ? "sonuk-kart" : ""}`}
      data-oneri={o.id}
      title={t(TUR_ADI[o.tur])}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(ONERI_TURU, o.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      // Kartın boş yerine basmak da açıyor; düğme ve bağlantılar kendi işini yapsın.
      onClick={(e) => !(e.target as HTMLElement).closest("button, a") && ac()}
    >
      <div className="ok-bas">
        <button type="button" className="ok-baslik" onClick={ac} aria-label={`${t("oneriyiAc")}: ${baslikOf(o)}`}>
          <Icerik blok>{baslikOf(o)}</Icerik>
        </button>
        <OneriDurumRozeti oneri={o} planaGizle />
      </div>
      <OneriMetaSatiri oneri={o} d={d} />
      <div className="ok-alt">
        <OneriAvatari oneri={o} d={d} />
        <span className="ok-kaynak">
          <OneriKaynagi oneri={o} d={d} girensiz />
        </span>
        <span className="sonuk">· {gecenSure(o.zaman, dil)}</span>
        {eylemler && <div className="ok-hizli">{eylemler}</div>}
      </div>
      <OneriYolu oneri={o} d={d} ince />
    </article>
  );
}

/** Önerinin günü kısa yazımla (bilgi satırı); eski haftalık öneride "Weekly". */
export function useKisaGun() {
  const { t, dil } = useDil();
  return (o: Oneri) => {
    // Günü olmayan haftalık öneri: haftanın günü girildiyse o gün, değilse "zamana bağlı değil".
    if (o.hafta && !o.hedefTarih) return o.haftaGunu ? tarihYaz(o.haftaGunu, dil, "kisa") : t("zamanaBagliDegil");
    const a = oneriAraligi(o);
    if (!a) return "";
    return a[0] === a[1] ? tarihYaz(a[0], dil, "kisa") : `${tarihYaz(a[0], dil, "kisa")} – ${tarihYaz(a[1], dil, "kisa")}`;
  };
}

/**
 * Kartın, liste satırının ve pencerenin bilgi satırı: aynı bilgi bir kez.
 * Plana girmiş öneride plan etiketi yerine girdiği plan ve başlık (yeşil);
 * birim görüşü sorulduysa birimi ve durumu. `bagli`: etikete basınca plan açılır.
 */
export function OneriMetaSatiri({ oneri: o, d, bagli = false, kapat }: { oneri: Oneri; d: Durum; bagli?: boolean; kapat?: () => void }) {
  const { t } = useDil();
  const ben = useBen();
  const gun = useKisaGun()(o);
  const yer = oneriYeri(d, o);
  return (
    <span className="ok-meta" data-oneri-meta>
      {/* Plana girmişse gün planın notunda; iki kez yazılmasın. */}
      {gun && !yer && <span className="ok-gun">{gun}</span>}
      {yer ? <PlanaEklendiNotu oneri={o} d={d} bagli={bagli} kapat={kapat} /> : <OneriPlanEtiketleri oneri={o} d={d} bagli={bagli} />}
      <span>{t(ulkeAdi(o.ulke))}</span>
      {o.bicim && <span>{t(BICIM_ADI(o.bicim))}</span>}
      {o.sahaGerekli && (
        <span className="ok-saha" title={t("sahaGerekli")} aria-label={t("sahaGerekli")}>
          <MapPinned size={14} />
        </span>
      )}
      {ben && <MasaRozeti ben={ben} oneri={o} />}
    </span>
  );
}

/*
 * Plana ya da haftalık gündeme eklenen öneri listede kalıyor; altında
 * girdiği plan ve başlık. İki plana düşen öneride hangisine girdiği
 * buradan okunuyor.
 */
export function PlanaEklendiNotu({ oneri: o, d, bagli = false, kapat }: { oneri: Oneri; d: Durum; bagli?: boolean; kapat?: () => void }) {
  const { t, dil } = useDil();
  const yer = oneriYeri(d, o);
  if (!yer) return null;
  const baslikId = yer.planda ? o.baslikId : (yer.kalem?.baslikId ?? o.baslikId);
  const baslik = baslikId ? d.basliklar.find((b) => b.id === baslikId)?.ad : undefined;
  const gun = yer.planda ? yer.plan?.tarih : yer.kalem?.tarih;
  const icerik = (
    <>
      <CircleCheck size={14} /> {t(yer.planda ? "odPlanaEklendi" : "odGundemeEklendi")} · {t(yer.planda ? "mNextday" : "mHaftalik")}
      {gun && ` ${tarihYaz(gun, dil, "kisa")}`}
      {baslik && (
        <>
          {" · "}
          <Icerik>{baslik}</Icerik>
        </>
      )}
    </>
  );
  // Pencerede plana götürür: Next Day'de önerinin girdiği başlığa kayıp onu vurgular.
  const git = !bagli ? undefined : yer.planda && yer.plan ? () => {
    const pb = oneriYolu(d, o).planBaslikId;
    kapat?.();
    baslikaGit(yer.plan!.id, pb);
  } : yer.hafta ? () => (kapat?.(), (location.hash = `#/haftalik/${yer.hafta!.id}`)) : undefined;
  return git ? (
    <button type="button" className="ok-plana-eklendi bag" onClick={git} data-plana-eklendi={yer.planda ? "nextday" : "haftalik"} data-plana-git>
      {icerik}
    </button>
  ) : (
    <span className="ok-plana-eklendi" data-plana-eklendi={yer.planda ? "nextday" : "haftalik"}>
      {icerik}
    </span>
  );
}

/** Düğme çizilecek mi: şeritte boş yer kalmasın diye çizimden önce de soruluyor. */
export const plandanCikarabilir = (ben: Kisi, d: Durum, o: Oneri) => {
  const yer = oneriYeri(d, o);
  if (!yer || !yapabilir(ben, "oneriDegerlendir")) return null;
  return (yer.planda ? !!yer.plan && planIcerikDuzenler(ben, yer.plan) : !!yer.hafta && yer.hafta.durum !== "kesinlesti" && haftalikDuzenler(ben, yer.hafta)) ? yer : null;
};

/** Öneriyi girdiği plandan çıkarma düğmesi; öneri yeniden değerlendirmeye döner. */
export function PlandanCikarDugmesi({ ben, oneri: o, d, sonra }: { ben: Kisi; oneri: Oneri; d: Durum; sonra?: () => void }) {
  const { t } = useDil();
  const yer = plandanCikarabilir(ben, d, o);
  if (!yer) return null;
  const ad = t(yer.planda ? "plandanCikar" : "gundemdenCikar");
  return (
    <button
      type="button"
      className="dugme dugme-ikincil dugme-kucuk"
      onClick={() => {
        if (!confirm(t("plandanCikarOnay"))) return;
        const r = oneriPlandanCikar(ben, o.id);
        if (r === "tamam") {
          bildir(t("bPlandanCikti"));
          sonra?.();
        } else if (r === "paketIlerledi") bildir(t("bPaketIlerledi"));
      }}
      data-plandan-cikar={o.id}
    >
      <X size={14} /> {ad}
    </button>
  );
}

/* Plana paketsiz girmiş öneriye sonradan PKG; strap önerinin strap'i, yoksa Header. */
export function PaketEkleDugmesi({ ben, oneri: o, d, acikBasla = false, kapat }: { ben: Kisi; oneri: Oneri; d: Durum; acikBasla?: boolean; kapat?: () => void }) {
  const { t } = useDil();
  const [acik, setAcikIc] = useState(acikBasla);
  const setAcik = (x: boolean) => (x ? setAcikIc(true) : kapat ? kapat() : setAcikIc(false));
  const [strap, setStrap] = useState(o.paketBasligi || o.haberBasligi);
  if (!oneriyePaketEklenebilir(ben, d, o)) return null;
  if (!acik)
    return (
      <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setAcik(true)} data-oneriye-paket={o.id}>
        <Plus size={14} /> {t("paketOnerisiEkle")}
      </button>
    );
  return (
    <div className="form form-kutu" data-oneriye-paket-formu={o.id}>
      <label>
        {t("onerilenPaketBasligi")}
        <input {...icerikAlani} value={strap} onChange={(e) => setStrap(e.target.value)} data-oneriye-paket-strap />
      </label>
      <div className="form-alt">
        <button type="button" className="dugme dugme-ikincil" onClick={() => setAcik(false)}>
          {t("iptal")}
        </button>
        <button
          type="button"
          className="dugme"
          disabled={!strap.trim()}
          onClick={() => {
            if (!confirm(t("eminMisin"))) return;
            if (oneriyePaketEkle(ben, o.id, strap)) {
              bildir(t("bPaketEklendi"));
              setAcik(false);
            }
          }}
          data-oneriye-paket-kaydet
        >
          {t("kaydet")}
        </button>
      </div>
    </div>
  );
}

/** Liste görünümü: çok öneriyi hızlı taramak için; başlık ve bilgi satırı, gelişme pencerede. */
export function OneriSatiri({ oneri: o, d, ac, eylemler }: { oneri: Oneri; d: Durum; ac: () => void; eylemler?: ReactNode }) {
  const { t, dil } = useDil();
  return (
    <div className={`kayit oneri-satiri tur-${o.tur} ${o.talimatVeren ? "kayit-talimat" : ""}`} data-oneri={o.id}>
      <div className="kayit-bas">
        <OneriAvatari oneri={o} d={d} />
        <div>
          <button type="button" className="ok-baslik" onClick={ac} aria-label={`${t("oneriyiAc")}: ${baslikOf(o)}`}>
            <Icerik blok>{baslikOf(o)}</Icerik>
          </button>
          <small>
            <OneriDurumRozeti oneri={o} planaGizle />
            <OneriMetaSatiri oneri={o} d={d} />
            <span className="sonuk">
              <OneriKaynagi oneri={o} d={d} girensiz /> · {gecenSure(o.zaman, dil)}
            </span>
          </small>
        </div>
        {eylemler && <div className="islemler">{eylemler}</div>}
      </div>
    </div>
  );
}

export function RetFormu({ ben, oneri, kapat }: { ben: Kisi; oneri: Oneri; kapat: () => void }) {
  const { t } = useDil();
  const [gerekce, setGerekce] = useState("");
  return (
    <div className="form form-kutu">
      <label>
        {t("retGerekcesi")}
        <input dir="auto" value={gerekce} onChange={(e) => setGerekce(e.target.value)} autoFocus />
      </label>
      <FormAlt kapat={kapat} kaydet={() => confirm(t("retOnay")) && oneriDurum(ben, oneri.id, "reddedildi", gerekce) && kapat()} kaydetMetni={t("reddet")} />
    </div>
  );
}

/*
 * Düzeltme isteği muhabire gidiyor: ne değişmesi gerektiği yazılmadan
 * gönderilmiyor. Uzun olabileceği için ret gerekçesi gibi tek satır değil.
 */
export function DuzeltmeFormu({ ben, oneri, kapat }: { ben: Kisi; oneri: Oneri; kapat: () => void }) {
  const { t } = useDil();
  const [not, setNot] = useState("");
  const gonder = () => {
    if (!confirm(t("eminMisin")) || !oneriDuzeltmeIste(ben, oneri.id, not)) return;
    bildir(t("bDuzeltmeyeGonderildi"));
    kapat();
  };
  return (
    <div className="form form-kutu" data-duzeltme-formu>
      <label>
        {t("duzeltmeNotu")}
        <textarea dir="auto" rows={4} value={not} onChange={(e) => setNot(e.target.value)} autoFocus />
      </label>
      <FormAlt kapat={kapat} kaydet={gonder} devre={!not.trim()} kaydetMetni={t("duzeltmeyeGonder")} />
    </div>
  );
}
