import { Check, ClipboardList, Send, Share2, X } from "lucide-react";
import { useState } from "react";
import { AnmaGirdisi } from "../../bilesenler/Anma";
import { Icerik, Kart, Rozet, bildir } from "../../bilesenler/Parcalar";
import { saatYaz, tarihYaz, useDil } from "../../dil";
import { masaSorusunuYanitla, oneriGorevlendir, oneriMasayaSor } from "../../eylemler";
import { SORU_MASALARI, masaninSorulari, oneriGorevPaketi, oneriSorulari, sonSoru } from "../../masaSorusu";
import { bugun, yerelGun } from "../../tarih";
import { kisiBul, oneriBul, useVeri, type BirimId, type Kisi, type MasaSorusu, type Oneri } from "../../veri";
import { birimAdi, izinBirimi } from "../../yapi";
import { kisitliKisi, masaYanitlar, masayaSorabilir, oneriGorevlendirebilir, yapabilir } from "../../yetki";

/*
 * Önerinin masaya sorulması (kullanıcı: ekonomi ya da programla ilgili öneriyi
 * Planlama o birime iletir, "alırız" derlerse notlarıyla ya da öneriyi
 * düzenleyerek; muhabiri Planlama görevlendirir). Kural masaSorusu.ts,
 * eylemler oneriMasayaSor, masaSorusunuYanitla, oneriGorevlendir. Muhabir bu
 * kartı görmez: masanın notu iç yazışma.
 */

export function MasaKarti({ ben, oneri }: { ben: Kisi; oneri: Oneri }) {
  const { t } = useDil();
  const v = useVeri();
  const sorular = oneriSorulari(v, oneri.id);
  const sorar = masayaSorabilir(ben, oneri, v);
  if (kisitliKisi(ben) || (!sorar && !sorular.length)) return null;
  return (
    <Kart baslik={t("msKart")} ikon={<Share2 size={18} />}>
      {sorular.length > 0 && (
        <ul className="liste" data-masa-sorulari>
          {sorular.map((s) => (
            <SoruSatiri key={s.id} s={s} />
          ))}
        </ul>
      )}
      {masaYanitlar(ben, oneri, v) && <YanitFormu ben={ben} oneri={oneri} />}
      {oneriGorevlendirebilir(ben, oneri, v) && <GorevlendirFormu ben={ben} oneri={oneri} />}
      {sorar && <SorFormu ben={ben} oneri={oneri} />}
    </Kart>
  );
}

function SoruSatiri({ s }: { s: MasaSorusu }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const zaman = (z: string) => `${tarihYaz(yerelGun(z), dil, "kisa")} ${saatYaz(z, dil)}`;
  const paket = sonSoru(v, s.oneriId)?.id === s.id ? oneriGorevPaketi(v, s.oneriId) : undefined;
  return (
    <li data-masa-sorusu={s.id}>
      <div className="ad">
        <b>{birimAdi(s.birim)}</b>
        <small>
          <bdi>{ad(kisiBul(v, s.soran))}</bdi> · {zaman(s.zaman)}
          {s.not && (
            <>
              {" "}
              · <span dir="auto">{s.not}</span>
            </>
          )}
        </small>
        {s.cevap && (
          <small>
            <bdi>{ad(kisiBul(v, s.cevap.kisiId))}</bdi> · {zaman(s.cevap.zaman)}
            {s.cevap.not && (
              <>
                {" "}
                · <span dir="auto" data-masa-notu>{s.cevap.not}</span>
              </>
            )}
          </small>
        )}
      </div>
      {paket ? (
        <a href={`#/paketler/${paket.id}`} data-masa-paket>
          <Rozet ton="iyi">{t("msGorevlendirildi")}</Rozet>
        </a>
      ) : !s.cevap ? (
        <Rozet ton="uyari">{t("msYanitBekliyor")}</Rozet>
      ) : (
        <Rozet ton={s.cevap.kabul ? "iyi" : "kotu"}>{t(s.cevap.kabul ? "msAldi" : "msAlmadi")}</Rozet>
      )}
    </li>
  );
}

