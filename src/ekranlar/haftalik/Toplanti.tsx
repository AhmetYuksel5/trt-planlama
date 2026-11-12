import { Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnmaGirdisi } from "../../bilesenler/Anma";
import { GeriBag } from "../../bilesenler/GeriBag";
import { KararRozeti } from "../../bilesenler/Haftalik";
import { Avatar, Icerik, Kart, bildir } from "../../bilesenler/Parcalar";
import { aralikYaz, gunAdi, saatYaz, tarihYaz, useDil } from "../../dil";
import { kalemKarar, toplantiNotuEkle, toplantiNotuSil, toplantiNotuSilebilir } from "../../eylemler";
import { gundemde, haftaSonu, kalemAdi, kararBekleyenler } from "../../haftalik";
import { useSekmeAdi } from "../../sekmeAdi";
import { yerelGun } from "../../tarih";
import { baslikBul, kisiBul, useVeri, type HaftalikKalem, type HaftalikPlan, type Karar, type Kisi } from "../../veri";
import { useAdimDurumu } from "../../yol";
import { kararVerebilir, planAdimiYapabilir, toplantiNotuGorur } from "../../yetki";
import { IkonDugme } from "../nextday/Bolumler";
import { GozdenGecirme } from "./GozdenGecirme";
import { KalemKarti } from "./Kalem";

/*
 * Weekly toplantısının çalışma ekranı (kullanıcı: toplantıda anlık not alıp
 * paketleri onaylayacağı, sonra gözden geçirip plana son halini vereceği
 * arayüz). Solda gündem kalem kalem (günler sırasıyla, sonra zamana bağlı
 * olmayanlar), ortada seçili kalemin kartı (karar, şartlı kabulün koşulu,
 * karar notu ve ek talep; plan ekranındaki kartın aynısı), sağda toplantının
 * genel notları. Klavye: ↑/↓ (j/k) kalem, 1 kabul, 2 şartlı (koşul formu),
 * 3 bilgi, 4 ret, 0 kararı kaldır, N not. Kararla bir sonraki kaleme geçer.
 */

const TUS_KARAR: Record<string, Karar> = { "1": "kabul", "3": "bilgi", "4": "ret", "0": "bekliyor" };

/* Gündemin toplantıdaki sırası: günler sırasıyla, sonra zamana bağlı olmayanlar; günün içinde plandaki sıra. */
export const toplantiSirasi = (h: HaftalikPlan): HaftalikKalem[] =>
  h.kalemler
    .map((k, i) => ({ k, i }))
    .filter(({ k }) => gundemde(k))
    .sort((a, b) => (a.k.tarih || "9999").localeCompare(b.k.tarih || "9999") || a.i - b.i)
    .map(({ k }) => k);

const yaziAlaninda = (e: KeyboardEvent) => {
  const h = e.target as HTMLElement | null;
  return !!h && (h.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(h.tagName));
};

