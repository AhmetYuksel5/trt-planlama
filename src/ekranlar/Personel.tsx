import { ArrowLeft, Camera, CalendarClock, Clock, Contact, Inbox, Mail, MapPin, MapPinned, Pencil, Phone, Radio, Route, Search, Star, ThumbsUp, Trash2, TrendingUp, UserRound, Users } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Avatar, BicimRozeti, Bos, Icerik, Kart, PaketDurumRozeti, Rozet, Sayac, TaslakEtiketi, bildir } from "../bilesenler/Parcalar";
import { OneriTablosu, PaketTablosu } from "../bilesenler/Tablolar";
import { tarihYaz, useDil, yaz, type Anahtar } from "../dil";
import { profilGuncelle, type ProfilGirdisi } from "../eylemler";
import { BICIM_ACIKLAMA, BICIM_ADI, BIRIM_ADI, CALISMA_ADI, GOREVLENDIRME_DURUM_ADI, GOREV_ADI, HAREKET_TURU_ADI, KISI_DURUM_ADI, kisiAr, satir, sehirAdi, ulkeAdi } from "../etiketler";
import { performans } from "../performans";
import { bugun, yerelGun } from "../tarih";
import { BICIMLER, BIRIMLER, CALISMA_BICIMLERI, SEHIRLER, ULKELER, kisiBul, sahaGorevi, useVeri, type Bicim, type Birim, type Gorevlendirme, type Kisi, type Sehir, type Ulke } from "../veri";
import { gorevlendirmeGorebilir, performansGorebilir, profilDuzenler, yapabilir } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";

/*
 * Personel ve görevlendirmeler. Yaklaşık yüz kişilik kadro için arama ve
 * süzgeç öne çıkıyor. Muhabir profili planlamanın sorduğu soruları tek
 * sayfada yanıtlıyor: nerede, nereye gidebilir, hangi türde haber
 * üretir, işini ne hızda ve hangi nitelikte teslim ediyor.
 */

const PERSONEL_SAYFASI: Record<string, { baslik: Anahtar; alt: Anahtar; ikon: ReactNode; suz: (k: Kisi) => boolean }> = {
  muhabirler: { baslik: "mMuhabirler", alt: "muhabirlerAlt", ikon: <Users size={26} />, suz: (k) => k.birim === "muhabir" },
  editorler: { baslik: "mEditorler", alt: "editorlerAlt", ikon: <UserRound size={26} />, suz: (k) => ["editor", "dilDenetmeni", "newsdesk", "programEditoru", "planlamaci"].includes(k.gorev) },
  personel: { baslik: "mPersonel", alt: "personelAlt", ikon: <Contact size={26} />, suz: (k) => k.birim !== "muhabir" },
};

const yuzde = (x: number | null) => (x === null ? "—" : `%${Math.round(x * 100)}`);
const ondalik = (x: number | null, dil: string) => (x === null ? "—" : x.toLocaleString(dil === "ar" ? "ar-u-nu-latn" : dil, { maximumFractionDigits: 1 }));

/** Kişinin ana görev ülkesi ve çalışabildiği diğer ülkeler: "Lübnan'da kim çalışabilir?" sorusu için. */
const ulkeleri = (k: Kisi): Ulke[] => [SEHIRLER[k.sehir], ...k.digerUlkeler];

