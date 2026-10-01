import { CalendarDays, Copy, FilePlus2, Printer, X } from "lucide-react";
import { useState } from "react";
import { Bos, Kart, NotKutu, Rozet, bildir } from "../../bilesenler/Parcalar";
import { tarihYaz, useDil } from "../../dil";
import { planOlustur } from "../../eylemler";
import { HAREKET_TURU_ADI, PLAN_DURUM_ADI, PLAN_DURUM_TONU } from "../../etiketler";
import { bugun, gunEkle } from "../../tarih";
import { baslikBul, kisiBul, useVeri, type Gorevlendirme, type Kisi, type NextDayPlan } from "../../veri";
import { yapabilir } from "../../yetki";
import { git } from "../../yol";
import { SayfaBasi } from "../ana/Planlama";

/**
 * Next Day plan listesi ve yeni plan.
 *
 * İlk taslak promptunun 4.1 maddesi: tarih varsayılan olarak yarın ve
 * değiştirilebilir; önceki plan kopyalanırken hangi bölümün taşınacağı
 * seçiliyor. Geçmiş gelişmeler ve eski paket önerileri hiç taşınmıyor,
 * süresi geçmiş canlı yayınlar ve bitmiş muhabir hareketleri listede
 * görünüyor ama seçilemiyor. Kaynak plan olduğu gibi kalıyor.
 */
