import { gecenSure, sureYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import type { ReactNode } from "react";
import { KISI_DURUM_ADI } from "../etiketler";
import { muhabirDosyasi, type DosyaIsi, type PlandakiSatir } from "../muhabirDosyasi";
import { kisiBugunDurumu } from "../muhabirIletisim";
import { useYeniTasarim } from "../tasarimSecimi";
import { useVeri, type Kisi } from "../veri";
import { kisitliKisi } from "../yetki";
import { baslikaGit } from "./baslikaGit";
import { yolAdimAnahtari } from "./OneriYolu";
import { Icerik, Kart, Rozet } from "./Parcalar";

/*
 * Muhabirin profilinin başındaki "Şimdi" (kurallar muhabirDosyasi.ts): sırası
 * bizde, sırası onda, bugün ve yarın planda, takipleri; izin ve son yazışma
 * başlıkta. Yalnız yeni tasarımda, kısıtlı olmayan kişide; boş liste çizilmez.
 */

const KISI_DURUM_TONU = { gorevde: "iyi", sahada: "vurgu", yolda: "uyari", izinli: "" } as const;

/** Bugünkü durum kayıttan (izin, saha görevi), kişideki alandan önce. */
export function KisiDurumRozeti({ kisi }: { kisi: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const d = kisiBugunDurumu(v, kisi);
  return (
    <span data-kisi-durum={d}>
      <Rozet ton={KISI_DURUM_TONU[d]}>{t(KISI_DURUM_ADI[d])}</Rozet>
    </span>
  );
}

const PLAN_TURU: Record<PlandakiSatir["tur"], Anahtar> = { baslik: "mdBaslik", gelisme: "mdGelisme", paket: "mdPkg", canli: "mdCanli" };

function IsSatiri({ is: x }: { is: DosyaIsi }) {
  const { t, dil } = useDil();
  const href = x.oneri ? `#/oneriler/${x.oneri.id}` : `#/paketler/${x.paket!.id}`;
  const ad = x.oneri ? x.oneri.paketBasligi || x.oneri.haberBasligi : x.paket!.baslik;
  return (
    <li data-md-is={x.oneri?.id ?? x.paket?.id}>
      <a href={href}>
        <Icerik>{ad}</Icerik>
      </a>
      <small className="sonuk">
        {x.yol ? `${t(yolAdimAnahtari(x.yol))} · ${gecenSure(x.yol.beri, dil)}` : t("oyMuhabirde")}
      </small>
    </li>
  );
}

export function MuhabirSimdi({ ben, kisi }: { ben: Kisi; kisi: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const yeni = useYeniTasarim();
  if (!yeni || kisitliKisi(ben)) return null;
  const f = muhabirDosyasi(v, kisi.id);
  const bolum = (ad: Anahtar, anahtar: string, n: number, icerik: ReactNode) =>
    n > 0 && (
      <section className="md-bolum" data-md={anahtar}>
        <h4>
          {t(ad)} <span className="sonuk">· {n}</span>
        </h4>
        <ul className="md-liste">{icerik}</ul>
      </section>
    );
  const bos = !f.bizde.length && !f.onda.length && !f.planda.length && !f.takipler.length;
  return (
    <Kart
      className="muhabir-simdi"
      baslik={t("mdSimdi")}
      ek={
        <span className="md-ust">
          {f.izin && <Rozet>{t("mdIzin", { sure: sureYaz(f.izin.baslangic.slice(0, 10), f.izin.bitis.slice(0, 10), dil) })}</Rozet>}
          {f.sonTemas && <span className="sonuk">{t("mdSonTemas", { sure: gecenSure(f.sonTemas, dil) })}</span>}
        </span>
      }
    >
      <div className="md-izgara" data-muhabir-simdi>
        {bos && <p className="sonuk">{t("kayitYok")}</p>}
        {bolum("mdBizde", "bizde", f.bizde.length, f.bizde.map((x) => <IsSatiri key={x.oneri?.id ?? x.paket?.id} is={x} />))}
        {bolum("mdOnda", "onda", f.onda.length, f.onda.map((x) => <IsSatiri key={x.oneri?.id ?? x.paket?.id} is={x} />))}
        {bolum(
          "mdPlanda",
          "planda",
          f.planda.length,
          f.planda.map((s, i) => (
            <li key={i}>
              <button type="button" className="md-bag" onClick={() => baslikaGit(s.plan.id, s.planBaslikId)} data-md-plan={s.plan.id}>
                <Icerik>{s.metin}</Icerik>
              </button>
              <small className="sonuk">
                {t(PLAN_TURU[s.tur])} · {t("nextday")} {tarihYaz(s.plan.tarih, dil, "kisa")}
              </small>
            </li>
          )),
        )}
        {bolum(
          "mdTakipler",
          "takip",
          f.takipler.length,
          f.takipler.map((o) => (
            <li key={o.id}>
              <a href={`#/oneriler/${o.id}`}>
                <Icerik>{o.haberBasligi}</Icerik>
              </a>
              <small className="sonuk">{gecenSure((o.satirlar ?? []).at(-1)?.zaman ?? o.zaman, dil)}</small>
            </li>
          )),
        )}
      </div>
    </Kart>
  );
}
