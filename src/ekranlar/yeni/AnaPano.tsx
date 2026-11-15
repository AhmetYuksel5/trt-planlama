import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { UZUN_DAKIKA, cagriDurumu, gunOlaylari, kararKuyrugu, siradakiOlay, uretimdekiler, type KuyrukOgesi } from "../../anaPano";
import { sureYazisi } from "../../bilesenler/AsamaKutulari";
import { KisiCipi } from "../../bilesenler/KisiCipi";
import { TalepSatiri } from "../../bilesenler/PaketGorevi";
import { MasrafListesi } from "../../bilesenler/PaketMetni";
import { PaketSonucDugmeleri } from "../../bilesenler/PaketSonucu";
import { Icerik, Rozet } from "../../bilesenler/Parcalar";
import { WhatsAppDugmesi } from "../../bilesenler/WhatsApp";
import { gecenSure, tarihYaz, useDil, type Anahtar } from "../../dil";
import { postaKonuBasligi } from "../../eposta";
import { HAFTA_DURUM_ADI, KISI_DURUM_ADI, PLAN_DURUM_ADI } from "../../etiketler";
import { bahsetmeGoruldu, paketDurum, paketReddet } from "../../eylemler";
import { kisiBugunDurumu } from "../../muhabirIletisim";
import { masrafToplami, masrafYaz } from "../../paketMetni";
import { kararlariGetir } from "../../planlamaKararlari";
import { gorunenPostalar, okunmamisMi } from "../../postaOkuma";
import { bugun, gunEkle } from "../../tarih";
import { gorunenFaaliyetler, yaklasanlar } from "../../takvim";
import { kisiBul, muhabirler, useVeri, type Kisi, type PostaMesaji } from "../../veri";
import { birimAdi } from "../../yapi";
import { OneriAyrinti } from "../oneri/OneriGovde";

/*
 * Planlama'nın masaüstü ana sayfası (kullanıcı: sabit sayfa, bütün alan
 * faydalı şeylerle dolu, sağdan/soldan açılan panel yok, açtıkça yerinde
 * büyüsün; beş tasarımcının ortak önerisi). En üstte bugünün zaman çizgisi ve
 * sıradaki eşik; altında üç sütun: tek karar kuyruğu (satır yerinde açılır,
 * karar orada verilir), planlar ve üretimdeki paketler, muhabirler ve posta.
 * Kurallar anaPano.ts'de; telefonda kutulu sayfa (PlanlamaAna) kalıyor.
 */
export default function AnaPano({ ben }: { ben: Kisi }) {
  return (
    <div className="ap" data-ana-pano>
      <GunCizgisi />
      <div className="ap-izgara">
        <KararKuyrugu ben={ben} />
        <PlanlarSutunu ben={ben} />
        <InsanlarSutunu ben={ben} />
      </div>
    </div>
  );
}

/* Dakikada bir yeniden çizer: geri sayım ve "şimdi" çizgisi kaysın. */
function useDakika() {
  const [an, setAn] = useState(() => new Date());
  useEffect(() => {
    const z = setInterval(() => setAn(new Date()), 60_000);
    return () => clearInterval(z);
  }, []);
  return an;
}

const BAS_SAAT = 7;
const BIT_SAAT = 24;
const konum = (saat: string) => {
  const [h, m] = saat.split(":").map(Number);
  const x = (h + m / 60 - BAS_SAAT) / (BIT_SAAT - BAS_SAAT);
  return Math.min(1, Math.max(0, x)) * 100;
};

