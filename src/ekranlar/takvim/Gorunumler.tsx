import { CalendarDays, CalendarRange, Plus, Tv, Users } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { Bos, Icerik, Kart, Pencere, Rozet } from "../../bilesenler/Parcalar";
import { ayAdi, kisaGunAdi, metin as dilMetni, saatYaz, tarihYaz, useDil } from "../../dil";
import { PLAN_DURUM_ADI, PLAN_DURUM_TONU } from "../../etiketler";
import { haftaGunleri, haftaSonu, kalemAdi } from "../../haftalik";
import { ayYogunlugu, gundeMi, type Olusum } from "../../takvim";
import { ayBasi, aySonu, bugun, gunEkle, haftaBasi, yerelGun } from "../../tarih";
import { useVeri, type Kisi } from "../../veri";
import { sayfaGorebilir } from "../../yetki";
import { FaaliyetKarti, FaaliyetSatiri, useBirakma, useTelefon } from "./ortak";

/*
 * Takvimin görünümleri. Hepsi aynı açılım işlevini (`acilim`) alıyor:
 * süzgeç ve arama sayfada bir kez uygulanıyor, görünümler yalnız
 * çiziyor. Hafta Cumartesi başlıyor, haftalık planla aynı.
 */

export type Gorunum = "yil" | "ay" | "hafta" | "gun" | "liste";

export interface GorunumOrtak {
  ben: Kisi;
  tarih: string;
  acilim: (bas: string, bit: string) => Olusum[];
  ac: (o: Olusum) => void;
  /** Yetkisi yoksa tanımsız: boş yere basmak form açmıyor. */
  yeni?: (gun: string) => void;
  git: (g: Gorunum, tarih: string) => void;
  surukle: boolean;
}

const gunAraligi = (bas: string, bit: string) => {
  const g: string[] = [];
  for (let x = bas; x <= bit; x = gunEkle(x, 1)) g.push(x);
  return g;
};

/* --- Yıl --- */

