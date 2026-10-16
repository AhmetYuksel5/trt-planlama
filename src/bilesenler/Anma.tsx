import { AtSign, Check } from "lucide-react";
import { useRef, useState, type InputHTMLAttributes, type KeyboardEvent, type TextareaHTMLAttributes } from "react";
import { anmaAdaylari, anmaSorgusu } from "../bahsetme";
import { saatYaz, tarihYaz, useDil, yaz } from "../dil";
import { bahsetmeGoruldu } from "../eylemler";
import { kisiBul, useVeri, type Kisi } from "../veri";
import { birimAdi } from "../yapi";
import { Avatar, Icerik, Kart } from "./Parcalar";

/**
 * Notta kişi anma: "@" yazınca kişi listesi açılıyor, seçilen kişinin
 * Arapça adı nota yazılıyor. Kimin anıldığını kaydeden eylem metinden
 * çıkarıyor (bahsetme.ts → anilanlar); girdinin işi yalnız adı doğru
 * yazmak. Bütün not alanları bunu kullanıyor.
 */

type Ortak = { deger: string; degistir: (x: string) => void };
type GirdiOzellikleri = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & Ortak & { cokSatir?: false };
type AlanOzellikleri = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & Ortak & { cokSatir: true };

export function AnmaGirdisi(p: GirdiOzellikleri | AlanOzellikleri) {
  const { t, ad } = useDil();
  const v = useVeri();
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [sorgu, setSorgu] = useState<{ bas: number; sorgu: string } | null>(null);
  const [secili, setSecili] = useState(0);
  const adaylar = sorgu ? anmaAdaylari(sorgu.sorgu, v.kisiler) : [];
  const { deger, degistir, cokSatir, onKeyDown, ...kalan } = p;

  const yokla = (metin: string, imlec: number) => {
    setSorgu(anmaSorgusu(metin, imlec));
    setSecili(0);
  };
  const sec = (k: Kisi) => {
    if (!sorgu) return;
    const ad = `@${yaz(k.ad, "ar")} `;
    const imlec = ref.current?.selectionStart ?? deger.length;
    const yeni = deger.slice(0, sorgu.bas) + ad + deger.slice(imlec);
    degistir(yeni);
    setSorgu(null);
    const yer = sorgu.bas + ad.length;
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(yer, yer);
    });
  };
  const tus = (e: KeyboardEvent<HTMLInputElement & HTMLTextAreaElement>) => {
    if (adaylar.length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setSecili((secili + (e.key === "ArrowDown" ? 1 : adaylar.length - 1)) % adaylar.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        sec(adaylar[secili]);
        return;
      }
      if (e.key === "Escape") {
        e.stopPropagation();
        setSorgu(null);
        return;
      }
    }
    (onKeyDown as ((e: KeyboardEvent<HTMLInputElement & HTMLTextAreaElement>) => void) | undefined)?.(e);
  };
  const ortak = {
    ref,
    value: deger,
    dir: "auto",
    onChange: (e: { target: HTMLInputElement | HTMLTextAreaElement }) => {
      degistir(e.target.value);
      yokla(e.target.value, e.target.selectionStart ?? e.target.value.length);
    },
    onKeyDown: tus,
    onBlur: () => setTimeout(() => setSorgu(null), 150),
    "aria-autocomplete": "list" as const,
  };
  return (
    <span className="anma-girdisi" data-anma>
      {cokSatir ? <textarea {...(kalan as TextareaHTMLAttributes<HTMLTextAreaElement>)} {...ortak} /> : <input {...(kalan as InputHTMLAttributes<HTMLInputElement>)} {...ortak} />}
      {adaylar.length > 0 && (
        <ul className="anma-listesi" role="listbox" aria-label={t("anKisiAna")}>
          {adaylar.map((k, i) => (
            <li key={k.id} role="option" aria-selected={i === secili}>
              <button
                type="button"
                className={i === secili ? "secili" : ""}
                // Odak girdide kalsın: tıklama blur'dan önce işlensin.
                onMouseDown={(e) => {
                  e.preventDefault();
                  sec(k);
                }}
                data-anma-aday={k.id}
              >
                <Avatar kisi={k} boy="kucuk" />
                <span>
                  <bdi>{ad(k)}</bdi>
                  <small className="sonuk-yazi">{birimAdi(k.birim)}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

/*
 * İşler listesinde: kişinin anıldığı, henüz görmediği notlar. Tıklayınca
 * görüldü sayılıp notun sayfası açılıyor; "Gördüm" yalnız listeden kaldırıyor.
 * Anma yoksa çizilmiyor.
 */
export function AnildigimNotlar({ ben }: { ben: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const liste = (v.bahsetmeler ?? []).filter((b) => b.kisiId === ben.id && !b.goruldu).sort((a, b) => b.zaman.localeCompare(a.zaman));
  if (!liste.length) return null;
  return (
    <Kart baslik={t("anBaslik")} ikon={<AtSign size={18} />} ek={String(liste.length)}>
      <ul className="liste anma-notlari" data-anildigim>
        {liste.map((b) => {
          const yazan = kisiBul(v, b.yazanId);
          return (
            <li key={b.id} data-anma-notu={b.id}>
              <Avatar kisi={yazan} boy="kucuk" />
              <a
                className="ad"
                href={b.yol}
                onClick={() => {
                  bahsetmeGoruldu(ben, b.id);
                }}
                data-anma-git
              >
                <small>
                  <b>
                    <bdi>{ad(yazan)}</bdi>
                  </b>
                  {" · "}
                  <bdi>{`${tarihYaz(b.zaman.slice(0, 10), dil, "kisa")} ${saatYaz(b.zaman, dil)}`}</bdi>
                  {b.baslik && (
                    <>
                      {" · "}
                      <Icerik>{b.baslik}</Icerik>
                    </>
                  )}
                </small>
                <span className="anma-metni" dir="auto">
                  {b.metin}
                </span>
              </a>
              <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => bahsetmeGoruldu(ben, b.id)} title={t("anGordum")} aria-label={t("anGordum")} data-anma-gordum>
                <Check size={16} />
              </button>
            </li>
          );
        })}
      </ul>
    </Kart>
  );
}