export function PersonelListe({ ben, sayfa }: { ben: Kisi; sayfa: string }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const ayar = PERSONEL_SAYFASI[sayfa] ?? PERSONEL_SAYFASI.personel;
  const muhabirSayfasi = sayfa === "muhabirler";
  const [aranan, setAranan] = useState("");
  const [birim, setBirim] = useState<Birim | "">("");
  const [ulke, setUlke] = useState<Ulke | "">("");
  const [bicim, setBicim] = useState<Bicim | "">("");
  const q = aranan.trim().toLocaleLowerCase();
  const tum = v.kisiler.filter(ayar.suz);
  const liste = tum
    .filter(
      (k) =>
        (!birim || k.birim === birim) &&
        (!ulke || ulkeleri(k).includes(ulke)) &&
        (!bicim || k.bicimler.includes(bicim)) &&
        (!q || `${ad(k)} ${yaz(k.ad, "ar")} ${k.kisaltma} ${t(sehirAdi(k.sehir))}`.toLocaleLowerCase().includes(q)),
    )
    .sort((a, b) => ad(a).localeCompare(ad(b)));
  const perfGorur = muhabirSayfasi && tum.some((k) => performansGorebilir(ben, k) && k.id !== ben.id);

  return (
    <>
      <SayfaBasi ikon={ayar.ikon} baslik={t(ayar.baslik)} />
      <Kart>
        <div className="suzgec">
          <label className="arama arama-kutu">
            <Search size={16} />
            <input type="search" dir="auto" value={aranan} onChange={(e) => setAranan(e.target.value)} placeholder={t("kisiAra")} aria-label={t("kisiAra")} />
          </label>
          {muhabirSayfasi ? (
            <>
              <select className="girdi" value={ulke} onChange={(e) => setUlke(e.target.value as Ulke | "")} aria-label={t("ulkeSuzgeci")}>
                <option value="">{t("tumUlkeler")}</option>
                {ULKELER.filter((u) => tum.some((k) => ulkeleri(k).includes(u))).map((u) => (
                  <option key={u} value={u}>
                    {t(ulkeAdi(u))}
                  </option>
                ))}
              </select>
              <select className="girdi" value={bicim} onChange={(e) => setBicim(e.target.value as Bicim | "")} aria-label={t("haberTuru")}>
                <option value="">{t("tumHaberTurleri")}</option>
                {BICIMLER.map((b) => (
                  <option key={b} value={b}>
                    {t(BICIM_ADI(b))}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <select className="girdi" value={birim} onChange={(e) => setBirim(e.target.value as Birim | "")} aria-label={t("birim")}>
              <option value="">{t("tumBirimler")}</option>
              {BIRIMLER.filter((b) => tum.some((k) => k.birim === b)).map((b) => (
                <option key={b} value={b}>
                  {t(BIRIM_ADI[b])}
                </option>
              ))}
            </select>
          )}
          <span className="bos-kucuk">{t("kisiSayisi", { n: liste.length })}</span>
        </div>
        <div className="tablo-sar">
          {muhabirSayfasi ? (
            <table className="tablo kartli">
              <thead>
                <tr>
                  <th>{t("muhabir")}</th>
                  <th>{t("anaGorevBolgesi")}</th>
                  <th>{t("digerUlkeler")}</th>
                  <th>{t("haberTurleri")}</th>
                  {perfGorur && <th>{t("verilenTamamlanan")}</th>}
                  {perfGorur && <th>{t("zamanindaTeslim")}</th>}
                  {perfGorur && <th>{t("nitelikPuani")}</th>}
                  <th>{t("durum")}</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((k) => {
                  const pf = perfGorur ? performans(v, k.id) : null;
                  return (
                    <tr key={k.id}>
                      <td className="birincil">
                        <a className="kisi-hucre kalin" href={`#/muhabirler/${k.id}`}>
                          <Avatar kisi={k} boy="kucuk" durum />
                          <span>
                            {ad(k)}
                            <small className="sonuk ince">
                              <bdi>{k.kisaltma}</bdi> · {t(CALISMA_ADI[k.calisma])}
                            </small>
                          </span>
                        </a>
                      </td>
                      <td data-etiket={t("anaGorevBolgesi")}>
                        {t(sehirAdi(k.sehir))} <small className="sonuk">· {t(ulkeAdi(SEHIRLER[k.sehir]))}</small>
                      </td>
                      <td className="sonuk" data-etiket={t("digerUlkeler")}>
                        {k.digerUlkeler.length ? k.digerUlkeler.map((u) => t(ulkeAdi(u))).join(", ") : "—"}
                      </td>
                      <td data-etiket={t("haberTurleri")}>
                        <span className="rozetler">
                          {k.bicimler.map((b) => (
                            <BicimRozeti key={b} bicim={b} />
                          ))}
                        </span>
                      </td>
                      {pf && (
                        <td data-etiket={t("verilenTamamlanan")}>
                          <b>{pf.verilen}</b> / {pf.tamamlanan}
                        </td>
                      )}
                      {pf && <td data-etiket={t("zamanindaTeslim")}>{yuzde(pf.zamaninda)}</td>}
                      {pf && (
                        <td data-etiket={t("nitelikPuani")}>
                          {pf.puan === null ? (
                            "—"
                          ) : (
                            <span className="puan">
                              <Star size={13} /> {ondalik(pf.puan, dil)}
                            </span>
                          )}
                        </td>
                      )}
                      <td data-etiket={t("durum")}>
                        <Rozet ton={k.durum === "sahada" ? "vurgu" : k.durum === "izinli" ? "" : k.durum === "yolda" ? "uyari" : "iyi"}>{t(KISI_DURUM_ADI[k.durum])}</Rozet>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="tablo kartli">
              <thead>
                <tr>
                  <th>{t("ad")}</th>
                  <th>{t("birim")}</th>
                  <th>{t("gorev")}</th>
                  <th>{t("konum")}</th>
                  <th>{t("durum")}</th>
                  <th>{t("diller")}</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((k) => (
                  <tr key={k.id}>
                    <td className="birincil">
                      <a className="kisi-hucre kalin" href={`#/${k.birim === "muhabir" ? "muhabirler" : "personel"}/${k.id}`}>
                        <Avatar kisi={k} boy="kucuk" durum /> {ad(k)}
                      </a>
                    </td>
                    <td data-etiket={t("birim")}>{t(BIRIM_ADI[k.birim])}</td>
                    <td className="sonuk" data-etiket={t("gorev")}>
                      {t(GOREV_ADI[k.gorev])}
                      {k.calisma !== "kadrolu" && (
                        <>
                          {" "}
                          <Rozet>{t(CALISMA_ADI[k.calisma])}</Rozet>
                        </>
                      )}
                    </td>
                    <td data-etiket={t("konum")}>{t(sehirAdi(k.sehir))}</td>
                    <td data-etiket={t("durum")}>
                      <Rozet ton={k.durum === "sahada" ? "vurgu" : k.durum === "izinli" ? "" : k.durum === "yolda" ? "uyari" : "iyi"}>{t(KISI_DURUM_ADI[k.durum])}</Rozet>
                    </td>
                    <td className="sonuk" data-etiket={t("diller")}>
                      <bdi>{k.diller.join(" · ").toUpperCase()}</bdi>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {liste.length === 0 && <Bos metin={t("kayitYok")} />}
      </Kart>
      {muhabirSayfasi && <HaberTurleri />}
    </>
  );
}

/** Haber türleri ve tanımları: planlamanın ortak sözlüğü; kaç muhabirin üretebildiği yanında. */
function HaberTurleri() {
  const { t } = useDil();
  const v = useVeri();
  const muhabirler = v.kisiler.filter((k) => k.birim === "muhabir");
  return (
    <Kart baslik={t("haberTurleri")}>
      <div className="tablo-sar">
        <table className="tablo kartli">
          <thead>
            <tr>
              <th>{t("haberTuru")}</th>
              <th>{t("turAciklama")}</th>
              <th>{t("muhabir")}</th>
            </tr>
          </thead>
          <tbody>
            {BICIMLER.map((b) => (
              <tr key={b}>
                <td className="birincil kalin">
                  <bdi>{t(BICIM_ADI(b))}</bdi>
                </td>
                <td data-etiket={t("turAciklama")}>{t(BICIM_ACIKLAMA(b))}</td>
                <td className="sonuk" data-etiket={t("muhabir")}>
                  {t("turUretebilen", { n: muhabirler.filter((k) => k.bicimler.includes(b)).length })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Kart>
  );
}

/*
 * Fotoğraf tarayıcıda saklanıyor: kare kırpılıp 256 piksele küçültülüyor
 * ki localStorage'ın birkaç megabaytlık sınırını tek kişi doldurmasın.
 * Sunucu fazında dosya deposuna gidecek.
 */
const fotoKucult = (dosya: File): Promise<string> =>
  new Promise((coz, reddet) => {
    const img = new Image();
    const url = URL.createObjectURL(dosya);
    img.onload = () => {
      const kenar = Math.min(img.width, img.height);
      const tuval = document.createElement("canvas");
      tuval.width = tuval.height = 256;
      tuval.getContext("2d")?.drawImage(img, (img.width - kenar) / 2, (img.height - kenar) / 2, kenar, kenar, 0, 0, 256, 256);
      URL.revokeObjectURL(url);
      coz(tuval.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reddet(new Error("foto"));
    };
    img.src = url;
  });

function ProfilFoto({ ben, kisi }: { ben: Kisi; kisi: Kisi }) {
  const { t } = useDil();
  const girdi = useRef<HTMLInputElement>(null);
  const duzenler = profilDuzenler(ben, kisi);
  return (
    <div className="profil-foto">
      <Avatar kisi={kisi} boy="dev" durum />
      {duzenler && (
        <div className="dugmeler">
          <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => girdi.current?.click()}>
            <Camera size={14} /> {t(kisi.foto ? "fotoDegistir" : "fotoYukle")}
          </button>
          {kisi.foto && (
            <button className="dugme dugme-sade dugme-ikon" aria-label={t("fotoKaldir")} title={t("fotoKaldir")} onClick={() => profilGuncelle(ben, kisi.id, { foto: undefined })}>
              <Trash2 size={15} />
            </button>
          )}
          <input
            ref={girdi}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const dosya = e.target.files?.[0];
              e.target.value = "";
              if (!dosya) return;
              try {
                if (profilGuncelle(ben, kisi.id, { foto: await fotoKucult(dosya) })) bildir(t("bProfilKaydedildi"));
              } catch {
                bildir(t("fotoOkunamadi"));
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Performans kartı: göstergeler kayıtlardan; tanımlar birimle netleşene kadar taslak. */
function PerformansKarti({ kisi }: { kisi: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const pf = performans(v, kisi.id);
  const enCok = Math.max(1, ...Object.values(pf.bicimler).map((n) => n ?? 0));
  return (
    <Kart baslik={t("performans")} ikon={<TrendingUp size={18} />} sagUc={<TaslakEtiketi />}>
      <div className="sayaclar sayaclar-dar">
        <Sayac ikon={<Radio size={20} />} etiket={t("verilenHaber")} deger={pf.verilen} alt={`${t("devamEdenIs")}: ${pf.devamEden}`} />
        <Sayac ikon={<ThumbsUp size={20} />} etiket={t("tamamlananHaber")} deger={pf.tamamlanan} alt={pf.verilen ? yuzde(pf.tamamlanan / pf.verilen) : undefined} ton="iyi" />
        <Sayac ikon={<Clock size={20} />} etiket={t("zamanindaTeslim")} deger={yuzde(pf.zamaninda)} ton={pf.zamaninda !== null && pf.zamaninda < 0.7 ? "uyari" : ""} />
        <Sayac ikon={<CalendarClock size={20} />} etiket={t("ortTeslimSuresi")} deger={pf.ortSaat === null ? "—" : t("saatKisa", { n: ondalik(pf.ortSaat, dil) })} />
        <Sayac ikon={<Pencil size={20} />} etiket={t("ilkSeferdeKabul")} deger={yuzde(pf.ilkSeferde)} />
        <Sayac ikon={<Star size={20} />} etiket={t("nitelikPuani")} deger={pf.puan === null ? "—" : `${ondalik(pf.puan, dil)} / 5`} alt={t("puanSayisi", { n: pf.puanSayisi })} />
        <Sayac ikon={<Inbox size={20} />} etiket={t("oneriKabul")} deger={yuzde(pf.oneriKabul)} />
      </div>
      {Object.keys(pf.bicimler).length > 0 && (
        <div className="ara-ust-2">
          <div className="alan-etiket">{t("turDagilimi")}</div>
          <ul className="cubuklar">
            {BICIMLER.filter((b) => pf.bicimler[b]).map((b) => (
              <li key={b}>
                <span title={t(BICIM_ACIKLAMA(b))}>{t(BICIM_ADI(b))}</span>
                <i style={{ inlineSize: `${((pf.bicimler[b] ?? 0) / enCok) * 100}%` }} />
                <b>{pf.bicimler[b]}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Kart>
  );
}

function ProfilFormu({ ben, kisi, kapat }: { ben: Kisi; kisi: Kisi; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState<Required<Omit<ProfilGirdisi, "foto">>>({
    telefon: kisi.telefon,
    eposta: kisi.eposta,
    kisiselEposta: kisi.kisiselEposta ?? "",
    irtibat: kisi.irtibat ?? "",
    kisaltma: kisi.kisaltma,
    sehir: kisi.sehir,
    calisma: kisi.calisma,
    digerUlkeler: kisi.digerUlkeler,
    bicimler: kisi.bicimler,
  });
  const sec = <T,>(liste: T[], x: T) => (liste.includes(x) ? liste.filter((y) => y !== x) : [...liste, x]);
  const anaUlke = SEHIRLER[f.sehir];
  return (
    <Kart baslik={t("profiliDuzenle")}>
      <div className="form">
        <div className="satir">
          <label>
            {t("telefon")}
            <input dir="ltr" value={f.telefon} onChange={(e) => setF({ ...f, telefon: e.target.value })} />
          </label>
          <label>
            {t("kisaltma")}
            <input dir="ltr" maxLength={3} value={f.kisaltma} onChange={(e) => setF({ ...f, kisaltma: e.target.value.toUpperCase() })} />
          </label>
        </div>
        <label>
          {t("kurumsalEposta")}
          <input dir="ltr" type="email" value={f.eposta} onChange={(e) => setF({ ...f, eposta: e.target.value })} />
        </label>
        <label>
          {t("kisiselEposta")}
          <input dir="ltr" type="email" value={f.kisiselEposta} onChange={(e) => setF({ ...f, kisiselEposta: e.target.value })} />
        </label>
        <label>
          {t("irtibat")}
          <input dir="auto" value={f.irtibat} onChange={(e) => setF({ ...f, irtibat: e.target.value })} />
        </label>
        <div className="satir">
          <label>
            {t("anaGorevBolgesi")}
            <select value={f.sehir} onChange={(e) => setF({ ...f, sehir: e.target.value as Sehir })}>
              {(Object.keys(SEHIRLER) as Sehir[]).map((s) => (
                <option key={s} value={s}>
                  {t(sehirAdi(s))} · {t(ulkeAdi(SEHIRLER[s]))}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("calismaBicimi")}
            <select value={f.calisma} disabled={!yapabilir(ben, "profilDuzenle")} onChange={(e) => setF({ ...f, calisma: e.target.value as Kisi["calisma"] })}>
              {CALISMA_BICIMLERI.map((c) => (
                <option key={c} value={c}>
                  {t(CALISMA_ADI[c])}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="secim-grubu">
          <legend>{t("digerUlkeler")}</legend>
          {ULKELER.filter((u) => u !== anaUlke).map((u) => (
            <label key={u} className="secim-cip">
              <input type="checkbox" checked={f.digerUlkeler.includes(u)} onChange={() => setF({ ...f, digerUlkeler: sec(f.digerUlkeler, u) })} />
              {t(ulkeAdi(u))}
            </label>
          ))}
        </fieldset>
        <fieldset className="secim-grubu">
          <legend>{t("uretebildigiTurler")}</legend>
          {BICIMLER.map((b) => (
            <label key={b} className="secim-cip" title={t(BICIM_ACIKLAMA(b))}>
              <input type="checkbox" checked={f.bicimler.includes(b)} onChange={() => setF({ ...f, bicimler: sec(f.bicimler, b) })} />
              {t(BICIM_ADI(b))}
            </label>
          ))}
        </fieldset>
        <div className="form-alt">
          <button className="dugme dugme-ikincil" onClick={kapat}>
            {t("iptal")}
          </button>
          <button
            className="dugme"
            disabled={!f.telefon.trim() || f.kisaltma.trim().length < 2}
            onClick={() => {
              const g: ProfilGirdisi = {
                ...f,
                kisiselEposta: f.kisiselEposta.trim() || undefined,
                irtibat: f.irtibat.trim() || undefined,
                digerUlkeler: f.digerUlkeler.filter((u) => u !== SEHIRLER[f.sehir]),
              };
              if (profilGuncelle(ben, kisi.id, g)) {
                bildir(t("bProfilKaydedildi"));
                kapat();
              }
            }}
          >
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Kart>
  );
}

export function KisiDetay({ ben, kisi }: { ben: Kisi; kisi: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [duzen, setDuzen] = useState(false);
  const muhabir = kisi.birim === "muhabir";
  const paketler = v.paketler.filter((p) => p.muhabirId === kisi.id).sort((a, b) => b.guncelleme.localeCompare(a.guncelleme));
  const devam = paketler.filter((p) => p.durum !== "tamamlandi" && p.durum !== "iptal");
  const biten = paketler.filter((p) => p.durum === "tamamlandi");
  const oneriler = v.oneriler.filter((o) => o.muhabirId === kisi.id).sort((a, b) => b.zaman.localeCompare(a.zaman));
  const gorevler = v.gorevlendirmeler.filter((g) => g.kisiId === kisi.id);
  const kendisi = ben.id === kisi.id;
  /* Adın öbür yazımı: arayüz Arapçaysa Latin, değilse Arapça; ikisi de rehberde aranıyor. */
  const obur = yaz(kisi.ad, dil === "ar" ? "tr" : "ar");
  return (
    <>
      {!kendisi && (
        <a className="geri-bag" href={muhabir ? "#/muhabirler" : "#/personel"}>
          <ArrowLeft size={14} className="yon" /> {t(muhabir ? "mMuhabirler" : "mPersonel")}
        </a>
      )}
      <header className="sayfa-basi profil-bas">
        <ProfilFoto ben={ben} kisi={kisi} />
        <div>
          <h1>{ad(kisi)}</h1>
          {obur !== ad(kisi) && <p className="obur-ad">{obur}</p>}
          <p>
            {t(BIRIM_ADI[kisi.birim])} · {t(GOREV_ADI[kisi.gorev])} · {t(sehirAdi(kisi.sehir))}
          </p>
          <p className="rozetler">
            <Rozet ton={kisi.durum === "sahada" ? "vurgu" : kisi.durum === "yolda" ? "uyari" : kisi.durum === "izinli" ? "" : "iyi"}>{t(KISI_DURUM_ADI[kisi.durum])}</Rozet>
            <Rozet>{t(CALISMA_ADI[kisi.calisma])}</Rozet>
            <Rozet>
              <bdi>{kisi.kisaltma}</bdi>
            </Rozet>
          </p>
        </div>
        {profilDuzenler(ben, kisi) && !duzen && (
          <div className="sag-uc">
            <button className="dugme dugme-ikincil" onClick={() => setDuzen(true)}>
              <Pencil size={15} /> {t("profiliDuzenle")}
            </button>
          </div>
        )}
      </header>
      <div className="iz iz-ana-yan">
        <div className="iz">
          {muhabir && performansGorebilir(ben, kisi) && <PerformansKarti kisi={kisi} />}
          {muhabir && (
            <>
              <Kart baslik={t("devamEdenIsler")}>
                <PaketTablosu paketler={devam} d={v} sutunlar={["baslik", "tur", "asama", "kimde", "teslim"]} bosMetin={t("kayitYok")} />
              </Kart>
              <Kart baslik={t("tamamlananIsler")} ek={String(biten.length)}>
                {biten.length === 0 ? (
                  <Bos kucuk metin={t("kayitYok")} />
                ) : (
                  <ul className="liste">
                    {biten.slice(0, 10).map((p) => (
                      <li key={p.id}>
                        <div className="ad">
                          <a href={`#/paketler/${p.id}`}>
                            <Icerik blok>{p.baslik}</Icerik>
                          </a>
                          <small>
                            {p.kod} · {tarihYaz(yerelGun(p.guncelleme), dil, "kisa")}
                          </small>
                        </div>
                        {p.bicim && <BicimRozeti bicim={p.bicim} />}
                        {p.nitelik && performansGorebilir(ben, kisi) ? (
                          <span className="puan">
                            <Star size={13} /> {p.nitelik}
                          </span>
                        ) : (
                          <PaketDurumRozeti paket={p} />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Kart>
              <Kart baslik={t("oneriGecmisi")}>
                <OneriTablosu oneriler={oneriler} d={v} kisa />
              </Kart>
            </>
          )}
          {!muhabir && (
            <Kart baslik={t("sonIslemler")}>
              <PaketTablosu
                paketler={v.paketler.filter((p) => v.hareketler.some((h) => h.paketId === p.id && h.kisiId === kisi.id)).slice(0, 10)}
                d={v}
                sutunlar={["baslik", "muhabir", "asama", "kimde"]}
                bosMetin={t("kayitYok")}
              />
            </Kart>
          )}
        </div>
        <div className="iz">
          {duzen && <ProfilFormu ben={ben} kisi={kisi} kapat={() => setDuzen(false)} />}
          {muhabir && (
            <Kart baslik={t("anaGorevBolgesi")} ikon={<MapPin size={18} />}>
              <p className="kalin">
                {t(sehirAdi(kisi.sehir))} · {t(ulkeAdi(SEHIRLER[kisi.sehir]))}
              </p>
              <div className="alan-etiket ara-ust-2">{t("digerUlkeler")}</div>
              {kisi.digerUlkeler.length ? (
                <p className="rozetler ara-ust">
                  {kisi.digerUlkeler.map((u) => (
                    <Rozet key={u}>{t(ulkeAdi(u))}</Rozet>
                  ))}
                </p>
              ) : (
                <p className="bos-kucuk">{t("yok")}</p>
              )}
              <div className="alan-etiket ara-ust-2">{t("uretebildigiTurler")}</div>
              <ul className="tur-listesi ara-ust">
                {kisi.bicimler.map((b) => (
                  <li key={b}>
                    <BicimRozeti bicim={b} />
                    <small>{t(BICIM_ACIKLAMA(b))}</small>
                  </li>
                ))}
              </ul>
            </Kart>
          )}
          <Kart baslik={t("iletisim")} ikon={<Phone size={18} />}>
            <ul className="liste">
              <li>
                <Phone size={16} className="sonuk-yazi" />
                <div className="ad">
                  <small>{t("telefon")}</small>
                  <b dir="ltr">{kisi.telefon}</b>
                </div>
              </li>
              <li>
                <Mail size={16} className="sonuk-yazi" />
                <div className="ad">
                  <small>{t("kurumsalEposta")}</small>
                  <b dir="ltr">{kisi.eposta}</b>
                </div>
              </li>
              {kisi.kisiselEposta && (
                <li>
                  <Mail size={16} className="sonuk-yazi" />
                  <div className="ad">
                    <small>{t("kisiselEposta")}</small>
                    <b dir="ltr">{kisi.kisiselEposta}</b>
                  </div>
                </li>
              )}
              {kisi.irtibat && (
                <li>
                  <Radio size={16} className="sonuk-yazi" />
                  <div className="ad">
                    <small>{t("irtibat")}</small>
                    <b dir="auto">{kisi.irtibat}</b>
                  </div>
                </li>
              )}
            </ul>
          </Kart>
          <Kart baslik={t("bilgiler")}>
            <div className="alanlar">
              <div className="alan">
                <small>{t("diller")}</small>
                <b dir="ltr">{kisi.diller.join(" · ").toUpperCase()}</b>
              </div>
              <div className="alan">
                <small>{t("calismaBicimi")}</small>
                <b>{t(CALISMA_ADI[kisi.calisma])}</b>
              </div>
              <div className="alan">
                <small>{t("rol")}</small>
                <b>{t(kisi.rol === "yonetici" ? "rolYonetici" : "rolPersonel")}</b>
              </div>
            </div>
          </Kart>
          <Kart baslik={t("gorevlendirmeler")}>
            {gorevler.length === 0 ? <Bos kucuk metin={t("gorevlendirmeYok")} /> : <GorevListesi gorevler={gorevler} />}
          </Kart>
        </div>
      </div>
    </>
  );
}

function GorevListesi({ gorevler }: { gorevler: Gorevlendirme[] }) {
  const { t, dil } = useDil();
  const v = useVeri();
  return (
    <ul className="liste">
      {gorevler.map((g) => {
        const k = kisiBul(v, g.kisiId);
        return (
          <li key={g.id}>
            <Avatar kisi={k} boy="kucuk" />
            <div className="ad">
              <b>
                <Icerik blok>{satir(g.yer, kisiAr(k))}</Icerik>
              </b>
              <small>
                {t(HAREKET_TURU_ADI[g.tur])} · {tarihYaz(g.baslangic, dil, "kisa")} – {tarihYaz(g.bitis, dil, "kisa")}
              </small>
              <small>
                <Icerik blok>{g.aciklama}</Icerik>
              </small>
            </div>
            <Rozet ton={g.durum === "talep" ? "uyari" : g.durum === "bitti" ? "" : "vurgu"}>{t(GOREVLENDIRME_DURUM_ADI[g.durum])}</Rozet>
          </li>
        );
      })}
    </ul>
  );
}

/* --- Görevlendirmeler: News Gathering'in alanı; akışı henüz tanımlanmadı --- */

const GOREV_SAYFASI: Record<string, { baslik: Anahtar; alt: Anahtar; ikon: ReactNode; suz: (g: Gorevlendirme, B: string) => boolean }> = {
  saha: { baslik: "mSaha", alt: "sahaAlt", ikon: <MapPinned size={26} />, suz: sahaGorevi },
  seyahat: { baslik: "mSeyahat", alt: "seyahatAlt", ikon: <Route size={26} />, suz: (g, B) => g.bitis >= B },
  talepler: { baslik: "mTalepler", alt: "taleplerAlt", ikon: <Inbox size={26} />, suz: (g) => g.durum === "talep" },
  izinler: { baslik: "mIzinler", alt: "izinlerAlt", ikon: <CalendarClock size={26} />, suz: (g, B) => g.bitis >= B },
};

export function Gorevlendirmeler({ ben, sayfa }: { ben: Kisi; sayfa: string }) {
  const { t } = useDil();
  const v = useVeri();
  const B = bugun();
  const muhabir = ben.birim === "muhabir";
  const ayar = GOREV_SAYFASI[sayfa] ?? GOREV_SAYFASI.saha;
  const liste = v.gorevlendirmeler
    .filter((g) => gorevlendirmeGorebilir(ben, g) && (muhabir || ayar.suz(g, B)))
    .sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  return (
    <>
      <SayfaBasi ikon={ayar.ikon} baslik={t(muhabir ? "mGorevlerim" : ayar.baslik)} sagUc={muhabir ? undefined : <TaslakEtiketi />} />
      <Kart>{liste.length === 0 ? <Bos metin={t("gorevlendirmeYok")} /> : <GorevListesi gorevler={liste} />}</Kart>
    </>
  );
}

