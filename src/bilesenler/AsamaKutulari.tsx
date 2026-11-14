import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { CircleCheck, Circle, CircleDot, CircleAlert, Copy, Lock, SlidersHorizontal, Trash2, Undo2 } from "lucide-react";
import { asamaListesi, durakBul, stokDurumu, type GorunenAsama } from "../akis";
import { birimAdi } from "../yapi";
import { metin as dilMetni, saatYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { baslikBul, kisiBul, oneriBul, planBul, useVeri, type BirimId, type Kisi, type KunyeRolu, type Paket } from "../veri";
import { paketKunyesi, type KunyeSatiri } from "../kunye";
import { useAdimDurumu } from "../yol";
import { yerelGun } from "../tarih";
import { ASAMA_ADI, PARCA_ADI, asamaYolda, gfxAcik, gfxBekliyor, istisnaAsamalari, sablonAdi, uretimSablonlari } from "../uretim";
import { OZEL_PAKET_ASAMALARI, ozelPaketAsamasi } from "../ozel";
import { STOK_DURUM_ADI } from "../etiketler";
import { asamaNotuEkle, asamaNotuSil, asamaNotuSilebilir, gfxTamamla } from "../eylemler";
import { asamaNotuGorur, gfxYapabilir } from "../yetki";
import { KararNotlari } from "../ekranlar/haftalik/Kalem";
import { KunyeListesi } from "./Kunye";
import { AnmaGirdisi } from "./Anma";
import { HarekeliMetin } from "./Hareke";
import { PAKET_ASAMA_ADI } from "./OzelGorevler";
import { UretimBalonuDugmesi } from "./UretimBalonu";
import { Icerik, Rozet, bildir } from "./Parcalar";

/*
 * Aşama kutuları (kullanıcı: kutular yalnız aşamayı göstermesin, iş kutunun
 * içinde olsun; basınca içerik açılsın, ilerleyince iş hangi kutudaysa oraya
 * gidilsin; belgeler/asama-kutulari-brifing.md). Dikey liste, tek kutu açık:
 * telefonda içerik açılan kutunun içinde, masaüstünde sağ sütunda. Şimdiki
 * kutuda paketin işi (sayfanın işlem kartı), geçmiş kutuda o adımı yapanlar
 * (künye) ve adımın çıktısı, gelecekte yalnız kimin yapacağı. Adımın bilgisi
 * (öneri, plan, video, klip kodu, yayın) yalnız kendi kutusunda: Bilgiler
 * kartında tekrar edilmez. Seçim geçmiş adımında; seçim yokken kişinin sırası
 * olan kutu açık ve iş ilerleyince yeni kutuya geçilir.
 */

const MASAUSTU = "(min-width: 961px)";
function useMasaustu() {
  return useSyncExternalStore(
    (d) => {
      const m = matchMedia(MASAUSTU);
      m.addEventListener("change", d);
      return () => m.removeEventListener("change", d);
    },
    () => matchMedia(MASAUSTU).matches,
  );
}

// Geçmiş kutuda hangi künye satırları: adımın türünden (durak kimliği yola göre değişiyor).
const TUR_ROLLERI: Record<string, (KunyeRolu | "oneren" | "muhabir")[]> = {
  planlama: ["oneren"],
  "sade-planda": ["oneren", "gorevlendiren"],
  "sade-muhabirde": ["muhabir"],
  masa: ["gorevlendiren"],
  newsdesk: ["gorevlendiren"],
  gorevlendirme: ["gorevlendiren"],
  metin: ["muhabir", "metin", "dil"],
  kontrol: ["metin"],
  dil: ["dil"],
  video: ["muhabir"],
  videoKontrol: ["videoKontrol"],
  media: ["yukleyen"],
  inews: ["yukleyen"],
  "oz-gorevli": ["gorevlendiren"],
  "oz-hazirlaniyor": ["muhabir"],
};
const SON_KUTU = new Set(["tamam", "sade-tamam", "oz-hazir"]);

/*
 * Özel yayın paketi kendi aşamalarıyla yürüyor (ozel.ts): öneri, onay,
 * görevlendirme, hazırlık, hazır. İşi yapan dış muhabir ya da stok ekibi.
 */
const ozelListesi = (p: Paket): GorunenAsama[] => {
  const simdi = OZEL_PAKET_ASAMALARI.indexOf(ozelPaketAsamasi(p));
  const yapan: BirimId = p.ozelKaynak === "inhouse" ? "planlama" : "muhabir";
  const masalar: (BirimId | undefined)[] = ["planlama", "planlama", "planlama", yapan, undefined];
  return OZEL_PAKET_ASAMALARI.map((a, i) => ({
    id: `oz-${a}`,
    ad: dilMetni(PAKET_ASAMA_ADI[a]),
    masa: masalar[i],
    durum: p.durum === "iptal" ? "" : i < simdi || (a === "hazir" && i === simdi) ? "gecti" : i === simdi ? "simdi" : "",
  }));
};

/*
 * Gfx yan iş: dil denetiminden sonra video kontrolüyle yan yana yürüyor.
 * Sıralı adım gibi gösterilmez (Grafik'te tıkanmış görünürdü): metnin hemen
 * arkasında kendi kutusu, yolun "şimdi"sini değiştirmez.
 */
const gfxKutusu = (p: Paket): GorunenAsama | null => {
  const u = p.uretim;
  if (!u || !u.parca.gfx || !asamaYolda(u, "grafik")) return null;
  return {
    id: "gfx",
    ad: dilMetni(ASAMA_ADI.grafik),
    masa: u.yol.grafik === "atla" ? undefined : (u.yol.grafik as BirimId),
    durum: p.durum === "iptal" ? "" : u.gfxTamam || p.durum === "tamamlandi" ? "gecti" : gfxAcik(p) ? "simdi" : "",
  };
};

const listeKur = (p: Paket): GorunenAsama[] => {
  const liste = p.ozelId ? ozelListesi(p) : asamaListesi(p);
  const gfx = gfxKutusu(p);
  if (!gfx) return liste;
  // Metin durağının arkasına; metin durağı yoksa video kontrolünden önce.
  const i = liste.findIndex((a) => durakBul(p, a.id)?.tur === "metin" || a.id === "metin");
  const j = i >= 0 ? i + 1 : Math.max(0, liste.findIndex((a) => a.id === "videoKontrol" || SON_KUTU.has(a.id)));
  return [...liste.slice(0, j), gfx, ...liste.slice(j)];
};

const DurumIkonu = ({ durum }: { durum: GorunenAsama["durum"] }) =>
  durum === "gecti" ? <CircleCheck size={18} /> : durum === "simdi" ? <CircleDot size={18} /> : durum === "gecikti" ? <CircleAlert size={18} /> : <Circle size={18} />;

export function AsamaKutulari({ ben, paket, eylem, kutu }: { ben: Kisi; paket: Paket; eylem: ReactNode; kutu?: string }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const masaustu = useMasaustu();
  const iptal = paket.durum === "iptal";
  const liste = listeKur(paket);
  // Yolun şimdisi (gfx yan iş sayılmaz); gfx kişinin sırasıysa onun kutusu açılır.
  const simdi = liste.find((a) => a.id !== "gfx" && (a.durum === "simdi" || a.durum === "gecikti"));
  const gfxSirasi = gfxAcik(paket) && gfxYapabilir(ben, paket);
  const bitti = liste.filter((a) => a.durum === "gecti").at(-1);
  const varsayilan = iptal ? "" : gfxSirasi ? "gfx" : (simdi?.id ?? bitti?.id ?? "");
  // "" kişinin seçimi yok demek: şimdiki kutuyu izler. "-" telefonda bütün kutular kapalı.
  // Bildirimden gelen adres kutuyu söylüyor (`#/paketler/<id>/<kutu>`): o kutu seçili açılır.
  const [secim, setSecim] = useAdimDurumu<string>(`paket:${paket.id}:asama`, kutu ?? "");
  const acik = iptal || secim === "-" ? "" : liste.some((a) => a.id === secim) ? secim : varsayilan;
  const kutular = useRef<HTMLOListElement>(null);
  const [gorunum, setGorunum] = useGorunum();

  // Aynı sayfadayken başka bildirime basılınca da o kutu açılsın.
  useEffect(() => {
    if (!kutu) return;
    setSecim(kutu);
    kutular.current?.querySelector(`[data-asama-kutu="${kutu}"]`)?.scrollIntoView({ block: "nearest" });
  }, [kutu]); // eslint-disable-line react-hooks/exhaustive-deps

  // Açık tuttuğu kutuyu bir başkası geçirdiyse kişi bilsin: düğmeler kalkıyor, sayfa kaymıyor.
  const acikDurum = liste.find((a) => a.id === acik)?.durum;
  const oncekiDurum = useRef({ id: acik, durum: acikDurum });
  const [gecen, setGecen] = useState<string | null>(null);
  useEffect(() => {
    const o = oncekiDurum.current;
    oncekiDurum.current = { id: acik, durum: acikDurum };
    if (o.id !== acik) return setGecen(null);
    if ((o.durum === "simdi" || o.durum === "gecikti") && acikDurum === "gecti") {
      const son = v.hareketler.filter((h) => h.paketId === paket.id).at(-1);
      setGecen(son && son.kisiId !== ben.id ? son.kisiId : null);
    }
  }, [acik, acikDurum]); // eslint-disable-line react-hooks/exhaustive-deps

  // İş ilerleyince (kişinin kendi işiyle ya da başkasınınkiyle) yeni kutuya kayılır; seçim yapılmışsa dokunulmaz.
  const onceki = useRef(varsayilan);
  useEffect(() => {
    if (onceki.current === varsayilan) return;
    onceki.current = varsayilan;
    if (secim !== "" || !varsayilan) return;
    kutular.current?.querySelector(`[data-asama-kutu="${varsayilan}"]`)?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [varsayilan, secim]);

  const kunye = paketKunyesi(v, paket);
  const plan = planBul(v, paket.planId);
  const yayinPlani = planBul(v, paket.yayinlandi?.planId);
  const oneri = oneriBul(v, paket.oneriId);
  const baslik = plan?.basliklar.find((b) => b.id === paket.planBaslikId);

  // Adımın kendi bilgisi: geçmişte de şimdide de kutunun başında.
  const bilgi = (id: string, tur: string): ReactNode => {
    if (id === "planlama" || id === "sade-planda" || id === "oz-plan") {
      const u = paket.uretim;
      const sablon = u && uretimSablonlari(v).find((s) => s.id === u.sablon);
      const istisna = u ? istisnaAsamalari(u, sablon) : [];
      return (
        <div className="asama-bilgi" data-asama-bilgi="planlama">
          <dl className="kunye">
            {oneri && (
              <div className="kunye-satir">
                <dt>{t("oneri")}</dt>
                <dd>
                  <a href={`#/oneriler/${oneri.id}`}>
                    <Icerik>{oneri.haberBasligi}</Icerik>
                  </a>
                </dd>
              </div>
            )}
            {plan && (
              <div className="kunye-satir">
                <dt>{t("plan")}</dt>
                <dd>
                  <a href={`#/nextday/${plan.id}`}>{tarihYaz(plan.tarih, dil, "kisa")}</a>
                  {baslik && (
                    <>
                      {" · "}
                      <Icerik>{baslikBul(v, baslik.baslikId)?.ad}</Icerik>
                    </>
                  )}
                </dd>
              </div>
            )}
            {u && (
              <div className="kunye-satir" data-uretim-ozet>
                <dt>{t("urSablon")}</dt>
                <dd>
                  {sablon ? sablonAdi(sablon) : "—"}
                  {istisna.map((a) => (
                    <Rozet key={a} ton="uyari">
                      {t("urIstisna")}: {t(ASAMA_ADI[a])}
                    </Rozet>
                  ))}
                </dd>
              </div>
            )}
          </dl>
          <KararNotlari kalem={paket} />
          {u && paket.durum === "uretimde" && (
            <div className="dugmeler">
              <UretimBalonuDugmesi ben={ben} paket={paket} kucuk />
            </div>
          )}
        </div>
      );
    }
    if ((tur === "videoKontrol" || tur === "video") && paket.video)
      return (
        <p className="asama-bilgi">
          <a href={paket.video} target="_blank" rel="noreferrer" dir="ltr" data-video-baglanti>
            {paket.video}
          </a>
        </p>
      );
    if ((tur === "inews" || tur === "media") && paket.klipKodu)
      return (
        <p className="asama-bilgi">
          {t("klipKodu")}: <b dir="ltr">{paket.klipKodu}</b>
        </p>
      );
    if (SON_KUTU.has(id)) {
      const stok = stokDurumu(paket);
      if (yayinPlani)
        return (
          <p className="asama-bilgi">
            <a href={`#/nextday/${yayinPlani.id}`}>
              {t("sdYayinlandi")} · {tarihYaz(yayinPlani.tarih, dil, "kisa")}
            </a>
          </p>
        );
      if (stok && paket.durum === "tamamlandi") return <p className="asama-bilgi">{t(STOK_DURUM_ADI[stok])}</p>;
    }
    return null;
  };

  const icerik = (a: GorunenAsama) => {
    const tur = durakBul(paket, a.id)?.tur ?? a.id;
    if (a.id === "gfx") return <GfxIcerigi ben={ben} paket={paket} durum={a.durum} />;
    const sonKutu = SON_KUTU.has(a.id) && a.id === varsayilan;
    if (a.durum === "simdi" || a.durum === "gecikti" || sonKutu) {
      const muhabir = kisiBul(v, paket.muhabirId);
      return (
        <>
          {a.durum !== "gecti" && (
            <p className="asama-kimde" data-asama-kimde>
              {a.masa && t("simdiKimdeKisa", { birim: birimAdi(a.masa) + (a.masa === "muhabir" && muhabir ? ` · ${ad(muhabir)}` : "") })}
              {paket.teslim && (
                <span className={a.durum === "gecikti" ? "kotu-yazi" : "sonuk"}>
                  {" · "}
                  {t("teslim")} {tarihYaz(yerelGun(paket.teslim), dil, "kisa")} {saatYaz(paket.teslim, dil)}
                </span>
              )}
            </p>
          )}
          {bilgi(a.id, tur)}
          {(tur === "inews" || tur === "media") && gfxBekliyor(paket) && <p className="uyari-yazi" data-gfx-bekleniyor>{t("urGfxBekleniyor")}</p>}
          {eylem}
          {sonKutu && <KunyeListesi satirlar={kunye} />}
        </>
      );
    }
    if (a.durum === "gecti") {
      const roller = TUR_ROLLERI[tur] ?? [];
      const satirlar: KunyeSatiri[] = kunye.filter((s) => roller.includes(s.rol as KunyeRolu));
      const b = bilgi(a.id, tur);
      return (
        <>
          {b}
          {satirlar.length ? <KunyeListesi satirlar={satirlar} /> : !b && <p className="sonuk">{t("akYapildi")}</p>}
        </>
      );
    }
    return <p className="sonuk">{a.masa ? t("akYapacak", { birim: birimAdi(a.masa) }) : t("akSirada")}</p>;
  };

  // Kutunun içi: geçildi uyarısı, adımın işi ya da izi, ekibe özel not.
  const kutuIci = (a: GorunenAsama) => (
    <>
      {gecen && a.id === acik && (
        <p className="asama-gecildi" data-asama-gecildi>
          {t("akGecildi", { kisi: ad(kisiBul(v, gecen)) })}
        </p>
      )}
      {icerik(a)}
      {asamaNotuGorur(ben) && a.durum && <AsamaNotlari ben={ben} paket={paket} asama={a.id} />}
    </>
  );

  // Kutunun satırında aşamanın süresi ve iadesi (asamaIzi.ts); izi olmayan eski pakette boş.
  const sure = (a: GorunenAsama): ReactNode => {
    const iz = paket.asamaIzi?.[a.id];
    if (!iz) return null;
    const ms = iz.sure + (iz.giris ? Date.now() - new Date(iz.giris).getTime() : 0);
    return (
      <span className="asama-sure" data-asama-sure>
        {ms >= 60_000 && sureYazisi(ms, t)}
        {!!iz.iade && (
          <span className="asama-iade" title={t("akIade", { n: iz.iade })} aria-label={t("akIade", { n: iz.iade })}>
            <Undo2 size={12} /> {iz.iade}
          </span>
        )}
      </span>
    );
  };

  const satir = (a: GorunenAsama, i: number) => (
    <li key={a.id} className={`asama-kutu ${a.durum}${a.id === acik ? " acik" : ""}${a.id === "gfx" ? " yan-is" : ""}`} data-asama-kutu={a.id} data-asama-durum={a.durum || "bekliyor"}>
      <button
        type="button"
        className="asama-kutu-bas"
        aria-expanded={a.id === acik}
        // İptal paketin kutuları sönük, açılmaz: yol yarıda kaldı.
        aria-disabled={iptal || undefined}
        onClick={() => !iptal && setSecim(a.id === acik && !masaustu ? "-" : a.id)}
      >
        <span className="asama-ikon">
          <DurumIkonu durum={a.durum} />
        </span>
        <span className="asama-ad">
          <small>{a.id === "gfx" ? "+" : i + 1 - (liste.slice(0, i).some((x) => x.id === "gfx") ? 1 : 0)}</small> {a.ad}
        </span>
        <span className="asama-masa">
          {a.masa && birimAdi(a.masa)}
          {sure(a)}
        </span>
      </button>
      {!masaustu && a.id === acik && (
        <div className="asama-icerik" data-asama-icerik={a.id}>
          {kutuIci(a)}
        </div>
      )}
    </li>
  );

  const secili = liste.find((a) => a.id === acik);
  // Kişi başka kutuya bakarken işin bulunduğu yer tek satırda; basınca oraya döner (seçim kalkar).
  const simdiSatiri = simdi && acik !== simdi.id && acik !== varsayilan && !iptal;
  return (
    <section
      className={`asama-kutulari${iptal ? " iptal" : ""}`}
      data-asama-kutulari
      data-siklik={masaustu ? gorunum.siklik : undefined}
      data-karsitlik={masaustu ? gorunum.karsitlik : undefined}
      style={masaustu ? ({ "--ak-yazi": gorunum.yazi, "--ak-metin": gorunum.metin, "--ak-sol": SOL_SUTUN[gorunum.sol] } as CSSProperties) : undefined}
    >
      <div className="asama-ust">
        <h2 className="asama-baslik">{t("asamalar")}</h2>
        {simdiSatiri && (
          <button type="button" className="asama-simdi-satiri" onClick={() => setSecim(varsayilan === simdi.id ? "" : simdi.id)} data-asama-simdi>
            {t("akSimdi", { adim: simdi.ad })} <span className="yon">›</span>
          </button>
        )}
        {masaustu && <GorunumAyari gorunum={gorunum} degistir={setGorunum} />}
      </div>
      <div className="asama-duzen">
        <ol className="asama-listesi" data-asama-listesi ref={kutular}>
          {liste.map(satir)}
        </ol>
        {masaustu && (
          <div className="asama-icerik asama-yan" data-asama-icerik={secili?.id ?? ""}>
            {secili ? (
              <>
                <h3>{secili.ad}</h3>
                {kutuIci(secili)}
              </>
            ) : (
              <>
                <p className="sonuk">{t(iptal ? "pdIptal" : "akSirada")}</p>
                {eylem}
              </>
            )}
          </div>
        )}
      </div>
      {!masaustu && iptal && eylem}
    </section>
  );
}

/*
 * Gfx kutusu: dil denetiminden geçmiş gfx parçasının metni salt okunur
 * (grafikte düzenlenmez), kopyalanır; "Gfx hazır" grafik ekibinde.
 */
function GfxIcerigi({ ben, paket, durum }: { ben: Kisi; paket: Paket; durum: GorunenAsama["durum"] }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const adlar = (["tr", "ar", "en"] as const).map((d) => dilMetni(PARCA_ADI.gfx, d).toLocaleLowerCase());
  const parca = paket.parcalar?.find((x) => adlar.includes(x.ad.trim().toLocaleLowerCase()));
  const tamam = paket.uretim?.gfxTamam;
  const masa = paket.uretim?.yol.grafik;
  if (!durum && !tamam) return <p className="sonuk">{masa && masa !== "atla" ? t("akYapacak", { birim: birimAdi(masa as BirimId) }) : t("akSirada")}</p>;
  const kopyala = () => parca && navigator.clipboard?.writeText(parca.metin).then(() => bildir(t("bKopyalandi")));
  return (
    <div className="form" data-gfx-kutusu>
      {parca && parca.asama === "tamam" && (
        <>
          <div className="metin-kutu">
            <Icerik blok>
              <HarekeliMetin metin={parca.metin} />
            </Icerik>
          </div>
          <div className="dugmeler">
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kopyala} data-gfx-kopyala>
              <Copy size={14} /> {t("baglantiyiKopyala")}
            </button>
          </div>
        </>
      )}
      {tamam ? (
        <dl className="kunye">
          <div className="kunye-satir">
            <dt>{t("urGfxHazir")}</dt>
            <dd>
              <span className="kunye-kisi">
                <bdi>{ad(kisiBul(v, tamam.kisiId))}</bdi>
                <small>
                  {tarihYaz(yerelGun(tamam.zaman), dil, "kisa")} {saatYaz(tamam.zaman, dil)}
                </small>
              </span>
            </dd>
          </div>
        </dl>
      ) : (
        gfxYapabilir(ben, paket) && (
          <div className="form-alt">
            <button type="button" className="dugme dugme-iyi" onClick={() => gfxTamamla(ben, paket.id) && bildir(t("bAdimTamam"))} data-gfx-hazir>
              <CircleCheck size={15} /> {t("urGfxHazir")}
            </button>
          </div>
        )
      )}
    </div>
  );
}

/*
 * Masaüstü görünüm ayarları (kullanıcı kararı: erişilebilirlik; yazı ve
 * Arapça metin boyu, sıklık, karşıtlık, adım sütunu). Kişiye değil
 * tarayıcıya bağlı görünüm tercihi, kayıtta değil.
 */
interface Gorunum {
  yazi: number;
  metin: number;
  siklik: "rahat" | "siki";
  sol: "dar" | "orta" | "genis";
  karsitlik: "normal" | "yuksek";
}
const VARSAYILAN_GORUNUM: Gorunum = { yazi: 1, metin: 1, siklik: "rahat", sol: "orta", karsitlik: "normal" };
const GORUNUM_ANAHTARI = "trt-planlama-asama-gorunum";
const SOL_SUTUN: Record<Gorunum["sol"], string> = { dar: "13em", orta: "18em", genis: "24em" };
const OLCEKLER = [0.9, 1, 1.15, 1.3, 1.5];

function useGorunum(): [Gorunum, (g: Gorunum) => void] {
  const [g, setG] = useState<Gorunum>(() => {
    try {
      return { ...VARSAYILAN_GORUNUM, ...JSON.parse(localStorage.getItem(GORUNUM_ANAHTARI) ?? "{}") };
    } catch {
      return VARSAYILAN_GORUNUM;
    }
  });
  const degistir = (y: Gorunum) => {
    setG(y);
    try {
      localStorage.setItem(GORUNUM_ANAHTARI, JSON.stringify(y));
    } catch {
      /* Gizli pencere: yalnız bu sayfada. */
    }
  };
  return [g, degistir];
}

function GorunumAyari({ gorunum, degistir }: { gorunum: Gorunum; degistir: (g: Gorunum) => void }) {
  const { t } = useDil();
  const [acik, setAcik] = useState(false);
  const olcek = (alan: "yazi" | "metin", yon: number) => {
    const i = Math.max(0, Math.min(OLCEKLER.length - 1, OLCEKLER.indexOf(gorunum[alan]) + yon));
    degistir({ ...gorunum, [alan]: OLCEKLER[i < 0 ? 1 : i] });
  };
  const secim = <K extends "siklik" | "sol" | "karsitlik">(alan: K, degerler: [Gorunum[K], Anahtar][]) => (
    <div className="ak-secim" role="group">
      {degerler.map(([d, ad]) => (
        <button key={d} type="button" className="dugme dugme-ikincil dugme-kucuk" aria-pressed={gorunum[alan] === d} onClick={() => degistir({ ...gorunum, [alan]: d })} data-ak-ayar={`${alan}-${d}`}>
          {t(ad)}
        </button>
      ))}
    </div>
  );
  const boy = (alan: "yazi" | "metin") => (
    <div className="ak-secim" role="group">
      <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => olcek(alan, -1)} title={t("akKucult")} aria-label={t("akKucult")} data-ak-ayar={`${alan}-kucult`}>
        A−
      </button>
      <output>{Math.round(gorunum[alan] * 100)}%</output>
      <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => olcek(alan, 1)} title={t("akBuyut")} aria-label={t("akBuyut")} data-ak-ayar={`${alan}-buyut`}>
        A+
      </button>
    </div>
  );
  return (
    <div className="ak-gorunum">
      <button type="button" className="ikon-dugme" aria-expanded={acik} onClick={() => setAcik(!acik)} title={t("akGorunum")} aria-label={t("akGorunum")} data-ak-gorunum>
        <SlidersHorizontal size={16} />
      </button>
      {acik && (
        <div className="ak-panel" data-ak-panel>
          <span>{t("akYaziBoyu")}</span>
          {boy("yazi")}
          <span>{t("akMetinBoyu")}</span>
          {boy("metin")}
          <span>{t("akSiklik")}</span>
          {secim("siklik", [["rahat", "akRahat"], ["siki", "akSiki"]])}
          <span>{t("akSolSutun")}</span>
          {secim("sol", [["dar", "akDar"], ["orta", "akOrta"], ["genis", "akGenis"]])}
          <span>{t("akKarsitlik")}</span>
          {secim("karsitlik", [["normal", "akNormal"], ["yuksek", "akYuksek"]])}
          <button type="button" className="dugme dugme-ikincil dugme-kucuk ak-sifirla" onClick={() => degistir(VARSAYILAN_GORUNUM)}>
            {t("akVarsayilan")}
          </button>
        </div>
      )}
    </div>
  );
}

