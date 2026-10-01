import { DILLER, dilAyarla, tarihYaz, useDil, type Dil } from "../dil";
import { SimgeZil } from "./Simgeler";
import { ROLLER, ROL_ADI, bugun, type Rol } from "../veri";

/**
 * Üst çubuk: marka, arama, tarih, dil, rol ve bildirim.
 *
 * Rol seçici giriş sisteminin yerini tutuyor: ekranlar "ben kimim" diye
 * buna bakıyor. Gerçek giriş geldiğinde bu menü kalkar, değer oradan
 * gelir.
 *
 * Telefonda arama, dil ve rol menü paneline taşınıyor; burada yalnız marka
 * ve bildirim kalıyor ki çubuk tek satıra sığsın.
 */
export default function UstCubuk({ rol, onRol, bildirim }: { rol: Rol; onRol: (r: Rol) => void; bildirim: number }) {
  const [dil, t] = useDil();
  return (
    <header className="ust">
      <a className="marka" href="#/">
        TRT <span>Arabi</span> · Planlama
      </a>
      <input className="ara masaustu" type="search" placeholder={t("ara")} aria-label={t("ara")} />
      <span className="bosluk" />
      <span className="tarih">{tarihYaz(bugun(), dil)}</span>
      <select className="masaustu" aria-label={t("dil")} value={dil} onChange={(e) => dilAyarla(e.target.value as Dil)}>
        {DILLER.map((d) => (
          <option key={d} value={d}>
            {d.toUpperCase()}
          </option>
        ))}
      </select>
      <select className="masaustu" aria-label={t("rol")} value={rol} onChange={(e) => onRol(e.target.value as Rol)}>
        {ROLLER.map((r) => (
          <option key={r} value={r}>
            {t(ROL_ADI[r])}
          </option>
        ))}
      </select>
      <button className="zil" aria-label={t("bildirimler")} title={t("bildirimler")}>
        <SimgeZil />
        {bildirim > 0 && <b>{bildirim}</b>}
      </button>
    </header>
  );
}
