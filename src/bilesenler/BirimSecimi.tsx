import { useDil } from "../dil";
import type { BirimId, GorevId } from "../veri";
import { ayirtEdiciBirimAdi, disMuhabirMi, gorevAdi, kisiBirimSecenekleri, otomatikMuhabirUnvaniMi, unvanListesi } from "../yapi";

/*
 * Kişi formlarının (davet, hesapsız kişi, düzenle/tayin, kayıt bağlantısı)
 * birim ve görev seçenekleri tek yerde: birim ağacı sırasıyla girintili,
 * grup düğümü seçilemez; görev yalnız seçili birimin ünvanları.
 */

export function BirimSecenekleri({ dahil }: { dahil?: BirimId }) {
  return (
    <>
      {kisiBirimSecenekleri(dahil).map((s) => (
        <option key={s.id} value={s.id} disabled={s.grup}>
          {"   ".repeat(s.derinlik)}
          {ayirtEdiciBirimAdi(s.id)}
        </option>
      ))}
    </>
  );
}

export function UnvanSecenekleri({ birim, dahil }: { birim: BirimId; dahil?: GorevId }) {
  const { t } = useDil();
  // Dış muhabirin yer ünvanı ("<Şehir> muhabiri") seçilmiyor, şehrinden geliyor; eski yer ünvanları listede durmasın.
  const dis = disMuhabirMi({ birim });
  let l = dis ? unvanListesi(birim, dahil).filter((g) => g === dahil || g === "muhabir" || !otomatikMuhabirUnvaniMi(g)) : unvanListesi(birim, dahil);
  if (dis && !l.includes("muhabir")) l = ["muhabir", ...l];
  if (!l.length)
    return (
      <option value="" disabled>
        {t("birimdeUnvanYok")}
      </option>
    );
  return (
    <>
      {l.map((g) => (
        <option key={g} value={g}>
          {gorevAdi(g)}
        </option>
      ))}
    </>
  );
}
