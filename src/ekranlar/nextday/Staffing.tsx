import { useAsistanPenceresi } from "../../asistan/pencere";
import { Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Pencere, bildir } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { ekipPostadanYaz } from "../../eylemler";
import { kayitlardanOneriler, kayitlariBirlestir, rotaKayitlari, rotaKimligi, staffingCoz, staffingPostasi, sunucuKayitlari, type StaffingOnerisi } from "../../staffing";
import { vardiyaYaz } from "../../tarih";
import { useVeri, type Kisi, type NextDayPlan } from "../../veri";
import { ekipAdayi, ekipGorevAdi, ekipGorevListesi } from "../../yapi";
import { izlemede } from "../../izleme";
import { GERCEK } from "../../kip";
import { rotaGetir } from "../../posta-kapi";
import { useSessizPosta } from "../../bilesenler/sessizPosta";
import { planIcerikDuzenler } from "../../yetki";

function useStaffingPostasi(ben: Kisi, plan: NextDayPlan) {
  useSessizPosta(ben, planIcerikDuzenler(ben, plan));
}

/*
 * Rota tablosu (kullanıcı: staffing'i Google tablosundan çeksin): kapı tablo
 * ayarlıysa planın gününün satırlarını döndürür (kapıda 6 saat önbellek, tablo
 * gün başına bir kez okunur). Ayarlı değilse ya da gün tabloda yoksa null:
 * şerit postaya döner.
 */
type RotaSatirlari = [string, string, string][];

function useRota(ben: Kisi, plan: NextDayPlan) {
  const duzenler = planIcerikDuzenler(ben, plan);
  const [rota, setRota] = useState<{ rota: RotaSatirlari | null; sunucu: RotaSatirlari | null }>({ rota: null, sunucu: null });
  useEffect(() => {
    setRota({ rota: null, sunucu: null });
    if (!GERCEK || !duzenler || izlemede()) return;
    let iptal = false;
    const al = (tur: "rota" | "sunucu") =>
      rotaGetir(plan.tarih, false, tur)
        .then((r) => (r.tamam && r.veri.satirlar?.length ? r.veri.satirlar : null))
        .catch(() => null);
    void Promise.all([al("rota"), al("sunucu")]).then(([r, s]) => !iptal && setRota({ rota: r, sunucu: s }));
    return () => {
      iptal = true;
    };
  }, [plan.tarih, duzenler]);
  return rota;
}

/*
 * Günlük staffing postası (staffing.ts) bu planın gününe aitse ekibin
 * üstünde şerit; önizlemede görev görev kim, hangi saatle. Kendiliğinden
 * yazılmaz: yanlış eşleşen ad sessizce plana girerdi. Yazılan ya da
 * yoksayılan posta için şerit kalkar; düzeltilmiş posta gelince yeniden çıkar.
 */