export default function HaftalikToplanti({ ben, hafta }: { ben: Kisi; hafta: HaftalikPlan }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const bas = hafta.baslangic;
  useSekmeAdi(`${t("mHaftalik")} · ${t("toplantiGorunumu")}`);
  const [suzgec, setSuzgec] = useAdimDurumu<"hepsi" | "bekleyen">("toplanti:suzgec", "hepsi");
  const [gozden, setGozden] = useState(false);
  const sira = toplantiSirasi(hafta);
  const liste = suzgec === "bekleyen" ? sira.filter((k) => k.karar === "bekliyor") : sira;
  const [seciliId, setSeciliId] = useState<string | undefined>(liste[0]?.id);
  const secili = liste.find((k) => k.id === seciliId) ?? liste[0];
  const karar = kararVerebilir(ben, hafta);
  const bekleyen = kararBekleyenler(hafta).length;
  const ayrinti = useRef<HTMLDivElement>(null);
  const satirlar = useRef<HTMLUListElement>(null);

  // Seçili satır listede görünür kalsın (klavyeyle inerken).
  useEffect(() => {
    satirlar.current?.querySelector(`[data-toplanti-kalem="${secili?.id}"]`)?.scrollIntoView({ block: "nearest" });
  }, [secili?.id]);

  // Klavye: yazı alanında ve açık pencerede çalışmaz.
  useEffect(() => {
    const dinle = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || yaziAlaninda(e) || document.querySelector("dialog[open]")) return;
      const i = secili ? liste.findIndex((k) => k.id === secili.id) : -1;
      const git = (j: number) => liste[j] && setSeciliId(liste[j].id);
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        git(Math.min(i + 1, liste.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        git(Math.max(i - 1, 0));
      } else if (secili && karar && TUS_KARAR[e.key]) {
        e.preventDefault();
        const yeni = TUS_KARAR[e.key];
        if (!kalemKarar(ben, hafta.id, secili.id, yeni)) return;
        // Kararla sıradaki kaleme: "bekleyen" süzgecinde karar verilen listeden düşüyor, aynı sıradaki gelir.
        if (yeni !== "bekliyor") {
          const sonraki = suzgec === "bekleyen" ? liste.filter((k) => k.id !== secili.id)[i] : liste[i + 1];
          if (sonraki) setSeciliId(sonraki.id);
        }
      } else if (secili && karar && e.key === "2") {
        e.preventDefault();
        ayrinti.current?.querySelector<HTMLButtonElement>("[data-karar-dugme='sartli']")?.click();
      } else if (secili && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        ayrinti.current?.querySelector<HTMLButtonElement>("[data-karar-notu-ac]")?.click();
      }
    };
    window.addEventListener("keydown", dinle);
    return () => window.removeEventListener("keydown", dinle);
  });

  const karariVerilen = sira.length - sira.filter((k) => k.karar === "bekliyor").length;

  return (
    <div className="toplanti" data-toplanti>
      <div className="toplanti-ust">
        <GeriBag href={`#/haftalik/${hafta.id}`} metin={t("haftalikPlanaDon")} />
        <h1 className="toplanti-baslik">
          {t("mHaftalik")} · {aralikYaz(bas, haftaSonu(bas), dil)}
        </h1>
        <span className="toplanti-ilerleme" data-toplanti-ilerleme title={t("kararVerilen", { n: karariVerilen, m: sira.length })}>
          <span className="toplanti-cubuk">
            <span style={{ inlineSize: `${sira.length ? (karariVerilen / sira.length) * 100 : 0}%` }} />
          </span>
          <b>
            {karariVerilen}/{sira.length}
          </b>
        </span>
        <div className="nd-gorunum" role="group" aria-label={t("krKarar")}>
          {(["hepsi", "bekleyen"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={suzgec === s} className={suzgec === s ? "secili" : ""} onClick={() => setSuzgec(s)} data-toplanti-suzgec={s}>
              {t(s === "hepsi" ? "hepsi" : "kararBekleyen")}
              {s === "bekleyen" && bekleyen > 0 && ` · ${bekleyen}`}
            </button>
          ))}
        </div>
        {hafta.durum === "toplantida" && planAdimiYapabilir(ben, "hfKesinlestir") && (
          <button type="button" className="dugme" aria-disabled={bekleyen > 0 || undefined} title={bekleyen > 0 ? t("kesinlestirmeIcinKarar", { n: bekleyen }) : undefined} onClick={() => (bekleyen > 0 ? bildir(t("kesinlestirmeIcinKarar", { n: bekleyen })) : setGozden(true))} data-gozden-ac>
            <Check size={16} /> {t("kesinlestir")}
          </button>
        )}
      </div>

      <div className="toplanti-duzen">
        <ul className="toplanti-liste" ref={satirlar} aria-label={t("toplantiGorunumu")}>
          {liste.map((k) => (
            <li key={k.id}>
              <button type="button" className={`toplanti-satir${k.id === secili?.id ? " secili" : ""}`} aria-current={k.id === secili?.id || undefined} onClick={() => setSeciliId(k.id)} data-toplanti-kalem={k.id}>
                <span className="toplanti-no">{sira.indexOf(k) + 1}</span>
                <span className="toplanti-satir-govde">
                  <Icerik blok>{kalemAdi(k)}</Icerik>
                  <small>
                    <bdi>{k.tarih ? `${gunAdi(k.tarih, dil)} ${tarihYaz(k.tarih, dil, "kisa")}` : t("zamanaBagliDegil")}</bdi>
                    {k.baslikId && (
                      <>
                        {" · "}
                        <Icerik>{baslikBul(v, k.baslikId)?.ad ?? ""}</Icerik>
                      </>
                    )}
                  </small>
                </span>
                <KararRozeti kalem={k} />
              </button>
            </li>
          ))}
        </ul>

        <div className="toplanti-ayrinti" ref={ayrinti} data-toplanti-ayrinti>
          {secili ? (
            <>
              <div className="toplanti-gezinti">
                <IkonDugme ikon={<ChevronUp size={16} />} etiket={t("onceki")} onClick={() => liste[liste.indexOf(secili) - 1] && setSeciliId(liste[liste.indexOf(secili) - 1].id)} />
                <IkonDugme ikon={<ChevronDown size={16} />} etiket={t("sonraki")} onClick={() => liste[liste.indexOf(secili) + 1] && setSeciliId(liste[liste.indexOf(secili) + 1].id)} />
              </div>
              <KalemKarti key={secili.id} ben={ben} hafta={hafta} kalem={secili} dosyaGoster kisayol={karar} />
            </>
          ) : (
            <p className="bos-kucuk">{t(suzgec === "bekleyen" ? "kararBekleyenYok" : "kalemYok")}</p>
          )}
        </div>

        {toplantiNotuGorur(ben) && (
          <div className="toplanti-notlar">
            <ToplantiNotlari ben={ben} hafta={hafta} />
          </div>
        )}
      </div>
      {gozden && <GozdenGecirme ben={ben} hafta={hafta} kapat={() => setGozden(false)} />}
    </div>
  );
}

