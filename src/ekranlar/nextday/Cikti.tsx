import { ArrowLeft, ClipboardCopy, Printer } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { NotKutu, bildir } from "../../bilesenler/Parcalar";
import { ciktiTarihi, metin, useDil, type Anahtar } from "../../dil";
import { EKIP_GOREV_ADI, HAREKET_TURU_ADI, kisiAr, sehirAr } from "../../etiketler";
import { vardiyaYaz } from "../../tarih";
import { EKIP_GOREVLERI, baslikBul, kisiBul, useVeri, type NextDayPlan } from "../../veri";

/**
 * Planın temiz çıktısı: akşam haber toplantısına götürülen belge.
 *
 * Biçim kurumun bugünkü çıktısından (الأجندة الإخبارية): başlık gün adı ve
 * tarihle; فريق العمل, تحركات وإجازات المراسلين, مباشر, التقارير الجاهزة,
 * التقارير المتوقعة, الأحداث الإخبارية (başlık başlık: gelişmeler,
 * المراسلون, PKG), متابعات. Satırlar "YER / metin / kişi" kalıbında. Boş
 * bölüm çıktıda görünmüyor. Belge her zaman Arapça ve sağdan sola: içerik
 * Arapça yazılıyor, toplantıya giden belge de o; ekranın dili yalnız
 * düğmeleri değiştiriyor. Word/PDF dışa aktarma sonraki adım; şimdilik
 * tarayıcının yazdırma penceresi (PDF olarak kaydet dahil) kullanılıyor.
 */
