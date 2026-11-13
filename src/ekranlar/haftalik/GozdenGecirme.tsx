import { Check, ClipboardCopy } from "lucide-react";
import { useState } from "react";
import { KararRozeti } from "../../bilesenler/Haftalik";
import { Icerik, Pencere, bildir } from "../../bilesenler/Parcalar";
import { aralikYaz, useDil } from "../../dil";
import { KARAR_ADI } from "../../etiketler";
import { haftalikKesinlestir, kalemKarar } from "../../eylemler";
import { gundemde, haftaSonu, kalemAdi, kesinlesmeOzeti } from "../../haftalik";
import { kisiBul, useVeri, type HaftalikKalem, type HaftalikPlan, type Karar, type Kisi } from "../../veri";
import { kararVerebilir, toplantiNotuGorur } from "../../yetki";
import { KararNotlari } from "./Kalem";

/*
 * Toplantıdan sonra, kesinleştirmeden önce son bakış (kullanıcı: toplantıda
 * hızlı karar verilip sonra gözden geçirilip plana son hali veriliyor). Kalemler
 * kararlarına göre gruplu, karar burada da değişir; tutanak kopyalanır; onay en
 * altta. Önce iki ardışık confirm vardı, kararlar hiç görünmüyordu.
 */
const SIRA: Karar[] = ["kabul", "sartli", "bilgi", "ret"];

export function GozdenGecirme({ ben, hafta, kapat }: { ben: Kisi; hafta: HaftalikPlan; kapat: () => void }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const notlar = toplantiNotuGorur(ben) ? (v.toplantiNotlari ?? []).filter((n) => n.planId === hafta.id).sort((a, b) => a.zaman.localeCompare(b.zaman)) : [];
  // Pencere açıkken kayıt değişebiliyor (karar burada da değişiyor): haftanın taze hali.
  const h = v.haftalik.find((x) => x.id === hafta.id) ?? hafta;
  const oz = kesinlesmeOzeti(v, h);
  const [acikReddet, setAcikReddet] = useState(true);
  const gundem = h.kalemler.filter(gundemde);
  const gruplar = SIRA.map((k) => [k, gundem.filter((x) => x.karar === k)] as const).filter(([, l]) => l.length);
  const aralik = aralikYaz(h.baslangic, haftaSonu(h.baslangic), dil);

  const tutanak = () =>
    [
      `${t("mHaftalik")} · ${aralik}`,
      ...gruplar.flatMap(([k, l]) => [
        "",
        `${t(KARAR_ADI[k])} (${l.length})`,
        ...l.map((x) => [`- ${kalemAdi(x)}`, ...[x.kosul && `${t("kosul")}: ${x.kosul}`, x.kararNotu && `${t("kararNotu")}: ${x.kararNotu}`, x.ekTalep && `${t("ekTalep")}: ${x.ekTalep}`].filter(Boolean).map((s) => `  ${s}`)].join("\n")),
      ]),
      // Toplantının genel notları tutanağın sonunda (yalnız görebilene).
      ...(notlar.length ? ["", t("toplantiNotlari"), ...notlar.map((n) => `- ${ad(kisiBul(v, n.kisiId))}: ${n.metin}`)] : []),
    ].join("\n");

  const kesinlestir = () => haftalikKesinlestir(ben, h.id, acikReddet) && (bildir(t("bHaftalikKesinlesti")), kapat());

  return (
    <Pencere
      genis
      baslik={t("gozdenGecir")}
      alt={aralik}
      kapat={kapat}
      altBilgi={
        <div className="dugmeler" data-gozden-alt>
          <button type="button" className="dugme dugme-ikincil" onClick={() => void navigator.clipboard?.writeText(tutanak()).then(() => bildir(t("bKopyalandi")), () => undefined)} data-tutanak-kopyala>
            <ClipboardCopy size={16} /> {t("tutanagiKopyala")}
          </button>
          <button type="button" className="dugme" onClick={kesinlestir} data-gozden-kesinlestir>
            <Check size={16} /> {t("kesinlestir")}
          </button>
        </div>
      }
    >
      <p data-gozden-ozet>{t("kesinlesmeOzetSatiri", { n: oz.nextDay, p: oz.paket, s: oz.sartli, r: oz.ret })}</p>
      {gruplar.map(([k, l]) => (
        <section key={k} className="gozden-grup" data-gozden-grup={k}>
          <h3>
            {t(KARAR_ADI[k])} · {l.length}
          </h3>
          <ul className="liste">
            {l.map((x) => (
              <GozdenSatiri key={x.id} ben={ben} hafta={h} kalem={x} />
            ))}
          </ul>
        </section>
      ))}
      {oz.acik > 0 && (
        <label className="secim" data-acik-reddet>
          <input type="checkbox" checked={acikReddet} onChange={(e) => setAcikReddet(e.target.checked)} /> {t("acikOnerilerReddet", { n: oz.acik })}
        </label>
      )}
    </Pencere>
  );
}

function GozdenSatiri({ ben, hafta, kalem }: { ben: Kisi; hafta: HaftalikPlan; kalem: HaftalikKalem }) {
  const { t } = useDil();
  // Şartlı kabul koşul ister; burada yalnız koşulu olan kalem şartlı kalabilir, yenisi kalemin kartından verilir.
  const secenekler = SIRA.filter((k) => k !== "sartli" || kalem.karar === "sartli");
  return (
    <li data-gozden-kalem={kalem.id}>
      <div className="ad">
        <Icerik blok>{kalemAdi(kalem)}</Icerik>
        <KararNotlari kalem={kalem} />
      </div>
      {kararVerebilir(ben, hafta) ? (
        <select className="girdi" value={kalem.karar} aria-label={t("krKarar")} onChange={(e) => kalemKarar(ben, hafta.id, kalem.id, e.target.value as Karar, kalem.kosul, kalem.kosulSon)} data-gozden-karar>
          {secenekler.map((k) => (
            <option key={k} value={k}>
              {t(KARAR_ADI[k])}
            </option>
          ))}
        </select>
      ) : (
        <KararRozeti kalem={kalem} />
      )}
    </li>
  );
}
