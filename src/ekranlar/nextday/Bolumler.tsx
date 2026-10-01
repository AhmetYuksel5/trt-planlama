import { ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar, Bos, Rozet } from "../../bilesenler/Parcalar";
import { saatYaz, tarihYaz, useDil } from "../../dil";
import { canliSil, ekipCikar, ekipEkle, ekipGuncelle, gelismeSil, hazirPaketCikar, hazirPaketEkle, planGorevlendirmeCikar, planGorevlendirmeEkle } from "../../eylemler";
import { EKIP_GOREV_ADI, GOREV_ADI, HAREKET_TURU_ADI, KAYNAK_ADI, sehirAdi, varsayilanEkipGorevi } from "../../etiketler";
import { useBen } from "../../oturum";
import { vardiyaYaz, yerelGun } from "../../tarih";
import { EKIP_GOREVLERI, kisiBul, useVeri, type CanliYayin, type Durum, type EkipGorevi, type Gelisme, type NextDayPlan } from "../../veri";
import { CanliFormu, GelismeFormu, GorevlendirmeFormu } from "./Formlar";

/**
 * Next Day planının bölümleri, promptun 4.3 maddesindeki ve kurumun
 * bugünkü çıktısındaki sırayla. Her bölüm açılıp kapanan bir kart; plan
 * kilitliyse (onaylandı ya da devralındı) düzenleme düğmeleri görünmüyor.
 */

export function Bolum({ no, baslik, ek, children, acik = true }: { no: number | string; baslik: string; ek?: ReactNode; children: ReactNode; acik?: boolean }) {
  return (
    <details className="bolum" open={acik}>
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

export function EkleDugmesi({ metin, onClick }: { metin: string; onClick: () => void }) {
  return (
    <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={onClick}>
      <Plus size={14} /> {metin}
    </button>
  );
}

/* --- 1. Çalışma ekibi --- */

export function EkipBolumu({ plan, duzenler }: { plan: NextDayPlan; duzenler: boolean }) {
  const { t, y } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [ekle, setEkle] = useState(false);
  const [kisiId, setKisiId] = useState("");
  const [gorev, setGorev] = useState<EkipGorevi>("bultenYapimcisi");
  const [vardiya, setVardiya] = useState("08:00");
  const adaylar = v.kisiler
    .filter((k) => k.birim !== "muhabir" && !plan.ekip.some((e) => e.kisiId === k.id))
    .sort((a, b) => y(a.ad).localeCompare(y(b.ad)));

  const kaydet = () => {
    if (!ben || !kisiId) return;
    ekipEkle(ben, plan.id, { kisiId, gorev, vardiya });
    setKisiId("");
    setEkle(false);
  };

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
                  <span key={e.kisiId} className="cip">
                    <Avatar kisi={k} boy="kucuk" />
                    {k ? y(k.ad) : "?"}
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
          <div className="form form-kutu ara-ust-2">
            <div className="satir">
              <label>
                {t("personel")}
                <select
                  value={kisiId}
                  onChange={(e) => {
                    setKisiId(e.target.value);
                    const k = kisiBul(v, e.target.value);
                    if (k) setGorev(varsayilanEkipGorevi(k.gorev, k.birim));
                  }}
                >
                  <option value="">{t("seciniz")}</option>
                  {adaylar.map((k) => (
                    <option key={k.id} value={k.id}>
                      {y(k.ad)} · {t(GOREV_ADI[k.gorev])}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("gorev")}
                <select value={gorev} onChange={(e) => setGorev(e.target.value as EkipGorevi)}>
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
              <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setEkle(false)}>
                {t("iptal")}
              </button>
              <button className="dugme dugme-kucuk" onClick={kaydet} disabled={!kisiId}>
                {t("ekle")}
              </button>
            </div>
          </div>
        ) : (
          <div className="ara-ust-2">
            <EkleDugmesi metin={t("ekibeEkle")} onClick={() => setEkle(true)} />
          </div>
        ))}
    </Bolum>
  );
}

/* --- 2. Muhabir hareketleri ve izinleri --- */

