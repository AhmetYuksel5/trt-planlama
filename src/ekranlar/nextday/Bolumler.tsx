import { Check, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar, Bos, Icerik, Rozet, TurRozeti, icerikAlani } from "../../bilesenler/Parcalar";
import { metin, saatYaz, tarihYaz, useDil } from "../../dil";
import { baslikEkle, canliSil, ekipCikar, ekipEkle, ekipGuncelle, gelismeSil, hazirPaketCikar, hazirPaketEkle, oncekiOnayla, planBaslikEkle, planGorevlendirmeCikar, planGorevlendirmeEkle, type OncekiHedef } from "../../eylemler";
import { EKIP_GOREV_ADI, GOREV_ADI, HAREKET_TURU_ADI, KAYNAK_ADI, kisiAr, satir, sehirAr, varsayilanEkipGorevi } from "../../etiketler";
import { stokDurumu } from "../../akis";
import { useBen } from "../../oturum";
import { vardiyaYaz, yerelGun } from "../../tarih";
import { EKIP_GOREVLERI, kisiBul, paketBul, useVeri, type CanliYayin, type Durum, type EkipGorevi, type Gelisme, type NextDayPlan, type Paket } from "../../veri";
import { CanliFormu, GelismeFormu, GorevlendirmeFormu } from "./Formlar";

/**
 * Next Day planının bölümleri, promptun 4.3 maddesindeki ve kurumun
 * bugünkü çıktısındaki sırayla. Her bölüm açılıp kapanan bir kart; plan
 * kilitliyse (onaylandı ya da devralındı) düzenleme düğmeleri görünmüyor.
 *
 * Bölümler kapalı açılıyor: plan uzun, planlamacı o an hangi bölümde
 * çalışıyorsa onu açıyor. Başlıktaki sayı kapalıyken de neyin olduğunu
 * söylüyor.
 */

export function Bolum({ no, baslik, ek, children }: { no: number | string; baslik: string; ek?: ReactNode; children: ReactNode }) {
  return (
    <details className="bolum">
      <summary>
        <span className="no">{no}</span>
        {baslik}
        {ek && <span className="ek">{ek}</span>}
        <ChevronDown size={18} className="ok" />
      </summary>
      <div className="bolum-govde">{children}</div>
    </details>
  );
}

export function IkonDugme({ ikon, etiket, onClick, ton = "" }: { ikon: ReactNode; etiket: string; onClick: () => void; ton?: string }) {
  return (
    <button type="button" className={`dugme dugme-sade dugme-ikon ${ton}`} onClick={onClick} title={etiket} aria-label={etiket}>
      {ikon}
    </button>
  );
}

/*
 * Önceki günden gelip dokunulmamış kayıt hafif fonlu ("onceki" sınıfı).
 * Düğme kaydı değiştirmeden bugünün kaydı sayıyor; düzenlemek de fonu
 * kaldırıyor.
 */
export const oncekiSinif = (onceki: boolean | undefined, sinif: string) => (onceki ? `${sinif} onceki` : sinif);

export function OncekiDugmesi({ planId, hedef }: { planId: string; hedef: OncekiHedef }) {
  const { t } = useDil();
  const ben = useBen();
  return <IkonDugme ikon={<Check size={15} />} etiket={t("bugunDeGecerli")} onClick={() => ben && oncekiOnayla(ben, planId, hedef)} />;
}

export function EkleDugmesi({ metin, onClick }: { metin: string; onClick: () => void }) {
  return (
    <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={onClick}>
      <Plus size={14} /> {metin}
    </button>
  );
}

/* --- 1. Çalışma ekibi --- */