export default function Cikti({ plan }: { plan: NextDayPlan }) {
  const { t } = useDil();
  const v = useVeri();
  const belge = useRef<HTMLElement>(null);
  const c = (k: Anahtar, p?: Record<string, string | number>) => metin(k, "ar", p);
  const kisiAdi = (id?: string) => kisiAr(kisiBul(v, id));
  const sehir = (id?: string) => sehirAr(kisiBul(v, id)?.sehir);

  const gorevlendirmeler = plan.gorevlendirmeler.map((id) => v.gorevlendirmeler.find((g) => g.id === id)).filter((g) => g !== undefined);
  const canlilar = v.canliYayinlar.filter((x) => x.planId === plan.id).sort((a, b) => (a.tarih + a.saatGmt).localeCompare(b.tarih + b.saatGmt));
  const hazirlar = plan.hazirPaketler.map((id) => v.hazirPaketler.find((h) => h.id === id)).filter((h) => h !== undefined);
  const paketler = v.paketler.filter((p) => p.planId === plan.id && p.durum !== "iptal");
  const takipler = v.gelismeler.filter((g) => g.planId === plan.id && !g.planBaslikId);

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(belge.current?.innerText ?? "");
      bildir(t("bKopyalandi"));
    } catch {
      bildir(t("kopyalanamadi"));
    }
  };

  /* "YER / metin" satırı: yer kalın, kurumun belgesindeki gibi. */
  const Satir = ({ yer, children }: { yer?: string; children: ReactNode }) => (
    <p>
      {yer && <b>{yer} / </b>}
      {children}
    </p>
  );

  return (
    <>
      <div className="dugmeler yazdirma-gizle">
        <a className="geri-bag" href={`#/nextday/${plan.id}`}>
          <ArrowLeft size={14} className="yon" /> {t("planaDon")}
        </a>
        <span className="bosluk-esnek" />
        <button className="dugme dugme-ikincil" onClick={kopyala}>
          <ClipboardCopy size={16} /> {t("metniKopyala")}
        </button>
        <button className="dugme" onClick={() => window.print()}>
          <Printer size={16} /> {t("yazdir")}
        </button>
      </div>
      <div className="yazdirma-gizle">
        <NotKutu>{t("ciktiNotu")}</NotKutu>
      </div>

      <div className="cikti-sarici">
        <article className="cikti" ref={belge} dir="rtl" lang="ar">
          <h1>
            {c("ciktiBaslik")} {ciktiTarihi(plan.tarih, "ar")}
          </h1>

          {plan.ekip.length > 0 && (
            <section>
              <h2 className="yesil">{c("calismaEkibi")}</h2>
              {EKIP_GOREVLERI.map((g) => {
                const uyeler = plan.ekip.filter((e) => e.gorev === g);
                if (!uyeler.length) return null;
                return (
                  <p key={g}>
                    <b>{c(EKIP_GOREV_ADI[g])}: </b>
                    {uyeler.map((e) => `${kisiAdi(e.kisiId)} ${vardiyaYaz(e.vardiya)}`).join(" | ")}
                  </p>
                );
              })}
            </section>
          )}

          {gorevlendirmeler.length > 0 && (
            <section>
              <h2 className="yesil">{c("muhabirHareketleri")}</h2>
              {gorevlendirmeler.map((g) => (
                <Satir key={g.id} yer={g.yer}>
                  {kisiAdi(g.kisiId)} · {c(HAREKET_TURU_ADI[g.tur])}
                  {g.aciklama ? ` · ${g.aciklama}` : ""}
                </Satir>
              ))}
            </section>
          )}

          {canlilar.length > 0 && (
            <section>
              <h2 className="kirmizi">{c("ciktiCanli")}</h2>
              {canlilar.map((x) => (
                <Satir key={x.id} yer={x.yer}>
                  {x.konu}
                  {x.aciklama ? ` · ${x.aciklama}` : ""} / <b>{x.saatGmt ? `${vardiyaYaz(x.saatGmt)}` : "TBC"}</b>
                  {x.muhabirId ? ` / ${kisiAdi(x.muhabirId)}` : ""}
                </Satir>
              ))}
            </section>
          )}

          {hazirlar.length > 0 && (
            <section>
              <h2 className="yesil">{c("ciktiHazir")}</h2>
              {hazirlar.map((h) => (
                <div key={h.id} className="cikti-paket">
                  <Satir yer={sehirAr(h.sehir)}>
                    {h.baslik} / <b>{kisiAdi(h.muhabirId)}</b>
                  </Satir>
                  <p className="cikti-aciklama">{h.aciklama}</p>
                  <p className="cikti-slug">
                    <bdi>{h.slug}</bdi>
                  </p>
                </div>
              ))}
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

          {plan.basliklar.length > 0 && (
            <section>
              <h2 className="kirmizi ortali">{c("ciktiOlaylar")}</h2>
              {plan.basliklar.map((pb) => {
                const gelismeler = v.gelismeler.filter((g) => g.planBaslikId === pb.id);
                const pkg = paketler.filter((p) => p.planBaslikId === pb.id);
                if (!gelismeler.length && !pb.muhabirler.length && !pkg.length) return null;
                return (
                  <div key={pb.id} className="cikti-baslik">
                    <h3>{baslikBul(v, pb.baslikId)?.ad}</h3>
                    {gelismeler.map((g) => (
                      <Satir key={g.id} yer={g.yer || (g.onerenId ? sehir(g.onerenId) : undefined)}>
                        {g.metin}
                      </Satir>
                    ))}
                    {pb.muhabirler.length > 0 && (
                      <>
                        <p className="alt-baslik">{c(pb.muhabirler.length > 1 ? "ciktiMuhabirler" : "ciktiMuhabir")}</p>
                        {pb.muhabirler.map((m) => (
                          <Satir key={m.kisiId} yer={m.yer || sehir(m.kisiId)}>
                            {kisiAdi(m.kisiId)} {m.saat && <b>{vardiyaYaz(m.saat)}</b>}
                          </Satir>
                        ))}
                      </>
                    )}
                    {pkg.length > 0 && (
                      <>
                        <p className="alt-baslik">
                          <bdi>PKG</bdi>
                        </p>
                        {pkg.map((p) => (
                          <Satir key={p.id} yer={sehirAr(p.sehir)}>
                            {p.baslik} / <b>{p.muhabirId ? kisiAdi(p.muhabirId) : c("atanmadi")}</b>
                          </Satir>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {takipler.length > 0 && (
            <section>
              <h2 className="yesil">{c("takipler")}</h2>
              {takipler.map((g) => (
                <Satir key={g.id} yer={g.yer || undefined}>
                  {g.metin}
                </Satir>
              ))}
            </section>
          )}
        </article>
      </div>
    </>
  );
}