export function HareketBolumu({ plan, duzenler }: { plan: NextDayPlan; duzenler: boolean }) {
  const { t, y, dil } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [form, setForm] = useState<"" | "yeni" | "mevcut">("");
  const bagli = plan.gorevlendirmeler.map((id) => v.gorevlendirmeler.find((g) => g.id === id)).filter((g) => g !== undefined);
  const eklenebilir = v.gorevlendirmeler.filter((g) => !plan.gorevlendirmeler.includes(g.id) && g.bitis >= plan.tarih && g.baslangic <= plan.tarih);
  return (
    <Bolum no={2} baslik={t("muhabirHareketleri")} ek={String(bagli.length)}>
      {bagli.length === 0 ? (
        <Bos kucuk metin={t("kayitYok")} />
      ) : (
        bagli.map((g) => {
          const k = kisiBul(v, g.kisiId);
          return (
            <div key={g.id} className="kayit">
              <div className="kayit-bas">
                <Avatar kisi={k} boy="kucuk" />
                <div>
                  <b>
                    {y(g.yer)} / {k ? y(k.ad) : ""}
                  </b>
                  <small>
                    <Rozet>{t(HAREKET_TURU_ADI[g.tur])}</Rozet>
                    {tarihYaz(g.baslangic, dil, "kisa")} – {tarihYaz(g.bitis, dil, "kisa")}
                    {y(g.aciklama) && <span>· {y(g.aciklama)}</span>}
                  </small>
                </div>
                {duzenler && (
                  <div className="islemler">
                    <IkonDugme ikon={<Trash2 size={15} />} etiket={t("plandanCikar")} onClick={() => ben && planGorevlendirmeCikar(ben, plan.id, g.id)} />
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
      {duzenler && form === "yeni" && <GorevlendirmeFormu plan={plan} kapat={() => setForm("")} />}
      {duzenler && form === "mevcut" && (
        <div className="form form-kutu ara-ust-2">
          {eklenebilir.length === 0 ? (
            <Bos kucuk metin={t("kayitYok")} />
          ) : (
            eklenebilir.map((g) => {
              const k = kisiBul(v, g.kisiId);
              return (
                <div key={g.id} className="dugmeler">
                  <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => ben && planGorevlendirmeEkle(ben, plan.id, g.id)}>
                    <Plus size={14} />
                  </button>
                  {y(g.yer)} / {k ? y(k.ad) : ""} · {t(HAREKET_TURU_ADI[g.tur])}
                </div>
              );
            })
          )}
          <div className="form-alt">
            <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setForm("")}>
              {t("kapat")}
            </button>
          </div>
        </div>
      )}
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
  const { t, y, dil } = useDil();
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
            <div key={c.id} className="kayit">
              <div className="kayit-bas">
                <div>
                  <b>
                    {y(c.yer)} / {y(c.konu)} / {c.saatGmt ? `${c.saatGmt} GMT` : "TBC"}
                  </b>
                  <small>
                    {c.tarih !== plan.tarih && <Rozet ton="uyari">{tarihYaz(c.tarih, dil, "kisa")}</Rozet>}
                    {c.muhabirId && <span>{y(kisiBul(v, c.muhabirId)?.ad ?? "")}</span>}
                    {y(c.aciklama) && <span>· {y(c.aciklama)}</span>}
                    {y(c.notlar) && <span>· {y(c.notlar)}</span>}
                  </small>
                </div>
                {duzenler && (
                  <div className="islemler">
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

/* --- 4. Hazır paketler: arşivden seçiliyor; ŞEHİR / BAŞLIK / MUHABİR --- */

export function HazirBolumu({ plan, duzenler, d }: { plan: NextDayPlan; duzenler: boolean; d: Durum }) {
  const { t, y } = useDil();
  const ben = useBen();
  const [sec, setSec] = useState(false);
  const secili = plan.hazirPaketler.map((id) => d.hazirPaketler.find((h) => h.id === id)).filter((h) => h !== undefined);
  const arsiv = d.hazirPaketler.filter((h) => !plan.hazirPaketler.includes(h.id));
  const satir = (h: (typeof secili)[number]) => (
    <>
      <b>
        {t(sehirAdi(h.sehir))} / {y(h.baslik)} / {y(kisiBul(d, h.muhabirId)?.ad ?? "")}
      </b>
      <small>
        {y(h.aciklama)} · {h.sure}
      </small>
      <small dir="ltr" className="slug">
        {h.slug}
      </small>
    </>
  );
  return (
    <Bolum no={4} baslik={t("hazirPaketler")} ek={String(secili.length)}>
      {secili.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
      {secili.map((h) => (
        <div key={h.id} className="kayit">
          <div className="kayit-bas">
            <div>{satir(h)}</div>
            {duzenler && (
              <div className="islemler">
                <IkonDugme ikon={<Trash2 size={15} />} etiket={t("plandanCikar")} onClick={() => ben && hazirPaketCikar(ben, plan.id, h.id)} />
              </div>
            )}
          </div>
        </div>
      ))}
      {duzenler &&
        (sec ? (
          <div className="form form-kutu ara-ust-2">
            <div className="alan-etiket">{t("paketArsivi")}</div>
            {arsiv.map((h) => (
              <div key={h.id} className="kayit">
                <div className="kayit-bas">
                  <div>{satir(h)}</div>
                  <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => ben && hazirPaketEkle(ben, plan.id, h.id)}>
                    <Plus size={14} /> {t("sec")}
                  </button>
                </div>
              </div>
            ))}
            <div className="form-alt">
              <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setSec(false)}>
                {t("kapat")}
              </button>
            </div>
          </div>
        ) : (
          <div className="ara-ust-2">
            <EkleDugmesi metin={t("arsivdenSec")} onClick={() => setSec(true)} />
          </div>
        ))}
    </Bolum>
  );
}

/* --- Gelişme satırı: başlık altında da takiplerde de aynı --- */

export function GelismeListesi({ plan, gelismeler, duzenler, planBaslikId }: { plan: NextDayPlan; gelismeler: Gelisme[]; duzenler: boolean; planBaslikId?: string }) {
  const { t, y, dil } = useDil();
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
          <div key={g.id} className="kayit">
            <div className="kayit-bas">
              <div>
                <p>
                  {(g.yer || g.onerenId) && <b className="satir-ici">{g.yer ? y(g.yer) : t(sehirAdi(kisiBul(v, g.onerenId)?.sehir ?? "istanbul"))} / </b>}
                  {y(g.metin)}
                </p>
                <small>
                  <Rozet>{t(KAYNAK_ADI[g.kaynakTuru])}</Rozet>
                  {g.kaynakAdi && <span>{g.kaynakAdi}</span>}
                  {g.onerenId && <span>· {y(kisiBul(v, g.onerenId)?.ad ?? "")}</span>}
                  <span>
                    · {tarihYaz(yerelGun(g.tarih), dil, "kisa")} {saatYaz(g.tarih, dil)}
                  </span>
                </small>
              </div>
              {duzenler && (
                <div className="islemler">
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
