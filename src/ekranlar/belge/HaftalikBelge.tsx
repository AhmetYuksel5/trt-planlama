import { Ban, Check, Eye, Printer } from "lucide-react";
import { useRef, useState, type ReactNode, type Ref } from "react";
import { KararRozeti, bicimSatiri } from "../../bilesenler/Haftalik";
import { Pencere } from "../../bilesenler/Parcalar";
import { aralikYaz, ciktiGunu, metin, tarihYaz, useDil, type Anahtar } from "../../dil";
import { HAREKET_TURU_ADI, kisiAr, sehirAr } from "../../etiketler";
import { anaKonuKaydet, anaKonuSil, anaKonuTasi, baslikDuzenle, kalemKarar, kalemKaydet, kalemSil, kalemTasi, type KalemGirdisi } from "../../eylemler";
import { ciktida, gundemde, haftaGunleri, haftaSonu } from "../../haftalik";
import { baslikBul, kisiBul, sahaGorevi, useVeri, type AnaKonu, type HaftalikKalem, type HaftalikPlan, type Karar, type Kisi } from "../../veri";
import { haftalikDuzenler, kararVerebilir, yapabilir } from "../../yetki";
import { KalemFormu } from "../haftalik/Kalem";
import { AnaKonuFormu } from "../haftalik/Plan";
import { IkonDugme } from "../nextday/Bolumler";
import { BelgeSatiri, CiktiAraclari, EkleCubugu, EkleDugmesi, SatirSeridi, YerindeMetin, onayla } from "./Parcalar";

/**
 * Haftalık planın belgesi (الأجندة الأسبوعية): kurumun Word belgesinin
 * bölümleri ve sırası. تحركات المراسلين, أهم ملفات الأسبوع, الأجندة اليومية
 * (gün gün; dosya başlıkları altında "ad - YER / metin", muhabirler
 * "isim / şehir", biçim satırı, sarı not), زمانا غير مرتبطة.
 *
 * Çıktıda yalnız kabul ve bilgi kalemleri basılıyor, yalnız kalemi olan
 * günler görünüyor. Belgede yedi günün hepsi ve karar bekleyen kalemler de
 * var (soluk): plan hazırlıkta bütün kalemler bekliyor, kağıt boş kalmasın,
 * toplantı kararı belgenin üzerinde verilebilsin. Reddedilen kalem ikisinde
 * de yok.
 */

export type HfPencere = { tur: "anaKonu"; mevcut?: AnaKonu; sonra?: string } | { tur: "kalem"; mevcut?: HaftalikKalem; tarih?: string; dosya?: string; sonra?: string };

export interface HfDuzen {
  ben: Kisi;
  /** Toplantıdaysa şeritte karar düğmeleri. */
  karar: boolean;
  ac: (p: HfPencere) => void;
}

const c = (k: Anahtar, p?: Record<string, string | number>) => metin(k, "ar", p);

/* "YER / metin" satırı; render dışında ki yazı kutusu her kayıtta sıfırlanmasın. */
function Satir({ yer, children }: { yer?: ReactNode; children: ReactNode }) {
  return (
    <p>
      {yer && <b>{yer} / </b>}
      {children}
    </p>
  );
}

/* Kalemin düzeltilen tek alanı için: eylem bütün alanları istiyor. */
const kalemGirdisi = (k: HaftalikKalem, g: Partial<KalemGirdisi>): KalemGirdisi => ({
  id: k.id,
  tarih: k.tarih,
  baslikId: k.baslikId,
  baslik: k.baslik,
  yer: k.yer,
  metin: k.metin,
  tur: k.tur,
  bicimler: k.bicimler,
  muhabirler: k.muhabirler,
  not: k.not,
  ...g,
});

const KARARLAR: { karar: Karar; ad: Anahtar; ikon: ReactNode }[] = [
  { karar: "kabul", ad: "krKabul", ikon: <Check size={15} /> },
  { karar: "bilgi", ad: "krBilgi", ikon: <Eye size={15} /> },
  { karar: "ret", ad: "krRet", ikon: <Ban size={15} /> },
];

