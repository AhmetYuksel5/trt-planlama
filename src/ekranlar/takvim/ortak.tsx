import {
  Bell,
  Briefcase,
  Building2,
  CalendarHeart,
  Check,
  Circle,
  Gavel,
  Landmark,
  Link2,
  Palette,
  Plane,
  Presentation,
  Radio,
  Repeat,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react";
import { useState, useSyncExternalStore, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { Bos, Icerik, bildir } from "../../bilesenler/Parcalar";
import { aralikYaz, ayAdi, metin, saatYaz, tarihYaz, useDil } from "../../dil";
import { faaliyetDurumAdi, faaliyetTuruAdi, oncelikAdi, ulkeAdi } from "../../etiketler";
import { faaliyetTasi, faaliyetUcu } from "../../eylemler";
import { bekleyenHatirlatmalar, hatirlatmaZamani, olusumBaglantilari, olusumDurumu, yaklasanlar, type Olusum } from "../../takvim";
import { gunEkle, gunFarki } from "../../tarih";
import { faaliyetBul, getir, type Faaliyet, type FaaliyetTuru, type Kisi, type Oncelik } from "../../veri";

/* Takvim ekranlarının ortak parçaları: kart, satır, işaretler, sürükle-bırak. */

/** Medya sorgusu: telefonda takvim ayrı düzende çiziliyor, sürükleme yalnız fareyle. */
export function useMedya(sorgu: string) {
  return useSyncExternalStore(
    (d) => {
      const m = matchMedia(sorgu);
      m.addEventListener("change", d);
      return () => m.removeEventListener("change", d);
    },
    () => matchMedia(sorgu).matches,
  );
}

export const useTelefon = () => useMedya("(max-width: 760px)");

const TUR_IKONU: Record<FaaliyetTuru, LucideIcon> = {
  secim: Vote,
  zirve: Landmark,
  konferans: Presentation,
  toplanti: Users,
  ziyaret: Plane,
  parlamento: Building2,
  dava: Gavel,
  spor: Trophy,
  kultur: Palette,
  ekonomi: TrendingUp,
  ozelGun: Star,
  yildonumu: CalendarHeart,
  ozelYayin: Radio,
  gorevlendirme: Briefcase,
  diger: Circle,
};

export function TurIkonu({ tur, boy = 14 }: { tur: FaaliyetTuru; boy?: number }) {
  const { t } = useDil();
  const Ikon = TUR_IKONU[tur];
  return (
    <span className="tk-tur" title={t(faaliyetTuruAdi(tur))}>
      <Ikon size={boy} aria-hidden="true" />
    </span>
  );
}

/* Renk yalnız öncelikte: kritik kırmızı, yüksek turuncu, normal sarı, düşük gri. */
export function OncelikRozeti({ oncelik }: { oncelik: Oncelik }) {
  const { t } = useDil();
  return <span className={`rozet tk-oncelik on-${oncelik}`}>{t(oncelikAdi(oncelik))}</span>;
}

const DURUM_TONU = { taslak: "cizgi", takipte: "vurgu", planaAlindi: "iyi", tamamlandi: "", iptal: "kotu" } as const;

export function DurumRozeti({ o }: { o: Olusum }) {
  const { t } = useDil();
  const d = olusumDurumu(o);
  return <span className={`rozet ${DURUM_TONU[d] ? `rozet-${DURUM_TONU[d]}` : ""}`}>{t(faaliyetDurumAdi(d))}</span>;
}

/** Tarih ve saat: tek günse gün ve saat, çok günlükse aralık. */
export function useTarihMetni() {
  const { dil } = useDil();
  return (o: Olusum, uzun = false) => {
    const gun = o.bas === o.bit ? tarihYaz(o.bas, dil, uzun ? "tam" : "kisa") : aralikYaz(o.bas, o.bit, dil);
    const saat = o.f.saat ? (o.f.bitisSaati ? `${o.f.saat}–${o.f.bitisSaati}` : o.f.saat) : "";
    return saat ? `${gun} · ${saat}` : gun;
  };
}

/** Yer: şehir içerik (Arapça), ülke arayüz dilinde. */
export function FaaliyetYeri({ f }: { f: Faaliyet }) {
  const { t } = useDil();
  if (!f.sehir && !f.ulke) return null;
  return (
    <>
      {f.sehir && <Icerik>{f.sehir}</Icerik>}
      {f.sehir && f.ulke && " · "}
      {f.ulke && t(ulkeAdi(f.ulke))}
    </>
  );
}

/* --- Sürükle-bırak --- */

/*
 * Sürüklenen kart dataTransfer'da değil burada: dragover sırasında
 * tarayıcı veriyi okutmuyor, hedef hücre bırakılabilir mi bilmek için
 * gerekiyor. Taşımada kartın sürüklendiği gün ile bırakıldığı gün
 * arasındaki fark kadar kayıyor: çok günlük faaliyetin üçüncü günü
 * tutulup bırakılsa da süre ve kayma doğru çıkıyor.
 */
type Surukleme = { id: string; mod: "tasi" | "baslangic" | "bitis"; gun: string };
let tasinan: Surukleme | null = null;

const surukleBasla = (e: DragEvent, s: Surukleme) => {
  e.stopPropagation();
  tasinan = s;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", s.id);
};

/** Gün hücresinin bırakma olayları; hedef üstündeyken hücre işaretli. */
export function useBirakma(ben: Kisi | undefined) {
  const { t, dil } = useDil();
  const [uzerinde, setUzerinde] = useState<string | null>(null);
  const birak = (hedef: string) => {
    const s = tasinan;
    tasinan = null;
    setUzerinde(null);
    const f = faaliyetBul(getir(), s?.id);
    if (!s || !f || !ben) return;
    if (s.mod === "tasi") {
      const yeni = gunEkle(f.baslangic, gunFarki(s.gun, hedef));
      if (faaliyetTasi(ben, f.id, yeni)) bildir(t("faaliyetTasindi", { tarih: tarihYaz(yeni, dil, "uzun") }));
    } else if (faaliyetUcu(ben, f.id, s.mod, hedef)) bildir(t("faaliyetTarihDegisti"));
    else if (f[s.mod] !== hedef) bildir(t("faaliyetHata"));
  };
  return (gun: string) => ({
    className: uzerinde === gun ? "uzerinde" : "",
    onDragOver: (e: DragEvent) => {
      if (!tasinan) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (uzerinde !== gun) setUzerinde(gun);
    },
    onDragLeave: (e: DragEvent) => {
      if (!(e.currentTarget as Node).contains(e.relatedTarget as Node)) setUzerinde((u) => (u === gun ? null : u));
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      birak(gun);
    },
  });
}

/* --- Kompakt kart (ay ve hafta görünümü) --- */

export function FaaliyetKarti({ o, gun, ac, surukle = false, saatGoster = false }: { o: Olusum; gun?: string; ac: (o: Olusum) => void; surukle?: boolean; saatGoster?: boolean }) {
  const { t } = useDil();
  const f = o.f;
  const durum = olusumDurumu(o);
  const once = !!gun && o.bas < gun;
  const sonra = !!gun && o.bit > gun;
  /* Tekrarlayan sürüklenmiyor: bir tekrarı taşımak bütün seriyi mi kaydırır belirsiz. */
  const tasinir = surukle && !f.tekrar && !!gun;
  const klavye = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      ac(o);
    }
  };
  const ipucu = [f.baslik, t(faaliyetTuruAdi(f.tur)), t(oncelikAdi(f.oncelik)), t(faaliyetDurumAdi(durum)), tasinir ? t("surukleTasi") : f.tekrar && surukle ? t("tekrarliTasinmaz") : ""]
    .filter(Boolean)
    .join(" · ");
  return (
    <div
      className={`tk-kart on-${f.oncelik} fd-${durum}${once ? " devam-once" : ""}${sonra ? " devam-sonra" : ""}`}
      role="button"
      tabIndex={0}
      title={ipucu}
      data-faaliyet={f.id}
      onClick={(e) => {
        e.stopPropagation();
        ac(o);
      }}
      onKeyDown={klavye}
      draggable={tasinir}
      onDragStart={tasinir ? (e) => surukleBasla(e, { id: f.id, mod: "tasi", gun: gun! }) : undefined}
    >
      {tasinir && gun === o.bas && o.bas !== o.bit && (
        <span className="tk-tutamac bas" draggable title={t("baslangiciDegistir")} aria-label={t("baslangiciDegistir")} onDragStart={(e) => surukleBasla(e, { id: f.id, mod: "baslangic", gun: gun! })} />
      )}
      <TurIkonu tur={f.tur} boy={12} />
      {saatGoster && f.saat && <time className="tk-saat">{f.saat}</time>}
      <Icerik blok className="tk-kart-ad">
        {f.baslik}
      </Icerik>
      {f.tekrar && <Repeat size={11} className="tk-isaret" aria-label={t("tekrarlayan")} />}
      {durum === "planaAlindi" && <Link2 size={11} className="tk-isaret" aria-label={t("fd_planaAlindi")} />}
      {durum === "tamamlandi" && <Check size={11} className="tk-isaret" aria-label={t("fd_tamamlandi")} />}
      {tasinir && gun === o.bit && o.bas !== o.bit && (
        <span className="tk-tutamac bit" draggable title={t("bitisiDegistir")} aria-label={t("bitisiDegistir")} onDragStart={(e) => surukleBasla(e, { id: f.id, mod: "bitis", gun: gun! })} />
      )}
    </div>
  );
}

