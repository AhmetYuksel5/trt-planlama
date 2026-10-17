import { YzKisalt } from "../../bilesenler/YzKisalt";
import { useState } from "react";
import { Icerik, Pencere, TbcKutusu, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { Lightbulb, Plus } from "lucide-react";
import { metin, tarihYaz, useDil } from "../../dil";
import { canliKaydet, gelismeKaydet, gorevlendirmeOlustur, oneriPlanaEkle, paketKaydet } from "../../eylemler";
import { gelismeOneriAdaylari } from "../../oneriPlanlari";
import { BICIM_ADI, HAREKET_TURU_ADI, KAYNAK_ADI, TUR_ADI, sehirAdi, sehirListesi } from "../../etiketler";
import { useBen } from "../../oturum";
import { girdidenIso, simdi, yerelGirdi, zaman } from "../../tarih";
import {
  BICIMLER,
  TAKIP_BICIMI,
  type OneriBicimi,
  HAREKET_TURLERI,
  ICERIK_TURLERI,
  KAYNAK_TURLERI,
  kisiBul,
  muhabirler,
  useVeri,
  type Bicim,
  type CanliYayin,
  type Gelisme,
  type HareketTuru,
  type IcerikTuru,
  type KaynakTuru,
  type Kisi,
  type NextDayPlan,
  type Oneri,
  type Paket,
  type Sehir,
} from "../../veri";
import { icMuhabirMi } from "../../yapi";
import { yapabilir } from "../../yetki";

/*
 * Plan ekranının küçük formları. Promptun istediği gibi kısa: yalnız
 * belgedeki alanlar var, kaydet ve iptal hep aynı yerde. İçerik alanları
 * her arayüz dilinde sağdan sola ve örnekleri Arapça; yazılan metin
 * denetlenmiyor, Latin harfli özel isim serbest.
 */

export function FormAlt({ kapat, kaydet, devre = false, kaydetMetni }: { kapat: () => void; kaydet: () => void; devre?: boolean; kaydetMetni?: string }) {
  const { t } = useDil();
  return (
    <div className="form-alt">
      <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
        {t("iptal")}
      </button>
      <button type="button" className="dugme dugme-kucuk" onClick={kaydet} disabled={devre}>
        {kaydetMetni ?? t("kaydet")}
      </button>
    </div>
  );
}

/** Haber türü seçici: adı terim, tanımı seçenek metninde. */
export function BicimSecici({ deger, degistir }: { deger: Bicim; degistir: (b: Bicim) => void }) {
  const { t } = useDil();
  return (
    <select value={deger} onChange={(e) => degistir(e.target.value as Bicim)}>
      {BICIMLER.map((b) => (
        <option key={b} value={b}>
          {t(BICIM_ADI(b))}
        </option>
      ))}
    </select>
  );
}

/** Öneride haber türü: biçimler ve en sonda ayrık "Takip" (paket değil, muhabirin takibine de giriyor). */
export function OneriBicimSecici({ deger, degistir, takipli = true }: { deger: OneriBicimi; degistir: (b: OneriBicimi) => void; takipli?: boolean }) {
  const { t } = useDil();
  return (
    <select value={deger} onChange={(e) => degistir(e.target.value as OneriBicimi)} data-oneri-bicim>
      {BICIMLER.map((b) => (
        <option key={b} value={b}>
          {t(BICIM_ADI(b))}
        </option>
      ))}
      {takipli && <option disabled>──────</option>}
      {takipli && <option value={TAKIP_BICIMI}>{t(BICIM_ADI(TAKIP_BICIMI))}</option>}
    </select>
  );
}

/**
 * Muhabir seçici: ad ve şehir, alfabetik. Plan ve paket işlerinde (`ic`)
 * haber merkezinin muhabirleri de ayrı grupta (ünvanı Organizasyon'da
 * "muhabir seçimlerinde" işaretli); öneri akışında yalnız dış muhabirler,
 * çünkü öneriyi muhabir kendi ekranından gönderiyor ve yanıtlıyor.
 */
export function MuhabirSecici({ deger, degistir, bosEtiket, ic = true }: { deger: string; degistir: (id: string) => void; bosEtiket?: string; ic?: boolean }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const sirali = (l: Kisi[]) => [...l].sort((a, b) => ad(a).localeCompare(ad(b)));
  const dis = sirali(muhabirler(v));
  const icler = ic ? sirali(v.kisiler.filter((k) => !k.pasif && icMuhabirMi(k))) : [];
  const secenek = (k: Kisi) => (
    <option key={k.id} value={k.id}>
      {ad(k)} · {sehirAdi(k.sehir)}
    </option>
  );
  return (
    <select value={deger} onChange={(e) => degistir(e.target.value)}>
      <option value="">{bosEtiket ?? t("seciniz")}</option>
      {icler.length ? (
        <>
          <optgroup label={t("orgKokDis")}>{dis.map(secenek)}</optgroup>
          <optgroup label={t("icMuhabirler")}>{icler.map(secenek)}</optgroup>
        </>
      ) : (
        dis.map(secenek)
      )}
    </select>
  );
}

/* `sonra`: belgede "altına ekle" denen satır; yeni kayıt onun arkasına giriyor. */
export function GelismeFormu({ plan, planBaslikId, mevcut, sonra, kapat }: { plan: NextDayPlan; planBaslikId?: string; mevcut?: Gelisme; sonra?: string; kapat: () => void }) {
  const { t } = useDil();
  const ben = useBen();
  const [f, setF] = useState({
    yer: mevcut?.yer ?? "",
    metin: mevcut?.metin ?? "",
    kaynakTuru: (mevcut?.kaynakTuru ?? "ajans") as KaynakTuru,
    kaynakAdi: mevcut?.kaynakAdi ?? "",
    onerenId: mevcut?.onerenId ?? "",
    tarih: yerelGirdi(mevcut?.tarih ?? simdi()),
  });
  const kaydet = () => {
    if (!ben || !f.metin.trim()) return;
    gelismeKaydet(ben, {
      id: mevcut?.id,
      planId: plan.id,
      planBaslikId,
      yer: f.yer.trim() || undefined,
      metin: f.metin.trim(),
      kaynakTuru: f.kaynakTuru,
      kaynakAdi: f.kaynakAdi.trim(),
      tarih: girdidenIso(f.tarih) ?? simdi(),
      onerenId: f.onerenId || undefined,
      oneriId: mevcut?.oneriId,
    }, sonra);
    kapat();
  };
  return (
    <div className="form form-kutu">
      {!mevcut && planBaslikId && (
        <div className="form-ust-uc">
          <OneridenAl plan={plan} planBaslikId={planBaslikId} eklendi={kapat} />
        </div>
      )}
      <div className="satir">
        <label>
          {t("yer")}
          <input {...icerikAlani} value={f.yer} onChange={(e) => setF({ ...f, yer: e.target.value })} placeholder={metin("yerIpucu", "ar")} />
        </label>
        <label>
          {t("kaynakTuru")}
          <select value={f.kaynakTuru} onChange={(e) => setF({ ...f, kaynakTuru: e.target.value as KaynakTuru })}>
            {KAYNAK_TURLERI.map((k) => (
              <option key={k} value={k}>
                {t(KAYNAK_ADI[k])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("kaynakAdi")}
          <input {...icerikAlani} value={f.kaynakAdi} onChange={(e) => setF({ ...f, kaynakAdi: e.target.value })} />
        </label>
      </div>
      <label>
        {t("gelismeMetni")}
        <textarea {...icerikAlani} value={f.metin} onChange={(e) => setF({ ...f, metin: e.target.value })} />
      </label>
      <YzKisalt metin={f.metin} degistir={(m) => setF((x) => ({ ...x, metin: m }))} />
      <div className="satir">
        <label>
          {t("tarih")}
          <input type="datetime-local" value={f.tarih} onChange={(e) => setF({ ...f, tarih: e.target.value })} />
        </label>
        <label>
          {t("onerenMuhabir")}
          <MuhabirSecici deger={f.onerenId} degistir={(id) => setF({ ...f, onerenId: id })} bosEtiket={t("yok")} ic={false} />
        </label>
      </div>
      <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.metin.trim()} />
    </div>
  );
}

/*
 * "Önerilerden al": başlığa gelişmeyi muhabirin önerisinden eklemek. Öneri
 * "Plana ekle" ile aynı eylemle bu başlığa giriyor (öneri plana eklendi,
 * muhabir başlığa, muhabire bildirim, strap'i varsa PKG önerisi). Önceden
 * gelişme yalnız elle yazılıyordu; aynı haber elle girilince öneri listede
 * bağsız kalıyor, muhabire haber gitmiyordu. Formun içinde seçim kutusu
 * denendi; ayrı pencere istendi.
 */
export function OneridenAl({ plan, planBaslikId, eklendi }: { plan: NextDayPlan; planBaslikId: string; eklendi?: () => void }) {
  const { t, ad, dil } = useDil();
  const ben = useBen();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  const baslikId = plan.basliklar.find((b) => b.id === planBaslikId)?.baslikId;
  if (!ben || !baslikId || !yapabilir(ben, "oneriDegerlendir")) return null;
  const { buGun, digerleri } = gelismeOneriAdaylari(v, plan);
  const sayi = buGun.length + digerleri.length;
  const ekle = (o: Oneri) => {
    if (!oneriPlanaEkle(ben, o.id, { planId: plan.id, baslikId, paketOlustur: !!o.paketBasligi })) return;
    bildir(t("bOneriPlanda", { tarih: tarihYaz(plan.tarih, dil, "kisa") }));
    setAcik(false);
    eklendi?.();
  };
  const kart = (o: Oneri, gunlu: boolean) => (
    <li key={o.id} className="oneriden-al-satir" data-oneriden-al={o.id}>
      <div className="ad">
        <small>
          {ad(kisiBul(v, o.muhabirId))}
          {gunlu && o.hedefTarih && ` · ${tarihYaz(o.hedefTarih, dil, "kisa")}`}
        </small>
        <b>
          <Icerik blok>{o.haberBasligi}</Icerik>
        </b>
        {o.gelisme && <Icerik blok>{o.gelisme}</Icerik>}
        {o.paketBasligi && (
          <small>
            PKG · <Icerik>{o.paketBasligi}</Icerik>
          </small>
        )}
      </div>
      <button type="button" className="dugme dugme-kucuk" onClick={() => ekle(o)} data-oneriden-ekle={o.id}>
        <Plus size={14} /> {t("ekle")}
      </button>
    </li>
  );
  return (
    <>
      <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setAcik(true)} disabled={!sayi} data-oneriden-al-ac>
        <Lightbulb size={14} /> {t("onerilerdenAl")}
        {sayi > 0 && <em className="dugme-sayi">{sayi}</em>}
      </button>
      {acik && (
        <Pencere baslik={t("onerilerdenAl")} kapat={() => setAcik(false)}>
          {buGun.length > 0 && (
            <>
              <h3 className="pencere-ara-baslik">{t("buPlanaGelenOneriler")}</h3>
              <ul className="liste oneriden-al">{buGun.map((o) => kart(o, false))}</ul>
            </>
          )}
          {digerleri.length > 0 && (
            <>
              <h3 className="pencere-ara-baslik">{t("digerGunlerinOnerileri")}</h3>
              <ul className="liste oneriden-al">{digerleri.map((o) => kart(o, true))}</ul>
            </>
          )}
        </Pencere>
      )}
    </>
  );
}

export function CanliFormu({ plan, planBaslikId, mevcut, kapat }: { plan: NextDayPlan; planBaslikId?: string; mevcut?: CanliYayin; kapat: () => void }) {
  const { t } = useDil();
  const ben = useBen();
  const [f, setF] = useState({
    konu: mevcut?.konu ?? "",
    aciklama: mevcut?.aciklama ?? "",
    yer: mevcut?.yer ?? "",
    tarih: mevcut?.tarih ?? plan.tarih,
    saatGmt: mevcut?.saatGmt ?? "",
    muhabirId: mevcut?.muhabirId ?? "",
    notlar: mevcut?.notlar ?? "",
  });
  const kaydet = () => {
    if (!ben || !f.konu.trim()) return;
    canliKaydet(ben, { id: mevcut?.id, planId: plan.id, planBaslikId, ...f, muhabirId: f.muhabirId || undefined });
    kapat();
  };
  return (
    <div className="form form-kutu">
      <div className="satir">
        <label>
          {t("etkinlikAdi")}
          <input {...icerikAlani} value={f.konu} onChange={(e) => setF({ ...f, konu: e.target.value })} />
        </label>
        <label>
          {t("yer")}
          <input {...icerikAlani} value={f.yer} onChange={(e) => setF({ ...f, yer: e.target.value })} placeholder={metin("yerIpucu", "ar")} />
        </label>
      </div>
      <div className="satir">
        <label>
          {t("tarih")}
          <input type="date" value={f.tarih} onChange={(e) => setF({ ...f, tarih: e.target.value })} />
        </label>
        <label>
          {t("saatGmt")}
          <input type="time" value={f.saatGmt} onChange={(e) => setF({ ...f, saatGmt: e.target.value })} />
        </label>
        <label>
          {t("muhabir")}
          <MuhabirSecici deger={f.muhabirId} degistir={(id) => setF({ ...f, muhabirId: id })} bosEtiket={t("yok")} />
        </label>
      </div>
      <label>
        {t("aciklama")}
        <input {...icerikAlani} value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} />
      </label>
      <label>
        {t("yayinNotlari")}
        <input {...icerikAlani} value={f.notlar} onChange={(e) => setF({ ...f, notlar: e.target.value })} />
      </label>
      <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.konu.trim()} />
    </div>
  );
}