function GunCizgisi() {
  const { t } = useDil();
  const v = useVeri();
  const an = useDakika();
  const b = bugun();
  const olaylar = gunOlaylari(v, b);
  const sira = siradakiOlay(olaylar, an);
  const simdi = `${an.getHours()}:${an.getMinutes()}`;
  const ad = (o: (typeof olaylar)[number]) => (o.tur === "cagri" ? t("apCagriSon") : o.ad);
  return (
    <section className="ap-cizgi" aria-label={t("apBugun")} data-ap-cizgi>
      <div className="ap-cizgi-bas">
        <b>{t("apBugun")}</b>
        <span className={sira && sira.dakika <= 60 ? "ap-sira yakin" : "ap-sira"} data-ap-siradaki>
          {sira ? (
            siradakiMetni(t, sira.olay.tur === "cagri" ? t("apCagriSon") : sira.olay.ad, sureYazisi(sira.dakika * 60_000, t), sira.olay.tur !== "cagri")
          ) : (
            t("apGunBitti")
          )}
        </span>
      </div>
      <div className="ap-cizgi-ray" dir="ltr">
        {Array.from({ length: (BIT_SAAT - BAS_SAAT) / 2 + 1 }, (_, i) => BAS_SAAT + i * 2).map((h) => (
          <span key={h} className="ap-saat" style={{ insetInlineStart: `${konum(`${h}:00`)}%` }}>
            {String(h % 24).padStart(2, "0")}
          </span>
        ))}
        {olaylar.map((o, i) => {
          const ic = (
            <>
              <i aria-hidden="true" />
              <span className="ap-olay-ad">
                <b>{o.saat}</b> {o.tur === "cagri" ? ad(o) : <Icerik>{o.ad}</Icerik>}
              </span>
            </>
          );
          const sinif = `ap-olay ${o.tur}${i % 2 ? " alt" : ""}`;
          const stil = { insetInlineStart: `${konum(o.saat)}%` };
          return o.href ? (
            <a key={i} className={sinif} style={stil} href={o.href} title={`${o.saat} · ${t(o.tur === "cagri" ? "apCagriSon" : o.tur === "toplanti" ? "apToplanti" : "apCanli")}`} data-ap-olay={o.tur}>
              {ic}
            </a>
          ) : (
            <span key={i} className={sinif} style={stil} title={`${o.saat} · ${t(o.tur === "toplanti" ? "apToplanti" : "apCanli")}`} data-ap-olay={o.tur}>
              {ic}
            </span>
          );
        })}
        <span className="ap-simdi" style={{ insetInlineStart: `${konum(simdi)}%` }} aria-hidden="true" />
      </div>
    </section>
  );
}

/* "Sıradaki: <ad> · 2 sa sonra": ad Arapça içerikse bdi içinde, metnin geri kalanı arayüzün dilinde. */
function siradakiMetni(t: ReturnType<typeof useDil>["t"], ad: string, sure: string, icerik: boolean): ReactNode {
  const [on, son] = t("apSiradaki", { ad: "\u0000", sure }).split("\u0000");
  return (
    <>
      {on}
      {icerik ? <Icerik>{ad}</Icerik> : <b>{ad}</b>}
      {son}
    </>
  );
}

/* --- Tek karar kuyruğu: satır yerinde açılır, aynı anda bir satır --- */

const TUR_TONU: Record<KuyrukOgesi["tur"], "vurgu" | "uyari" | "iyi" | undefined> = { oneri: undefined, birim: "iyi", onay: "vurgu", sartli: "uyari", talep: "vurgu", anma: undefined, hesap: undefined };

