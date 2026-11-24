import { SaatGirdisi } from "../../bilesenler/TarihSaat";
import { OneriyiAc } from "../oneri/OneriyiAc";
import { KisiCipi } from "../../bilesenler/KisiCipi";
import { useYeniTasarim } from "../../tasarimSecimi";
import { ArrowDown, ArrowUp, Combine, Search, Lightbulb, Pencil, Plus, Radio, Trash2, Users, X, Newspaper, Package, PackageCheck, Send, StickyNote } from "lucide-react";
import { useState } from "react";
import { Avatar, HaftalikRozeti, Icerik, OncelikRozeti, PaketDurumRozeti, Pencere, Rozet, LiveKutusu, TbcKutusu, bildir, icerikAlani, oncelikliOnce } from "../../bilesenler/Parcalar";
import { IslemMenusu } from "../../bilesenler/IslemMenusu";
import { saatYaz, useDil } from "../../dil";
import { gelismeKaydet, stokPaketiSil, stokPaketiSilinebilir, paketMetniDuzenle, paketMetniDuzenlenebilir, paketSil, paketStogaAl, paketStogaAlinabilir, planMuhabirTbc, planBaslikLive, planBaslikCikar, planBaslikTasi, planBaslikYerine, planMuhabir, planMuhabirGuncelle } from "../../eylemler";
import { TBC, bicimEki, paketNotEki, kisiAr, muhabirYeri, paketYeri, satir, sehirAr } from "../../etiketler";
import { useBen } from "../../oturum";
import { vardiyaYaz } from "../../tarih";
import { useYz } from "../../yz";
import { baslikBul, kisiBul, useVeri, type Kisi, type NextDayPlan, type Paket, type PlanBasligi } from "../../veri";
import { paketSilinebilir, yapabilir } from "../../yetki";
import { CanliListesi, EkleDugmesi, GelismeListesi, IkonDugme, OncekiDugmesi, oncekiSinif } from "./Bolumler";
import { BaslikAdiPenceresi, BaslikaKatPenceresi, BaslikOnerileri, PaketKararDugmeleri, PaketOneriBagi, SonGelismelerPenceresi, baslikOnerileri } from "./SatirIslemleri";
import { MuhabirSecici, PaketFormu } from "./Formlar";
import { PaketPlanNotlari } from "./PaketPlanNotlari";
import { paketHedefi, paketSuruklenir } from "./paketSurukle";
import { suruklenir } from "./planSurukle";

/**
 * Haber gündemindeki bir başlık: kurumun çıktısında altı çizili başlık ve
 * altında gelişmeler, المراسلون ve PKG satırları. Promptun 4.4 maddesi:
 * bir başlığa birden fazla muhabir atanabiliyor, paket önerisi olmasa da;
 * paket önerileri hazır paketlerden ayrı; ajanstan gelen gelişmenin paket
 * olması gerekmiyor.
 */
/* Sürüklenen başlığın kimliği bu türle taşınıyor: dosya ya da metin bırakılınca birleştirme denenmesin. */
const SURUKLENEN = "application/x-plan-baslik";

