import { Ban, Check, ChevronDown, ChevronUp, CircleCheck, ExternalLink, MessageSquarePlus } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnmaGirdisi } from "../../bilesenler/Anma";
import { GeriBag } from "../../bilesenler/GeriBag";
import { Icerik, PaketDurumRozeti, Pencere, bildir } from "../../bilesenler/Parcalar";
import { FormAlt } from "./Formlar";
import { tarihYaz, useDil } from "../../dil";
import { paketDurum, paketKararNotu, paketReddet } from "../../eylemler";
import { useSekmeAdi } from "../../sekmeAdi";
import { kisiBul, paketBul, useVeri, type Kisi, type NextDayPlan, type Paket } from "../../veri";
import { useAdimDurumu } from "../../yol";
import { toplantiNotuGorur, yapabilir } from "../../yetki";
import { NextDayBelgesi, paketKarari } from "../belge/NextDayBelge";
import { KararNotlari } from "../haftalik/Kalem";
import { ToplantiNotlari } from "../haftalik/Toplanti";
import { useMedya } from "../takvim/ortak";
import { IkonDugme } from "./Bolumler";
import { usePlanAkisi } from "./Plan";

/*
 * Next Day toplantısının çalışma ekranı (kullanıcı: Weekly için yapılanlar
 * Next Day'de de). Ortada planın tam belgesi; PKG satırı tıklanınca seçilir,
 * yanda paketin kararı (kabul, ret), karar notu ve ek talebi, altında
 * toplantının genel notları. Klavye: ↑/↓ (j/k) paket, 1 kabul, 4 ret, N not.
 * Onaydan sonra kabul edilen paketin solunda görevlendirme postası zarfı.
 */

const yaziAlaninda = (e: KeyboardEvent) => {
  const h = e.target as HTMLElement | null;
  return !!h && (h.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(h.tagName));
};

