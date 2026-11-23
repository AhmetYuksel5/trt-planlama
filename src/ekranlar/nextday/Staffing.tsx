import { Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Pencere, bildir } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { ekipPostadanYaz } from "../../eylemler";
import { staffingOnerileri, staffingPostasi, type StaffingOnerisi } from "../../staffing";
import { vardiyaYaz } from "../../tarih";
import { useVeri, type Kisi, type NextDayPlan } from "../../veri";
import { ekipAdayi, ekipGorevAdi, ekipGorevListesi } from "../../yapi";
import { izlemede } from "../../izleme";
import { GERCEK, firebaseYukle } from "../../kip";
import { postaKimlikGetir, postalariCek } from "../../posta-kapi";
import { planIcerikDuzenler, postaGorebilir } from "../../yetki";

/*
 * Gerçek kipte postalar yalnız Posta'yı açan tarayıcıda yükleniyordu, kutu da
 * yalnız Posta açılınca çekiliyordu: Posta'ya girmeyen planlamacı staffing
 * şeridini hiç görmüyordu. Next Day'i düzenleyen açınca posta yüklenir,
 * kimliği (parolası) olan kişide kutu sessizce çekilir; çekiş tarayıcıda
 * 15 dakikada bir (her plan açılışında kapıya gitmesin).
 */
const CEKIS_ANAHTARI = "trt-planlama-nd-posta-cek";
const CEKIS_ARASI = 15 * 60 * 1000;
function useStaffingPostasi(ben: Kisi, plan: NextDayPlan) {
  const duzenler = planIcerikDuzenler(ben, plan);
  useEffect(() => {
    if (!GERCEK || !duzenler || izlemede() || !postaGorebilir(ben)) return;
    let son = 0;
    try {
      son = Number(localStorage.getItem(CEKIS_ANAHTARI)) || 0;
    } catch {
      /* saklama yok: yine de bir kez dene */
    }
    const cek = Date.now() - son > CEKIS_ARASI;
    void (async () => {
      // Liste sunucudan gelmeden çekilirse aynı posta ikinci kez eklenirdi (Posta sayfasıyla aynı sıra).
      await (await firebaseYukle()).postaDinle();
      if (!cek) return;
      const r = await postaKimlikGetir();
      if (!r.tamam || !r.veri.parolaVar) return;
      try {
        localStorage.setItem(CEKIS_ANAHTARI, String(Date.now()));
      } catch {
        /* yok say */
      }
      await postalariCek(ben, 25, (r.veri.grupAdresi || "").trim().toLowerCase());
    })().catch(() => null);
    // Kişi ve yetki değişmedikçe bir kez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ben.id, duzenler]);
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
  useStaffingPostasi(ben, plan);
  const posta = staffingPostasi(v.postaMesajlari, plan.tarih);
  const kisiler = v.kisiler;
  const oneriler = useMemo(() => (posta ? staffingOnerileri(posta.tamMetin || posta.metin, kisiler, plan.ekip, v.staffingEslesmeleri, (k, g) => ekipAdayi(k, g)) : []), [posta, kisiler, plan.ekip, v.staffingEslesmeleri]);
  if (!posta || !planIcerikDuzenler(ben, plan) || (plan.staffingPosta === posta.id && !acik) || !oneriler.length) return null;
  return (
    <>
      {plan.staffingPosta !== posta.id && (
        <div className="onceki-seridi" data-staffing-seridi>
          <span className="onceki-sayi">
            <Users size={16} /> {t("stSerit", { n: oneriler.length })}
          </span>
          <button className="dugme" onClick={() => setAcik(true)} data-staffing-ac>
            {t("stAc")}
          </button>
        </div>
      )}
      {acik && <StaffingPenceresi ben={ben} plan={plan} mesajId={posta.id} oneriler={oneriler} kapat={() => setAcik(false)} />}
    </>
  );
}

function StaffingPenceresi({ ben, plan, mesajId, oneriler, kapat }: { ben: Kisi; plan: NextDayPlan; mesajId: string; oneriler: StaffingOnerisi[]; kapat: () => void }) {
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
      baslik={t("stBaslik")}
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
