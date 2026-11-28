import { CalendarRange, ChevronRight, Gauge, MapPin, PenLine, Radio, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { geciktiMi } from "../../akis";
import { baslikaGit } from "../../bilesenler/baslikaGit";
import { GunCizgisi } from "../../bilesenler/GunCizgisi";
import { sureYazisi } from "../../bilesenler/AsamaKutulari";
import { Icerik } from "../../bilesenler/Parcalar";
import { ayAdi, kisaGunAdi, tarihYaz, useDil, type Anahtar } from "../../dil";
import { IS_DURUM_ADI } from "../../etiketler";
import { isListesi } from "../../gorevler";
import { ayinKabulu, haftaGunleri, haftalikSeri, haftaninGorevleri, haftaOzeti, ilkMuhabirler, nabiz, ozelKartlari, paketKarariOzet, planBasliklari, uretimHatti, UZUN_BEKLEME, type BaslikOzeti } from "../../kokpit";
import { kisiBugunDurumu } from "../../muhabirIletisim";
import { OZEL_ASAMA_ADI } from "../../ozel";
import { rapor } from "../../rapor";
import { bugun, gunEkle } from "../../tarih";
import { paketGunu } from "../../bitmisPaket";
import { ASAMA_ADI, type PanoSutunu } from "../../uretim";
import { muhabirler, useVeri, type Kisi, type Paket } from "../../veri";
import { birimAdi, gorevAdi } from "../../yapi";
import { isEkleyebilir, kapsam, paketKapsamda, talimatVerebilir } from "../../yetki";
import { useAdimDurumu } from "../../yol";
import { SayfaBasi } from "../ana/Planlama";
import { PanelOnInceleme, TALIMAT_ADIMLARI, TalimatVer, birimDurumu, talimatDurumu } from "../YoneticiPaneli";

/*
 * Yönetici kokpiti (kurallar kokpit.ts). Sabit sayfa: yöneticiler sayfa
 * düzenlemez (üç asistanın ortak görüşü). Üstte kanalın nabzı ve günün
 * zaman çizgisi; ortada kullanıcının dört önceliği (planın başlıkları,
 * özel yayınlar, muhabir görevlendirmeleri, istatistikler); altta birimler,
 * üretim hattı ve haftanın göstergeleri; en altta verdikleri. Karar düğmesi
 * yok: müdahale tek "Talimat ver". Başlığa basınca ayrıntı yerinde açılır,
 * "Planda aç" planın o başlığına götürür.
 */

const aktifMi = (p: Paket) => p.durum !== "tamamlandi" && p.durum !== "iptal";

function useKapsam(ben: Kisi) {
  const v = useVeri();
  const ks = kapsam(ben)!;
  const kolda = v.paketler.filter((p) => ks.kollar.includes(p.tur));
  return { v, ks, kolda, izlenen: ks.kolaGore ? kolda : v.paketler.filter((p) => paketKapsamda(ben, p)) };
}

export default function Kokpit({ ben, ana = false }: { ben: Kisi; ana?: boolean }) {
  const { t } = useDil();
  const [talimat, setTalimat] = useState(false);
  const { v, ks, kolda } = useKapsam(ben);
  const durumlar = ks.birimler.map((b) => birimDurumu(v, b, kolda, t));
  const n = nabiz(durumlar);
  const sahada = muhabirler(v).filter((k) => kisiBugunDurumu(v, k) === "sahada").length;
  const parcalar = [
    n.geciken ? t("kpNabizGeciken", { n: n.geciken }) : "",
    n.bekleyen ? t("kpNabizBekleyen", { n: n.bekleyen }) : "",
    sahada ? t("kpNabizSahada", { n: sahada }) : "",
  ].filter(Boolean);
  const talimatVerir = talimatVerebilir(ben) || isEkleyebilir(ben);
  return (
    <div className="kokpit" data-kokpit>
      <SayfaBasi
        sekme={!ana}
        ikon={<Gauge size={26} />}
        baslik={t("kpKanal")}
        alt={`${gorevAdi(ben.gorev)} · ${t("ypKapsam", { birimler: ks.birimler.map((b) => birimAdi(b)).join(", ") })}`}
      />
      <section className={`kp-nabiz kp-${n.isik}`} data-kp-nabiz={n.isik}>
        <span className="kp-nabiz-isik" aria-hidden="true" />
        <div className="kp-nabiz-yazi">
          <b>{t(n.isik === "kotu" ? "kpNabizKotu" : n.isik === "uyari" ? "kpNabizUyari" : "kpNabizIyi")}</b>
          {parcalar.length > 0 && <span>{parcalar.join(" · ")}</span>}
        </div>
        {talimatVerir && !talimat && (
          <button type="button" className="dugme" onClick={() => setTalimat(true)} data-talimat-ac>
            <PenLine size={16} /> {t("tlVer")}
          </button>
        )}
      </section>
      {talimat && <TalimatVer ben={ben} kapat={() => setTalimat(false)} />}
      <PanelOnInceleme ben={ben} />
      <GunCizgisi />
      <div className="kp-izgara">
        <PlanBasliklariPaneli />
        <div className="kp-sutun">
          <OzelPaneli />
        </div>
      </div>
      <div className="kp-izgara">
        <GorevPaneli />
        <IstatistikPaneli />
      </div>
      <div className="kp-alt">
        <section className="kp-panel birim-kartlari" aria-label={t("birimler")} data-kp-birimler>
          <h2 className="kp-baslik">{t("birimler")}</h2>
          {durumlar.map((d) => {
            const isik = d.geciken ? "kotu" : d.bekleyen ? "uyari" : "iyi";
            const href = !ks.mudur ? "#/" : d.birim === "muhabir" ? "#/muhabirler" : `#/panel/${d.birim}`;
            return (
              <a key={d.birim} className="kp-birim" href={href} data-kp-birim={d.birim}>
                <i className={`kp-isik kp-${isik}`} aria-hidden="true" />
                <b>{birimAdi(d.birim)}</b>
                <span>{d.geciken ? t("isikGeciken", { n: d.geciken }) : d.bekleyen ? t("isikBekleyen", { n: d.bekleyen }) : t("isikYolunda")}</span>
                <ChevronRight size={14} className="yon" aria-hidden="true" />
              </a>
            );
          })}
        </section>
        <UretimPaneli ben={ben} />
        <HaftaPaneli ben={ben} />
      </div>
      <Verdiklerim ben={ben} />
    </div>
  );
}

/* --- Planın başlıkları: Bugün · Yarın · Bu hafta --- */

function PlanBasliklariPaneli() {
  const { t, dil } = useDil();
  const v = useVeri();
  const B = bugun();
  const [sekme, setSekme] = useAdimDurumu<"bugun" | "yarin" | "hafta">("kokpit:plan", "yarin");
  const gun = sekme === "bugun" ? B : gunEkle(B, 1);
  const plan = v.planlar.find((p) => p.tarih === gun);
  const basliklar = plan ? planBasliklari(v, plan) : [];
  const hafta = haftaOzeti(v, B);
  const yarinPlan = v.planlar.find((p) => p.tarih === gunEkle(B, 1));
  const SEKMELER: [typeof sekme, string][] = [
    ["bugun", t("bugun")],
    ["yarin", `${t("yarin")}${yarinPlan ? ` · ${yarinPlan.basliklar.length}` : ""}`],
    ["hafta", t("kpBuHafta")],
  ];
  return (
    <section className="kp-panel" data-kp-basliklar>
      <div className="kp-bas">
        <h2 className="kp-baslik">{t("kpBasliklar")}</h2>
        <div className="kp-sekmeler" role="tablist">
          {SEKMELER.map(([k, ad]) => (
            <button key={k} type="button" role="tab" aria-selected={sekme === k} className={sekme === k ? "acik" : ""} onClick={() => setSekme(k)} data-kp-sekme={k}>
              {ad}
            </button>
          ))}
        </div>
      </div>
      {sekme !== "hafta" ? (
        !plan ? (
          <p className="kp-bos">{t("kpPlanYok")}</p>
        ) : (
          <>
            <p className="kp-alt-satir">
              {t("nextday")} · {tarihYaz(plan.tarih, dil, "kisa")}
            </p>
            <ol className="kp-ozet">
              {basliklar.map((b, i) => (
                <BaslikSatiri key={b.pb.id} b={b} no={i + 1} planId={plan.id} />
              ))}
            </ol>
            {!basliklar.length && <p className="kp-bos">{t("kpBaslikYok")}</p>}
          </>
        )
      ) : !hafta ? (
        <p className="kp-bos">{t("kpHaftaYok")}</p>
      ) : (
        <>
          {hafta.anaDosyalar.length > 0 && (
            <>
              <h3 className="kp-alt-baslik">{t("kpAnaDosyalar")}</h3>
              <ol className="kp-ozet">
                {hafta.anaDosyalar.map((a) => (
                  <li key={a.id}>
                    <details data-kp-ana={a.id}>
                      <summary>
                        <span className="kp-no">·</span>
                        <Icerik blok>{a.ad}</Icerik>
                        <span className="kp-sayilar">{a.dosya ? t("kpKalem", { n: a.dosya.kalemler.length }) : ""}</span>
                      </summary>
                      <div className="kp-ayrinti">
                        {a.metin && <Icerik blok>{a.metin}</Icerik>}
                        <a className="kp-ac" href={`#/haftalik/${hafta.hafta.id}`}>
                          {t("kpPlandaAc")} <ChevronRight size={14} className="yon" />
                        </a>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            </>
          )}
          <h3 className="kp-alt-baslik">{t("kpDosyalar")}</h3>
          <ol className="kp-ozet">
            {hafta.dosyalar.map((x) => (
              <li key={x.baslikId}>
                <details data-kp-dosya={x.baslikId}>
                  <summary>
                    <span className="kp-no">·</span>
                    <Icerik blok>{x.ad}</Icerik>
                    <span className="kp-sayilar">
                      {t("kpKalem", { n: x.kalemler.length })}
                      {x.pkg > 0 && <> · {t("kpPkg", { n: x.pkg })}</>}
                    </span>
                  </summary>
                  <div className="kp-ayrinti">
                    {x.kalemler.slice(0, 5).map((k) => (
                      <div key={k.id} className="kp-gelisme">
                        {k.tarih && <small>{tarihYaz(k.tarih, dil, "kisa")}</small>}
                        <Icerik blok>{[k.yer, k.paketBasligi || k.metin].filter(Boolean).join(" / ")}</Icerik>
                      </div>
                    ))}
                    <a className="kp-ac" href={`#/haftalik/${hafta.hafta.id}`}>
                      {t("kpPlandaAc")} <ChevronRight size={14} className="yon" />
                    </a>
                  </div>
                </details>
              </li>
            ))}
          </ol>
          {!hafta.dosyalar.length && !hafta.anaDosyalar.length && <p className="kp-bos">{t("kpBaslikYok")}</p>}
        </>
      )}
    </section>
  );
}

function BaslikSatiri({ b, no, planId }: { b: BaslikOzeti; no: number; planId: string }) {
  const { t, ad } = useDil();
  const v = useVeri();
  return (
    <li>
      <details data-kp-baslik={b.pb.id}>
        <summary>
          <span className="kp-no">{no}</span>
          <Icerik blok>{b.ad}</Icerik>
          <span className="kp-sayilar">
            {b.gelismeler.length > 0 && <span>{t("kpGelisme", { n: b.gelismeler.length })}</span>}
            {b.paketler.length > 0 && <span>{t("kpPkg", { n: b.paketler.length })}</span>}
            {b.live && <span className="kp-live">LIVE</span>}
            {b.ozelId && <span className="kp-ozel-rozet">{t("kpOzelRozet")}</span>}
          </span>
        </summary>
        <div className="kp-ayrinti">
          {b.gelismeler.map((g) => (
            <div key={g.id} className="kp-gelisme">
              <Icerik blok>{[g.yer, g.metin].filter(Boolean).join(" / ")}</Icerik>
            </div>
          ))}
          {b.muhabirler.length > 0 && (
            <div className="kp-kisiler">
              {b.muhabirler.map((m) => (
                <span key={m.kisiId} className="kp-kisi">
                  <MapPin size={12} aria-hidden="true" /> {m.yer ? <Icerik>{m.yer}</Icerik> : null} {ad(v.kisiler.find((k) => k.id === m.kisiId))}
                </span>
              ))}
            </div>
          )}
          {b.paketler.map((p) => {
            const k = paketKarariOzet(p);
            return (
              <div key={p.id} className="kp-pkg" data-kp-pkg={k}>
                <Icerik blok>{p.baslik}</Icerik>
                <span className={`kp-cip kp-cip-${k}`}>{t(k === "bekliyor" ? "kpKararBekliyor" : k === "bitti" ? "kpBitti" : "kpKabul")}</span>
              </div>
            );
          })}
          {b.canlilar.map((c) => (
            <div key={c.id} className="kp-gelisme">
              <Radio size={13} aria-hidden="true" /> <Icerik>{[c.yer, c.konu].filter(Boolean).join(" / ")}</Icerik> <small>{c.saatGmt ? `${c.saatGmt}G` : "TBC"}</small>
            </div>
          ))}
          {b.ozelId ? (
            <a className="kp-ac" href={`#/ozel/${b.ozelId}`}>
              {t("kpOzeleGit")} <ChevronRight size={14} className="yon" />
            </a>
          ) : (
            <button type="button" className="kp-ac" onClick={() => baslikaGit(planId, b.pb.id)} data-kp-planda-ac>
              {t("kpPlandaAc")} <ChevronRight size={14} className="yon" />
            </button>
          )}
        </div>
      </details>
    </li>
  );
}

/* --- Özel yayınlar --- */

function OzelPaneli() {
  const { t } = useDil();
  const v = useVeri();
  const kartlar = ozelKartlari(v, bugun());
  return (
    <section className="kp-panel" data-kp-ozel>
      <div className="kp-bas">
        <h2 className="kp-baslik">{t("kpOzel")}</h2>
        <a className="kp-ac" href="#/ozel">
          {t("tumu")} <ChevronRight size={14} className="yon" />
        </a>
      </div>
      {!kartlar.length && <p className="kp-bos">{t("kpOzelYok")}</p>}
      {kartlar.map((k) => {
        const simdi = k.asamalar.findIndex((a) => !a.tamam);
        return (
          <a key={k.o.id} className="kp-ozel" href={`#/ozel/${k.o.id}`} data-kp-ozel-kart={k.o.id}>
            <div className="kp-ozel-ust">
              <Icerik blok>{k.o.ad}</Icerik>
              <span className={`kp-cip${k.kalanGun <= 3 ? " kp-cip-bekliyor" : ""}`}>{k.kalanGun ? t("kpKalanGun", { n: k.kalanGun }) : t("bugun")}</span>
            </div>
            <div className="kp-asamalar" role="img" aria-label={simdi < 0 ? t(OZEL_ASAMA_ADI.tamam) : t(OZEL_ASAMA_ADI[k.asamalar[simdi].asama])}>
              {k.asamalar.map((a, i) => (
                <span key={a.asama} className={a.tamam ? "gecti" : i === simdi ? "simdi" : ""}>
                  <i />
                  <small>{t(OZEL_ASAMA_ADI[a.asama])}</small>
                </span>
              ))}
            </div>
            <div className="kp-mini">
              <span>{t("kpNafize", { n: k.nafize })}</span>
              <span>{t("kpIcerikHazir", { h: k.hazir, n: k.icerik })}</span>
              {k.eksik > 0 && <span className="kp-kotu-yazi">{t("kpEksik", { n: k.eksik })}</span>}
            </div>
          </a>
        );
      })}
    </section>
  );
}

/* --- Muhabir görevlendirmeleri: haftanın şeridi (telefonda liste) --- */

function GorevPaneli() {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const B = bugun();
  const gunler = haftaGunleri(B);
  const l = haftaninGorevleri(v, B);
  const m = muhabirler(v);
  const say = (d: string) => m.filter((k) => kisiBugunDurumu(v, k) === d).length;
  const TUR: Record<"gorev" | "ozel" | "izin", Anahtar> = { gorev: "kpGorevTuru", ozel: "kpOzelGorev", izin: "kpIzin" };
  return (
    <section className="kp-panel" data-kp-gorevler>
      <div className="kp-bas">
        <h2 className="kp-baslik">{t("kpGorevler")}</h2>
        <span className="kp-efsane">
          {(["gorev", "ozel", "izin"] as const).map((x) => (
            <span key={x}>
              <i className={`kp-tur-${x}`} /> {t(TUR[x])}
            </span>
          ))}
        </span>
      </div>
      {!l.length ? (
        <p className="kp-bos">{t("kpGorevYok")}</p>
      ) : (
        <>
          <div className="kp-gant" aria-hidden="true">
            <span />
            {gunler.map((g) => (
              <span key={g} className={`kp-gun${g === B ? " bugun" : ""}`}>
                {kisaGunAdi(g, dil)} {Number(g.slice(8))}
              </span>
            ))}
            {l.slice(0, 8).map((x) => (
              <GantSatiri key={x.g.id} ad={ad(v.kisiler.find((k) => k.id === x.g.kisiId))} yer={x.g.yer} bas={x.bas} son={x.son} tur={x.tur} etiket={x.g.aciklama || t(TUR[x.tur])} />
            ))}
          </div>
          <ul className="kp-gorev-liste" data-kp-gorev-liste>
            {l.slice(0, 8).map((x) => (
              <li key={x.g.id}>
                <i className={`kp-tur-${x.tur}`} aria-hidden="true" />
                <span>
                  <b>{ad(v.kisiler.find((k) => k.id === x.g.kisiId))}</b> · <Icerik>{x.g.yer}</Icerik>
                </span>
                <small>
                  {tarihYaz(x.g.baslangic, dil, "kisa")}
                  {x.g.bitis && x.g.bitis !== x.g.baslangic ? ` – ${tarihYaz(x.g.bitis, dil, "kisa")}` : ""}
                </small>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="kp-alt-satir">
        {t("kpSahaOzeti", { s: say("sahada"), y: say("yolda"), i: say("izinli") })} ·{" "}
        <a href="#/hareketler">{t("kpTumHareketler")}</a>
      </p>
    </section>
  );
}

function GantSatiri({ ad, yer, bas, son, tur, etiket }: { ad: string; yer: string; bas: number; son: number; tur: string; etiket: string }) {
  return (
    <>
      <span className="kp-gant-ad">
        <b>{ad}</b>
        <Icerik>{yer}</Icerik>
      </span>
      <span className={`kp-gant-cubuk kp-tur-${tur}`} style={{ gridColumn: `${bas + 2} / ${son + 3}` }} dir="auto">
        {etiket}
      </span>
    </>
  );
}

/* --- Muhabir istatistikleri --- */

function IstatistikPaneli() {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const B = bugun();
  const ayi = B.slice(0, 7);
  const ilk = ilkMuhabirler(v, ayi);
  const enCok = Math.max(1, ...ilk.flatMap((s) => [s.bu.biten, s.onceki.biten]));
  const seri = haftalikSeri(v, B);
  const kabul = ayinKabulu(v, ayi);
  return (
    <section className="kp-panel" data-kp-istatistik>
      <div className="kp-bas">
        <h2 className="kp-baslik">{t("kpIstatistik", { ay: ayAdi(B, dil) })}</h2>
        <a className="kp-ac" href="#/raporlar">
          {t("mRaporlar")} <ChevronRight size={14} className="yon" />
        </a>
      </div>
      <div className="kp-grafikler">
        <div className="kp-grafik">
          <h3>
            {t("kpIlkBes")} <small>{t("kpOncekiAy")}</small>
          </h3>
          {!ilk.length ? (
            <p className="kp-bos">{t("kpIstatistikYok")}</p>
          ) : (
            <div className="kp-cubuklar" data-kp-ilk-bes>
              {ilk.map((s) => (
                <div key={s.kisi.id} className="kp-cubuk-satir">
                  <span className="kp-cubuk-ad">{ad(s.kisi)}</span>
                  <span className="kp-cubuk">
                    <u style={{ inlineSize: `${(s.onceki.biten / enCok) * 100}%` }} />
                    <i style={{ inlineSize: `${(s.bu.biten / enCok) * 100}%` }} />
                  </span>
                  <b>{s.bu.biten}</b>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="kp-grafik">
          <h3>{t("kpSekizHafta")}</h3>
          <HaftaCizgisi seri={seri} />
          <div className="kp-efsane">
            <span>
              <i className="kp-cizgi-oneri" /> {t("kpOneri")}
            </span>
            <span>
              <i className="kp-cizgi-yayin" /> {t("kpYayinlanan")}
            </span>
          </div>
        </div>
        <div className="kp-grafik">
          <h3>{t("kpKabul")}</h3>
          <KabulHalkasi kabul={kabul.kabul} ret={kabul.ret} />
        </div>
      </div>
    </section>
  );
}

function HaftaCizgisi({ seri }: { seri: { bas: string; oneri: number; yayin: number }[] }) {
  const { t } = useDil();
  const G = 300, Y = 90, sol = 22, alt = 76, ust = 8;
  const enCok = Math.max(4, ...seri.flatMap((x) => [x.oneri, x.yayin]));
  const x = (i: number) => sol + (i * (G - sol - 6)) / Math.max(1, seri.length - 1);
  const y = (n: number) => alt - (n / enCok) * (alt - ust);
  const nokta = (k: "oneri" | "yayin") => seri.map((s, i) => `${x(i).toFixed(1)},${y(s[k]).toFixed(1)}`).join(" ");
  const son = seri.at(-1);
  return (
    <svg viewBox={`0 0 ${G} ${Y}`} className="kp-svg" role="img" aria-label={t("kpSekizHafta")} data-kp-seri={seri.map((s) => s.yayin).join(",")}>
      {[ust, (ust + alt) / 2, alt].map((yy) => (
        <line key={yy} x1={sol} x2={G - 2} y1={yy} y2={yy} className="kp-izgara-cizgi" />
      ))}
      <text x="0" y={ust + 4}>{enCok}</text>
      <text x="8" y={alt + 4}>0</text>
      <polyline points={nokta("oneri")} className="kp-cizgi-oneri" />
      <polygon points={`${x(0)},${alt} ${nokta("yayin")} ${x(seri.length - 1)},${alt}`} className="kp-alan-yayin" />
      <polyline points={nokta("yayin")} className="kp-cizgi-yayin" />
      {son && (
        <>
          <circle cx={x(seri.length - 1)} cy={y(son.yayin)} r="3.5" className="kp-son-nokta" />
          <text x={x(seri.length - 1) - 14} y={y(son.yayin) - 7} className="kp-deger">
            {son.yayin}
          </text>
        </>
      )}
    </svg>
  );
}

function KabulHalkasi({ kabul, ret }: { kabul: number; ret: number }) {
  const { t } = useDil();
  const r = 30;
  const c = 2 * Math.PI * r;
  const top = kabul + ret;
  const oran = top ? kabul / top : 0;
  return (
    <div className="kp-halka" data-kp-kabul={top ? Math.round(oran * 100) : ""}>
      <svg viewBox="0 0 80 80" width="88" height="88" role="img" aria-label={top ? `${t("kpKabul")} %${Math.round(oran * 100)}` : t("kpIstatistikYok")}>
        <circle cx="40" cy="40" r={r} className="kp-halka-zemin" />
        {top > 0 && (
          <>
            <circle cx="40" cy="40" r={r} className="kp-halka-kabul" strokeDasharray={`${oran * c} ${c}`} transform="rotate(-90 40 40)" />
            <circle cx="40" cy="40" r={r} className="kp-halka-ret" strokeDasharray={`${(1 - oran) * c} ${c}`} strokeDashoffset={-oran * c} transform="rotate(-90 40 40)" />
          </>
        )}
        <text x="40" y="45" textAnchor="middle" className="kp-halka-yazi">
          {top ? `%${Math.round(oran * 100)}` : "—"}
        </text>
      </svg>
      <div className="kp-efsane dikey">
        <span>
          <i className="kp-halka-kabul-renk" /> {t("kpKabulSayi", { n: kabul })}
        </span>
        <span>
          <i className="kp-halka-ret-renk" /> {t("kpRetSayi", { n: ret })}
        </span>
      </div>
    </div>
  );
}

/* --- Üretim hattı ve haftanın göstergeleri --- */

function UretimPaneli({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { v, izlenen, kolda } = useKapsam(ben);
  const B = bugun();
  const hat = uretimHatti(izlenen);
  const ADI: Partial<Record<PanoSutunu, Anahtar>> = { ...ASAMA_ADI, muhabir: "pa_muhabir", eski: "urEskiAkis" };
  const tikali = hat.filter((x) => x.sayi && x.enUzun > UZUN_BEKLEME).sort((a, b) => b.enUzun - a.enUzun)[0];
  // Paketin bittiği gün (son değişiklik değil: kapanmış paket sonradan düzenlenince "bugün biten" sayılıyordu).
  const biten = kolda.filter((p) => p.durum === "tamamlandi" && paketGunu(v, p) === B).length;
  return (
    <section className="kp-panel" data-kp-hat>
      <div className="kp-bas">
        <h2 className="kp-baslik">{t("kpUretimHatti")}</h2>
        <a className="kp-ac" href="#/uretim">
          <ChevronRight size={14} className="yon" aria-label={t("mUretim")} />
        </a>
      </div>
      <div className="kp-hat">
        {hat.map((x) => (
          <span key={x.sutun} className={x.sayi && x.enUzun > UZUN_BEKLEME ? "tikali" : ""} data-kp-istasyon={x.sutun}>
            <b>{x.sayi}</b>
            <small>{t(ADI[x.sutun] ?? "pa_muhabir")}</small>
          </span>
        ))}
        <span className="yayin" data-kp-istasyon="biten">
          <b>{biten}</b>
          <small>{t("kpBugunBiten")}</small>
        </span>
      </div>
      {tikali && <p className="kp-alt-satir kp-kotu-yazi">{t("kpEnUzun", { asama: t(ADI[tikali.sutun] ?? "pa_muhabir"), sure: sureYazisi(tikali.enUzun * 60_000, t) })}</p>}
      {izlenen.filter((p) => aktifMi(p) && geciktiMi(p)).length > 0 && <p className="kp-alt-satir">{t("kpNabizGeciken", { n: izlenen.filter((p) => aktifMi(p) && geciktiMi(p)).length })}</p>}
    </section>
  );
}

function HaftaPaneli({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { v, ks } = useKapsam(ben);
  const r = rapor(v, 7, ks.kollar);
  const yuzde = (x: number | null) => (x === null ? "—" : `%${Math.round(x * 100)}`);
  const satirlar: [Anahtar, string | number][] = [
    ["tamamlananHaber", r.ozet.tamamlanan],
    ["zamanindaTeslim", yuzde(r.ozet.zamaninda)],
    ["ilkSeferdeKabul", yuzde(r.ozet.ilkSeferde)],
    ["oneriKabul", yuzde(r.ozet.oneriKabul)],
  ];
  return (
    <section className="kp-panel" data-kp-hafta>
      <h2 className="kp-baslik">{t("haftaOzeti")}</h2>
      <dl className="kp-gostergeler">
        {satirlar.map(([k, d]) => (
          <div key={k}>
            <dt>{t(k)}</dt>
            <dd>{d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* --- Verdiklerim: açık talimatlar ve görevler, kimde --- */

function Verdiklerim({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const talimatlar = v.oneriler
    .filter((o) => o.talimatVeren === ben.id)
    .map((o) => ({ o, s: talimatDurumu(o, v) }))
    .filter((x) => x.s.adim < 3 && !x.s.iptal)
    .sort((a, b) => b.o.zaman.localeCompare(a.o.zaman));
  const gorevler = isListesi(v)
    .filter((x) => x.olusturan === ben.id && x.durum !== "bitti")
    .sort((a, b) => b.zaman.localeCompare(a.zaman));
  const hepsi = talimatlar.length + gorevler.length;
  return (
    <section className="kp-verdik" data-kp-verdiklerim>
      <h2 className="kp-baslik">{t("kpVerdiklerim")}</h2>
      {!hepsi && <span className="kp-bos">{t("kpVerdikYok")}</span>}
      {talimatlar.slice(0, 4).map(({ o, s }) => (
        <a key={o.id} href={s.paket ? `#/paketler/${s.paket.id}` : `#/oneriler/${o.id}`} className="kp-verdik-is">
          <Sparkles size={13} aria-hidden="true" /> <b>{t("kpTalimat")}</b> <Icerik>{o.haberBasligi}</Icerik> → {t(TALIMAT_ADIMLARI[s.adim])}
        </a>
      ))}
      {gorevler.slice(0, 4).map((x) => (
        <a key={x.id} href="#/gorevler" className="kp-verdik-is">
          <Users size={13} aria-hidden="true" /> <b>{t("kpGorev")}</b> <span dir="auto">{x.baslik}</span> → {t(IS_DURUM_ADI[x.durum])}
        </a>
      ))}
      {hepsi > 8 && <span className="kp-bos">+{hepsi - 8}</span>}
      <a className="kp-ac" href="#/gorevler">
        <CalendarRange size={14} aria-hidden="true" /> {t("kpTumVerdiklerim")}
      </a>
    </section>
  );
}
