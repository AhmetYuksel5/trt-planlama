import { Check, Newspaper, Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { Bos, Icerik, Kart, Rozet, icerikAlani } from "../bilesenler/Parcalar";
import { metin, tarihYaz, useDil } from "../dil";
import { baslikDuzenle, baslikEkle } from "../eylemler";
import { ulkeAdi } from "../etiketler";
import { ULKELER, useVeri, type Kisi, type Ulke } from "../veri";
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
                          <Icerik blok>{b.ad}</Icerik>
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
