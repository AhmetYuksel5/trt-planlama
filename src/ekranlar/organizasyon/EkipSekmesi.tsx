import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Kart, Pencere, Rozet } from "../../bilesenler/Parcalar";
import { useDil, type Metin } from "../../dil";
import { EKIP_GOREV_ADI } from "../../etiketler";
import { kimlik, type BirimId, type EkipGorevi, type GorevId, type Kisi } from "../../veri";
import {
  birimAdi,
  birimAgaci,
  birimUnvanlari,
  ekipAdayi,
  ekipGorevAdi,
  ekipGoreviEkle,
  ekipGoreviGuncelle,
  ekipGoreviSil,
  ekipGorevleri,
  ekipGorevTasi,
  gorevAdi,
  altindaMi,
  unvanListesi,
  yerlesikEkipGorevi,
  type EkipGorevTanimi,
  type Yapi,
} from "../../yapi";
import { useTaslak } from "./Organizasyon";
import { AdAlanlari, dilde, metinMi } from "./Ortak";

/**
 * Plan ekibi: plandaki çalışma ekibinin görevleri (منتج تنفيذي, بلتن…) ve
 * her göreve kimin yazılabileceği. Kural birimler (alt birimleriyle) ve o
 * birimlerdeki ünvanlar; plan ekranında "Ekibe ekle" yalnız kurala uyanları
 * öneriyor (yapi.ts → ekipAdayi). Görev adı çıktıdaki gibi Arapça önde.
 * Yerleşik görev silinmez, gizlenir: eski planlar onu taşıyor. Taslakta
 * düzenleniyor, öbür yapı sekmeleri gibi "Yayınla" ile geçerli.
 */
