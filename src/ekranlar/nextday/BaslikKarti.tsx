import { ArrowDown, ArrowUp, CircleCheck, Combine, Search, Hourglass, Lightbulb, Pencil, Plus, Radio, Trash2, Users, X, Ban, Newspaper, Package } from "lucide-react";
import { oneriGunde } from "../../oneriPlanlari";
import { useState } from "react";
import { Avatar, HaftalikRozeti, Icerik, OncelikRozeti, PaketDurumRozeti, Pencere, Rozet, TbcKutusu, bildir, oncelikliOnce, talimatOnce } from "../../bilesenler/Parcalar";
import { IslemMenusu } from "../../bilesenler/IslemMenusu";
import { OneriAvatari, OneriKaynagi } from "../../bilesenler/Tablolar";
import { saatYaz, useDil } from "../../dil";
import { gelismeKaydet, paketDurum, paketReddet, paketSil, planBaslikBirlestir, planMuhabirTbc, planBaslikCikar, planBaslikTasi, planMuhabir, planMuhabirGuncelle } from "../../eylemler";
import { TBC, kisiAr, muhabirYeri, paketYeri, satir, sehirAr } from "../../etiketler";
import { useBen } from "../../oturum";
import { simdi, vardiyaYaz } from "../../tarih";
import { YzSonGelismeler, kaynakAdlari } from "../../bilesenler/YzTakip";
import { useYz } from "../../yz";
import { baslikBul, kisiBul, useVeri, type NextDayPlan, type PlanBasligi } from "../../veri";
import { paketPlandanSilinir, yapabilir } from "../../yetki";
import PlanaEkle from "../oneri/PlanaEkle";
import { CanliListesi, EkleDugmesi, GelismeListesi, IkonDugme, oncekiSinif } from "./Bolumler";
import { MuhabirSecici, PaketFormu } from "./Formlar";

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
}: {
  plan: NextDayPlan;
  pb: PlanBasligi;
  sira: number;
  toplam: number;
  icerik: boolean;
  operasyon: boolean;
}) {
  const { t, dil } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [paketForm, setPaketForm] = useState("");
  const [muhabirEkle, setMuhabirEkle] = useState(false);
  const [oneriAcik, setOneriAcik] = useState("");
  const [katPenceresi, setKatPenceresi] = useState(false);
  const [takipPenceresi, setTakipPenceresi] = useState(false);
  const takipAcik = !!useYz("takipMetni");
  const [birakilir, setBirakilir] = useState(false);
  const baslik = baslikBul(v, pb.baslikId);
  const adi = (x: PlanBasligi) => baslikBul(v, x.baslikId)?.ad ?? "";
  // Kaynak başlık hedefin içine katılıyor; onay soruluyor (geri al ↶ ile de dönülüyor).
  const kat = (kaynakId: string, hedefId: string) => {
    const k = plan.basliklar.find((b) => b.id === kaynakId);
    const h = plan.basliklar.find((b) => b.id === hedefId);
    if (!ben || !k || !h || k.id === h.id) return;
    if (!confirm(t("baslikKatilsinMi", { katilan: adi(k), hedef: adi(h) }))) return;
    if (planBaslikBirlestir(ben, plan.id, k.id, h.id)) bildir(t("baslikKatildi"));
  };
  const gelismeler = v.gelismeler.filter((g) => g.planBaslikId === pb.id);
  const paketler = v.paketler.filter((p) => p.planBaslikId === pb.id);
  const canlilar = v.canliYayinlar.filter((c) => c.planBaslikId === pb.id);
  const oneriler = v.oneriler.filter(
    (o) => o.baslikId === pb.baslikId && oneriGunde(o, plan.tarih) && (o.durum === "yeni" || o.durum === "degerlendiriliyor"),
  );
  const degerlendirir = yapabilir(ben, "paketDegerlendir");
  const cikabilir = !paketler.some((p) => p.durum !== "iptal");

  return (
    <>
    <details
      className={`baslik-karti${birakilir ? " birakilir" : ""}`}
      data-plan-baslik={pb.id}
      onDragOver={(e) => {
        if (!icerik || !e.dataTransfer.types.includes(SURUKLENEN)) return;
        e.preventDefault();
        setBirakilir(true);
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setBirakilir(false)}
      onDrop={(e) => {
        const kaynak = e.dataTransfer.getData(SURUKLENEN);
        setBirakilir(false);
        if (!kaynak) return;
        e.preventDefault();
        kat(kaynak, pb.id);
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
        <span className="sayimlar">
          <span>
            <Newspaper size={12} /> {gelismeler.length}
          </span>
          <span>
            <Users size={12} /> {pb.muhabirler.length}
          </span>
          <span>
            <Package size={12} /> {paketler.filter((p) => p.durum !== "iptal").length}
          </span>
          <span>
            <Radio size={12} /> {canlilar.length}
          </span>
          {oneriler.length > 0 && <Rozet ton="vurgu">{t("yeniOneriSayisi", { n: oneriler.length })}</Rozet>}
        </span>
        {icerik && (
          <span className="sag-uc" onClick={(e) => e.preventDefault()}>
            <IslemMenusu etiket={t("baslikIslemleri")} dugmeSinifi="dugme dugme-sade dugme-ikon" ikon={<Plus size={15} />} katman>
              <button type="button" role="menuitem" className="acilir-satir" disabled={toplam < 2} onClick={() => setKatPenceresi(true)} data-baslika-kat>
                <Combine size={16} /> {t("baslikaKat")}
              </button>
              {takipAcik && (
                <button type="button" role="menuitem" className="acilir-satir" onClick={() => setTakipPenceresi(true)} data-yz-takip-ac>
                  <Search size={16} /> {t("yzTakipMetni")}
                </button>
              )}
            </IslemMenusu>
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
        )}
      </summary>

      <div className="baslik-govde">
        <section className="alt-alan">
          <h4>
            <Newspaper size={14} /> {t("gelismeler")}
          </h4>
          <GelismeListesi plan={plan} gelismeler={gelismeler} duzenler={operasyon} planBaslikId={pb.id} />
        </section>

        <section className="alt-alan">
          <h4>
            <Users size={14} /> {t("takipEdenMuhabirler")}
          </h4>
          <div className="cipler">
            {pb.muhabirler.map((m) => {
              const k = kisiBul(v, m.kisiId);
              return (
                <span key={m.kisiId} className={oncekiSinif(m.onceki, "cip")} title={m.onceki ? t("oncekiGunden") : undefined}>
                  <Avatar kisi={k} boy="kucuk" />
                  <Icerik>{satir(m.yer || sehirAr(k?.sehir), kisiAr(k) || "?")}</Icerik>
                  {icerik ? (
                    <input
                      className="girdi vardiya-girdi"
                      type="time"
                      value={m.saat ?? ""}
                      title={t("canliSaati")}
                      aria-label={t("canliSaati")}
                      onChange={(e) => ben && planMuhabirGuncelle(ben, plan.id, pb.id, m.kisiId, { saat: e.target.value || undefined })}
                    />
                  ) : (
                    m.saat && <Rozet>{vardiyaYaz(m.saat)}</Rozet>
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
              </div>
            ))}
        </section>

        <section className="alt-alan">
          <h4>
            <Package size={14} /> {t("paketOnerileri")} (PKG)
          </h4>
          {paketler.length === 0 && paketForm !== "yeni" && <p className="bos-kucuk">{t("paketOnerisiYok")}</p>}
          {[...paketler].sort(oncelikliOnce).map((p) =>
            paketForm === p.id ? (
              <PaketFormu key={p.id} plan={plan} planBaslikId={pb.id} mevcut={p} kapat={() => setPaketForm("")} />
            ) : (
              <div key={p.id} className="kayit">
                <div className="kayit-bas">
                  <div>
                    <a href={`#/paketler/${p.id}`} className="kalin-bag">
                      <Icerik blok>{satir(paketYeri(p), p.baslik, muhabirYeri([p.muhabirId ? kisiAr(kisiBul(v, p.muhabirId)) : ""], p.muhabirTbc))}</Icerik>
                    </a>
                    <small>
                      {p.oncelikli && <OncelikRozeti />}
                      {p.haftalikKalemId && <HaftalikRozeti />}
                      <PaketDurumRozeti paket={p} />
                      <span>{p.kod}</span>
                      {p.yayin && <span>· {t("yayin")} {saatYaz(p.yayin, dil)}</span>}
                      {p.sahaGerekli && <Rozet ton="uyari">{t("saha")}</Rozet>}
                    </small>
                  </div>
                  <div className="islemler">
                    {icerik && ["taslak", "degerlendiriliyor"].includes(p.durum) && (
                      <IkonDugme ikon={<Pencil size={15} />} etiket={t("duzenle")} onClick={() => setPaketForm(p.id)} />
                    )}
                    {degerlendirir && p.durum === "taslak" && (
                      <IkonDugme ikon={<Hourglass size={15} />} etiket={t("degerlendirmeyeAl")} onClick={() => ben && paketDurum(ben, p.id, "degerlendiriliyor")} />
                    )}
                    {/* Toplantıda paket başına karar: kabul muhabire görev, ret paketi iz olarak bırakır. */}
                    {degerlendirir && ["taslak", "degerlendiriliyor"].includes(p.durum) && (
                      <IkonDugme ikon={<CircleCheck size={15} />} etiket={t("kabulEt")} onClick={() => ben && confirm(t("paketKabulOnay")) && paketDurum(ben, p.id, "onaylandi")} />
                    )}
                    {degerlendirir && ["taslak", "degerlendiriliyor"].includes(p.durum) && (
                      <IkonDugme ikon={<Ban size={15} />} etiket={t("reddet")} onClick={() => ben && confirm(t("paketRetOnay")) && paketReddet(ben, p.id)} />
                    )}
                    {degerlendirir && !["tamamlandi", "iptal", "taslak", "degerlendiriliyor"].includes(p.durum) && (
                      <IkonDugme ikon={<Ban size={15} />} etiket={t("iptalEt")} onClick={() => ben && confirm(t("iptalEdilsinMi")) && paketDurum(ben, p.id, "iptal")} />
                    )}
                    {icerik && paketPlandanSilinir(p) && (
                      <IkonDugme ikon={<Trash2 size={15} />} etiket={t("sil")} onClick={() => ben && confirm(t("silinsinMi")) && paketSil(ben, p.id)} />
                    )}
                  </div>
                </div>
              </div>
            ),
          )}
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
            {[...oneriler].sort(talimatOnce).map((o) => (
              <div key={o.id} className={`kayit ${o.talimatVeren ? "kayit-talimat" : ""}`}>
                <div className="kayit-bas">
                  <OneriAvatari oneri={o} d={v} />
                  <div>
                    <b>
                      <Icerik blok>{o.haberBasligi}</Icerik>
                    </b>
                    <Icerik blok className="kayit-metin">
                      {o.gelisme}
                    </Icerik>
                    <small>
                      <OneriKaynagi oneri={o} d={v} />
                    </small>
                  </div>
                  {oneriAcik !== o.id && (
                    <button className="dugme dugme-iyi dugme-kucuk" onClick={() => setOneriAcik(o.id)}>
                      {t("planaEkle")}
                    </button>
                  )}
                </div>
                {oneriAcik === o.id && ben && <PlanaEkle ben={ben} oneri={o} planId={plan.id} kapat={() => setOneriAcik("")} />}
              </div>
            ))}
          </section>
        )}
      </div>
    </details>
    {/* Pencere kartın dışında: kapalı <details> içindekini göstermiyor. */}
    {/* Son gelişmeler gelişme olarak başlığın altına giriyor; kaynak alıntılanan siteler (medya). */}
    {takipPenceresi && baslik && (
      <Pencere baslik={t("yzTakipMetni")} alt={<Icerik>{baslik.ad}</Icerik>} kapat={() => setTakipPenceresi(false)}>
        <YzSonGelismeler
          baslik={baslik.ad}
          baslikId={baslik.id}
          ekleMetni={t("yzGelismeOlarakEkle")}
          ekle={(s) => {
            if (!ben) return;
            const ok = gelismeKaydet(ben, { planId: plan.id, planBaslikId: pb.id, metin: s.metin, kaynakTuru: "medya", kaynakAdi: kaynakAdlari(s), tarih: simdi() });
            if (ok !== false) {
              bildir(t("bKaydedildi"));
              setTakipPenceresi(false);
            }
          }}
        />
      </Pencere>
    )}
    {katPenceresi && (
      <Pencere baslik={t("baslikaKat")} alt={<Icerik>{baslik?.ad}</Icerik>} kapat={() => setKatPenceresi(false)}>
        <div className="dugmeler dikey" data-kat-hedefleri>
          {plan.basliklar
            .filter((x) => x.id !== pb.id)
            .map((x) => (
              <button
                key={x.id}
                type="button"
                className="dugme dugme-ikincil"
                data-kat-hedef={x.id}
                onClick={() => {
                  setKatPenceresi(false);
                  kat(pb.id, x.id);
                }}
              >
                <Icerik>{adi(x)}</Icerik>
              </button>
            ))}
        </div>
      </Pencere>
    )}
    </>
  );
}
