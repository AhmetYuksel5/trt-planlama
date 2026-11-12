import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { ayAdi, kisaGunAdi, tarihYaz, useDil } from "../dil";
import { ayBasi, ayEkle, bugun, gunEkle, haftaBasi, saatCoz } from "../tarih";

/*
 * Tarih ve saat alanları (kullanıcı: muhabirin öneri formundaki takvim hep
 * Türkçe, plandaki saatler AM/PM). Tarayıcının kendi tarih ve saat kutusu
 * sayfanın dilini değil bilgisayarın dil ve bölge ayarını izliyor; Arapça
 * arayüzde Türkçe takvim, İngilizce Windows'ta 12 saat çıkıyordu. Bu alanlar
 * arayüzün dilinde ay ve gün adlarıyla, saat her dilde 24 saatlik.
 *
 * Değer biçimi yerleşik alanla aynı ("YYYY-MM-DD", "HH:MM",
 * "YYYY-MM-DDTHH:MM"), `onChange` da `e.target.value` verir: ekranlar
 * yalnız etiketi değiştirdi. Tarihte yerleşik alan görünmez biçimde yerinde
 * kalıyor (data-*, aria, değer onda): testler ve otomatik doldurma ona yazar.
 */

type Olay = { target: { value: string } };
type Ozellikler = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> & {
  value: string;
  onChange: (e: Olay) => void;
};

const olay = (value: string): Olay => ({ target: { value } });

/** Hafta kurumun takvimindeki gibi Cumartesi başlar (takvim.ts). */
const ayGunleri = (ay: string) => {
  const bas = haftaBasi(ay);
  return Array.from({ length: 42 }, (_, i) => gunEkle(bas, i));
};

export function TarihGirdisi({ value, onChange, min, max, required, disabled, className = "", title, ...kalan }: Ozellikler) {
  const { t, dil } = useDil();
  const [acik, setAcik] = useState(false);
  const [ay, setAy] = useState(ayBasi(value || bugun()));
  const dugme = useRef<HTMLButtonElement>(null);
  const kutu = useRef<HTMLDivElement>(null);
  const enAz = typeof min === "string" ? min : "";
  const enCok = typeof max === "string" ? max : "";
  const secilebilir = (g: string) => (!enAz || g >= enAz) && (!enCok || g <= enCok);

  useEffect(() => {
    if (acik) setAy(ayBasi(value || (enAz > bugun() ? enAz : bugun())));
  }, [acik]);

  // Üst katmanda (popover): pencerenin içinde de kırpılmadan açılsın; yeri düğmeden ölçülüyor.
  useLayoutEffect(() => {
    const k = kutu.current;
    const d = dugme.current;
    if (!acik || !k || !d) return;
    if (k.showPopover && !k.matches(":popover-open")) k.showPopover();
    const yerlestir = () => {
      const r = d.getBoundingClientRect();
      const g = k.offsetWidth;
      const y = k.offsetHeight;
      const rtl = getComputedStyle(d).direction === "rtl";
      const sol = rtl ? r.right - g : r.left;
      k.style.left = `${Math.min(Math.max(sol, 8), innerWidth - g - 8)}px`;
      k.style.top = `${r.bottom + 4 + y > innerHeight && r.top - 4 - y > 0 ? r.top - 4 - y : r.bottom + 4}px`;
    };
    yerlestir();
    const kapat = (e: Event) => {
      if (e.type === "toggle" && (e as ToggleEvent).newState === "closed") setAcik(false);
    };
    k.addEventListener("toggle", kapat);
    window.addEventListener("resize", yerlestir);
    window.addEventListener("scroll", yerlestir, true);
    return () => {
      k.removeEventListener("toggle", kapat);
      window.removeEventListener("resize", yerlestir);
      window.removeEventListener("scroll", yerlestir, true);
    };
  }, [acik, ay]);

  const sec = (g: string) => {
    onChange(olay(g));
    kutu.current?.hidePopover?.();
    setAcik(false);
    dugme.current?.focus();
  };
  const B = bugun();
  const gunler = ayGunleri(ay);
  const etiket = kalan["aria-label"] ?? title;
  // Çağıranın "girdi" sınıfları (çerçeve, boy) düğmeye; kalanı (yerleşim) dış kaba.
  const siniflar = className.split(/\s+/).filter(Boolean);
  const girdiSinifi = siniflar.filter((c) => c.startsWith("girdi")).join(" ");
  const kapSinifi = siniflar.filter((c) => !c.startsWith("girdi")).join(" ");

  return (
    <span className={`tarih-girdisi ${kapSinifi}`}>
      <button
        ref={dugme}
        type="button"
        className={`girdi tarih-dugmesi ${girdiSinifi}`}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={acik}
        aria-label={etiket ? `${etiket}: ${value ? tarihYaz(value, dil, "uzun") : t("gunSec")}` : undefined}
        title={title}
        onClick={() => setAcik((a) => !a)}
        data-tarih-dugmesi
      >
        <CalendarDays size={16} aria-hidden />
        <span className={value ? "" : "soluk"}>{value ? tarihYaz(value, dil, "uzun") : t("gunSec")}</span>
      </button>
      <input {...kalan} type="date" className="tarih-gizli" tabIndex={-1} aria-hidden value={value} min={min} max={max} required={required} disabled={disabled} onChange={(e) => onChange(olay(e.target.value))} />
      {acik && (
        <div ref={kutu} className="tarih-kutusu" popover="auto" role="dialog" aria-label={etiket ?? t("gunSec")} data-tarih-kutusu>
          <div className="tarih-kutusu-bas">
            <button type="button" className="dugme-ikon dugme-sade" onClick={() => setAy(ayEkle(ay, -1))} aria-label={t("oncekiAy")} title={t("oncekiAy")}>
              <ChevronLeft size={16} className="yon" />
            </button>
            <b>{ayAdi(ay, dil, "yil")}</b>
            <button type="button" className="dugme-ikon dugme-sade" onClick={() => setAy(ayEkle(ay, 1))} aria-label={t("sonrakiAy")} title={t("sonrakiAy")}>
              <ChevronRight size={16} className="yon" />
            </button>
          </div>
          <div className="tarih-izgara" role="grid">
            {gunler.slice(0, 7).map((g) => (
              <span key={"b" + g} className="tarih-gun-adi" aria-hidden>
                {dil === "ar" ? new Intl.DateTimeFormat("ar", { weekday: "narrow" }).format(new Date(g + "T12:00:00")) : kisaGunAdi(g, dil)}
              </span>
            ))}
            {gunler.map((g) => (
              <button
                key={g}
                type="button"
                className={`tarih-gun${g.slice(0, 7) !== ay.slice(0, 7) ? " baska-ay" : ""}${g === B ? " bugun" : ""}${g === value ? " secili" : ""}`}
                disabled={!secilebilir(g)}
                aria-pressed={g === value}
                aria-label={tarihYaz(g, dil, "tam")}
                onClick={() => sec(g)}
                data-tarih-gun={g}
              >
                {Number(g.slice(8))}
              </button>
            ))}
          </div>
          <div className="tarih-kutusu-alt">
            {secilebilir(B) && (
              <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => sec(B)}>
                {t("bugun")}
              </button>
            )}
            {!required && value && (
              <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => sec("")}>
                {t("temizle")}
              </button>
            )}
          </div>
        </div>
      )}
    </span>
  );
}