/* Süre kısa ve kaba: "25 dk", "3 sa", "2 gün"; dakikayı saatin yanına eklemek satırı uzatıyordu. */
const sureYazisi = (ms: number, t: ReturnType<typeof useDil>["t"]) => {
  const dk = Math.round(ms / 60_000);
  if (dk < 60) return t("akDk", { n: dk });
  const sa = Math.round(dk / 60);
  if (sa < 48) return t("akSa", { n: sa });
  return t("akGun", { n: Math.round(sa / 24) });
};

/* Ekibe özel aşama notu: kutunun altında; muhabir görmez (ayrı kayıt, kural okutmuyor). */
function AsamaNotlari({ ben, paket, asama }: { ben: Kisi; paket: Paket; asama: string }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const notlar = (v.asamaNotlari ?? []).filter((n) => n.paketId === paket.id && n.asama === asama);
  const [metin, setMetin] = useState("");
  return (
    <div className="asama-notlari" data-asama-notlari={asama}>
      <div className="alan-etiket">
        <Lock size={12} aria-hidden="true" /> {t("akEkipNotu")} <small className="sonuk">· {t("akEkipNotuGizli")}</small>
      </div>
      {notlar.map((n) => (
        <div key={n.id} className="asama-notu" data-asama-notu={n.id}>
          <small className="sonuk">
            {ad(kisiBul(v, n.kisiId))} · {tarihYaz(yerelGun(n.zaman), dil, "kisa")} {saatYaz(n.zaman, dil)}
          </small>
          <p dir="auto">{n.metin}</p>
          {asamaNotuSilebilir(ben, n) && (
            <button type="button" className="ikon-dugme" onClick={() => asamaNotuSil(ben, n.id)} title={t("sil")} aria-label={t("sil")}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
      <div className="asama-not-yaz">
        <AnmaGirdisi cokSatir rows={2} deger={metin} degistir={setMetin} aria-label={t("akEkipNotu")} data-asama-not-girdi />
        <button type="button" className="dugme dugme-ikincil dugme-kucuk" disabled={!metin.trim()} onClick={() => asamaNotuEkle(ben, paket.id, asama, metin) && setMetin("")} data-asama-not-ekle>
          {t("akNotEkle")}
        </button>
      </div>
    </div>
  );
}