/* --- Satır (listeler, yan panel, plan ekranları) --- */

export function FaaliyetSatiri({ o, ac, ek }: { o: Olusum; ac: (o: Olusum) => void; ek?: ReactNode }) {
  const { t, dil } = useDil();
  const tarihMetni = useTarihMetni();
  const f = o.f;
  const g = new Date(o.bas + "T12:00:00");
  return (
    <li className={`tk-satir on-${f.oncelik} fd-${olusumDurumu(o)}`} data-faaliyet={f.id} data-tarih={o.bas}>
      <button type="button" className="tk-satir-dugme" onClick={() => ac(o)}>
        <span className="tk-tarih-kutu" aria-hidden="true">
          <b>{g.getDate()}</b>
          <small>{ayAdi(o.bas, dil, "kisa")}</small>
        </span>
        <span className="ad">
          <Icerik blok>{f.baslik}</Icerik>
          <small>
            <TurIkonu tur={f.tur} boy={12} /> {t(faaliyetTuruAdi(f.tur))} · {tarihMetni(o)}
            {(f.sehir || f.ulke) && " · "}
            <FaaliyetYeri f={f} />
          </small>
        </span>
        <OncelikRozeti oncelik={f.oncelik} />
      </button>
      {ek}
    </li>
  );
}