export default function NdToplanti({ ben, plan }: { ben: Kisi; plan: NextDayPlan }) {
  const { t, dil } = useDil();
  const v = useVeri();
  useSekmeAdi(`Next Day · ${t("toplantiGorunumu")}`);
  const a = usePlanAkisi(ben, plan);
  const [suzgec, setSuzgec] = useAdimDurumu<"hepsi" | "bekleyen">("nd-toplanti:suzgec", "hepsi");
  const dar = useMedya("(max-width: 1099px)");
  const [pencere, setPencere] = useState(false);
  const [seciliId, setSeciliId] = useState<string>();
  const belge = useRef<HTMLDivElement>(null);
  const ayrinti = useRef<HTMLDivElement>(null);
  const karar = plan.durum === "toplantida" && yapabilir(ben, "paketDegerlendir");
  // Sayılar belgede çizilen PKG'lerden: hangi paketin basıldığı belgenin kuralı (hazır, stok, gelişme altı).
  const [sayi, setSayi] = useState({ toplam: 0, bekleyen: 0 });
  useLayoutEffect(() => {
    const l = [...(belge.current?.querySelectorAll<HTMLElement>("[data-toplanti-kalem]") ?? [])];
    const y = { toplam: l.length, bekleyen: l.filter((e) => e.dataset.karar === "bekliyor").length };
    if (y.toplam !== sayi.toplam || y.bekleyen !== sayi.bekleyen) setSayi(y);
    // İlk açılışta karar bekleyen ilk paket seçili gelir.
    if (!seciliId && l.length) setSeciliId((l.find((e) => e.dataset.karar === "bekliyor") ?? l[0]).dataset.toplantiKalem);
  });
  const secili = seciliId ? paketBul(v, seciliId) : undefined;

  const belgeSirasi = () =>
    [...(belge.current?.querySelectorAll<HTMLElement>("[data-toplanti-kalem]") ?? [])]
      .filter((e) => suzgec === "hepsi" || e.dataset.karar === "bekliyor" || e.dataset.toplantiKalem === seciliId)
      .map((e) => e.dataset.toplantiKalem!);
  const sec = (id: string | undefined, pencereAc = false) => {
    if (!id) return;
    setSeciliId(id);
    if (pencereAc && dar) setPencere(true);
  };
  const kabul = (p: Paket) => confirm(t("paketKabulOnay")) && paketDurum(ben, p.id, "onaylandi");
  const ret = (p: Paket) => confirm(t("paketRetOnay")) && paketReddet(ben, p.id);

  useEffect(() => {
    belge.current?.querySelector(`[data-toplanti-kalem="${seciliId}"]`)?.scrollIntoView({ block: "nearest" });
  }, [seciliId]);

  useEffect(() => {
    const dinle = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || yaziAlaninda(e) || document.querySelector("dialog[open]")) return;
      const liste = belgeSirasi();
      const i = seciliId ? liste.indexOf(seciliId) : -1;
      const sonraki = () => liste.slice(i + 1).find((id) => suzgec === "hepsi" || paketKarari(paketBul(v, id) ?? ({} as Paket)) === "bekliyor");
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        sec(liste[Math.min(i + 1, liste.length - 1)]);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        sec(liste[Math.max(i - 1, 0)]);
      } else if (secili && karar && paketKarari(secili) === "bekliyor" && (e.key === "1" || e.key === "4")) {
        e.preventDefault();
        if (e.key === "1" ? kabul(secili) : ret(secili)) sec(sonraki());
      } else if (secili && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        ayrinti.current?.querySelector<HTMLButtonElement>("[data-karar-notu-ac]")?.click();
      }
    };
    window.addEventListener("keydown", dinle);
    return () => window.removeEventListener("keydown", dinle);
  });

  const komsu = (yon: 1 | -1) => {
    const liste = belgeSirasi();
    const i = seciliId ? liste.indexOf(seciliId) : -1;
    return liste[i + yon];
  };
  const kart = secili ? (
    <div className="toplanti-ayrinti" ref={ayrinti} data-toplanti-ayrinti>
      <div className="toplanti-gezinti">
        <IkonDugme ikon={<ChevronUp size={16} />} etiket={t("onceki")} onClick={() => sec(komsu(-1))} />
        <IkonDugme ikon={<ChevronDown size={16} />} etiket={t("sonraki")} onClick={() => sec(komsu(1))} />
      </div>
      <PaketKarari key={secili.id} ben={ben} paket={secili} karar={karar} kabul={() => kabul(secili) && sec(komsu(1))} ret={() => ret(secili) && sec(komsu(1))} />
    </div>
  ) : null;
  const karariVerilen = sayi.toplam - sayi.bekleyen;

  return (
    <div className={`toplanti${suzgec === "bekleyen" ? " yalniz-bekleyen" : ""}`} data-toplanti data-nd-toplanti>
      <div className="toplanti-ust">
        <GeriBag href={`#/nextday/${plan.id}`} metin={t("ndPlanaDon")} />
        <h1 className="toplanti-baslik">Next Day · {tarihYaz(plan.tarih, dil)}</h1>
        <span className="toplanti-ilerleme" data-toplanti-ilerleme title={t("kararVerilen", { n: karariVerilen, m: sayi.toplam })}>
          <span className="toplanti-cubuk">
            <span style={{ inlineSize: `${sayi.toplam ? (karariVerilen / sayi.toplam) * 100 : 0}%` }} />
          </span>
          <b>
            {karariVerilen}/{sayi.toplam}
          </b>
        </span>
        <div className="nd-gorunum" role="group" aria-label={t("krKarar")}>
          {(["hepsi", "bekleyen"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={suzgec === s} className={suzgec === s ? "secili" : ""} onClick={() => setSuzgec(s)} data-toplanti-suzgec={s}>
              {t(s === "hepsi" ? "hepsi" : "kararBekleyen")}
              {s === "bekleyen" && sayi.bekleyen > 0 && ` · ${sayi.bekleyen}`}
            </button>
          ))}
        </div>
        {a.onaylar && (
          <button type="button" className="dugme" onClick={a.onayla} data-nd-toplanti-onayla>
            <Check size={16} /> {t("planiOnayla")}
          </button>
        )}
      </div>

      <div className="toplanti-duzen">
        <div className="toplanti-belge" ref={belge}>
          <div className="cikti-sarici">
            <NextDayBelgesi plan={plan} toplanti={{ secili: seciliId, sec: (id) => sec(id, true) }} />
          </div>
        </div>
        <div className="toplanti-yan">
          {!dar && (kart ?? <p className="bos-kucuk">{t("ndToplantiPaketYok")}</p>)}
          {toplantiNotuGorur(ben) && <ToplantiNotlari ben={ben} planId={plan.id} />}
        </div>
      </div>
      {dar && pencere && kart && (
        <Pencere baslik={t("toplantiGorunumu")} kapat={() => setPencere(false)}>
          {kart}
        </Pencere>
      )}
    </div>
  );
}

