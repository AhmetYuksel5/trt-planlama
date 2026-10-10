import { ExternalLink, Printer } from "lucide-react";
import { Fragment, useRef, useState, type ReactNode, type Ref } from "react";
import { Pencere, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { ciktiTarihi, metin, useDil, type Anahtar } from "../../dil";
import { EKIP_GOREV_ADI, HAREKET_TURU_ADI, kisiAr, sehirAr } from "../../etiketler";
import {
  baslikDuzenle,
  canliKaydet,
  canliSil,
  ekipCikar,
  ekipGuncelle,
  ekipTasi,
  gelismeKaydet,
  gelismeSil,
  gelismeTasi,
  gorevlendirmeMetni,
  hazirPaketCikar,
  hazirPaketTasi,
  oncekiOnayla,
  paketKaydet,
  paketSil,
  paketTasi,
  planBaslikCikar,
  planBaslikTasi,
  planGorevlendirmeCikar,
  planGorevlendirmeTasi,
  planMuhabir,
  planMuhabirGuncelle,
  planMuhabirTasi,
} from "../../eylemler";
import { vardiyaYaz } from "../../tarih";
import { EKIP_GOREVLERI, baslikBul, kisiBul, paketBul, useVeri, type CanliYayin, type EkipGorevi, type Gelisme, type Kisi, type NextDayPlan, type Paket } from "../../veri";
import { planIcerikDuzenler, planOperasyonDuzenler, yapabilir } from "../../yetki";
import { BaslikEkleFormu, EkipEkleFormu, KayitliHareketSecici, StoktanSecici } from "../nextday/Bolumler";
import { CanliFormu, FormAlt, GelismeFormu, GorevlendirmeFormu, MuhabirSecici, PaketFormu } from "../nextday/Formlar";
import { BelgeSatiri, CiktiAraclari, EkleCubugu, EkleDugmesi, SatirSeridi, YerindeMetin, onayla } from "./Parcalar";

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
  | { tur: "ekipEkle"; gorev?: EkipGorevi }
  | { tur: "ekipUye"; kisiId: string }
  | { tur: "hareketEkle" }
  | { tur: "canli"; mevcut?: CanliYayin }
  | { tur: "hazirSec" }
  | { tur: "baslikEkle"; sonra?: string }
  | { tur: "gelisme"; planBaslikId?: string; mevcut?: Gelisme; sonra?: string }
  | { tur: "muhabirEkle"; pbId: string; sonra?: string }
  | { tur: "muhabir"; pbId: string; kisiId: string }
  | { tur: "paket"; pbId: string; mevcut?: Paket; sonra?: string };

export interface NdDuzen {
  ben: Kisi;
  icerik: boolean;
  operasyon: boolean;
  ac: (p: NdPencere) => void;
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

const c = (k: Anahtar, p?: Record<string, string | number>) => metin(k, "ar", p);

/* Belgede yazılan paket başlığı için: paket eylemi bütün alanları istiyor, değişen yalnız başlık. */
const paketGirdisi = (p: Paket, baslik: string) => ({
  id: p.id,
  planId: p.planId ?? "",
  planBaslikId: p.planBaslikId ?? "",
  baslik,
  sehir: p.sehir,
  muhabirId: p.muhabirId,
  aciklama: p.aciklama,
  tur: p.tur,
  bicim: p.bicim,
  teslim: p.teslim,
  yayin: p.yayin,
  sahaGerekli: p.sahaGerekli,
  slug: p.slug,
});

export function NextDayBelgesi({ plan, duzen, belgeRef }: { plan: NextDayPlan; duzen?: NdDuzen; belgeRef?: Ref<HTMLElement> }) {
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
  const asagi = (i: number, n: number, f: () => unknown) => (i < n - 1 ? f : undefined);

  const gorevlendirmeler = plan.gorevlendirmeler.map((id) => v.gorevlendirmeler.find((g) => g.id === id)).filter((g) => g !== undefined);
  const canlilar = v.canliYayinlar.filter((x) => x.planId === plan.id).sort((a, b) => (a.tarih + a.saatGmt).localeCompare(b.tarih + b.saatGmt));
  const hazirlar = plan.hazirPaketler.map((id) => paketBul(v, id)).filter((h) => h !== undefined);
  const paketler = v.paketler.filter((p) => p.planId === plan.id && p.durum !== "iptal");
  const takipler = v.gelismeler.filter((g) => g.planId === plan.id && !g.planBaslikId);

  /* Gelişme satırı: başlığın altında da takiplerde de aynı; başlıkta yer yoksa öneren muhabirin şehri. */
  const gelismeSatiri = (g: Gelisme, i: number, liste: Gelisme[], planBaslikId?: string) => {
    const varsayilanYer = planBaslikId && g.onerenId ? sehir(g.onerenId) : undefined;
    return (
      <BelgeSatiri
        key={g.id}
        duzen={op}
        onceki={g.onceki}
        serit={
          <SatirSeridi
            yukari={yukari(i, () => ben && gelismeTasi(ben, g.id, -1))}
            asagi={asagi(i, liste.length, () => ben && gelismeTasi(ben, g.id, 1))}
            ekle={() => ac({ tur: "gelisme", planBaslikId, sonra: g.id })}
            ekleEtiket={t(planBaslikId ? "gelismeEkle" : "takipEkle")}
            duzenle={() => ac({ tur: "gelisme", planBaslikId, mevcut: g })}
            onceki={g.onceki ? () => ben && oncekiOnayla(ben, plan.id, { gelisme: g.id }) : undefined}
            cikar={sil(() => ben && gelismeSil(ben, g.id))}
          />
        }
      >
        <Satir
          yer={
            op ? (
              <YerindeMetin acik deger={g.yer ?? ""} goster={varsayilanYer} etiket={t("yer")} kaydet={(x) => ben && gelismeKaydet(ben, { ...g, yer: x || undefined })} />
            ) : (
              g.yer || varsayilanYer
            )
          }
        >
          {op ? <YerindeMetin acik cokSatir deger={g.metin} etiket={t("gelismeMetni")} kaydet={(x) => x && ben && gelismeKaydet(ben, { ...g, metin: x })} /> : g.metin}
        </Satir>
      </BelgeSatiri>
    );
  };

  return (
    <article className="cikti" ref={belgeRef} dir="rtl" lang="ar">
      <h1>
        {c("ciktiBaslik")} {ciktiTarihi(plan.tarih, "ar")}
      </h1>

      {(plan.ekip.length > 0 || ic) && (
        <section>
          <h2 className="yesil">{c("calismaEkibi")}</h2>
          {EKIP_GOREVLERI.map((g) => {
            const uyeler = plan.ekip.filter((e) => e.gorev === g);
            if (!uyeler.length) return null;
            return (
              <BelgeSatiri key={g} duzen={ic} serit={<SatirSeridi ekle={() => ac({ tur: "ekipEkle", gorev: g })} ekleEtiket={t("ekibeEkle")} />}>
                <p>
                  <b>{c(EKIP_GOREV_ADI[g])}: </b>
                  {ic
                    ? uyeler.map((e, i) => (
                        <Fragment key={e.kisiId}>
                          {i > 0 && " | "}
                          <button
                            type="button"
                            className={`belge-kisi${e.onceki ? " onceki" : ""}`}
                            title={e.onceki ? t("oncekiGunden") : t("duzenle")}
                            onClick={() => ac({ tur: "ekipUye", kisiId: e.kisiId })}
                          >
                            {kisiAdi(e.kisiId)} {vardiyaYaz(e.vardiya)}
                          </button>
                        </Fragment>
                      ))
                    : uyeler.map((e) => `${kisiAdi(e.kisiId)} ${vardiyaYaz(e.vardiya)}`).join(" | ")}
                </p>
              </BelgeSatiri>
            );
          })}
          {ic && (
            <EkleCubugu>
              <EkleDugmesi metin={t("ekibeEkle")} onClick={() => ac({ tur: "ekipEkle" })} />
            </EkleCubugu>
          )}
        </section>
      )}

      {(gorevlendirmeler.length > 0 || ic) && (
        <section>
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
                    yukari={yukari(i, () => ben && planGorevlendirmeTasi(ben, plan.id, g.id, -1))}
                    asagi={asagi(i, gorevlendirmeler.length, () => ben && planGorevlendirmeTasi(ben, plan.id, g.id, 1))}
                    onceki={onceki ? () => ben && oncekiOnayla(ben, plan.id, { hareket: g.id }) : undefined}
                    cikar={sil(() => ben && planGorevlendirmeCikar(ben, plan.id, g.id))}
                    cikarEtiket={t("plandanCikar")}
                  />
                }
              >
                <Satir yer={ic ? <YerindeMetin acik deger={g.yer} etiket={t("yer")} kaydet={(x) => x && ben && gorevlendirmeMetni(ben, plan.id, g.id, { yer: x })} /> : g.yer}>
                  {kisiAdi(g.kisiId)} · {c(HAREKET_TURU_ADI[g.tur])}
                  {ic ? (
                    <>
                      {" · "}
                      <YerindeMetin acik deger={g.aciklama} etiket={t("aciklama")} kaydet={(x) => ben && gorevlendirmeMetni(ben, plan.id, g.id, { aciklama: x })} />
                    </>
                  ) : g.aciklama ? (
                    ` · ${g.aciklama}`
                  ) : (
                    ""
                  )}
                </Satir>
              </BelgeSatiri>
            );
          })}
          {ic && (
            <EkleCubugu>
              <EkleDugmesi metin={t("yeniHareket")} onClick={() => ac({ tur: "hareketEkle" })} />
            </EkleCubugu>
          )}
        </section>
      )}

      {(canlilar.length > 0 || op) && (
        <section>
          <h2 className="kirmizi">{c("ciktiCanli")}</h2>
          {canlilar.map((x) => (
            <BelgeSatiri
              key={x.id}
              duzen={op}
              onceki={x.onceki}
              serit={
                <SatirSeridi
                  duzenle={() => ac({ tur: "canli", mevcut: x })}
                  onceki={x.onceki ? () => ben && oncekiOnayla(ben, plan.id, { canli: x.id }) : undefined}
                  cikar={sil(() => ben && canliSil(ben, x.id))}
                />
              }
            >
              <Satir yer={x.yer}>
                {op ? <YerindeMetin acik deger={x.konu} etiket={t("etkinlikAdi")} kaydet={(k) => k && ben && canliKaydet(ben, { ...x, konu: k })} /> : x.konu}
                {x.aciklama ? ` · ${x.aciklama}` : ""} / <b>{x.saatGmt ? `${vardiyaYaz(x.saatGmt)}` : "TBC"}</b>
                {x.muhabirId ? ` / ${kisiAdi(x.muhabirId)}` : ""}
              </Satir>
            </BelgeSatiri>
          ))}
          {op && (
            <EkleCubugu>
              <EkleDugmesi metin={t("canliEkle")} onClick={() => ac({ tur: "canli" })} />
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
                  yukari={yukari(i, () => ben && hazirPaketTasi(ben, plan.id, h.id, -1))}
                  asagi={asagi(i, hazirlar.length, () => ben && hazirPaketTasi(ben, plan.id, h.id, 1))}
                  ek={<PaketBaglantisi id={h.id} />}
                  cikar={sil(() => ben && hazirPaketCikar(ben, plan.id, h.id))}
                  cikarEtiket={t("plandanCikar")}
                />
              }
            >
              <div className="cikti-paket">
                <Satir yer={sehirAr(h.sehir)}>
                  {h.baslik} / <b>{kisiAdi(h.muhabirId)}</b>
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
              <EkleDugmesi metin={t("stoktanSec")} onClick={() => ac({ tur: "hazirSec" })} />
            </EkleCubugu>
          )}
        </section>
      )}

      {paketler.length > 0 && (
        <section>
          <h2 className="yesil">{c("ciktiBeklenen")}</h2>
          {paketler.map((p) => (
            <Satir key={p.id} yer={sehirAr(p.sehir)}>
              {p.baslik} / <b>{p.muhabirId ? kisiAdi(p.muhabirId) : c("atanmadi")}</b>
            </Satir>
          ))}
        </section>
      )}

      {(plan.basliklar.length > 0 || ic) && (
        <section>
          <h2 className="kirmizi ortali">{c("ciktiOlaylar")}</h2>
          {plan.basliklar.map((pb, i) => {
            const gelismeler = v.gelismeler.filter((g) => g.planBaslikId === pb.id);
            const pkg = paketler.filter((p) => p.planBaslikId === pb.id);
            // Çıktıda boş başlık görünmüyor; belgede görünüyor ki içine eklenebilsin.
            if (!d && !gelismeler.length && !pb.muhabirler.length && !pkg.length) return null;
            const ad = baslikBul(v, pb.baslikId)?.ad ?? "";
            const cikabilir = !pkg.length;
            return (
              <div key={pb.id} className="cikti-baslik">
                <BelgeSatiri
                  duzen={ic}
                  serit={
                    <SatirSeridi
                      yukari={yukari(i, () => ben && planBaslikTasi(ben, plan.id, pb.id, -1))}
                      asagi={asagi(i, plan.basliklar.length, () => ben && planBaslikTasi(ben, plan.id, pb.id, 1))}
                      ekle={() => ac({ tur: "baslikEkle", sonra: pb.id })}
                      ekleEtiket={t("baslikEkle")}
                      cikar={() => {
                        if (!ben) return;
                        if (!cikabilir) return bildir(t("paketliBaslikCikmaz"));
                        if (confirm(t("baslikCikarilsinMi"))) planBaslikCikar(ben, plan.id, pb.id);
                      }}
                      cikarEtiket={t("plandanCikar")}
                    />
                  }
                >
                  <h3>{ic && ben && yapabilir(ben, "baslikYonet") ? <YerindeMetin acik deger={ad} etiket={t("baslik")} kaydet={(x) => x && baslikDuzenle(ben, pb.baslikId, { ad: x })} /> : ad}</h3>
                </BelgeSatiri>
                {gelismeler.map((g, j) => gelismeSatiri(g, j, gelismeler, pb.id))}
                {pb.muhabirler.length > 0 && (
                  <>
                    <p className="alt-baslik">{c(pb.muhabirler.length > 1 ? "ciktiMuhabirler" : "ciktiMuhabir")}</p>
                    {pb.muhabirler.map((m, j) => (
                      <BelgeSatiri
                        key={m.kisiId}
                        duzen={ic}
                        onceki={m.onceki}
                        serit={
                          <SatirSeridi
                            yukari={yukari(j, () => ben && planMuhabirTasi(ben, plan.id, pb.id, m.kisiId, -1))}
                            asagi={asagi(j, pb.muhabirler.length, () => ben && planMuhabirTasi(ben, plan.id, pb.id, m.kisiId, 1))}
                            ekle={() => ac({ tur: "muhabirEkle", pbId: pb.id, sonra: m.kisiId })}
                            ekleEtiket={t("muhabirAta")}
                            duzenle={() => ac({ tur: "muhabir", pbId: pb.id, kisiId: m.kisiId })}
                            onceki={m.onceki ? () => ben && oncekiOnayla(ben, plan.id, { muhabir: [pb.id, m.kisiId] }) : undefined}
                            cikar={sil(() => ben && planMuhabir(ben, plan.id, pb.id, m.kisiId, false))}
                          />
                        }
                      >
                        <Satir
                          yer={
                            ic ? (
                              <YerindeMetin acik deger={m.yer ?? ""} goster={sehir(m.kisiId)} etiket={t("yer")} kaydet={(x) => ben && planMuhabirGuncelle(ben, plan.id, pb.id, m.kisiId, { yer: x || undefined })} />
                            ) : (
                              m.yer || sehir(m.kisiId)
                            )
                          }
                        >
                          {kisiAdi(m.kisiId)} {m.saat && <b>{vardiyaYaz(m.saat)}</b>}
                        </Satir>
                      </BelgeSatiri>
                    ))}
                  </>
                )}
                {pkg.length > 0 && (
                  <>
                    <p className="alt-baslik">
                      <bdi>PKG</bdi>
                    </p>
                    {pkg.map((p, j) => {
                      // Değerlendirmeden ileri gitmiş paket burada değişmiyor; ayrıntısı paket sayfasında.
                      const acikPaket = p.durum === "taslak" || p.durum === "degerlendiriliyor";
                      return (
                        <BelgeSatiri
                          key={p.id}
                          duzen={ic}
                          serit={
                            <SatirSeridi
                              yukari={yukari(j, () => ben && paketTasi(ben, p.id, -1))}
                              asagi={asagi(j, pkg.length, () => ben && paketTasi(ben, p.id, 1))}
                              ekle={() => ac({ tur: "paket", pbId: pb.id, sonra: p.id })}
                              ekleEtiket={t("paketOnerisiEkle")}
                              duzenle={acikPaket ? () => ac({ tur: "paket", pbId: pb.id, mevcut: p }) : undefined}
                              ek={<PaketBaglantisi id={p.id} />}
                              cikar={acikPaket ? sil(() => ben && paketSil(ben, p.id)) : undefined}
                            />
                          }
                        >
                          <Satir yer={sehirAr(p.sehir)}>
                            {ic && acikPaket ? (
                              <YerindeMetin acik deger={p.baslik} etiket={t("paketBasligi")} kaydet={(x) => x && ben && paketKaydet(ben, paketGirdisi(p, x))} />
                            ) : (
                              p.baslik
                            )}{" "}
                            / <b>{p.muhabirId ? kisiAdi(p.muhabirId) : c("atanmadi")}</b>
                          </Satir>
                        </BelgeSatiri>
                      );
                    })}
                  </>
                )}
                {(ic || op) && (
                  <EkleCubugu>
                    {op && <EkleDugmesi metin={t("gelismeEkle")} onClick={() => ac({ tur: "gelisme", planBaslikId: pb.id, sonra: gelismeler.at(-1)?.id })} />}
                    {ic && <EkleDugmesi metin={t("muhabirAta")} onClick={() => ac({ tur: "muhabirEkle", pbId: pb.id, sonra: pb.muhabirler.at(-1)?.kisiId })} />}
                    {ic && <EkleDugmesi metin={t("paketOnerisiEkle")} onClick={() => ac({ tur: "paket", pbId: pb.id, sonra: pkg.at(-1)?.id })} />}
                  </EkleCubugu>
                )}
              </div>
            );
          })}
          {ic && (
            <EkleCubugu>
              <EkleDugmesi metin={t("baslikEkle")} onClick={() => ac({ tur: "baslikEkle", sonra: plan.basliklar.at(-1)?.id })} />
            </EkleCubugu>
          )}
        </section>
      )}

      {(takipler.length > 0 || op) && (
        <section>
          <h2 className="yesil">{c("takipler")}</h2>
          {takipler.map((g, i) => gelismeSatiri(g, i, takipler))}
          {op && (
            <EkleCubugu>
              <EkleDugmesi metin={t("takipEkle")} onClick={() => ac({ tur: "gelisme", sonra: takipler.at(-1)?.id })} />
            </EkleCubugu>
          )}
        </section>
      )}
    </article>
  );
}

