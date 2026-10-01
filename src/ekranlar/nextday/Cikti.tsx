import { ArrowLeft, ClipboardCopy, Printer } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { NotKutu, bildir } from "../../bilesenler/Parcalar";
import { DILLER, ciktiTarihi, metin, useDil, yaz, type Anahtar, type Dil } from "../../dil";
import { EKIP_GOREV_ADI, HAREKET_TURU_ADI, sehirAdi } from "../../etiketler";
import { vardiyaYaz } from "../../tarih";
import { EKIP_GOREVLERI, baslikBul, kisiBul, useVeri, type NextDayPlan } from "../../veri";

/**
 * Planın temiz çıktısı: akşam haber toplantısına götürülen belge.
 *
 * Biçim kurumun bugünkü çıktısından (الأجندة الإخبارية): başlık gün adı ve
 * tarihle; فريق العمل, تحركات وإجازات المراسلين, مباشر, التقارير الجاهزة,
 * التقارير المتوقعة, الأحداث الإخبارية (başlık başlık: gelişmeler,
 * المراسلون, PKG), متابعات. Satırlar "YER / metin / kişi" kalıbında. Boş
 * bölüm çıktıda görünmüyor. Varsayılan dil Arapça ve sağdan sola; ekranın
 * dilinden bağımsız seçiliyor. Word/PDF dışa aktarma sonraki adım; şimdilik
 * tarayıcının yazdırma penceresi (PDF olarak kaydet dahil) kullanılıyor.
 */
export default function Cikti({ plan }: { plan: NextDayPlan }) {
  const { t } = useDil();
  const v = useVeri();
  const [cdil, setCdil] = useState<Dil>("ar");
  const belge = useRef<HTMLElement>(null);
  const c = (k: Anahtar, p?: Record<string, string | number>) => metin(k, cdil, p);
  const yz = (x: Parameters<typeof yaz>[0]) => yaz(x, cdil);
  const kisiAdi = (id?: string) => yz(kisiBul(v, id)?.ad ?? "");
  const sehir = (id?: string) => {
    const k = kisiBul(v, id);
    return k ? c(sehirAdi(k.sehir)) : "";
  };

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
        <label className="alan-etiket satir-ici-etiket">
          {t("ciktiDili")}
          <select className="girdi" value={cdil} onChange={(e) => setCdil(e.target.value as Dil)}>
            {DILLER.map((d) => (
              <option key={d} value={d}>
                {metin("dilAdi", d)}
              </option>
            ))}
          </select>
        </label>
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
        <article className="cikti" ref={belge} dir={cdil === "ar" ? "rtl" : "ltr"} lang={cdil}>
          <h1>
            {c("ciktiBaslik")} {ciktiTarihi(plan.tarih, cdil)}
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
                <Satir key={g.id} yer={yz(g.yer)}>
                  {kisiAdi(g.kisiId)} · {c(HAREKET_TURU_ADI[g.tur])}
                  {yz(g.aciklama) ? ` · ${yz(g.aciklama)}` : ""}
                </Satir>
              ))}
            </section>
          )}

          {canlilar.length > 0 && (
            <section>
              <h2 className="kirmizi">{c("ciktiCanli")}</h2>
              {canlilar.map((x) => (
                <Satir key={x.id} yer={yz(x.yer)}>
                  {yz(x.konu)}
                  {yz(x.aciklama) ? ` · ${yz(x.aciklama)}` : ""} / <b>{x.saatGmt ? `${vardiyaYaz(x.saatGmt)}` : "TBC"}</b>
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
                  <Satir yer={c(sehirAdi(h.sehir))}>
                    {yz(h.baslik)} / <b>{kisiAdi(h.muhabirId)}</b>
                  </Satir>
                  <p className="cikti-aciklama">{yz(h.aciklama)}</p>
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
                <Satir key={p.id} yer={c(sehirAdi(p.sehir))}>
                  {yz(p.baslik)} / <b>{p.muhabirId ? kisiAdi(p.muhabirId) : c("atanmadi")}</b>
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
                    <h3>{yz(baslikBul(v, pb.baslikId)?.ad ?? "")}</h3>
                    {gelismeler.map((g) => (
                      <Satir key={g.id} yer={g.yer ? yz(g.yer) : g.onerenId ? sehir(g.onerenId) : undefined}>
                        {yz(g.metin)}
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
                          <Satir key={p.id} yer={c(sehirAdi(p.sehir))}>
                            {yz(p.baslik)} / <b>{p.muhabirId ? kisiAdi(p.muhabirId) : c("atanmadi")}</b>
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
                <Satir key={g.id} yer={g.yer ? yz(g.yer) : undefined}>
                  {yz(g.metin)}
                </Satir>
              ))}
            </section>
          )}
        </article>
      </div>
    </>
  );
}
