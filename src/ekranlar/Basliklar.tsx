import { ArrowLeft, Check, Newspaper, Pencil, Pin, PinOff, Plus, X } from "lucide-react";
import { useState } from "react";
import { Bos, Icerik, Kart, Rozet, icerikAlani } from "../bilesenler/Parcalar";
import { metin, tarihYaz, useDil } from "../dil";
import { baslikDuzenle, baslikEkle, kisayollariKaydet } from "../eylemler";
import { PAKET_DURUM_ADI, PLAN_DURUM_ADI, PLAN_DURUM_TONU, kisiAr, ulkeAdi } from "../etiketler";
import { kalemAdi } from "../haftalik";
import { KISAYOL_EN_COK, kisininKisayollari } from "../kisayol";
import { ULKELER, baslikBul, kisiBul, useVeri, type Kisi, type Ulke } from "../veri";
import { yapabilir } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";

/**
 * Merkezi haber başlıkları havuzu (promptun 4.4 maddesi).
 *
 * Başlık bir kez açılıyor, her gün yeniden kullanılıyor; günlük plan yalnız
 * seçtiği başlıkları gösteriyor. Pasif başlık havuzdan silinmiyor (eski
 * planlar ona bağlı), yalnız seçim listesinden çıkıyor.
 */
export default function Basliklar({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const yonetir = yapabilir(ben, "baslikYonet");
  const [yeni, setYeni] = useState({ ad: "", ulke: "" as Ulke | "" });
  const [duzen, setDuzen] = useState<{ id: string; ad: string; ulke: Ulke | "" } | null>(null);
  const kullanim = (id: string) => v.planlar.filter((p) => p.basliklar.some((b) => b.baslikId === id));
  const sirali = [...v.basliklar].sort((a, b) => Number(b.aktif) - Number(a.aktif) || kullanim(b.id).length - kullanim(a.id).length);

  return (
    <>
      <SayfaBasi ikon={<Newspaper size={26} />} baslik={t("mBasliklar")} />
      {yonetir && (
        <Kart baslik={t("yeniBaslik")}>
          <div className="form">
            <div className="satir">
              <label>
                {t("baslikAdi")}
                <input {...icerikAlani} value={yeni.ad} onChange={(e) => setYeni({ ...yeni, ad: e.target.value })} placeholder={metin("yeniBaslikIpucu", "ar")} />
              </label>
              <label>
                {t("ulke")} <span className="ipucu">{t("varsa")}</span>
                <select value={yeni.ulke} onChange={(e) => setYeni({ ...yeni, ulke: e.target.value as Ulke | "" })}>
                  <option value="">—</option>
                  {ULKELER.map((u) => (
                    <option key={u} value={u}>
                      {t(ulkeAdi(u))}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-alt">
              <button
                className="dugme"
                disabled={!yeni.ad.trim()}
                onClick={() => {
                  baslikEkle(ben, yeni.ad, yeni.ulke || undefined);
                  setYeni({ ad: "", ulke: "" });
                }}
              >
                <Plus size={16} /> {t("havuzaEkle")}
              </button>
            </div>
          </div>
        </Kart>
      )}
      <Kart baslik={t("baslikHavuzu")} ek={String(v.basliklar.length)}>
        {sirali.length === 0 ? (
          <Bos metin={t("kayitYok")} />
        ) : (
          <div className="tablo-sar">
            <table className="tablo kartli">
              <thead>
                <tr>
                  <th className="icerik-sutun">{t("baslikAdi")}</th>
                  <th>{t("ulke")}</th>
                  <th>{t("kullanim")}</th>
                  <th>{t("sonKullanim")}</th>
                  <th>{t("durum")}</th>
                  <th className="dar" />
                  {yonetir && <th className="dar" />}
                </tr>
              </thead>
              <tbody>
                {sirali.map((b) => {
                  const planlar = kullanim(b.id).sort((a, c) => c.tarih.localeCompare(a.tarih));
                  const duzenleniyor = duzen?.id === b.id;
                  return (
                    <tr key={b.id}>
                      <td className="kalin birincil icerik-sutun">
                        {duzenleniyor ? (
                          <input className="girdi" {...icerikAlani} value={duzen.ad} onChange={(e) => setDuzen({ ...duzen, ad: e.target.value })} autoFocus />
                        ) : (
                          <a href={`#/basliklar/${b.id}`} data-baslik-bag={b.id}>
                            <Icerik blok>{b.ad}</Icerik>
                          </a>
                        )}
                      </td>
                      <td data-etiket={t("ulke")}>
                        {duzenleniyor ? (
                          <select className="girdi" value={duzen.ulke} onChange={(e) => setDuzen({ ...duzen, ulke: e.target.value as Ulke | "" })}>
                            <option value="">—</option>
                            {ULKELER.map((u) => (
                              <option key={u} value={u}>
                                {t(ulkeAdi(u))}
                              </option>
                            ))}
                          </select>
                        ) : b.ulke ? (
                          t(ulkeAdi(b.ulke))
                        ) : (
                          "—"
                        )}
                      </td>
                      <td data-etiket={t("kullanim")}>{t("planSayisi", { n: planlar.length })}</td>
                      <td className="sonuk" data-etiket={t("sonKullanim")}>{planlar[0] ? <a href={`#/nextday/${planlar[0].id}`}>{tarihYaz(planlar[0].tarih, dil, "kisa")}</a> : "—"}</td>
                      <td data-etiket={t("durum")}>
                        {yonetir ? (
                          <label className="secim">
                            <input type="checkbox" checked={b.aktif} onChange={(e) => baslikDuzenle(ben, b.id, { aktif: e.target.checked })} />
                            <Rozet ton={b.aktif ? "iyi" : ""}>{t(b.aktif ? "aktif" : "pasif")}</Rozet>
                          </label>
                        ) : (
                          <Rozet ton={b.aktif ? "iyi" : ""}>{t(b.aktif ? "aktif" : "pasif")}</Rozet>
                        )}
                      </td>
                      <td className="dar eylem">
                        <BaslikKisayolu ben={ben} baslikId={b.id} />
                      </td>
                      {yonetir && (
                        <td className="dar eylem">
                          {duzenleniyor ? (
                            <span className="dugmeler">
                              <button
                                className="dugme dugme-sade dugme-ikon"
                                aria-label={t("kaydet")}
                                onClick={() => {
                                  baslikDuzenle(ben, b.id, { ad: duzen.ad, ulke: duzen.ulke || undefined });
                                  setDuzen(null);
                                }}
                              >
                                <Check size={15} />
                              </button>
                              <button className="dugme dugme-sade dugme-ikon" aria-label={t("iptal")} onClick={() => setDuzen(null)}>
                                <X size={15} />
                              </button>
                            </span>
                          ) : (
                            <button className="dugme dugme-sade dugme-ikon" aria-label={t("duzenle")} onClick={() => setDuzen({ id: b.id, ad: b.ad, ulke: b.ulke ?? "" })}>
                              <Pencil size={15} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Kart>
    </>
  );
}

/**
 * Sabit başlığı kişinin kısayollarına sabitlemek: başlığı çalışan (bir
 * dosyayı izleyen muhabir masası, editör) ona üst çubuktan tek tıkla
 * ulaşsın. Kısayol başlığın sayfası (`basliklar/<id>`); kişinin öbür
 * kısayollarıyla aynı listede ve aynı sınırda.
 */
export function BaslikKisayolu({ ben, baslikId, yazili = false }: { ben: Kisi; baslikId: string; yazili?: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const kimlik = `basliklar/${baslikId}`;
  const liste = kisininKisayollari(v, ben);
  const var_ = liste.includes(kimlik);
  const dolu = !var_ && liste.length >= KISAYOL_EN_COK;
  const ad = t(dolu ? "kisayolSiniri" : var_ ? "kisayoldanCikar" : "kisayolaEkle", { n: KISAYOL_EN_COK });
  return (
    <button
      type="button"
      className={`dugme ${yazili ? "dugme-ikincil" : "dugme-sade dugme-ikon"}${dolu ? " pasif" : ""}${var_ ? " secili" : ""}`}
      aria-disabled={dolu}
      aria-pressed={var_}
      title={ad}
      aria-label={ad}
      onClick={() => !dolu && kisayollariKaydet(ben, var_ ? liste.filter((k) => k !== kimlik) : [...liste, kimlik])}
      data-baslik-kisayol={baslikId}
    >
      {var_ ? <PinOff size={15} /> : <Pin size={15} />}
      {yazili && ` ${ad}`}
    </button>
  );
}

/**
 * Bir başlığın sayfası: kısayolun açtığı yer. Başlığı çalışanın aradığı
 * her şey tek yerde: son Next Day planlarındaki gelişmeler, muhabirler ve
 * paketler, haftalık plandaki kalemler. Düzenleme planların kendisinde.
 */
export function BaslikSayfasi({ ben, id }: { ben: Kisi; id: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const b = baslikBul(v, id);
  if (!b) return <Bos metin={t("kayitYok")} />;
  const planlar = v.planlar
    .filter((p) => p.basliklar.some((x) => x.baslikId === id))
    .sort((x, y) => y.tarih.localeCompare(x.tarih))
    .slice(0, 7);
  const kalemler = v.haftalik
    .flatMap((h) => h.kalemler.filter((k) => k.baslikId === id).map((k) => ({ h, k })))
    .sort((x, y) => y.h.baslangic.localeCompare(x.h.baslangic))
    .slice(0, 10);
  return (
    <>
      <a className="geri-bag" href="#/basliklar">
        <ArrowLeft size={14} className="yon" /> {t("mBasliklar")}
      </a>
      <header className="sayfa-basi">
        <span className="ikon-kutu">
          <Newspaper size={26} />
        </span>
        <div>
          <h1>
            <Icerik>{b.ad}</Icerik>
          </h1>
          <p>
            <Rozet ton={b.aktif ? "iyi" : ""}>{t(b.aktif ? "aktif" : "pasif")}</Rozet> {b.ulke ? t(ulkeAdi(b.ulke)) : ""}
          </p>
        </div>
        <div className="sag-uc">
          <BaslikKisayolu ben={ben} baslikId={id} yazili />
        </div>
      </header>
      <Kart baslik={t("nextday")} ek={String(planlar.length)}>
        {planlar.length === 0 ? (
          <Bos kucuk metin={t("kayitYok")} />
        ) : (
          <div className="baslik-gunleri">
            {planlar.map((p) => {
              const pb = p.basliklar.find((x) => x.baslikId === id)!;
              const gelismeler = v.gelismeler.filter((g) => g.planBaslikId === pb.id);
              const paketler = v.paketler.filter((x) => x.planBaslikId === pb.id && x.durum !== "iptal");
              return (
                <section key={p.id} className="baslik-gunu" data-baslik-gunu={p.id}>
                  <h3>
                    <a href={`#/nextday/${p.id}`}>{tarihYaz(p.tarih, dil, "tam")}</a> <Rozet ton={PLAN_DURUM_TONU[p.durum]}>{t(PLAN_DURUM_ADI[p.durum])}</Rozet>
                  </h3>
                  {gelismeler.map((g) => (
                    <Icerik key={g.id} blok>
                      {g.yer ? `${g.yer} / ${g.metin}` : g.metin}
                    </Icerik>
                  ))}
                  {pb.muhabirler.length > 0 && (
                    <p className="sonuk">
                      {t("muhabirler")}:{" "}
                      <Icerik>{pb.muhabirler.map((m) => kisiAr(kisiBul(v, m.kisiId))).join("، ")}</Icerik>
                    </p>
                  )}
                  {paketler.map((x) => (
                    <p key={x.id}>
                      <a href={`#/paketler/${x.id}`}>
                        <Icerik>{x.baslik}</Icerik>
                      </a>{" "}
                      <Rozet>{t(PAKET_DURUM_ADI[x.durum])}</Rozet>
                    </p>
                  ))}
                </section>
              );
            })}
          </div>
        )}
      </Kart>
      {kalemler.length > 0 && (
        <Kart baslik={t("haftalik")} ek={String(kalemler.length)}>
          <div className="baslik-gunleri">
            {kalemler.map(({ h, k }) => (
              <p key={k.id}>
                <a href={`#/haftalik/${h.id}`}>{tarihYaz(k.tarih ?? h.baslangic, dil, "kisa")}</a> · <Icerik>{kalemAdi(k)}</Icerik>
              </p>
            ))}
          </div>
        </Kart>
      )}
    </>
  );
}