function PaketBaglantisi({ id }: { id: string }) {
  const { t } = useDil();
  return (
    <a className="dugme dugme-sade dugme-ikon" href={`#/paketler/${id}`} title={t("paketiAc")} aria-label={t("paketiAc")}>
      <ExternalLink size={15} />
    </a>
  );
}

/* --- Pencereler: seçimler bugünkü formlarla --- */

function EkipUyesi({ ben, plan, kisiId, kapat }: { ben: Kisi; plan: NextDayPlan; kisiId: string; kapat: () => void }) {
  const { t } = useDil();
  const e = plan.ekip.find((x) => x.kisiId === kisiId);
  if (!e) return null;
  const grup = plan.ekip.filter((x) => x.gorev === e.gorev);
  const sira = grup.findIndex((x) => x.kisiId === kisiId);
  return (
    <div className="form">
      <div className="satir">
        <label>
          {t("gorev")}
          <select value={e.gorev} onChange={(x) => ekipGuncelle(ben, plan.id, kisiId, { gorev: x.target.value as EkipGorevi })}>
            {EKIP_GOREVLERI.map((x) => (
              <option key={x} value={x}>
                {t(EKIP_GOREV_ADI[x])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("vardiyaGmt")}
          <input type="time" value={e.vardiya} onChange={(x) => ekipGuncelle(ben, plan.id, kisiId, { vardiya: x.target.value })} />
        </label>
      </div>
      <SatirSeridi
        yukari={sira > 0 ? () => ekipTasi(ben, plan.id, kisiId, -1) : undefined}
        asagi={sira < grup.length - 1 ? () => ekipTasi(ben, plan.id, kisiId, 1) : undefined}
        onceki={e.onceki ? () => oncekiOnayla(ben, plan.id, { ekip: kisiId }) : undefined}
        cikar={onayla(t("silinsinMi"), () => ekipCikar(ben, plan.id, kisiId) && kapat())}
      />
    </div>
  );
}

function MuhabirAyari({ ben, plan, pbId, kisiId, kapat }: { ben: Kisi; plan: NextDayPlan; pbId: string; kisiId: string; kapat: () => void }) {
  const { t } = useDil();
  const m = plan.basliklar.find((b) => b.id === pbId)?.muhabirler.find((x) => x.kisiId === kisiId);
  const [f, setF] = useState({ saat: m?.saat ?? "", yer: m?.yer ?? "" });
  if (!m) return null;
  return (
    <div className="form">
      <div className="satir">
        <label>
          {t("canliSaati")}
          <input type="time" value={f.saat} onChange={(e) => setF({ ...f, saat: e.target.value })} />
        </label>
        <label>
          {t("yer")}
          <input {...icerikAlani} value={f.yer} onChange={(e) => setF({ ...f, yer: e.target.value })} placeholder={metin("yerIpucu", "ar")} />
        </label>
      </div>
      <FormAlt kapat={kapat} kaydet={() => planMuhabirGuncelle(ben, plan.id, pbId, kisiId, { saat: f.saat || undefined, yer: f.yer.trim() || undefined }) && kapat()} />
    </div>
  );
}

function HareketEkle({ plan, kapat }: { plan: NextDayPlan; kapat: () => void }) {
  const { t } = useDil();
  const [secim, setSecim] = useState<"yeni" | "mevcut">("yeni");
  return (
    <>
      <div className="sekmeler" role="tablist">
        <button role="tab" aria-selected={secim === "yeni"} className={secim === "yeni" ? "acik" : ""} onClick={() => setSecim("yeni")}>
          {t("yeniHareket")}
        </button>
        <button role="tab" aria-selected={secim === "mevcut"} className={secim === "mevcut" ? "acik" : ""} onClick={() => setSecim("mevcut")}>
          {t("kayitliHareketEkle")}
        </button>
      </div>
      {secim === "yeni" ? <GorevlendirmeFormu plan={plan} kapat={kapat} /> : <KayitliHareketSecici plan={plan} kapat={kapat} />}
    </>
  );
}

function NdPencereIcerik({ ben, plan, p, kapat }: { ben: Kisi; plan: NextDayPlan; p: NdPencere; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const pencere = (baslik: ReactNode, govde: ReactNode) => (
    <Pencere baslik={baslik} kapat={kapat}>
      {govde}
    </Pencere>
  );
  switch (p.tur) {
    case "ekipEkle":
      return pencere(t("ekibeEkle"), <EkipEkleFormu plan={plan} gorev={p.gorev} kapat={kapat} />);
    case "ekipUye":
      return pencere(kisiAr(kisiBul(v, p.kisiId)) || t("calismaEkibi"), <EkipUyesi ben={ben} plan={plan} kisiId={p.kisiId} kapat={kapat} />);
    case "hareketEkle":
      return pencere(t("muhabirHareketleri"), <HareketEkle plan={plan} kapat={kapat} />);
    case "canli":
      return pencere(t(p.mevcut ? "duzenle" : "canliEkle"), <CanliFormu plan={plan} planBaslikId={p.mevcut?.planBaslikId} mevcut={p.mevcut} kapat={kapat} />);
    case "hazirSec":
      return pencere(t("stoktanSec"), <StoktanSecici plan={plan} d={v} kapat={kapat} />);
    case "baslikEkle":
      return pencere(t("baslikEkle"), <BaslikEkleFormu plan={plan} sonra={p.sonra} kapat={kapat} />);
    case "gelisme":
      return pencere(t(p.mevcut ? "duzenle" : p.planBaslikId ? "gelismeEkle" : "takipEkle"), <GelismeFormu plan={plan} planBaslikId={p.planBaslikId} mevcut={p.mevcut} sonra={p.sonra} kapat={kapat} />);
    case "muhabirEkle":
      return pencere(
        t("muhabirAta"),
        <div className="form">
          <MuhabirSecici deger="" degistir={(id) => id && planMuhabir(ben, plan.id, p.pbId, id, true, p.sonra) && kapat()} />
        </div>,
      );
    case "muhabir":
      return pencere(kisiAr(kisiBul(v, p.kisiId)), <MuhabirAyari ben={ben} plan={plan} pbId={p.pbId} kisiId={p.kisiId} kapat={kapat} />);
    case "paket":
      return pencere(t(p.mevcut ? "duzenle" : "paketOnerisiEkle"), <PaketFormu plan={plan} planBaslikId={p.pbId} mevcut={p.mevcut} sonra={p.sonra} kapat={kapat} />);
  }
}

/**
 * Belge sayfası: planı çıktının üzerinde düzenleme. Ekranda düzenlenen
 * kopya, baskıda temiz kopya; kopyala ve Word de temiz kopyadan.
 */
export default function NextDayBelge({ ben, plan }: { ben: Kisi; plan: NextDayPlan }) {
  const { t } = useDil();
  const icerik = planIcerikDuzenler(ben, plan);
  const operasyon = planOperasyonDuzenler(ben, plan);
  const [pencere, setPencere] = useState<NdPencere | null>(null);
  const temiz = useRef<HTMLElement>(null);
  const duzen = icerik || operasyon ? { ben, icerik, operasyon, ac: setPencere } : undefined;

  return (
    <>
      <CiktiAraclari
        geri={{ href: `#/nextday/${plan.id}`, metin: t("planaDon") }}
        belge={temiz}
        word={{ ad: `nextday-plan-${plan.tarih}.doc`, baslik: `${c("ciktiBaslik")} ${ciktiTarihi(plan.tarih, "ar")}` }}
        ek={
          <a className="dugme dugme-ikincil" href={`#/nextday/${plan.id}/cikti`}>
            <Printer size={16} /> {t("ciktiOnizleme")}
          </a>
        }
      />
      <div className="cikti-sarici belge-duzen yazdirma-gizle">
        <NextDayBelgesi plan={plan} duzen={duzen} />
      </div>
      <div className="cikti-sarici belge-temiz" aria-hidden="true">
        <NextDayBelgesi plan={plan} belgeRef={temiz} />
      </div>
      {pencere && duzen && <NdPencereIcerik ben={ben} plan={plan} p={pencere} kapat={() => setPencere(null)} />}
    </>
  );
}

