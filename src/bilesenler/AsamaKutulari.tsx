import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { CircleCheck, Circle, CircleDot, CircleAlert, Copy } from "lucide-react";
import { asamaListesi, durakBul, stokDurumu, type GorunenAsama } from "../akis";
import { birimAdi } from "../yapi";
import { metin as dilMetni, saatYaz, tarihYaz, useDil } from "../dil";
import { baslikBul, kisiBul, oneriBul, planBul, useVeri, type BirimId, type Kisi, type KunyeRolu, type Paket } from "../veri";
import { paketKunyesi, type KunyeSatiri } from "../kunye";
import { useAdimDurumu } from "../yol";
import { yerelGun } from "../tarih";
import { ASAMA_ADI, PARCA_ADI, asamaYolda, gfxAcik, gfxBekliyor, istisnaAsamalari, sablonAdi, uretimSablonlari } from "../uretim";
import { OZEL_PAKET_ASAMALARI, ozelPaketAsamasi } from "../ozel";
import { STOK_DURUM_ADI } from "../etiketler";
import { gfxTamamla } from "../eylemler";
import { gfxYapabilir } from "../yetki";
import { KararNotlari } from "../ekranlar/haftalik/Kalem";
import { KunyeListesi } from "./Kunye";
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

export function AsamaKutulari({ ben, paket, eylem }: { ben: Kisi; paket: Paket; eylem: ReactNode }) {
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
  const [secim, setSecim] = useAdimDurumu<string>(`paket:${paket.id}:asama`, "");
  const acik = iptal || secim === "-" ? "" : liste.some((a) => a.id === secim) ? secim : varsayilan;
  const kutular = useRef<HTMLOListElement>(null);

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
        {a.masa && <span className="asama-masa">{birimAdi(a.masa)}</span>}
      </button>
      {!masaustu && a.id === acik && (
        <div className="asama-icerik" data-asama-icerik={a.id}>
          {icerik(a)}
        </div>
      )}
    </li>
  );

  const secili = liste.find((a) => a.id === acik);
  return (
    <section className={`asama-kutulari${iptal ? " iptal" : ""}`} data-asama-kutulari>
      <h2 className="asama-baslik">{t("asamalar")}</h2>
      <div className="asama-duzen">
        <ol className="asama-listesi" data-asama-listesi ref={kutular}>
          {liste.map(satir)}
        </ol>
        {masaustu && (
          <div className="asama-icerik asama-yan" data-asama-icerik={secili?.id ?? ""}>
            {secili ? (
              <>
                <h3>{secili.ad}</h3>
                {icerik(secili)}
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