export function EkipSekmesi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { v, taslak, degistir } = useTaslak(ben);
  const [acik, setAcik] = useState<EkipGorevTanimi | "yeni" | null>(null);
  const liste = ekipGorevleri(taslak);
  return (
    <Kart
      baslik={t("orgPlanEkibi")}
      ek={String(liste.length)}
      sagUc={
        <button type="button" className="dugme dugme-kucuk" onClick={() => setAcik("yeni")} data-ekip-gorevi-ekle>
          <Plus size={14} /> {t("orgEkipGoreviEkle")}
        </button>
      }
    >
      <ol className="ekip-gorevleri" data-ekip-gorevleri>
        {liste.map((g, i) => {
          const uyan = v.kisiler.filter((k) => !k.pasif && ekipAdayi(k, g.id, taslak)).length;
          return (
            <li key={g.id} className={g.gizli ? "soluk" : ""} data-ekip-gorevi={g.id}>
              <span className="kidem">{i + 1}</span>
              <div className="ekip-gorevi-ad">
                <b lang="ar" dir="rtl">
                  {ekipGorevAdi(g.id, "ar", taslak)}
                </b>
                {g.gizli && <Rozet>{t("orgGizli")}</Rozet>}
                <small>{kuralOzeti(g, taslak, t)}</small>
                <small className="sonuk-yazi" data-ekip-uyan={uyan}>
                  {t("orgKuralaUyan", { n: uyan })}
                </small>
              </div>
              <span className="unvan-islem">
                <button type="button" className="dugme dugme-sade dugme-ikon" disabled={i === 0} onClick={() => degistir((y) => ekipGorevTasi(y, g.id, -1))} title={t("yukari")} aria-label={t("yukari")}>
                  <ArrowUp size={15} />
                </button>
                <button type="button" className="dugme dugme-sade dugme-ikon" disabled={i === liste.length - 1} onClick={() => degistir((y) => ekipGorevTasi(y, g.id, 1))} title={t("asagi")} aria-label={t("asagi")}>
                  <ArrowDown size={15} />
                </button>
                <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setAcik(g)} title={t("duzenle")} aria-label={t("duzenle")} data-ekip-gorevi-duzenle={g.id}>
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  className="dugme dugme-sade dugme-ikon"
                  onClick={() => degistir((y) => ekipGoreviGuncelle(y, g.id, (x) => ({ ...x, gizli: !x.gizli || undefined })))}
                  title={t(g.gizli ? "orgGoster" : "orgGizle")}
                  aria-label={t(g.gizli ? "orgGoster" : "orgGizle")}
                >
                  {g.gizli ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                {!yerlesikEkipGorevi(g.id) && (
                  <button type="button" className="dugme dugme-sade dugme-ikon kotu-yazi" onClick={() => confirm(t("silinsinMi")) && degistir((y) => ekipGoreviSil(y, g.id))} title={t("sil")} aria-label={t("sil")} data-ekip-gorevi-sil={g.id}>
                    <Trash2 size={15} />
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {acik && <EkipGorevPenceresi ben={ben} gorev={acik === "yeni" ? null : acik} kapat={() => setAcik(null)} />}
    </Kart>
  );
}

/* "Newsdesk, Program · Senior Producer, Program Editor"; boşsa haber merkezinin tamamı ve bütün ünvanlar. */
const kuralOzeti = (g: EkipGorevTanimi, y: Yapi, t: ReturnType<typeof useDil>["t"]) =>
  `${g.birimler.length ? g.birimler.map((b) => birimAdi(b, y)).join(", ") : t("orgKuralTumMerkez")} · ${g.unvanlar.length ? g.unvanlar.map((u) => gorevAdi(u, y)).join(", ") : t("orgKuralTumUnvan")}`;

/* Görev adı Arapça önde: çıktıda yazan o; boş bırakılan dil Arapçasından. */
const adHazirla = (m: Metin | undefined): Metin | undefined => {
  const ar = m?.ar.trim();
  return m && ar ? { ar, tr: m.tr.trim() || ar, en: m.en.trim() || ar } : undefined;
};

function EkipGorevPenceresi({ ben, gorev, kapat }: { ben: Kisi; gorev: EkipGorevTanimi | null; kapat: () => void }) {
  const { t } = useDil();
  const { v, taslak, degistir } = useTaslak(ben);
  const yerlesik = !!gorev && yerlesikEkipGorevi(gorev.id);
  const [ad, setAd] = useState<Metin | undefined>(metinMi(gorev?.ad) ? gorev.ad : undefined);
  const [birimler, setBirimler] = useState<BirimId[]>(gorev?.birimler ?? []);
  const [unvanlar, setUnvanlar] = useState<GorevId[]>(gorev?.unvanlar ?? []);
  const temiz = adHazirla(ad);
  const hazir = yerlesik || !!temiz;
  const agac = birimAgaci(taslak, false);
  /*
   * Seçilebilen ünvanlar seçili birimlerin (alt birimleri dahil) ünvanları,
   * kıdem sırasıyla; birim seçilmemişse bütün ünvanlar. Önceden seçilip
   * artık listede olmayan ünvan da kalıyor ki işareti kaldırılabilsin.
   */
  const adayUnvanlar = birimler.length
    ? [...new Set(agac.filter((s) => birimler.some((b) => altindaMi(s.id, b, taslak))).flatMap((s) => birimUnvanlari(s.id, taslak)))]
    : unvanListesi(undefined, undefined, taslak);
  const gosterilen = [...adayUnvanlar, ...unvanlar.filter((u) => !adayUnvanlar.includes(u))];
  const deneme: EkipGorevTanimi = { id: gorev?.id ?? "", birimler, unvanlar };
  const uyanlar = v.kisiler.filter((k) => !k.pasif && ekipAdayiDeneme(k, deneme, taslak));
  const degis = <T,>(l: T[], x: T) => (l.includes(x) ? l.filter((y) => y !== x) : [...l, x]);
  const kaydet = () => {
    if (!hazir) return;
    const govde = { birimler, unvanlar, ...(temiz ? { ad: temiz } : {}) };
    if (gorev)
      degistir((y) =>
        ekipGoreviGuncelle(y, gorev.id, (x) => {
          const { ad: _, ...kalan } = x;
          return { ...kalan, ...govde };
        }),
      );
    else degistir((y) => ekipGoreviEkle(y, { id: kimlik("eg"), ...govde }));
    kapat();
  };
  return (
    <Pencere
      baslik={gorev ? ekipGorevAdi(gorev.id, "ar", taslak) : t("orgEkipGoreviEkle")}
      kapat={kapat}
      altBilgi={
        <button className="dugme" disabled={!hazir} onClick={kaydet} data-ekip-gorevi-kaydet>
          {t("kaydet")}
        </button>
      }
    >
      <div className="form" data-ekip-gorevi-formu>
        <AdAlanlari deger={ad} varsayilan={yerlesik ? dilde(EKIP_GOREV_ADI[gorev.id as EkipGorevi]) : undefined} degistir={setAd} />
        <fieldset className="secim-listesi" data-kural-birimler>
          <legend>{t("orgKuralBirimler")}</legend>
          {agac.map((s) => (
            <label key={s.id} className="secim" style={{ "--derinlik": s.derinlik } as CSSProperties}>
              <input type="checkbox" checked={birimler.includes(s.id)} onChange={() => setBirimler(degis(birimler, s.id))} data-kural-birim={s.id} />
              {birimAdi(s.id, taslak)}
            </label>
          ))}
        </fieldset>
        <fieldset className="secim-listesi" data-kural-unvanlar>
          <legend>{t("orgKuralUnvanlar")}</legend>
          {gosterilen.map((u) => (
            <label key={u} className="secim">
              <input type="checkbox" checked={unvanlar.includes(u)} onChange={() => setUnvanlar(degis(unvanlar, u))} data-kural-unvan={u} />
              {gorevAdi(u, taslak)}
            </label>
          ))}
        </fieldset>
        <p className="sonuk-yazi" data-kural-onizleme={uyanlar.length}>
          {t("orgKuralaUyan", { n: uyanlar.length })}
        </p>
      </div>
    </Pencere>
  );
}

/* Pencerede kaydedilmemiş kuralın önizlemesi: ekipAdayi'nin aynısı, tanım taslaktan değil formdan. */
const ekipAdayiDeneme = (k: { birim: BirimId; gorev: GorevId }, g: EkipGorevTanimi, y: Yapi) =>
  ekipAdayi(k, g.id || "__deneme", { ...y, ekipGorevleri: [...(y.ekipGorevleri ?? []).filter((x) => x.id !== g.id), { ...g, id: g.id || "__deneme" }] });