export default function BaslikKarti({
  plan,
  pb,
  sira,
  toplam,
  icerik,
  operasyon,
  acik,
}: {
  plan: NextDayPlan;
  pb: PlanBasligi;
  sira: number;
  toplam: number;
  icerik: boolean;
  operasyon: boolean;
  /** Yeni görünümün yan panelinde açık gelir. */
  acik?: boolean;
}) {
  const { t, dil } = useDil();
  const v = useVeri();
  const ben = useBen();
  const yeni = useYeniTasarim();
  const [paketForm, setPaketForm] = useState("");
  const [muhabirEkle, setMuhabirEkle] = useState(false);
  const [adPenceresi, setAdPenceresi] = useState(false);
  const [katPenceresi, setKatPenceresi] = useState(false);
  const [takipPenceresi, setTakipPenceresi] = useState(false);
  const [notKisi, setNotKisi] = useState<string | null>(null);
  const takipAcik = !!useYz("takipMetni");
  const [birakilir, setBirakilir] = useState(false);
  const baslik = baslikBul(v, pb.baslikId);
  const gelismeler = v.gelismeler.filter((g) => g.planBaslikId === pb.id);
  const paketler = v.paketler.filter((p) => p.planBaslikId === pb.id);
  const canlilar = v.canliYayinlar.filter((c) => c.planBaslikId === pb.id);
  const oneriler = baslikOnerileri(v, plan, pb);
  const cikabilir = !paketler.some((p) => p.durum !== "iptal");
  /*
   * Gelişmeye bağlı PKG (başlığın içindeki daha özel konu) o gelişmenin hemen
   * altında; başlığın PKG bölümünde yalnız öbürleri. Gelişmesi bu başlıkta
   * olmayan paket (gelişme silindi, taşındı) başlıkta kalır.
   */
  const gelismeAltinda = (p: Paket) => !!p.gelismeId && gelismeler.some((g) => g.id === p.gelismeId);
  const basPaketleri = [...paketler].filter((p) => !gelismeAltinda(p)).sort(oncelikliOnce);
  const paketSatiri = (p: Paket) =>
            paketForm === p.id && p.durum === "onaylandi" ? (
              <PaketMetniFormu key={p.id} ben={ben!} paket={p} kapat={() => setPaketForm("")} />
            ) : paketForm === p.id ? (
              <PaketFormu key={p.id} plan={plan} planBaslikId={pb.id} mevcut={p} kapat={() => setPaketForm("")} />
            ) : (
              <div key={p.id} className="kayit" {...paketSuruklenir(p, icerik && !!ben, ben ?? undefined)}>
                <div className="kayit-bas">
                  <div>
                    <a href={`#/paketler/${p.id}`} className="kalin-bag">
                      <Icerik blok>{satir(paketYeri(p), p.baslik, muhabirYeri([p.muhabirId ? kisiAr(kisiBul(v, p.muhabirId)) : ""], p.muhabirTbc))}{bicimEki(p.bicim) && <b data-bicim-eki> {bicimEki(p.bicim)}</b>}{paketNotEki(p) && <span data-paket-notu>{paketNotEki(p)}</span>}</Icerik>
                    </a>
                    {p.slug && (
                      <span dir="ltr" className="slug" data-paket-kodu>
                        {p.slug}
                      </span>
                    )}
                    <PaketPlanNotlari paket={p} ben={icerik && ben ? ben : undefined} />
                    <small>
                      {yeni && ben && p.muhabirId && <KisiCipi ben={ben} kisi={kisiBul(v, p.muhabirId)} konu={p.baslik} sade />}
                      {p.oncelikli && <OncelikRozeti />}
                      {p.haftalikKalemId && <HaftalikRozeti />}
                      <PaketDurumRozeti paket={p} />
                      <span>{p.kod}</span>
                      {p.yayin && <span>· {t("yayin")} {saatYaz(p.yayin, dil)}</span>}
                      {p.sahaGerekli && <Rozet ton="uyari">{t("saha")}</Rozet>}
                    </small>
                  </div>
                  <div className="islemler">
                    <OneriyiAc oneriId={p.oneriId} />
                    <PaketOneriBagi ben={ben} paket={p} />
                    {icerik && ["taslak", "degerlendiriliyor"].includes(p.durum) && (
                      <IkonDugme ikon={<Pencil size={15} />} etiket={t("duzenle")} onClick={() => setPaketForm(p.id)} />
                    )}
                    {paketMetniDuzenlenebilir(ben, v, p) && (
                      <IkonDugme ikon={<Pencil size={15} />} etiket={t("duzenle")} onClick={() => setPaketForm(p.id)} />
                    )}
                    {/* Toplantıda paket başına karar: kabul muhabire görev, ret paketi iz olarak bırakır. */}
                    <PaketKararDugmeleri ben={ben} paket={p} />
                    {icerik && paketStogaAlinabilir(p) && (
                      <IkonDugme ikon={<PackageCheck size={15} />} etiket={t("stokPaketOlarakEkle")} onClick={() => ben && confirm(t("stokPaketOnay")) && paketStogaAl(ben, p.id, confirm(t("stokBaslikta")))} />
                    )}
                    {/* Stoka alınıp başlığın altında da kalan paket buradan da silinir (yukarıdaki hazır paketlerdeki gibi). */}
                    {icerik && ben && p.stok && stokPaketiSilinebilir(ben, v, plan, p) && (
                      <IkonDugme ikon={<Trash2 size={15} />} etiket={t("sil")} onClick={() => confirm(t("silinsinMi")) && stokPaketiSil(ben, plan.id, p.id)} />
                    )}
                    {icerik && paketSilinebilir(p) && (
                      <IkonDugme ikon={<Trash2 size={15} />} etiket={t("sil")} onClick={() => ben && confirm(t(p.durum === "onaylandi" && p.muhabirId ? "paketSilBildirimli" : "silinsinMi")) && paketSil(ben, p.id)} />
                    )}
                  </div>
                </div>
              </div>
            );
  const gelismeAlti = (g: { id: string }) => (
    <>
      {[...paketler].filter((p) => p.gelismeId === g.id).sort(oncelikliOnce).map(paketSatiri)}
      {icerik && paketForm === `yeni:${g.id}` && <PaketFormu plan={plan} planBaslikId={pb.id} gelismeId={g.id} kapat={() => setPaketForm("")} />}
    </>
  );

  const pkgHedef = paketHedefi(ben ?? undefined, pb.id, undefined, icerik);
  return (
    <>
    <details
      className={`baslik-karti${birakilir ? " birakilir" : ""}`}
      open={acik}
      data-plan-baslik={pb.id}
      onDragOver={(e) => {
        // PKG bırakma (gelişmenin altından başlığın PKG bölümüne) önce; başlık sıralamasının türü ayrı.
        pkgHedef.onDragOver?.(e);
        if (!icerik || !e.dataTransfer.types.includes(SURUKLENEN)) return;
        e.preventDefault();
        setBirakilir(true);
      }}
      onDragLeave={(e) => {
        pkgHedef.onDragLeave?.(e);
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setBirakilir(false);
      }}
      onDrop={(e) => {
        pkgHedef.onDrop?.(e);
        if (e.defaultPrevented) return;
        const kaynak = e.dataTransfer.getData(SURUKLENEN);
        setBirakilir(false);
        if (!kaynak) return;
        e.preventDefault();
        // Sürükleme sıralar; katmak "+" menüsündeki "Başka başlığa kat"la (kullanıcının isteği).
        if (ben && kaynak !== pb.id) planBaslikYerine(ben, plan.id, kaynak, pb.id);
      }}
    >
      <summary
        draggable={icerik}
        onDragStart={(e) => {
          e.dataTransfer.setData(SURUKLENEN, pb.id);
          e.dataTransfer.effectAllowed = "move";
        }}
      >
        <span className="sira">{sira + 1}</span>
        <h3>
          <Icerik>{baslik?.ad}</Icerik>
        </h3>
        {/* Sıfır sayaç çizilmez; sayacın adı ipucunda ve ekran okuyucuda (mobil denetim). */}
        <span className="sayimlar">
          {(
            [
              [Newspaper, gelismeler.length, t("gelismeler")],
              [Users, pb.muhabirler.length, t("muhabirler")],
              [Package, paketler.filter((p) => p.durum !== "iptal").length, t("mPaketler")],
              [Radio, canlilar.length, t("canliYayinlar")],
            ] as const
          )
            .filter(([, n]) => n > 0)
            .map(([Ikon, n, ad]) => (
              <span key={ad} title={ad} aria-label={`${ad}: ${n}`}>
                <Ikon size={12} aria-hidden="true" /> {n}
              </span>
            ))}
          {oneriler.length > 0 && <Rozet ton="vurgu">{t("yeniOneriSayisi", { n: oneriler.length })}</Rozet>}
        </span>
        {icerik && (
          <span className="sag-uc" onClick={(e) => e.preventDefault()}>
            <IslemMenusu etiket={t("baslikIslemleri")} dugmeSinifi="dugme dugme-sade dugme-ikon" ikon={<Plus size={15} />} katman>
              <button type="button" role="menuitem" className="acilir-satir" disabled={toplam < 2} onClick={() => setKatPenceresi(true)} data-baslika-kat>
                <Combine size={16} /> {t("baslikaKat")}
              </button>
              {ben && yapabilir(ben, "baslikYonet") && (
                <button type="button" role="menuitem" className="acilir-satir" onClick={() => setAdPenceresi(true)} data-baslik-adi-ac>
                  <Pencil size={16} /> {t("baslik")}
                </button>
              )}
              {takipAcik && (
                <button type="button" role="menuitem" className="acilir-satir" onClick={() => setTakipPenceresi(true)} data-yz-takip-ac>
                  <Search size={16} /> {t("yzTakipMetni")}
                </button>
              )}
              {/* Telefonda sırala ve çıkar bu menüde: kalıcı dört simge Arapça başlığa ~150 piksel bırakıyordu. */}
              <button type="button" role="menuitem" className="acilir-satir telefon-satiri" disabled={sira === 0} onClick={() => ben && planBaslikTasi(ben, plan.id, pb.id, -1)} data-baslik-yukari>
                <ArrowUp size={16} /> {t("yukariTasi")}
              </button>
              <button type="button" role="menuitem" className="acilir-satir telefon-satiri" disabled={sira >= toplam - 1} onClick={() => ben && planBaslikTasi(ben, plan.id, pb.id, 1)} data-baslik-asagi>
                <ArrowDown size={16} /> {t("asagiTasi")}
              </button>
              <button
                type="button"
                role="menuitem"
                className="acilir-satir telefon-satiri kotu-yazi"
                onClick={() => {
                  if (!ben) return;
                  if (!cikabilir) return bildir(t("paketliBaslikCikmaz"));
                  if (confirm(t("baslikCikarilsinMi"))) planBaslikCikar(ben, plan.id, pb.id);
                }}
                data-baslik-cikar
              >
                <Trash2 size={16} /> {t("plandanCikar")}
              </button>
            </IslemMenusu>
            <span className="telefonda-gizli baslik-sira-dugmeleri">
            <IkonDugme ikon={<ArrowUp size={15} />} etiket={t("yukariTasi")} onClick={() => ben && sira > 0 && planBaslikTasi(ben, plan.id, pb.id, -1)} />
            <IkonDugme ikon={<ArrowDown size={15} />} etiket={t("asagiTasi")} onClick={() => ben && sira < toplam - 1 && planBaslikTasi(ben, plan.id, pb.id, 1)} />
            <IkonDugme
              ikon={<Trash2 size={15} />}
              etiket={cikabilir ? t("plandanCikar") : t("paketliBaslikCikmaz")}
              onClick={() => {
                if (!ben) return;
                if (!cikabilir) return bildir(t("paketliBaslikCikmaz"));
                if (confirm(t("baslikCikarilsinMi"))) planBaslikCikar(ben, plan.id, pb.id);
              }}
            />
            </span>
          </span>
        )}
      </summary>

      <div className="baslik-govde">
        <section className="alt-alan">
          <h4>
            <Newspaper size={14} /> {t("gelismeler")}
          </h4>
          <GelismeListesi plan={plan} gelismeler={gelismeler} duzenler={operasyon} planBaslikId={pb.id} gelismeAlti={gelismeAlti} hedef={(g) => paketHedefi(ben ?? undefined, pb.id, g.id, icerik)} paketEkle={icerik ? (g) => setPaketForm(`yeni:${g.id}`) : undefined} />
          {operasyon && ben && <HizliGelisme ben={ben} planId={plan.id} pbId={pb.id} />}
        </section>

        <section className="alt-alan">
          <h4>
            <Users size={14} /> {t("takipEdenMuhabirler")}
          </h4>
          <div className="cipler">
            {pb.muhabirler.map((m) => {
              const k = kisiBul(v, m.kisiId);
              return (
                <span key={m.kisiId} {...suruklenir("muhabir", m.kisiId, pb.id, icerik && !!ben)} className={oncekiSinif(m.onceki, "cip")} title={m.onceki ? t("oncekiGunden") : undefined}>
                  {/* Yeni tasarımda avatara basınca muhabirin kartı: durumu, işleri, WhatsApp, posta (konu başlığın adı). */}
                  {yeni && ben && k ? <KisiCipi ben={ben} kisi={k} konu={baslik?.ad ?? ""} sade /> : <Avatar kisi={k} boy="kucuk" />}
                  <Icerik>{satir(m.yer || sehirAr(k?.sehir), kisiAr(k) || "?")}</Icerik>
                  {icerik && (
                    // Muhabir o gün şehrinden başka yerdeyse plandaki yeri burada değişiyor; çıkınca yazılıyor, her harfte değil.
                    <input
                      key={m.yer ?? ""}
                      className="girdi muhabir-yer-girdi"
                      {...icerikAlani}
                      defaultValue={m.yer ?? ""}
                      placeholder={sehirAr(k?.sehir)}
                      title={t("yer")}
                      aria-label={t("yer")}
                      data-muhabir-yer
                      onBlur={(e) => ben && (e.target.value.trim() || undefined) !== m.yer && planMuhabirGuncelle(ben, plan.id, pb.id, m.kisiId, { yer: e.target.value.trim() || undefined })}
                    />
                  )}
                  {icerik ? (
                    <SaatGirdisi
                      className="girdi vardiya-girdi"
                     
                      value={m.saat ?? ""}
                      title={t("canliSaati")}
                      aria-label={t("canliSaati")}
                      onChange={(e) => ben && planMuhabirGuncelle(ben, plan.id, pb.id, m.kisiId, { saat: e.target.value || undefined })}
                    />
                  ) : (
                    m.saat && <Rozet>{vardiyaYaz(m.saat)}</Rozet>
                  )}
                  {icerik && m.onceki && <OncekiDugmesi planId={plan.id} hedef={{ muhabir: [pb.id, m.kisiId] }} />}
                  {icerik && (
                    // Not varsa simge dolu ve ipucunda notun kendisi: planlamacı açmadan görsün.
                    <button onClick={() => setNotKisi(m.kisiId)} aria-label={t("muhabireNot")} title={m.not ? `${t("muhabireNot")}: ${m.not}` : t("muhabireNot")} data-muhabir-not={m.not ? "dolu" : "bos"}>
                      <StickyNote size={13} fill={m.not ? "currentColor" : "none"} />
                    </button>
                  )}
                  {icerik && (
                    <button onClick={() => ben && planMuhabir(ben, plan.id, pb.id, m.kisiId, false)} aria-label={t("cikar")} title={t("cikar")}>
                      <X size={13} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
          {pb.muhabirler.length === 0 &&
            (pb.muhabirTbc ? (
              <Rozet ton="uyari" title={t("tbcAdi")}>
                {TBC}
              </Rozet>
            ) : (
              <p className="bos-kucuk">{t("muhabirAtanmadi")}</p>
            ))}
          {pb.live && !icerik && (
            <Rozet ton="vurgu" title={t("liveAdi")}>
              LIVE
            </Rozet>
          )}
          {icerik &&
            (muhabirEkle ? (
              <div className="form ara-ust-2">
                <MuhabirSecici
                  deger=""
                  degistir={(id) => {
                    if (ben && id) planMuhabir(ben, plan.id, pb.id, id, true);
                    setMuhabirEkle(false);
                  }}
                />
              </div>
            ) : (
              <div className="ara-ust-2 muhabir-eylem">
                <EkleDugmesi metin={t("muhabirAta")} onClick={() => setMuhabirEkle(true)} />
                {pb.muhabirler.length === 0 && <TbcKutusu secili={!!pb.muhabirTbc} degistir={(x) => ben && planMuhabirTbc(ben, plan.id, pb.id, x)} />}
                <LiveKutusu secili={!!pb.live} degistir={(x) => ben && planBaslikLive(ben, plan.id, pb.id, x)} />
              </div>
            ))}
        </section>

        <section className="alt-alan" data-pkg-bolum={pb.id}>
          <h4>
            <Package size={14} /> {t("paketOnerileri")} (PKG)
          </h4>
          {basPaketleri.length === 0 && paketForm !== "yeni" && <p className="bos-kucuk">{t("paketOnerisiYok")}</p>}
          {basPaketleri.map(paketSatiri)}
          {icerik && paketForm === "yeni" && <PaketFormu plan={plan} planBaslikId={pb.id} kapat={() => setPaketForm("")} />}
          {icerik && !paketForm && (
            <div className="ara-ust-2">
              <EkleDugmesi metin={t("paketOnerisiEkle")} onClick={() => setPaketForm("yeni")} />
            </div>
          )}
        </section>

        <section className="alt-alan">
          <h4>
            <Radio size={14} /> {t("canliYayinlar")}
          </h4>
          <CanliListesi plan={plan} canlilar={canlilar} duzenler={operasyon} planBaslikId={pb.id} />
        </section>

        {icerik && oneriler.length > 0 && (
          <section className="alt-alan alt-alan-genis">
            <h4>
              <Lightbulb size={14} /> {t("buBasligaGelenOneriler")}
            </h4>
            <BaslikOnerileri ben={ben} plan={plan} pb={pb} />
          </section>
        )}
      </div>
    </details>
    {/* Pencere kartın dışında: kapalı <details> içindekini göstermiyor. */}
    {/* Son gelişmeler gelişme olarak başlığın altına giriyor; kaynak alıntılanan siteler (medya). */}
    {notKisi && ben && (
      <Pencere baslik={t("muhabireNot")} alt={kisiAr(kisiBul(v, notKisi))} kapat={() => setNotKisi(null)}>
        <MuhabirNotuFormu
          ilk={pb.muhabirler.find((m) => m.kisiId === notKisi)?.not ?? ""}
          kaydet={(not) => {
            planMuhabirGuncelle(ben, plan.id, pb.id, notKisi, { not: not.trim() || undefined });
            setNotKisi(null);
          }}
          kapat={() => setNotKisi(null)}
        />
      </Pencere>
    )}
    {takipPenceresi && ben && <SonGelismelerPenceresi ben={ben} plan={plan} pb={pb} kapat={() => setTakipPenceresi(false)} />}
    {katPenceresi && ben && <BaslikaKatPenceresi ben={ben} plan={plan} pb={pb} kapat={() => setKatPenceresi(false)} />}
    {adPenceresi && ben && <BaslikAdiPenceresi ben={ben} pb={pb} kapat={() => setAdPenceresi(false)} />}
    </>
  );
}

/* Onaylı paketin yalnız metni (Strap, açıklama); geri kalanı kilitli. */
export function PaketMetniFormu({ ben, paket: p, kapat }: { ben: Kisi; paket: Paket; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({ baslik: p.baslik, aciklama: p.aciklama ?? "", slug: p.slug ?? "" });
  return (
    <div className="form form-kutu" data-paket-metni={p.id}>
      <label>
        {t("onerilenPaketBasligi")}
        <input {...icerikAlani} value={f.baslik} onChange={(e) => setF({ ...f, baslik: e.target.value })} data-paket-metni-strap />
      </label>
      <label>
        {t("aciklama")}
        <textarea {...icerikAlani} value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} data-paket-metni-aciklama />
      </label>
      {/* Stoktaki paketin kodu (slug) hazır paketler satırında basılıyor; orada da düzeltilsin. */}
      {p.stok && (
        <label>
          {t("slug")}
          <input dir="ltr" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} data-paket-metni-slug />
        </label>
      )}
      <div className="form-alt">
        <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
          {t("iptal")}
        </button>
        <button type="button" className="dugme" disabled={!f.baslik.trim()} onClick={() => paketMetniDuzenle(ben, p.id, p.stok ? f : { baslik: f.baslik, aciklama: f.aciklama }) && kapat()} data-paket-metni-kaydet>
          {t("kaydet")}
        </button>
      </div>
    </div>
  );
}

/* Planlamacının muhabire notu: neyi takip edeceği, işiyle ilgili; plan onaylanınca muhabire gider. */
export function MuhabirNotuFormu({ ilk, kaydet, kapat }: { ilk: string; kaydet: (not: string) => void; kapat: () => void }) {
  const { t } = useDil();
  const [not, setNot] = useState(ilk);
  return (
    <div className="form">
      <textarea dir="auto" value={not} onChange={(e) => setNot(e.target.value)} aria-label={t("muhabireNot")} data-muhabir-not-metni autoFocus />
      <div className="form-alt">
        <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
          {t("iptal")}
        </button>
        <button type="button" className="dugme" onClick={() => kaydet(not)} data-muhabir-not-kaydet>
          {t("kaydet")}
        </button>
      </div>
    </div>
  );
}

/*
 * Telefonda başlığın altında tek satırlık gelişme: yazıp Enter (ya da ➤).
 * "YER / metin" yazılırsa yer ayrılır, kaynak ajans; ayrıntı sonradan
 * gelişmenin kaleminden. Gelişme formu 10–12 alanlı, Kaydet 950 piksel
 * aşağıdaydı (mobil denetim, akış önerisi; Yeni görünümün hızlı satırıyla
 * aynı kural).
 */
function HizliGelisme({ ben, planId, pbId }: { ben: Kisi; planId: string; pbId: string }) {
  const { t } = useDil();
  const [yazi, setYazi] = useState("");
  const ekle = () => {
    const ham = yazi.trim();
    if (!ham) return;
    const i = ham.indexOf(" / ");
    const yer = i > 0 && i < 30 ? ham.slice(0, i).trim() : undefined;
    const govde = yer ? ham.slice(i + 3).trim() : ham;
    if (!govde) return;
    if (gelismeKaydet(ben, { planId, planBaslikId: pbId, yer, metin: govde, kaynakTuru: "ajans", kaynakAdi: "", tarih: "" })) setYazi("");
  };
  return (
    <form
      className="hizli-gelisme yalniz-telefon"
      onSubmit={(e) => {
        e.preventDefault();
        ekle();
      }}
      data-hizli-gelisme={pbId}
    >
      <input {...icerikAlani} value={yazi} onChange={(e) => setYazi(e.target.value)} placeholder="بغداد / …" aria-label={t("gelismeEkle")} enterKeyHint="send" />
      <button type="submit" className="dugme dugme-ikincil dugme-ikon" aria-label={t("gelismeEkle")} title={t("gelismeEkle")} aria-disabled={!yazi.trim() || undefined}>
        <Send size={16} className="yon" />
      </button>
    </form>
  );
}