/* Seçili PKG'nin kartı: karar (yalnız toplantıda, karar bekleyende), karar notu ve ek talep (onaydan sonra da). */
function PaketKarari({ ben, paket: p, karar, kabul, ret }: { ben: Kisi; paket: Paket; karar: boolean; kabul: () => void; ret: () => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [notFormu, setNotFormu] = useState(false);
  const muhabir = kisiBul(v, p.muhabirId);
  const notYazar = yapabilir(ben, "planDuzenle") || yapabilir(ben, "paketDegerlendir");
  const bekliyor = paketKarari(p) === "bekliyor";
  return (
    <div className="kayit kalem" data-karar={paketKarari(p)} data-nd-paket-karti={p.id}>
      <div className="kayit-bas">
        <div className="kayit-govde">
          <p className="alt-baslik">
            <bdi>{bekliyor ? "PKG PROPOSAL" : "PKG"}</bdi>
          </p>
          <Icerik blok>{p.baslik}</Icerik>
          <small>
            {muhabir ? ad(muhabir) : p.muhabirTbc ? "TBC" : "—"} · <PaketDurumRozeti paket={p} />
          </small>
          <KararNotlari kalem={p} />
          <a className="dugme dugme-sade dugme-kucuk" href={`#/paketler/${p.id}`}>
            <ExternalLink size={14} /> {p.kod}
          </a>
        </div>
      </div>
      <div className="karar-dugmeleri">
        {karar && bekliyor && (
          <>
            <button type="button" className="dugme dugme-iyi dugme-kucuk" onClick={kabul} data-karar-dugme="kabul">
              <CircleCheck size={14} /> {t("kabulEt")} <kbd>1</kbd>
            </button>
            <button type="button" className="dugme dugme-kotu dugme-kucuk" onClick={ret} data-karar-dugme="ret">
              <Ban size={14} /> {t("reddet")} <kbd>4</kbd>
            </button>
          </>
        )}
        {notYazar && !notFormu && (
          <button className="dugme dugme-sade dugme-kucuk" onClick={() => setNotFormu(true)} data-karar-notu-ac>
            <MessageSquarePlus size={14} /> {t("kararNotuEkTalep")} <kbd>N</kbd>
          </button>
        )}
      </div>
      {notFormu && <PaketNotFormu ben={ben} paket={p} kapat={() => setNotFormu(false)} />}
    </div>
  );
}

function PaketNotFormu({ ben, paket, kapat }: { ben: Kisi; paket: Paket; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({ kararNotu: paket.kararNotu ?? "", ekTalep: paket.ekTalep ?? "" });
  return (
    <div className="form form-kutu ara-ust" data-karar-notu-formu>
      <label>
        {t("kararNotu")}
        <AnmaGirdisi cokSatir rows={2} deger={f.kararNotu} degistir={(x) => setF({ ...f, kararNotu: x })} data-karar-notu />
      </label>
      <label>
        {t("ekTalep")}
        <AnmaGirdisi cokSatir rows={2} deger={f.ekTalep} degistir={(x) => setF({ ...f, ekTalep: x })} data-ek-talep />
      </label>
      <FormAlt kapat={kapat} kaydet={() => paketKararNotu(ben, paket.id, f) && (bildir(t("bKaydedildi")), kapat())} />
    </div>
  );
}
