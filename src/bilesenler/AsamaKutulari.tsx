import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { CircleCheck, Circle, CircleDot, CircleAlert } from "lucide-react";
import { asamaListesi, durakBul, type GorunenAsama } from "../akis";
import { birimAdi } from "../yapi";
import { saatYaz, tarihYaz, useDil } from "../dil";
import { kisiBul, useVeri, type KunyeRolu, type Paket } from "../veri";
import { paketKunyesi, type KunyeSatiri } from "../kunye";
import { useAdimDurumu } from "../yol";
import { yerelGun } from "../tarih";
import { KunyeListesi } from "./Kunye";

/*
 * Aşama kutuları (kullanıcı: kutular yalnız aşamayı göstermesin, iş kutunun
 * içinde olsun; basınca içerik açılsın, ilerleyince iş hangi kutudaysa oraya
 * gidilsin; belgeler/asama-kutulari-brifing.md). Dikey liste, tek kutu açık:
 * telefonda içerik açılan kutunun içinde, masaüstünde sağ sütunda. Şimdiki
 * kutuda paketin işi (sayfanın işlem kartı), geçmiş kutuda o adımı yapanlar
 * (künye), gelecekte yalnız kimin yapacağı. Seçim geçmiş adımında; seçim
 * yokken şimdiki kutu açık ve iş ilerleyince yeni kutuya geçilir.
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
  tamam: ["onaylayan"],
  "sade-tamam": ["onaylayan"],
};

const DurumIkonu = ({ durum }: { durum: GorunenAsama["durum"] }) =>
  durum === "gecti" ? <CircleCheck size={18} /> : durum === "simdi" ? <CircleDot size={18} /> : durum === "gecikti" ? <CircleAlert size={18} /> : <Circle size={18} />;

export function AsamaKutulari({ paket, eylem }: { paket: Paket; eylem: ReactNode }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const masaustu = useMasaustu();
  const liste = asamaListesi(paket);
  const simdi = liste.find((a) => a.durum === "simdi" || a.durum === "gecikti");
  // Bitmiş pakette son kutu; iptalde hiçbiri (yol yarıda kaldı).
  const varsayilan = simdi?.id ?? (paket.durum === "iptal" ? "" : (liste.filter((a) => a.durum === "gecti").at(-1)?.id ?? ""));
  // "" kişinin seçimi yok demek: şimdiki kutuyu izler. "-" telefonda bütün kutular kapalı.
  const [secim, setSecim] = useAdimDurumu<string>(`paket:${paket.id}:asama`, "");
  const acik = secim === "-" ? "" : liste.some((a) => a.id === secim) ? secim : varsayilan;
  const kutular = useRef<HTMLOListElement>(null);

  // İş ilerleyince (kişinin kendi işiyle ya da başkasınınkiyle) yeni kutuya kayılır; seçim yapılmışsa dokunulmaz.
  const onceki = useRef(simdi?.id);
  useEffect(() => {
    if (onceki.current === simdi?.id) return;
    onceki.current = simdi?.id;
    if (secim !== "" || !simdi) return;
    kutular.current?.querySelector(`[data-asama-kutu="${simdi.id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [simdi?.id, secim]);

  const kunye = paketKunyesi(v, paket);
  const icerik = (a: GorunenAsama) => {
    const tur = durakBul(paket, a.id)?.tur ?? a.id;
    if (a.durum === "simdi" || a.durum === "gecikti" || (a.id === varsayilan && paket.durum === "tamamlandi")) {
      const muhabir = kisiBul(v, paket.muhabirId);
      return (
        <>
          {a.durum && (
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
          {a.durum ? eylem : <KunyeListesi satirlar={kunye} />}
        </>
      );
    }
    if (a.durum === "gecti") {
      const roller = TUR_ROLLERI[tur] ?? [];
      const satirlar: KunyeSatiri[] = kunye.filter((s) => roller.includes(s.rol as KunyeRolu));
      return satirlar.length ? <KunyeListesi satirlar={satirlar} /> : <p className="sonuk">{t("akYapildi")}</p>;
    }
    return <p className="sonuk">{a.masa ? t("akYapacak", { birim: birimAdi(a.masa) }) : t("akSirada")}</p>;
  };

  const satir = (a: GorunenAsama, i: number) => (
    <li key={a.id} className={`asama-kutu ${a.durum}${a.id === acik ? " acik" : ""}`} data-asama-kutu={a.id} data-asama-durum={a.durum || "bekliyor"}>
      <button
        type="button"
        className="asama-kutu-bas"
        aria-expanded={a.id === acik}
        onClick={() => setSecim(a.id === acik && !masaustu ? "-" : a.id)}
      >
        <span className="asama-ikon">
          <DurumIkonu durum={a.durum} />
        </span>
        <span className="asama-ad">
          <small>{i + 1}</small> {a.ad}
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
    <section className="asama-kutulari" data-asama-kutulari>
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
              <p className="sonuk">{t(paket.durum === "iptal" ? "pdIptal" : "akSirada")}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