/* Toplantının genel notları: kaleme bağlı olmayan, o an alınan not. Plan ekranında da (Bolum içinde) aynı parça. */
export function ToplantiNotlari({ ben, hafta, kartsiz = false }: { ben: Kisi; hafta: HaftalikPlan; kartsiz?: boolean }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [metin, setMetin] = useState("");
  if (!toplantiNotuGorur(ben)) return null;
  const notlar = (v.toplantiNotlari ?? []).filter((n) => n.planId === hafta.id).sort((a, b) => a.zaman.localeCompare(b.zaman));
  const ekle = () => toplantiNotuEkle(ben, hafta.id, metin) && setMetin("");
  const icerik = (
    <>
      <ul className="toplanti-not-listesi" data-toplanti-notlari>
        {notlar.map((n) => (
          <li key={n.id} data-toplanti-notu={n.id}>
            <Avatar kisi={kisiBul(v, n.kisiId)} boy="kucuk" />
            <div className="ad">
              <small>
                <bdi>{ad(kisiBul(v, n.kisiId))}</bdi> · <bdi>{yerelGun(n.zaman) === yerelGun(new Date().toISOString()) ? saatYaz(n.zaman, dil) : `${tarihYaz(yerelGun(n.zaman), dil, "kisa")} ${saatYaz(n.zaman, dil)}`}</bdi>
              </small>
              <p dir="auto">{n.metin}</p>
            </div>
            {toplantiNotuSilebilir(ben, n) && <IkonDugme ikon={<Trash2 size={14} />} etiket={t("sil")} onClick={() => confirm(t("silinsinMi")) && toplantiNotuSil(ben, n.id)} />}
          </li>
        ))}
      </ul>
      <div className="toplanti-not-yaz">
        <AnmaGirdisi
          cokSatir
          rows={2}
          deger={metin}
          degistir={setMetin}
          aria-label={t("toplantiNotlari")}
          // Ctrl/⌘+Enter ekler: toplantıda fareye gitmeden.
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              ekle();
            }
          }}
          data-toplanti-not-girdi
        />
        <button type="button" className="dugme dugme-kucuk" disabled={!metin.trim()} onClick={ekle} data-toplanti-not-ekle>
          {t("ekle")}
        </button>
      </div>
    </>
  );
  return kartsiz ? icerik : <Kart baslik={`${t("toplantiNotlari")}${notlar.length ? ` · ${notlar.length}` : ""}`}>{icerik}</Kart>;
}