/** Ekibe kişi ekleme: plan ekranında bölümün altında, belgede pencerede. */
export function EkipEkleFormu({ plan, gorev: ilkGorev, kapat }: { plan: NextDayPlan; gorev?: EkipGorevi; kapat: () => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [kisiId, setKisiId] = useState("");
  const [gorev, setGorev] = useState<EkipGorevi>(ilkGorev ?? "bultenYapimcisi");
  const [vardiya, setVardiya] = useState("08:00");
  // Görev seçilince listede yalnız o pozisyondaki personel: ekip görevi kişinin unvanından (varsayilanEkipGorevi).
  const adaylar = v.kisiler
    .filter((k) => k.birim !== "muhabir" && !plan.ekip.some((e) => e.kisiId === k.id) && varsayilanEkipGorevi(k.gorev, k.birim) === gorev)
    .sort((a, b) => ad(a).localeCompare(ad(b)));

  const kaydet = () => {
    if (!ben || !kisiId) return;
    ekipEkle(ben, plan.id, { kisiId, gorev, vardiya });
    kapat();
  };

  return (
    <div className="form form-kutu ara-ust-2">
      <div className="satir">
        <label>
          {t("personel")}
          <select value={kisiId} onChange={(e) => setKisiId(e.target.value)}>
            <option value="">{t(adaylar.length ? "seciniz" : "gorevdePersonelYok")}</option>
            {adaylar.map((k) => (
              <option key={k.id} value={k.id}>
                {ad(k)} · {t(GOREV_ADI[k.gorev])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("gorev")}
          <select
            value={gorev}
            onChange={(e) => {
              setGorev(e.target.value as EkipGorevi);
              // Seçili kişi yeni görevin listesinde yok; boş kalsın ki yanlış görevle eklenmesin.
              setKisiId("");
            }}
          >
            {EKIP_GOREVLERI.map((x) => (
              <option key={x} value={x}>
                {t(EKIP_GOREV_ADI[x])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("vardiyaGmt")}
          <input type="time" value={vardiya} onChange={(e) => setVardiya(e.target.value)} />
        </label>
      </div>
      <div className="form-alt">
        <button className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
          {t("iptal")}
        </button>
        <button className="dugme dugme-kucuk" onClick={kaydet} disabled={!kisiId}>
          {t("ekle")}
        </button>
      </div>
    </div>
  );
}

export function EkipBolumu({ plan, duzenler }: { plan: NextDayPlan; duzenler: boolean }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [ekle, setEkle] = useState(false);

  return (
    <Bolum no={1} baslik={t("calismaEkibi")} ek={t("kisiSayisi", { n: plan.ekip.length })}>
      {plan.ekip.length === 0 && <Bos kucuk metin={t("ekipBos")} />}
      {EKIP_GOREVLERI.map((g) => {
        const uyeler = plan.ekip.filter((e) => e.gorev === g);
        if (!uyeler.length) return null;
        return (
          <div key={g} className="ara-ust-2">
            <div className="alan-etiket">{t(EKIP_GOREV_ADI[g])}</div>
            <div className="cipler ara-ust">
              {uyeler.map((e) => {
                const k = kisiBul(v, e.kisiId);
                return (
                  <span key={e.kisiId} className={oncekiSinif(e.onceki, "cip")} title={e.onceki ? t("oncekiGunden") : undefined}>
                    <Avatar kisi={k} boy="kucuk" />
                    {k ? ad(k) : "?"}
                    {duzenler ? (
                      <>
                        <input
                          className="girdi vardiya-girdi"
                          type="time"
                          value={e.vardiya}
                          aria-label={t("vardiya")}
                          onChange={(x) => ben && ekipGuncelle(ben, plan.id, e.kisiId, { vardiya: x.target.value })}
                        />
                        <select className="girdi gorev-secici" value={e.gorev} aria-label={t("gorev")} onChange={(x) => ben && ekipGuncelle(ben, plan.id, e.kisiId, { gorev: x.target.value as EkipGorevi })}>
                          {EKIP_GOREVLERI.map((x) => (
                            <option key={x} value={x}>
                              {t(EKIP_GOREV_ADI[x])}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => ben && ekipCikar(ben, plan.id, e.kisiId)} aria-label={t("cikar")} title={t("cikar")}>
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <Rozet>{vardiyaYaz(e.vardiya)}</Rozet>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
      {duzenler &&
        (ekle ? (
          <EkipEkleFormu plan={plan} kapat={() => setEkle(false)} />
        ) : (
          <div className="ara-ust-2">
            <EkleDugmesi metin={t("ekibeEkle")} onClick={() => setEkle(true)} />
          </div>
        ))}
    </Bolum>
  );
}

/* --- 2. Muhabir hareketleri ve izinleri --- */

/** O güne düşen, plana henüz bağlanmamış hareketler; seçilen plana bağlanıyor. */
export function KayitliHareketSecici({ plan, kapat }: { plan: NextDayPlan; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const ben = useBen();
  const eklenebilir = v.gorevlendirmeler.filter((g) => !plan.gorevlendirmeler.includes(g.id) && g.bitis >= plan.tarih && g.baslangic <= plan.tarih);
  return (
    <div className="form form-kutu ara-ust-2">
      {eklenebilir.length === 0 ? (
        <Bos kucuk metin={t("kayitYok")} />
      ) : (
        eklenebilir.map((g) => {
          const k = kisiBul(v, g.kisiId);
          return (
            <div key={g.id} className="dugmeler">
              <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => ben && planGorevlendirmeEkle(ben, plan.id, g.id)} aria-label={t("ekle")}>
                <Plus size={14} />
              </button>
              <Icerik>{satir(g.yer, kisiAr(k))}</Icerik> · {t(HAREKET_TURU_ADI[g.tur])}
            </div>
          );
        })
      )}
      <div className="form-alt">
        <button className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
          {t("kapat")}
        </button>
      </div>
    </div>
  );
}

export function HareketBolumu({ plan, duzenler }: { plan: NextDayPlan; duzenler: boolean }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [form, setForm] = useState<"" | "yeni" | "mevcut">("");
  const bagli = plan.gorevlendirmeler.map((id) => v.gorevlendirmeler.find((g) => g.id === id)).filter((g) => g !== undefined);
  return (
    <Bolum no={2} baslik={t("muhabirHareketleri")} ek={String(bagli.length)}>
      {bagli.length === 0 ? (
        <Bos kucuk metin={t("kayitYok")} />
      ) : (
        bagli.map((g) => {
          const k = kisiBul(v, g.kisiId);
          const onceki = plan.oncekiHareketler?.includes(g.id);
          return (
            <div key={g.id} className={oncekiSinif(onceki, "kayit")} title={onceki ? t("oncekiGunden") : undefined}>
              <div className="kayit-bas">
                <Avatar kisi={k} boy="kucuk" />
                <div>
                  <b>
                    <Icerik blok>{satir(g.yer, kisiAr(k))}</Icerik>
                  </b>
                  <Icerik blok className="kayit-metin">
                    {g.aciklama}
                  </Icerik>
                  <small>
                    <Rozet>{t(HAREKET_TURU_ADI[g.tur])}</Rozet>
                    {tarihYaz(g.baslangic, dil, "kisa")} – {tarihYaz(g.bitis, dil, "kisa")}
                  </small>
                </div>
                {duzenler && (
                  <div className="islemler">
                    {onceki && <OncekiDugmesi planId={plan.id} hedef={{ hareket: g.id }} />}
                    <IkonDugme ikon={<Trash2 size={15} />} etiket={t("plandanCikar")} onClick={() => ben && planGorevlendirmeCikar(ben, plan.id, g.id)} />
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
      {duzenler && form === "yeni" && <GorevlendirmeFormu plan={plan} kapat={() => setForm("")} />}
      {duzenler && form === "mevcut" && <KayitliHareketSecici plan={plan} kapat={() => setForm("")} />}
      {duzenler && !form && (
        <div className="dugmeler ara-ust-2">
          <EkleDugmesi metin={t("yeniHareket")} onClick={() => setForm("yeni")} />
          <EkleDugmesi metin={t("kayitliHareketEkle")} onClick={() => setForm("mevcut")} />
        </div>
      )}
    </Bolum>
  );
}

/* --- 3. Canlı yayınlar ve etkinlikler (başlığa bağlı olmayanlar) --- */

export function CanliListesi({ plan, canlilar, duzenler, planBaslikId }: { plan: NextDayPlan; canlilar: CanliYayin[]; duzenler: boolean; planBaslikId?: string }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [form, setForm] = useState<string>("");
  return (
    <>
      {canlilar.length === 0 && form !== "yeni" && <Bos kucuk metin={t("kayitYok")} />}
      {canlilar
        .sort((a, b) => (a.tarih + a.saatGmt).localeCompare(b.tarih + b.saatGmt))
        .map((c) =>
          form === c.id ? (
            <CanliFormu key={c.id} plan={plan} planBaslikId={planBaslikId} mevcut={c} kapat={() => setForm("")} />
          ) : (
            <div key={c.id} className={oncekiSinif(c.onceki, "kayit")} title={c.onceki ? t("oncekiGunden") : undefined}>
              <div className="kayit-bas">
                <div>
                  <b>
                    <Icerik blok>{satir(c.yer, c.konu, c.saatGmt ? `${c.saatGmt} GMT` : "TBC")}</Icerik>
                  </b>
                  <Icerik blok className="kayit-metin">
                    {[c.aciklama, c.notlar].filter(Boolean).join(" · ")}
                  </Icerik>
                  <small>
                    {c.tarih !== plan.tarih && <Rozet ton="uyari">{tarihYaz(c.tarih, dil, "kisa")}</Rozet>}
                    {c.muhabirId && <span>{ad(kisiBul(v, c.muhabirId))}</span>}
                  </small>
                </div>
                {duzenler && (
                  <div className="islemler">
                    {c.onceki && <OncekiDugmesi planId={plan.id} hedef={{ canli: c.id }} />}
                    <IkonDugme ikon={<Pencil size={15} />} etiket={t("duzenle")} onClick={() => setForm(c.id)} />
                    <IkonDugme ikon={<Trash2 size={15} />} etiket={t("sil")} onClick={() => ben && confirm(t("silinsinMi")) && canliSil(ben, c.id)} />
                  </div>
                )}
              </div>
            </div>
          ),
        )}
      {duzenler && form === "yeni" && <CanliFormu plan={plan} planBaslikId={planBaslikId} kapat={() => setForm("")} />}
      {duzenler && !form && (
        <div className="ara-ust-2">
          <EkleDugmesi metin={t("canliEkle")} onClick={() => setForm("yeni")} />
        </div>
      )}
    </>
  );
}

export function CanliBolumu({ plan, duzenler, d }: { plan: NextDayPlan; duzenler: boolean; d: Durum }) {
  const { t } = useDil();
  const canlilar = d.canliYayinlar.filter((c) => c.planId === plan.id && !c.planBaslikId);
  return (
    <Bolum no={3} baslik={t("canliYayinlar")} ek={String(canlilar.length)}>
      <CanliListesi plan={plan} canlilar={canlilar} duzenler={duzenler} />
    </Bolum>
  );
}

/* --- 4. Hazır paketler: stoktan seçiliyor; ŞEHİR / BAŞLIK / MUHABİR --- */

/*
 * Stoktaki paket (bitmiş feature, ekonomi ya da günü olmayan haber) plana
 * seçiliyor; plan Newsdesk'e devredilince yayınlanmış sayılıp stoktan
 * düşüyor. Çıktıdaki "التقارير الجاهزة" bölümü bunlar.
 */
function HazirSatiri({ p, d }: { p: Paket; d: Durum }) {
  const { t } = useDil();
  return (
    <>
      <a href={`#/paketler/${p.id}`} className="kalin-bag">
        <Icerik blok>{satir(sehirAr(p.sehir), p.baslik, kisiAr(kisiBul(d, p.muhabirId)))}</Icerik>
      </a>
      <Icerik blok className="kayit-metin">
        {p.aciklama}
      </Icerik>
      <small>
        <TurRozeti tur={p.tur} />
        {p.slug && (
          <span dir="ltr" className="slug">
            {p.slug}
          </span>
        )}
        {p.sure && <span>· {p.sure}</span>}
        {stokDurumu(p) === "yayinlandi" && <Rozet ton="iyi">{t("sdYayinlandi")}</Rozet>}
      </small>
    </>
  );
}

/** Stoktaki, plana henüz seçilmemiş paketler. */
export function StoktanSecici({ plan, d, kapat }: { plan: NextDayPlan; d: Durum; kapat: () => void }) {
  const { t } = useDil();
  const ben = useBen();
  const stokta = d.paketler.filter((p) => stokDurumu(p) === "stokta" && !plan.hazirPaketler.includes(p.id));
  return (
    <div className="form form-kutu ara-ust-2">
      <div className="alan-etiket">{t("stoktakiPaketler")}</div>
      {stokta.length === 0 && <Bos kucuk metin={t("stokBos")} />}
      {stokta.map((p) => (
        <div key={p.id} className="kayit">
          <div className="kayit-bas">
            <div>
              <HazirSatiri p={p} d={d} />
            </div>
            <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => ben && hazirPaketEkle(ben, plan.id, p.id)}>
              <Plus size={14} /> {t("sec")}
            </button>
          </div>
        </div>
      ))}
      <div className="form-alt">
        <button className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
          {t("kapat")}
        </button>
      </div>
    </div>
  );
}

export function HazirBolumu({ plan, duzenler, d }: { plan: NextDayPlan; duzenler: boolean; d: Durum }) {
  const { t } = useDil();
  const ben = useBen();
  const [sec, setSec] = useState(false);
  const secili = plan.hazirPaketler.map((id) => paketBul(d, id)).filter((p): p is Paket => !!p);
  return (
    <Bolum no={4} baslik={t("hazirPaketler")} ek={String(secili.length)}>
      {secili.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
      {secili.map((p) => (
        <div key={p.id} className="kayit">
          <div className="kayit-bas">
            <div>
              <HazirSatiri p={p} d={d} />
            </div>
            {duzenler && (
              <div className="islemler">
                <IkonDugme ikon={<Trash2 size={15} />} etiket={t("plandanCikar")} onClick={() => ben && hazirPaketCikar(ben, plan.id, p.id)} />
              </div>
            )}
          </div>
        </div>
      ))}
      {duzenler &&
        (sec ? (
          <StoktanSecici plan={plan} d={d} kapat={() => setSec(false)} />
        ) : (
          <div className="ara-ust-2">
            <EkleDugmesi metin={t("stoktanSec")} onClick={() => setSec(true)} />
          </div>
        ))}
    </Bolum>
  );
}

/** Habere başlık: havuzdan seç ya da havuza yeni başlık aç. Belgede "altına ekle" ile `sonra` geliyor. */
export function BaslikEkleFormu({ plan, sonra, kapat }: { plan: NextDayPlan; sonra?: string; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [yeni, setYeni] = useState("");
  const plandakiler = new Set(plan.basliklar.map((b) => b.baslikId));
  const havuz = v.basliklar.filter((b) => b.aktif && !plandakiler.has(b.id));

  const yeniEkle = () => {
    if (!ben || !yeni.trim()) return;
    const id = baslikEkle(ben, yeni);
    if (id) planBaslikEkle(ben, plan.id, id, sonra);
    setYeni("");
    kapat();
  };

  return (
    <div className="form form-kutu ara-ust-2">
      <div className="alan-etiket">{t("baslikHavuzu")}</div>
      <div className="cipler">
        {havuz.map((b) => (
          <button
            key={b.id}
            className="dugme dugme-ikincil dugme-kucuk"
            onClick={() => {
              if (ben) planBaslikEkle(ben, plan.id, b.id, sonra);
              // Belgede tek başlık ekleniyor; plan ekranında arka arkaya seçilebilsin diye form açık kalıyor.
              if (sonra !== undefined) kapat();
            }}
          >
            <Plus size={13} /> <Icerik>{b.ad}</Icerik>
          </button>
        ))}
      </div>
      <div className="satir">
        <label>
          {t("havuzaYeniBaslik")}
          <input {...icerikAlani} value={yeni} onChange={(e) => setYeni(e.target.value)} placeholder={metin("yeniBaslikIpucu", "ar")} onKeyDown={(e) => e.key === "Enter" && yeniEkle()} />
        </label>
      </div>
      <div className="form-alt">
        <button className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
          {t("kapat")}
        </button>
        <button className="dugme dugme-kucuk" onClick={yeniEkle} disabled={!yeni.trim()}>
          {t("olusturVeEkle")}
        </button>
      </div>
    </div>
  );
}

/* --- Gelişme satırı: başlık altında da takiplerde de aynı --- */

export function GelismeListesi({ plan, gelismeler, duzenler, planBaslikId }: { plan: NextDayPlan; gelismeler: Gelisme[]; duzenler: boolean; planBaslikId?: string }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [form, setForm] = useState("");
  return (
    <>
      {gelismeler.length === 0 && form !== "yeni" && <Bos kucuk metin={t("gelismeYok")} />}
      {gelismeler.map((g) =>
        form === g.id ? (
          <GelismeFormu key={g.id} plan={plan} planBaslikId={planBaslikId} mevcut={g} kapat={() => setForm("")} />
        ) : (
          <div key={g.id} className={oncekiSinif(g.onceki, "kayit")} title={g.onceki ? t("oncekiGunden") : undefined}>
            <div className="kayit-bas">
              <div>
                <Icerik blok className="kayit-metin">
                  {(g.yer || g.onerenId) && <b>{g.yer || sehirAr(kisiBul(v, g.onerenId)?.sehir)} / </b>}
                  {g.metin}
                </Icerik>
                <small>
                  <Rozet>{t(KAYNAK_ADI[g.kaynakTuru])}</Rozet>
                  {g.kaynakAdi && <Icerik>{g.kaynakAdi}</Icerik>}
                  {g.onerenId && <span>· {ad(kisiBul(v, g.onerenId))}</span>}
                  <span>
                    · {tarihYaz(yerelGun(g.tarih), dil, "kisa")} {saatYaz(g.tarih, dil)}
                  </span>
                </small>
              </div>
              {duzenler && (
                <div className="islemler">
                  {g.onceki && <OncekiDugmesi planId={plan.id} hedef={{ gelisme: g.id }} />}
                  <IkonDugme ikon={<Pencil size={15} />} etiket={t("duzenle")} onClick={() => setForm(g.id)} />
                  <IkonDugme ikon={<Trash2 size={15} />} etiket={t("sil")} onClick={() => ben && confirm(t("silinsinMi")) && gelismeSil(ben, g.id)} />
                </div>
              )}
            </div>
          </div>
        ),
      )}
      {duzenler && form === "yeni" && <GelismeFormu plan={plan} planBaslikId={planBaslikId} kapat={() => setForm("")} />}
      {duzenler && !form && (
        <div className="ara-ust-2">
          <EkleDugmesi metin={t("gelismeEkle")} onClick={() => setForm("yeni")} />
        </div>
      )}
    </>
  );
}

/* --- Takipler (متابعات): başlığa bağlı olmayan gelişmeler --- */

export function TakipBolumu({ plan, duzenler, d, no }: { plan: NextDayPlan; duzenler: boolean; d: Durum; no: number }) {
  const { t } = useDil();
  const takipler = d.gelismeler.filter((g) => g.planId === plan.id && !g.planBaslikId);
  return (
    <Bolum no={no} baslik={t("takipler")} ek={String(takipler.length)}>
      <p className="aciklama">{t("takiplerAciklama")}</p>
      <GelismeListesi plan={plan} gelismeler={takipler} duzenler={duzenler} />
    </Bolum>
  );
}
