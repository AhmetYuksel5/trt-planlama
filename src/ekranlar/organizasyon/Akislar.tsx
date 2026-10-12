import {
  ArrowDown,
  ArrowUp,
  GitBranch,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Kart, Pencere, Rozet } from "../../bilesenler/Parcalar";
import {
  ADIM_ADI,
  ASAMALAR,
  ASAMA_ADI,
  URETIM_ADIMLARI,
  type Asama,
} from "../../akis";
import { useDil, yaz, type Metin } from "../../dil";
import { TUR_ADI } from "../../etiketler";
import { yapiTaslagi, yapiTaslagiDegistir } from "../../eylemler";
import {
  ICERIK_TURLERI,
  kimlik,
  useVeri,
  type BirimId,
  type IcerikTuru,
  type Kisi,
} from "../../veri";
import {
  akisGuncelle,
  birimAdi,
  birimListesi,
  gorevAdi,
  unvanListesi,
  type Akis,
  type Durak,
  type DurakTuru,
  type Sorumlu,
  type Yapi,
} from "../../yapi";
import { AdAlanlari, SinirliDugme, adTemizle, dilde, metinMi } from "./Ortak";

/**
 * İş akışı düzenleyici: haber üretiminin durakları, sırası ve sorumluları.
 *
 * Her kolun (haber, feature, ekonomi, program) bir akışı var; yönetici
 * yeni akış açıp kolu ona taşıyabiliyor. Durak programın bildiği bir iş
 * (metin, kontrol, video…; ekranı ve formu hazır) ya da genel iş
 * ("Tamamla ve geç"). Sorumlu kolun sahibi, birim, ünvan ya da kişi.
 *
 * Değişiklik taslakta; yayınlanınca yalnız yeni paketlere uygulanıyor
 * (Paket.akis). Üretimdeki paket girdiği sürümle bitiyor; silinen durakta
 * bekleyen paket için yönetici uyarılıyor.
 */

const DURAK_TURLERI: DurakTuru[] = [...URETIM_ADIMLARI, "is"];

