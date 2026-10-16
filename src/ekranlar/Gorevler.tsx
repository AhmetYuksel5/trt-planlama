import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ClipboardList, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { AnildigimNotlar } from "../bilesenler/Anma";
import { useState } from "react";
import { Avatar, Bos, Kart, Pencere, Rozet, bildir } from "../bilesenler/Parcalar";
import { aralikYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { gorevDonemSorumlusu, gorevKaydet, gorevSil, isDurumu, isKaydet, isSil } from "../eylemler";
import { IS_DURUM_ADI, TEMEL_GOREV_ADI } from "../etiketler";
import { donemAnahtari, donemOnizlemesi, etiketAyir, etiketler, gorevListesi, isListesi, kisininGorevleri, kisininIsleri, sorumlular } from "../gorevler";
import { bugun, gunEkle, haftaBasi } from "../tarih";
import { IS_DURUMLARI, TEMEL_GOREVLER, kimlik, useVeri, type Durum, type GorevTanimi, type Is, type IsDurumu, type Kisi, type TemelGorev } from "../veri";
import { gorevleriDuzenler, isDegistirebilir, isEkleyebilir } from "../yetki";
import { birimAdi } from "../yapi";
import { SayfaBasi } from "./ana/Planlama";

/*
 * Planlama görevleri ve iş taksimi (#/gorevler): temel görevler planların
 * kendisi, yan görevler etiketli; her görevin sorumlusu sabit ya da sıralı
 * (gorevler.ts). Üstte seçilen gün için "kim ne yapıyor", altında görev
 * tanımları ve tek seferlik işler.
 */

/** Görevin ekrandaki adı: temel görev dil tablosundan, yan görev yazıldığı gibi. */
export const useGorevAdi = () => {
  const { t } = useDil();
  return (g: GorevTanimi) => (g.tur === "temel" && g.temel ? t(TEMEL_GOREV_ADI[g.temel]) : g.ad);
};

/** Görev alınabilecek kişiler: Planlama birimi (pasif olmayan), adıyla sıralı. */
const planlamacilar = (d: Durum) => d.kisiler.filter((k) => k.birim === "planlama" && !k.pasif);

export default function Gorevler({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const [tarih, setTarih] = useState(bugun());
  return (
    <>
      <SayfaBasi ikon={<ClipboardList size={26} />} baslik={t("mGorevler")} />
      <AnildigimNotlar ben={ben} />
      <div className="gorev-gun" data-gv-gun={tarih}>
        <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setTarih(gunEkle(tarih, -1))} title={t("oncekiGun")} aria-label={t("oncekiGun")}>
          <ChevronLeft size={18} className="yon" />
        </button>
        <b>{tarihYaz(tarih, dil, "uzun")}</b>
        <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setTarih(gunEkle(tarih, 1))} title={t("sonrakiGun")} aria-label={t("sonrakiGun")}>
          <ChevronRight size={18} className="yon" />
        </button>
        {tarih !== bugun() && (
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setTarih(bugun())}>
            {t("bugun")}
          </button>
        )}
      </div>
      <div className="iz">
        <KimNeYapiyor tarih={tarih} />
        <GorevTanimlari ben={ben} tarih={tarih} />
        <Isler ben={ben} />
      </div>
    </>
  );
}

/* --- Seçilen gün: kişi kişi görevler ve açık işler --- */

