import {
  ArrowRightLeft,
  ExternalLink,
  Package,
  PackageCheck,
  Printer,
} from "lucide-react";
// Kurumun logosu yalnız baskı tasarımlarında; kurumun düz çıktısı ve Word'de yok.
import type { Baski } from "./Baski";
import trtArabi from "../../varliklar/trt-arabi.svg";
import trtArabiBeyaz from "../../varliklar/trt-arabi-beyaz.svg";
import GeriAlDugmesi from "../../bilesenler/GeriAl";
import { YzKisaltSerit } from "../../bilesenler/YzKisalt";
import { Fragment, useRef, useState, type ReactNode, type Ref } from "react";
import {
  LiveKutusu,
  Pencere,
  TbcKutusu,
  bildir,
  icerikAlani,
} from "../../bilesenler/Parcalar";
import { ciktiTarihi, metin, sureYaz, useDil, type Anahtar } from "../../dil";
import {
  TBC,
  adParcalari,
  ekipAdi,
  kisiAr,
  bicimEki,
  gelismeBicimEki,
  paketNotEki,
  muhabirUnvani,
  muhabirYeri,
  paketYeri,
  pkgGruplari,
  sehirAr,
} from "../../etiketler";
import {
  baslikDuzenle,
  canliKaydet,
  canliSil,
  ekipCikar,
  ekipGuncelle,
  ekipKisiDegistir,
  gelismeKaydet,
  gelismeSil,
  gelismeTasi,
  gorevlendirmeMetni,
  hazirPaketCikar,
  hazirPaketTasi,
  oncekiOnayla,
  paketKaydet,
  paketSil,
  paketStogaAl,
  paketStogaAlinabilir,
  paketTasi,
  planBaslikCikar,
  planBaslikTasi,
  planGorevlendirmeCikar,
  planGorevlendirmeTasi,
  planMuhabir,
  planMuhabirGuncelle,
  planMuhabirTasi,
  planMuhabirTbc,
  planBaslikLive,
} from "../../eylemler";
import { simdi, vardiyaYaz } from "../../tarih";
import {
  baslikBul,
  gelismeMuhabirleri,
  gelismeProgrami,
  kisiBul,
  paketBul,
  useVeri,
  type CanliYayin,
  type EkipGoreviId,
  type Gelisme,
  type Kisi,
  type NextDayPlan,
  type Paket,
} from "../../veri";
import {
  paketPlandanSilinir,
  planIcerikDuzenler,
  planOperasyonDuzenler,
  yapabilir,
} from "../../yetki";
import {
  BaslikEkleFormu,
  BaslikaTasiPenceresi,
  EkipEkleFormu,
  IkonDugme,
  KayitliHareketSecici,
  PlanAdiSecici,
  StoktanSecici,
  ekipSirasi,
  gelismeTeamAdlari,
  gorevEkibi,
} from "../nextday/Bolumler";
import { ekipAdayi, ekipGorevAdi, ekipGorevListesi } from "../../yapi";
import {
  CanliFormu,
  FormAlt,
  GelismeFormu,
  GorevlendirmeFormu,
  MuhabirSecici,
  PaketFormu,
} from "../nextday/Formlar";
import {
  BelgeSatiri,
  CiktiAraclari,
  EkleCubugu,
  EkleDugmesi,
  SatirSeridi,
  YerindeMetin,
  onayla,
} from "./Parcalar";

/**
 * Next Day planının belgesi (الأجندة الإخبارية). Biçim kurumun bugünkü
 * çıktısından: başlık gün adı ve tarihle; فريق العمل, تحركات وإجازات
 * المراسلين, مباشر, التقارير الجاهزة, التقارير المتوقعة, الأحداث الإخبارية
 * (başlık başlık: gelişmeler, المراسلون, PKG), متابعات. Satırlar "YER /
 * metin / kişi" kalıbında. Belge her arayüz dilinde Arapça ve sağdan sola.
 *
 * `duzen` yoksa çıktı: boş bölüm görünmüyor. Varsa aynı kağıt düzenleniyor:
 * boş bölüm de ekleme için görünüyor; yazılar yerinde, seçimler pencerede.
 * Yetki satır türüne göre plan ekranındakiyle aynı: ekip, hareket, hazır
 * paket, başlık, muhabir ve PKG içerik yetkisi; gelişme, canlı yayın ve
 * takip devirden sonra Newsdesk'in de işi (operasyon).
 */

export type NdPencere =
  | { tur: "ekipEkle"; gorev?: EkipGoreviId }
  | { tur: "ekipUye"; kisiId: string }
  | { tur: "hareketEkle" }
  | { tur: "canli"; mevcut?: CanliYayin }
  | { tur: "hazirSec" }
  | { tur: "baslikEkle"; sonra?: string }
  | { tur: "gelisme"; planBaslikId?: string; mevcut?: Gelisme; sonra?: string }
  | { tur: "gelismeTasi"; gelisme: Gelisme }
  | { tur: "muhabirEkle"; pbId: string; sonra?: string }
  | { tur: "muhabir"; pbId: string; kisiId: string }
  | { tur: "paket"; pbId: string; mevcut?: Paket; sonra?: string; gelismeId?: string };

export interface NdDuzen {
  ben: Kisi;
  icerik: boolean;
  operasyon: boolean;
  ac: (p: NdPencere) => void;
  /** Yeni görünüm: başlığın altında hızlı ekleme satırı ("/" menüsü). */
  hizli?: boolean;
}

/*
 * Hızlı ekleme: yazıp Enter gelişme olarak ekler ("YER / metin" ise yer ayrılır);
 * "/" ile başlayınca menü, seçilen tür kendi penceresini açar (kararlar formda kalsın).
 * Render dışında: yazı kutusu her kayıtta sıfırlanmasın.
 */
