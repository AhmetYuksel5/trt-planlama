import { IdCard } from "lucide-react";
import { Kart } from "./Parcalar";
import { saatYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { canliKunyesi, paketKunyesi, type KunyeSatiri } from "../kunye";
import { kisiBul, useVeri, type CanliYayin, type Paket } from "../veri";
import { yerelGun } from "../tarih";

/*
 * Künye (kullanıcı: biten paketin ve canlının kimlik kartı; kısa, "direkt kim
 * yaptıysa onun adı"). Kurallar kunye.ts; paket sayfasında, plan ekranının
 * canlı satırında ve Muhasebe dökümünün iş satırında aynı liste.
 */

const ROL_ADI: Record<KunyeSatiri["rol"], Anahtar> = {
  oneren: "knOneren",
  gorevlendiren: "knGorevlendiren",
  muhabir: "muhabir",
  metin: "knMetin",
  dil: "knDil",
  videoKontrol: "knVideo",
  yukleyen: "knYukleyen",
  onaylayan: "knOnaylayan",
  teslim: "knOnaylayan",
  planlayan: "knPlanlayan",
  yapildi: "knYapildi",
};

export function KunyeListesi({ satirlar }: { satirlar: KunyeSatiri[] }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  if (!satirlar.length) return null;
  const zaman = (z: string) => (z ? `${tarihYaz(yerelGun(z), dil, "kisa")} ${saatYaz(z, dil)}` : "");
  return (
    <dl className="kunye" data-kunye>
      {satirlar.map((s) => (
        <div key={s.rol} className="kunye-satir" data-kunye-rol={s.rol}>
          <dt>{t(ROL_ADI[s.rol])}</dt>
          <dd>
            {s.ad && <bdi>{s.ad}</bdi>}
            {s.kisiler.map((k) => (
              <span key={k.kisiId} className="kunye-kisi">
                <bdi>{ad(kisiBul(v, k.kisiId))}</bdi>
                {k.zaman && <small>{zaman(k.zaman)}</small>}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Paket sayfasında biten paketin künyesi. */
export function PaketKunyeKarti({ p }: { p: Paket }) {
  const { t } = useDil();
  const v = useVeri();
  if (p.durum !== "tamamlandi") return null;
  const satirlar = paketKunyesi(v, p);
  if (!satirlar.length) return null;
  return (
    <Kart baslik={t("knBaslik")} ikon={<IdCard size={18} />}>
      <KunyeListesi satirlar={satirlar} />
    </Kart>
  );
}

/** Muhasebe dökümündeki işin künyesi: muhasebeci paket sayfasını açamıyor, kart satırın içinde. */
export function IsKunyesi({ kaynak, id }: { kaynak: "paket" | "canli" | "nafize"; id: string }) {
  const v = useVeri();
  const p = kaynak === "paket" ? v.paketler.find((x) => x.id === id) : undefined;
  const c = kaynak === "canli" ? v.canliYayinlar.find((x) => x.id === id) : undefined;
  const satirlar = p ? paketKunyesi(v, p) : c ? canliKunyesi(c) : [];
  return <KunyeListesi satirlar={satirlar} />;
}

/** Plan ekranında yapılmış canlının künyesi: satırın altında katlanır. */
export function CanliKunyesi({ c }: { c: CanliYayin }) {
  const { t } = useDil();
  if (c.sonuc?.durum !== "yapildi") return null;
  const satirlar = canliKunyesi(c);
  if (!satirlar.length) return null;
  return (
    <details className="kunye-ac" data-canli-kunye={c.id}>
      <summary title={t("knBaslik")} aria-label={t("knBaslik")}>
        <IdCard size={14} /> {t("knBaslik")}
      </summary>
      <KunyeListesi satirlar={satirlar} />
    </details>
  );
}
