import { CalendarClock } from "lucide-react";
import { kisaGunAdi, tarihYaz, useDil } from "../dil";
import { kisiProgrami, kisiYakinProgrami } from "../rotaProgrami";
import { useVeri } from "../veri";
import { Kart } from "./Parcalar";

/*
 * Kişinin rotadan çalışma programı (rotaProgrami.ts): önümüzdeki iki hafta gün gün, işe
 * başlama saati İstanbul; o gün rotada yoksa çalışmıyor. Üstte haftanın günlerine göre
 * özet. Rota aktarılmamışsa ya da kişi rotada eşleşmemişse kart çizilmez.
 */
export function RotaProgramiKarti({ kisiId }: { kisiId: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const gunler = kisiYakinProgrami(v, kisiId);
  const program = kisiProgrami(v, kisiId);
  if (!gunler.length || !Object.keys(program).length) return null;
  // Haftanın her günü için en sık saat; adı programdaki bir tarihin gün adından.
  const ozet = new Map<string, Map<string, number>>();
  for (const [tarih, saat] of Object.entries(program)) {
    const g = kisaGunAdi(tarih, dil);
    const m = ozet.get(g) ?? new Map<string, number>();
    m.set(saat, (m.get(saat) ?? 0) + 1);
    ozet.set(g, m);
  }
  return (
    <Kart baslik={t("rpBaslik")} ikon={<CalendarClock size={18} />}>
      <p className="sonuk-yazi" data-rota-ozet>
        {[...ozet.entries()].map(([g, m]) => `${g} ${[...m.entries()].sort((a, b) => b[1] - a[1])[0][0]}`).join(" · ")}
      </p>
      <ul className="rota-gunleri" data-rota-program={kisiId}>
        {gunler.map((g) => (
          <li key={g.tarih} className={g.saat ? "" : "sonuk"} data-rota-gun={g.tarih}>
            <span>
              {kisaGunAdi(g.tarih, dil)} {tarihYaz(g.tarih, dil, "kisa")}
            </span>
            <b>{g.saat || t("rpCalismiyor")}</b>
          </li>
        ))}
      </ul>
    </Kart>
  );
}
