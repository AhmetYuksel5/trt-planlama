import { ChevronRight, Lock, Package, Undo2 } from "lucide-react";
import { useState } from "react";
import { bitmisGorunum, paketGunu, paketSeritTuru, type SeritTuru } from "../bitmisPaket";
import { durakBul, gorunenSahip } from "../akis";
import { saatYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { paketKunyesi } from "../kunye";
import { yerelGun } from "../tarih";
import { kisiBul, useVeri, type Kisi, type KunyeRolu, type Paket } from "../veri";
import { birimAdi } from "../yapi";
import { SON_KUTU, TUR_ROLLERI, listeKur, sureYazisi } from "./AsamaKutulari";
import { HarekeliMetin } from "./Hareke";
import { KunyeListesi } from "./Kunye";
import { Icerik } from "./Parcalar";

/*
 * Paketin şeridi (kullanıcı: paketler dağınık durmasın, yalnız başlık, tarih ve
 * muhabir; yapım bilgileri gerektiğinde açılsın; paket öneriden ayırt edilsin).
 * Kapalıyken tek satır: paket simgesi (sonuca ya da sürene göre renkli),
 * başlık, muhabir, tarih ve altında ince aşama çizgisi; öneri kartında avatar
 * ve karar düğmeleri var, burada yok. Açılınca aşamalar zaman çizgisi
 * (aşama kutularıyla aynı liste; geçen aşamada yapan künyeden, süre ve iade
 * asamaIzi'nden; şimdiki aşamada kimde; sıradakiler sönük), son metin, video,
 * klip kodu, ekip notları. Paket sayfasında başlık sayfanın kendisinde olduğu
 * için yalnız içi (`sayfada`).
 */
export function PaketSeridi({ ben, paket, sayfada = false }: { ben: Kisi; paket: Paket; sayfada?: boolean }) {
  const { ad, dil, t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  if (sayfada) return <PaketIci ben={ben} paket={paket} sayfada />;
  const tur = paketSeritTuru(paket);
  const cizgi = paket.durum === "iptal" ? [] : listeKur(paket).filter((a) => !SON_KUTU.has(a.id) && a.id !== "gfx");
  return (
    <div className={`bp-serit ${tur}${acik ? " acik" : ""}`} data-bitmis-serit={paket.id} data-paket-serit={paket.id} data-serit-tur={tur}>
      <button type="button" className="bp-bas" aria-expanded={acik} onClick={() => setAcik(!acik)}>
        <span className={`bp-ikon ${tur}`} title={t(SERIT_ADI[tur])} aria-label={t(SERIT_ADI[tur])}>
          <Package size={16} />
        </span>
        <span className="bp-baslik">
          <Icerik>{paket.baslik}</Icerik>
        </span>
        <span className="bp-alt">
          <span className="bp-kim">{ad(kisiBul(v, paket.muhabirId ?? paket.hazirlayanId))}</span>
          <span className="bp-tarih">{tarihYaz(paketGunu(v, paket), dil, "kisa")}</span>
        </span>
        <ChevronRight size={16} className="bp-ok yon" aria-hidden="true" />
        {cizgi.length > 0 && (
          <span className="bp-bar" aria-hidden="true">
            {cizgi.map((a) => (
              <i key={a.id} className={a.durum === "gecti" ? "gecti" : a.durum ? "simdi" : ""} />
            ))}
          </span>
        )}
      </button>
      {acik && <PaketIci ben={ben} paket={paket} />}
    </div>
  );
}
/** Eski ad (paket sayfası ve Haberlerim). */
export const BitmisPaketSeridi = PaketSeridi;

const SERIT_ADI: Record<SeritTuru, Anahtar> = { yayin: "sdYayinlandi", stok: "sdStokta", yapilmadi: "psYapilmayan", aktif: "aktif", iptal: "pdIptal" };

function PaketIci({ ben, paket, sayfada = false }: { ben: Kisi; paket: Paket; sayfada?: boolean }) {
  const { ad, dil, t } = useDil();
  const v = useVeri();
  const g = bitmisGorunum(ben);
  const [metin, setMetin] = useState(false);
  const kunye = paketKunyesi(v, paket);
  const satirlar = listeKur(paket)
    .filter((a) => !SON_KUTU.has(a.id))
    .map((a) => {
      const tur = durakBul(paket, a.id)?.tur ?? a.id;
      const roller = TUR_ROLLERI[tur] ?? [];
      const izler = kunye.filter((s) => roller.includes(s.rol as KunyeRolu)).flatMap((s) => s.kisiler);
      const kisiler = [...new Set(izler.map((k) => k.kisiId))];
      const zaman = izler.map((k) => k.zaman).filter(Boolean).sort().at(-1);
      return { a, kisiler, zaman, iz: paket.asamaIzi?.[a.id] };
    })
    // İptal pakette yalnız iz bırakan aşamalar; süren pakette hepsi (sıradakiler sönük).
    .filter((s) => paket.durum !== "iptal" || s.kisiler.length || s.iz);
  const sahip = gorunenSahip(paket);
  // Biten pakette her aşama geçmiş; süren pakette şimdiki ve sıradakiler ayrı görünür.
  const hal = (d: string) => (paket.durum === "tamamlandi" || paket.durum === "iptal" || d === "gecti" ? "" : d ? "simdi" : "gelecek");
  const notlar = g.not ? (v.asamaNotlari ?? []).filter((n) => n.paketId === paket.id) : [];
  return (
    <div className={`bp-ic${sayfada ? " sayfada" : ""}`} data-bitmis-ic={paket.id}>
      {sayfada && <h2 className="bp-ic-baslik">{t("bpYapim")}</h2>}
      <ol className="bp-cizgi">
        {satirlar.map(({ a, kisiler, zaman, iz }) => {
          const sure = g.sure(a.masa) && iz;
          return (
            <li key={a.id} className={[a.id === "gfx" ? "yan" : "", hal(a.durum)].filter(Boolean).join(" ")} data-bp-asama={a.id} data-bp-durum={hal(a.durum) || "gecti"}>
              <span className="bp-i" aria-hidden="true" />
              <span className="bp-ad">{a.ad}</span>
              <span className="bp-yapan">
                {(() => {
                  // Yapan kişi varsa adı ve birimi; yoksa birim bir kez (şimdiki aşamada işin kimde olduğu).
                  const h = hal(a.durum);
                  const kisi = h === "simdi" ? (sahip === "muhabir" && paket.muhabirId ? [paket.muhabirId] : []) : h === "gelecek" ? [] : kisiler;
                  const birim = h === "simdi" && sahip && sahip !== "muhabir" ? sahip : a.masa;
                  if (kisi.length)
                    return (
                      <>
                        {kisi.map((k) => ad(kisiBul(v, k))).join(" · ")}
                        {birim && <small> · {birimAdi(birim)}</small>}
                      </>
                    );
                  return birim ? <small>{birimAdi(birim)}</small> : "—";
                })()}
              </span>
              <span className="bp-zaman">
                {zaman && `${tarihYaz(yerelGun(zaman), dil, "kisa")} ${saatYaz(zaman, dil)}`}
                {sure && iz.sure >= 60_000 && <span data-bp-sure> · {sureYazisi(iz.sure, t)}</span>}
                {sure && !!iz.iade && (
                  <span className="bp-iade" title={t("akIade", { n: iz.iade })} aria-label={t("akIade", { n: iz.iade })}>
                    {" "}
                    <Undo2 size={12} /> {iz.iade}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {g.cikti && ((paket.metin && !sayfada) || paket.video || paket.klipKodu) && (
        <div className="bp-ciktilar">
          {/* Sayfada metin kendi kartında, sırasıyla (PaketMetniKarti). */}
          {paket.metin && !sayfada && (
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" aria-expanded={metin} onClick={() => setMetin(!metin)} data-bp-metin>
              {t("bpSonMetin")}
            </button>
          )}
          {paket.video && (
            <a className="dugme dugme-ikincil dugme-kucuk" href={paket.video} target="_blank" rel="noreferrer">
              {t("videoBaglantisi")} ↗
            </a>
          )}
          {paket.klipKodu && (
            <span className="bp-kod" dir="ltr" title={t("klipKodu")}>
              {paket.klipKodu}
            </span>
          )}
        </div>
      )}
      {g.cikti && metin && paket.metin && (
        <div className="metin-kutu">
          <Icerik blok>
            <HarekeliMetin metin={paket.metin} />
          </Icerik>
        </div>
      )}
      {notlar.map((n) => (
        <p key={n.id} className="bp-not" data-bp-not>
          <Lock size={12} aria-hidden="true" /> <b>{ad(kisiBul(v, n.kisiId))}</b> <span dir="auto">{n.metin}</span>
        </p>
      ))}
      {/* Sayfada bütün künye de (öneren, görevlendiren, onaylayan): çizgi yalnız aşamaların yapanı. */}
      {sayfada && <KunyeListesi satirlar={kunye} />}
      {!sayfada && (
        <a className="bp-sayfa" href={`#/paketler/${paket.id}`}>
          {t("bpSayfayiAc")} <ChevronRight size={14} className="yon" />
        </a>
      )}
    </div>
  );
}

export type PaketSirasi = "gun" | "muhabir" | "asama" | "baslik" | "yeni";
export const PAKET_SIRALARI: { id: PaketSirasi; ad: Anahtar }[] = [
  { id: "gun", ad: "psSiraGun" },
  { id: "muhabir", ad: "psSiraMuhabir" },
  { id: "asama", ad: "psSiraAsama" },
  { id: "baslik", ad: "psSiraBaslik" },
  { id: "yeni", ad: "psSiraYeni" },
];

/*
 * Paketlerin şerit listesi, seçilen sırayla (kullanıcı: paketler muhabire,
 * yapılacağı güne göre sıralanabilsin). Gün, muhabir ve aşamada başlıklı
 * gruplar; başlık ve son değişende düz liste. Gün her sekmede yeniden
 * eskiye, aşağı doğru (kullanıcı; önce Aktif'te yakından uzağaydı);
 * `artan` eskiden yeniye isteyen yer için.
 */
export function PaketListesi({ ben, paketler, sira, artan }: { ben: Kisi; paketler: Paket[]; sira: PaketSirasi; artan: boolean }) {
  const { ad, dil, t } = useDil();
  const v = useVeri();
  const gun = (p: Paket) => paketGunu(v, p);
  const gunSirasi = (a: Paket, b: Paket) => (artan ? gun(a).localeCompare(gun(b)) : gun(b).localeCompare(gun(a)));
  const asamaAdi = (p: Paket) => {
    const tur = paketSeritTuru(p);
    if (tur !== "aktif") return t(SERIT_ADI[tur]);
    return listeKur(p).find((a) => a.durum === "simdi" || a.durum === "gecikti")?.ad ?? t("aktif");
  };
  const muhabirAdi = (p: Paket) => (p.muhabirId || p.hazirlayanId ? ad(kisiBul(v, p.muhabirId ?? p.hazirlayanId)) : t("psMuhabirsiz"));
  const satirlar = (l: Paket[]) => l.map((p) => <PaketSeridi key={p.id} ben={ben} paket={p} />);

  if (sira === "baslik" || sira === "yeni") {
    const l = [...paketler].sort((a, b) => (sira === "baslik" ? a.baslik.localeCompare(b.baslik, "ar") : b.guncelleme.localeCompare(a.guncelleme)));
    return (
      <div className="bp-liste" data-bitmis-liste data-paket-listesi={sira}>
        {satirlar(l)}
      </div>
    );
  }
  const anahtar = sira === "gun" ? gun : sira === "muhabir" ? muhabirAdi : asamaAdi;
  const gruplar = new Map<string, Paket[]>();
  for (const p of [...paketler].sort(gunSirasi)) {
    const k = anahtar(p);
    gruplar.set(k, [...(gruplar.get(k) ?? []), p]);
  }
  const sirali = [...gruplar.entries()];
  if (sira === "muhabir") sirali.sort(([a], [b]) => a.localeCompare(b, dil));
  return (
    <div className="bp-gruplar" data-paket-listesi={sira}>
      {sirali.map(([k, l]) => (
        <section key={k} className="bp-grup" data-paket-grup={k}>
          <h3 className="bp-grup-baslik">
            {sira === "gun" ? tarihYaz(k, dil, "tam") : k} <em>{l.length}</em>
          </h3>
          <div className="bp-liste">{satirlar(l)}</div>
        </section>
      ))}
    </div>
  );
}