export function AkislarSekmesi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const taslak = yapiTaslagi(v, ben);
  const degistir = (f: (y: Yapi) => Yapi) => yapiTaslagiDegistir(ben, f);
  const [secili, setSecili] = useState(taslak.akislar[0]?.id);
  const akis = taslak.akislar.find((a) => a.id === secili) ?? taslak.akislar[0];
  const [durak, setDurak] = useState<{ d: Durak | null; sira: number } | null>(
    null,
  );
  const [surukle, setSurukle] = useState<number | null>(null);
  const [akisAdi, setAkisAdi] = useState<Akis | "yeni" | null>(null);

  const tasi = (i: number, j: number) =>
    degistir((y) =>
      akisGuncelle(y, akis.id, (a) => {
        const l = [...a.duraklar];
        const [x] = l.splice(i, 1);
        l.splice(j, 0, x);
        return { ...a, duraklar: l };
      }),
    );

  /* Durakta bekleyen paket: girdiği sürümle sürüyor, ama yöneticinin bilmesi gerek. */
  const bekleyen = (d: Durak) =>
    v.paketler.filter(
      (p) =>
        p.durum === "uretimde" &&
        p.adim === d.id &&
        (p.akis?.id ?? "uretim") === akis.id,
    ).length;

  return (
    <>
      <Kart baslik={t("orgKolSahipleri")} ikon={<GitBranch size={18} />}>
        <div className="form">
          <div className="satir" data-kol-sahipleri>
            {ICERIK_TURLERI.map((tur) => (
              <label key={tur}>
                {t(TUR_ADI[tur])}
                <select
                  value={taslak.kolSahibi[tur]}
                  onChange={(e) =>
                    degistir((y) => ({
                      ...y,
                      kolSahibi: { ...y.kolSahibi, [tur]: e.target.value },
                    }))
                  }
                  data-kol-sahibi={tur}
                >
                  {birimListesi(taslak.kolSahibi[tur], taslak).map((b) => (
                    <option key={b} value={b}>
                      {birimAdi(b, taslak)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      </Kart>

      <div
        className="sekmeler ara-ust-2 ara-alt-2"
        role="tablist"
        aria-label={t("orgAkis")}
      >
        {taslak.akislar.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={a.id === akis.id}
            className={a.id === akis.id ? "acik" : ""}
            onClick={() => setSecili(a.id)}
            data-akis={a.id}
          >
            {akisAdiYaz(a, t)}
            <em>{a.duraklar.length}</em>
          </button>
        ))}
        <button type="button" onClick={() => setAkisAdi("yeni")} data-akis-ekle>
          <Plus size={14} /> {t("orgAkisEkle")}
        </button>
      </div>

      <Kart
        baslik={akisAdiYaz(akis, t)}
        ek={akis.kollar.map((k) => t(TUR_ADI[k])).join(", ") || t("orgKolsuz")}
        sagUc={
          <div className="dugmeler">
            <button
              type="button"
              className="dugme dugme-sade dugme-kucuk"
              onClick={() => setAkisAdi(akis)}
              data-akis-duzenle
            >
              <Pencil size={14} /> {t("duzenle")}
            </button>
            <SinirliDugme
              className="dugme dugme-sade dugme-kucuk kotu-yazi"
              izin={taslak.akislar.length > 1 && !akis.kollar.length}
              neden={t("orgAkisSilinemez")}
              onClick={() =>
                confirm(t("orgSilinsinMi", { ad: akisAdiYaz(akis, t) })) &&
                degistir((y) => ({
                  ...y,
                  akislar: y.akislar.filter((a) => a.id !== akis.id),
                }))
              }
              data-sil={akis.id}
            >
              <Trash2 size={14} /> {t("sil")}
            </SinirliDugme>
          </div>
        }
      >
        <ol className="durak-listesi" data-durak-listesi>
          {akis.duraklar.map((d, i) => (
            <li
              key={d.id}
              className={`durak-karti${surukle === i ? " surukleniyor" : ""}`}
              draggable
              onDragStart={() => setSurukle(i)}
              onDragEnd={() => setSurukle(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (surukle !== null && surukle !== i) tasi(surukle, i);
                setSurukle(null);
              }}
              data-durak={d.id}
            >
              <span className="durak-no" aria-hidden="true">
                <GripVertical size={14} />
                {i + 1}
              </span>
              <div className="durak-govde">
                <b>{durakAdiYaz(d, t)}</b>
                <small>
                  <SorumluYazisi s={d.sorumlu} y={taslak} />
                  {!!d.yardimci?.length &&
                    ` + ${d.yardimci.map((b) => birimAdi(b, taslak)).join(", ")}`}
                </small>
                <span className="durak-rozetler">
                  <Rozet>
                    {d.tur === "is" ? t("orgGenelIs") : t("orgHazirIs")}
                  </Rozet>
                  <Rozet>{t(ASAMA_ADI[d.asama])}</Rozet>
                  {d.kosul === "saha" && (
                    <Rozet ton="vurgu">{t("orgYalnizSaha")}</Rozet>
                  )}
                  {d.geriGonderir && (
                    <Rozet ton="uyari">{t("orgGeriGonderir")}</Rozet>
                  )}
                  {bekleyen(d) > 0 && (
                    <Rozet ton="koyu">
                      {t("orgBekleyenPaket", { n: bekleyen(d) })}
                    </Rozet>
                  )}
                </span>
              </div>
              <div className="durak-islem">
                <button
                  type="button"
                  className="dugme dugme-sade dugme-ikon"
                  disabled={i === 0}
                  onClick={() => tasi(i, i - 1)}
                  title={t("yukari")}
                  aria-label={t("yukari")}
                  data-durak-yukari={d.id}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  className="dugme dugme-sade dugme-ikon"
                  disabled={i === akis.duraklar.length - 1}
                  onClick={() => tasi(i, i + 1)}
                  title={t("asagi")}
                  aria-label={t("asagi")}
                  data-durak-asagi={d.id}
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  className="dugme dugme-sade dugme-ikon"
                  onClick={() => setDurak({ d, sira: i })}
                  title={t("duzenle")}
                  aria-label={t("duzenle")}
                  data-durak-duzenle={d.id}
                >
                  <Pencil size={15} />
                </button>
                <SinirliDugme
                  className="dugme dugme-sade dugme-ikon kotu-yazi"
                  izin={akis.duraklar.length > 1}
                  neden={t("orgSonDurak")}
                  onClick={() => {
                    const n = bekleyen(d);
                    if (
                      confirm(
                        n
                          ? t("orgDurakSilBekleyen", {
                              ad: durakAdiYaz(d, t),
                              n,
                            })
                          : t("orgSilinsinMi", { ad: durakAdiYaz(d, t) }),
                      )
                    )
                      degistir((y) =>
                        akisGuncelle(y, akis.id, (a) => ({
                          ...a,
                          duraklar: a.duraklar.filter((x) => x.id !== d.id),
                        })),
                      );
                  }}
                  data-sil={d.id}
                  etiket={t("sil")}
                >
                  <Trash2 size={15} />
                </SinirliDugme>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="dugme dugme-ikincil dugme-kucuk ara-ust-2"
          onClick={() => setDurak({ d: null, sira: akis.duraklar.length })}
          data-durak-ekle
        >
          <Plus size={14} /> {t("orgDurakEkle")}
        </button>
      </Kart>

      {durak && (
        <DurakPenceresi
          ben={ben}
          akis={akis}
          durak={durak.d}
          sira={durak.sira}
          kapat={() => setDurak(null)}
        />
      )}
      {akisAdi && (
        <AkisPenceresi
          ben={ben}
          akis={akisAdi === "yeni" ? null : akisAdi}
          kaynak={akis}
          kapat={(id) => {
            setAkisAdi(null);
            if (id) setSecili(id);
          }}
        />
      )}
    </>
  );
}

type Ceviri = ReturnType<typeof useDil>["t"];

export const akisAdiYaz = (a: Akis, t: Ceviri) =>
  a.ad ? yaz(a.ad) : a.id === "uretim" ? t("orgUretimAkisi") : a.id;
export const durakAdiYaz = (d: Durak, t: Ceviri) =>
  d.ad ? yaz(d.ad) : d.tur === "is" ? d.id : t(ADIM_ADI[d.tur]);

function SorumluYazisi({ s, y }: { s: Sorumlu; y: Yapi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  if (s.tur === "kol") return <>{t("orgKolunSahibi")}</>;
  if (s.tur === "birim") return <>{birimAdi(s.birim, y)}</>;
  if (s.tur === "unvan")
    return (
      <>
        {s.birim
          ? `${birimAdi(s.birim, y)} · ${gorevAdi(s.unvan, y)}`
          : gorevAdi(s.unvan, y)}
      </>
    );
  return (
    <>
      {s.kisiler.map((id) => ad(v.kisiler.find((k) => k.id === id))).join(", ")}
    </>
  );
}

/* --- Akış: ad ve kollar. Kol tek akışta: buraya alınan kol öbüründen çıkıyor. --- */

function AkisPenceresi({
  ben,
  akis,
  kaynak,
  kapat,
}: {
  ben: Kisi;
  akis: Akis | null;
  kaynak: Akis;
  kapat: (id?: string) => void;
}) {
  const { t } = useDil();
  const [ad, setAd] = useState<Metin | undefined>(
    metinMi(akis?.ad) ? akis.ad : undefined,
  );
  const [kollar, setKollar] = useState<IcerikTuru[]>(akis?.kollar ?? []);
  const temiz = adTemizle(ad);
  const hazir = !!temiz || akis?.id === "uretim";
  const kaydet = () => {
    // Yeni akış seçili akışın kopyasıyla başlıyor: yönetici sıfırdan değil, bugünkü yoldan değiştiriyor.
    const id = akis?.id ?? kimlik("a");
    yapiTaslagiDegistir(ben, (y) => {
      const govde = (a: Akis): Akis => ({
        ...a,
        ...(temiz ? { ad: temiz } : {}),
        kollar,
      });
      const akislar = akis
        ? y.akislar.map((a) => (a.id === akis.id ? govde(a) : a))
        : [
            ...y.akislar,
            govde({
              id,
              kollar: [],
              duraklar: kaynak.duraklar.map((d) => ({ ...d })),
            }),
          ];
      return {
        ...y,
        akislar: akislar.map((a) =>
          a.id === id
            ? a
            : { ...a, kollar: a.kollar.filter((k) => !kollar.includes(k)) },
        ),
      };
    });
    kapat(id);
  };
  return (
    <Pencere
      baslik={akis ? akisAdiYaz(akis, t) : t("orgAkisEkle")}
      kapat={() => kapat()}
      altBilgi={
        <button
          className="dugme"
          disabled={!hazir}
          onClick={kaydet}
          data-akis-kaydet
        >
          {t("kaydet")}
        </button>
      }
    >
      <div className="form" data-akis-formu>
        <AdAlanlari deger={ad} degistir={setAd} />
        <fieldset className="yetki-listesi">
          <legend>{t("orgKollar")}</legend>
          {ICERIK_TURLERI.map((k) => (
            <label key={k} className="secim">
              <input
                type="checkbox"
                checked={kollar.includes(k)}
                onChange={(e) =>
                  setKollar(
                    e.target.checked
                      ? [...kollar, k]
                      : kollar.filter((x) => x !== k),
                  )
                }
                data-akis-kol={k}
              />
              {t(TUR_ADI[k])}
            </label>
          ))}
        </fieldset>
      </div>
    </Pencere>
  );
}

/* --- Durak: ad, tür, sorumlu, yardımcılar, koşul, geri gönderme, aşama --- */

function DurakPenceresi({
  ben,
  akis,
  durak,
  sira,
  kapat,
}: {
  ben: Kisi;
  akis: Akis;
  durak: Durak | null;
  sira: number;
  kapat: () => void;
}) {
  const { t, ad: kisiAdi } = useDil();
  const v = useVeri();
  const taslak = yapiTaslagi(v, ben);
  const [f, setF] = useState<Durak>(
    durak ?? {
      id: kimlik("d"),
      tur: "is",
      sorumlu: { tur: "kol" },
      asama: "uretim",
    },
  );
  const [ad, setAd] = useState<Metin | undefined>(
    metinMi(durak?.ad) ? durak.ad : undefined,
  );
  const [ara, setAra] = useState("");
  const temiz = adTemizle(ad);
  const s = f.sorumlu;
  const sorumluTamam =
    s.tur === "kol" ||
    (s.tur === "birim" && !!s.birim) ||
    (s.tur === "unvan" && !!s.unvan) ||
    (s.tur === "kisi" && s.kisiler.length > 0);
  // Genel işin adı yok: yönetici adlandırmalı. Hazır işte boş ad türün adına dönüyor.
  const hazir = sorumluTamam && (f.tur !== "is" || !!temiz);
  const sorumluTuru = (tur: Sorumlu["tur"]): Sorumlu =>
    tur === "kol"
      ? { tur }
      : tur === "birim"
        ? { tur, birim: birimListesi(undefined, taslak)[0] }
        : tur === "unvan"
          ? { tur, unvan: unvanListesi(undefined, undefined, taslak)[0] }
          : { tur, kisiler: [] };
  const kaydet = () => {
    if (!hazir) return;
    const { ad: _, ...kalan } = f;
    const yeni: Durak = { ...kalan, ...(temiz ? { ad: temiz } : {}) };
    yapiTaslagiDegistir(ben, (y) =>
      akisGuncelle(y, akis.id, (a) => {
        if (durak)
          return {
            ...a,
            duraklar: a.duraklar.map((x) => (x.id === durak.id ? yeni : x)),
          };
        const l = [...a.duraklar];
        l.splice(sira, 0, yeni);
        return { ...a, duraklar: l };
      }),
    );
    kapat();
  };
  const kisiler = v.kisiler.filter((k) => !k.hesapsiz && !k.pasif);
  const aranan = ara.trim().toLocaleLowerCase();
  return (
    <Pencere
      baslik={durak ? durakAdiYaz(durak, t) : t("orgDurakEkle")}
      kapat={kapat}
      altBilgi={
        <button
          className="dugme"
          disabled={!hazir}
          onClick={kaydet}
          data-durak-kaydet
        >
          {t("kaydet")}
        </button>
      }
    >
      <div className="form" data-durak-formu>
        <label>
          {t("orgDurakTuru")}
          <select
            value={f.tur}
            onChange={(e) => setF({ ...f, tur: e.target.value as DurakTuru })}
            data-durak-tur
          >
            {DURAK_TURLERI.map((x) => (
              <option key={x} value={x}>
                {x === "is" ? t("orgGenelIsUzun") : t(ADIM_ADI[x])}
              </option>
            ))}
          </select>
        </label>
        <AdAlanlari
          deger={ad}
          varsayilan={f.tur === "is" ? undefined : dilde(ADIM_ADI[f.tur])}
          degistir={setAd}
        />

        <fieldset className="secim-grubu">
          <legend>{t("orgSorumlu")}</legend>
          {(["kol", "birim", "unvan", "kisi"] as const).map((x) => (
            <label key={x} className="secim">
              <input
                type="radio"
                name="sorumlu"
                checked={s.tur === x}
                onChange={() => setF({ ...f, sorumlu: sorumluTuru(x) })}
                data-sorumlu-tur={x}
              />
              {t(
                x === "kol"
                  ? "orgKolunSahibi"
                  : x === "birim"
                    ? "birim"
                    : x === "unvan"
                      ? "orgUnvan"
                      : "orgKisi",
              )}
            </label>
          ))}
        </fieldset>
        {s.tur === "birim" && (
          <select
            value={s.birim}
            onChange={(e) =>
              setF({ ...f, sorumlu: { tur: "birim", birim: e.target.value } })
            }
            aria-label={t("birim")}
            data-sorumlu-birim
          >
            {birimListesi(s.birim, taslak).map((b) => (
              <option key={b} value={b}>
                {birimAdi(b, taslak)}
              </option>
            ))}
          </select>
        )}
        {s.tur === "unvan" && (
          <div className="satir">
            <label>
              {t("orgUnvan")}
              <select
                value={s.unvan}
                onChange={(e) =>
                  setF({ ...f, sorumlu: { ...s, unvan: e.target.value } })
                }
                data-sorumlu-unvan
              >
                {unvanListesi(s.birim, s.unvan, taslak).map((u) => (
                  <option key={u} value={u}>
                    {gorevAdi(u, taslak)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("birim")}
              <select
                value={s.birim ?? ""}
                onChange={(e) =>
                  setF({
                    ...f,
                    sorumlu: {
                      tur: "unvan",
                      unvan: s.unvan,
                      ...(e.target.value ? { birim: e.target.value } : {}),
                    },
                  })
                }
                data-sorumlu-unvan-birim
              >
                <option value="">{t("orgHerBirim")}</option>
                {birimListesi(s.birim, taslak).map((b) => (
                  <option key={b} value={b}>
                    {birimAdi(b, taslak)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {s.tur === "kisi" && (
          <div className="kisi-secimi">
            <input
              type="search"
              value={ara}
              onChange={(e) => setAra(e.target.value)}
              placeholder={t("kisiAra")}
              aria-label={t("kisiAra")}
              data-sorumlu-ara
            />
            <div className="kisi-secimi-liste">
              {kisiler
                .filter(
                  (k) =>
                    s.kisiler.includes(k.id) ||
                    !aranan ||
                    [yaz(k.ad, "tr"), yaz(k.ad, "ar"), yaz(k.ad, "en")].some(
                      (x) => x.toLocaleLowerCase().includes(aranan),
                    ),
                )
                .slice(0, 30)
                .map((k) => (
                  <label key={k.id} className="secim">
                    <input
                      type="checkbox"
                      checked={s.kisiler.includes(k.id)}
                      onChange={(e) =>
                        setF({
                          ...f,
                          sorumlu: {
                            tur: "kisi",
                            kisiler: e.target.checked
                              ? [...s.kisiler, k.id]
                              : s.kisiler.filter((x) => x !== k.id),
                          },
                        })
                      }
                      data-sorumlu-kisi={k.id}
                    />
                    {kisiAdi(k)}{" "}
                    <small className="sonuk-yazi">{birimAdi(k.birim)}</small>
                  </label>
                ))}
            </div>
          </div>
        )}

        <details>
          <summary>{t("orgYardimci")}</summary>
          <div className="yetki-listesi">
            {birimListesi(undefined, taslak).map((b) => (
              <label key={b} className="secim">
                <input
                  type="checkbox"
                  checked={!!f.yardimci?.includes(b)}
                  onChange={(e) => {
                    const l: BirimId[] = e.target.checked
                      ? [...(f.yardimci ?? []), b]
                      : (f.yardimci ?? []).filter((x) => x !== b);
                    setF({ ...f, yardimci: l.length ? l : undefined });
                  }}
                  data-durak-yardimci={b}
                />
                {birimAdi(b, taslak)}
              </label>
            ))}
          </div>
        </details>

        <label className="secim">
          <input
            type="checkbox"
            checked={f.kosul === "saha"}
            onChange={(e) =>
              setF({ ...f, kosul: e.target.checked ? "saha" : undefined })
            }
            data-durak-saha
          />
          {t("orgYalnizSaha")}
        </label>
        <label className="secim">
          <input
            type="checkbox"
            checked={!!f.geriGonderir}
            onChange={(e) =>
              setF({ ...f, geriGonderir: e.target.checked || undefined })
            }
            data-durak-geri-gonderir
          />
          {t("orgGeriGonderir")}
        </label>
        <label>
          {t("orgAsama")}
          <select
            value={f.asama}
            onChange={(e) => setF({ ...f, asama: e.target.value as Asama })}
            data-durak-asama
          >
            {ASAMALAR.map((a) => (
              <option key={a} value={a}>
                {t(ASAMA_ADI[a])}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Pencere>
  );
}
