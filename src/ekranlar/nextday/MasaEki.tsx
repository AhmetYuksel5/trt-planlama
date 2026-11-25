import { paketMasaEtiketi } from "../../masaEtiketi";
import type { Durum, Paket } from "../../veri";

/* Paketin adının arkasında masanın etiketi: " - " ve kalın birim adı (Arapça; plan metni, çıktı, Word). */
export function MasaEki({ d, p }: { d: Pick<Durum, "masaSorulari" | "oneriler">; p: Paket }) {
  const e = paketMasaEtiketi(d, p);
  if (!e) return null;
  return (
    <>
      {" - "}
      <b data-plan-masa={p.id}>{e}</b>
    </>
  );
}