export default function NextDayListe({ ben, yeni }: { ben: Kisi; yeni: boolean }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [form, setForm] = useState(yeni);
  const planlar = [...v.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih));
  const olusturabilir = yapabilir(ben, "planDuzenle");

  return (
    <>
      <SayfaBasi
        ikon={<CalendarDays size={26} />}
        baslik={t("nextdayPlanlari")}
        alt={t("nextdayAlt")}
        sagUc={
          olusturabilir && !form ? (
            <button className="dugme" onClick={() => setForm(true)}>
              <FilePlus2 size={16} /> {t("yeniNextday")}
            </button>
          ) : undefined
        }
      />
      {form && olusturabilir && <YeniPlan ben={ben} planlar={planlar} kapat={() => (yeni ? git("nextday") : setForm(false))} />}
      <Kart baslik={t("planlar")} ikon={<CalendarDays size={18} />}>
        {planlar.length === 0 ? (
          <Bos metin={t("planYok")} />
        ) : (
          <div className="tablo-sar">
            <table className="tablo">
              <thead>
                <tr>
                  <th>{t("tarih")}</th>
                  <th>{t("durum")}</th>
                  <th>{t("basliklar")}</th>
                  <th>{t("paketOnerileri")}</th>
                  <th>{t("ekip")}</th>
                  <th>{t("kopyaKaynagi")}</th>
                  <th className="dar" />
                </tr>
              </thead>
              <tbody>
                {planlar.map((p) => {
                  const kaynak = v.planlar.find((x) => x.id === p.kopyaKaynagi);
                  return (
                    <tr key={p.id} className="tiklanir" onClick={() => git(`nextday/${p.id}`)}>
                      <td>
                        <a className="kalin" href={`#/nextday/${p.id}`} onClick={(e) => e.stopPropagation()}>
                          {tarihYaz(p.tarih, dil, "tam")}
                        </a>
                        {p.tarih === gunEkle(bugun(), 1) && (
                          <>
                            {" "}
                            <Rozet ton="vurgu">{t("yarin")}</Rozet>
                          </>
                        )}
                        {p.tarih === bugun() && (
                          <>
                            {" "}
                            <Rozet ton="iyi">{t("bugun")}</Rozet>
                          </>
                        )}
                      </td>
                      <td>
                        <Rozet ton={PLAN_DURUM_TONU[p.durum]}>{t(PLAN_DURUM_ADI[p.durum])}</Rozet>
                      </td>
                      <td>{p.basliklar.length}</td>
                      <td>{v.paketler.filter((x) => x.planId === p.id && x.durum !== "iptal").length}</td>
                      <td>{p.ekip.length}</td>
                      <td className="sonuk">{kaynak ? tarihYaz(kaynak.tarih, dil, "kisa") : "—"}</td>
                      <td className="dar">
                        <a className="dugme dugme-sade dugme-kucuk" href={`#/nextday/${p.id}/cikti`} onClick={(e) => e.stopPropagation()} title={t("ciktiOnizleme")}>
                          <Printer size={15} /> {t("cikti")}
                        </a>
                      </td>
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

function YeniPlan({ ben, planlar, kapat }: { ben: Kisi; planlar: NextDayPlan[]; kapat: () => void }) {
  const { t, y, dil } = useDil();
  const v = useVeri();
  const [tarih, setTarih] = useState(gunEkle(bugun(), 1));
  const oncekiler = planlar.filter((p) => p.tarih < tarih);
  const [kopyala, setKopyala] = useState(oncekiler.length > 0);
  const [kaynakId, setKaynakId] = useState(oncekiler[0]?.id ?? "");
  const kaynak = planlar.find((p) => p.id === kaynakId) ?? oncekiler[0];
  const var_ = planlar.find((p) => p.tarih === tarih);

  /* Seçim kümeleri kaynak değişince yeniden kuruluyor: varsayılan olarak taşınabilen her şey seçili. */
  const devamEden = (kaynak?.gorevlendirmeler ?? []).map((id) => v.gorevlendirmeler.find((g) => g.id === id)).filter((g): g is Gorevlendirme => !!g);
  const canlilar = v.canliYayinlar.filter((c) => c.planId === kaynak?.id);
  const [secim, setSecim] = useState<{ kaynak?: string; ekip: boolean; gorev: Set<string>; baslik: Set<string>; muhabir: boolean; canli: Set<string> }>({ ekip: true, gorev: new Set(), baslik: new Set(), muhabir: true, canli: new Set() });
  if (kaynak && secim.kaynak !== kaynak.id) {
    setSecim({
      kaynak: kaynak.id,
      ekip: true,
      gorev: new Set(devamEden.filter((g) => g.bitis >= tarih).map((g) => g.id)),
      baslik: new Set(kaynak.basliklar.map((b) => b.id)),
      muhabir: true,
      canli: new Set(canlilar.filter((c) => c.tarih >= tarih).map((c) => c.id)),
    });
  }
  const degistir = (k: "gorev" | "baslik" | "canli", id: string) =>
    setSecim((s) => {
      const yeni = new Set(s[k]);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return { ...s, [k]: yeni };
    });

  const olustur = () => {
    if (var_) {
      git(`nextday/${var_.id}`);
      return;
    }
    const r = planOlustur(
      ben,
      tarih,
      kopyala && kaynak
        ? {
            kaynakId: kaynak.id,
            ekip: secim.ekip,
            gorevlendirmeler: [...secim.gorev],
            basliklar: [...secim.baslik],
            muhabirleriTasi: secim.muhabir,
            canliYayinlar: [...secim.canli],
          }
        : undefined,
    );
    if (r) {
      bildir(t(kopyala ? "bPlanKopyalandi" : "bPlanOlusturuldu"));
      git(`nextday/${r.id}`);
    }
  };

  return (
    <Kart
      baslik={t("yeniNextday")}
      ikon={<FilePlus2 size={18} />}
      sagUc={
        <button className="dugme dugme-sade dugme-ikon" onClick={kapat} aria-label={t("kapat")}>
          <X size={16} />
        </button>
      }
    >
      <div className="form">
        <div className="satir">
          <label>
            {t("planTarihi")}
            <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value || gunEkle(bugun(), 1))} />
          </label>
          <label>
            {t("baslangic")}
            <select value={kopyala ? "kopya" : "bos"} onChange={(e) => setKopyala(e.target.value === "kopya")} disabled={!oncekiler.length}>
              <option value="bos">{t("bosPlan")}</option>
              <option value="kopya">{t("oncekiPlaniKopyala")}</option>
            </select>
          </label>
          {kopyala && (
            <label>
              {t("kaynakPlan")}
              <select value={kaynak?.id ?? ""} onChange={(e) => setKaynakId(e.target.value)}>
                {oncekiler.map((p) => (
                  <option key={p.id} value={p.id}>
                    {tarihYaz(p.tarih, dil, "tam")}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {var_ && (
          <NotKutu ton="uyari">
            {t("buTarihPlanVar", { tarih: tarihYaz(tarih, dil, "uzun") })}
          </NotKutu>
        )}

        {kopyala && kaynak && !var_ && (
          <div className="form-kutu form">
            <b>
              <Copy size={14} /> {t("tasinacaklar")}
            </b>
            <label className="secim">
              <input type="checkbox" checked={secim.ekip} onChange={(e) => setSecim((s) => ({ ...s, ekip: e.target.checked }))} />
              {t("calismaEkibi")} ({kaynak.ekip.length})
            </label>

            <div className="alan-etiket">{t("devamEdenHareketler")}</div>
            {devamEden.length === 0 && <span className="bos-kucuk">{t("kayitYok")}</span>}
            {devamEden.map((g) => {
              const bitti = g.bitis < tarih;
              const k = kisiBul(v, g.kisiId);
              return (
                <label key={g.id} className="secim">
                  <input type="checkbox" disabled={bitti} checked={!bitti && secim.gorev.has(g.id)} onChange={() => degistir("gorev", g.id)} />
                  {y(g.yer)} / {k ? y(k.ad) : ""} · {t(HAREKET_TURU_ADI[g.tur])} ({tarihYaz(g.baslangic, dil, "kisa")} – {tarihYaz(g.bitis, dil, "kisa")})
                  {bitti && <Rozet>{t("suresiDoldu")}</Rozet>}
                </label>
              );
            })}

            <div className="alan-etiket">{t("tekrarKullanilacakBasliklar")}</div>
            {kaynak.basliklar.map((b) => (
              <label key={b.id} className="secim">
                <input type="checkbox" checked={secim.baslik.has(b.id)} onChange={() => degistir("baslik", b.id)} />
                {y(baslikBul(v, b.baslikId)?.ad ?? "")}
              </label>
            ))}
            <label className="secim">
              <input type="checkbox" checked={secim.muhabir} onChange={(e) => setSecim((s) => ({ ...s, muhabir: e.target.checked }))} />
              {t("muhabirAtamalariniTasi")}
            </label>

            <div className="alan-etiket">{t("canliYayinlar")}</div>
            {canlilar.length === 0 && <span className="bos-kucuk">{t("kayitYok")}</span>}
            {canlilar.map((c) => {
              const gecti = c.tarih < tarih;
              return (
                <label key={c.id} className="secim">
                  <input type="checkbox" disabled={gecti} checked={!gecti && secim.canli.has(c.id)} onChange={() => degistir("canli", c.id)} />
                  {y(c.yer)} / {y(c.konu)} · {tarihYaz(c.tarih, dil, "kisa")} {c.saatGmt ? `${c.saatGmt} GMT` : "TBC"}
                  {gecti && <Rozet>{t("suresiDoldu")}</Rozet>}
                </label>
              );
            })}

            <NotKutu>{t("kopyaKurali")}</NotKutu>
          </div>
        )}

        <div className="form-alt">
          <button className="dugme dugme-ikincil" onClick={kapat}>
            {t("iptal")}
          </button>
          <button className="dugme" onClick={olustur}>
            {var_ ? t("planiAc") : kopyala ? t("kopyalaOlustur") : t("olustur")}
          </button>
        </div>
      </div>
    </Kart>
  );
}
