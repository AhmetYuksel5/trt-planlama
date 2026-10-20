import { Binoculars, BriefcaseBusiness, CircleUser, Lightbulb, Pencil, Plus, RotateCcw, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { Avatar, Bos, Icerik, Kart, Pencere, Rozet, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { OneriDurumRozeti } from "../bilesenler/Tablolar";
import { WhatsAppDugmesi } from "../bilesenler/WhatsApp";
import { metin, tarihYaz, useDil } from "../dil";
import { takipGelismeEkle, takipKapat, takipKaydet, takipPlanda, takipSil, ulkesi } from "../eylemler";
import { TAKIP_TUR_ADI, sehirAdi } from "../etiketler";
import { bugun, gunEkle } from "../tarih";
import { TAKIP_BICIMI, TAKIP_TURLERI, kisiBul, useVeri, type Durum, type Kisi, type NextDayPlan, type Oneri, type Takip, type TakipTuru } from "../veri";
import { oneriArsivde, oneriSonGunu } from "../oneriPlanlari";
import { git } from "../yol";
import { OneriKarti } from "./oneri/OneriKarti";
import PlanaEkle from "./oneri/PlanaEkle";
import { muhabireOneriGonderebilir, oneriGorebilir, planIcerikDuzenler, planOperasyonDuzenler, takipEkleyebilir, takipGorebilir, yapabilir } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";
import { ElleOneriFormu } from "./oneri/OneriFormu";
import { MuhabireOneriPenceresi } from "./oneri/Yazisma";

/**
 * Takipler (`#/takipler`): muhabirin izlediği güncel konular. Muhabir
 * kendi takiplerini girer ("takip ediyorum"); Planlama ve Yönetim bütün
 * muhabirlerinkini görür, muhabire WhatsApp'tan ulaşır ya da takibi tek
 * basışla muhabire iş önerisine (paket ya da başka haber türü) çevirir.
 * Takip iş değil bilgilendirme: karar düğmesi yok, dönüşünce öneri
 * bilinen akışa (muhabirin kabulü, Planlama'nın değerlendirmesi) giriyor.
 */

const TUR_ADI = TAKIP_TUR_ADI;

/* Yaklaşan günlü takip önce, süregelenler en son eklenen önce. */
const sirala = (a: Takip, b: Takip) => (a.tarih ?? "9999").localeCompare(b.tarih ?? "9999") || b.zaman.localeCompare(a.zaman);

export default function Takipler({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const muhabir = ben.birim === "muhabir";
  const [form, setForm] = useState<Takip | "yeni" | null>(null);
  const v = useVeri();
  const liste = v.takipler.filter((x) => takipGorebilir(ben, x)).sort(sirala);
  const acik = liste.filter((x) => !x.kapandi);
  const biten = liste.filter((x) => x.kapandi);
  const oneriler = takipOnerileri(ben, v);
  return (
    <>
      <SayfaBasi
        ikon={<Binoculars size={26} />}
        baslik={t(muhabir ? "mTakiplerim" : "mMuhabirTakipleri")}
        sagUc={
          takipEkleyebilir(ben) && (
            <button type="button" className="dugme" onClick={() => setForm("yeni")} data-takip-ekle>
              <Plus size={16} /> {t("mtEkle")}
            </button>
          )
        }
      />
      {form && <TakipFormu ben={ben} mevcut={form === "yeni" ? undefined : form} kapat={() => setForm(null)} />}
      <Kart baslik={t(muhabir ? "mTakiplerim" : "mMuhabirTakipleri")} ek={String(acik.length + oneriler.length)}>
        {oneriler.length > 0 && <TakipOnerileri ben={ben} liste={oneriler} />}
        {acik.length ? (
          <div className="takip-listesi" data-takipler>
            {acik.map((x) => (
              <TakipKarti key={x.id} ben={ben} takip={x} duzenle={() => setForm(x)} />
            ))}
          </div>
        ) : (
          !oneriler.length && <Bos metin={t("mtYok")} />
        )}
      </Kart>
      {biten.length > 0 && (
        <Kart baslik={t("mtBiten")} ek={String(biten.length)}>
          <div className="takip-listesi" data-biten-takipler>
            {biten.map((x) => (
              <TakipKarti key={x.id} ben={ben} takip={x} />
            ))}
          </div>
        </Kart>
      )}
    </>
  );
}

function TakipFormu({ ben, mevcut, kapat }: { ben: Kisi; mevcut?: Takip; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({ konu: mevcut?.konu ?? "", aciklama: mevcut?.aciklama ?? "", tur: mevcut?.tur ?? ("olay" as TakipTuru), tarih: mevcut?.tarih ?? "" });
  const kaydet = () => {
    if (takipKaydet(ben, { id: mevcut?.id, ...f })) {
      bildir(t("mtKaydedildi"));
      kapat();
    }
  };
  return (
    <Kart baslik={t(mevcut ? "duzenle" : "mtEkle")}>
      <div className="form" data-takip-formu>
        <div className="satir">
          <label>
            {t("mtTur")}
            <select value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as TakipTuru })} data-takip-tur>
              {TAKIP_TURLERI.map((x) => (
                <option key={x} value={x}>
                  {t(TUR_ADI[x])}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("mtTarih")} <span className="ipucu">{t("varsa")}</span>
            <input type="date" value={f.tarih} min={mevcut?.tarih && mevcut.tarih < bugun() ? mevcut.tarih : bugun()} onChange={(e) => setF({ ...f, tarih: e.target.value })} data-takip-tarih />
          </label>
        </div>
        <label>
          {t("mtKonu")}
          <input {...icerikAlani} value={f.konu} onChange={(e) => setF({ ...f, konu: e.target.value })} placeholder={metin("mtKonuIpucu", "ar")} data-takip-konu />
        </label>
        <label>
          {t("mtAciklama")} <span className="ipucu">{t("varsa")}</span>
          <textarea {...icerikAlani} value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} data-takip-aciklama />
        </label>
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme" disabled={!f.konu.trim()} onClick={kaydet} data-takip-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Kart>
  );
}

function TakipKarti({ ben, takip: x, duzenle, hedefTarih, plan }: { ben: Kisi; takip: Takip; duzenle?: () => void; hedefTarih?: string; plan?: NextDayPlan }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [donustur, setDonustur] = useState(false);
  const [cevir, setCevir] = useState(false);
  const [gelisme, setGelisme] = useState(false);
  const muhabir = kisiBul(v, x.muhabirId);
  const kendi = ben.id === x.muhabirId;
  // Takibin girdiği Next Day planları; muhabir planı okuyamadığı için ona bildirimle gidiyor.
  const planlari = kendi ? [] : [...new Set(v.gelismeler.filter((g) => g.takipId === x.id).map((g) => g.planId))].flatMap((id) => v.planlar.filter((p) => p.id === id));
  const gelismeEklenir = !!plan && !kendi && !x.kapandi && planOperasyonDuzenler(ben, plan) && !takipPlanda(v, x.id, plan.id);
  const isler = v.oneriler.filter((o) => o.takipId === x.id);
  return (
    <article className={`kayit takip${x.kapandi ? " soluk" : ""}`} data-takip={x.id}>
      <div className="kayit-bas">
        {!kendi && <Avatar kisi={muhabir} boy="kucuk" />}
        <div>
          {!kendi && muhabir && (
            <small>
              <a href={`#/muhabirler/${muhabir.id}`}>{ad(muhabir)}</a> · {sehirAdi(x.sehir)}
            </small>
          )}
          <Icerik blok>
            <b>{x.konu}</b>
          </Icerik>
          {x.aciklama && (
            <Icerik blok className="kayit-metin">
              {x.aciklama}
            </Icerik>
          )}
          <small>
            <Rozet>{t(TUR_ADI[x.tur])}</Rozet>
            <span>{x.tarih ? tarihYaz(x.tarih, dil, "tam") : t("mtSurekli")}</span>
            {planlari.map((p) => (
              <a key={p.id} href={`#/nextday/${p.id}`} data-takip-planda={p.id}>
                {t("mtPlanda", { tarih: tarihYaz(p.tarih, dil, "kisa") })}
              </a>
            ))}
            {isler.map((o) => (
              <a key={o.id} href={`#/oneriler/${o.id}`} data-takip-isi={o.id}>
                {t(o.bicim === TAKIP_BICIMI ? "mtOneriyle" : "mtDonustu")} · <OneriDurumRozeti oneri={o} />
              </a>
            ))}
          </small>
        </div>
        <div className="islemler">
          {!kendi && muhabir && <WhatsAppDugmesi telefon={muhabir.telefon} />}
          {!kendi && muhabir && (
            <a className="dugme dugme-sade dugme-ikon" href={`#/muhabirler/${muhabir.id}`} title={t("mtProfil")} aria-label={t("mtProfil")}>
              <CircleUser size={16} />
            </a>
          )}
        </div>
      </div>
      <div className="dugmeler ara-ust">
        {gelismeEklenir && (
          <button type="button" className="dugme dugme-kucuk" onClick={() => setGelisme(true)} data-takip-gelisme>
            <Plus size={14} /> {t("mtGelismeEkle")}
          </button>
        )}
        {/* Planlama takibi kendisi haber önerisine çeviriyor: öneri listesine ve plana bilinen yoldan giriyor. */}
        {!kendi && !x.kapandi && yapabilir(ben, "oneriGonder") && (
          <button type="button" className="dugme dugme-kucuk" onClick={() => setCevir(true)} data-takip-oneriye>
            <Lightbulb size={14} /> {t("mtOneriyeCevir")}
          </button>
        )}
        {!kendi && !x.kapandi && muhabireOneriGonderebilir(ben, v) && (
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setDonustur(true)} data-takip-donustur>
            <BriefcaseBusiness size={14} /> {t("mtIseDonustur")}
          </button>
        )}
        {kendi && duzenle && (
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={duzenle} data-takip-duzenle>
            <Pencil size={14} /> {t("duzenle")}
          </button>
        )}
        {kendi && (
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => takipKapat(ben, x.id, !x.kapandi)} data-takip-bitir>
            {x.kapandi ? <RotateCcw size={14} /> : <Square size={14} />} {t(x.kapandi ? "mtYenidenAc" : "mtBitir")}
          </button>
        )}
        {kendi && (
          <button type="button" className="dugme dugme-sade dugme-kucuk kotu-yazi" onClick={() => confirm(t("silinsinMi")) && takipSil(ben, x.id)} data-takip-sil>
            <Trash2 size={14} /> {t("sil")}
          </button>
        )}
      </div>
      {gelisme && plan && (
        <Pencere baslik={t("mtGelismeEkle")} alt={<Icerik>{x.konu}</Icerik>} kapat={() => setGelisme(false)}>
          <TakipGelismeFormu ben={ben} takip={x} plan={plan} kapat={() => setGelisme(false)} />
        </Pencere>
      )}
      {donustur && <MuhabireOneriPenceresi ben={ben} takip={x} kapat={() => setDonustur(false)} />}
      {cevir && (
        <Pencere baslik={t("mtOneriyeCevirBaslik")} alt={<Icerik>{x.konu}</Icerik>} kapat={() => setCevir(false)}>
          <ElleOneriFormu
            ben={ben}
            hedefTarih={hedefTarih ?? (x.tarih && x.tarih >= bugun() ? x.tarih : gunEkle(bugun(), 1))}
            takipId={x.id}
            baslangic={{ kaynak: "muhabir", muhabirId: x.muhabirId, haberBasligi: x.konu, gelisme: x.aciklama ?? x.konu, ulke: ulkesi(x.sehir) }}
            kaydet={() => setCevir(false)}
            kapat={() => setCevir(false)}
          />
        </Pencere>
      )}
    </article>
  );
}