function KararKuyrugu({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const b = bugun();
  const l = kararKuyrugu(v, ben, b);
  const [acik, setAcik] = useState<string | null>(null);
  const listeRef = useRef<HTMLDivElement>(null);
  const acil = l.filter((x) => x.acil);
  const sonra = l.filter((x) => !x.acil);
  // Klavye (toplantı görünümleriyle aynı): j/k ya da oklar satırlar arasında, Esc açık satırı kapatır.
  const tus = (e: KeyboardEvent) => {
    const hedef = e.target as HTMLElement;
    if (hedef.closest("input, textarea, select, [contenteditable]")) return;
    const satirlar = [...(listeRef.current?.querySelectorAll<HTMLButtonElement>(".ap-satir-bas") ?? [])];
    const i = satirlar.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape" && acik) {
      setAcik(null);
      e.preventDefault();
    } else if (e.key === "j" || e.key === "ArrowDown") {
      satirlar[Math.min(satirlar.length - 1, i + 1)]?.focus();
      e.preventDefault();
    } else if (e.key === "k" || e.key === "ArrowUp") {
      satirlar[Math.max(0, i - 1)]?.focus();
      e.preventDefault();
    }
  };
  const grup = (ad: Anahtar, liste: KuyrukOgesi[]) =>
    liste.length > 0 && (
      <div className="ap-grup" data-ap-grup={ad}>
        <h3>
          {t(ad)} <small>{liste.length}</small>
        </h3>
        <ul>
          {liste.map((x) => (
            <KuyrukSatiri key={x.id} ben={ben} x={x} acik={acik === x.id} ac={(a) => setAcik(a ? x.id : null)} />
          ))}
        </ul>
      </div>
    );
  return (
    <section className="ap-sutun ap-kararlar" aria-label={t("apKararlar")} data-ap-sutun="kararlar">
      <header className="ap-sutun-bas">
        <h2>{t("apKararlar")}</h2>
        <span className="ap-sayi">{l.length}</span>
      </header>
      <div className="ap-sutun-govde" ref={listeRef} onKeyDown={tus}>
        {l.length === 0 ? (
          <p className="ap-bos">{t("apKuyrukBos")}</p>
        ) : (
          <>
            {grup("apAcil", acil)}
            {grup("apSonra", sonra)}
          </>
        )}
      </div>
    </section>
  );
}