/* Şehir listesinde "Diğer": Sehir değerlerinden biri olamayacak bir değer. */
const DIGER = "__diger";

export function PaketFormu({ plan, planBaslikId, mevcut, sonra, kapat }: { plan: NextDayPlan; planBaslikId: string; mevcut?: Paket; sonra?: string; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [f, setF] = useState({
    baslik: mevcut?.baslik ?? "",
    sehir: (mevcut?.sehir ?? "istanbul") as Sehir,
    // "Diğer": listede olmayan yer elle; şehir alanı muhabirinki kalıyor (ülke ve süzgeçler ondan).
    diger: !!mevcut?.yer,
    yer: mevcut?.yer ?? "",
    muhabirId: mevcut?.muhabirId ?? "",
    aciklama: mevcut?.aciklama ?? "",
    tur: (mevcut?.tur ?? "haber") as IcerikTuru,
    bicim: (mevcut?.bicim ?? "pkg") as Bicim,
    teslim: yerelGirdi(mevcut?.teslim),
    yayin: mevcut?.yayin ? yerelGirdi(mevcut.yayin).slice(11) : "",
    sahaGerekli: mevcut?.sahaGerekli ?? false,
    slug: mevcut?.slug ?? "",
    muhabirTbc: !!mevcut?.muhabirTbc,
  });
  /* Muhabir seçilince şehir onun şehrine geliyor; çıktıdaki "ŞEHİR /" çoğu zaman muhabirin yeri. TBC kalkıyor. */
  const muhabirSec = (id: string) => {
    const k = v.kisiler.find((x) => x.id === id);
    setF({ ...f, muhabirId: id, sehir: k?.sehir ?? f.sehir, muhabirTbc: id ? false : f.muhabirTbc });
  };
  const yer = f.diger ? f.yer.trim() : "";
  const kaydet = () => {
    if (!ben || !f.baslik.trim() || (f.diger && !yer)) return;
    const id = paketKaydet(ben, {
      id: mevcut?.id,
      planId: plan.id,
      planBaslikId,
      baslik: f.baslik.trim(),
      sehir: f.sehir,
      yer: yer || undefined,
      muhabirId: f.muhabirId || undefined,
      aciklama: f.aciklama.trim(),
      tur: f.tur,
      bicim: f.bicim,
      teslim: girdidenIso(f.teslim),
      yayin: f.yayin ? zaman(plan.tarih, f.yayin) : undefined,
      sahaGerekli: f.sahaGerekli,
      slug: f.slug.trim() || undefined,
      muhabirTbc: f.muhabirTbc,
    }, sonra);
    if (id) bildir(t(mevcut ? "bKaydedildi" : "bPaketEklendi"));
    kapat();
  };
  return (
    <div className="form form-kutu">
      <label>
        {t("paketBasligi")}
        <input {...icerikAlani} value={f.baslik} onChange={(e) => setF({ ...f, baslik: e.target.value })} />
      </label>
      <div className="satir">
        {/* TBC muhabir sütununda, seçimin altında: satırın öbür alanlarını kaydırmasın. */}
        <div className="muhabir-sutunu">
          <label>
            {t("muhabir")}
            <MuhabirSecici deger={f.muhabirId} degistir={muhabirSec} bosEtiket={t("atanmadi")} />
          </label>
          {!f.muhabirId && <TbcKutusu secili={f.muhabirTbc} degistir={(x) => setF({ ...f, muhabirTbc: x })} />}
        </div>
        <label>
          {t("sehirUlke")}
          <select value={f.diger ? DIGER : f.sehir} onChange={(e) => setF(e.target.value === DIGER ? { ...f, diger: true } : { ...f, diger: false, sehir: e.target.value as Sehir })} data-paket-sehir>
            {sehirListesi().map((s) => (
              <option key={s} value={s}>
                {sehirAdi(s)}
              </option>
            ))}
            <option value={DIGER}>{t("sehirDiger")}</option>
          </select>
        </label>
        {f.diger && (
          <label>
            {t("sehirDigerAdi")}
            <input {...icerikAlani} value={f.yer} onChange={(e) => setF({ ...f, yer: e.target.value })} placeholder="الدوحة" autoFocus data-paket-yer />
          </label>
        )}
        <label>
          {t("tur")}
          <select value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as IcerikTuru })}>
            {ICERIK_TURLERI.map((x) => (
              <option key={x} value={x}>
                {t(TUR_ADI[x])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("haberTuru")}
          <BicimSecici deger={f.bicim} degistir={(b) => setF({ ...f, bicim: b })} />
        </label>
      </div>
      <label>
        {t("kisaAciklama")}
        <textarea {...icerikAlani} value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} />
      </label>
      <div className="satir">
        <label>
          {t("teslim")}
          <input type="datetime-local" value={f.teslim} onChange={(e) => setF({ ...f, teslim: e.target.value })} />
        </label>
        <label>
          {t("yayinSaati")}
          <input type="time" value={f.yayin} onChange={(e) => setF({ ...f, yayin: e.target.value })} />
        </label>
        <label>
          {t("slug")}
          <input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toUpperCase() })} placeholder="GAZA-HEALTH-PKG-OH" dir="ltr" />
        </label>
      </div>
      <label className="secim">
        <input type="checkbox" checked={f.sahaGerekli} onChange={(e) => setF({ ...f, sahaGerekli: e.target.checked })} />
        {t("sahaGerekli")}
      </label>
      <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.baslik.trim() || (f.diger && !yer)} />
    </div>
  );
}

