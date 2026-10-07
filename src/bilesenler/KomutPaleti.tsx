import { Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { kayitAra, sozcuklerUyar, ucDilde } from "../arama";
import { useDil, type Anahtar } from "../dil";
import { KisayolKutusu, kisayolBilgisi } from "../ekranlar/ortam/Kisayollar";
import { useOrtamGorunumu } from "../ekranlar/ortam/gorunum";
import { useOrtamEtiketi } from "../ekranlar/ortam/Sekmeler";
import { kisininKisayollari } from "../kisayol";
import { kisininOrtamlari, yolSayfasi } from "../ortam";
import { useVeri, type Kisi } from "../veri";
import { MENU, maddeAdi, maddeGorunur, sayfaMaddesi } from "./AnaMenu";
import { Bos, Icerik } from "./Parcalar";

/**
 * Arama penceresi (Ctrl/⌘+K, "/" ya da üst çubuktaki 🔍). Çubukta büyük
 * bir kutu yer kaplıyordu; arama sık değil, menü ve kısayollar asıl yol.
 * Pencere sayfa, workspace ve kayıtları birlikte arıyor; boşken
 * kısayolları ve workspace'leri gösteriyor ki hızlı geçiş için de dursun.
 *
 * Kayıt araması yalnız kişinin görebildiklerinde (arama.ts → kayitAra).
 * Sayfa adları üç dilde aranıyor: Arapça arayüzde "Weekly" de bulunuyor.
 */

interface Secenek {
  id: string;
  href: string;
  ikon?: ReactNode;
  ust?: string;
  metin: string;
  /** Arapça içerik (haber başlığı): <Icerik> ile, sağdan sola. */
  icerik?: boolean;
}

/* Sayfalardan en çok bu kadar; kayıtlar arama.ts'teki sınırlarla. */
const SAYFA_EN_COK = 8;

export function KomutPaleti({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const gorunum = useOrtamGorunumu();
  const etiket = useOrtamEtiketi(ben);
  const ref = useRef<HTMLDialogElement>(null);
  const [sorgu, setSorgu] = useState("");
  const [sira, setSira] = useState(0);
  const kimlik = useId();

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);

  const q = sorgu.trim();
  const ortamlar = kisininOrtamlari(v, ben.id);
  const ortamSecenegi = (o: (typeof ortamlar)[number]): Secenek => {
    const e = etiket(o);
    return { id: `o-${o.id}`, href: `#/ortam/${o.id}`, ikon: <e.Ikon size={16} />, metin: e.kisa };
  };

  const gruplar: { ad: Anahtar; secenekler: Secenek[] }[] = q
    ? [
        {
          ad: "paletSayfalar",
          secenekler: MENU.flatMap((g) => g.maddeler)
            .filter((m) => maddeGorunur(ben, m) && sozcuklerUyar([m.ad, m.kisa, m.adMuhabir, m.kisaMuhabir].map((k) => (k ? ucDilde(k) : "")).join(" "), q))
            .slice(0, SAYFA_EN_COK)
            .map((m) => {
              const Ikon = m.ikon;
              return { id: `s-${m.sayfa}`, href: `#/${m.sayfa}`, ikon: <Ikon size={16} />, metin: t(maddeAdi(ben, m)) };
            }),
        },
        {
          ad: "ortamlar",
          secenekler: ortamlar
            .filter((o) =>
              sozcuklerUyar(
                o.bolmeler
                  .map((b) => sayfaMaddesi(yolSayfasi(gorunum.yol[b.id] ?? b.yol)))
                  .map((m) => (m ? `${ucDilde(m.kisa)} ${ucDilde(m.ad)}` : ""))
                  .join(" "),
                q,
              ),
            )
            .map(ortamSecenegi),
        },
        ...(["paket", "oneri", "kisi"] as const).map((tur) => ({
          ad: ({ paket: "paletPaketler", oneri: "paletOneriler", kisi: "paletKisiler" } as const)[tur],
          secenekler: kayitAra(v, ben, q, dil)
            .filter((s) => s.tur === tur)
            .map((s) => ({ id: `${tur}-${s.id}`, href: s.href, ust: s.ust, metin: s.metin, icerik: s.icerik })),
        })),
      ]
    : [
        {
          ad: "kisayollarim",
          secenekler: kisininKisayollari(v, ben).flatMap((k) => {
            const b = kisayolBilgisi(ben, k);
            return b ? [{ id: `k-${k}`, href: `#/${k}`, ikon: <KisayolKutusu ben={ben} kimlik={k} bag={false} />, metin: t(b.ad) }] : [];
          }),
        },
        { ad: "ortamlar", secenekler: ortamlar.map(ortamSecenegi) },
      ];

  const duz = gruplar.flatMap((g) => g.secenekler);
  const secili = duz.length ? Math.min(sira, duz.length - 1) : -1;
  const secenekKimligi = (s: Secenek) => `${kimlik}-${s.id}`;

  useEffect(() => {
    if (secili >= 0) document.getElementById(secenekKimligi(duz[secili]))?.scrollIntoView({ block: "nearest" });
  });

  const ac = (s: Secenek) => {
    location.hash = s.href;
    kapat();
  };

  return (
    <dialog ref={ref} className="palet" aria-label={t("ara")} data-palet onClose={kapat} onClick={(e) => e.target === ref.current && kapat()}>
      <div className="palet-ust">
        <Search size={18} aria-hidden="true" />
        {/* Düz metin: arama alanında Chrome ilk Esc'de yalnız yazıyı siliyor, pencere kapanmıyordu. */}
        <input
          type="text"
          enterKeyHint="search"
          dir="auto"
          value={sorgu}
          placeholder={t("paletIpucu")}
          aria-label={t("ara")}
          role="combobox"
          aria-expanded="true"
          aria-controls={kimlik}
          aria-autocomplete="list"
          aria-activedescendant={secili >= 0 ? secenekKimligi(duz[secili]) : undefined}
          autoFocus
          onChange={(e) => {
            setSorgu(e.target.value);
            setSira(0);
          }}
          onKeyDown={(e) => {
            const n = duz.length;
            if (!n) return;
            if (e.key === "ArrowDown") setSira((secili + 1) % n);
            else if (e.key === "ArrowUp") setSira((secili - 1 + n) % n);
            else if (e.key === "Home" && e.ctrlKey) setSira(0);
            else if (e.key === "End" && e.ctrlKey) setSira(n - 1);
            else if (e.key === "Enter") ac(duz[secili]);
            else return;
            e.preventDefault();
          }}
        />
        <button type="button" className="ikon-dugme palet-kapat" onClick={kapat} aria-label={t("kapat")} title={t("kapat")}>
          <X size={18} />
        </button>
      </div>
      <div className="palet-liste" role="listbox" id={kimlik} aria-label={t("ara")}>
        {gruplar
          .filter((g) => g.secenekler.length > 0)
          .map((g) => (
            <div key={g.ad} role="group" aria-labelledby={`${kimlik}-g-${g.ad}`}>
              <div className="palet-grup" id={`${kimlik}-g-${g.ad}`} role="presentation">
                {t(g.ad)}
              </div>
              {g.secenekler.map((s) => {
                const i = duz.indexOf(s);
                return (
                  <a
                    key={s.id}
                    id={secenekKimligi(s)}
                    role="option"
                    aria-selected={i === secili}
                    className="palet-satir"
                    href={s.href}
                    data-palet-secenek={s.id}
                    onMouseMove={() => i !== secili && setSira(i)}
                    onClick={kapat}
                  >
                    {s.ikon}
                    <span className="palet-metin">
                      {s.ust && <small>{s.ust}</small>}
                      {s.icerik ? <Icerik>{s.metin}</Icerik> : s.metin}
                    </span>
                  </a>
                );
              })}
            </div>
          ))}
        {q && duz.length === 0 && <Bos kucuk metin={t("aramaBos")} />}
      </div>
      <div className="palet-alt">
        <span>{t("paletYardim")}</span>
        <span aria-live="polite">{q ? t("sonucSayisi", { n: duz.length }) : ""}</span>
      </div>
    </dialog>
  );
}