function KuyrukSatiri({ ben, x, acik, ac }: { ben: Kisi; x: KuyrukOgesi; acik: boolean; ac: (a: boolean) => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const ref = useRef<HTMLLIElement>(null);
  // Açılan satır görünür alana gelsin (sütun kendi içinde kayıyor).
  useEffect(() => {
    if (acik) ref.current?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [acik]);
  const kisi = kisiBul(v, x.kisiId);
  const baslik = x.tur === "hesap" ? (kisi ? ad(kisi) : "") : x.baslik;
  return (
    <li ref={ref} className={`ap-satir${acik ? " acik" : ""}`} data-ap-karar={x.tur} data-ap-ref={x.ref}>
      <button type="button" className="ap-satir-bas" aria-expanded={acik} onClick={() => ac(!acik)}>
        <span className="ap-satir-ust">
          <Rozet ton={TUR_TONU[x.tur]}>{t(`apTur_${x.tur}` as Anahtar)}</Rozet>
          <span className="ap-satir-baslik">{x.icerik ? <Icerik>{baslik}</Icerik> : <span dir="auto">{baslik}</span>}</span>
        </span>
        <span className="ap-satir-meta">
          {kisi && x.tur !== "hesap" && <bdi>{ad(kisi)}</bdi>}
          {x.zaman && <span>{gecenSure(x.zaman, dil)}</span>}
          {x.son && <span className={x.son < bugun() ? "kotu-yazi" : x.son <= gunEkle(bugun(), 1) ? "uyari-yazi" : ""}>{tarihYaz(x.son, dil, "kisa")}</span>}
        </span>
        <ChevronDown size={16} className="ap-ok" aria-hidden="true" />
      </button>
      {acik && (
        <div className="ap-satir-govde" data-ap-acik={x.tur}>
          <SatirGovdesi ben={ben} x={x} kapat={() => ac(false)} />
        </div>
      )}
    </li>
  );
}

/* Açılan satırın içi: kararın kendisi, var olan bileşenlerle (pencere açılmadan). */
function SatirGovdesi({ ben, x, kapat }: { ben: Kisi; x: KuyrukOgesi; kapat: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  if (x.tur === "oneri" || x.tur === "birim") {
    const o = v.oneriler.find((y) => y.id === x.ref);
    return o ? <OneriAyrinti key={o.id} ben={ben} oneri={o} kapat={kapat} yerinde ekleMetni={t("planaEkle")} /> : null;
  }
  if (x.tur === "anma") {
    const a = (v.bahsetmeler ?? []).find((y) => y.id === x.ref);
    if (!a) return null;
    return (
      <div className="ap-anma">
        <p dir="auto">{a.metin}</p>
        <div className="dugmeler">
          <a className="dugme dugme-ikincil dugme-kucuk" href={a.yol} onClick={() => bahsetmeGoruldu(ben, a.id)}>
            {t("pySayfayiAc")}
          </a>
          <button type="button" className="dugme dugme-kucuk" onClick={() => bahsetmeGoruldu(ben, a.id)} data-ap-gordum>
            <Check size={14} /> {t("anGordum")}
          </button>
        </div>
      </div>
    );
  }
  if (x.tur === "hesap")
    return (
      <div className="dugmeler">
        <a className="dugme dugme-kucuk" href="#/organizasyon/hesaplar">
          {t("hesaplar")}
        </a>
      </div>
    );
  const p = v.paketler.find((y) => y.id === x.ref);
  if (!p) return null;
  return (
    <div className="ap-paket">
      <p className="ap-paket-bag">
        <a href={`#/paketler/${p.id}`}>{p.kod}</a>
        {p.sonTarih && <span className="sonuk-yazi"> · {tarihYaz(p.sonTarih, dil, "kisa")}</span>}
      </p>
      {x.tur === "onay" && (
        <>
          {/* "Yapıldı"nın onayı masrafı da onaylıyor: onaylayan tutarı burada görsün. */}
          {p.masraflar?.length ? (
            <div className="ap-masraf" data-ap-masraf>
              <b dir="ltr">{masrafYaz(masrafToplami(p.masraflar))}</b>
              <MasrafListesi masraflar={p.masraflar} />
            </div>
          ) : null}
          <PaketSonucDugmeleri ben={ben} paket={p} kucuk />
        </>
      )}
      {x.tur === "sartli" && (
        <>
          <p dir="auto">{p.kosul}</p>
          <div className="dugmeler">
            <button className="dugme dugme-kucuk dugme-iyi" onClick={() => confirm(t("paketKabulOnay")) && paketDurum(ben, p.id, "onaylandi")} data-sartli-kabul>
              <Check size={14} /> {t("kabulEt")}
            </button>
            <button className="dugme dugme-kucuk dugme-kotu" onClick={() => confirm(t("paketRetOnay")) && paketReddet(ben, p.id)} data-sartli-ret>
              <X size={14} /> {t("reddet")}
            </button>
          </div>
        </>
      )}
      {x.tur === "talep" && (
        <ul className="liste">
          <TalepSatiri ben={ben} p={p} />
        </ul>
      )}
    </div>
  );
}

/* --- Planlar ve üretimdeki paketler --- */

function PlanlarSutunu({ ben }: { ben: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const b = bugun();
  const k = kararlariGetir(v, ben, b);
  const nd = k.nextDay;
  const hf = k.weekly;
  const cagri = cagriDurumu(v, b);
  const uretim = uretimdekiler(v, b);
  const takvim = yaklasanlar(gorunenFaaliyetler(v, ben), 7, b).slice(0, 4);
  const ay = v.aylik.find((a) => a.ay === b.slice(0, 7));
  const ozel = v.ozel.filter((o) => (o.bitis ?? o.tarih) >= b).sort((x, y) => x.tarih.localeCompare(y.tarih))[0];
  const basliklar = nd?.basliklar ?? [];
  return (
    <section className="ap-sutun ap-planlar" aria-label={t("apPlanlar")} data-ap-sutun="planlar">
      <header className="ap-sutun-bas">
        <h2>{t("apPlanlar")}</h2>
      </header>
      <div className="ap-sutun-govde">
        {/* Next Day günün ekseni: büyük kart, başlıkları yerinde açılır. */}
        <details className="ap-plan ana" data-ap-plan="nextday">
          <summary>
            <span className="ap-plan-ad">
              <b>{t("mNextday")}</b>
              {nd && <small>{tarihYaz(nd.tarih, dil, "kisa")}</small>}
              {nd && <Rozet>{t(PLAN_DURUM_ADI[nd.durum])}</Rozet>}
            </span>
            <span className="ap-plan-sayilar">
              <span>{t("baslikSayisi", { n: basliklar.length })}</span>
              {k.nextDayPkg > 0 && <span className="uyari-yazi">{t("pyKararsizPkg", { n: k.nextDayPkg })}</span>}
              {cagri && <span>{t("apYanit", { y: cagri.yanitlayan, n: cagri.toplam })}</span>}
            </span>
            <ChevronDown size={16} className="ap-ok" aria-hidden="true" />
          </summary>
          <ol className="ap-basliklar">
            {basliklar.map((x) => (
              <li key={x.id}>
                <a href={`#/nextday/${nd!.id}`}>
                  <Icerik>{v.basliklar.find((y) => y.id === x.baslikId)?.ad ?? ""}</Icerik>
                </a>
              </li>
            ))}
          </ol>
          <div className="dugmeler">
            <a className="dugme dugme-kucuk" href={nd ? `#/nextday/${nd.id}` : "#/nextday/yarin"} data-ap-ac="nextday">
              {t("ac")}
            </a>
            {nd?.durum === "toplantida" && (
              <a className="dugme dugme-ikincil dugme-kucuk" href={`#/nextday/${nd.id}/toplanti`}>
                {t("apToplantiGorunumu")}
              </a>
            )}
          </div>
        </details>
        <a className="ap-plan" href={hf ? `#/haftalik/${hf.id}` : "#/haftalik"} data-ap-plan="weekly">
          <span className="ap-plan-ad">
            <b>{t("mHaftalik")}</b>
            {hf && <small>{tarihYaz(hf.baslangic, dil, "kisa")}</small>}
            {hf && <Rozet>{t(HAFTA_DURUM_ADI[hf.durum])}</Rozet>}
          </span>
          {k.weeklyKarar > 0 && <span className="uyari-yazi">{t("pyKararBekleyen", { n: k.weeklyKarar })}</span>}
        </a>
        <div className="ap-plan-cift">
          <a className="ap-plan kucuk" href="#/aylik" data-ap-plan="aylik">
            <b>{t("mAylik")}</b>
            <small>{ay ? t(ay.durum === "onayli" ? "ayOnayli" : "hazirlaniyor") : t("pyPlanYok")}</small>
          </a>
          <a className="ap-plan kucuk" href={ozel ? `#/ozel/${ozel.id}` : "#/ozel"} data-ap-plan="ozel">
            <b>{t("mOzel")}</b>
            <small>{ozel ? <Icerik>{ozel.ad}</Icerik> : t("pyPlanYok")}</small>
          </a>
        </div>
        <div className="ap-blok" data-ap-takvim>
          <h3>
            <a href="#/takvim">{t("apYaklasan")}</a>
          </h3>
          {takvim.length === 0 ? (
            <p className="ap-bos">{t("apTakvimBos")}</p>
          ) : (
            <ul className="ap-takvim">
              {takvim.map((o) => (
                <li key={`${o.f.id}-${o.bas}`}>
                  <small>{tarihYaz(o.bas, dil, "kisa")}</small>
                  <a href={`#/takvim/faaliyet/${o.f.id}`}>
                    <Icerik>{o.f.baslik}</Icerik>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="ap-blok" data-ap-uretim>
          <h3>
            {t("apUretim")} <small>{uretim.length}</small>
          </h3>
          {uretim.length === 0 ? (
            <p className="ap-bos">{t("apUretimBos")}</p>
          ) : (
            <ul className="ap-uretim">
              {uretim.map(({ paket: p, asama, kimde, beri }) => {
                const dk = (Date.now() - new Date(beri).getTime()) / 60_000;
                const kim = kimde === "muhabir" ? ad(kisiBul(v, p.muhabirId)) : kimde ? birimAdi(kimde) : "";
                return (
                  <li key={p.id} className={dk > UZUN_DAKIKA ? "uzun" : ""} data-ap-uretim-paket={p.id}>
                    <a href={`#/paketler/${p.id}`}>
                      <Icerik>{p.baslik}</Icerik>
                    </a>
                    <small>
                      {asama}
                      {kim && (
                        <>
                          {" · "}
                          <bdi>{kim}</bdi>
                        </>
                      )}
                      {" · "}
                      {sureYazisi(Math.max(0, dk) * 60_000, t)}
                    </small>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* --- Muhabirler ve posta --- */

function InsanlarSutunu({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const b = bugun();
  const cagri = cagriDurumu(v, b);
  const sessiz = (cagri?.sessiz ?? []).map((id) => kisiBul(v, id)).filter((k): k is Kisi => !!k);
  const disarida = muhabirler(v)
    .filter((k) => !k.pasif)
    .map((k) => ({ k, durum: kisiBugunDurumu(v, k, b) }))
    .filter((x) => x.durum !== "gorevde");
  const okuma = v.postaOkunan?.[ben.id];
  const yeni = new Map<string, PostaMesaji>();
  for (const m of gorunenPostalar(v, okuma?.grup).filter((m) => okunmamisMi(okuma, m)).sort((x, y) => y.zaman.localeCompare(x.zaman))) if (!yeni.has(m.konuKimligi)) yeni.set(m.konuKimligi, m);
  const postalar = [...yeni.values()].slice(0, 5);
  return (
    <section className="ap-sutun ap-insanlar" aria-label={t("pyMuhabirler")} data-ap-sutun="insanlar">
      <header className="ap-sutun-bas">
        <h2>
          <a href="#/muhabirler">{t("pyMuhabirler")}</a>
        </h2>
      </header>
      <div className="ap-sutun-govde">
        {cagri && (
          <div className="ap-blok" data-ap-yanitsiz>
            <h3>
              {t("apYanitsiz")} <small>{sessiz.length}</small>
            </h3>
            <ul className="ap-kisiler">
              {sessiz.map((k) => (
                <li key={k.id} data-ap-sessiz={k.id}>
                  <KisiCipi ben={ben} kisi={k} />
                  {k.telefon && <WhatsAppDugmesi telefon={k.telefon} />}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="ap-blok" data-ap-disarida>
          <h3>
            {t("apSahadaIzinde")} <small>{disarida.length}</small>
          </h3>
          {disarida.length === 0 ? (
            <p className="ap-bos">{t("apHerkesGorevde")}</p>
          ) : (
            <ul className="ap-kisiler">
              {disarida.map(({ k, durum }) => (
                <li key={k.id}>
                  <KisiCipi ben={ben} kisi={k} />
                  <span className={`durum-hap kd-${durum}`}>{t(KISI_DURUM_ADI[durum])}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="ap-blok" data-ap-posta>
          <h3>
            <a href="#/posta">{t("mPosta")}</a> <small>{postalar.length ? [...yeni.keys()].length : ""}</small>
          </h3>
          {postalar.length === 0 ? (
            <p className="ap-bos">{t("apPostaBos")}</p>
          ) : (
            <ul className="ap-posta">
              {postalar.map((m) => (
                <li key={m.id}>
                  <a href="#/posta">
                    <b dir="auto">{postaKonuBasligi(m.konu)}</b>
                    <small>
                      <bdi>{m.kimdenAd ?? m.kimden.split("@")[0]}</bdi> · {gecenSure(m.zaman, dil)}
                    </small>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