/*
 * 24 saatlik saat: yazı alanı, "SS:DD". "930", "9.30", "9", Arapça rakam da
 * olur (tarih.ts → saatCoz); yazarken yalnız tam saat kaydedilir, çıkınca
 * eksik yazım tamamlanır, geçersizi eski değere döner.
 */
export function SaatGirdisi({ value, onChange, onBlur, className = "girdi", placeholder = "--:--", ...kalan }: Ozellikler) {
  const [yazi, setYazi] = useState(value);
  useEffect(() => setYazi(value), [value]);
  return (
    <input
      {...kalan}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      dir="ltr"
      maxLength={5}
      className={`${className} saat-girdisi`}
      placeholder={placeholder}
      value={yazi}
      onChange={(e) => {
        const y = e.target.value;
        setYazi(y);
        if (y === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(y)) {
          if (y !== value) onChange(olay(y));
        }
      }}
      onBlur={(e) => {
        const s = saatCoz(yazi);
        if (s === null) setYazi(value);
        else {
          setYazi(s);
          if (s !== value) onChange(olay(s));
        }
        onBlur?.(e);
      }}
    />
  );
}

/** Gün ve saat birlikte ("YYYY-MM-DDTHH:MM"); gün yoksa değer boş. */
export function TarihSaatGirdisi({ value, onChange, className = "", ...kalan }: Ozellikler) {
  const [gun = "", saat = ""] = value ? value.split("T") : [];
  const yaz = (g: string, s: string) => onChange(olay(g ? `${g}T${s || "00:00"}` : ""));
  return (
    <span className={`tarih-saat-girdisi ${className}`}>
      <TarihGirdisi {...kalan} value={gun} onChange={(e) => yaz(e.target.value, saat)} />
      <SaatGirdisi value={saat.slice(0, 5)} onChange={(e) => yaz(gun, e.target.value)} disabled={kalan.disabled} aria-label={kalan["aria-label"]} />
    </span>
  );
}