function SorFormu({ ben, oneri }: { ben: Kisi; oneri: Oneri }) {
  const { t } = useDil();
  // Önerinin kolu masaysa o önce seçili; yoksa ilk masa.
  const [birim, setBirim] = useState<BirimId>(SORU_MASALARI.includes(oneri.tur) ? oneri.tur : SORU_MASALARI[0]);
  const [not, setNot] = useState("");
  return (
    <div className="form ara-ust-2" data-masaya-sor>
      <div className="satir">
        <label>
          {t("birim")}
          <select value={birim} onChange={(e) => setBirim(e.target.value)} data-masa-birim>
            {SORU_MASALARI.map((b) => (
              <option key={b} value={b}>
                {birimAdi(b)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        {t("not")}
        <AnmaGirdisi cokSatir rows={2} deger={not} degistir={setNot} data-masa-sor-notu />
      </label>
      <div>
        <button type="button" className="dugme" onClick={() => oneriMasayaSor(ben, oneri.id, birim, not) && (setNot(""), bildir(t("msIletildi")))} data-masaya-ilet>
          <Send size={15} className="yon" /> {t("msMasayaIlet")}
        </button>
      </div>
    </div>
  );
}

function YanitFormu({ ben, oneri }: { ben: Kisi; oneri: Oneri }) {
  const { t } = useDil();
  const [not, setNot] = useState("");
  const yanitla = (kabul: boolean) => confirm(t("eminMisin")) && masaSorusunuYanitla(ben, oneri.id, kabul, not) && bildir(t("msYanitlandi"));
  return (
    <div className="form ara-ust-2" data-masa-yanit>
      <label>
        {t("not")}
        <AnmaGirdisi cokSatir rows={2} deger={not} degistir={setNot} data-masa-yanit-notu />
      </label>
      <div className="dugmeler">
        <button type="button" className="dugme dugme-iyi" onClick={() => yanitla(true)} data-masa-al>
          <Check size={15} /> {t("msAliriz")}
        </button>
        <button type="button" className="dugme dugme-ikincil" onClick={() => yanitla(false)} data-masa-alma>
          <X size={15} /> {t("msAlmayiz")}
        </button>
      </div>
    </div>
  );
}

function GorevlendirFormu({ ben, oneri }: { ben: Kisi; oneri: Oneri }) {
  const { t } = useDil();
  const B = bugun();
  const [tarih, setTarih] = useState(oneri.hedefTarih && oneri.hedefTarih > B ? oneri.hedefTarih : B);
  return (
    <div className="satir-form" data-oneri-gorevlendir-formu>
      <input type="date" className="girdi" value={tarih} min={B} onChange={(e) => setTarih(e.target.value)} aria-label={t("gvGun")} />
      <button
        type="button"
        className="dugme"
        onClick={() => confirm(t("eminMisin")) && oneriGorevlendir(ben, oneri.id, tarih) && bildir(t("gvVerildi"))}
        data-oneri-gorevlendir
      >
        <ClipboardList size={15} /> {t("msGorevlendir")}
      </button>
    </div>
  );
}

/**
 * Masanın listesi (Ekonomi, Program, Spor): Planlama'nın sorduğu, yanıt
 * bekleyen ve aldığı, görevlendirme bekleyen öneriler. Yoksa çizilmez.
 */
export function MasaOnerileri({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const birim = izinBirimi(ben.birim);
  if (!SORU_MASALARI.includes(birim) || kisitliKisi(ben)) return null;
  const liste = masaninSorulari(v, birim);
  if (!liste.length) return null;
  return (
    <Kart baslik={t("msMasaOnerileri")} ikon={<Share2 size={18} />} ek={String(liste.filter((s) => !s.cevap).length)}>
      <ul className="liste" data-masa-onerileri>
        {liste.map((s) => (
          <OzetSatiri key={s.id} s={s} />
        ))}
      </ul>
    </Kart>
  );
}

/** Planlama'nın listesi: masalarda yanıt bekleyen ve alınıp görevlendirme bekleyen öneriler. */
export function MasalardakiOneriler({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  if (!yapabilir(ben, "oneriDegerlendir") && !ben.hesapYoneticisi) return null;
  const liste = SORU_MASALARI.flatMap((b) => masaninSorulari(v, b)).sort((a, b) => a.zaman.localeCompare(b.zaman));
  if (!liste.length) return null;
  return (
    <Kart baslik={t("msMasalardakiler")} ikon={<Share2 size={18} />} ek={String(liste.length)}>
      <ul className="liste" data-masalardaki-oneriler>
        {liste.map((s) => (
          <OzetSatiri key={s.id} s={s} birimli />
        ))}
      </ul>
    </Kart>
  );
}

function OzetSatiri({ s, birimli = false }: { s: MasaSorusu; birimli?: boolean }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const o = oneriBul(v, s.oneriId);
  if (!o) return null;
  return (
    <li data-masa-oneri={o.id}>
      <div className="ad">
        <a href={`#/oneriler/${o.id}`}>
          <Icerik blok>{o.paketBasligi || o.haberBasligi}</Icerik>
        </a>
        <small>
          <bdi>{ad(kisiBul(v, o.muhabirId))}</bdi>
          {birimli && <> · {birimAdi(s.birim)}</>}
        </small>
      </div>
      <Rozet ton={s.cevap ? "iyi" : "uyari"}>{t(s.cevap ? "msGorevBekliyor" : "msYanitBekliyor")}</Rozet>
    </li>
  );
}