function KimNeYapiyor({ tarih }: { tarih: string }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const adi = useGorevAdi();
  const kisiler = planlamacilar(v);
  return (
    <Kart baslik={t("gvKimNeYapiyor")} ikon={<Users size={18} />}>
      <ul className="liste gorev-kisileri">
        {kisiler.map((k) => {
          const gorevler = kisininGorevleri(v, k.id, tarih);
          const isler = kisininIsleri(v, k.id);
          return (
            <li key={k.id} data-gv-kisi={k.id}>
              <Avatar kisi={k} boy="kucuk" />
              <span className="ad">
                <b>{ad(k)}</b>
                {k.durum === "izinli" && <Rozet ton="uyari">{t("kdIzinli")}</Rozet>}
              </span>
              <span className="cipler">
                {gorevler.map((g) => (
                  <span key={g.id} className={`cip${g.tur === "temel" ? " cip-vurgu" : ""}`} data-gv-kisi-gorev={g.id}>
                    <bdi>{adi(g)}</bdi>
                  </span>
                ))}
                {isler.length > 0 && <Rozet>{t("gvAcikIs", { n: isler.length })}</Rozet>}
                {!gorevler.length && !isler.length && <span className="sonuk">—</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </Kart>
  );
}

/* --- Görev tanımları --- */

function GorevTanimlari({ ben, tarih }: { ben: Kisi; tarih: string }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const adi = useGorevAdi();
  const duzenler = gorevleriDuzenler(ben);
  const [etiket, setEtiket] = useState("");
  const [acik, setAcik] = useState<GorevTanimi | null>(null);
  const tumu = etiketler(v);
  const liste = gorevListesi(v).filter((g) => !etiket || g.etiketler.includes(etiket));
  const yeni = (): GorevTanimi => ({ id: kimlik("gv"), tur: "yan", ad: "", etiketler: etiket ? [etiket] : [], dagilim: { tur: "sabit", kisiler: [] } });
  return (
    <Kart
      baslik={t("gvGorevler")}
      ikon={<ClipboardList size={18} />}
      sagUc={
        duzenler && (
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setAcik(yeni())} data-gv-ekle>
            <Plus size={14} /> {t("gvGorevEkle")}
          </button>
        )
      }
    >
      {tumu.length > 0 && <EtiketSuzgeci etiketler={tumu} secili={etiket} sec={setEtiket} />}
      <ul className="liste gorev-listesi">
        {liste.map((g) => {
          const s = sorumlular(v, g, tarih);
          const bagli = g.tur === "yan" && g.temel;
          return (
            <li key={g.id} data-gv-gorev={g.id} className={g.pasif ? "soluk" : ""}>
              <div className="ad">
                <b>
                  <bdi>{adi(g)}</bdi>
                </b>{" "}
                <Rozet ton={g.tur === "temel" ? "vurgu" : undefined}>{t(g.tur === "temel" ? "gvTemel" : "gvYan")}</Rozet>
                {bagli && <small className="sonuk"> → {t(TEMEL_GOREV_ADI[g.temel!])}</small>}
                <div className="cipler ara-ust">
                  {g.etiketler.map((e) => (
                    <span key={e} className="cip cip-kucuk">
                      #<bdi>{e}</bdi>
                    </span>
                  ))}
                  <small className="sonuk" data-gv-dagilim>
                    {dagilimMetni(g, (id) => ad(v.kisiler.find((k) => k.id === id)), t)}
                  </small>
                </div>
              </div>
              <span className="gorev-sorumlu" data-gv-sorumlu={s.join(",")}>
                {s.length ? s.map((id) => <Avatar key={id} kisi={v.kisiler.find((k) => k.id === id)} boy="kucuk" />) : <span className="sonuk">{t("gvSorumluYok")}</span>}
                {duzenler && g.dagilim.kisiler.length > 0 && (
                  <select
                    className="girdi girdi-kucuk"
                    value={g.degisiklikler?.[donemAnahtari(g, tarih)] ?? ""}
                    onChange={(e) => gorevDonemSorumlusu(ben, g.id, tarih, e.target.value || null) && bildir(t("bKaydedildi"))}
                    title={t("gvDonemSorumlusu")}
                    aria-label={t("gvDonemSorumlusu")}
                    data-gv-donem
                  >
                    <option value="">{t("gvSiraylaHesap")}</option>
                    {planlamacilar(v).map((k) => (
                      <option key={k.id} value={k.id}>
                        {ad(k)}
                      </option>
                    ))}
                  </select>
                )}
              </span>
              {duzenler && (
                <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setAcik(g)} title={t("duzenle")} aria-label={t("duzenle")} data-gv-duzenle>
                  <Pencil size={15} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {liste.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
      {acik && <GorevPenceresi ben={ben} gorev={acik} kapat={() => setAcik(null)} />}
    </Kart>
  );
}

function dagilimMetni(g: GorevTanimi, adi: (id: string) => string, t: (k: Anahtar, p?: Record<string, string | number>) => string) {
  const adlar = g.dagilim.kisiler.map(adi).join(g.dagilim.tur === "sirali" ? " → " : ", ");
  if (!g.dagilim.kisiler.length) return t("gvSorumluYok");
  return g.dagilim.tur === "sabit" ? `${t("gvSabit")}: ${adlar}` : `${t(g.dagilim.periyot === "hafta" ? "gvSiraliHafta" : "gvSiraliGun")}: ${adlar}`;
}

function EtiketSuzgeci({ etiketler: l, secili, sec }: { etiketler: string[]; secili: string; sec: (e: string) => void }) {
  const { t } = useDil();
  return (
    <div className="cipler ara-alt-2" data-gv-etiketler>
      <button type="button" className={`cip cip-dugme${secili ? "" : " secili"}`} onClick={() => sec("")}>
        {t("hepsi")}
      </button>
      {l.map((e) => (
        <button key={e} type="button" className={`cip cip-dugme${secili === e ? " secili" : ""}`} onClick={() => sec(secili === e ? "" : e)} data-gv-etiket={e}>
          #<bdi>{e}</bdi>
        </button>
      ))}
    </div>
  );
}

function GorevPenceresi({ ben, gorev, kapat }: { ben: Kisi; gorev: GorevTanimi; kapat: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const adi = useGorevAdi();
  const [g, setG] = useState(gorev);
  const [etiketMetni, setEtiketMetni] = useState(gorev.etiketler.join(", "));
  const kayitli = gorevListesi(v).some((x) => x.id === gorev.id);
  const kisiler = g.dagilim.kisiler;
  const setKisiler = (l: string[]) => setG({ ...g, dagilim: { ...g.dagilim, kisiler: l } });
  const tasi = (i: number, yon: -1 | 1) => {
    const l = [...kisiler];
    [l[i], l[i + yon]] = [l[i + yon], l[i]];
    setKisiler(l);
  };
  const kaydet = () => {
    if (gorevKaydet(ben, { ...g, etiketler: etiketAyir(etiketMetni) })) {
      bildir(t("bKaydedildi"));
      kapat();
    }
  };
  return (
    <Pencere baslik={kayitli ? adi(gorev) || t("gvGorevEkle") : t("gvGorevEkle")} kapat={kapat}>
      <div className="form" data-gv-formu>
        {g.tur === "yan" && (
          <div className="satir">
            <label>
              {t("gvGorevAdi")}
              <input dir="auto" value={g.ad} onChange={(e) => setG({ ...g, ad: e.target.value })} data-gv-ad />
            </label>
            <label>
              {t("gvBagliTemel")}
              <select value={g.temel ?? ""} onChange={(e) => setG({ ...g, temel: (e.target.value || undefined) as TemelGorev | undefined })} data-gv-temel>
                <option value="">{t("gvBagimsiz")}</option>
                {TEMEL_GOREVLER.map((x) => (
                  <option key={x} value={x}>
                    {t(TEMEL_GOREV_ADI[x])}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <label>
          {t("gvEtiketler")}
          <input dir="auto" value={etiketMetni} onChange={(e) => setEtiketMetni(e.target.value)} data-gv-etiket-girdi />
        </label>
        <div className="satir">
          <label>
            {t("gvDagilim")}
            <select
              value={g.dagilim.tur}
              onChange={(e) =>
                setG({ ...g, dagilim: e.target.value === "sirali" ? { tur: "sirali", kisiler, periyot: "gun", baslangic: bugun() } : { tur: "sabit", kisiler } })
              }
              data-gv-dagilim-tur
            >
              <option value="sabit">{t("gvSabit")}</option>
              <option value="sirali">{t("gvSirali")}</option>
            </select>
          </label>
          {g.dagilim.tur === "sirali" && (
            <>
              <label>
                {t("gvPeriyot")}
                <select value={g.dagilim.periyot} onChange={(e) => g.dagilim.tur === "sirali" && setG({ ...g, dagilim: { ...g.dagilim, periyot: e.target.value as "gun" | "hafta" } })} data-gv-periyot>
                  <option value="gun">{t("gvHerGun")}</option>
                  <option value="hafta">{t("gvHerHafta")}</option>
                </select>
              </label>
              <label>
                {t("gvIlkSira")}
                <input type="date" value={g.dagilim.baslangic} onChange={(e) => g.dagilim.tur === "sirali" && setG({ ...g, dagilim: { ...g.dagilim, baslangic: e.target.value || bugun() } })} data-gv-baslangic />
                {g.dagilim.periyot === "hafta" && (
                  <small className="sonuk" data-gv-baslangic-hafta>
                    {aralikYaz(haftaBasi(g.dagilim.baslangic), gunEkle(haftaBasi(g.dagilim.baslangic), 6), dil)}
                  </small>
                )}
              </label>
            </>
          )}
        </div>
        <div>
          <div className="alan-etiket">{t("gvKisiler")}</div>
          <ol className="liste gorev-sira" data-gv-kisiler>
            {kisiler.map((id, i) => (
              <li key={id}>
                <Avatar kisi={v.kisiler.find((k) => k.id === id)} boy="kucuk" />
                <span className="ad">{ad(v.kisiler.find((k) => k.id === id))}</span>
                {g.dagilim.tur === "sirali" && (
                  <>
                    <button type="button" className="dugme dugme-sade dugme-ikon" disabled={i === 0} onClick={() => tasi(i, -1)} title={t("yukariTasi")} aria-label={t("yukariTasi")}>
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" className="dugme dugme-sade dugme-ikon" disabled={i === kisiler.length - 1} onClick={() => tasi(i, 1)} title={t("asagiTasi")} aria-label={t("asagiTasi")}>
                      <ArrowDown size={14} />
                    </button>
                  </>
                )}
                <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setKisiler(kisiler.filter((x) => x !== id))} title={t("cikar")} aria-label={t("cikar")}>
                  <X size={14} />
                </button>
              </li>
            ))}
          </ol>
          <select className="ara-ust" value="" onChange={(e) => e.target.value && setKisiler([...kisiler, e.target.value])} aria-label={t("gvKisiEkle")} data-gv-kisi-ekle>
            <option value="">+ {t("gvKisiEkle")}</option>
            {planlamacilar(v)
              .filter((k) => !kisiler.includes(k.id))
              .map((k) => (
                <option key={k.id} value={k.id}>
                  {ad(k)}
                </option>
              ))}
          </select>
        </div>
        {g.dagilim.tur === "sirali" && kisiler.length > 0 && (
          <div>
            <div className="alan-etiket">{t("gvOnumuzdekiDonemler")}</div>
            <ul className="liste gorev-onizleme" data-gv-onizleme>
              {donemOnizlemesi(v, g, bugun()).map((x) => (
                <li key={x.bas} data-gv-onizleme-donem={x.bas} data-gv-onizleme-kisi={x.kisiler.join(",")}>
                  <span className="sonuk">{x.bas === x.bit ? tarihYaz(x.bas, dil, "kisa") : aralikYaz(x.bas, x.bit, dil)}</span>
                  <b>{x.kisiler.map((id) => ad(v.kisiler.find((k) => k.id === id))).join(", ")}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
        <label className="secim">
          <input type="checkbox" checked={!!g.pasif} onChange={(e) => setG({ ...g, pasif: e.target.checked || undefined })} />
          {t("gvPasif")}
        </label>
        <div className="form-alt">
          {kayitli && g.tur === "yan" && (
            <button
              type="button"
              className="dugme dugme-sade dugme-kucuk kotu-yazi"
              onClick={() => confirm(t("silinsinMi")) && gorevSil(ben, g.id) && kapat()}
              data-gv-sil
            >
              <Trash2 size={14} /> {t("sil")}
            </button>
          )}
          <span className="bosluk-esnek" />
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme dugme-kucuk" disabled={g.tur === "yan" && !g.ad.trim()} onClick={kaydet} data-gv-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Pencere>
  );
}

/* --- Tek seferlik işler --- */

function Isler({ ben }: { ben: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const adi = useGorevAdi();
  const [suzgec, setSuzgec] = useState<"acik" | "bitti" | "hepsi">("acik");
  const [etiket, setEtiket] = useState("");
  const [form, setForm] = useState<Is | null>(null);
  const tumu = etiketler(v);
  const liste = isListesi(v)
    .filter((x) => (suzgec === "hepsi" ? true : suzgec === "bitti" ? x.durum === "bitti" : x.durum !== "bitti"))
    .filter((x) => !etiket || x.etiketler.includes(etiket))
    .sort((a, b) => (a.sonTarih ?? "9").localeCompare(b.sonTarih ?? "9") || b.zaman.localeCompare(a.zaman));
  const gorev = (id?: string) => gorevListesi(v).find((g) => g.id === id);
  return (
    <Kart
      baslik={t("gvIsler")}
      ikon={<ClipboardList size={18} />}
      sagUc={
        isEkleyebilir(ben) && (
          <button
            type="button"
            className="dugme dugme-ikincil dugme-kucuk"
            onClick={() => setForm({ id: kimlik("is"), baslik: "", etiketler: etiket ? [etiket] : [], kisiler: [ben.id], durum: "yapilacak", olusturan: ben.id, zaman: "" })}
            data-is-ekle
          >
            <Plus size={14} /> {t("gvIsEkle")}
          </button>
        )
      }
    >
      <div className="dugmeler ara-alt-2">
        {(["acik", "bitti", "hepsi"] as const).map((s) => (
          <button key={s} type="button" className={`cip cip-dugme${suzgec === s ? " secili" : ""}`} onClick={() => setSuzgec(s)} data-is-suzgec={s}>
            {t(s === "acik" ? "gvAcik" : s === "bitti" ? "gvBitti" : "hepsi")}
          </button>
        ))}
      </div>
      {tumu.length > 0 && <EtiketSuzgeci etiketler={tumu} secili={etiket} sec={setEtiket} />}
      {form && <IsFormu ben={ben} is={form} kapat={() => setForm(null)} />}
      <ul className="liste is-listesi">
        {liste.map((x) => {
          const g = gorev(x.gorevId);
          const gecikti = x.sonTarih && x.durum !== "bitti" && x.sonTarih < bugun();
          return (
            <li key={x.id} data-is={x.id} className={x.durum === "bitti" ? "soluk" : ""}>
              <div className="ad">
                <b dir="auto">{x.baslik}</b>
                {x.aciklama && (
                  <div className="sonuk" dir="auto">
                    {x.aciklama}
                  </div>
                )}
                <div className="cipler ara-ust">
                  {x.birimler?.map((b) => (
                    <span key={b} className="cip cip-kucuk cip-vurgu" data-is-ekip={b}>
                      <Users size={12} /> {birimAdi(b)}
                    </span>
                  ))}
                  {g && (
                    <span className="cip cip-kucuk">
                      <bdi>{adi(g)}</bdi>
                    </span>
                  )}
                  {x.etiketler.map((e) => (
                    <span key={e} className="cip cip-kucuk">
                      #<bdi>{e}</bdi>
                    </span>
                  ))}
                  {x.sonTarih && <Rozet ton={gecikti ? "kotu" : undefined}>{tarihYaz(x.sonTarih, dil, "kisa")}</Rozet>}
                  {x.kisiler.map((id) => (
                    <span key={id} className="cip cip-kucuk">
                      {ad(v.kisiler.find((k) => k.id === id))}
                    </span>
                  ))}
                </div>
              </div>
              {isDegistirebilir(ben, x) ? (
                <>
                  <select className="girdi girdi-kucuk" value={x.durum} onChange={(e) => isDurumu(ben, x.id, e.target.value as IsDurumu)} aria-label={t("durum")} data-is-durum>
                    {IS_DURUMLARI.map((s) => (
                      <option key={s} value={s}>
                        {t(IS_DURUM_ADI[s])}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setForm(x)} title={t("duzenle")} aria-label={t("duzenle")}>
                    <Pencil size={15} />
                  </button>
                  <button type="button" className="dugme dugme-sade dugme-ikon kotu-yazi" onClick={() => confirm(t("silinsinMi")) && isSil(ben, x.id)} title={t("sil")} aria-label={t("sil")}>
                    <Trash2 size={15} />
                  </button>
                </>
              ) : (
                <Rozet>{t(IS_DURUM_ADI[x.durum])}</Rozet>
              )}
            </li>
          );
        })}
      </ul>
      {liste.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
    </Kart>
  );
}

function IsFormu({ ben, is, kapat }: { ben: Kisi; is: Is; kapat: () => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const adi = useGorevAdi();
  const [f, setF] = useState(is);
  const [etiketMetni, setEtiketMetni] = useState(is.etiketler.join(", "));
  const kaydet = () => {
    if (isKaydet(ben, { id: f.id, baslik: f.baslik, etiketler: etiketAyir(etiketMetni), gorevId: f.gorevId || undefined, kisiler: f.kisiler, birimler: f.birimler, aciklama: f.aciklama, sonTarih: f.sonTarih || undefined, durum: f.durum })) {
      bildir(t("bKaydedildi"));
      kapat();
    }
  };
  return (
    <div className="form form-kutu ara-alt-2" data-is-formu>
      <label>
        {t("gvIsBasligi")}
        <input dir="auto" value={f.baslik} onChange={(e) => setF({ ...f, baslik: e.target.value })} data-is-baslik />
      </label>
      <label>
        {t("gvAciklama")}
        <textarea dir="auto" rows={2} value={f.aciklama ?? ""} onChange={(e) => setF({ ...f, aciklama: e.target.value })} data-is-aciklama />
      </label>
      <div className="satir">
        <label>
          {t("gvGorev")}
          <select value={f.gorevId ?? ""} onChange={(e) => setF({ ...f, gorevId: e.target.value || undefined })} data-is-gorev>
            <option value="">{t("gvBagimsiz")}</option>
            {gorevListesi(v)
              .filter((g) => !g.pasif)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {adi(g)}
                </option>
              ))}
          </select>
        </label>
        <label>
          {t("gvSonTarih")}
          <input type="date" value={f.sonTarih ?? ""} onChange={(e) => setF({ ...f, sonTarih: e.target.value || undefined })} data-is-son />
        </label>
      </div>
      <label>
        {t("gvEtiketler")}
        <input dir="auto" value={etiketMetni} onChange={(e) => setEtiketMetni(e.target.value)} data-is-etiket />
      </label>
      <div>
        <div className="alan-etiket">{t("gvKisiler")}</div>
        <div className="cipler">
          {f.kisiler.map((id) => (
            <span key={id} className="cip">
              {ad(v.kisiler.find((k) => k.id === id))}
              <button type="button" onClick={() => setF({ ...f, kisiler: f.kisiler.filter((x) => x !== id) })} aria-label={t("cikar")} title={t("cikar")}>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
        <select className="ara-ust" value="" onChange={(e) => e.target.value && setF({ ...f, kisiler: [...f.kisiler, e.target.value] })} aria-label={t("gvKisiEkle")} data-is-kisi-ekle>
          <option value="">+ {t("gvKisiEkle")}</option>
          {planlamacilar(v)
            .filter((k) => !f.kisiler.includes(k.id))
            .map((k) => (
              <option key={k.id} value={k.id}>
                {ad(k)}
              </option>
            ))}
        </select>
      </div>
      <div className="form-alt">
        <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
          {t("iptal")}
        </button>
        <button type="button" className="dugme dugme-kucuk" disabled={!f.baslik.trim()} onClick={kaydet} data-is-kaydet>
          {t("kaydet")}
        </button>
      </div>
    </div>
  );
}