/* --- Hatırlatmalar ve yaklaşanlar: takvimin yan paneli ve ana sayfa kartı --- */

export function HatirlatmaListesi({ liste, ac }: { liste: Faaliyet[]; ac: (o: Olusum) => void }) {
  const { t, dil } = useDil();
  const bekleyen = bekleyenHatirlatmalar(liste);
  return bekleyen.length ? (
    <ul className="tk-satirlar">
      {bekleyen.map((o) => {
        const z = hatirlatmaZamani(o)!.toISOString();
        return (
          <FaaliyetSatiri
            key={o.anahtar}
            o={o}
            ac={ac}
            ek={
              <small className="tk-hatirlatma-zamani">
                <Bell size={12} /> {tarihYaz(z, dil, "kisa")} {saatYaz(z, dil)}
              </small>
            }
          />
        );
      })}
    </ul>
  ) : (
    <Bos kucuk metin={t("hatirlatmaYok")} />
  );
}

export function YaklasanListe({ liste, ac, kac = 8 }: { liste: Faaliyet[]; ac: (o: Olusum) => void; kac?: number }) {
  const { t } = useDil();
  const yakin = yaklasanlar(liste, 30).slice(0, kac);
  return yakin.length ? (
    <ul className="tk-satirlar">
      {yakin.map((o) => (
        <FaaliyetSatiri key={o.anahtar} o={o} ac={ac} />
      ))}
    </ul>
  ) : (
    <Bos kucuk metin={t("yaklasanYok")} />
  );
}

/** Plana alınmış mı: tekrarın kendi bağlantısından. */
export const planaAlindiMi = (o: Olusum) => olusumBaglantilari(o).length > 0;

/** Arapça yer tutucu: içerik alanı her dilde Arapça örnek gösteriyor. */
export const arapcaIpucu = (k: Parameters<typeof metin>[0]) => metin(k, "ar");
