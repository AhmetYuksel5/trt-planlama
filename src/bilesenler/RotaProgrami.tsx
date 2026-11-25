import { CalendarClock } from "lucide-react";
import { gunAdi, tarihYaz, useDil } from "../dil";
import { calismaOzeti, vardiyaMetni } from "../rotaProgrami";
import { useVeri } from "../veri";
import { Kart } from "./Parcalar";

/*
 * Kişinin rotadan çalışma programı (rotaProgrami.ts → calismaOzeti; kullanıcı: izin günleri
 * düzenli, gün gün cetvel gereksiz): izin günleri ve vardiya saati, farklı saatli günler
 * varsa sayısıyla, altta rotanın dönemi. Saat İstanbul. Rota aktarılmamışsa ya da kişi
 * rotada eşleşmemişse kart çizilmez.
 */
export function RotaProgramiKarti({ kisiId }: { kisiId: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const o = calismaOzeti(v, kisiId);
  if (!o) return null;
  return (
    <Kart baslik={t("rpBaslik")} ikon={<CalendarClock size={18} />}>
      <dl className="rota-ozet" data-rota-program={kisiId}>
        <div>
          <dt>{t("rpIzinGunleri")}</dt>
          <dd data-rota-izin>{o.izinGunleri.length ? o.izinGunleri.map((g) => gunAdi(g.ornek, dil)).join(", ") : t("rpIzinYok")}</dd>
        </div>
        <div>
          <dt>{t("rpCalismaSaati")}</dt>
          <dd data-rota-saat>
            <b>{vardiyaMetni(o.saat)}</b>
          </dd>
        </div>
        {o.farkli.length > 0 && (
          <div>
            <dt>{t("rpFarkliSaat")}</dt>
            <dd data-rota-farkli>{o.farkli.map((f) => t("rpGunSayisi", { saat: vardiyaMetni(f.saat), n: f.n })).join(" · ")}</dd>
          </div>
        )}
      </dl>
      <p className="sonuk-yazi" data-rota-donem>
        {t("rpRotaKaynak", { bas: tarihYaz(o.bas, dil, "kisa"), bit: tarihYaz(o.bit, dil, "kisa") })}
      </p>
    </Kart>
  );
}
