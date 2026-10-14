import { Eraser, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Kart, bildir } from "../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../dil";
import { kayitlariTemizle } from "../eylemler";
import { bugun } from "../tarih";
import { TEMIZLIK_TURLERI, temizle, type TemizlikTuru } from "../temizlik";
import { useVeri, type Kisi } from "../veri";

const TUR_ADI: Record<TemizlikTuru, Anahtar> = {
  oneriler: "ktOneriler",
  planlar: "ktPlanlar",
  paketler: "ktPaketler",
  haftalik: "ktHaftalik",
  aylikOzel: "ktAylikOzel",
  cagrilar: "ktCagrilar",
  takipler: "ktTakipler",
  faaliyetler: "ktFaaliyetler",
  gorevlendirmeler: "ktGorevlendirmeler",
  isler: "ktIsler",
  hareketler: "ktHareketler",
  basliklar: "ktBasliklar",
};

/*
 * Ayarlar › Kayıt temizliği (yalnız tam yönetici): deneme sürecinde
 * girilenler tarih aralığı ve türle seçilip izleriyle siliniyor. Sayılar
 * silmeden önce aynı kuraldan (temizlik.ts) çıkıyor; ekranda görünen,
 * silinecek olanın kendisi.
 */
export function KayitTemizligi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [turler, setTurler] = useState<TemizlikTuru[]>([]);
  const [bas, setBas] = useState("");
  const [bit, setBit] = useState(bugun());
  const onizleme = useMemo(() => temizle(v, { turler, bas, bit }), [v, turler, bas, bit]);
  const sec = (x: TemizlikTuru, acik: boolean) => setTurler(acik ? [...turler, x] : turler.filter((y) => y !== x));
  const sil = () => {
    if (!confirm(t("ktOnay", { n: onizleme.toplam }))) return;
    const n = kayitlariTemizle(ben, { turler, bas, bit });
    if (n !== null) {
      bildir(t("ktSilindi", { n }));
      setTurler([]);
    }
  };
  const izler: [string, Anahtar][] = [
    ["gelismeler", "ktGelismeler"],
    ["mesajlar", "ktMesajlar"],
  ];
  return (
    <Kart baslik={t("ktBaslik")} ikon={<Eraser size={18} />}>
      <div className="form" data-kayit-temizligi>
        <div className="satir">
          <label>
            {t("baslangic")}
            <input type="date" value={bas} max={bit || undefined} onChange={(e) => setBas(e.target.value)} data-kt-bas />
          </label>
          <label>
            {t("bitis")}
            <input type="date" value={bit} min={bas || undefined} onChange={(e) => setBit(e.target.value)} data-kt-bit />
          </label>
        </div>
        <ul className="liste temizlik-turleri">
          {TEMIZLIK_TURLERI.map((x) => (
            <li key={x}>
              <label className="secim">
                <input type="checkbox" checked={turler.includes(x)} onChange={(e) => sec(x, e.target.checked)} data-kt-tur={x} />
                {t(TUR_ADI[x])}
              </label>
              {turler.includes(x) && <b data-kt-sayi={x}>{onizleme.sayilar[x]}</b>}
            </li>
          ))}
          {izler
            .filter(([k]) => onizleme.sayilar[k])
            .map(([k, a]) => (
              <li key={k} className="soluk">
                <span>{t(a)}</span>
                <b data-kt-sayi={k}>{onizleme.sayilar[k]}</b>
              </li>
            ))}
        </ul>
        <div className="form-alt">
          <span data-kt-toplam={onizleme.toplam}>{t("ktToplam", { n: onizleme.toplam })}</span>
          <button type="button" className="dugme dugme-kotu" disabled={!onizleme.toplam} onClick={sil} data-kt-sil>
            <Trash2 size={16} /> {t("ktSil")}
          </button>
        </div>
      </div>
    </Kart>
  );
}
