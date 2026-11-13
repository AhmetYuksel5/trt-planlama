import { Mail, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { BirimSecenekleri, UnvanSecenekleri } from "../../bilesenler/BirimSecimi";
import { Bos, Pencere, Rozet, bildir } from "../../bilesenler/Parcalar";
import { tarihYaz, useDil, oburAd, type Anahtar } from "../../dil";
import { postaKisileriUygula, type PostaKisiKaydi } from "../../eylemler";
import { ORNEK_PLANLAMA_ADRESI } from "../../eposta";
import { GERCEK, firebaseYukle } from "../../kip";
import { DEMO_ALANI, KURUM_ALANLARI, birimGecerli, postaKisileri, type PostaKisisi } from "../../postaKisileri";
import { useVeri, type BirimId, type GorevId, type Kisi } from "../../veri";
import { birimAdi, birimeUygunUnvan, gorevAdi } from "../../yapi";
import { hesapYetkisi } from "../../yetki";

/*
 * Organizasyon › Kişiler › "Postadan kişiler" (kurallar postaKisileri.ts).
 * Kullanıcı: kişinin hangi birimde olduğunu kolayca belirleyebileyim. Bu
 * yüzden birim ve ünvan satırda seçilir, imzadan tahmin dolu gelir; birkaç
 * satır işaretlenip üstteki çubuktan aynı birim ve ünvan tek seferde verilir.
 * Hiçbir şey kendiliğinden yazılmaz, "Seçilenleri kaydet" tek yazış.
 */

type Kume = "yeni" | "eksik" | "secilecek" | "kayitli";
const KUME_ADI: Record<Kume, Anahtar> = { yeni: "pkYeni", eksik: "pkEksik", secilecek: "pkSecilecek", kayitli: "pkKayitli" };
// Seçilecekte kişi henüz seçilmedi; "" yeni kişi.
const SECILMEDI = "?";

interface Satir extends PostaKisisi {
  sec: boolean;
  /** Kayıtlı kişinin kimliği, "" yeni kişi, SECILMEDI karar bekliyor. */
  hedef: string;
  adArYazi: string;
  b: BirimId;
  g: GorevId;
}

const kumesi = (s: PostaKisisi): Kume => (s.durum === "yeni" ? "yeni" : s.durum === "belirsiz" ? "secilecek" : s.eksik.length ? "eksik" : "kayitli");

export function PostaKisileriPenceresi({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const duzenler = hesapYetkisi(ben, "kisiDuzenle");
  const ekler = hesapYetkisi(ben, "hesapsizKisi");
  const kisi = (id?: string) => (id ? v.kisiler.find((k) => k.id === id) : undefined);
  // Liste pencere açılınca bir kez kurulur: kaydedince yeniden hesaplanıp satırlar oynamasın.
  const ilk = useMemo(
    () =>
      postaKisileri(v.postaMesajlari ?? [], v.kisiler, {
        alanlar: GERCEK ? KURUM_ALANLARI : [...KURUM_ALANLARI, DEMO_ALANI],
        gruplar: [ORNEK_PLANLAMA_ADRESI],
        kurumsalYazilir: (k) => !GERCEK || !!k.hesapsiz,
      }).map((s): Satir => {
        const k = kisi(s.kisiId);
        const hedef = s.durum === "belirsiz" ? SECILMEDI : (s.kisiId ?? "");
        const b = k?.birim ?? s.birim ?? "";
        const g = k?.gorev ?? s.gorev ?? "";
        const adArYazi = s.adAr ?? "";
        const sec = s.durum === "yeni" ? !!adArYazi && birimGecerli(b, g) && ekler : s.durum !== "belirsiz" && s.eksik.length > 0 && duzenler;
        return { ...s, sec, hedef, adArYazi, b, g };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [satirlar, setSatirlar] = useState<Satir[]>(ilk);
  const sayilar = (k: Kume) => satirlar.filter((s) => kumesi(s) === k).length;
  const kumeler = (["yeni", "eksik", "secilecek", "kayitli"] as Kume[]).filter((k) => sayilar(k));
  const [kume, setKume] = useState<Kume | "hepsi">(kumeler[0] ?? "hepsi");
  const gorunen = satirlar.filter((s) => kume === "hepsi" || kumesi(s) === kume);
  const [topluB, setTopluB] = useState<BirimId>("");
  const [topluG, setTopluG] = useState<GorevId>("");

  const degistir = (adres: string, yeni: Partial<Satir>) => setSatirlar((l) => l.map((s) => (s.adres === adres ? { ...s, ...yeni } : s)));
  const birimDegistir = (s: Satir, b: BirimId) => degistir(s.adres, { b, g: b ? birimeUygunUnvan(b, s.g) : "" });
  const hedefDegistir = (s: Satir, hedef: string) => {
    const k = kisi(hedef);
    // Kayıtlı kişi seçilince onun birimi gelir; yanlışlıkla tayin olmasın.
    degistir(s.adres, { hedef, ...(k ? { b: k.birim, g: k.gorev } : { b: s.birim ?? "", g: s.gorev ?? "" }) });
  };

  /* Satır kaydedilebilir mi, kaydedilecekse ne yazılır. */
  const kayit = (s: Satir): PostaKisiKaydi | null => {
    if (s.hedef === SECILMEDI) return null;
    if (!s.hedef) {
      if (!ekler || !s.adArYazi.trim() || !birimGecerli(s.b, s.g)) return null;
      return { adres: s.adres, adAr: s.adArYazi.trim(), adLatin: s.adLatin, ...(s.telefon ? { telefon: s.telefon } : {}), birim: s.b, gorev: s.g };
    }
    const k = kisi(s.hedef);
    if (!duzenler || !k) return null;
    const tayin = (s.b !== k.birim || s.g !== k.gorev) && birimGecerli(s.b, s.g);
    const adresYok = ![k.eposta, k.kisiselEposta].some((a) => a?.toLowerCase() === s.adres);
    const telefonVar = !!s.telefon && !k.telefon?.trim();
    if (!tayin && !adresYok && !telefonVar) return null;
    return { adres: s.adres, kisiId: k.id, ...(s.telefon ? { telefon: s.telefon } : {}), birim: s.b, gorev: s.g };
  };
  const secili = satirlar.filter((s) => s.sec);
  const kaydedilecek = secili.map(kayit).filter((x): x is PostaKisiKaydi => !!x);

  const topluAta = () => {
    if (!topluB) return;
    setSatirlar((l) => l.map((s) => (s.sec ? { ...s, b: topluB, g: birimeUygunUnvan(topluB, topluG || s.g) } : s)));
  };
  const hepsiniSec = (sec: boolean) => {
    const adresler = new Set(gorunen.map((s) => s.adres));
    setSatirlar((l) => l.map((s) => (adresler.has(s.adres) ? { ...s, sec } : s)));
  };
  const kaydet = () => {
    const r = postaKisileriUygula(ben, kaydedilecek);
    if (!r) return;
    bildir([t("pkSonuc", { e: String(r.eklenen), g: String(r.guncellenen) }), r.atlanan ? t("pkAtlanan", { a: String(r.atlanan) }) : ""].filter(Boolean).join(" · "));
    kapat();
  };

  // Eşleşen adayın iki yazımı: ad arayüzün dilinde, yanında öbürü (aynı ad iki kişide olabilir).
  const ikiYazim = (k: Kisi) => [ad(k), oburAd(k.ad, dil)].filter(Boolean).join(" · ");
  const tumKisiler = [...v.kisiler].filter((k) => !k.pasif).sort((a, b) => ad(a).localeCompare(ad(b)));

  return (
    <Pencere
      baslik={t("pkBaslik")}
      kapat={kapat}
      genis
      altBilgi={
        <button type="button" className="dugme" disabled={!kaydedilecek.length} onClick={kaydet} data-pk-kaydet>
          <Save size={16} /> {t("pkKaydet", { n: String(kaydedilecek.length) })}
        </button>
      }
    >
      <div className="form" data-pk-penceresi>
        {!satirlar.length ? (
          <Bos kucuk metin={t("pkBos")} />
        ) : (
          <>
            <div className="sekmeler" role="tablist">
              {(["hepsi", ...kumeler] as const).map((k) => (
                <button key={k} type="button" role="tab" aria-selected={kume === k} className={kume === k ? "acik" : ""} onClick={() => setKume(k)} data-pk-kume={k}>
                  {k === "hepsi" ? t("hepsi") : t(KUME_ADI[k])} · {k === "hepsi" ? satirlar.length : sayilar(k)}
                </button>
              ))}
            </div>
            {/* Toplu atama: kullanıcının asıl istediği, birimi tek tek değil topluca vermek. */}
            <div className="pk-toplu" data-pk-toplu>
              <label className="pk-hepsi">
                <input type="checkbox" checked={gorunen.length > 0 && gorunen.every((s) => s.sec)} onChange={(e) => hepsiniSec(e.target.checked)} aria-label={t("pkHepsiniSec")} />
                {t("pkSecili", { n: String(secili.length) })}
              </label>
              <select value={topluB} onChange={(e) => (setTopluB(e.target.value), setTopluG(e.target.value ? birimeUygunUnvan(e.target.value, topluG) : ""))} aria-label={t("birim")} data-pk-toplu-birim>
                <option value="">{t("pkBirimSec")}</option>
                <BirimSecenekleri />
              </select>
              <select value={topluG} onChange={(e) => setTopluG(e.target.value)} disabled={!topluB} aria-label={t("orgUnvan")} data-pk-toplu-unvan>
                {topluB ? <UnvanSecenekleri birim={topluB} /> : <option value="">{t("orgUnvan")}</option>}
              </select>
              <button type="button" className="dugme dugme-ikincil dugme-kucuk" disabled={!topluB || !secili.length} onClick={topluAta} data-pk-toplu-ata>
                {t("pkTopluAta")}
              </button>
            </div>
            <div className="tablo-sar">
              <table className="tablo kartli pk-tablo">
                <thead>
                  <tr>
                    <th aria-label={t("sec")} />
                    <th>{t("ad")}</th>
                    <th>{t("pkImzada")}</th>
                    <th>{t("pkKayittaki")}</th>
                    <th>{t("birim")}</th>
                    <th>{t("orgUnvan")}</th>
                  </tr>
                </thead>
                <tbody>
                  {gorunen.map((s) => {
                    const k = kisi(s.hedef);
                    const adaylar = s.adaylar.map((id) => kisi(id)).filter((x): x is Kisi => !!x);
                    const gecerli = !!kayit(s);
                    const yeni = !s.hedef;
                    return (
                      <tr key={s.adres} data-pk-satir={s.adres} data-pk-durum={s.durum}>
                        <td data-etiket={t("sec")}>
                          <input type="checkbox" checked={s.sec} onChange={(e) => degistir(s.adres, { sec: e.target.checked })} aria-label={t("sec")} data-pk-sec />
                        </td>
                        <td className="birincil">
                          <div>
                            <b>{s.adLatin}</b>
                          </div>
                          <small className="sonuk">
                            <bdi dir="ltr">{s.adres}</bdi>
                            <br />
                            {t("pkPosta", { n: String(s.sayi), tarih: tarihYaz(s.son) })}
                          </small>
                        </td>
                        <td data-etiket={t("pkImzada")}>
                          {s.unvanMetni && <div dir="auto">{s.unvanMetni}</div>}
                          {s.telefon && (
                            <small className="sonuk">
                              <bdi dir="ltr">{s.telefon}</bdi>
                            </small>
                          )}
                          {!s.unvanMetni && !s.telefon && <span className="sonuk">—</span>}
                        </td>
                        <td data-etiket={t("pkKayittaki")}>
                          {s.durum === "kayitli" || s.durum === "eslesti" ? (
                            <bdi>{k ? ad(k) : "—"}</bdi>
                          ) : (
                            <select value={s.hedef} onChange={(e) => hedefDegistir(s, e.target.value)} data-pk-hedef>
                              {s.durum === "belirsiz" && <option value={SECILMEDI}>{t("pkKisiSec")}</option>}
                              <option value="" disabled={!ekler}>
                                {t("pkYeniKisi")}
                              </option>
                              {adaylar.length > 0 && (
                                <optgroup label={t("eslestirAdaylar")}>
                                  {adaylar.map((x) => (
                                    <option key={x.id} value={x.id}>
                                      {ikiYazim(x)}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label={t("orgKisiler")}>
                                {tumKisiler.map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {ikiYazim(x)}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          )}
                          {yeni && (
                            <input dir="rtl" lang="ar" value={s.adArYazi} onChange={(e) => degistir(s.adres, { adArYazi: e.target.value })} placeholder={t("adArapca")} aria-label={t("adArapca")} aria-invalid={!s.adArYazi.trim()} data-pk-ad-ar />
                          )}
                          {k && s.eksik.length > 0 && (
                            <small className="sonuk">{s.eksik.map((e) => t(e === "eposta" ? "pkAdresEklenecek" : "pkTelefonEklenecek")).join(" · ")}</small>
                          )}
                          {s.sec && !gecerli && (s.hedef === SECILMEDI || yeni) && (
                            <Rozet ton="uyari">{s.hedef === SECILMEDI ? t("pkKisiSec") : !s.adArYazi.trim() ? t("pkArapcaAdGerekli") : t("pkBirimSec")}</Rozet>
                          )}
                        </td>
                        <td data-etiket={t("birim")}>
                          <select value={s.b} onChange={(e) => birimDegistir(s, e.target.value)} aria-invalid={yeni && !s.b} data-pk-birim>
                            <option value="">{t("pkBirimSec")}</option>
                            <BirimSecenekleri dahil={s.b || undefined} />
                          </select>
                          {k && s.b !== k.birim && <small className="sonuk">← {birimAdi(k.birim)}</small>}
                        </td>
                        <td data-etiket={t("orgUnvan")}>
                          <select value={s.g} onChange={(e) => degistir(s.adres, { g: e.target.value })} disabled={!s.b} data-pk-unvan>
                            {s.b ? <UnvanSecenekleri birim={s.b} dahil={s.g || undefined} /> : <option value="">{t("orgUnvan")}</option>}
                          </select>
                          {k && s.g !== k.gorev && <small className="sonuk">← {gorevAdi(k.gorev)}</small>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Pencere>
  );
}

/* Kişiler sekmesinin başındaki düğme. */
export function PostaKisileriDugmesi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const [acik, setAcik] = useState(false);
  if (!hesapYetkisi(ben, "kisiDuzenle") && !hesapYetkisi(ben, "hesapsizKisi")) return null;
  return (
    <>
      <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => (GERCEK ? void firebaseYukle().then((f) => f.postaDinle()).then(() => setAcik(true)) : setAcik(true))} data-pk-ac>
        <Mail size={14} /> {t("pkBaslik")}
      </button>
      {acik && <PostaKisileriPenceresi ben={ben} kapat={() => setAcik(false)} />}
    </>
  );
}