export function GorevlendirmeFormu({ plan, kapat }: { plan: NextDayPlan; kapat: () => void }) {
  const { t } = useDil();
  const ben = useBen();
  const [f, setF] = useState({ kisiId: "", tur: "gorevlendirme" as HareketTuru, yer: "", baslangic: plan.tarih, bitis: plan.tarih, aciklama: "" });
  const kaydet = () => {
    if (!ben || !f.kisiId || !f.yer.trim()) return;
    gorevlendirmeOlustur(ben, plan.id, { ...f, yer: f.yer.trim(), aciklama: f.aciklama.trim(), bitis: f.bitis < f.baslangic ? f.baslangic : f.bitis });
    kapat();
  };
  return (
    <div className="form form-kutu">
      <div className="satir">
        <label>
          {t("muhabir")}
          <MuhabirSecici deger={f.kisiId} degistir={(id) => setF({ ...f, kisiId: id })} />
        </label>
        <label>
          {t("hareketTuru")}
          <select value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as HareketTuru })}>
            {HAREKET_TURLERI.map((x) => (
              <option key={x} value={x}>
                {t(HAREKET_TURU_ADI[x])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("yer")}
          <input {...icerikAlani} value={f.yer} onChange={(e) => setF({ ...f, yer: e.target.value })} placeholder={metin("yerIpucu", "ar")} />
        </label>
      </div>
      <div className="satir">
        <label>
          {t("baslangic")}
          <input type="date" value={f.baslangic} onChange={(e) => setF({ ...f, baslangic: e.target.value })} />
        </label>
        <label>
          {t("bitis")}
          <input type="date" value={f.bitis} onChange={(e) => setF({ ...f, bitis: e.target.value })} />
        </label>
      </div>
      <label>
        {t("aciklama")}
        <input {...icerikAlani} value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} />
      </label>
      <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.kisiId || !f.yer.trim()} />
    </div>
  );
}