export function YilGorunumu({ tarih, acilim, git }: GorunumOrtak) {
  const { t, dil } = useDil();
  const telefon = useTelefon();
  const yil = tarih.slice(0, 4);
  const aylar = ayYogunlugu(acilim, yil);
  const enCok = Math.max(1, ...aylar.map((a) => a.sayi));
  const B = bugun();
  const basliklar = haftaGunleri(haftaBasi(B));
  return (
    <div className="tk-yil">
      {aylar.map((a) => {
        const ilk = haftaBasi(a.ay);
        const gunler = gunAraligi(ilk, aySonu(a.ay));
        return (
          <section key={a.ay} className={`tk-yil-ay${a.ay.slice(0, 7) === B.slice(0, 7) ? " bu-ay" : ""}`}>
            <button type="button" className="tk-yil-bas" onClick={() => git("ay", a.ay)}>
              <b>{ayAdi(a.ay, dil)}</b>
              <span>{t("nFaaliyet", { n: a.sayi })}</span>
              {a.kritik && <i className="tk-kritik-isaret" title={t("kritikVar")} aria-label={t("kritikVar")} />}
            </button>
            <div className="tk-yogunluk" aria-hidden="true">
              <i style={{ inlineSize: `${Math.round((a.sayi / enCok) * 100)}%` }} />
            </div>
            {telefon ? (
              a.ilkler.length > 0 && (
                <ul className="tk-yil-ilk">
                  {a.ilkler.map((o) => (
                    <li key={o.anahtar} className={`on-${o.f.oncelik}`}>
                      <b>{Number(o.bas.slice(8))}</b>
                      <Icerik blok>{o.f.baslik}</Icerik>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <div className="tk-mini-ay">
                {basliklar.map((g) => (
                  <span key={g} className="tk-mini-bas" aria-hidden="true">
                    {kisaGunAdi(g, dil).slice(0, 2)}
                  </span>
                ))}
                {gunler.map((g) =>
                  g < a.ay ? (
                    <span key={g} />
                  ) : (
                    <button
                      key={g}
                      type="button"
                      className={`${a.gunler.has(Number(g.slice(8))) ? "dolu" : ""}${g === B ? " bugun" : ""}`}
                      onClick={() => git("gun", g)}
                      aria-label={tarihYaz(g, dil, "tam")}
                    >
                      {Number(g.slice(8))}
                    </button>
                  ),
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/* --- Ay --- */

const GUNDE_EN_COK = 3;

export function AyGorunumu({ ben, tarih, acilim, ac, yeni, git, surukle }: GorunumOrtak) {
  const { t, dil } = useDil();
  const telefon = useTelefon();
  const birakma = useBirakma(ben);
  const [gunListesi, setGunListesi] = useState<string | null>(null);
  const [secili, setSecili] = useState(tarih);
  const ay = tarih.slice(0, 7);
  const bas = haftaBasi(ayBasi(tarih));
  const son = haftaSonu(haftaBasi(aySonu(tarih)));
  const gunler = gunAraligi(bas, son);
  const hepsi = acilim(bas, son);
  const gunun = (g: string) => hepsi.filter((o) => gundeMi(o, g));
  const B = bugun();
  /* Masaüstünde hücrenin boş yerine basmak o güne faaliyet açıyor; telefonda günü seçiyor, liste altta. */
  const hucreTik = (e: MouseEvent, g: string) => {
    if (telefon) return setSecili(g);
    const hedef = e.target as HTMLElement;
    if (yeni && (hedef === e.currentTarget || hedef.classList.contains("tk-kartlar"))) yeni(g);
  };
  const seciliGun = gunun(secili);
  return (
    <>
      <div className="tk-ay">
        <div className="tk-ay-bas" aria-hidden="true">
          {gunler.slice(0, 7).map((g) => (
            <span key={g}>{kisaGunAdi(g, dil)}</span>
          ))}
        </div>
        <div className="tk-ay-izgara">
          {gunler.map((g) => {
            const liste = gunun(g);
            const fazla = liste.length - GUNDE_EN_COK;
            const b = birakma(g);
            return (
              <div
                key={g}
                className={`tk-hucre${g.slice(0, 7) !== ay ? " disari" : ""}${g === B ? " bugun" : ""}${telefon && g === secili ? " secili" : ""} ${b.className}`}
                data-gun={g}
                onClick={(e) => hucreTik(e, g)}
                onDragOver={b.onDragOver}
                onDragLeave={b.onDragLeave}
                onDrop={b.onDrop}
              >
                <div className="tk-hucre-bas">
                  <button
                    type="button"
                    className="tk-gun-no"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (telefon) setSecili(g);
                      else git("gun", g);
                    }}
                    aria-label={`${tarihYaz(g, dil, "tam")}${liste.length ? ` · ${t("nFaaliyet", { n: liste.length })}` : ""}`}
                  >
                    {Number(g.slice(8))}
                  </button>
                  {yeni && !telefon && (
                    <button
                      type="button"
                      className="tk-hucre-ekle"
                      onClick={(e) => {
                        e.stopPropagation();
                        yeni(g);
                      }}
                      title={t("buGuneEkle")}
                      aria-label={`${t("buGuneEkle")}: ${tarihYaz(g, dil, "kisa")}`}
                    >
                      <Plus size={13} />
                    </button>
                  )}
                </div>
                {telefon ? (
                  liste.length > 0 && (
                    <span className="tk-noktalar" aria-hidden="true">
                      {liste.slice(0, GUNDE_EN_COK).map((o) => (
                        <i key={o.anahtar} className={`on-${o.f.oncelik}`} />
                      ))}
                      {liste.length > GUNDE_EN_COK && <small>+{fazla}</small>}
                    </span>
                  )
                ) : (
                  <div className="tk-kartlar">
                    {liste.slice(0, GUNDE_EN_COK).map((o) => (
                      <FaaliyetKarti key={o.anahtar} o={o} gun={g} ac={ac} surukle={surukle} />
                    ))}
                    {fazla > 0 && (
                      <button
                        type="button"
                        className="tk-fazla"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGunListesi(g);
                        }}
                      >
                        {t("fazlasi", { n: fazla })}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {telefon && (
        <Kart
          className="tk-secili-gun"
          baslik={tarihYaz(secili, dil, "tam")}
          sagUc={
            yeni && (
              <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => yeni(secili)}>
                <Plus size={14} /> {t("faaliyet")}
              </button>
            )
          }
        >
          {seciliGun.length ? (
            <ul className="tk-satirlar">
              {seciliGun.map((o) => (
                <FaaliyetSatiri key={o.anahtar} o={o} ac={ac} />
              ))}
            </ul>
          ) : (
            <Bos kucuk metin={t("faaliyetYok")} />
          )}
        </Kart>
      )}
      {gunListesi && (
        <Pencere baslik={tarihYaz(gunListesi, dil, "tam")} alt={t("nFaaliyet", { n: gunun(gunListesi).length })} kapat={() => setGunListesi(null)}>
          <ul className="tk-satirlar">
            {gunun(gunListesi).map((o) => (
              <FaaliyetSatiri
                key={o.anahtar}
                o={o}
                ac={(x) => {
                  setGunListesi(null);
                  ac(x);
                }}
              />
            ))}
          </ul>
        </Pencere>
      )}
    </>
  );
}

/* --- Hafta: önce gün boyu ve çok günlükler, sonra saatliler saat sırasıyla --- */

export function HaftaGorunumu({ ben, tarih, acilim, ac, yeni, git, surukle }: GorunumOrtak) {
  const { t, dil } = useDil();
  const birakma = useBirakma(ben);
  const bas = haftaBasi(tarih);
  const hepsi = acilim(bas, haftaSonu(bas));
  const B = bugun();
  return (
    <div className="tk-hafta">
      {haftaGunleri(bas).map((g) => {
        const liste = hepsi.filter((o) => gundeMi(o, g));
        const gunBoyu = liste.filter((o) => !o.f.saat || o.bas !== o.bit);
        const saatli = liste.filter((o) => o.f.saat && o.bas === o.bit).sort((a, b) => a.f.saat!.localeCompare(b.f.saat!));
        const b = birakma(g);
        return (
          <section key={g} className={`tk-hafta-gun${g === B ? " bugun" : ""} ${b.className}`} data-gun={g} onDragOver={b.onDragOver} onDragLeave={b.onDragLeave} onDrop={b.onDrop}>
            <header>
              <button type="button" onClick={() => git("gun", g)} aria-label={tarihYaz(g, dil, "tam")}>
                <small>{kisaGunAdi(g, dil)}</small>
                <b>{Number(g.slice(8))}</b>
              </button>
              {yeni && (
                <button type="button" className="tk-hucre-ekle" onClick={() => yeni(g)} title={t("buGuneEkle")} aria-label={`${t("buGuneEkle")}: ${tarihYaz(g, dil, "kisa")}`}>
                  <Plus size={13} />
                </button>
              )}
            </header>
            {gunBoyu.length > 0 && (
              <div className="tk-gun-boyu" aria-label={t("gunBoyu")}>
                {gunBoyu.map((o) => (
                  <FaaliyetKarti key={o.anahtar} o={o} gun={g} ac={ac} surukle={surukle} />
                ))}
              </div>
            )}
            {saatli.length > 0 && (
              <div className="tk-saatli">
                {saatli.map((o) => (
                  <FaaliyetKarti key={o.anahtar} o={o} gun={g} ac={ac} surukle={surukle} saatGoster />
                ))}
              </div>
            )}
            {!liste.length && <span className="tk-bos-gun">—</span>}
          </section>
        );
      })}
    </div>
  );
}

/* --- Gün: faaliyetler ve o günün planları --- */

export function GunGorunumu({ ben, tarih, acilim, ac, yeni }: GorunumOrtak) {
  const { t, dil } = useDil();
  const liste = acilim(tarih, tarih);
  return (
    <div className="iz">
      <Kart
        baslik={tarihYaz(tarih, dil, "tam")}
        ek={t("nFaaliyet", { n: liste.length })}
        sagUc={
          yeni && (
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => yeni(tarih)}>
              <Plus size={14} /> {t("yeniFaaliyet")}
            </button>
          )
        }
      >
        {liste.length ? (
          <ul className="tk-satirlar">
            {liste.map((o) => (
              <FaaliyetSatiri key={o.anahtar} o={o} ac={ac} />
            ))}
          </ul>
        ) : (
          <Bos kucuk metin={t("faaliyetYok")} />
        )}
      </Kart>
      {ben.birim !== "muhabir" && <GununPlanlari ben={ben} tarih={tarih} />}
    </div>
  );
}

/** O tarihin planları salt okunur: Next Day, haftalık planın o günü, özel yayın ve toplantılar. */
function GununPlanlari({ ben, tarih }: { ben: Kisi; tarih: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const nd = sayfaGorebilir(ben, "nextday") ? v.planlar.find((p) => p.tarih === tarih) : undefined;
  const hafta = sayfaGorebilir(ben, "haftalik") ? v.haftalik.find((h) => h.baslangic <= tarih && haftaSonu(h.baslangic) >= tarih) : undefined;
  const kalemler = hafta?.kalemler.filter((k) => k.tarih === tarih) ?? [];
  const ozel = sayfaGorebilir(ben, "ozel") ? v.ozel.filter((o) => o.tarih === tarih) : [];
  const toplantilar = v.toplantilar.filter((x) => yerelGun(x.zaman) === tarih);
  const bos = !nd && !hafta && !ozel.length && !toplantilar.length;
  return (
    <Kart baslik={t("buGununPlanlari")}>
      {bos ? (
        <Bos kucuk metin={t("gunPlanYok")} />
      ) : (
        <ul className="liste">
          {nd && (
            <li>
              <CalendarDays size={16} className="tk-ikon-nextday" />
              <div className="ad">
                <a href={`#/nextday/${nd.id}`}>
                  {t("nextday")} · {tarihYaz(nd.tarih, dil, "kisa")}
                </a>
                <small>
                  {t("baslikSayisi", { n: nd.basliklar.length })} · {t("gelismeSayisi", { n: v.gelismeler.filter((g) => g.planId === nd.id).length })}
                </small>
              </div>
              <Rozet ton={PLAN_DURUM_TONU[nd.durum]}>{t(PLAN_DURUM_ADI[nd.durum])}</Rozet>
            </li>
          )}
          {hafta && (
            <li>
              <CalendarRange size={16} className="tk-ikon-haftalik" />
              <div className="ad">
                <a href={`#/haftalik/${hafta.id}`}>{t("haftalik")}</a>
                <small>{t("kalemSayisi", { n: kalemler.length })}</small>
                {kalemler.length > 0 && (
                  <ul className="tk-kalemler">
                    {kalemler.map((k) => (
                      <li key={k.id}>
                        <Icerik blok>{kalemAdi(k)}</Icerik>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          )}
          {ozel.map((o) => (
            <li key={o.id}>
              <Tv size={16} className="tk-ikon-ozel" />
              <div className="ad">
                <a href="#/ozel">
                  <Icerik>{o.ad}</Icerik>
                </a>
                <small>{t("ozel")}</small>
              </div>
            </li>
          ))}
          {toplantilar.map((x) => (
            <li key={x.id}>
              <Users size={16} />
              <div className="ad">
                <b>
                  <Icerik>{x.ad}</Icerik>
                </b>
                <small>
                  {t("toplantilar")} · {saatYaz(x.zaman, dil)}
                </small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Kart>
  );
}

/* --- Liste: bugünden ileri aylara gruplu; istenirse arşiv --- */

export function ListeGorunumu({ acilim, ac }: GorunumOrtak) {
  const { t, dil } = useDil();
  const [gecmis, setGecmis] = useState(false);
  const B = bugun();
  const ileri = acilim(B, gunEkle(B, 365));
  const geri = gecmis
    ? acilim(gunEkle(B, -730), gunEkle(B, -1))
        .filter((o) => o.bit < B)
        .reverse()
    : [];
  const grupla = (liste: Olusum[]) => {
    const m = new Map<string, Olusum[]>();
    for (const o of liste) {
      const k = (o.bas < B && o.bit >= B ? B : o.bas).slice(0, 7);
      m.set(k, [...(m.get(k) ?? []), o]);
    }
    return [...m.entries()];
  };
  return (
    <div className="iz">
      {ileri.length ? (
        grupla(ileri).map(([ay, liste]) => (
          <Kart key={ay} baslik={ayAdi(ay + "-01", dil, "yil")} ek={t("nFaaliyet", { n: liste.length })}>
            <ul className="tk-satirlar">
              {liste.map((o) => (
                <FaaliyetSatiri key={o.anahtar} o={o} ac={ac} />
              ))}
            </ul>
          </Kart>
        ))
      ) : (
        <Bos metin={t("yaklasanYok")} />
      )}
      <label className="secim tk-gecmis-sec">
        <input type="checkbox" checked={gecmis} onChange={(e) => setGecmis(e.target.checked)} />
        {t("gecmisiGoster")}
      </label>
      {gecmis && (
        <Kart baslik={t("gecmisFaaliyetler")} ek={t("nFaaliyet", { n: geri.length })} className="tk-arsiv">
          {geri.length ? (
            <ul className="tk-satirlar">
              {geri.map((o) => (
                <FaaliyetSatiri key={o.anahtar} o={o} ac={ac} />
              ))}
            </ul>
          ) : (
            <Bos kucuk metin={t("faaliyetYok")} />
          )}
        </Kart>
      )}
    </div>
  );
}

/** Dönemin adı: araç çubuğundaki ‹ › arasında. */
export const donemAdi = (g: Gorunum, tarih: string, dil: Parameters<typeof dilMetni>[1]) => {
  if (g === "yil") return tarih.slice(0, 4);
  if (g === "ay") return ayAdi(tarih, dil, "yil");
  if (g === "gun") return tarihYaz(tarih, dil, "tam");
  if (g === "hafta") {
    const b = haftaBasi(tarih);
    return `${tarihYaz(b, dil, "kisa")} – ${tarihYaz(haftaSonu(b), dil, "uzun")}`;
  }
  return dilMetni("tkYaklasanlar", dil);
};