/*
 * Takibi plandaki başlığın altına gelişme olarak eklemek: plandaki başlıklar
 * ya da yeni başlık (takibin konusuyla açılır; havuzda aynı adlı varsa o).
 */
function TakipGelismeFormu({ ben, takip: x, plan, kapat }: { ben: Kisi; takip: Takip; plan: NextDayPlan; kapat: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [baslikId, setBaslikId] = useState(plan.basliklar[0]?.baslikId ?? "yeni");
  const [yeniBaslik, setYeniBaslik] = useState(x.konu);
  const ekle = () => {
    if (!takipGelismeEkle(ben, x.id, baslikId === "yeni" ? { planId: plan.id, yeniBaslik } : { planId: plan.id, baslikId })) return;
    bildir(t("bTakipPlanda", { tarih: tarihYaz(plan.tarih, dil, "kisa") }));
    kapat();
  };
  return (
    <div className="form" data-takip-gelisme-formu={x.id}>
      <label>
        {t("haberBasligi")}
        <select value={baslikId} onChange={(e) => setBaslikId(e.target.value)} data-tg-baslik>
          {plan.basliklar.map((b) => (
            <option key={b.baslikId} value={b.baslikId}>
              {v.basliklar.find((y) => y.id === b.baslikId)?.ad}
            </option>
          ))}
          <option value="yeni">+ {t("yeniBaslikOlustur")}</option>
        </select>
      </label>
      {baslikId === "yeni" && (
        <label>
          {t("yeniBaslikAdi")}
          <input {...icerikAlani} value={yeniBaslik} onChange={(e) => setYeniBaslik(e.target.value)} data-tg-yeni />
        </label>
      )}
      <div className="form-alt">
        <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
          {t("iptal")}
        </button>
        <button type="button" className="dugme dugme-iyi" onClick={ekle} disabled={baslikId === "yeni" && !yeniBaslik.trim()} data-tg-ekle>
          {t("ekle")}
        </button>
      </div>
    </div>
  );
}

/*
 * Takip aşamasındaki öneriler: yeni düzende takip önerinin aşaması. Eski
 * düzenden kalan ayrı takip kayıtları geçişe (4. aşama) dek yanlarında.
 * Arşive düşen (son satırdan 2 gün sonra) listede yok.
 */
export const takipOnerileri = (ben: Kisi, d: Durum) =>
  d.oneriler.filter((o) => o.durum === "takip" && oneriGorebilir(ben, o) && !oneriArsivde(o, bugun(), d)).sort((a, b) => oneriSonGunu(b).localeCompare(oneriSonGunu(a)) || b.zaman.localeCompare(a.zaman));

/** Takip önerilerinin kartları; plan verilince planlamacı takibi oradan plana alır. */
function TakipOnerileri({ ben, liste, plan }: { ben: Kisi; liste: Oneri[]; plan?: NextDayPlan }) {
  const { t } = useDil();
  const v = useVeri();
  const [ekle, setEkle] = useState<string | null>(null);
  const ekler = !!plan && yapabilir(ben, "oneriDegerlendir") && planIcerikDuzenler(ben, plan);
  return (
    <div className="oneri-kartlari" data-takip-onerileri>
      {liste.map((o) => (
        <div key={o.id}>
          <OneriKarti
            oneri={o}
            d={v}
            ac={() => git(`oneriler/${o.id}`)}
            eylemler={
              ekler && (
                <button type="button" className="dugme dugme-iyi dugme-kucuk" onClick={() => setEkle(ekle === o.id ? null : o.id)} data-takip-plana-ekle={o.id}>
                  {t("planaEkle")}
                </button>
              )
            }
          />
          {ekle === o.id && plan && <PlanaEkle ben={ben} oneri={o} planId={plan.id} kapat={() => setEkle(null)} />}
        </div>
      ))}
    </div>
  );
}

/** Açık takipler (Planlama'nın gördükleri); plan ekranındaki "Takipler" penceresi ve sayısı. */
export const acikTakipler = (ben: Kisi, d: { takipler: Takip[] }) => d.takipler.filter((x) => !x.kapandi && takipGorebilir(ben, x)).sort(sirala);

/*
 * Plan ekranında takipler gelen önerilerden ayrı pencerede: yalnız gelişme
 * bildiren takip öneri listesini kalabalıklaştırmasın. Öneriye çevrilen
 * takip o planın gününe öneri olarak düşüyor.
 */
export function PlanTakipleri({ ben, tarih, plan }: { ben: Kisi; tarih: string; plan?: NextDayPlan }) {
  const { t } = useDil();
  const v = useVeri();
  const liste = acikTakipler(ben, v);
  const oneriler = takipOnerileri(ben, v);
  return liste.length || oneriler.length ? (
    <>
      {oneriler.length > 0 && <TakipOnerileri ben={ben} liste={oneriler} plan={plan} />}
      {liste.length > 0 && (
        <div className="takip-listesi" data-plan-takipleri>
          {liste.map((x) => (
            <TakipKarti key={x.id} ben={ben} takip={x} hedefTarih={tarih} plan={plan} />
          ))}
        </div>
      )}
    </>
  ) : (
    <Bos metin={t("mtYok")} />
  );
}

/** Muhabirin profilinde açık takipleri: Planlama muhabire bakarken neyi izlediğini de görsün. */
export function ProfilTakipleri({ ben, kisi }: { ben: Kisi; kisi: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const liste = v.takipler.filter((x) => x.muhabirId === kisi.id && !x.kapandi && takipGorebilir(ben, x)).sort(sirala);
  if (!liste.length || ben.id === kisi.id) return null;
  return (
    <Kart baslik={t("mMuhabirTakipleri")} ek={String(liste.length)}>
      <div className="takip-listesi" data-profil-takipleri>
        {liste.map((x) => (
          <TakipKarti key={x.id} ben={ben} takip={x} />
        ))}
      </div>
    </Kart>
  );
}