function HizliEkle({
  ben,
  plan,
  pbId,
  sonra,
  icerik,
  ac,
}: {
  ben: Kisi;
  plan: NextDayPlan;
  pbId: string;
  sonra?: string;
  icerik: boolean;
  ac: (p: NdPencere) => void;
}) {
  const { t } = useDil();
  const [yazi, setYazi] = useState("");
  const [secili, setSecili] = useState(0);
  const menu = yazi.startsWith("/");
  const secenekler: [Anahtar, NdPencere][] = [
    ["gelismeEkle", { tur: "gelisme", planBaslikId: pbId, sonra }],
    ...(icerik
      ? ([
          ["paketOnerisiEkle", { tur: "paket", pbId }],
          ["muhabirAta", { tur: "muhabirEkle", pbId }],
        ] as [Anahtar, NdPencere][])
      : []),
    ["canliEkle", { tur: "canli" }],
  ];
  const ara = yazi.slice(1).trim().toLocaleLowerCase();
  const uyan = secenekler.filter(
    ([k]) => !ara || t(k).toLocaleLowerCase().includes(ara),
  );
  const sec = (p: NdPencere) => {
    setYazi("");
    ac(p);
  };
  const ekle = () => {
    const ham = yazi.trim();
    if (!ham) return;
    const i = ham.indexOf(" / ");
    const yer = i > 0 && i < 30 ? ham.slice(0, i).trim() : undefined;
    const govde = yer ? ham.slice(i + 3).trim() : ham;
    if (!govde) return;
    if (
      gelismeKaydet(
        ben,
        {
          planId: plan.id,
          planBaslikId: pbId,
          yer,
          metin: govde,
          kaynakTuru: "ajans",
          kaynakAdi: "",
          tarih: simdi(),
        },
        sonra,
      )
    )
      setYazi("");
  };
  return (
    <div className="hizli-ekle">
      <input
        {...icerikAlani}
        value={yazi}
        placeholder={t("hizliEkleYer")}
        aria-label={t("hizliEkleYer")}
        onChange={(e) => {
          setYazi(e.target.value);
          setSecili(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setYazi("");
          if (menu && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setSecili(
              (x) =>
                (x + (e.key === "ArrowDown" ? 1 : uyan.length - 1)) %
                Math.max(uyan.length, 1),
            );
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (menu) uyan[secili] && sec(uyan[secili][1]);
            else ekle();
          }
        }}
        data-hizli-ekle={pbId}
      />
      {menu && uyan.length > 0 && (
        <div className="hizli-menu" role="listbox">
          {uyan.map(([k, p], i) => (
            <button
              key={k}
              type="button"
              role="option"
              aria-selected={i === secili}
              className={i === secili ? "secili" : ""}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => sec(p)}
              data-hizli-secenek={p.tur}
            >
              {t(k)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* "YER / metin" satırı: yer kalın, kurumun belgesindeki gibi. Render dışında: içindeki yazı kutusu her kayıtta sıfırlanmasın. */
function Satir({ yer, children }: { yer?: ReactNode; children: ReactNode }) {
  return (
    <p>
      {yer && <b>{yer} / </b>}
      {children}
    </p>
  );
}

const c = (k: Anahtar, p?: Record<string, string | number>) =>
  metin(k, "ar", p);

/* Belgede yazılan paket başlığı için: paket eylemi bütün alanları istiyor, değişen yalnız başlık. */
const paketGirdisi = (p: Paket, baslik: string) => ({
  id: p.id,
  planId: p.planId ?? "",
  planBaslikId: p.planBaslikId ?? "",
  baslik,
  sehir: p.sehir,
  yer: p.yer,
  muhabirId: p.muhabirId,
  aciklama: p.aciklama,
  tur: p.tur,
  bicim: p.bicim,
  teslim: p.teslim,
  yayin: p.yayin,
  sahaGerekli: p.sahaGerekli,
  slug: p.slug,
  muhabirTbc: p.muhabirTbc,
  gelismeId: p.gelismeId,
});

/*
 * sutunlu: ekranda deneme düzeni (kullanıcının çizimi). Başlıklar geniş alanda, günün
 * az değişen bölümleri (ekip, hareketler, canlı, hazır, متابعات) dar sütunda; çıktı,
 * baskı ve Word tek sütunda kurumun sırasıyla kalır.
 */
export function NextDayBelgesi({
  plan,
  duzen,
  belgeRef,
  sutunlu,
  baski,
}: {
  plan: NextDayPlan;
  duzen?: NdDuzen;
  belgeRef?: Ref<HTMLElement>;
  sutunlu?: boolean;
  /** Çıktı sayfasındaki baskı denemesi (1 klasik, 2 manşetli iki sütun, 3 gazete akışı, 4 künye bandı ve üç sütun); yoksa kurumun düzeni. */
  baski?: Baski;
}) {
  // 2. baskı iki sütun ama kurumun sırasıyla: متابعات sütunlardan sonra, tam genişlikte.
  const ikiSutun = sutunlu || baski === 2;
  const takipSonda = baski === 2;
  const { t } = useDil();
  const v = useVeri();
  const kisiAdi = (id?: string) => kisiAr(kisiBul(v, id));
  const sehir = (id?: string) => sehirAr(kisiBul(v, id)?.sehir);
  const ben = duzen?.ben;
  const ic = !!duzen?.icerik;
  const op = !!duzen?.operasyon;
  const d = !!duzen;
  const ac = (p: NdPencere) => duzen?.ac(p);
  const sil = (f: () => unknown) => onayla(t("silinsinMi"), f);
  // Ucta olan satırda ok yok: taşınacak komşu kalmadı.
  const yukari = (i: number, f: () => unknown) => (i > 0 ? f : undefined);
  const asagi = (i: number, n: number, f: () => unknown) =>
    i < n - 1 ? f : undefined;

  const gorevlendirmeler = plan.gorevlendirmeler
    .map((id) => v.gorevlendirmeler.find((g) => g.id === id))
    .filter((g) => g !== undefined);
  const canlilar = v.canliYayinlar
    .filter((x) => x.planId === plan.id)
    .sort((a, b) => (a.tarih + a.saatGmt).localeCompare(b.tarih + b.saatGmt));
  const hazirlar = plan.hazirPaketler
    .map((id) => paketBul(v, id))
    .filter((h) => h !== undefined);
  const paketler = v.paketler.filter(
    (p) => p.planId === plan.id && p.durum !== "iptal",
  );
  // Hazır paketlere alınan beklenenlerde ikinci kez basılmaz; başlığın altında kalması planlamacının seçimi.
  // Stoka alınmış (yapılmış) paket hazırdan çıkarılsa da "beklenen" değil.
  const stokta = (p: Paket) => !!p.stok && p.durum === "tamamlandi";
  const beklenenler = paketler.filter(
    (p) => !plan.hazirPaketler.includes(p.id) && !stokta(p),
  );
  const takipler = v.gelismeler.filter(
    (g) => g.planId === plan.id && !g.planBaslikId,
  );
  // Plana dosyasız giren haber (başlığa bağlanmamış paket) çıktıda hiç görünmüyordu; متابعات'in altında. Hazır paketler kendi bölümünde.
  const dosyasizPaketler = paketler.filter(
    (p) =>
      !plan.basliklar.some((pb) => pb.id === p.planBaslikId) &&
      !plan.hazirPaketler.includes(p.id) &&
      !stokta(p),
  );

  // Gelişmesi bu başlıkta duran paket gelişmenin altında çizilir; gelişme gittiyse başlığın PKG'sinde kalır.
  const gelismeAltinda = (p: Paket, gelismeler: Gelisme[]) =>
    !!p.gelismeId && gelismeler.some((g) => g.id === p.gelismeId);

  /* PKG satırı: başlığın PKG bölümünde de gelişmenin altında da aynı. */
  const paketSatiri = (pbId: string, grup: Paket[]) => (p: Paket, j: number) => {
                              // Değerlendirmeden ileri gitmiş paket burada değişmiyor; ayrıntısı paket sayfasında.
                              const acikPaket =
                                p.durum === "taslak" ||
                                p.durum === "degerlendiriliyor";
                              return (
                                <BelgeSatiri
                                  key={p.id}
                                  duzen={ic}
                                  serit={
                                    <SatirSeridi
                                      yukari={yukari(
                                        j,
                                        () => ben && paketTasi(ben, p.id, -1),
                                      )}
                                      asagi={asagi(
                                        j,
                                        grup.length,
                                        () => ben && paketTasi(ben, p.id, 1),
                                      )}
                                      ekle={() =>
                                        ac({
                                          tur: "paket",
                                          pbId,
                                          sonra: p.id,
                                          gelismeId: p.gelismeId,
                                        })
                                      }
                                      ekleEtiket={t("paketOnerisiEkle")}
                                      duzenle={
                                        acikPaket
                                          ? () =>
                                              ac({
                                                tur: "paket",
                                                pbId,
                                                mevcut: p,
                                              })
                                          : undefined
                                      }
                                      ek={
                                        <>
                                          <PaketBaglantisi id={p.id} />
                                          {paketStogaAlinabilir(p) && (
                                            <IkonDugme
                                              ikon={<PackageCheck size={15} />}
                                              etiket={t("stokPaketOlarakEkle")}
                                              onClick={() =>
                                                ben &&
                                                confirm(t("stokPaketOnay")) &&
                                                paketStogaAl(
                                                  ben,
                                                  p.id,
                                                  confirm(t("stokBaslikta")),
                                                )
                                              }
                                            />
                                          )}
                                        </>
                                      }
                                      cikar={
                                        paketPlandanSilinir(p)
                                          ? sil(
                                              () => ben && paketSil(ben, p.id),
                                            )
                                          : undefined
                                      }
                                    />
                                  }
                                >
                                  <Satir yer={paketYeri(p)}>
                                    {ic && acikPaket ? (
                                      <YerindeMetin
                                        acik
                                        deger={p.baslik}
                                        etiket={t("paketBasligi")}
                                        kaydet={(x) =>
                                          x &&
                                          ben &&
                                          paketKaydet(ben, paketGirdisi(p, x))
                                        }
                                      />
                                    ) : (
                                      p.baslik
                                    )}{" "}
                                    /{" "}
                                    <b>
                                      {muhabirYeri(
                                        [
                                          p.muhabirId
                                            ? kisiAdi(p.muhabirId)
                                            : "",
                                        ],
                                        p.muhabirTbc,
                                      )}
                                    </b>
                                    {bicimEki(p.bicim) && (
                                      <b data-bicim-eki> {bicimEki(p.bicim)}</b>
                                    )}
                                    {paketNotEki(p) && (
                                      <span data-paket-notu>
                                        {paketNotEki(p)}
                                      </span>
                                    )}
                                  </Satir>
                                  {/* Paketin kodu (slug) satırın hemen altında, hazır paketlerdeki gibi. */}
                                  {p.slug && (
                                    <p className="cikti-slug" data-paket-kodu>
                                      <bdi>{p.slug}</bdi>
                                    </p>
                                  )}
                                </BelgeSatiri>
                              );
                            };

  /* Gelişme satırı: başlığın altında da takiplerde de aynı; başlıkta yer yoksa öneren muhabirin şehri. */
  const gelismeSatiri = (
    g: Gelisme,
    i: number,
    liste: Gelisme[],
    planBaslikId?: string,
  ) => {
    const varsayilanYer =
      planBaslikId && g.onerenId ? sehir(g.onerenId) : undefined;
    // Gelişmeye bağlı PKG'ler (başlığın içindeki daha özel konu) gelişmenin hemen altında, PKG / PKG PROPOSAL alt başlığıyla.
    const altPaketler = planBaslikId
      ? paketler.filter(
          (p) => p.planBaslikId === planBaslikId && p.gelismeId === g.id,
        )
      : [];
    return (
      <Fragment key={g.id}>
      <BelgeSatiri
        duzen={op}
        onceki={g.onceki}
        serit={
          <SatirSeridi
            yukari={yukari(i, () => ben && gelismeTasi(ben, g.id, -1))}
            asagi={asagi(
              i,
              liste.length,
              () => ben && gelismeTasi(ben, g.id, 1),
            )}
            ekle={() => ac({ tur: "gelisme", planBaslikId, sonra: g.id })}
            ekleEtiket={t(planBaslikId ? "gelismeEkle" : "takipEkle")}
            duzenle={() => ac({ tur: "gelisme", planBaslikId, mevcut: g })}
            onceki={
              g.onceki
                ? () => ben && oncekiOnayla(ben, plan.id, { gelisme: g.id })
                : undefined
            }
            ek={
              <>
                {ic && planBaslikId && (
                  <IkonDugme
                    ikon={<Package size={15} />}
                    etiket={t("gelismeyePkgEkle")}
                    onClick={() =>
                      ac({ tur: "paket", pbId: planBaslikId, gelismeId: g.id })
                    }
                  />
                )}
                {(plan.basliklar.length > 1 ||
                  (plan.basliklar.length === 1 && !planBaslikId)) && (
                  <IkonDugme
                    ikon={<ArrowRightLeft size={15} />}
                    etiket={t("baskaBasligaTasi")}
                    onClick={() => ac({ tur: "gelismeTasi", gelisme: g })}
                  />
                )}
                <YzKisaltSerit
                  metin={g.metin}
                  kaydet={(m) => ben && gelismeKaydet(ben, { ...g, metin: m })}
                />
              </>
            }
            cikar={
              !g.oneriId || (ben && yapabilir(ben, "oneriDegerlendir"))
                ? sil(() => ben && gelismeSil(ben, g.id))
                : undefined
            }
          />
        }
      >
        <Satir
          yer={
            op ? (
              <YerindeMetin
                acik
                deger={g.yer ?? ""}
                goster={varsayilanYer}
                etiket={t("yer")}
                kaydet={(x) =>
                  ben && gelismeKaydet(ben, { ...g, yer: x || undefined })
                }
              />
            ) : (
              g.yer || varsayilanYer
            )
          }
        >
          {op ? (
            <YerindeMetin
              acik
              cokSatir
              deger={g.metin}
              etiket={t("gelismeMetni")}
              kaydet={(x) => x && ben && gelismeKaydet(ben, { ...g, metin: x })}
            />
          ) : (
            g.metin
          )}
          {gelismeBicimEki(v, g) && (
            <b data-bicim-eki> {gelismeBicimEki(v, g)}</b>
          )}
        </Satir>
        {/* Schedule paragrafın hemen altında, saat sırasıyla; muhabirden önce, gelişmenin parçası. */}
        {gelismeProgrami(g).length > 0 && (
          <>
            <Satir>
              <b data-schedule>{c("schedule")}</b>
            </Satir>
            {gelismeProgrami(g).map((x, i) => (
              <Satir key={i} yer={x.saat || undefined}>
                {x.olay}
              </Satir>
            ))}
          </>
        )}
        {/* Başlığın içindeki konuyu özel takip eden muhabir paragrafın hemen altında; başlığın genel muhabirleri ayrı. */}
        {gelismeMuhabirleri(g).length > 0 && (
          <>
            <Satir>
              <b data-gelisme-muhabir>
                {muhabirUnvani(
                  gelismeMuhabirleri(g).map((m) => kisiBul(v, m.kisiId)),
                )}
              </b>
            </Satir>
            {gelismeMuhabirleri(g).map((m) => (
              <Satir
                key={m.kisiId}
                yer={m.yer || sehirAr(kisiBul(v, m.kisiId)?.sehir)}
              >
                {kisiAdi(m.kisiId)}
              </Satir>
            ))}
          </>
        )}
        {gelismeTeamAdlari(g, v).length > 0 && (
          <>
            <Satir>
              <b data-gelisme-teams>TEAMS</b>
            </Satir>
            {gelismeTeamAdlari(g, v).map((a, i) => (
              <Satir key={i}>{a}</Satir>
            ))}
          </>
        )}
      </BelgeSatiri>
      {planBaslikId &&
        pkgGruplari(altPaketler).map(([ad, grup]) => (
          <Fragment key={ad}>
            <p className="alt-baslik" data-pkg-grubu={ad} data-gelisme-pkg>
              <bdi>{ad}</bdi>
            </p>
            {grup.map(paketSatiri(planBaslikId, grup))}
          </Fragment>
        ))}
      </Fragment>
    );
  };

  const takipBolumu = (takipler.length > 0 ||
    dosyasizPaketler.length > 0 ||
    op) && (
    <section>
      <h2 className="yesil">{c("takipler")}</h2>
      {takipler.map((g, i) => gelismeSatiri(g, i, takipler))}
      {dosyasizPaketler.map((p) => (
        <BelgeSatiri
          key={p.id}
          duzen={ic}
          serit={<SatirSeridi ek={<PaketBaglantisi id={p.id} />} />}
        >
          <Satir yer={paketYeri(p)}>
            {p.baslik} /{" "}
            <b>
              {muhabirYeri(
                [p.muhabirId ? kisiAdi(p.muhabirId) : ""],
                p.muhabirTbc,
              )}
            </b>
            {bicimEki(p.bicim) && <b data-bicim-eki> {bicimEki(p.bicim)}</b>}
            {paketNotEki(p) && <span data-paket-notu>{paketNotEki(p)}</span>}
          </Satir>
        </BelgeSatiri>
      ))}
      {op && (
        <EkleCubugu>
          <EkleDugmesi
            metin={t("takipEkle")}
            onClick={() => ac({ tur: "gelisme", sonra: takipler.at(-1)?.id })}
          />
        </EkleCubugu>
      )}
    </section>
  );

  return (
    <article
      className={`cikti${sutunlu ? " cikti-sutunlu" : ""}${baski ? ` baski-${baski}` : ""}`}
      ref={belgeRef}
      dir="rtl"
      lang="ar"
    >
      {baski && baski !== 2 && (
        <div className="baski-logo">
          <img src={trtArabi} alt="TRT عربي" />
        </div>
      )}
      {baski === 2 ? (
        <Manset plan={plan} />
      ) : (
        <h1>
          {c("ciktiBaslik")} {ciktiTarihi(plan.tarih, "ar")}
        </h1>
      )}

      {ikiSutun ? (
        <>
          <div className="nd-sutunlar">
            <div className="nd-ana">
              {beklenenler.length > 0 && (
                <section>
                  <h2 className="yesil">{c("ciktiBeklenen")}</h2>
                  {beklenenler.map((p) => (
                    <Satir key={p.id} yer={paketYeri(p)}>
                      {p.baslik} /{" "}
                      <b>
                        {muhabirYeri(
                          [p.muhabirId ? kisiAdi(p.muhabirId) : ""],
                          p.muhabirTbc,
                        )}
                      </b>
                      {bicimEki(p.bicim) && (
                        <b data-bicim-eki> {bicimEki(p.bicim)}</b>
                      )}
                      {paketNotEki(p) && (
                        <span data-paket-notu>{paketNotEki(p)}</span>
                      )}
                    </Satir>
                  ))}
                </section>
              )}

              {(plan.basliklar.length > 0 || ic) && (
                <section>
                  <h2 className="kirmizi ortali">{c("ciktiOlaylar")}</h2>
                  {plan.basliklar.map((pb, i) => {
                    const gelismeler = v.gelismeler.filter(
                      (g) => g.planBaslikId === pb.id,
                    );
                    const pkg = paketler.filter(
                      (p) =>
                        p.planBaslikId === pb.id &&
                        !gelismeAltinda(p, gelismeler),
                    );
                    // Başlığa bağlı canlı yayın üstteki "مباشر"da ve başlığın altında da; okuyan haberle birlikte görsün.
                    const pbCanli = canlilar.filter(
                      (x) => x.planBaslikId === pb.id,
                    );
                    // Çıktıda boş başlık görünmüyor; belgede görünüyor ki içine eklenebilsin.
                    if (
                      !d &&
                      !gelismeler.length &&
                      !pb.muhabirler.length &&
                      !pb.muhabirTbc &&
                      !pb.live &&
                      !pbCanli.length &&
                      !pkg.length
                    )
                      return null;
                    const ad = baslikBul(v, pb.baslikId)?.ad ?? "";
                    const cikabilir = !pkg.length;
                    return (
                      <div
                        key={pb.id}
                        className="cikti-baslik"
                        data-nd-baslik={pb.id}
                      >
                        <BelgeSatiri
                          duzen={ic}
                          serit={
                            <SatirSeridi
                              yukari={yukari(
                                i,
                                () =>
                                  ben &&
                                  planBaslikTasi(ben, plan.id, pb.id, -1),
                              )}
                              asagi={asagi(
                                i,
                                plan.basliklar.length,
                                () =>
                                  ben && planBaslikTasi(ben, plan.id, pb.id, 1),
                              )}
                              ekle={() =>
                                ac({ tur: "baslikEkle", sonra: pb.id })
                              }
                              ekleEtiket={t("baslikEkle")}
                              cikar={() => {
                                if (!ben) return;
                                if (!cikabilir)
                                  return bildir(t("paketliBaslikCikmaz"));
                                if (confirm(t("baslikCikarilsinMi")))
                                  planBaslikCikar(ben, plan.id, pb.id);
                              }}
                              cikarEtiket={t("plandanCikar")}
                            />
                          }
                        >
                          <h3>
                            {ic && ben && yapabilir(ben, "baslikYonet") ? (
                              <YerindeMetin
                                acik
                                deger={ad}
                                etiket={t("baslik")}
                                kaydet={(x) =>
                                  x &&
                                  baslikDuzenle(ben, pb.baslikId, { ad: x })
                                }
                              />
                            ) : (
                              ad
                            )}
                          </h3>
                        </BelgeSatiri>
                        {gelismeler.map((g, j) =>
                          gelismeSatiri(g, j, gelismeler, pb.id),
                        )}
                        {pb.muhabirler.length > 0 && (
                          <>
                            <p className="alt-baslik">
                              {c(
                                pb.muhabirler.length > 1
                                  ? "ciktiMuhabirler"
                                  : "ciktiMuhabir",
                              )}
                            </p>
                            {pb.muhabirler.map((m, j) => (
                              <BelgeSatiri
                                key={m.kisiId}
                                duzen={ic}
                                onceki={m.onceki}
                                serit={
                                  <SatirSeridi
                                    yukari={yukari(
                                      j,
                                      () =>
                                        ben &&
                                        planMuhabirTasi(
                                          ben,
                                          plan.id,
                                          pb.id,
                                          m.kisiId,
                                          -1,
                                        ),
                                    )}
                                    asagi={asagi(
                                      j,
                                      pb.muhabirler.length,
                                      () =>
                                        ben &&
                                        planMuhabirTasi(
                                          ben,
                                          plan.id,
                                          pb.id,
                                          m.kisiId,
                                          1,
                                        ),
                                    )}
                                    ekle={() =>
                                      ac({
                                        tur: "muhabirEkle",
                                        pbId: pb.id,
                                        sonra: m.kisiId,
                                      })
                                    }
                                    ekleEtiket={t("muhabirAta")}
                                    duzenle={() =>
                                      ac({
                                        tur: "muhabir",
                                        pbId: pb.id,
                                        kisiId: m.kisiId,
                                      })
                                    }
                                    onceki={
                                      m.onceki
                                        ? () =>
                                            ben &&
                                            oncekiOnayla(ben, plan.id, {
                                              muhabir: [pb.id, m.kisiId],
                                            })
                                        : undefined
                                    }
                                    cikar={sil(
                                      () =>
                                        ben &&
                                        planMuhabir(
                                          ben,
                                          plan.id,
                                          pb.id,
                                          m.kisiId,
                                          false,
                                        ),
                                    )}
                                  />
                                }
                              >
                                <Satir
                                  yer={
                                    ic ? (
                                      <YerindeMetin
                                        acik
                                        deger={m.yer ?? ""}
                                        goster={sehir(m.kisiId)}
                                        etiket={t("yer")}
                                        kaydet={(x) =>
                                          ben &&
                                          planMuhabirGuncelle(
                                            ben,
                                            plan.id,
                                            pb.id,
                                            m.kisiId,
                                            { yer: x || undefined },
                                          )
                                        }
                                      />
                                    ) : (
                                      m.yer || sehir(m.kisiId)
                                    )
                                  }
                                >
                                  {kisiAdi(m.kisiId)}{" "}
                                  {m.saat && <b>{vardiyaYaz(m.saat)}</b>}
                                </Satir>
                              </BelgeSatiri>
                            ))}
                          </>
                        )}
                        {!pb.muhabirler.length && pb.muhabirTbc && (
                          <>
                            <p className="alt-baslik">{c("ciktiMuhabir")}</p>
                            <BelgeSatiri
                              duzen={ic}
                              serit={
                                <SatirSeridi
                                  ekle={() =>
                                    ac({ tur: "muhabirEkle", pbId: pb.id })
                                  }
                                  ekleEtiket={t("muhabirAta")}
                                  cikar={() =>
                                    ben &&
                                    planMuhabirTbc(ben, plan.id, pb.id, false)
                                  }
                                />
                              }
                            >
                              <Satir>
                                <span data-tbc-satir>{TBC}</span>
                              </Satir>
                            </BelgeSatiri>
                          </>
                        )}
                        {pbCanli.length > 0 && (
                          <>
                            <p className="alt-baslik">
                              <bdi>LIVE</bdi>
                            </p>
                            {pbCanli.map((x) => (
                              <BelgeSatiri
                                key={x.id}
                                duzen={op}
                                onceki={x.onceki}
                                serit={
                                  <SatirSeridi
                                    duzenle={() =>
                                      ac({ tur: "canli", mevcut: x })
                                    }
                                    cikar={
                                      !x.oneriId ||
                                      (ben &&
                                        yapabilir(ben, "oneriDegerlendir"))
                                        ? sil(() => ben && canliSil(ben, x.id))
                                        : undefined
                                    }
                                  />
                                }
                              >
                                <Satir yer={x.yer}>
                                  <b>
                                    {x.saatGmt ? vardiyaYaz(x.saatGmt) : "TBC"}
                                  </b>{" "}
                                  / <span data-baslik-canli>{x.konu}</span>
                                  {x.aciklama ? ` / ${x.aciklama}` : ""}
                                  {x.muhabirId
                                    ? ` / ${kisiAdi(x.muhabirId)}`
                                    : ""}
                                </Satir>
                              </BelgeSatiri>
                            ))}
                          </>
                        )}
                        {pb.live && (
                          <BelgeSatiri
                            duzen={ic}
                            serit={
                              <SatirSeridi
                                cikar={() =>
                                  ben &&
                                  planBaslikLive(ben, plan.id, pb.id, false)
                                }
                              />
                            }
                          >
                            <Satir>
                              <b data-live-satir>LIVE</b>
                            </Satir>
                          </BelgeSatiri>
                        )}
                        {/* Kararı verilmemiş paket "PKG PROPOSAL", kabul edilen "PKG" altında (kurumun isteği). */}
                        {pkgGruplari(pkg).map(([ad, grup]) => (
                          <Fragment key={ad}>
                            <p className="alt-baslik" data-pkg-grubu={ad}>
                              <bdi>{ad}</bdi>
                            </p>
                            {grup.map(paketSatiri(pb.id, grup))}
                          </Fragment>
                        ))}
                        {(ic || op) && (
                          <EkleCubugu>
                            {op && (
                              <EkleDugmesi
                                metin={t("gelismeEkle")}
                                onClick={() =>
                                  ac({
                                    tur: "gelisme",
                                    planBaslikId: pb.id,
                                    sonra: gelismeler.at(-1)?.id,
                                  })
                                }
                              />
                            )}
                            {ic && (
                              <EkleDugmesi
                                metin={t("muhabirAta")}
                                onClick={() =>
                                  ac({
                                    tur: "muhabirEkle",
                                    pbId: pb.id,
                                    sonra: pb.muhabirler.at(-1)?.kisiId,
                                  })
                                }
                              />
                            )}
                            {ic && (
                              <EkleDugmesi
                                metin={t("paketOnerisiEkle")}
                                onClick={() =>
                                  ac({
                                    tur: "paket",
                                    pbId: pb.id,
                                    sonra: pkg.at(-1)?.id,
                                  })
                                }
                              />
                            )}
                          </EkleCubugu>
                        )}
                        {duzen?.hizli && op && (
                          <HizliEkle
                            ben={duzen.ben}
                            plan={plan}
                            pbId={pb.id}
                            sonra={gelismeler.at(-1)?.id}
                            icerik={ic}
                            ac={ac}
                          />
                        )}
                      </div>
                    );
                  })}
                  {ic && (
                    <EkleCubugu>
                      <EkleDugmesi
                        metin={t("baslikEkle")}
                        onClick={() =>
                          ac({
                            tur: "baslikEkle",
                            sonra: plan.basliklar.at(-1)?.id,
                          })
                        }
                      />
                    </EkleCubugu>
                  )}
                </section>
              )}
            </div>
            <aside className="nd-yan">
              {(plan.ekip.length > 0 || ic) && (
                <section data-bolum="ekip">
                  <h2 className="yesil">{c("calismaEkibi")}</h2>
                  {ekipSirasi(plan).map((g) => {
                    const uyeler = gorevEkibi(plan, g);
                    if (!uyeler.length) return null;
                    return (
                      <BelgeSatiri
                        key={g}
                        duzen={ic}
                        serit={
                          <SatirSeridi
                            ekle={() => ac({ tur: "ekipEkle", gorev: g })}
                            ekleEtiket={t("ekibeEkle")}
                          />
                        }
                      >
                        <p>
                          <b>{ekipGorevAdi(g)}: </b>
                          {ic
                            ? uyeler.map((e, i) => (
                                <Fragment key={e.kisiId}>
                                  {i > 0 && " | "}
                                  <button
                                    type="button"
                                    className={`belge-kisi${e.onceki ? " onceki" : ""}`}
                                    title={
                                      e.onceki
                                        ? t("oncekiGunden")
                                        : t("duzenle")
                                    }
                                    onClick={() =>
                                      ac({ tur: "ekipUye", kisiId: e.kisiId })
                                    }
                                  >
                                    {ekipAdi(kisiBul(v, e.kisiId))}{" "}
                                    {vardiyaYaz(e.vardiya)}
                                  </button>
                                </Fragment>
                              ))
                            : uyeler
                                .map(
                                  (e) =>
                                    `${ekipAdi(kisiBul(v, e.kisiId))} ${vardiyaYaz(e.vardiya)}`,
                                )
                                .join(" | ")}
                        </p>
                      </BelgeSatiri>
                    );
                  })}
                  {ic && (
                    <EkleCubugu>
                      <EkleDugmesi
                        metin={t("ekibeEkle")}
                        onClick={() => ac({ tur: "ekipEkle" })}
                      />
                    </EkleCubugu>
                  )}
                </section>
              )}

              {(gorevlendirmeler.length > 0 || ic) && (
                <section data-bolum="hareket">
                  <h2 className="yesil">{c("muhabirHareketleri")}</h2>
                  {gorevlendirmeler.map((g, i) => {
                    const onceki = plan.oncekiHareketler?.includes(g.id);
                    return (
                      <BelgeSatiri
                        key={g.id}
                        duzen={ic}
                        onceki={onceki}
                        serit={
                          <SatirSeridi
                            yukari={yukari(
                              i,
                              () =>
                                ben &&
                                planGorevlendirmeTasi(ben, plan.id, g.id, -1),
                            )}
                            asagi={asagi(
                              i,
                              gorevlendirmeler.length,
                              () =>
                                ben &&
                                planGorevlendirmeTasi(ben, plan.id, g.id, 1),
                            )}
                            onceki={
                              onceki
                                ? () =>
                                    ben &&
                                    oncekiOnayla(ben, plan.id, {
                                      hareket: g.id,
                                    })
                                : undefined
                            }
                            cikar={sil(
                              () =>
                                ben &&
                                planGorevlendirmeCikar(ben, plan.id, g.id),
                            )}
                            cikarEtiket={t("plandanCikar")}
                          />
                        }
                      >
                        <Satir
                          yer={
                            ic ? (
                              <YerindeMetin
                                acik
                                deger={g.yer}
                                etiket={t("yer")}
                                kaydet={(x) =>
                                  x &&
                                  ben &&
                                  gorevlendirmeMetni(ben, plan.id, g.id, {
                                    yer: x,
                                  })
                                }
                              />
                            ) : (
                              g.yer
                            )
                          }
                        >
                          {kisiAdi(g.kisiId)} /{" "}
                          {sureYaz(g.baslangic, g.bitis, "ar")}
                          {ic ? (
                            <>
                              {" / "}
                              <YerindeMetin
                                acik
                                deger={g.aciklama}
                                etiket={t("aciklama")}
                                kaydet={(x) =>
                                  ben &&
                                  gorevlendirmeMetni(ben, plan.id, g.id, {
                                    aciklama: x,
                                  })
                                }
                              />
                            </>
                          ) : g.aciklama ? (
                            ` / ${g.aciklama}`
                          ) : (
                            ""
                          )}
                        </Satir>
                      </BelgeSatiri>
                    );
                  })}
                  {ic && (
                    <EkleCubugu>
                      <EkleDugmesi
                        metin={t("yeniHareket")}
                        onClick={() => ac({ tur: "hareketEkle" })}
                      />
                    </EkleCubugu>
                  )}
                </section>
              )}

              {(canlilar.length > 0 || op) && (
                <section data-bolum="canli">
                  <h2 className="kirmizi">{c("ciktiCanli")}</h2>
                  {canlilar.map((x) => (
                    <BelgeSatiri
                      key={x.id}
                      duzen={op}
                      onceki={x.onceki}
                      serit={
                        <SatirSeridi
                          duzenle={() => ac({ tur: "canli", mevcut: x })}
                          onceki={
                            x.onceki
                              ? () =>
                                  ben &&
                                  oncekiOnayla(ben, plan.id, { canli: x.id })
                              : undefined
                          }
                          cikar={
                            !x.oneriId ||
                            (ben && yapabilir(ben, "oneriDegerlendir"))
                              ? sil(() => ben && canliSil(ben, x.id))
                              : undefined
                          }
                        />
                      }
                    >
                      {/* Kurumun istediği sıra: ŞEHİR / saat / konu / ayrıntı / muhabir. */}
                      <Satir yer={x.yer}>
                        <b>{x.saatGmt ? vardiyaYaz(x.saatGmt) : "TBC"}</b> /{" "}
                        {op ? (
                          <YerindeMetin
                            acik
                            deger={x.konu}
                            etiket={t("etkinlikAdi")}
                            kaydet={(k) =>
                              k && ben && canliKaydet(ben, { ...x, konu: k })
                            }
                          />
                        ) : (
                          x.konu
                        )}
                        {x.aciklama ? ` / ${x.aciklama}` : ""}
                        {x.muhabirId ? ` / ${kisiAdi(x.muhabirId)}` : ""}
                      </Satir>
                    </BelgeSatiri>
                  ))}
                  {op && (
                    <EkleCubugu>
                      <EkleDugmesi
                        metin={t("canliEkle")}
                        onClick={() => ac({ tur: "canli" })}
                      />
                    </EkleCubugu>
                  )}
                </section>
              )}

              {(hazirlar.length > 0 || ic) && (
                <section>
                  <h2 className="yesil">{c("ciktiHazir")}</h2>
                  {hazirlar.map((h, i) => (
                    <BelgeSatiri
                      key={h.id}
                      duzen={ic}
                      serit={
                        <SatirSeridi
                          yukari={yukari(
                            i,
                            () => ben && hazirPaketTasi(ben, plan.id, h.id, -1),
                          )}
                          asagi={asagi(
                            i,
                            hazirlar.length,
                            () => ben && hazirPaketTasi(ben, plan.id, h.id, 1),
                          )}
                          ek={<PaketBaglantisi id={h.id} />}
                          cikar={sil(
                            () => ben && hazirPaketCikar(ben, plan.id, h.id),
                          )}
                          cikarEtiket={t("plandanCikar")}
                        />
                      }
                    >
                      <div className="cikti-paket">
                        <Satir yer={paketYeri(h)}>
                          {h.baslik} / <b>{kisiAdi(h.muhabirId)}</b>
                          {paketNotEki(h) && (
                            <span data-paket-notu>{paketNotEki(h)}</span>
                          )}
                        </Satir>
                        <p className="cikti-aciklama">{h.aciklama}</p>
                        {h.slug && (
                          <p className="cikti-slug">
                            <bdi>{h.slug}</bdi>
                          </p>
                        )}
                      </div>
                    </BelgeSatiri>
                  ))}
                  {ic && (
                    <EkleCubugu>
                      <EkleDugmesi
                        metin={t("stoktanSec")}
                        onClick={() => ac({ tur: "hazirSec" })}
                      />
                    </EkleCubugu>
                  )}
                </section>
              )}

              {!takipSonda && takipBolumu}
            </aside>
          </div>
          {takipSonda && takipBolumu}
        </>
      ) : (
        <>
          {(plan.ekip.length > 0 || ic) && (
            <section data-bolum="ekip">
              <h2 className="yesil">{c("calismaEkibi")}</h2>
              {ekipSirasi(plan).map((g) => {
                const uyeler = gorevEkibi(plan, g);
                if (!uyeler.length) return null;
                return (
                  <BelgeSatiri
                    key={g}
                    duzen={ic}
                    serit={
                      <SatirSeridi
                        ekle={() => ac({ tur: "ekipEkle", gorev: g })}
                        ekleEtiket={t("ekibeEkle")}
                      />
                    }
                  >
                    <p>
                      <b>{ekipGorevAdi(g)}: </b>
                      {ic
                        ? uyeler.map((e, i) => (
                            <Fragment key={e.kisiId}>
                              {i > 0 && " | "}
                              <button
                                type="button"
                                className={`belge-kisi${e.onceki ? " onceki" : ""}`}
                                title={
                                  e.onceki ? t("oncekiGunden") : t("duzenle")
                                }
                                onClick={() =>
                                  ac({ tur: "ekipUye", kisiId: e.kisiId })
                                }
                              >
                                {ekipAdi(kisiBul(v, e.kisiId))}{" "}
                                {vardiyaYaz(e.vardiya)}
                              </button>
                            </Fragment>
                          ))
                        : uyeler
                            .map(
                              (e) =>
                                `${ekipAdi(kisiBul(v, e.kisiId))} ${vardiyaYaz(e.vardiya)}`,
                            )
                            .join(" | ")}
                    </p>
                  </BelgeSatiri>
                );
              })}
              {ic && (
                <EkleCubugu>
                  <EkleDugmesi
                    metin={t("ekibeEkle")}
                    onClick={() => ac({ tur: "ekipEkle" })}
                  />
                </EkleCubugu>
              )}
            </section>
          )}

          {(gorevlendirmeler.length > 0 || ic) && (
            <section data-bolum="hareket">
              <h2 className="yesil">{c("muhabirHareketleri")}</h2>
              {gorevlendirmeler.map((g, i) => {
                const onceki = plan.oncekiHareketler?.includes(g.id);
                return (
                  <BelgeSatiri
                    key={g.id}
                    duzen={ic}
                    onceki={onceki}
                    serit={
                      <SatirSeridi
                        yukari={yukari(
                          i,
                          () =>
                            ben &&
                            planGorevlendirmeTasi(ben, plan.id, g.id, -1),
                        )}
                        asagi={asagi(
                          i,
                          gorevlendirmeler.length,
                          () =>
                            ben && planGorevlendirmeTasi(ben, plan.id, g.id, 1),
                        )}
                        onceki={
                          onceki
                            ? () =>
                                ben &&
                                oncekiOnayla(ben, plan.id, { hareket: g.id })
                            : undefined
                        }
                        cikar={sil(
                          () =>
                            ben && planGorevlendirmeCikar(ben, plan.id, g.id),
                        )}
                        cikarEtiket={t("plandanCikar")}
                      />
                    }
                  >
                    <Satir
                      yer={
                        ic ? (
                          <YerindeMetin
                            acik
                            deger={g.yer}
                            etiket={t("yer")}
                            kaydet={(x) =>
                              x &&
                              ben &&
                              gorevlendirmeMetni(ben, plan.id, g.id, { yer: x })
                            }
                          />
                        ) : (
                          g.yer
                        )
                      }
                    >
                      {kisiAdi(g.kisiId)} /{" "}
                      {sureYaz(g.baslangic, g.bitis, "ar")}
                      {ic ? (
                        <>
                          {" / "}
                          <YerindeMetin
                            acik
                            deger={g.aciklama}
                            etiket={t("aciklama")}
                            kaydet={(x) =>
                              ben &&
                              gorevlendirmeMetni(ben, plan.id, g.id, {
                                aciklama: x,
                              })
                            }
                          />
                        </>
                      ) : g.aciklama ? (
                        ` / ${g.aciklama}`
                      ) : (
                        ""
                      )}
                    </Satir>
                  </BelgeSatiri>
                );
              })}
              {ic && (
                <EkleCubugu>
                  <EkleDugmesi
                    metin={t("yeniHareket")}
                    onClick={() => ac({ tur: "hareketEkle" })}
                  />
                </EkleCubugu>
              )}
            </section>
          )}

          {(canlilar.length > 0 || op) && (
            <section data-bolum="canli">
              <h2 className="kirmizi">{c("ciktiCanli")}</h2>
              {canlilar.map((x) => (
                <BelgeSatiri
                  key={x.id}
                  duzen={op}
                  onceki={x.onceki}
                  serit={
                    <SatirSeridi
                      duzenle={() => ac({ tur: "canli", mevcut: x })}
                      onceki={
                        x.onceki
                          ? () =>
                              ben && oncekiOnayla(ben, plan.id, { canli: x.id })
                          : undefined
                      }
                      cikar={
                        !x.oneriId ||
                        (ben && yapabilir(ben, "oneriDegerlendir"))
                          ? sil(() => ben && canliSil(ben, x.id))
                          : undefined
                      }
                    />
                  }
                >
                  {/* Kurumun istediği sıra: ŞEHİR / saat / konu / ayrıntı / muhabir. */}
                  <Satir yer={x.yer}>
                    <b>{x.saatGmt ? vardiyaYaz(x.saatGmt) : "TBC"}</b> /{" "}
                    {op ? (
                      <YerindeMetin
                        acik
                        deger={x.konu}
                        etiket={t("etkinlikAdi")}
                        kaydet={(k) =>
                          k && ben && canliKaydet(ben, { ...x, konu: k })
                        }
                      />
                    ) : (
                      x.konu
                    )}
                    {x.aciklama ? ` / ${x.aciklama}` : ""}
                    {x.muhabirId ? ` / ${kisiAdi(x.muhabirId)}` : ""}
                  </Satir>
                </BelgeSatiri>
              ))}
              {op && (
                <EkleCubugu>
                  <EkleDugmesi
                    metin={t("canliEkle")}
                    onClick={() => ac({ tur: "canli" })}
                  />
                </EkleCubugu>
              )}
            </section>
          )}

          {(hazirlar.length > 0 || ic) && (
            <section>
              <h2 className="yesil">{c("ciktiHazir")}</h2>
              {hazirlar.map((h, i) => (
                <BelgeSatiri
                  key={h.id}
                  duzen={ic}
                  serit={
                    <SatirSeridi
                      yukari={yukari(
                        i,
                        () => ben && hazirPaketTasi(ben, plan.id, h.id, -1),
                      )}
                      asagi={asagi(
                        i,
                        hazirlar.length,
                        () => ben && hazirPaketTasi(ben, plan.id, h.id, 1),
                      )}
                      ek={<PaketBaglantisi id={h.id} />}
                      cikar={sil(
                        () => ben && hazirPaketCikar(ben, plan.id, h.id),
                      )}
                      cikarEtiket={t("plandanCikar")}
                    />
                  }
                >
                  <div className="cikti-paket">
                    <Satir yer={paketYeri(h)}>
                      {h.baslik} / <b>{kisiAdi(h.muhabirId)}</b>
                      {paketNotEki(h) && (
                        <span data-paket-notu>{paketNotEki(h)}</span>
                      )}
                    </Satir>
                    <p className="cikti-aciklama">{h.aciklama}</p>
                    {h.slug && (
                      <p className="cikti-slug">
                        <bdi>{h.slug}</bdi>
                      </p>
                    )}
                  </div>
                </BelgeSatiri>
              ))}
              {ic && (
                <EkleCubugu>
                  <EkleDugmesi
                    metin={t("stoktanSec")}
                    onClick={() => ac({ tur: "hazirSec" })}
                  />
                </EkleCubugu>
              )}
            </section>
          )}

          {beklenenler.length > 0 && (
            <section>
              <h2 className="yesil">{c("ciktiBeklenen")}</h2>
              {beklenenler.map((p) => (
                <Satir key={p.id} yer={paketYeri(p)}>
                  {p.baslik} /{" "}
                  <b>
                    {muhabirYeri(
                      [p.muhabirId ? kisiAdi(p.muhabirId) : ""],
                      p.muhabirTbc,
                    )}
                  </b>
                  {bicimEki(p.bicim) && (
                    <b data-bicim-eki> {bicimEki(p.bicim)}</b>
                  )}
                  {paketNotEki(p) && (
                    <span data-paket-notu>{paketNotEki(p)}</span>
                  )}
                </Satir>
              ))}
            </section>
          )}

          {(plan.basliklar.length > 0 || ic) && (
            <section>
              <h2 className="kirmizi ortali">{c("ciktiOlaylar")}</h2>
              {plan.basliklar.map((pb, i) => {
                const gelismeler = v.gelismeler.filter(
                  (g) => g.planBaslikId === pb.id,
                );
                const pkg = paketler.filter(
                  (p) =>
                    p.planBaslikId === pb.id && !gelismeAltinda(p, gelismeler),
                );
                // Başlığa bağlı canlı yayın üstteki "مباشر"da ve başlığın altında da; okuyan haberle birlikte görsün.
                const pbCanli = canlilar.filter(
                  (x) => x.planBaslikId === pb.id,
                );
                // Çıktıda boş başlık görünmüyor; belgede görünüyor ki içine eklenebilsin.
                if (
                  !d &&
                  !gelismeler.length &&
                  !pb.muhabirler.length &&
                  !pb.muhabirTbc &&
                  !pb.live &&
                  !pbCanli.length &&
                  !pkg.length
                )
                  return null;
                const ad = baslikBul(v, pb.baslikId)?.ad ?? "";
                const cikabilir = !pkg.length;
                return (
                  <div
                    key={pb.id}
                    className="cikti-baslik"
                    data-nd-baslik={pb.id}
                  >
                    <BelgeSatiri
                      duzen={ic}
                      serit={
                        <SatirSeridi
                          yukari={yukari(
                            i,
                            () =>
                              ben && planBaslikTasi(ben, plan.id, pb.id, -1),
                          )}
                          asagi={asagi(
                            i,
                            plan.basliklar.length,
                            () => ben && planBaslikTasi(ben, plan.id, pb.id, 1),
                          )}
                          ekle={() => ac({ tur: "baslikEkle", sonra: pb.id })}
                          ekleEtiket={t("baslikEkle")}
                          cikar={() => {
                            if (!ben) return;
                            if (!cikabilir)
                              return bildir(t("paketliBaslikCikmaz"));
                            if (confirm(t("baslikCikarilsinMi")))
                              planBaslikCikar(ben, plan.id, pb.id);
                          }}
                          cikarEtiket={t("plandanCikar")}
                        />
                      }
                    >
                      <h3>
                        {ic && ben && yapabilir(ben, "baslikYonet") ? (
                          <YerindeMetin
                            acik
                            deger={ad}
                            etiket={t("baslik")}
                            kaydet={(x) =>
                              x && baslikDuzenle(ben, pb.baslikId, { ad: x })
                            }
                          />
                        ) : (
                          ad
                        )}
                      </h3>
                    </BelgeSatiri>
                    {gelismeler.map((g, j) =>
                      gelismeSatiri(g, j, gelismeler, pb.id),
                    )}
                    {pb.muhabirler.length > 0 && (
                      <>
                        <p className="alt-baslik">
                          {c(
                            pb.muhabirler.length > 1
                              ? "ciktiMuhabirler"
                              : "ciktiMuhabir",
                          )}
                        </p>
                        {pb.muhabirler.map((m, j) => (
                          <BelgeSatiri
                            key={m.kisiId}
                            duzen={ic}
                            onceki={m.onceki}
                            serit={
                              <SatirSeridi
                                yukari={yukari(
                                  j,
                                  () =>
                                    ben &&
                                    planMuhabirTasi(
                                      ben,
                                      plan.id,
                                      pb.id,
                                      m.kisiId,
                                      -1,
                                    ),
                                )}
                                asagi={asagi(
                                  j,
                                  pb.muhabirler.length,
                                  () =>
                                    ben &&
                                    planMuhabirTasi(
                                      ben,
                                      plan.id,
                                      pb.id,
                                      m.kisiId,
                                      1,
                                    ),
                                )}
                                ekle={() =>
                                  ac({
                                    tur: "muhabirEkle",
                                    pbId: pb.id,
                                    sonra: m.kisiId,
                                  })
                                }
                                ekleEtiket={t("muhabirAta")}
                                duzenle={() =>
                                  ac({
                                    tur: "muhabir",
                                    pbId: pb.id,
                                    kisiId: m.kisiId,
                                  })
                                }
                                onceki={
                                  m.onceki
                                    ? () =>
                                        ben &&
                                        oncekiOnayla(ben, plan.id, {
                                          muhabir: [pb.id, m.kisiId],
                                        })
                                    : undefined
                                }
                                cikar={sil(
                                  () =>
                                    ben &&
                                    planMuhabir(
                                      ben,
                                      plan.id,
                                      pb.id,
                                      m.kisiId,
                                      false,
                                    ),
                                )}
                              />
                            }
                          >
                            <Satir
                              yer={
                                ic ? (
                                  <YerindeMetin
                                    acik
                                    deger={m.yer ?? ""}
                                    goster={sehir(m.kisiId)}
                                    etiket={t("yer")}
                                    kaydet={(x) =>
                                      ben &&
                                      planMuhabirGuncelle(
                                        ben,
                                        plan.id,
                                        pb.id,
                                        m.kisiId,
                                        { yer: x || undefined },
                                      )
                                    }
                                  />
                                ) : (
                                  m.yer || sehir(m.kisiId)
                                )
                              }
                            >
                              {kisiAdi(m.kisiId)}{" "}
                              {m.saat && <b>{vardiyaYaz(m.saat)}</b>}
                            </Satir>
                          </BelgeSatiri>
                        ))}
                      </>
                    )}
                    {!pb.muhabirler.length && pb.muhabirTbc && (
                      <>
                        <p className="alt-baslik">{c("ciktiMuhabir")}</p>
                        <BelgeSatiri
                          duzen={ic}
                          serit={
                            <SatirSeridi
                              ekle={() =>
                                ac({ tur: "muhabirEkle", pbId: pb.id })
                              }
                              ekleEtiket={t("muhabirAta")}
                              cikar={() =>
                                ben &&
                                planMuhabirTbc(ben, plan.id, pb.id, false)
                              }
                            />
                          }
                        >
                          <Satir>
                            <span data-tbc-satir>{TBC}</span>
                          </Satir>
                        </BelgeSatiri>
                      </>
                    )}
                    {pbCanli.length > 0 && (
                      <>
                        <p className="alt-baslik">
                          <bdi>LIVE</bdi>
                        </p>
                        {pbCanli.map((x) => (
                          <BelgeSatiri
                            key={x.id}
                            duzen={op}
                            onceki={x.onceki}
                            serit={
                              <SatirSeridi
                                duzenle={() => ac({ tur: "canli", mevcut: x })}
                                cikar={
                                  !x.oneriId ||
                                  (ben && yapabilir(ben, "oneriDegerlendir"))
                                    ? sil(() => ben && canliSil(ben, x.id))
                                    : undefined
                                }
                              />
                            }
                          >
                            <Satir yer={x.yer}>
                              <b>{x.saatGmt ? vardiyaYaz(x.saatGmt) : "TBC"}</b>{" "}
                              / <span data-baslik-canli>{x.konu}</span>
                              {x.aciklama ? ` / ${x.aciklama}` : ""}
                              {x.muhabirId ? ` / ${kisiAdi(x.muhabirId)}` : ""}
                            </Satir>
                          </BelgeSatiri>
                        ))}
                      </>
                    )}
                    {pb.live && (
                      <BelgeSatiri
                        duzen={ic}
                        serit={
                          <SatirSeridi
                            cikar={() =>
                              ben && planBaslikLive(ben, plan.id, pb.id, false)
                            }
                          />
                        }
                      >
                        <Satir>
                          <b data-live-satir>LIVE</b>
                        </Satir>
                      </BelgeSatiri>
                    )}
                    {/* Kararı verilmemiş paket "PKG PROPOSAL", kabul edilen "PKG" altında (kurumun isteği). */}
                    {pkgGruplari(pkg).map(([ad, grup]) => (
                      <Fragment key={ad}>
                        <p className="alt-baslik" data-pkg-grubu={ad}>
                          <bdi>{ad}</bdi>
                        </p>
                        {grup.map(paketSatiri(pb.id, grup))}
                      </Fragment>
                    ))}
                    {(ic || op) && (
                      <EkleCubugu>
                        {op && (
                          <EkleDugmesi
                            metin={t("gelismeEkle")}
                            onClick={() =>
                              ac({
                                tur: "gelisme",
                                planBaslikId: pb.id,
                                sonra: gelismeler.at(-1)?.id,
                              })
                            }
                          />
                        )}
                        {ic && (
                          <EkleDugmesi
                            metin={t("muhabirAta")}
                            onClick={() =>
                              ac({
                                tur: "muhabirEkle",
                                pbId: pb.id,
                                sonra: pb.muhabirler.at(-1)?.kisiId,
                              })
                            }
                          />
                        )}
                        {ic && (
                          <EkleDugmesi
                            metin={t("paketOnerisiEkle")}
                            onClick={() =>
                              ac({
                                tur: "paket",
                                pbId: pb.id,
                                sonra: pkg.at(-1)?.id,
                              })
                            }
                          />
                        )}
                      </EkleCubugu>
                    )}
                    {duzen?.hizli && op && (
                      <HizliEkle
                        ben={duzen.ben}
                        plan={plan}
                        pbId={pb.id}
                        sonra={gelismeler.at(-1)?.id}
                        icerik={ic}
                        ac={ac}
                      />
                    )}
                  </div>
                );
              })}
              {ic && (
                <EkleCubugu>
                  <EkleDugmesi
                    metin={t("baslikEkle")}
                    onClick={() =>
                      ac({
                        tur: "baslikEkle",
                        sonra: plan.basliklar.at(-1)?.id,
                      })
                    }
                  />
                </EkleCubugu>
              )}
            </section>
          )}

          {!takipSonda && takipBolumu}
        </>
      )}
    </article>
  );
}

export type { Baski };

/* 2. baskının manşeti: günün tarihi büyük, belgenin adı, günün sayıları (başlık, PKG, canlı). */
function Manset({ plan }: { plan: NextDayPlan }) {
  const v = useVeri();
  const pkg = v.paketler.filter(
    (p) => p.planId === plan.id && p.durum !== "iptal",
  ).length;
  const canli = v.canliYayinlar.filter((x) => x.planId === plan.id).length;
  const gun = plan.tarih.split("-")[2];
  return (
    <header className="baski-manset">
      <img className="bm-logo" src={trtArabiBeyaz} alt="TRT عربي" />
      <span className="bm-gun">{gun}</span>
      <span className="bm-ad">
        {c("ciktiBaslik")}
        <small>{ciktiTarihi(plan.tarih, "ar")}</small>
      </span>
      <span className="bm-sayilar">
        <span>
          <b>{plan.basliklar.length}</b>
          {c("bmBaslik")}
        </span>
        <span>
          <b>{pkg}</b>PKG
        </span>
        <span>
          <b>{canli}</b>LIVE
        </span>
      </span>
    </header>
  );
}

function PaketBaglantisi({ id }: { id: string }) {
  const { t } = useDil();
  return (
    <a
      className="dugme dugme-sade dugme-ikon"
      href={`#/paketler/${id}`}
      title={t("paketiAc")}
      aria-label={t("paketiAc")}
    >
      <ExternalLink size={15} />
    </a>
  );
}

/* --- Pencereler: seçimler bugünkü formlarla --- */

function EkipUyesi({
  ben,
  plan,
  kisiId,
  kapat,
}: {
  ben: Kisi;
  plan: NextDayPlan;
  kisiId: string;
  kapat: () => void;
}) {
  const { t } = useDil();
  const v = useVeri();
  const e = plan.ekip.find((x) => x.kisiId === kisiId);
  const kisi = kisiBul(v, kisiId);
  if (!e) return null;
  // Seçenekler görevin kuralına uyanlar (Organizasyon › Plan ekibi); ekipte başka satırda olan çıkmaz, şimdiki kişi hep listede.
  const adaylar = v.kisiler
    .filter(
      (k) =>
        k.id === kisiId ||
        (!k.pasif &&
          !plan.ekip.some((x) => x.kisiId === k.id) &&
          ekipAdayi(k, e.gorev)),
    )
    .sort((a, b) => kisiAr(a).localeCompare(kisiAr(b), "ar"));
  return (
    <div className="form">
      <div className="satir">
        <label>
          {t("ad")}
          <select
            value={kisiId}
            onChange={(x) => {
              if (ekipKisiDegistir(ben, plan.id, kisiId, x.target.value))
                kapat();
            }}
            data-ekip-kisi
          >
            {adaylar.map((k) => (
              <option key={k.id} value={k.id} lang="ar">
                {kisiAr(k)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("gorev")}
          <select
            value={e.gorev}
            onChange={(x) =>
              ekipGuncelle(ben, plan.id, kisiId, { gorev: x.target.value })
            }
          >
            {ekipGorevListesi(e.gorev).map((x) => (
              <option key={x} value={x} lang="ar">
                {ekipGorevAdi(x)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("vardiyaGmt")}
          <input
            type="time"
            value={e.vardiya}
            onChange={(x) =>
              ekipGuncelle(ben, plan.id, kisiId, { vardiya: x.target.value })
            }
          />
        </label>
        {kisi && adParcalari(kisiAr(kisi)).length > 1 && (
          <label>
            {t("planAdi")}
            <PlanAdiSecici kisi={kisi} sinif="" />
          </label>
        )}
      </div>
      <SatirSeridi
        onceki={
          e.onceki
            ? () => oncekiOnayla(ben, plan.id, { ekip: kisiId })
            : undefined
        }
        cikar={onayla(
          t("silinsinMi"),
          () => ekipCikar(ben, plan.id, kisiId) && kapat(),
        )}
      />
    </div>
  );
}

function MuhabirAyari({
  ben,
  plan,
  pbId,
  kisiId,
  kapat,
}: {
  ben: Kisi;
  plan: NextDayPlan;
  pbId: string;
  kisiId: string;
  kapat: () => void;
}) {
  const { t } = useDil();
  const m = plan.basliklar
    .find((b) => b.id === pbId)
    ?.muhabirler.find((x) => x.kisiId === kisiId);
  const [f, setF] = useState({
    saat: m?.saat ?? "",
    yer: m?.yer ?? "",
    not: m?.not ?? "",
  });
  if (!m) return null;
  return (
    <div className="form">
      <div className="satir">
        <label>
          {t("canliSaati")}
          <input
            type="time"
            value={f.saat}
            onChange={(e) => setF({ ...f, saat: e.target.value })}
          />
        </label>
        <label>
          {t("yer")}
          <input
            {...icerikAlani}
            value={f.yer}
            onChange={(e) => setF({ ...f, yer: e.target.value })}
            placeholder={metin("yerIpucu", "ar")}
          />
        </label>
      </div>
      <label>
        {t("muhabireNot")}
        <textarea
          dir="auto"
          value={f.not}
          onChange={(e) => setF({ ...f, not: e.target.value })}
        />
      </label>
      <FormAlt
        kapat={kapat}
        kaydet={() =>
          planMuhabirGuncelle(ben, plan.id, pbId, kisiId, {
            saat: f.saat || undefined,
            yer: f.yer.trim() || undefined,
            not: f.not.trim() || undefined,
          }) && kapat()
        }
      />
    </div>
  );
}

function HareketEkle({
  plan,
  kapat,
}: {
  plan: NextDayPlan;
  kapat: () => void;
}) {
  const { t } = useDil();
  const [secim, setSecim] = useState<"yeni" | "mevcut">("yeni");
  return (
    <>
      <div className="sekmeler" role="tablist">
        <button
          role="tab"
          aria-selected={secim === "yeni"}
          className={secim === "yeni" ? "acik" : ""}
          onClick={() => setSecim("yeni")}
        >
          {t("yeniHareket")}
        </button>
        <button
          role="tab"
          aria-selected={secim === "mevcut"}
          className={secim === "mevcut" ? "acik" : ""}
          onClick={() => setSecim("mevcut")}
        >
          {t("kayitliHareketEkle")}
        </button>
      </div>
      {secim === "yeni" ? (
        <GorevlendirmeFormu plan={plan} kapat={kapat} />
      ) : (
        <KayitliHareketSecici plan={plan} kapat={kapat} />
      )}
    </>
  );
}

export function NdPencereIcerik({
  ben,
  plan,
  p,
  kapat,
}: {
  ben: Kisi;
  plan: NextDayPlan;
  p: NdPencere;
  kapat: () => void;
}) {
  const { t } = useDil();
  const v = useVeri();
  const pencere = (baslik: ReactNode, govde: ReactNode) => (
    <Pencere baslik={baslik} kapat={kapat}>
      {govde}
    </Pencere>
  );
  switch (p.tur) {
    case "gelismeTasi":
      // Kendi penceresi var (plan ekranıyla ortak).
      return (
        <BaslikaTasiPenceresi plan={plan} gelisme={p.gelisme} kapat={kapat} />
      );
    case "ekipEkle":
      return pencere(
        t("ekibeEkle"),
        <EkipEkleFormu plan={plan} gorev={p.gorev} kapat={kapat} />,
      );
    case "ekipUye":
      return pencere(
        kisiAr(kisiBul(v, p.kisiId)) || t("calismaEkibi"),
        <EkipUyesi ben={ben} plan={plan} kisiId={p.kisiId} kapat={kapat} />,
      );
    case "hareketEkle":
      return pencere(
        t("muhabirHareketleri"),
        <HareketEkle plan={plan} kapat={kapat} />,
      );
    case "canli":
      return pencere(
        t(p.mevcut ? "duzenle" : "canliEkle"),
        <CanliFormu
          plan={plan}
          planBaslikId={p.mevcut?.planBaslikId}
          mevcut={p.mevcut}
          kapat={kapat}
        />,
      );
    case "hazirSec":
      return pencere(
        t("stoktanSec"),
        <StoktanSecici plan={plan} d={v} kapat={kapat} />,
      );
    case "baslikEkle":
      return pencere(
        t("baslikEkle"),
        <BaslikEkleFormu plan={plan} sonra={p.sonra} kapat={kapat} />,
      );
    case "gelisme":
      return pencere(
        t(p.mevcut ? "duzenle" : p.planBaslikId ? "gelismeEkle" : "takipEkle"),
        <GelismeFormu
          plan={plan}
          planBaslikId={p.planBaslikId}
          mevcut={p.mevcut}
          sonra={p.sonra}
          kapat={kapat}
        />,
      );
    case "muhabirEkle":
      return pencere(
        t("muhabirAta"),
        <div className="form">
          <MuhabirSecici
            deger=""
            degistir={(id) =>
              id &&
              planMuhabir(ben, plan.id, p.pbId, id, true, p.sonra) &&
              kapat()
            }
          />
          {!plan.basliklar.find((b) => b.id === p.pbId)?.muhabirler.length && (
            <TbcKutusu
              secili={!!plan.basliklar.find((b) => b.id === p.pbId)?.muhabirTbc}
              degistir={(x) =>
                planMuhabirTbc(ben, plan.id, p.pbId, x) && kapat()
              }
            />
          )}
          <LiveKutusu
            secili={!!plan.basliklar.find((b) => b.id === p.pbId)?.live}
            degistir={(x) => planBaslikLive(ben, plan.id, p.pbId, x) && kapat()}
          />
        </div>,
      );
    case "muhabir":
      return pencere(
        kisiAr(kisiBul(v, p.kisiId)),
        <MuhabirAyari
          ben={ben}
          plan={plan}
          pbId={p.pbId}
          kisiId={p.kisiId}
          kapat={kapat}
        />,
      );
    case "paket":
      return pencere(
        t(p.mevcut ? "duzenle" : "paketOnerisiEkle"),
        <PaketFormu
          plan={plan}
          planBaslikId={p.pbId}
          mevcut={p.mevcut}
          sonra={p.sonra}
          gelismeId={p.gelismeId}
          kapat={kapat}
        />,
      );
  }
}

/**
 * Belge sayfası: planı çıktının üzerinde düzenleme. Ekranda düzenlenen
 * kopya, baskıda temiz kopya; kopyala ve Word de temiz kopyadan.
 */
export default function NextDayBelge({
  ben,
  plan,
}: {
  ben: Kisi;
  plan: NextDayPlan;
}) {
  const { t } = useDil();
  const icerik = planIcerikDuzenler(ben, plan);
  const operasyon = planOperasyonDuzenler(ben, plan);
  const [pencere, setPencere] = useState<NdPencere | null>(null);
  const temiz = useRef<HTMLElement>(null);
  const duzen =
    icerik || operasyon
      ? { ben, icerik, operasyon, ac: setPencere }
      : undefined;

  return (
    <>
      <CiktiAraclari
        geri={{ href: `#/nextday/${plan.id}`, metin: t("planaDon") }}
        belge={temiz}
        word={{
          ad: `nextday-plan-${plan.tarih}.doc`,
          baslik: `${c("ciktiBaslik")} ${ciktiTarihi(plan.tarih, "ar")}`,
        }}
        ek={
          <>
            <a
              className="dugme dugme-ikincil"
              href={`#/nextday/${plan.id}/cikti`}
            >
              <Printer size={16} /> {t("ciktiOnizleme")}
            </a>
            {(icerik || operasyon) && (
              <GeriAlDugmesi ben={ben} planId={plan.id} />
            )}
          </>
        }
      />
      <div className="cikti-sarici belge-duzen yazdirma-gizle">
        <NextDayBelgesi plan={plan} duzen={duzen} />
      </div>
      <div className="cikti-sarici belge-temiz" aria-hidden="true">
        <NextDayBelgesi plan={plan} belgeRef={temiz} />
      </div>
      {pencere && duzen && (
        <NdPencereIcerik
          ben={ben}
          plan={plan}
          p={pencere}
          kapat={() => setPencere(null)}
        />
      )}
    </>
  );
}