/** Bir kalem: "ad - YER / metin", muhabirler, biçim, not; bilgi kaleminde "(لا نتابع)". */
function Kalem({ k, hafta, duzen, ilk, son }: { k: HaftalikKalem; hafta: HaftalikPlan; duzen?: HfDuzen; ilk: boolean; son: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const kisiAdi = (id?: string) => kisiAr(kisiBul(v, id));
  const ben = duzen?.ben;
  const yaz = (g: Partial<KalemGirdisi>) => ben && kalemKaydet(ben, hafta.id, kalemGirdisi(k, g));
  const onEk = [k.baslik, k.yer].filter(Boolean).join(" - ");
  const notlar = [k.karar === "bilgi" ? c("laNutabi") : "", k.not ?? ""].filter(Boolean);
  const bekliyor = k.karar === "bekliyor";

  return (
    <BelgeSatiri
      duzen={!!duzen}
      soluk={bekliyor}
      serit={
        duzen &&
        ben && (
          <SatirSeridi
            yukari={ilk ? undefined : () => kalemTasi(ben, hafta.id, k.id, -1)}
            asagi={son ? undefined : () => kalemTasi(ben, hafta.id, k.id, 1)}
            ekle={() => duzen.ac({ tur: "kalem", tarih: k.tarih ?? "", dosya: k.baslikId, sonra: k.id })}
            ekleEtiket={t("kalemEkle")}
            duzenle={() => duzen.ac({ tur: "kalem", mevcut: k })}
            ek={
              <>
                <KararRozeti kalem={k} />
                {duzen.karar &&
                  KARARLAR.map((x) => (
                    <IkonDugme key={x.karar} ikon={x.ikon} etiket={t(x.ad)} ton={k.karar === x.karar ? "secili" : ""} onClick={() => kalemKarar(ben, hafta.id, k.id, x.karar)} />
                  ))}
              </>
            }
            cikar={onayla(t("silinsinMi"), () => kalemSil(ben, hafta.id, k.id))}
          />
        )
      }
    >
      <div className="cikti-kalem">
        {duzen ? (
          <Satir
            yer={
              <>
                <YerindeMetin acik deger={k.baslik ?? ""} etiket={t("olayAdi")} kaydet={(x) => yaz({ baslik: x })} />
                {" - "}
                <YerindeMetin acik deger={k.yer ?? ""} etiket={t("yer")} kaydet={(x) => yaz({ yer: x })} />
              </>
            }
          >
            <YerindeMetin acik cokSatir deger={k.metin} etiket={t("metin")} kaydet={(x) => x && yaz({ metin: x })} />
          </Satir>
        ) : (
          <Satir yer={onEk || undefined}>{k.metin}</Satir>
        )}
        {k.muhabirler.length > 0 && (
          <>
            <p className="alt-baslik">{c(k.muhabirler.length > 1 ? "ciktiMuhabirler" : "ciktiMuhabir")}</p>
            {k.muhabirler.map((id) => (
              <p key={id}>
                {kisiAdi(id)} / {sehirAr(kisiBul(v, id)?.sehir)}
              </p>
            ))}
          </>
        )}
        {k.bicimler.length > 0 && (
          <p>
            <b>
              <bdi>{bicimSatiri(k)}</bdi>
            </b>
          </p>
        )}
        {duzen ? (
          <p>
            {k.karar === "bilgi" && <mark>{c("laNutabi")}</mark>}{" "}
            {k.not ? (
              <mark>
                <YerindeMetin acik deger={k.not} etiket={t("kalemNotu")} kaydet={(x) => yaz({ not: x })} />
              </mark>
            ) : (
              <YerindeMetin acik deger="" etiket={t("kalemNotu")} kaydet={(x) => yaz({ not: x })} />
            )}
          </p>
        ) : (
          notlar.length > 0 && (
            <p>
              <mark>{notlar.join(" ")}</mark>
            </p>
          )
        )}
      </div>
    </BelgeSatiri>
  );
}

/* Dosyalar kalemin dizideki ilk görünüşüne göre sıralı; dosyasız kalemin başlığı yok. */
function Dosyalar({ liste, hafta, duzen }: { liste: HaftalikKalem[]; hafta: HaftalikPlan; duzen?: HfDuzen }) {
  const { t } = useDil();
  const v = useVeri();
  const ben = duzen?.ben;
  const gruplar = new Map<string, HaftalikKalem[]>();
  for (const k of liste) gruplar.set(k.baslikId ?? "", [...(gruplar.get(k.baslikId ?? "") ?? []), k]);
  return (
    <>
      {[...gruplar.entries()].map(([baslikId, ks]) => {
        const ad = baslikId ? (baslikBul(v, baslikId)?.ad ?? "") : "";
        return (
          <div key={baslikId || "-"} className="cikti-baslik">
            {baslikId && (
              <BelgeSatiri
                duzen={!!duzen}
                serit={duzen && <SatirSeridi ekle={() => duzen.ac({ tur: "kalem", tarih: ks[0].tarih ?? "", dosya: baslikId, sonra: ks[ks.length - 1].id })} ekleEtiket={t("kalemEkle")} />}
              >
                <h3>{ben && yapabilir(ben, "baslikYonet") ? <YerindeMetin acik deger={ad} etiket={t("dosya")} kaydet={(x) => x && baslikDuzenle(ben, baslikId, { ad: x })} /> : ad}</h3>
              </BelgeSatiri>
            )}
            {ks.map((k, i) => (
              <Kalem key={k.id} k={k} hafta={hafta} duzen={duzen} ilk={i === 0} son={i === ks.length - 1} />
            ))}
          </div>
        );
      })}
    </>
  );
}

export function HaftalikBelgesi({ hafta, duzen, belgeRef }: { hafta: HaftalikPlan; duzen?: HfDuzen; belgeRef?: Ref<HTMLElement> }) {
  const { t } = useDil();
  const v = useVeri();
  const ben = duzen?.ben;
  const bas = hafta.baslangic;
  const bit = haftaSonu(bas);
  const kisiAdi = (id?: string) => kisiAr(kisiBul(v, id));

  const hareketler = v.gorevlendirmeler
    .filter((g) => sahaGorevi(g) && g.baslangic <= bit && g.bitis >= bas && g.durum !== "talep")
    .sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  /* Aynı yere aynı süreyle giden ekip tek satırda, kurumun belgesindeki gibi: "YER / ad - ad - ad في مهمة حتى …". */
  const hareketSatirlari = [...hareketler.reduce((m, g) => m.set(`${g.yer}|${g.tur}|${g.bitis}`, [...(m.get(`${g.yer}|${g.tur}|${g.bitis}`) ?? []), g]), new Map<string, typeof hareketler>()).values()];
  const kalemler = duzen ? hafta.kalemler.filter((k) => gundemde(k) && k.karar !== "ret") : hafta.kalemler.filter(ciktida);
  const gunler = duzen ? haftaGunleri(bas) : haftaGunleri(bas).filter((g) => kalemler.some((k) => k.tarih === g));
  const stok = kalemler.filter((k) => !k.tarih);

  return (
    <article className="cikti" ref={belgeRef} dir="rtl" lang="ar">
      <h1>
        {c("haftalikCiktiBaslik")} {aralikYaz(bas, bit, "ar")}
      </h1>

      {hareketSatirlari.length > 0 && (
        <section>
          <h2 className="yesil">{c("ciktiHareketler")}</h2>
          {hareketSatirlari.map((grup) => {
            const g = grup[0];
            return (
              <Satir key={g.id} yer={g.yer}>
                {grup.map((x) => kisiAdi(x.kisiId)).join(" - ")} · {c(HAREKET_TURU_ADI[g.tur])} {c("ciktiKadar", { tarih: tarihYaz(g.bitis, "ar", "kisa") })}
                {g.aciklama ? ` · ${g.aciklama}` : ""}
              </Satir>
            );
          })}
        </section>
      )}

      {(hafta.anaKonular.length > 0 || duzen) && (
        <section>
          <h2 className="kirmizi ortali">{c("haftaninAnaDosyalari")}</h2>
          {hafta.anaKonular.map((a, i) => (
            <div key={a.id} className="cikti-baslik">
              <BelgeSatiri
                duzen={!!duzen}
                serit={
                  duzen &&
                  ben && (
                    <SatirSeridi
                      yukari={i > 0 ? () => anaKonuTasi(ben, hafta.id, a.id, -1) : undefined}
                      asagi={i < hafta.anaKonular.length - 1 ? () => anaKonuTasi(ben, hafta.id, a.id, 1) : undefined}
                      ekle={() => duzen.ac({ tur: "anaKonu", sonra: a.id })}
                      ekleEtiket={t("anaDosyaEkle")}
                      duzenle={() => duzen.ac({ tur: "anaKonu", mevcut: a })}
                      cikar={onayla(t("silinsinMi"), () => anaKonuSil(ben, hafta.id, a.id))}
                    />
                  )
                }
              >
                <h3>{ben ? <YerindeMetin acik deger={a.baslik} etiket={t("dosyaBasligi")} kaydet={(x) => x && anaKonuKaydet(ben, hafta.id, { id: a.id, baslik: x, metin: a.metin })} /> : a.baslik}</h3>
                {ben ? (
                  <p>
                    <YerindeMetin acik cokSatir deger={a.metin} etiket={t("durumOzeti")} kaydet={(x) => anaKonuKaydet(ben, hafta.id, { id: a.id, baslik: a.baslik, metin: x })} />
                  </p>
                ) : (
                  a.metin && <p>{a.metin}</p>
                )}
              </BelgeSatiri>
            </div>
          ))}
          {duzen && (
            <EkleCubugu>
              <EkleDugmesi metin={t("anaDosyaEkle")} onClick={() => duzen.ac({ tur: "anaKonu", sonra: hafta.anaKonular.at(-1)?.id })} />
            </EkleCubugu>
          )}
        </section>
      )}

      {gunler.length > 0 && (
        <section>
          <h2 className="kirmizi ortali">{c("gunlukGundem")}</h2>
          {gunler.map((g) => (
            <div key={g} className="cikti-gun">
              <h4 className="gun">{ciktiGunu(g, "ar")}</h4>
              <Dosyalar liste={kalemler.filter((k) => k.tarih === g)} hafta={hafta} duzen={duzen} />
              {duzen && (
                <EkleCubugu>
                  <EkleDugmesi metin={t("kalemEkle")} onClick={() => duzen.ac({ tur: "kalem", tarih: g })} />
                </EkleCubugu>
              )}
            </div>
          ))}
        </section>
      )}

      {(stok.length > 0 || duzen) && (
        <section>
          <h2 className="yesil">{c("zamanaBagliOlmayan")}</h2>
          <Dosyalar liste={stok} hafta={hafta} duzen={duzen} />
          {duzen && (
            <EkleCubugu>
              <EkleDugmesi metin={t("kalemEkle")} onClick={() => duzen.ac({ tur: "kalem", tarih: "" })} />
            </EkleCubugu>
          )}
        </section>
      )}
    </article>
  );
}

function HfPencereIcerik({ ben, hafta, p, kapat }: { ben: Kisi; hafta: HaftalikPlan; p: HfPencere; kapat: () => void }) {
  const { t } = useDil();
  if (p.tur === "anaKonu")
    return (
      <Pencere baslik={t(p.mevcut ? "duzenle" : "anaDosyaEkle")} kapat={kapat}>
        <AnaKonuFormu ben={ben} hafta={hafta} mevcut={p.mevcut} sonra={p.sonra} kapat={kapat} />
      </Pencere>
    );
  return (
    <Pencere baslik={t(p.mevcut ? "duzenle" : "kalemEkle")} kapat={kapat}>
      <KalemFormu ben={ben} hafta={hafta} mevcut={p.mevcut} tarih={p.tarih} dosya={p.dosya} sonra={p.sonra} kapat={kapat} />
    </Pencere>
  );
}

/** Belge sayfası: haftalık planı çıktının üzerinde düzenleme; baskı, Word ve kopya temiz kopyadan. */
export default function HaftalikBelge({ ben, hafta }: { ben: Kisi; hafta: HaftalikPlan }) {
  const { t } = useDil();
  const duzenler = haftalikDuzenler(ben, hafta);
  const karar = kararVerebilir(ben, hafta);
  const [pencere, setPencere] = useState<HfPencere | null>(null);
  const temiz = useRef<HTMLElement>(null);
  const duzen = duzenler ? { ben, karar, ac: setPencere } : undefined;
  const bas = hafta.baslangic;

  return (
    <>
      <CiktiAraclari
        geri={{ href: `#/haftalik/${hafta.id}`, metin: t("haftalikPlanaDon") }}
        belge={temiz}
        word={{ ad: `haftalik-plan-${bas}.doc`, baslik: `${c("haftalikCiktiBaslik")} ${aralikYaz(bas, haftaSonu(bas), "ar")}` }}
        yazdirMetni="rpYazdir"
        ek={
          <a className="dugme dugme-ikincil" href={`#/haftalik/${hafta.id}/cikti`}>
            <Printer size={16} /> {t("ciktiOnizleme")}
          </a>
        }
      />
      <div className="cikti-sarici belge-duzen yazdirma-gizle">
        <HaftalikBelgesi hafta={hafta} duzen={duzen} />
      </div>
      <div className="cikti-sarici belge-temiz" aria-hidden="true">
        <HaftalikBelgesi hafta={hafta} belgeRef={temiz} />
      </div>
      {pencere && duzen && <HfPencereIcerik ben={ben} hafta={hafta} p={pencere} kapat={() => setPencere(null)} />}
    </>
  );
}