export function StaffingSeridi({ ben, plan }: { ben: Kisi; plan: NextDayPlan }) {
  const { t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  // Asistan "staffing'i ekibe yaz" deyince önizleme açılır; yazmayı kişi pencerede onaylar.
  useAsistanPenceresi("staffing", plan.id, () => setAcik(true));
  useStaffingPostasi(ben, plan);
  const { rota, sunucu } = useRota(ben, plan);
  const posta = staffingPostasi(v.postaMesajlari, plan.tarih);
  const kisiler = v.kisiler;
  // Rota tablosu varsa o (önceden belli, tam liste); yoksa günün staffing postası.
  // Sunucular kendi tablosundan; yalnız o varsa da şerit tablodan sayılır.
  const tablodan = !!rota || (!!sunucu && !posta);
  const kaynak =
    rota || sunucu || posta
      ? { id: rota || sunucu ? rotaKimligi(plan.tarih, [...(rota ?? (posta ? [["posta", posta.id, ""] as [string, string, string]] : [])), ...(sunucu ?? [])]) : posta!.id, rota: tablodan }
      : null;
  const oneriler = useMemo(() => {
    const uygun = (k: Kisi, g: Parameters<typeof ekipAdayi>[1]) => ekipAdayi(k, g);
    const ana = rota ? rotaKayitlari(rota) : posta ? staffingCoz(posta.tamMetin || posta.metin) : [];
    return kayitlardanOneriler(kayitlariBirlestir(ana, sunucu ? sunucuKayitlari(sunucu) : null), kisiler, plan.ekip, v.staffingEslesmeleri, uygun);
  }, [rota, sunucu, posta, kisiler, plan.ekip, v.staffingEslesmeleri]);
  if (!kaynak || !planIcerikDuzenler(ben, plan) || (plan.staffingPosta === kaynak.id && !acik) || !oneriler.length) return null;
  return (
    <>
      {plan.staffingPosta !== kaynak.id && (
        <div className="onceki-seridi" data-staffing-seridi data-staffing-kaynak={kaynak.rota ? "rota" : "posta"}>
          <span className="onceki-sayi">
            <Users size={16} /> {t(kaynak.rota ? "stSeritRota" : "stSerit", { n: oneriler.length })}
          </span>
          <button className="dugme" onClick={() => setAcik(true)} data-staffing-ac>
            {t("stAc")}
          </button>
        </div>
      )}
      {acik && <StaffingPenceresi ben={ben} plan={plan} mesajId={kaynak.id} rota={kaynak.rota} oneriler={oneriler} kapat={() => setAcik(false)} />}
    </>
  );
}

function StaffingPenceresi({ ben, plan, mesajId, rota, oneriler, kapat }: { ben: Kisi; plan: NextDayPlan; mesajId: string; rota: boolean; oneriler: StaffingOnerisi[]; kapat: () => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  // Satır başına seçili kişi ve işaret; eşleşmeyen satır seçilene dek işaretsiz.
  const [kisi, setKisi] = useState<(string | undefined)[]>(() => oneriler.map((o) => o.kisiId));
  const [secili, setSecili] = useState<boolean[]>(() => oneriler.map((o) => !!o.kisiId));
  const secenekler = useMemo(
    () => v.kisiler.filter((k) => !k.pasif && k.birim !== "muhabir").sort((a, b) => ad(a).localeCompare(ad(b))),
    [v.kisiler, ad],
  );
  const gorevler = ekipGorevListesi();
  /*
   * Yalnız görevin Plan ekibi kuralına uyanlar (kullanıcı: sunucu satırında
   * bütün personel değil sunucular). Postanın adayları önde; seçili kişi
   * kurala uymasa da listede kalır, seçim kaybolmasın.
   */
  const gorevSecenekleri = (o: StaffingOnerisi, seciliId?: string) => {
    const uyan = secenekler.filter((k) => ekipAdayi(k, o.gorev) || k.id === seciliId || k.id === o.kisiId);
    return [...uyan.filter((k) => o.adaylar.includes(k.id)), ...uyan.filter((k) => !o.adaylar.includes(k.id))];
  };
  const yazilacak = oneriler.flatMap((o, i) => (secili[i] && kisi[i] ? [{ kisiId: kisi[i]!, gorev: o.gorev, vardiya: o.vardiya }] : []));
  // Elle seçilen ya da değiştirilen kişi öğrenilir; sistemin kendi bulduğu öğrenilmez (kural değişirse eskisi takılı kalmasın).
  const ogren = oneriler.flatMap((o, i) => (secili[i] && kisi[i] && kisi[i] !== o.kisiId ? [{ ad: o.ad, kisiId: kisi[i]! }] : []));

  const yaz = () => {
    if (ekipPostadanYaz(ben, plan.id, mesajId, yazilacak, ogren)) bildir(t("stYazildi", { n: yazilacak.length }));
    kapat();
  };
  const yoksay = () => {
    ekipPostadanYaz(ben, plan.id, mesajId, []);
    kapat();
  };

  return (
    <Pencere
      genis
      baslik={t(rota ? "stBaslikRota" : "stBaslik")}
      kapat={kapat}
      altBilgi={
        <>
          <button className="dugme dugme-ikincil" onClick={yoksay} data-staffing-yoksay>
            {t("stYoksay")}
          </button>
          <button className="dugme" onClick={yaz} aria-disabled={!yazilacak.length || undefined} disabled={!yazilacak.length} data-staffing-yaz>
            {t("stUygula", { n: yazilacak.length })}
          </button>
        </>
      }
    >
      {gorevler
        .filter((g) => oneriler.some((o) => o.gorev === g))
        .map((g) => (
          <div key={g} className="ara-ust-2" data-staffing-gorev={g}>
            <div className="alan-etiket">{ekipGorevAdi(g)}</div>
            {oneriler.map((o, i) =>
              o.gorev !== g ? null : (
                <div key={i} className="staffing-satir" data-staffing-satir={i} data-eslesti={o.kisiId ? "1" : "0"} data-ogrenildi={o.ogrenildi ? "1" : undefined}>
                  <input type="checkbox" checked={secili[i]} disabled={!kisi[i]} aria-label={o.ad} onChange={(e) => setSecili((s) => s.map((x, j) => (j === i ? e.target.checked : x)))} />
                  <span className="staffing-saat">{vardiyaYaz(o.vardiya)}</span>
                  <span className="staffing-posta">
                    <bdi>{o.ad}</bdi>
                    <small className="sonuk">{o.unvan}</small>
                  </span>
                  <select
                    className={`girdi${kisi[i] ? "" : " uyari"}`}
                    value={kisi[i] ?? ""}
                    aria-label={t("stKisiSec")}
                    onChange={(e) => {
                      const id = e.target.value || undefined;
                      setKisi((s) => s.map((x, j) => (j === i ? id : x)));
                      setSecili((s) => s.map((x, j) => (j === i ? !!id : x)));
                    }}
                  >
                    <option value="">{o.kisiId ? t("stKisiSec") : t("stBulunamadi")}</option>
                    {gorevSecenekleri(o, kisi[i]).map((k) => (
                      <option key={k.id} value={k.id}>
                        {ad(k)}
                      </option>
                    ))}
                  </select>
                </div>
              ),
            )}
          </div>
        ))}
    </Pencere>
  );
}
